<template>
  <div>
    <el-checkbox-group v-model="workOptions" @change="handleChange">
      <el-checkbox label="0">无优惠 - 成长积分赠送</el-checkbox>
      <el-checkbox label="1">无优惠 - 购物积分赠送</el-checkbox>
      <el-checkbox label="2">有优惠 - 成长积分赠送</el-checkbox>
      <el-checkbox label="3">有优惠 - 购物积分赠送</el-checkbox>
    </el-checkbox-group>
    <div style="color: #909399; font-size: 12px; margin-top: 5px;">
      提示：勾选表示赠送积分，不勾选表示不赠送（当前值：{{ decimalValue }} = 二进制 {{ binaryValue }}）
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkStatusSelect',
  props: {
    // 父组件传入的 work 值，十进制数字，如 15 (二进制 1111)
    value: {
      type: Number,
      default: 0
    }
  },
  computed: {
    // 获取十进制值
    decimalValue () {
      return this.value || 0
    },
    // 获取二进制字符串（4位）
    binaryValue () {
      return this.decimalValue.toString(2).padStart(4, '0')
    },
    workOptions: {
      get () {
        if (!this.value && this.value !== 0) return []

        // 将十进制转换为二进制字符串
        const binaryStr = this.value.toString(2).padStart(4, '0')

        // 转换为数组，用于复选框绑定
        const arr = []
        for (let i = 0; i < binaryStr.length; i++) {
          if (binaryStr[i] === '1') {
            arr.push(i.toString())
          }
        }
        return arr
      },
      set (val) {
        // 将选中的复选框索引转换为二进制字符串
        let binaryStr = '0000'
        if (val && val.length > 0) {
          val.forEach(item => {
            const index = parseInt(item)
            binaryStr = binaryStr.substring(0, index) + '1' + binaryStr.substring(index + 1)
          })
        }

        // 将二进制字符串转换为十进制数字
        const decimalValue = parseInt(binaryStr, 2)

        // 输出十进制数字给父组件
        this.$emit('input', decimalValue)
        this.$emit('change', decimalValue)
      }
    }
  },
  methods: {
    handleChange (val) {
      // 复选框变化时的回调
    }
  }
}
</script>
