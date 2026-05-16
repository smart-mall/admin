<template>
  <div>
    <el-upload
      action=""
      list-type="picture-card"
      :multiple="true"
      :file-list="fileList"
      :before-upload="beforeUpload"
      :http-request="customUpload"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :on-error="handleError"
      :limit="maxCount"
      :on-exceed="handleExceed"
    >
      <i class="el-icon-plus"></i>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt/>
    </el-dialog>
  </div>
</template>

<script>
import {putFile, getFilePath} from './policy'
import {getUUID} from '@/utils'
import axios from 'axios'

export default {
  name: 'multiUpload',
  props: {
    // 图片属性数组
    value: {
      type: Array,
      default: () => []
    },
    // 最大上传图片数量
    maxCount: {
      type: Number,
      default: 30
    }
  },
  data () {
    return {
      fileList: [],
      dialogVisible: false,
      dialogImageUrl: null,
      uploadQueue: new Map() // 存储每个文件的上传参数 { fileId: { objectName, uploadParams } }
    }
  },
  computed: {
    // 将父组件的 value 转换为 el-upload 需要的格式
    computedFileList () {
      if (!this.value || !Array.isArray(this.value)) {
        return []
      }
      return this.value.map(url => ({url}))
    }
  },
  watch: {
    value: {
      handler (newVal) {
        // 同步外部传入的图片列表
        if (newVal && Array.isArray(newVal)) {
          this.fileList = newVal.map(url => ({url}))
        } else {
          this.fileList = []
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 通知父组件更新
    emitInput (fileList) {
      const value = fileList.map(item => item.url).filter(url => url)
      this.$emit('input', value)
    },

    // 移除图片
    handleRemove (file, fileList) {
      this.emitInput(fileList)
    },

    // 预览图片
    handlePreview (file) {
      this.dialogVisible = true
      this.dialogImageUrl = file.url
    },

    // 上传前验证和获取凭证
    async beforeUpload (file) {
      // 验证文件类型
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isValidType) {
        this.$message.error('只能上传jpg/png文件!')
        return false
      }

      // 验证文件大小（不超过10MB）
      const isValidSize = file.size / 1024 / 1024 < 10
      if (!isValidSize) {
        this.$message.error('文件大小不能超过10MB!')
        return false
      }

      // 生成唯一标识
      const fileId = this.getFileId(file)
      const filename = `${getUUID()}_${file.name}`
      const date = new Date().toLocaleDateString().replace(/\//g, '-')
      const objectName = `${date}/${filename}`

      try {
        // 获取 MinIO 上传凭证
        const data = await putFile('gulimall', objectName)

        if (data && data.code === 0) {
          // 存储上传参数供 customUpload 使用
          this.uploadQueue.set(fileId, {
            objectName,
            uploadParams: data,
            filename
          })
          return true
        } else {
          this.$message.error(`获取上传参数失败: ${data.msg || '未知错误'}`)
          return false
        }
      } catch (err) {
        this.$message.error('获取上传参数出错')
        console.error('上传参数获取失败:', err)
        return false
      }
    },

    // 自定义上传到 MinIO
    async customUpload (params) {
      const file = params.file
      const fileId = this.getFileId(file)
      const uploadInfo = this.uploadQueue.get(fileId)

      if (!uploadInfo) {
        params.onError(new Error('未找到上传参数'))
        return
      }

      try {
        const {url} = uploadInfo.uploadParams
        if (!url) {
          throw new Error('上传URL不存在')
        }

        // 上传文件到 MinIO
        const headers = {
          'Content-Type': file.type
        }
        await axios.put(url, file, {headers})

        // 获取文件访问路径
        const filePathData = await getFilePath('gulimall', uploadInfo.objectName)

        if (filePathData && filePathData.code === 0) {
          const uploadedFile = {
            name: uploadInfo.filename,
            url: filePathData.url
          }

          // 添加到文件列表
          this.fileList.push(uploadedFile)

          // 通知父组件
          this.emitInput(this.fileList)

          // 上传成功
          params.onSuccess()

          this.$message.success(`${file.name} 上传成功`)

          // 清理队列中的参数
          this.uploadQueue.delete(fileId)
        } else {
          this.$message.error(`获取文件路径失败: ${filePathData.msg || '未知错误'}`)
          params.onError(new Error('获取文件路径失败'))
        }
      } catch (err) {
        console.error('文件上传失败:', err)
        this.$message.error(`文件上传失败: ${err.message || '上传出错'}`)
        params.onError(err)
      }
    },

    // 根据文件对象生成唯一标识（用于在队列中查找）
    getFileId (file) {
      // 使用文件名称 + 大小 + 最后修改时间 作为标识
      return `${file.name}_${file.size}_${file.lastModified}`
    },

    // 超出数量限制
    handleExceed (files, fileList) {
      this.$message({
        message: `最多只能上传 ${this.maxCount} 张图片`,
        type: 'warning',
        duration: 1000
      })
    },
    handleError (err, file, fileList) {
      console.error('上传失败:', err, file)
      this.$message.error(`文件上传失败: ${err.message || '上传出错'}`)
    }
  }
}
</script>

<style scoped>
.el-upload--picture-card {
  width: 100px;
  height: 100px;
  line-height: 100px;
}
</style>
