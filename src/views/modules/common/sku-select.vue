<template>
  <div>
    <el-select placeholder="请选择SKU" v-model="selectedSkuId" filterable clearable>
      <el-option
        v-for="item in skus"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  props: {
    value: {  // 接收 v-model 传入的值
      type: [String, Number],
      default: ''
    },
    spuId: {  // 可选：根据 spuId 筛选 SKU
      type: [String, Number],
      default: ''
    }
  },
  data () {
    return {
      skus: []
    }
  },
  computed: {
    selectedSkuId: {
      get () {
        return this.value  // 从 props 获取
      },
      set (val) {
        this.$emit('input', val)  // 触发 v-model 更新
        this.$emit('change', val)
      }
    }
  },
  watch: {
    // 监听 spuId 变化，重新加载 SKU 列表
    spuId: {
      handler(newVal) {
        if (newVal) {
          this.getSkus()
        } else {
          this.skus = []
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.getSkus()
  },
  methods: {
    getSkus () {
      console.log('getSkus')
      let url = '/product/skuinfo/getSkuSelect'
      // 如果有 spuId，可以传递参数筛选
      const params = this.spuId ? { spuId: this.spuId } : {}

      this.$http({
        url: this.$http.adornUrl(url),
        method: 'get',
        params: this.$http.adornParams(params)
      }).then(({data}) => {
        this.skus = data.data || []
      }).catch(() => {
        this.skus = []
      })
    }
  }
}
</script>
