<template>
  <el-dialog
    title="订单详情"
    :visible.sync="visible"
    :close-on-click-modal="false"
    width="70%"
    top="6vh">
    <div v-loading="loading" class="od-body">
      <div v-for="group in groups" :key="group.title" class="od-group">
        <div class="od-group-title">{{ group.title }}</div>
        <div>
          <el-tag
            v-for="tag in group.tags"
            :key="tag.label"
            :type="tag.type || ''"
            class="od-tag">
            {{ tag.label }}：{{ tag.value }}
          </el-tag>
        </div>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
  import { amountText, billTypeText, payTypeText, sourceTypeText, statusTagType, textOrDash, timeText } from './order-display'

  export default {
    data () {
      return {
        visible: false,
        loading: false,
        // 分组后的标签，由 init 拉到详情后组装
        groups: []
      }
    },
    methods: {
      init (orderSn) {
        this.visible = true
        this.loading = true
        this.groups = []
        this.$http({
          url: this.$http.adornUrl(`/order/order/detail/${orderSn}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          this.loading = false
          if (data && data.code === 0) {
            this.groups = this.buildGroups(data.data)
          } else {
            this.$message.error(data.msg)
          }
        })
      },
      // 按分组把整单摊成标签：字段顺序按运营看单的顺序排，不跟表结构走
      buildGroups (order) {
        var groups = [
          {
            title: '订单信息',
            tags: [
              { label: '订单号', value: order.orderSn },
              { label: '状态', value: order.statusText, type: statusTagType(order.status) },
              { label: '支付方式', value: payTypeText(order.payType) },
              { label: '订单来源', value: sourceTypeText(order.sourceType) },
              { label: '会员', value: order.memberUsername },
              { label: '会员 ID', value: order.memberId },
              { label: '订单 ID', value: order.id },
              { label: '优惠券 ID', value: order.couponId },
              { label: '确认收货', value: order.confirmStatus === 1 ? '已确认' : '未确认' },
              { label: '自动确认天数', value: order.autoConfirmDay }
            ]
          },
          {
            title: '金额构成',
            tags: [
              { label: '订单总额', value: amountText(order.totalAmount) },
              { label: '应付总额', value: amountText(order.payAmount) },
              { label: '运费金额', value: amountText(order.freightAmount) },
              { label: '促销优化', value: amountText(order.promotionAmount) },
              { label: '优惠券抵扣', value: amountText(order.couponAmount) },
              { label: '积分抵扣', value: amountText(order.integrationAmount) },
              { label: '后台折扣', value: amountText(order.discountAmount) },
              { label: '使用积分', value: order.useIntegration },
              { label: '可得积分', value: order.integration },
              { label: '可得成长值', value: order.growth }
            ]
          },
          {
            title: '收货信息',
            tags: [
              { label: '收货人', value: order.receiverName },
              { label: '收货人电话', value: order.receiverPhone },
              { label: '邮编', value: order.receiverPostCode },
              { label: '省份', value: order.receiverProvince },
              { label: '城市', value: order.receiverCity },
              { label: '区县', value: order.receiverRegion },
              { label: '详细地址', value: order.receiverDetailAddress }
            ]
          },
          {
            title: '物流信息',
            tags: [
              { label: '物流公司', value: order.deliveryCompany },
              { label: '物流单号', value: order.deliverySn }
            ]
          },
          {
            title: '发票信息',
            tags: [
              { label: '发票类型', value: billTypeText(order.billType) },
              { label: '发票抬头', value: order.billHeader },
              { label: '发票内容', value: order.billContent },
              { label: '收票人电话', value: order.billReceiverPhone },
              { label: '收票人邮箱', value: order.billReceiverEmail }
            ]
          },
          {
            title: '时间',
            tags: [
              { label: '下单时间', value: timeText(order.createTime) },
              { label: '支付时间', value: timeText(order.paymentTime) },
              { label: '发货时间', value: timeText(order.deliveryTime) },
              { label: '确认收货时间', value: timeText(order.receiveTime) },
              { label: '评价时间', value: timeText(order.commentTime) },
              { label: '修改时间', value: timeText(order.modifyTime) }
            ]
          },
          {
            title: '订单备注',
            tags: [
              { label: '备注', value: order.note }
            ]
          }
        ]

        // 空字段不铺：发票与备注在多数订单上是空的，全列出来就是一面短横线
        groups.forEach(group => {
          group.tags = group.tags.filter(tag => tag.value !== null && tag.value !== undefined && tag.value !== '')
        })

        // 商品明细单独拼：条数随订单变化，顺序即下单顺序
        var items = order.orderItemEntityList || []
        if (items.length > 0) {
          groups.push({
            title: '商品明细',
            tags: items.map(item => ({
              label: textOrDash(item.skuName),
              value: `×${item.skuQuantity}，单价 ${amountText(item.skuPrice)}，实付 ${amountText(item.realAmount)}`
            }))
          })
        }

        return groups
      }
    }
  }
</script>

<style scoped>
  .od-body {
    max-height: 62vh;
    overflow-y: auto;
  }
  .od-group {
    margin-bottom: 16px;
  }
  .od-group-title {
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }
  .od-tag {
    margin: 0 8px 8px 0;
  }
</style>
