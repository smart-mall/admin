<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item label="仓库">
        <el-select style="width:120px;" v-model="dataForm.wareId" placeholder="请选择仓库" clearable>
          <el-option :label="w.name" :value="w.id" v-for="w in wareList" :key="w.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select style="width:120px" v-model="dataForm.status" placeholder="请选择状态" clearable>
          <el-option label="新建" :value="0"></el-option>
          <el-option label="已分配" :value="1"></el-option>
          <el-option label="正在采购" :value="2"></el-option>
          <el-option label="已完成" :value="3"></el-option>
          <el-option label="采购失败" :value="4"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input style="width:120px" v-model="dataForm.key" placeholder="sku/名称" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('ware:purchasedetail:save')" type="primary" @click="addOrUpdateHandle()">新增</el-button>
        <el-dropdown @command="handleBatchCommand" :disabled="dataListSelections.length <= 0">
          <el-button type="danger">
            批量操作
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="delete">批量删除</el-dropdown-item>
            <el-dropdown-item command="unassign">取消分配</el-dropdown-item>
            <el-dropdown-item command="merge">合并整单</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-form-item>
    </el-form>
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle"
      style="width: 100%;"
    >
      <el-table-column type="selection" header-align="center" align="center" width="50"></el-table-column>
      <el-table-column prop="id" header-align="center" align="center" label="需求单id"></el-table-column>
      <el-table-column prop="purchaseId" header-align="center" align="center" label="所属采购单"></el-table-column>
      <el-table-column prop="skuName" header-align="center" align="center" label="采购商品"></el-table-column>
      <el-table-column prop="skuNum" header-align="center" align="center" label="采购数量"></el-table-column>
      <el-table-column prop="skuPrice" header-align="center" align="center" label="采购金额"></el-table-column>
      <el-table-column prop="wareName" header-align="center" align="center" label="仓库"></el-table-column>
      <el-table-column prop="status" header-align="center" align="center" label="状态">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status==0">新建</el-tag>
          <el-tag type="info" v-if="scope.row.status==1">已分配</el-tag>
          <el-tag type="warning" v-if="scope.row.status==2">正在采购</el-tag>
          <el-tag type="success" v-if="scope.row.status==3">已完成</el-tag>
          <el-tag type="danger" v-if="scope.row.status==4">采购失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="260" label="操作">
        <template slot-scope="scope">
          <!-- 能不能操作由后端给的 allowedActions 决定：并入采购单之后就不能再改数量和仓库了，
               要改先"取消分配"退回新建 -->
          <el-button
            v-if="hasAction(scope.row, 'merge')"
            type="text"
            size="small"
            @click="mergeOne(scope.row)"
          >分配</el-button>
          <el-button
            v-if="hasAction(scope.row, 'edit')"
            type="text"
            size="small"
            @click="addOrUpdateHandle(scope.row.id)"
          >修改</el-button>
          <el-button
            v-if="hasAction(scope.row, 'delete')"
            type="text"
            size="small"
            @click="deleteHandle(scope.row.id)"
          >删除</el-button>
          <el-button
            v-if="hasAction(scope.row, 'unassign')"
            type="text"
            size="small"
            @click="unassignHandle(scope.row.id)"
          >取消分配</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
    ></el-pagination>
    <!-- 弹窗, 新增 / 修改 -->
    <add-or-update v-if="addOrUpdateVisible" ref="addOrUpdate" @refreshDataList="getDataList"></add-or-update>
    <el-dialog title="合并到采购单" :visible.sync="mergedialogVisible" width="560px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px;">
        <div>把选中的 <b>{{ mergeItems.length }}</b> 条采购需求合并到一张采购单上。</div>
        <div><b>不选采购单直接确定，会自动创建一张新单</b>并把它们并进去。</div>
      </el-alert>
      <div style="margin-bottom:10px;color:#606266;">
        需求单：{{ mergeItems.join('、') || '（没有可合并的，只有"新建"状态的需求单能合并）' }}
      </div>
      <template v-if="purchasetableData.length">
        <div style="margin-bottom:6px;color:#606266;">合并到已有的采购单（只列"新建/已分配"的）：</div>
        <el-select v-model="purchaseId" placeholder="不选则自动创建新单" clearable filterable style="width:100%;">
          <el-option
            v-for="item in purchasetableData"
            :key="item.id"
            :label="'采购单 ' + item.id"
            :value="item.id"
          >
            <span style="float: left">采购单 {{ item.id }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">
              {{ item.assigneeName || '未分配采购员' }} {{ item.phone || '' }}
            </span>
          </el-option>
        </el-select>
      </template>
      <div v-else style="color:#909399;">
        当前没有可合并的采购单（"新建/已分配"状态的都没有），直接点"确定"会自动创建一张新单。
      </div>
      <div style="margin-top:14px;">
        <span style="color:#606266;margin-right:8px;">优先级</span>
        <el-input-number v-model="priority" :min="1" :max="9" size="small"></el-input-number>
        <span style="color:#909399;font-size:12px;margin-left:8px;">
          {{ purchaseId ? '会把这张采购单的优先级改成这个值' : '新建采购单时用它' }}
        </span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="mergedialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="mergeItem">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import AddOrUpdate from './purchasedetail-add-or-update'
export default {
  data () {
    return {
      dataForm: {
        key: '',
        status: '',
        wareId: ''
      },
      wareList: [],
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false,
      mergedialogVisible: false,
      purchaseId: '',
      // 要合并的需求单 id：单条"分配"和批量"合并整单"都写进这里，弹窗显示和提交用同一份
      mergeItems: [],
      priority: 1,
      purchasetableData: []
    }
  },
  components: {
    AddOrUpdate
  },
  watch: {
    // 选中已有采购单时把它的优先级带出来，免得"顺手把人家改掉"
    purchaseId (val) {
      if (!val) {
        this.priority = 1
        return
      }
      const hit = this.purchasetableData.find(item => item.id === val)
      this.priority = hit && hit.priority ? hit.priority : 1
    }
  },
  activated () {
    this.getDataList()
    this.getWares()
  },
  methods: {
    // 后端在列表里给了 allowedActions，按钮显不显示以它为准
    hasAction (row, action) {
      return (row.allowedActions || []).indexOf(action) >= 0
    },
    // 单条分配：不用先进批量操作，直接对这一条打开合并弹窗
    mergeOne (row) {
      this.mergeItems = [row.id]
      this.purchaseId = ''
      this.priority = 1
      this.getUnreceivedPurchase()
      this.mergedialogVisible = true
    },
    // 合并：没选采购单就新建一张，选了就并进去
    mergeItem () {
      const items = this.mergeItems
      if (!items.length) {
        this.$alert('选中的需求单里没有"新建"状态的，已并入采购单的要先取消分配', '提示', {
          confirmButtonText: '确定',
          callback: action => {}
        })
        return
      }
      const body = this.purchaseId
        ? { purchaseId: this.purchaseId, items: items, priority: this.priority }
        : { items: items, priority: this.priority }
      const tip = this.purchaseId
        ? `确定把[id=${items.join(',')}]并入采购单[${this.purchaseId}]?`
        : `没有选择采购单，将自动创建新单合并[id=${items.join(',')}]，确认吗？`
      this.$confirm(tip, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl('/ware/purchase/merge'),
          method: 'post',
          data: this.$http.adornData(body, false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: '合并成功',
              type: 'success',
              duration: 1500,
              onClose: () => {
                this.getDataList()
              }
            })
          } else {
            this.$message.error(data.msg)
          }
        })
      }).catch(() => {})
      this.mergedialogVisible = false
    },
    // 取消分配：从采购单里摘出来，退回"新建"，之后才能再改
    unassignHandle (id) {
      const rows = id ? this.dataList.filter(item => item.id === id) : this.dataListSelections
      const ids = rows.filter(item => this.hasAction(item, 'unassign')).map(item => item.id)
      if (!ids.length) {
        this.$message.warning('请先勾选已并入采购单的需求单')
        return
      }
      this.$confirm(
        `确定把需求单[id=${ids.join(',')}]从采购单里摘出来? 摘出后它们回到"新建"，可以再修改`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl('/ware/purchase/unassign'),
          method: 'post',
          data: this.$http.adornData(ids, false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: '已取消分配',
              type: 'success',
              duration: 1500,
              onClose: () => {
                this.getDataList()
              }
            })
          } else {
            this.$message.error(data.msg)
          }
        })
      }).catch(() => {})
    },
    getUnreceivedPurchase () {
      this.$http({
        url: this.$http.adornUrl('/ware/purchase/unreceive/list'),
        method: 'get',
        params: this.$http.adornParams({})
      }).then(({ data }) => {
        this.purchasetableData = data.page.list
      })
    },
    handleBatchCommand (cmd) {
      if (cmd === 'delete') {
        this.deleteHandle()
      }
      if (cmd === 'unassign') {
        this.unassignHandle()
      }
      if (cmd === 'merge') {
        if (this.dataListSelections.length !== 0) {
          this.mergeItems = this.dataListSelections
            .filter(item => this.hasAction(item, 'merge'))
            .map(item => item.id)
          this.purchaseId = ''
          this.priority = 1
          this.getUnreceivedPurchase()
          this.mergedialogVisible = true
        } else {
          this.$alert('请先选择需要合并的需求', '提示', {
            confirmButtonText: '确定',
            callback: action => {}
          })
        }
      }
    },
    getWares () {
      this.$http({
        url: this.$http.adornUrl('/ware/wareinfo/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 500
        })
      }).then(({ data }) => {
        this.wareList = data.page.list
      })
    },
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/ware/purchasedetail/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.dataForm.key,
          status: this.dataForm.status,
          wareId: this.dataForm.wareId
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list
          this.totalPage = data.page.totalCount
        } else {
          this.dataList = []
          this.totalPage = 0
        }
        this.dataListLoading = false
      })
    },
    // 每页数
    sizeChangeHandle (val) {
      this.pageSize = val
      this.pageIndex = 1
      this.getDataList()
    },
    // 当前页
    currentChangeHandle (val) {
      this.pageIndex = val
      this.getDataList()
    },
    // 多选
    selectionChangeHandle (val) {
      this.dataListSelections = val
    },
    // 新增 / 修改
    addOrUpdateHandle (id) {
      this.addOrUpdateVisible = true
      this.$nextTick(() => {
        this.$refs.addOrUpdate.init(id)
      })
    },
    // 删除：只有"新建"状态能删，前端先挡一道
    deleteHandle (id) {
      const rows = id ? this.dataList.filter(item => item.id === id) : this.dataListSelections
      const blocked = rows.filter(item => !this.hasAction(item, 'delete'))
      if (blocked.length) {
        this.$message.warning('需求单[' + blocked.map(item => item.id).join(',') + ']已并入采购单，不能删除；要删先取消分配')
        return
      }
      const ids = rows.map(item => item.id)
      if (!ids.length) {
        this.$message.warning('请先勾选要删除的采购需求单')
        return
      }
      this.$confirm(
        `确定删除采购需求单[id=${ids.join(',')}]?`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl('/ware/purchasedetail/delete'),
          method: 'post',
          data: this.$http.adornData(ids, false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: '删除成功',
              type: 'success',
              duration: 1500,
              onClose: () => {
                this.getDataList()
              }
            })
          } else {
            this.$message.error(data.msg)
          }
        })
      }).catch(() => {})
    }
  }
}
</script>
