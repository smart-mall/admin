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
            <i class="el-icon-delete"></i> 批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 树形分类 -->
    <el-card class="tree-card" shadow="never">
      <div class="tree-header">
        <div class="tree-title-wrap">
          <i class="el-icon-menu"></i>
          <h3 class="tree-title">商品分类管理</h3>
        </div>
        <el-tag type="info" size="small" effect="plain">
          <i class="el-icon-tickets"></i> 共 {{ menus.length }} 个分类
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
            <!-- 配了图标就显示它，三个层级一视同仁；没配才退回按"有无子节点"区分的默认图标。
                 原来的 el-icon-folder-opened 是 Element UI 2.x 才有的类名，而项目加载的主题
                 字体是 1.x 生成的（见 src/icons/element-icons.js），父节点一直是空白，
                 这里换成字体里确实存在的 el-icon-menu。 -->
            <i v-if="data.icon" :class="data.icon"></i>
            <i
              v-else
              :class="node.childNodes.length > 0 ? 'el-icon-menu' : 'el-icon-document'"
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
          <!-- 下拉里是一个图标网格。只给图形没法分辨相似的图标，所以每个格子用原生 title
               显示类名；清单从已加载的样式表里扫出来，见 src/icons/element-icons.js -->
          <el-popover ref="iconPopover" placement="bottom-start" trigger="click">
            <div class="icon-picker__grid">
              <div
                v-for="name in iconList"
                :key="name"
                class="icon-picker__item"
                :class="{ 'is-active': name === category.icon }"
                :title="name"
                @click="iconActiveHandle(name)"
              >
                <i :class="name"></i>
              </div>
            </div>
          </el-popover>
          <div class="icon-picker__trigger" v-popover:iconPopover>
            <i class="icon-picker__preview" :class="category.icon || 'el-icon-picture-outline'"></i>
            <span class="icon-picker__label">{{ category.icon || '点击选择图标' }}</span>
            <i class="el-icon-arrow-down icon-picker__caret"></i>
          </div>
          <el-button
            v-if="category.icon"
            class="icon-picker__clear"
            type="text"
            size="mini"
            @click="category.icon = ''"
          >清除</el-button>
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input
            v-model="category.productUnit"
            placeholder="例如：个、件、台"
            clearable
            prefix-icon="el-icon-setting"
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
import { collectIconNames } from '@/icons/element-icons'

export default {
  name: 'RenrenFastVueCategory',
  data () {
    return {
      draggable: false,
      updateNodes: [],
      maxNum: 0,
      submitLoading: false,
      // Element UI 图标类名清单（如 el-icon-goods），created 里扫已加载的样式表填上
      iconList: [],
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
    // 放 created 而不是 mounted：样式（dev 下 style-loader 注入的 <style>、构建产物的
    // <link>）在这之前就已生效，扫得到规则
    this.iconList = collectIconNames()
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

    // 选中图标：回填并收起下拉。不收起的话每选一个都得在外面点一下才知道生效了没有
    iconActiveHandle (name) {
      this.category.icon = name
      this.$refs.iconPopover.doClose()
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

/* 分类图标选择器。
   这些规则全部放在顶层、不嵌进 .category-form：下拉面板里的网格被 popper
   append 到了 body，DOM 上不在表单内部，嵌进去的后代选择器会匹配不到。
   作用域靠 icon-picker__ 前缀加 scoped 的 data-v 属性保证。 */
.icon-picker__trigger {
  display: inline-flex;
  align-items: center;
  width: 240px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #c0c4cc;
  }
}

.icon-picker__preview {
  font-size: 16px;
  color: #409eff;
}

.icon-picker__label {
  flex: 1;
  margin-left: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.icon-picker__caret {
  color: #c0c4cc;
}

.icon-picker__clear {
  margin-left: 6px;
}

/* 宽度写死是为了让 popper 按内容撑开 —— popper 的外层容器由 element-ui 生成，
   scoped 样式够不到，尺寸只能由内容决定。70 个图标 8 列约 9 行，超出部分滚动。 */
.icon-picker__grid {
  display: flex;
  flex-wrap: wrap;
  width: 320px;
  max-height: 240px;
  overflow-y: auto;
}

.icon-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: 0 4px 4px 0;
  font-size: 16px;
  color: #606266;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
    border-color: #409eff;
  }

  &.is-active {
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;
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
