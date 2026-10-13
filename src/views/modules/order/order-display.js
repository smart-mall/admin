// 订单页的展示口径：枚举文案、状态标签颜色与格式化函数。
// 取值都来自服务端字段，这里只决定"怎么显示"；状态文案不在这里维护，用接口给的 statusText。

const DASH = '—'

// 状态 → 标签颜色。颜色是纯展示，与文案分开：文案只有服务端一处
const STATUS_TAG = {
  0: 'warning',
  1: '',
  2: 'info',
  3: 'success',
  4: 'info',
  5: 'warning',
  6: 'info'
}

// 取值见 order.constant.PayConstant 与 oms_order 表的列注释
const PAY_TYPE_TEXT = {
  1: '支付宝',
  2: '微信',
  3: '银联',
  4: '货到付款',
  9: '测试支付'
}

const SOURCE_TYPE_TEXT = {
  0: 'PC 订单',
  1: 'APP 订单'
}

const BILL_TYPE_TEXT = {
  0: '不开发票',
  1: '电子发票',
  2: '纸质发票'
}

export function statusTagType (status) {
  return STATUS_TAG[status] || ''
}

export function payTypeText (payType) {
  return PAY_TYPE_TEXT[payType] || textOrDash(payType)
}

export function sourceTypeText (sourceType) {
  return SOURCE_TYPE_TEXT[sourceType] || textOrDash(sourceType)
}

export function billTypeText (billType) {
  return BILL_TYPE_TEXT[billType] || textOrDash(billType)
}

// 金额一律两位小数：后端给的是 BigDecimal，直接渲染会出现 3.0000 这种列宽跳动的写法
export function amountText (value) {
  if (value === null || value === undefined || value === '') {
    return DASH
  }
  return Number(value).toFixed(2)
}

// 时间由后端按 yyyy-MM-dd HH:mm:ss 序列化，前端原样显示，不做日期解析
export function timeText (value) {
  return value || DASH
}

export function textOrDash (value) {
  if (value === null || value === undefined || value === '') {
    return DASH
  }
  return value
}
