<template>
  <div class="category-container">
    <!-- 顶部操作栏 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-header">
        <div class="operation-left">
          <el-switch
            v-model="draggable"
            active-color="#13ce66"
            inactive-color="#dcdfe6"
            active-text="拖拽模式"
            inactive-text="普通模式"
            class="drag-switch"
          />
          <el-tag v-if="draggable" type="warning" size="small" class="drag-tip">
            <i class="el-icon-warning"></i> 拖拽模式下可拖动节点调整顺序
          </el-tag>
        </div>
        <el-button type="primary" size="small" @click="append({
          catId: 0,
          catLevel: 0

        })" plain>
          <i class="el-icon-plus"></i> 添加一级分类
        </el-button>
        <div class="operation-right">
          <el-button @click="resetChecked" size="small" class="clear-btn">
            <i class="el-icon-delete"></i> 清空选中
          </el-button>
          <el-button
            @click="batchDelete"
            type="danger"
            size="small"
            class="batch-delete-btn"
          >
            <i class="el-icon-delete-solid"></i> 批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 树形分类 -->
    <el-card class="tree-card" shadow="never">
      <div class="tree-header">
        <div class="tree-title-wrap">
          <i class="el-icon-s-grid"></i>
          <h3 class="tree-title">商品分类管理</h3>
        </div>
        <el-tag type="info" size="small" effect="plain">
          <i class="el-icon-collection-tag"></i> 共 {{ menus.length }} 个分类
        </el-tag>
      </div>

      <el-tree
        ref="menuTree"
        :data="menus"
        :props="defaultProps"
        @node-click="handleNodeClick"
        :expand-on-click-node="false"
        show-checkbox
        node-key="catId"
        :default-expanded-keys="expandedKey"
        :draggable="draggable"
        :allow-drop="allowDrop"
        @node-drop="handleDrop"
        class="custom-tree"
        empty-text="暂无分类数据"
      >
        <span class="custom-tree-node" slot-scope="{ node, data }">
          <span class="node-label">
            <i
              :class="node.childNodes.length > 0 ? 'el-icon-folder-opened' : 'el-icon-document'"
              :style="{ color: node.childNodes.length > 0 ? '#409EFF' : '#67C23A' }"
            ></i>
            <span class="node-name">{{ node.label }}</span>
            <el-tag
              v-if="node.level === 1"
              size="mini"
              type="primary"
              effect="plain"
              class="level-tag"
            >一级</el-tag>
            <el-tag
              v-else-if="node.level === 2"
              size="mini"
              type="success"
              effect="plain"
              class="level-tag"
            >二级</el-tag>
            <el-tag
              v-else
              size="mini"
              type="info"
              effect="plain"
              class="level-tag"
            >三级</el-tag>
          </span>
          <span class="node-actions">
            <el-button
              v-if="node.level <= 2"
              type="text"
              size="mini"
              @click="append(data)"
              class="action-btn append-btn"
            >
              <i class="el-icon-plus"></i> 添加
            </el-button>
            <el-button
              type="text"
              size="mini"
              @click="edit(data)"
              class="action-btn edit-btn"
            >
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button
              v-if="node.childNodes.length === 0"
              type="text"
              size="mini"
              @click="remove(node, data)"
              class="action-btn delete-btn"
            >
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </span>
        </span>
      </el-tree>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="520px"
      :close-on-click-modal="false"
      custom-class="category-dialog"
      @closed="handleDialogClosed"
    >
      <el-form
        :model="category"
        :rules="rules"
        ref="categoryForm"
        label-width="100px"
        class="category-form"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="category.name"
            placeholder="请输入分类名称"
            clearable
            prefix-icon="el-icon-edit"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="category.sort"
            :min="0"
            :max="999"
            controls-position="right"
            class="sort-input"
          />
          <span class="form-tip">数值越小越靠前</span>
        </el-form-item>
        <el-form-item label="分类图标">
          <el-input
            v-model="category.icon"
            placeholder="请输入图标URL或Element UI图标类名"
            clearable
            prefix-icon="el-icon-picture"
          >
            <template slot="append">
              <el-tooltip content="支持图标URL或Element UI图标类名" placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input
            v-model="category.productUnit"
            placeholder="例如：个、件、台"
            clearable
            prefix-icon="el-icon-s-operation"
          />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" size="medium">取 消</el-button>
        <el-button
          type="primary"
          @click="dialogType === 'add' ? addCategory() : editCategory()"
          size="medium"
          :loading="submitLoading"
          class="submit-btn"
        >
          {{ dialogType === 'add' ? '添 加' : '保 存' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'RenrenFastVueCategory',
  data () {
    return {
      draggable: false,
      updateNodes: [],
      maxNum: 0,
      submitLoading: false,
      category: {
        catId: '',
        name: '',
        parentCid: 0,
        catLevel: 0,
        sort: 0,
        icon: '',
        productUnit: '',
        productCount: 0
      },
      menus: [],
      expandedKey: [],
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      dialogVisible: false,
      dialogType: '',
      dialogTitle: '编辑菜单信息',
      rules: {
        name: [
          {required: true, message: '请输入分类名称', trigger: 'blur'},
          {min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur'}
        ]
      }
    }
  },
  created () {
    this.getMenus()
  },
  methods: {
    // 清空选中
    resetChecked () {
      this.$refs.menuTree.setCheckedKeys([])
      this.$message({
        message: '已清空选中',
        type: 'info',
        duration: 1000
      })
    },

    // 批量删除
    batchDelete () {
      const checkedNodes = this.$refs.menuTree.getCheckedNodes()
      if (!checkedNodes || checkedNodes.length === 0) {
        this.$message.warning('请先选择要删除的分类')
        return
      }

      const catIds = checkedNodes.map(node => node.catId)
      const names = checkedNodes.map(node => node.name).join('、')

      this.$confirm(`确定要删除分类【${names}】吗？删除后无法恢复！`, '批量删除', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl('/product/category/delete'),
            method: 'post',
            data: this.$http.adornData(catIds, false)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.getMenus()
              this.$message.success('分类删除成功')
            } else {
              this.$message.error(data.msg)
            }
          })
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },

    // 拖拽完成
    handleDrop (draggingNode, dropNode, dropType) {
      let pCid = 0
      let siblings = []

      if (dropType === 'before' || dropType === 'after') {
        pCid = dropNode.parent.data.catId || 0
        siblings = dropNode.parent.childNodes
      } else {
        pCid = dropNode.data.catId
        siblings = dropNode.childNodes
      }

      const updateNodes = []

      siblings.forEach((node, index) => {
        if (node.data.catId === draggingNode.data.catId) {
          let catLevel = draggingNode.level
          if (node.level !== draggingNode.level) {
            catLevel = node.level
            this.updateChildNodeLevel(node, updateNodes)
          }
          updateNodes.push({
            catId: node.data.catId,
            sort: index,
            parentCid: pCid,
            catLevel: catLevel
          })
        } else {
          updateNodes.push({catId: node.data.catId, sort: index})
        }
      })

      this.$http({
        url: this.$http.adornUrl('/product/category/update/sort'),
        method: 'post',
        data: this.$http.adornData(updateNodes, false)
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.getMenus()
          this.maxNum = 0
          this.expandedKey = [pCid]
          this.$message.success('分类顺序修改成功')
        } else {
          this.$message.error(data.msg)
        }
      })
    },

    // 更新子节点层级
    updateChildNodeLevel (node, updateNodes) {
      if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes.forEach(child => {
          updateNodes.push({
            catId: child.data.catId,
            catLevel: child.level
          })
          this.updateChildNodeLevel(child, updateNodes)
        })
      }
    },

    handleNodeClick (data) {
      console.log('节点点击:', data)
    },

    getMenus () {
      this.$http({
        url: this.$http.adornUrl('/product/category/list/tree'),
        method: 'get'
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.menus = data.tree || []
        }
      })
    },

    handleDialogClosed () {
      this.$refs.categoryForm && this.$refs.categoryForm.resetFields()
    },

    // 添加分类
    addCategory () {
      this.$refs.categoryForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true
          this.$http({
            url: this.$http.adornUrl('/product/category/save'),
            method: 'post',
            data: this.$http.adornData(this.category, false)
          }).then(({data}) => {
            this.submitLoading = false
            if (data && data.code === 0) {
              this.getMenus()
              this.dialogVisible = false
              this.expandedKey = [this.category.parentCid]
              this.$message.success('分类添加成功')
            } else {
              this.$message.error(data.msg)
            }
          }).catch(() => {
            this.submitLoading = false
          })
        }
      })
    },

    // 修改分类
    editCategory () {
      this.$refs.categoryForm.validate((valid) => {
        if (valid) {
          this.submitLoading = true
          const {catId, name, icon, sort, productCount} = this.category
          this.$http({
            url: this.$http.adornUrl('/product/category/update'),
            method: 'post',
            data: this.$http.adornData({catId, name, icon, sort, productCount}, false)
          }).then(({data}) => {
            this.submitLoading = false
            if (data && data.code === 0) {
              this.getMenus()
              this.dialogVisible = false
              this.expandedKey = [this.category.parentCid]
              this.$message.success('分类修改成功')
            } else {
              this.$message.error(data.msg)
            }
          }).catch(() => {
            this.submitLoading = false
          })
        }
      })
    },

    // 添加子分类
    append (data) {
      this.dialogType = 'add'
      this.dialogTitle = '新增分类'
      this.category = {
        catId: '',
        name: '',
        parentCid: data.catId,
        catLevel: data.catLevel + 1,
        sort: 0,
        icon: '',
        productUnit: '',
        productCount: 0
      }
      this.dialogVisible = true
    },

    // 编辑分类
    edit (data) {
      this.dialogType = 'edit'
      this.dialogTitle = '编辑分类'

      this.$http({
        url: this.$http.adornUrl('/product/category/info/' + data.catId),
        method: 'get'
      }).then(({data: res}) => {
        if (res && res.code === 0) {
          this.category = {
            catId: res.category.catId,
            name: res.category.name,
            parentCid: res.category.parentCid,
            catLevel: res.category.catLevel,
            sort: res.category.sort || 0,
            icon: res.category.icon || '',
            productUnit: res.category.productUnit || '',
            productCount: res.category.productCount || 0
          }
          this.dialogVisible = true
        } else {
          this.$message.error(res.msg)
        }
      })
    },

    // 删除分类
    remove (node, data) {
      this.$confirm(`确定要删除分类【${data.name}】吗？`, '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl('/product/category/delete'),
            method: 'post',
            data: this.$http.adornData([data.catId], false)
          }).then(({data: res}) => {
            if (res && res.code === 0) {
              this.getMenus()
              this.expandedKey = node.parent ? [node.parent.data.catId] : []
              this.$message.success('分类删除成功')
            } else {
              this.$message.error(res.msg)
            }
          })
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },

    // 拖拽权限判断
    allowDrop (draggingNode, dropNode, type) {
      this.maxLevel(draggingNode.data)
      const deep = this.maxNum - draggingNode.data.catLevel + 1
      if (type === 'inner') {
        return deep + dropNode.level <= 3
      } else {
        return deep + dropNode.parent.level <= 3
      }
    },

    maxLevel (node) {
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          if (child.catLevel > this.maxNum) {
            this.maxNum = child.catLevel
          }
          this.maxLevel(child)
        })
      } else {
        if (node.catLevel > this.maxNum) {
          this.maxNum = node.catLevel
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
.category-container {
  padding: 20px;
  background: #f0f2f6;
  min-height: calc(100vh - 84px);
}

.operation-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;

  .operation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }

  .operation-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .drag-tip {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .clear-btn,
  .batch-delete-btn {
    border-radius: 6px;
    transition: all 0.3s;
  }
}

.tree-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 16px 0;
    border-bottom: 1px solid #e8eaef;
    margin-bottom: 16px;

    .tree-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        font-size: 20px;
        color: #409eff;
      }

      .tree-title {
        margin: 0;
        color: #1f2f3d;
        font-size: 18px;
        font-weight: 600;
      }
    }
  }
}

.custom-tree {
  ::v-deep .el-tree-node {
    margin: 2px 0;

    .el-tree-node__content {
      height: 44px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #ecf5ff;
      }
    }

    .el-tree-node__children {
      padding-left: 24px;
    }
  }

  ::v-deep .is-current {
    & > .el-tree-node__content {
      background-color: #ecf5ff;
      border-left: 3px solid #409eff;
    }
  }
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 12px;

  .node-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #303133;

    i {
      font-size: 16px;
    }

    .node-name {
      font-weight: 500;
    }

    .level-tag {
      margin-left: 8px;
    }
  }

  .node-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    gap: 4px;

    .action-btn {
      padding: 5px 10px;
      border-radius: 6px;
      font-weight: 400;
      transition: all 0.2s;

      i {
        margin-right: 4px;
      }

      &.append-btn {
        color: #67c23a;

        &:hover {
          background-color: rgba(103, 194, 58, 0.1);
        }
      }

      &.edit-btn {
        color: #409eff;

        &:hover {
          background-color: rgba(64, 158, 255, 0.1);
        }
      }

      &.delete-btn {
        color: #f56c6c;

        &:hover {
          background-color: rgba(245, 108, 108, 0.1);
        }
      }
    }
  }
}

.custom-tree-node:hover .node-actions {
  opacity: 1;
}

// 对话框样式
::v-deep .category-dialog {
  border-radius: 16px;

  .el-dialog__header {
    padding: 20px 24px 12px;
    border-bottom: 1px solid #e8eaef;

    .el-dialog__title {
      color: #1f2f3d;
      font-weight: 600;
      font-size: 18px;
    }
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    padding: 12px 24px 20px;
    border-top: 1px solid #e8eaef;
  }
}

.category-form {
  .el-form-item {
    margin-bottom: 22px;
  }

  .sort-input {
    width: 130px;
  }

  .form-tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}

.submit-btn {
  min-width: 90px;
  border-radius: 6px;
}

// 响应式
@media (max-width: 768px) {
  .category-container {
    padding: 12px;
  }

  .operation-header {
    flex-direction: column;
    gap: 12px;

    .operation-left,
    .operation-right {
      width: 100%;
      justify-content: center;
    }
  }

  .tree-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .node-actions {
    opacity: 1 !important;
  }

  .action-btn {
    padding: 4px 8px !important;
    font-size: 12px !important;
  }
}
</style>
