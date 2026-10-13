<template>
  <el-dialog
    title="订单详情"
    :visible.sync="visible"
    :close-on-click-modal="false"
    width="960px"
    top="5vh">
    <div v-loading="loading" class="od-body">
      <!-- 页签不用 lazy：详情一次请求就拿到了全部数据，懒渲染只会让切页签时内容晚一拍 -->
      <el-tabs v-model="activeTab" class="od-tabs">
        <el-tab-pane label="订单信息" name="basic">
          <el-form label-width="90px" class="od-form">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="订单号">{{ textOrDash(order.orderSn) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="订单状态">
                  <el-tag :type="statusTagType(order.status)" size="small">{{ textOrDash(order.statusText) }}</el-tag>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="支付方式">{{ payTypeText(order.payType) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="订单来源">{{ sourceTypeText(order.sourceType) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="会员">{{ textOrDash(order.memberUsername) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="会员 ID">{{ textOrDash(order.memberId) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="订单 ID">{{ textOrDash(order.id) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="优惠券 ID">{{ textOrDash(order.couponId) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="确认收货">{{ order.confirmStatus === 1 ? '已确认' : '未确认' }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="删除标记">{{ order.deleteStatus === 1 ? '会员已删除' : '正常' }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="自动确认天数">{{ textOrDash(order.autoConfirmDay) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="下单时间">{{ timeText(order.createTime) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="支付时间">{{ timeText(order.paymentTime) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="发货时间">{{ timeText(order.deliveryTime) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="确认收货时间">{{ timeText(order.receiveTime) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="评价时间">{{ timeText(order.commentTime) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="修改时间">{{ timeText(order.modifyTime) }}</el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="订单备注">{{ textOrDash(order.note) }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="金额构成" name="amount">
          <el-form label-width="90px" class="od-form">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="订单总额">{{ amountText(order.totalAmount) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="应付总额">
                  <span class="od-amount">{{ amountText(order.payAmount) }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="运费金额">{{ amountText(order.freightAmount) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="促销优化">{{ amountText(order.promotionAmount) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="优惠券抵扣">{{ amountText(order.couponAmount) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="积分抵扣">{{ amountText(order.integrationAmount) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="后台折扣">{{ amountText(order.discountAmount) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="使用积分">{{ textOrDash(order.useIntegration) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="可得积分">{{ textOrDash(order.integration) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="可得成长值">{{ textOrDash(order.growth) }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="收货与发票" name="receiver">
          <el-form label-width="90px" class="od-form">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="收货人">{{ textOrDash(order.receiverName) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="收货人电话">{{ textOrDash(order.receiverPhone) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="邮编">{{ textOrDash(order.receiverPostCode) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="省份">{{ textOrDash(order.receiverProvince) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="城市">{{ textOrDash(order.receiverCity) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="区县">{{ textOrDash(order.receiverRegion) }}</el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="详细地址">{{ textOrDash(order.receiverDetailAddress) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="物流公司">{{ textOrDash(order.deliveryCompany) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="物流单号">{{ textOrDash(order.deliverySn) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="发票类型">{{ billTypeText(order.billType) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="发票抬头">{{ textOrDash(order.billHeader) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="发票内容">{{ textOrDash(order.billContent) }}</el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="收票人电话">{{ textOrDash(order.billReceiverPhone) }}</el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="收票人邮箱">{{ textOrDash(order.billReceiverEmail) }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="商品明细" name="items">
          <el-table
            v-if="items.length > 0"
            :data="items"
            class="od-table"
            border
            stripe
            size="mini"
            max-height="260">
            <el-table-column
              prop="skuId"
              header-align="center"
              align="center"
              width="100"
              label="SKU ID">
            </el-table-column>
            <el-table-column
              header-align="left"
              label="商品名称">
              <template slot-scope="scope">{{ textOrDash(scope.row.skuName) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="110"
              label="单价">
              <template slot-scope="scope">{{ amountText(scope.row.skuPrice) }}</template>
            </el-table-column>
            <el-table-column
              prop="skuQuantity"
              header-align="center"
              align="center"
              width="80"
              label="数量">
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="110"
              label="实付金额">
              <template slot-scope="scope">{{ amountText(scope.row.realAmount) }}</template>
            </el-table-column>
          </el-table>
          <div v-else class="od-empty">暂无商品明细</div>
        </el-tab-pane>

        <el-tab-pane label="操作流水" name="history">
          <el-table
            v-if="histories.length > 0"
            :data="histories"
            class="od-table"
            border
            stripe
            size="mini"
            max-height="260">
            <el-table-column
              header-align="center"
              align="center"
              width="160"
              label="操作时间">
              <template slot-scope="scope">{{ timeText(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="140"
              label="操作人">
              <template slot-scope="scope">{{ textOrDash(scope.row.operateMan) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="110"
              label="状态">
              <template slot-scope="scope">
                <el-tag :type="statusTagType(scope.row.orderStatus)" size="small">{{ textOrDash(scope.row.statusText) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              header-align="left"
              label="说明">
              <template slot-scope="scope">{{ textOrDash(scope.row.note) }}</template>
            </el-table-column>
          </el-table>
          <div v-else class="od-empty">暂无操作记录</div>
        </el-tab-pane>

        <el-tab-pane label="支付信息" name="payment">
          <!-- 交易内容与回调原文都太长，放进展开行；这张表不设 max-height——
               展开行加在表体内部，限高会把回调原文压进内部滚动条 -->
          <el-table
            v-if="payments.length > 0"
            :data="payments"
            class="od-table"
            border
            stripe
            size="mini">
            <el-table-column type="expand">
              <template slot-scope="scope">
                <div class="od-detail">
                  <div>交易内容：{{ textOrDash(scope.row.subject) }}</div>
                  <div>回调内容：</div>
                  <pre>{{ textOrDash(scope.row.callbackContent) }}</pre>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              min-width="170"
              label="平台交易号">
              <template slot-scope="scope">{{ textOrDash(scope.row.alipayTradeNo) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="100"
              label="支付金额">
              <template slot-scope="scope">{{ amountText(scope.row.totalAmount) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="110"
              label="支付状态">
              <template slot-scope="scope">{{ textOrDash(scope.row.paymentStatus) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="140"
              label="创建时间">
              <template slot-scope="scope">{{ timeText(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="140"
              label="确认时间">
              <template slot-scope="scope">{{ timeText(scope.row.confirmTime) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="140"
              label="回调时间">
              <template slot-scope="scope">{{ timeText(scope.row.callbackTime) }}</template>
            </el-table-column>
          </el-table>
          <div v-else class="od-empty">暂无支付流水</div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
  import { amountText, billTypeText, payTypeText, sourceTypeText, statusTagType, textOrDash, timeText } from './order-display'

  /**
   * 订单详情弹窗：按业务分六个页签，商品明细、操作流水与支付信息用表格铺开。
   *
   * 只读，不带任何写入口：发货、关单、改备注在订单列表的行内按钮上。
   */
  export default {
    data () {
      return {
        visible: false,
        loading: false,
        /** 当前页签，取值 basic / amount / receiver / items / history / payment。 */
        activeTab: 'basic',
        /** 详情接口返回的整单，关联的三张表都在里面，没拉到之前是空对象。 */
        order: {}
      }
    },
    computed: {
      items () {
        return this.order.orderItemEntityList || []
      },
      histories () {
        return this.order.operateHistoryList || []
      },
      payments () {
        return this.order.paymentInfoList || []
      }
    },
    methods: {
      // 展示口径函数要挂到实例上：模板表达式在 this 上求值，模块作用域的 import 看不见
      amountText,
      billTypeText,
      payTypeText,
      sourceTypeText,
      statusTagType,
      textOrDash,
      timeText,
      init (orderSn) {
        this.visible = true
        this.loading = true
        this.activeTab = 'basic'
        this.order = {}
        this.$http({
          url: this.$http.adornUrl(`/order/order/detail/${orderSn}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          this.loading = false
          if (data && data.code === 0) {
            this.order = data.data || {}
          } else {
            this.$message.error(data.msg)
          }
        })
      }
    }
  }
</script>

<!-- 穿透选择器用 /deep/：项目装的 vue-loader 13.3.0 只认 >>> 与它的别名 /deep/ -->
<style scoped>
  /* 固定高度：六个页签内容长短不一，不固定的话切换时弹窗会上下跳 */
  .od-body {
    min-height: 320px;
    max-height: 62vh;
    overflow-y: auto;
  }
  /* 弹窗头部与内容之间补一条分隔线，否则标题和页签黏在一起 */
  /deep/ .el-dialog__header {
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 14px;
  }
  /* 页签自带的下划线是 2px 深灰，压成 1px 浅灰更轻 */
  .od-tabs /deep/ .el-tabs__nav-wrap::after {
    height: 1px;
    background-color: #ebeef5;
  }
  .od-tabs /deep/ .el-tabs__header {
    margin-bottom: 14px;
  }
  /* 只读展示没有输入框，行距与标签行高一起压紧，一屏能看更多字段 */
  .od-form /deep/ .el-form-item {
    margin-bottom: 6px;
  }
  .od-form /deep/ .el-form-item__label {
    line-height: 22px;
    color: #909399;
  }
  .od-form /deep/ .el-form-item__content {
    line-height: 22px;
    color: #303133;
  }
  /* 金额里的重点值：加粗，与灰色标签拉开层次 */
  .od-amount {
    font-weight: 600;
  }
  /* 斑马纹由 el-table 的 stripe 提供，这里只把表头压成浅灰 */
  .od-table /deep/ th {
    background-color: #fafafa;
    color: #606266;
  }
  .od-empty {
    padding: 56px 0;
    text-align: center;
    font-size: 13px;
    color: #909399;
  }
  .od-detail {
    padding: 0 8px 4px;
    font-size: 12px;
    line-height: 20px;
    color: #606266;
  }
  .od-detail pre {
    margin: 4px 0 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: Consolas, Monaco, monospace;
    color: #303133;
  }
</style>
