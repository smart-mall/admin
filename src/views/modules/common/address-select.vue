<template>
  <div>
    <el-cascader
      placeholder="请选择地区"
      v-model="selectedPath"
      :options="areaTree"
      :props="{ value: 'code', label: 'name', children: 'children' }"
      filterable
      clearable
      @change="handleChange"
    />
  </div>
</template>
<script>
export default {
  name: 'AreaSelect',
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      areaTree: [],
      selectedPath: []
    }
  },
  watch: {
    value: {
      handler (newVal) {
        if (!newVal) {
          this.selectedPath = []
        } else if (this.areaTree.length) {
          this.selectedPath = this.findPathByCode(this.areaTree, newVal)
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.getAreaTree()
  },
  methods: {
    getAreaTree () {
      this.$http({
        url: this.$http.adornUrl('/thirdParty/address/tree'),
        method: 'get',
        params: this.$http.adornParams({})
      })
        .then(({data}) => {
          this.areaTree = data.data || []
          if (this.value) {
            this.selectedPath = this.findPathByCode(this.areaTree, this.value)
          }
        })
        .catch(() => {
          this.areaTree = []
        })
    },
    handleChange (path) {
      var lastCode = path && path.length ? path[path.length - 1] : ''
      this.$emit('input', lastCode)

      var fullPathName = this.getFullPathName(path)
      if (fullPathName) {
        this.$emit('selected-item', {
          code: lastCode,
          name: fullPathName
        })
      }
    },
    getFullPathName (path) {
      if (!path || path.length === 0) return ''
      var names = []
      var current = {children: this.areaTree}
      for (var i = 0; i < path.length; i++) {
        var code = path[i]
        var found = null
        if (current.children) {
          for (var j = 0; j < current.children.length; j++) {
            if (current.children[j].code === code) {
              found = current.children[j]
              break
            }
          }
        }
        if (!found) return ''
        names.push(found.name)
        current = found
      }
      return names.join('/')
    },
    // 修复后的查找方法
    findPathByCode (tree, targetCode, currentPath = []) {
      for (var i = 0; i < tree.length; i++) {
        var node = tree[i]
        var newPath = currentPath.concat([node.code])
        if (node.code === targetCode) {
          return newPath
        }
        if (node.children && node.children.length) {
          var result = this.findPathByCode(node.children, targetCode, newPath)
          // 关键修改：只有 result 有内容（非空数组）才返回
          if (result && result.length) {
            return result
          }
        }
      }
      return []
    }
  }
}
</script>
