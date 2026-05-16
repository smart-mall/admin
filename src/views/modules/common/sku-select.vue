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
    value: {
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
        return this.value
      },
      set (val) {
        this.$emit('input', val)
        const selectedItem = this.skus.find(item => item.id === val)
        if (selectedItem) {
          this.$emit('selected-item', {
            id: selectedItem.id,
            name: selectedItem.name
          })
        }
      }
    }
  },
  mounted () {
    this.getSkus()
  },
  methods: {
    getSkus () {
      this.$http({
        url: this.$http.adornUrl('/product/skuinfo/getSkuSelect'),
        method: 'get',
        params: this.$http.adornParams({})
      }).then(({data}) => {
        this.skus = data.data || []
      }).catch(() => {
        this.skus = []
      })
    }
  }
}
</script>
