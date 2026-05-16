<template>
  <div>
    <el-select placeholder="请选择" v-model="selectedSpuId" filterable clearable>
      <el-option
        v-for="item in spus"
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
    }
  },
  data () {
    return {
      spus: []
    }
  },
  computed: {
    selectedSpuId: {
      get () {
        return this.value  // 从 props 获取
      },
      set (val) {
        this.$emit('input', val)  // 触发 v-model 更新
        this.$emit('change', val)
      }
    }
  },
  mounted () {
    this.getSpus()
  },
  methods: {
    getSpus () {
      console.log('getSpus')
      this.$http({
        url: this.$http.adornUrl('/product/spuinfo/getSpuSelect'),
        method: 'get'
      }).then(({data}) => {
        this.spus = data.data
      })
    }
  }
}
</script>
