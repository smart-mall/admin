<template>
  <div class="multi-upload">
    <el-upload
      action=""
      list-type="picture-card"
      :multiple="true"
      :file-list="fileList"
      :accept="acceptTypes"
      :limit="maxCount"
      :show-file-list="showFileList"
      :before-upload="beforeUpload"
      :http-request="customUpload"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :on-exceed="handleExceed">
      <i class="el-icon-plus"></i>
      <div slot="tip" class="el-upload__tip">{{ tipText }}</div>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible" append-to-body>
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
  </div>
</template>

<script>
import { accept, tip, validateFile, uploadFile } from './upload'

export default {
  name: 'multiUpload',
  props: {
    // 图片地址数组
    value: {
      type: Array,
      default: () => []
    },
    maxCount: {
      type: Number,
      default: 30
    },
    // 关掉 el-upload 自带列表后，调用方自己渲染缩略图（商品图集要额外排序，见 spuadd）
    showFileList: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      acceptTypes: accept,
      tipText: tip,
      dialogVisible: false,
      dialogImageUrl: ''
    }
  },
  computed: {
    // 和 singleUpload 一样，列表由 value 推导，不做第二份状态。
    // 改造前有一个 computedFileList 但模板根本没用（用的是 data 里的 fileList），
    // 另有一个 uploadQueue 用 文件名_大小_修改时间 做 key —— 同一张图传两次会串。
    fileList () {
      return (this.value || []).map(url => ({ url }))
    }
  },
  methods: {
    currentUrls () {
      return this.value || []
    },
    beforeUpload (file) {
      const error = validateFile(file)
      if (error) {
        this.$message.error(error)
        return false
      }
      return true
    },
    // 逐张上传：一次选择里 el-upload 会对每个文件各调一次 http-request，每次发一个文件。
    // 后端的 /thirdParty/file/uploadBatch 是给别的调用方用的，这里不用它 ——
    // 逐张能拿到每个文件独立的失败原因，也不会因为一张图不合法就把整批退回来。
    customUpload (params) {
      return uploadFile(params.file).then(
        data => {
          this.$emit('input', this.currentUrls().concat(data.url))
          // 额外抛出原始文件信息：图集要落库 img_name，用户选的文件名只有这里拿得到
          this.$emit('uploaded', data)
          this.$message.success(`${params.file.name} 上传成功`)
          return data
        },
        err => {
          this.$message.error(`${params.file.name} 上传失败：${err.message || '未知错误'}`)
          throw err
        }
      )
    },
    // 同 singleUpload：只改表单值，不删对象
    handleRemove (file) {
      const url = file.url
      this.$emit('input', this.currentUrls().filter(item => item !== url))
    },
    handlePreview (file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    handleExceed () {
      this.$message.warning(`最多只能上传 ${this.maxCount} 张图片`)
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
