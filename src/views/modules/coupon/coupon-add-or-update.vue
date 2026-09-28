<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="760px"
  >
    <el-alert
      v-if="locked"
      type="warning"
      :closable="false"
      show-icon
      title="已有会员领取，关键字段已锁定"
      description="领取记录只保存券的 ID、不保存券面权益，改模板会静默改掉已经领出去的券。如需调整面额或有效期，请停发后新建一张。"
    ></el-alert>

    <el-form
      :model="dataForm"
      :rules="dataRule"
      ref="dataForm"
      class="coupon-form"
      @keyup.enter.native="dataFormSubmit()"
      label-width="120px"
    >
      <!-- 页签不要加 lazy：懒渲染会让隐藏页签里的必填项不注册到表单，点确定会静默跳过校验 -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form-item label="券名" prop="couponName">
            <el-input v-model="dataForm.couponName" placeholder="展示给会员的名字" maxlength="100"></el-input>
          </el-form-item>
          <el-form-item label="券图" prop="couponImg">
            <single-upload v-model="dataForm.couponImg"></single-upload>
            <div class="form-hint">可不传，不传时前端用统一模板渲染</div>
          </el-form-item>
          <el-form-item label="备注" prop="note">
            <el-input v-model="dataForm.note" placeholder="仅后台可见" maxlength="200"></el-input>
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane :label="ruleTabLabel" name="rule">
          <el-form-item label="券面金额" prop="amount">
            <el-input-number :min="0.01" :precision="2" v-model="dataForm.amount" :disabled="locked"></el-input-number>
            <span class="form-suffix">元，抵扣商品金额，不抵运费</span>
          </el-form-item>
          <el-form-item label="使用门槛" prop="minPoint">
            <el-input-number :min="0" :precision="2" v-model="dataForm.minPoint" :disabled="locked"></el-input-number>
            <span class="form-suffix">元，商品总额达到才可用；填 0 表示无门槛</span>
          </el-form-item>
          <el-form-item label="每人限领" prop="perLimit">
            <el-input-number :min="1" v-model="dataForm.perLimit" :disabled="locked"></el-input-number>
            <span class="form-suffix">张</span>
          </el-form-item>
          <el-form-item label="范围类型" prop="useType">
            <el-radio-group v-model="dataForm.useType" :disabled="locked" @change="handleScopeChange">
              <el-radio :label="0">全场通用</el-radio>
              <el-radio :label="1">指定分类</el-radio>
              <el-radio :label="2">指定商品</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="dataForm.useType === 1" label="指定分类">
            <category-tree-select v-model="categorySelection"></category-tree-select>
          </el-form-item>
          <el-form-item v-if="dataForm.useType === 2" label="指定商品">
            <spu-picker v-model="spuSelection"></spu-picker>
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane :label="grantTabLabel" name="grant">
          <el-form-item label="券类型" prop="couponType">
            <el-select v-model="dataForm.couponType" :disabled="locked">
              <el-option :value="0" label="全场赠券（券中心主动领取）"></el-option>
              <el-option :value="1" label="会员赠券（后台定向发放）"></el-option>
              <el-option :value="2" label="购物赠券（下单后返券）" disabled></el-option>
              <el-option :value="3" label="注册赠券（注册时自动发放）" disabled></el-option>
            </el-select>
            <div class="form-hint">后两种依赖下单返券与注册埋点，尚未实现，暂不可选</div>
          </el-form-item>
          <el-form-item label="领取时间" prop="enableTimeRange">
            <el-date-picker
              v-model="dataForm.enableTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              :picker-options="pickerOptions"
              :disabled="locked"
            ></el-date-picker>
            <div class="form-hint">会员能点「领取」的时间段</div>
          </el-form-item>
          <el-form-item label="有效期" prop="useTimeRange">
            <el-date-picker
              v-model="dataForm.useTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              :picker-options="pickerOptions"
              :disabled="locked"
            ></el-date-picker>
            <div class="form-hint">领到手的券可以用来抵扣的时间段，结束时间不能早于领取结束时间</div>
          </el-form-item>
          <el-form-item label="发行总量" prop="publishCount">
            <el-input-number :min="1" v-model="dataForm.publishCount" :disabled="locked"></el-input-number>
            <span class="form-suffix">张，也是可领取的上限</span>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import SingleUpload from '@/components/upload/singleUpload'
import CategoryTreeSelect from '@/components/categoryTreeSelect/index'
import SpuPicker from '@/components/spuPicker/index'

/**
 * 优惠券的新增与修改弹窗。
 *
 * 表单按业务分三个页签，不复用数据库列的顺序；提交时把两个时间范围拆成四个时间字段，
 * 并把适用范围的选择映射成后端的关联明细。
 *
 * 计数类字段（发布状态、已领数、已核销数）不在表单里，也不参与提交 ——
 * 它们各有自己的维护链路，由后台按当前值决定，前端传什么都不采纳。
 */
export default {
  components: { SingleUpload, CategoryTreeSelect, SpuPicker },
  data () {
    return {
      visible: false,
      /** 当前页签，取值 basic / rule / grant。 */
      activeTab: 'basic',
      /** 已有会员领取时为真：面额、门槛、范围、时间与限领整体置灰。 */
      locked: false,
      /** 已选分类，形状 { id, name }，提交时映射成 categoryRelations。 */
      categorySelection: [],
      /** 已选商品，形状 { id, name }，提交时映射成 spuRelations。 */
      spuSelection: [],
      /** 加载时库里的领取开始时间，用于判断本次是否真的改动了它。 */
      originalEnableStart: '',
      /**
       * 日期选择器的可选范围。
       *
       * 只禁到昨天为止：今天之内的具体时刻交给校验器判，disabledDate 拿不到"当前时刻"这个粒度。
       */
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
        }
      },
      /**
       * 字段所属页签，校验失败时靠它跳到出错字段所在的那一页。
       *
       * 没有它的话，错误提示会留在别的页签里，用户点确定看起来就像"没反应"。
       */
      propTabMap: {
        couponName: 'basic',
        couponImg: 'basic',
        note: 'basic',
        amount: 'rule',
        minPoint: 'rule',
        perLimit: 'rule',
        useType: 'rule',
        couponType: 'grant',
        enableTimeRange: 'grant',
        useTimeRange: 'grant',
        publishCount: 'grant'
      },
      dataForm: {
        id: 0,
        couponType: 0,
        couponImg: '',
        couponName: '',
        amount: 10,
        perLimit: 1,
        minPoint: 0,
        useType: 0,
        note: '',
        publishCount: 100,
        enableTimeRange: [],
        useTimeRange: []
      },
      dataRule: {
        couponName: [{ required: true, message: '优惠券名称不能为空', trigger: 'blur' }],
        couponType: [{ required: true, message: '请选择券类型', trigger: 'change' }],
        amount: [{ required: true, message: '券面金额不能为空', trigger: 'blur' }],
        minPoint: [{ required: true, message: '使用门槛不能为空', trigger: 'blur' }],
        perLimit: [{ required: true, message: '每人限领张数不能为空', trigger: 'blur' }],
        publishCount: [{ required: true, message: '发行总量不能为空', trigger: 'blur' }],
        useType: [{ required: true, message: '请选择适用范围', trigger: 'change' }],
        enableTimeRange: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value || value.length !== 2 || !value[0] || !value[1]) {
                callback(new Error('请选择领取时间'))
                return
              }
              // 编辑一张领取窗口已经开始的券时，只要没动这个时间就放行，
              // 否则改个券名都会被一个已经过去的时刻挡住
              if (this.dataForm.id && value[0] === this.originalEnableStart) {
                callback()
                return
              }
              // 值是 yyyy-MM-dd HH:mm:ss，取前 16 位到分钟，字符串比较与时间比较同序
              if (value[0].slice(0, 16) < this.currentMinute()) {
                callback(new Error('领取开始时间不能早于当前时间'))
                return
              }
              callback()
            },
            trigger: 'change'
          }
        ],
        useTimeRange: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value || value.length !== 2 || !value[0] || !value[1]) {
                callback(new Error('请选择有效期'))
                return
              }
              // 两个值都是 yyyy-MM-dd HH:mm:ss，按字符串比较与按时间比较同序
              const enableEnd = this.dataForm.enableTimeRange[1]
              if (enableEnd && value[1] < enableEnd) {
                callback(new Error('有效期结束时间不能早于领取结束时间'))
                return
              }
              callback()
            },
            trigger: 'change'
          }
        ]
      }
    }
  },
  computed: {
    dialogTitle () {
      if (!this.dataForm.id) {
        return '新增优惠券'
      }
      return this.locked ? '修改优惠券（关键字段已锁定）' : '修改优惠券'
    },
    // 锁定时在页签标题上直接标出来，免得运营点进去才发现整页都是灰的
    ruleTabLabel () {
      return this.locked ? '优惠规则（已锁定）' : '优惠规则'
    },
    grantTabLabel () {
      return this.locked ? '发放设置（已锁定）' : '发放设置'
    }
  },
  methods: {
    init (id) {
      this.dataForm.id = id || 0
      this.activeTab = 'basic'
      this.locked = false
      this.originalEnableStart = ''
      this.categorySelection = []
      this.spuSelection = []
      this.visible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].resetFields()
        if (this.dataForm.id) {
          this.loadDetail()
        }
      })
    },
    loadDetail () {
      this.$http({
        url: this.$http.adornUrl(`/coupon/coupon/info/${this.dataForm.id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (!data || data.code !== 0 || !data.data) {
          return
        }
        const coupon = data.data
        this.dataForm.couponType = coupon.couponType
        this.dataForm.couponImg = coupon.couponImg
        this.dataForm.couponName = coupon.couponName
        this.dataForm.amount = coupon.amount
        this.dataForm.perLimit = coupon.perLimit
        this.dataForm.minPoint = coupon.minPoint
        this.dataForm.useType = coupon.useType
        this.dataForm.note = coupon.note
        this.dataForm.publishCount = coupon.publishCount
        this.dataForm.enableTimeRange = [coupon.enableStartTime, coupon.enableEndTime]
        this.originalEnableStart = coupon.enableStartTime
        this.dataForm.useTimeRange = [coupon.startTime, coupon.endTime]
        this.categorySelection = (coupon.categoryRelations || []).map(
          item => ({ id: item.categoryId, name: item.categoryName })
        )
        this.spuSelection = (coupon.spuRelations || []).map(
          item => ({ id: item.spuId, name: item.spuName })
        )
        this.locked = (coupon.receiveCount || 0) > 0
      })
    },
    // 切换范围类型时清掉另一侧的选择，避免两套关联同时提交
    handleScopeChange () {
      if (this.dataForm.useType !== 1) {
        this.categorySelection = []
      }
      if (this.dataForm.useType !== 2) {
        this.spuSelection = []
      }
    },
    /**
     * 跳到第一个校验失败字段所在的页签。
     *
     * @param invalidFields el-form 校验回调给出的字段名到错误信息的映射
     */
    jumpToErrorTab (invalidFields) {
      const firstProp = Object.keys(invalidFields || {})[0]
      const tab = firstProp ? this.propTabMap[firstProp] : null
      if (tab) {
        this.activeTab = tab
      }
    },
    /**
     * 当前时间，截到分钟，格式与日期选择器一致。
     *
     * 与后端同一口径：提交的时间只精确到秒，直接和带毫秒的当前时间比，
     * 会把"就选此刻"判成过去。
     *
     * @return yyyy-MM-dd HH:mm
     */
    currentMinute () {
      const now = new Date()
      const pad = num => (num < 10 ? '0' + num : '' + num)
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      return `${date} ${time}`
    },
    buildPayload () {
      return {
        id: this.dataForm.id || undefined,
        couponType: this.dataForm.couponType,
        couponImg: this.dataForm.couponImg,
        couponName: this.dataForm.couponName,
        amount: this.dataForm.amount,
        perLimit: this.dataForm.perLimit,
        minPoint: this.dataForm.minPoint,
        useType: this.dataForm.useType,
        note: this.dataForm.note,
        publishCount: this.dataForm.publishCount,
        startTime: this.dataForm.useTimeRange[0],
        endTime: this.dataForm.useTimeRange[1],
        enableStartTime: this.dataForm.enableTimeRange[0],
        enableEndTime: this.dataForm.enableTimeRange[1],
        categoryRelations: this.dataForm.useType === 1
          ? this.categorySelection.map(item => ({ categoryId: item.id, categoryName: item.name }))
          : [],
        spuRelations: this.dataForm.useType === 2
          ? this.spuSelection.map(item => ({ spuId: item.id, spuName: item.name }))
          : []
      }
    },
    dataFormSubmit () {
      this.$refs['dataForm'].validate((valid, invalidFields) => {
        if (!valid) {
          this.jumpToErrorTab(invalidFields)
          return
        }
        this.$http({
          url: this.$http.adornUrl(
            `/coupon/coupon/${!this.dataForm.id ? 'save' : 'update'}`
          ),
          method: 'post',
          data: this.$http.adornData(this.buildPayload())
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
      })
    }
  }
}
</script>

<style scoped>
/* 固定高度：三个页签内容长短不一，不固定的话切换时弹窗会上下跳 */
.coupon-form {
  min-height: 360px;
}

.form-hint {
  font-size: 12px;
  line-height: 18px;
  color: #909399;
}

.form-suffix {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
