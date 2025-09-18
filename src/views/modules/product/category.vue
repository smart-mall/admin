<script>
export default {
  name: 'RenrenFastVueCategory',
  components: {},
  props: {},
  data () {
    // 这里存放数据
    return {
      draggable: false,
      updateNodes: [],
      maxNum: 0,
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
      expandedKey: [], // 默认展开的数据
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      dialogVisible: false, // 对话框显示状态
      dialogType: '', // edit,add
      dialogTitle: '编辑菜单信息', // edit,add
      // 表单验证规则
      rules: {
        name: [
          {required: true, message: '请输入菜单名称', trigger: 'blur'},
          {
            min: 1,
            max: 10,
            message: '长度在 1 到 10 个字符',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  created () {
    this.getMenus()
  },

  mounted () {
  },

  methods: {
    // 清空
    resetChecked () {
      this.$refs.menuTree.setCheckedKeys([])
    },
    // 批量删除
    batchDelete () {
      let checkedNods = this.$refs.menuTree.getCheckedNodes()
      let catIds = []
      console.log(checkedNods)
      if (checkedNods !== undefined && checkedNods.length > 0) {
        for (let i = 0; i < checkedNods.length; i++) {
          catIds.push(checkedNods[i].catId)
        }
        this.$confirm(`确定要删除这些分类吗？`, '提示', {
          confirmButtonText: '确定',
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
                this.$message({
                  message: '分类删除成功',
                  type: 'success',
                  duration: 1500,
                  onClose: () => {
                  }
                })
              } else {
                this.$message.error(data.msg)
              }
            })
          })
          .catch(() => {
            this.$message({
              message: '操作取消',
              type: 'info',
              duration: 1500
            })
          })
      }
    },
    // 拖拽完成
    handleDrop (draggingNode, dropNode, dropType, ev) {
      console.log('handleDrop: ', draggingNode, dropNode, dropType, ev)
      // 1.当前节点最新的父节点ID
      let pCid = 0
      // 2.当前拖拽节点的最新顺序
      let siblings = []
      if (dropType === 'before' || dropType === 'after') {
        pCid =
          dropNode.parent.data.catId === undefined
            ? 0
            : dropNode.parent.data.catId
        siblings = dropNode.parent.childNodes
      } else {
        pCid = dropNode.data.catId
        siblings = dropNode.childNodes
      }

      for (let i = 0; i < siblings.length; i++) {
        // 如果是当前拖拽的节点  会影响父子关系的ID
        if (siblings[i].data.catId === draggingNode.data.catId) {
          // 如果当前节点层级发生了变化
          let catLevel = draggingNode.level
          if (siblings[i].level !== draggingNode.level) {
            // 修改当前节点的层级变化  拿到最新层级
            catLevel = siblings[i].level
            // 修改他子节点的层级
            this.updateChildNodeLevel(siblings[i])
          }
          this.updateNodes.push({
            catId: siblings[i].data.catId,
            sort: i,
            parentCid: pCid,
            catLevel: catLevel
          })
        } else {
          this.updateNodes.push({catId: siblings[i].data.catId, sort: i})
        }
      }

      // 3.所在层级
      console.log(this.updateNodes)
      this.$http({
        url: this.$http.adornUrl('/product/category/update/sort'),
        method: 'post',
        data: this.$http.adornData(this.updateNodes, false)
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.getMenus()
          this.maxNum = 0
          this.updateNodes = []
          this.expandedKey = [pCid]
          this.$message({
            message: '菜单顺序修改成功',
            type: 'success',
            duration: 1500,
            onClose: () => {
            }
          })
        } else {
          this.$message.error(data.msg)
        }
      })
    },
    // 拖拽功能 修改子节点层级 的方法
    updateChildNodeLevel (node) {
      if (node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const cNode = node.childNodes[i].data
          this.updateNodes.push({
            catId: cNode.catId,
            catLevel: node.childNodes[i].level
          })
          this.updateChildNodeLevel(node.childNodes[i])
        }
      }
    },
    // 每次点击的时候
    handleNodeClick (data) {
      console.log(data)
    },
    getMenus () {
      this.$http({
        url: this.$http.adornUrl('/product/category/list/tree'),
        methods: 'get'
      }).then(({data}) => {
        this.menus = data.tree
      })
    },
    handleClose (done) {
      this.$confirm('确认关闭？')
        .then((_) => {
          done()
        })
        .catch((_) => {
        })
    },
    // 添加菜单 点击保存
    addCategory () {
      this.$refs['category'].validate((valid) => {
        if (valid) {
          if (!Number.isInteger(this.category.sort)) {
            this.category.sort = 0
          }
          // 发送请求
          this.$http({
            url: this.$http.adornUrl('/product/category/save'),
            method: 'post',
            data: this.$http.adornData(this.category, false)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.getMenus()
              this.dialogVisible = false
              this.expandedKey = [this.category.parentCid]
              this.$message({
                message: '菜单添加成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                }
              })
            } else {
              this.$message.error(data.msg)
            }
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
      console.log(this.category)
    },
    // 修改
    editCategory () {
      this.$refs['category'].validate((valid) => {
        if (valid) {
          if (!Number.isInteger(this.category.sort)) {
            this.category.sort = 0
          }
          const {catId, name, icon, sort, productCount} = this.category
          // 发送请求
          this.$http({
            url: this.$http.adornUrl('/product/category/update'),
            method: 'post',
            data: this.$http.adornData(
              {catId, name, icon, sort, productCount},
              false
            )
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.getMenus()
              this.dialogVisible = false
              this.expandedKey = [this.category.parentCid]
              this.$message({
                message: '菜单修改成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                }
              })
            } else {
              this.$message.error(data.msg)
            }
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
      console.log(this.category)
    },
    // 点击添加时
    append (data) {
      // 初始化数据
      this.dialogType = 'edit'
      this.dialogTitle = '编辑菜单'
      this.category.name = ''
      this.category.catId = null

      this.category.icon = ''
      this.category.sort = 0
      this.category.productUnit = ''
      this.category.productCount = 0

      this.dialogType = 'add'
      this.dialogTitle = '新增菜单'
      this.category.parentCid = data.catId
      this.category.catLevel = data.catLevel * 1 + 1

      this.dialogVisible = true
      // 取消上次表单验证的效果
      // this.$refs["category"].resetFields();

      console.log(data)
    },
    // 点击修改时
    edit (data) {
      this.dialogType = 'edit'
      this.dialogTitle = '编辑菜单'
      this.category.catId = data.catId

      this.$http({
        url: this.$http.adornUrl('/product/category/info/' + data.catId),
        method: 'get'
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.category.name = data.category.name
          this.category.parentCid = data.category.parentCid
          this.category.catLevel = data.category.catLevel
          this.category.icon = data.category.icon
          this.category.sort = data.category.sort
          this.category.productUnit = data.category.productUnit
          this.category.productCount = data.category.productCount
        } else {
          this.$message.error(data.msg)
        }
      })

      this.dialogVisible = true
      // 取消上次表单验证的效果
      // this.$refs["category"].resetFields();

      console.log(data)
    },
    remove (node, data) {
      console.log(node)
      console.log(data)
      const ids = [data.catId]

      this.$confirm(`确定要删除` + data.name + `分类吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl('/product/category/delete'),
            method: 'post',
            data: this.$http.adornData(ids, false)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.getMenus()
              this.expandedKey = [node.parent.data.catId]
              this.$message({
                message: '菜单删除成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                }
              })
            } else {
              this.$message.error(data.msg)
            }
          })
        })
        .catch(() => {
          this.$message({
            message: '操作取消',
            type: 'info',
            duration: 1500
          })
        })
    },
    // 是否可以被拖拽
    allowDrop (draggingNode, dropNode, type) {
      console.log('===================')
      console.log(draggingNode)
      console.log(dropNode)
      console.log(type)
      console.log('===================')

      // 判断被拖拽的节点当前节点层数和不能大于等于3
      // 查出层级 也就是说子类中最大的level
      this.maxLevel(draggingNode.data)
      // 真正的深度  最里面的节点 层数 - 当前节点层数  +1
      let deep = this.maxNum - draggingNode.data.catLevel + 1
      console.log(deep)
      // 当前节点的层数 +  拖动后的节点 不等于大于4就ok
      if (type === 'inner') {
        return deep + dropNode.level <= 3
      } else {
        return deep + dropNode.parent.level <= 3
      }

      // if (dropNode.data.label === '二级 3-1') {
      //   return type !== 'inner';
      // } else {
      //   return true;
      // }
    },
    maxLevel (node) {
      if (node.children != null && node.children.length > 0) {
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].catLevel > this.maxNum) {
            this.maxNum = node.children[i].catLevel
          }
          this.maxLevel(node.children[i])
        }
      } else {
        if (node.level > this.maxNum) {
          this.maxNum = node.level
        }
      }
    }
  }
}
</script>

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
            active-text="开启拖拽"
            inactive-text="关闭拖拽"
            class="drag-switch"
          />
        </div>
        <div class="operation-right">
          <el-button @click="resetChecked" size="small" class="clear-btn">
            <i class="el-icon-delete"></i>清空
          </el-button>
          <el-button
            @click="batchDelete"
            type="danger"
            size="small"
            class="batch-delete-btn"
          >
            <i class="el-icon-remove"></i>批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <br/>

    <!-- 树形分类 -->
    <el-card class="tree-card" shadow="never">
      <div class="tree-header">
        <h3 class="tree-title">商品分类管理</h3>
        <el-tag type="info" size="small">共 {{ menus.length }} 个分类</el-tag>
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
            <i class="el-icon-folder" v-if="node.childNodes.length > 0"></i>
            <i class="el-icon-document" v-else></i>
            {{ node.label }}
          </span>
          <span class="node-actions">
            <el-button
              v-if="node.level <= 2"
              type="text"
              size="mini"
              @click="() => append(data)"
              class="action-btn append-btn"
            >
              <i class="el-icon-plus"></i>添加
            </el-button>
            <el-button
              type="text"
              size="mini"
              @click="() => edit(data)"
              class="action-btn edit-btn"
            >
              <i class="el-icon-edit"></i>编辑
            </el-button>
            <el-button
              v-if="node.childNodes.length === 0"
              type="text"
              size="mini"
              @click="() => remove(node, data)"
              class="action-btn delete-btn"
            >
              <i class="el-icon-delete"></i>删除
            </el-button>
          </span>
        </span>
      </el-tree>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
      custom-class="category-dialog"
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
        </el-form-item>
        <el-form-item label="分类图标">
          <el-input
            v-model="category.icon"
            placeholder="请输入图标URL"
            clearable
          >
            <template slot="append">
              <el-tooltip content="支持图标URL或Element UI图标类名">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input
            v-model="category.productUnit"
            placeholder="请输入计量单位"
            clearable
          />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" size="medium">取消</el-button>
        <el-button
          type="primary"
          @click="dialogType === 'add' ? addCategory() : editCategory()"
          size="medium"
          class="submit-btn"
        >
          {{ dialogType === 'add' ? '添加' : '保存' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.category-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.operation-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;

  .operation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
  }

  .drag-switch {
    ::v-deep .el-switch__label {
      color: #606266;
      font-weight: 500;
    }
  }

  .clear-btn {
    border-color: #909399;
    color: #606266;

    &:hover {
      border-color: #409EFF;
      color: #409EFF;
    }
  }

  .batch-delete-btn {
    margin-left: 12px;
  }
}

.tree-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;

  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 16px 0;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 16px;

    .tree-title {
      margin: 0;
      color: #303133;
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.custom-tree {
  ::v-deep .el-tree-node {
    margin: 4px 0;

    .el-tree-node__content {
      height: 40px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #f0f7ff;

        .node-actions {
          opacity: 1;
        }
      }
    }

    .el-tree-node__children {
      padding-left: 24px;
    }
  }

  ::v-deep .is-current {
    & > .el-tree-node__content {
      background-color: #ecf5ff;
      border-left: 3px solid #409EFF;
    }
  }
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 8px;

  .node-label {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #606266;

    i {
      margin-right: 8px;
      color: #409EFF;
      font-size: 16px;
    }
  }

  .node-actions {
    opacity: 0;
    transition: opacity 0.3s ease;

    .action-btn {
      padding: 6px 8px;
      margin-left: 4px;
      border-radius: 4px;
      font-weight: 400;

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
        color: #409EFF;

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

// 对话框样式
::v-deep .category-dialog {
  border-radius: 12px;

  .el-dialog__header {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      color: #303133;
      font-weight: 600;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 10px 20px 20px;
    border-top: 1px solid #ebeef5;
  }
}

.category-form {
  .el-form-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .sort-input {
    width: 120px;
  }
}

.submit-btn {
  min-width: 80px;
}

// 响应式设计
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
}
</style>
