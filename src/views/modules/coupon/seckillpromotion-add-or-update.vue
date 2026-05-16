<template>
  <el-dialog
    :title="!dataForm.id ? '新增' : '修改'"
    :close-on-click-modal="false"
    :visible.sync="visible"
  >
    <el-form
      :model="dataForm"
      :rules="dataRule"
      ref="dataForm"
      @keyup.enter.native="dataFormSubmit()"
      label-width="120px"
    >
      <el-form-item label="活动标题" prop="title">
        <el-input v-model="dataForm.title" placeholder="活动标题"></el-input>
      </el-form-item>
      <el-form-item label="生效日期" prop="timeRange">
        <el-date-picker
          v-model="dataForm.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd HH:mm:ss"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="上下线状态" prop="status">
        <el-select v-model="dataForm.status" placeholder="上下线状态">
          <el-option :value="1" label="上线"></el-option>
          <el-option :value="0" label="下线"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      dataForm: {
        id: 0,
        title: '',
        startTime: '',
        endTime: '',
        status: '',
        createTime: '',
        timeRange: []
      },
      dataRule: {
        title: [
          { required: true, message: '活动标题不能为空', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '上下线状态不能为空', trigger: 'blur' }
        ],
        timeRange: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value || value.length !== 2 || !value[0] || !value[1]) {
                callback(new Error('请选择领取日期范围'))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      }
    }
  },
  methods: {
    init (id) {
      this.dataForm.id = id || 0
      this.visible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].resetFields()
        if (this.dataForm.id) {
          this.$http({
            url: this.$http.adornUrl(
              `/coupon/seckillpromotion/info/${this.dataForm.id}`
            ),
            method: 'get',
            params: this.$http.adornParams()
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm.title = data.seckillPromotion.title
              this.dataForm.startTime = data.seckillPromotion.startTime
              this.dataForm.endTime = data.seckillPromotion.endTime
              this.dataForm.status = data.seckillPromotion.status
              this.dataForm.createTime = data.seckillPromotion.createTime
              this.dataForm.timeRange = [
                this.dataForm.startTime,
                this.dataForm.endTime
              ]
            }
          })
        }
      })
    },
    // 表单提交
    dataFormSubmit () {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          this.$http({
            url: this.$http.adornUrl(
              `/coupon/seckillpromotion/${
                !this.dataForm.id ? 'save' : 'update'
              }`
            ),
            method: 'post',
            data: this.$http.adornData({
              id: this.dataForm.id || undefined,
              title: this.dataForm.title,
              startTime: this.dataForm.timeRange[0],
              endTime: this.dataForm.timeRange[1],
              status: this.dataForm.status,
              userId: this.$store.state.user.id
            })
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message({
                message: '操作成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                  this.visible = false
                  this.$emit('refreshDataList')
                }
              })
            } else {
              this.$message.error(data.msg)
            }
          })
        }
      })
    }
  }
}
</script>
