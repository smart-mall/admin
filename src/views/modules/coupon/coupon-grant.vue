<template>
  <el-dialog
    title="定向发券"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="680px"
  >
    <el-form label-width="100px">
      <el-form-item label="优惠券">
        <span class="grant__coupon">{{ couponName }}</span>
      </el-form-item>
      <el-form-item label="发券对象">
        <member-picker v-model="selection"></member-picker>
      </el-form-item>
    </el-form>

    <div class="grant__hint">
      与会员主动领取共用同一套闸门：不在领取窗口内、券已领完，或目标会员已达到每人限领张数的，
      会被逐个跳过，不阻断其余会员。已发出的部分不会因为个别失败而回滚。
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="selection.length === 0"
        @click="submit"
      >确定发放</el-button>
    </span>
  </el-dialog>
</template>

<script>
import MemberPicker from '@/components/memberPicker/index'

/**
 * 定向发券弹窗：选券详情里的「发券」按钮打开，把一张券发给选中的会员。
 *
 * 弹窗只负责收集会员与提交，是否真的发得出去由后台判定，结果以实际发出张数返回 ——
 * 前端不做"这个会员能不能领"的预判，那会与后台的守卫判断分叉。
 */
export default {
  components: { MemberPicker },
  data () {
    return {
      visible: false,
      submitting: false,
      couponId: 0,
      couponName: '',
      selection: []
    }
  },
  methods: {
    init (coupon) {
      this.couponId = coupon.id
      this.couponName = coupon.couponName
      this.selection = []
      this.visible = true
    },
    submit () {
      this.submitting = true
      this.$http({
        url: this.$http.adornUrl(`/coupon/coupon/${this.couponId}/grant`),
        method: 'post',
        data: this.$http.adornData({
          memberIds: this.selection.map(item => item.id)
        })
      }).then(({ data }) => {
        this.submitting = false
        if (!data || data.code !== 0) {
          this.$message.error(data ? data.msg : '发券失败')
          return
        }
        const granted = data.data || 0
        if (granted === 0) {
          this.$message.warning('没有发出任何券：目标会员都已达到限领张数，或这张券已经领完')
          return
        }
        this.$message.success(`已发放 ${granted} 张`)
        this.visible = false
        this.$emit('refreshDataList')
      })
    }
  }
}
</script>

<style scoped>
.grant__coupon {
  font-weight: 600;
  color: #303133;
}

.grant__hint {
  padding: 10px 12px;
  border-radius: 4px;
  background: #f4f4f5;
  font-size: 12px;
  line-height: 20px;
  color: #909399;
}
</style>
