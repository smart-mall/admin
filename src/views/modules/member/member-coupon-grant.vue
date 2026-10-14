<template>
  <el-dialog
    title="送券"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="560px"
  >
    <el-form label-width="90px">
      <el-form-item label="会员">
        <span class="grant__member">{{ memberText }}</span>
      </el-form-item>
      <el-form-item label="优惠券">
        <el-select
          v-model="couponId"
          filterable
          clearable
          placeholder="选择要发放的券"
          :loading="couponLoading"
          style="width: 100%"
        >
          <el-option
            v-for="item in couponOptions"
            :key="item.couponId"
            :label="item.couponName"
            :value="item.couponId"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <div v-if="loadFailed" class="grant__hint">
      候选加载失败，请关掉弹窗重新打开；若一直失败，先确认 coupon 服务是否正常。
    </div>
    <div v-else-if="!couponLoading && couponOptions.length === 0" class="grant__hint">
      该会员现在没有可发放的券：券可能未发布、不在领取窗口内、已经领完、他等级不够，
      或者他已经达到每人限领张数。要发给他，得先改券的状态或限领设置。
    </div>
    <div v-else-if="!couponLoading" class="grant__hint">
      候选已按这名会员筛过，列出来的都是他现在真能领的券。确定后仍以实际发出张数为准。
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!couponId"
        @click="submit"
      >确定发放</el-button>
    </span>
  </el-dialog>
</template>

<script>
/**
 * 会员列表里的「送券」弹窗：会员是固定的，所以这里选的是券。
 *
 * <p>与券列表页的「定向发券」是同一个发券接口，只是方向相反 —— 那边选会员、这边选券。
 *
 * <p>候选**不由本页拼**：调 {@code /coupon/coupon/grantable/{memberId}} 让服务端按这名会员算，
 * 那边复用的是券中心同一套可领判定（发布状态、领取窗口、余量、等级门槛），并额外排掉已达限领的券。
 * 前端只渲染结果，不做任何"这个人能不能领"的推断 —— 推断必然与后台闸门分叉。
 */
export default {
  data () {
    return {
      visible: false,
      submitting: false,
      member: null,
      couponId: null,
      couponOptions: [],
      couponLoading: false,
      loadFailed: false
    }
  },
  computed: {
    // 昵称与账号可能同名，两个都显示才认得出是哪个人
    memberText () {
      if (!this.member) {
        return ''
      }
      const nickname = this.member.nickname || ''
      const username = this.member.username || ''
      if (nickname && nickname !== username) {
        return `${nickname}（${username}）`
      }
      return `${username}（id=${this.member.id}）`
    }
  },
  methods: {
    init (member) {
      this.member = member
      this.couponId = null
      this.couponOptions = []
      this.loadFailed = false
      this.visible = true
      this.loadCandidates()
    },
    // 拉该会员的可发放券候选
    loadCandidates () {
      this.couponLoading = true
      this.$http({
        url: this.$http.adornUrl(`/coupon/coupon/grantable/${this.member.id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.couponLoading = false
        if (!data || data.code !== 0) {
          this.couponOptions = []
          this.loadFailed = true
          this.$message.error(data ? data.msg : '可发放的券查询失败')
          return
        }
        this.couponOptions = data.data || []
      })
    },
    submit () {
      this.submitting = true
      this.$http({
        url: this.$http.adornUrl(`/coupon/coupon/${this.couponId}/grant`),
        method: 'post',
        data: this.$http.adornData({
          memberIds: [this.member.id]
        })
      }).then(({ data }) => {
        this.submitting = false
        if (!data || data.code !== 0) {
          this.$message.error(data ? data.msg : '发券失败')
          return
        }
        const granted = data.data || 0
        if (granted === 0) {
          // 候选是"查的那一刻"算出来的：这段时间里券被领完、或这名会员刚在别处领到上限，都会落到这里
          this.$message.warning('没有发出：这张券刚被领完，或该会员刚达到每人限领张数，请重新打开弹窗刷新候选')
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
.grant__member {
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
