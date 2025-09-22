<script>
export default {
  name: 'RenrenFastVueCategory',
  data () {
    // 这里存放数据
    return {
      menus: [],
      expandedKey: [], // 默认展开的数据
      defaultProps: {
        children: 'children',
        label: 'name'
      }

    }
  },
  methods: {
    getMenus () {
      this.$http({
        url: this.$http.adornUrl('/product/category/list/tree'),
        methods: 'get'
      }).then(({data}) => {
        this.menus = data.tree
      })
    },

    handleNodeClick (data, node, component) {
      // 发射事件
      this.$emit('node-click', data, node, component)
    }
  },
  created () {
    this.getMenus()
  }
}
</script>

<template>
  <el-tree
    ref="menuTree"
    :data="menus"
    :props="defaultProps"
    node-key="catId"
    @node-click="handleNodeClick"
  >

  </el-tree>
</template>

<style scoped lang="scss">

</style>
