<template>
  <div class="single-upload">
    <el-upload
      action=""
      list-type="picture"
      :multiple="false"
      :show-file-list="!!value"
      :file-list="fileList"
      :accept="acceptTypes"
      :before-upload="beforeUpload"
      :http-request="customUpload"
      :on-remove="handleRemove">
      <el-button size="small" type="primary">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">{{ tipText }}</div>
    </el-upload>
  </div>
</template>

<script>
import { accept, tip, validateFile, uploadFile } from './upload'

export default {
  name: 'singleUpload',
  props: {
    // 图片地址。父表单直接 v-model 到 dataForm.logo / icon 这类字段
    value: String
  },
  data () {
    return {
      acceptTypes: accept,
      tipText: tip
    }
  },
  computed: {
    // 列表由 value 推导，不额外维护一份状态。
    // 改造前这里是 data 里的 fileList: []，而且没有从 value 初始化过 ——
    // 所以编辑一条已有记录时预览区永远是空的，看不到当前的 logo。
    fileList () {
      return this.value ? [{ name: '', url: this.value }] : []
    }
  },
  methods: {
    // 同步返回布尔值即可，这一步不需要发请求了。
    // 改造前它是 async 的，唯一原因是要 await 预签名接口。
    beforeUpload (file) {
      const error = validateFile(file)
      if (error) {
        this.$message.error(error)
        return false
      }
      return true
    },
    // 必须返回 Promise：el-upload 的 post() 里是
    //   const req = this.httpRequest(options); if (req && req.then) req.then(onSuccess, onError)
    // 返回 thenable 才会走成功/失败回调，否则这个文件的状态永远停在 uploading。
    customUpload (params) {
      return uploadFile(params.file).then(
        data => {
          this.$emit('input', data.url)
          this.$message.success('上传成功')
          return data
        },
        err => {
          this.$message.error(err.message || '上传失败')
          throw err
        }
      )
    },
    // 只清空表单值，不删对象。
    // 用户可能只是想换一张图然后取消整个表单 —— 这时候删了文件，数据库里那条记录
    // 还指着它。真正的对象清理是保存时后端做的（BrandServiceImpl.updateDetail 比较
    // 新旧值后删旧的），前端不该抢这个决定。
    handleRemove () {
      this.$emit('input', '')
    }
  }
}
</script>
