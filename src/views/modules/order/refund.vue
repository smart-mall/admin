<template>
  <div class="mod-config">
    <!-- 上半：仅退款的申请单。待审核的要在这里处理 -->
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getApplyList()">
      <el-form-item label="申请状态">
        <el-select v-model="dataForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="item in statusOptions"
            :key="item.code"
            :label="item.text"
            :value="String(item.code)">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="dataForm.key" placeholder="订单号 / 会员名" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getApplyList()">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="applyList" border v-loading="applyLoading" style="width: 100%">
      <el-table-column prop="orderSn" header-align="center" align="center" width="180" label="订单号"></el-table-column>
      <el-table-column prop="memberUsername" header-align="center" align="center" width="130" label="会员"></el-table-column>
      <el-table-column prop="returnAmount" header-align="center" align="center" width="110" label="退款金额"></el-table-column>
      <el-table-column header-align="center" align="center" width="100" label="状态">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ textOrDash(scope.row.statusText) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" width="160" label="申请时间"></el-table-column>
      <el-table-column header-align="center" align="center" label="申请说明">
        <template slot-scope="scope">{{ textOrDash(scope.row.description) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="170" label="处理">
        <template slot-scope="scope">
          <div v-if="scope.row.status === 3">{{ textOrDash(scope.row.handleNote) }}</div>
          <div v-else>{{ textOrDash(scope.row.handleMan) }} {{ textOrDash(scope.row.handleTime) }}</div>
        </template>
      </el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="140" label="操作">
        <template slot-scope="scope">
          <template v-if="scope.row.status === 0">
            <el-button type="text" size="small" @click="approveHandle(scope.row)">通过</el-button>
            <el-button type="text" size="small" @click="rejectHandle(scope.row)">拒绝</el-button>
          </template>
          <span v-else>—</span>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="applySizeChangeHandle"
      @current-change="applyCurrentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>

    <!-- 下半：退款流水。它是资金台账，只读 —— 能手工造一条流水，账面上就会多出一笔从没发生过的退款 -->
    <h3 class="refund-flow__title">退款流水</h3>
    <el-table :data="flowList" border v-loading="flowLoading" style="width: 100%">
      <el-table-column prop="orderReturnId" header-align="center" align="center" width="140" label="售后申请"></el-table-column>
      <el-table-column prop="refund" header-align="center" align="center" width="120" label="退款金额"></el-table-column>
      <el-table-column prop="refundSn" header-align="center" align="center" label="平台退款单号"></el-table-column>
      <el-table-column header-align="center" align="center" width="120" label="退款状态">
        <template slot-scope="scope">{{ refundStatusText(scope.row.refundStatus) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="140" label="退款渠道">
        <template slot-scope="scope">{{ refundChannelText(scope.row.refundChannel) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="flowSizeChangeHandle"
      @current-change="flowCurrentChangeHandle"
      :current-page="flowPageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="flowPageSize"
      :total="flowTotalPage"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        dataForm: {
          status: '',
          key: ''
        },
        statusOptions: [],
        applyList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        applyLoading: false,
        flowList: [],
        flowPageIndex: 1,
        flowPageSize: 10,
        flowTotalPage: 0,
        flowLoading: false
      }
    },
    activated () {
      this.getStatusOptions()
      this.getApplyList()
      this.getFlowList()
    },
    methods: {
      // 状态选项由服务端下发：文案只在 AfterSaleStatusEnum 里维护一份，前端不抄
      getStatusOptions () {
        this.$http({
          url: this.$http.adornUrl('/order/orderreturnapply/status-options'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.statusOptions = data.data || []
          }
        })
      },
      // 仅退款的申请：type 固定为 0（退货那条在同级的"退货单处理"页看）
      getApplyList () {
        this.applyLoading = true
        this.$http({
          url: this.$http.adornUrl('/order/orderreturnapply/list'),
          method: 'get',
          params: this.$http.adornParams({
            'page': this.pageIndex,
            'limit': this.pageSize,
            'type': 0,
            'status': this.dataForm.status,
            'key': this.dataForm.key
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.applyList = data.data.rows
            this.totalPage = data.data.total
          } else {
            this.applyList = []
            this.totalPage = 0
          }
          this.applyLoading = false
        })
      },
      getFlowList () {
        this.flowLoading = true
        this.$http({
          url: this.$http.adornUrl('/order/refundinfo/list'),
          method: 'get',
          params: this.$http.adornParams({
            'page': this.flowPageIndex,
            'limit': this.flowPageSize
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.flowList = data.data.rows
            this.flowTotalPage = data.data.total
          } else {
            this.flowList = []
            this.flowTotalPage = 0
          }
          this.flowLoading = false
        })
      },
      // 通过：向模拟支付平台发起退款，拿到"资金已变动"的应答后作废订单、解锁库存、退回券与积分
      approveHandle (row) {
        this.$confirm(`确认同意订单 [${row.orderSn}] 的整单退款？通过后订单会作废，库存、优惠券与积分一并退回。`, '审核退款申请', {
          confirmButtonText: '退款并作废订单',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl('/order/orderreturnapply/audit'),
            method: 'post',
            data: this.$http.adornData({ id: row.id, approve: true })
          }).then(({data}) => {
            this.handleResult(data)
          })
        }).catch(() => {})
      },
      // 拒绝：必须写理由，会员要靠这句话决定能不能补齐材料再申请一次
      rejectHandle (row) {
        this.$prompt('请写明驳回理由，会员会看到这句话', '驳回退款申请', {
          confirmButtonText: '驳回',
          cancelButtonText: '取消',
          inputValidator: value => (value && value.trim() ? true : '驳回理由不能为空')
        }).then(({value}) => {
          this.$http({
            url: this.$http.adornUrl('/order/orderreturnapply/audit'),
            method: 'post',
            data: this.$http.adornData({ id: row.id, approve: false, handleNote: value })
          }).then(({data}) => {
            this.handleResult(data)
          })
        }).catch(() => {})
      },
      handleResult (data) {
        if (data && data.code === 0) {
          this.$message({
            message: '操作成功',
            type: 'success',
            duration: 1500,
            onClose: () => {
              this.getApplyList()
              this.getFlowList()
            }
          })
        } else {
          this.$message.error(data.msg)
        }
      },
      applySizeChangeHandle (val) {
        this.pageSize = val
        this.pageIndex = 1
        this.getApplyList()
      },
      applyCurrentChangeHandle (val) {
        this.pageIndex = val
        this.getApplyList()
      },
      flowSizeChangeHandle (val) {
        this.flowPageSize = val
        this.flowPageIndex = 1
        this.getFlowList()
      },
      flowCurrentChangeHandle (val) {
        this.flowPageIndex = val
        this.getFlowList()
      },
      // 这两列的取值域写在 oms_refund_info 的建表注释里：状态只有 1（已退款 —— 本项目没有真实退款通道，
      // 平台的应答就是最终结果），渠道与订单的支付方式同一套取值
      refundStatusText (refundStatus) {
        return refundStatus === 1 ? '已退款' : this.textOrDash(refundStatus)
      },
      refundChannelText (refundChannel) {
        const channels = { 1: '支付宝', 2: '微信', 3: '银联', 4: '汇款', 9: '测试支付' }
        return channels[refundChannel] || this.textOrDash(refundChannel)
      },
      textOrDash (value) {
        return value === null || value === undefined || value === '' ? '—' : value
      },
      statusTagType (status) {
        if (status === 0) return 'warning'
        if (status === 2) return 'success'
        return 'info'
      }
    }
  }
</script>

<style scoped>
  .refund-flow__title {
    margin: 24px 0 12px;
    font-size: 15px;
    font-weight: 600;
  }
</style>
