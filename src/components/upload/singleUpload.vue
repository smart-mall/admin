<template>
  <div>
    <el-upload
      action=""
      list-type="picture"
      :multiple="false"
      :show-file-list="showFileList"
      :file-list="fileList"
      :before-upload="beforeUpload"
      :http-request="customUpload"
      :on-success="handleSuccess"
      :on-error="handleError">
      <el-button size="small" type="primary">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过10MB</div>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible">
      <!-- 增加安全检查，避免访问未定义的属性 -->
      <img width="100%" :src="fileList.length > 0 ? fileList[0].url : ''" alt="预览图片">
    </el-dialog>
  </div>
</template>
<script>
import {putFile, getFilePath} from './policy'
import {getUUID} from '@/utils'
import axios from 'axios'

export default {
  name: 'singleUpload',
  props: {
    value: String
  },
  computed: {
    showFileList () {
      return !!this.value
    }
  },
  data () {
    return {
      fileList: [],
      filename: null,
      objectName: null,
      dialogVisible: false,
      uploadParams: null // 存储上传参数
    }
  },
  methods: {
    async beforeUpload (file) {
      // 验证文件类型
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isJPG) {
        this.$message.error('只能上传jpg/png文件!')
        return false
      }
      if (!isLt10M) {
        this.$message.error('文件大小不能超过10MB!')
        return false
      }

      try {
        this.filename = `${getUUID()}_${file.name}`
        // 获取时间 格式2020-01-01
        const date = new Date().toLocaleDateString().replace(/\//g, '-')
        this.objectName = `${date}/${this.filename}`
        const data = await putFile('text', this.objectName)

        if (data && data.code === 0) { // 增加data存在性检查
          this.uploadParams = data
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
    async customUpload (params) {
      if (!this.uploadParams) {
        params.onError(new Error('未获取到上传参数'))
        return
      }

      try {
        const {url} = this.uploadParams
        if (!url) {
          throw new Error('上传URL不存在')
        }

        // 直接使用文件对象，而不是FormData
        const file = params.file

        // 设置请求头，Content-Type设置为文件类型，或者不设置（浏览器会自动设置）
        const headers = {
          'Content-Type': file.type
        }

        // 注意：这里我们不再使用FormData，所以直接发送file
        await axios.put(url, file, { headers })

        // 上传成功后，获取文件路径
        const filePathData = await getFilePath('text', this.objectName)
        if (filePathData && filePathData.code === 0) {
          this.fileList = [{
            name: this.filename,
            url: filePathData.url
          }]
          // 触发成功回调
          params.onSuccess()
        } else {
          this.$message.error(`获取文件路径失败: ${filePathData.msg || '未知错误'}`)
          params.onError(new Error('获取文件路径失败'))
        }
      } catch (err) {
        console.error('文件上传失败:', err)
        params.onError(err)
      }
    },
    handleSuccess () {
      this.$message.success('文件上传成功')
      // 通知父组件上传成功，传递完整URL
      this.$emit('input', this.fileList[0].url || '')
    },
    handleError (err) {
      this.$message.error(`文件上传失败: ${err.message || '未知错误'}`)
    }
  }
}
</script>
<style>
</style>
