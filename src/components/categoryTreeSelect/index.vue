<template>
  <div class="picker">
    <el-button size="small" @click="open">{{ value.length ? '重新选择分类' : '选择分类' }}</el-button>
    <span v-if="value.length" class="picker__count">已选 {{ value.length }} 个分类</span>

    <div v-if="value.length" class="picker__chips">
      <el-tag
        v-for="item in value"
        :key="item.id"
        closable
        size="small"
        @close="remove(item.id)"
      >{{ item.name }}</el-tag>
    </div>

    <el-dialog
      title="选择分类"
      :visible.sync="visible"
      :close-on-click-modal="false"
      append-to-body
      width="560px"
    >
      <el-tree
        ref="tree"
        :data="tree"
        :props="treeProps"
        node-key="catId"
        show-checkbox
        default-expand-all
        empty-text="暂无分类数据"
      ></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
/**
 * 分类多选器，值形状统一为 { id, name }，与商品、会员选择器一致。
 *
 * 勾选不隔离父子（el-tree 默认的级联）：选中一个上级分类会连带选中它下面所有子分类。
 * 这符合"这个分类下的商品都能用"的语义；若改成隔离勾选，只选上级时下级商品匹配不上，
 * 运营会以为设置生效了其实没生效。
 *
 * 组件自身只读接口、不改任何数据；值由父组件通过 v-model 持有。
 */
export default {
  name: 'CategoryTreeSelect',
  props: {
    /** 已选分类，元素为 { id, name }。 */
    value: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      visible: false,
      tree: [],
      treeProps: { children: 'children', label: 'name' }
    }
  },
  methods: {
    open () {
      this.visible = true
      this.loadTree()
    },
    loadTree () {
      this.$http({
        url: this.$http.adornUrl('/product/category/list/tree'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.tree = (data && data.code === 0) ? data.data : []
        this.$nextTick(() => {
          this.$refs.tree.setCheckedKeys(this.value.map(item => item.id))
        })
      })
    },
    confirm () {
      // getCheckedKeys 只返回完全勾选的节点，半勾选的父节点不在其中，
      // 正好等于"真正要参与匹配的分类集合"
      const nodes = this.$refs.tree.getCheckedNodes()
      this.$emit('input', nodes.map(node => ({ id: node.catId, name: node.name })))
      this.visible = false
    },
    remove (id) {
      this.$emit('input', this.value.filter(item => item.id !== id))
    }
  }
}
</script>

<style scoped>
.picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.picker__count {
  font-size: 12px;
  color: #909399;
}

.picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}
</style>
