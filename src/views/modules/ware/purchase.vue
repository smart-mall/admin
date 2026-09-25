<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item label="状态">
        <el-select style="width:120px" v-model="dataForm.status" placeholder="请选择状态" clearable>
          <el-option label="新建" :value="0"></el-option>
          <el-option label="已分配" :value="1"></el-option>
          <el-option label="已领取" :value="2"></el-option>
          <el-option label="已完成" :value="3"></el-option>
          <el-option label="有异常" :value="4"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input style="width:160px" v-model="dataForm.key" placeholder="采购单id/采购人名" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <!-- 没有"新增"：采购单是合并采购需求单时自动生成的 -->
        <el-button @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('ware:purchase:delete')" type="danger" @click="deleteHandle()" :disabled="dataListSelections.length <= 0">批量删除</el-button>
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
      <el-table-column prop="id" header-align="center" align="center" label="采购单id"></el-table-column>
      <el-table-column prop="assigneeName" header-align="center" align="center" label="采购人名"></el-table-column>
      <el-table-column prop="phone" header-align="center" align="center" label="联系方式"></el-table-column>
      <el-table-column prop="priority" header-align="center" align="center" label="优先级"></el-table-column>
      <el-table-column prop="status" header-align="center" align="center" label="状态">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === 0">新建</el-tag>
          <el-tag type="info" v-if="scope.row.status === 1">已分配</el-tag>
          <el-tag type="warning" v-if="scope.row.status === 2">已领取</el-tag>
          <el-tag type="success" v-if="scope.row.status === 3">已完成</el-tag>
          <el-tag type="danger" v-if="scope.row.status === 4">有异常</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="wareName" header-align="center" align="center" label="仓库"></el-table-column>
      <el-table-column prop="amount" header-align="center" align="center" label="总金额"></el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" label="创建日期"></el-table-column>
      <el-table-column prop="updateTime" header-align="center" align="center" label="更新日期"></el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="260" label="操作">
        <template slot-scope="scope">
          <!-- 能不能点由后端给的 allowedActions 决定，前端不再自己写 status == 0 || status == 1 -->
          <el-button
            v-if="hasAction(scope.row, 'assign')"
            type="text"
            size="small"
            @click="opendrawer(scope.row)"
          >分配</el-button>
          <el-button
            v-if="hasAction(scope.row, 'receive') && scope.row.assigneeId === currentUserId"
            type="text"
            size="small"
            @click="receiveHandle(scope.row)"
          >领取</el-button>
          <el-button
            v-if="hasAction(scope.row, 'done')"
            type="text"
            size="small"
            @click="doneHandle(scope.row)"
          >完成采购</el-button>
          <el-button
            v-if="hasAction(scope.row, 'delete')"
            type="text"
            size="small"
            @click="deleteHandle(scope.row.id)"
          >删除</el-button>
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
    <el-dialog title="分配采购人员" :visible.sync="caigoudialogVisible" width="30%">
      <el-select v-model="userId" filterable placeholder="请选择">
        <el-option
          v-for="item in userList"
          :key="item.userId"
          :label="item.username"
          :value="item.userId"
        ></el-option>
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button @click="caigoudialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="assignUser">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 完成采购：逐条填结果 -->
    <purchase-done ref="purchaseDone" @refreshDataList="getDataList"></purchase-done>
  </div>
</template>

<script>
import PurchaseDone from './purchase-done'
export default {
  data () {
    return {
      currentRow: {},
      dataForm: {
        key: '',
        status: ''
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      caigoudialogVisible: false,
      userId: '',
      userList: []
    }
  },
  components: {
    PurchaseDone
  },
  computed: {
    // 当前登录用户：领取只能由这张单分配的采购员做
    currentUserId () {
      return this.$store.state.user.id
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    // 后端在列表里给了 allowedActions，按钮显不显示以它为准
    hasAction (row, action) {
      return (row.allowedActions || []).indexOf(action) >= 0
    },
    opendrawer (row) {
      this.getUserList()
      this.currentRow = row
      this.caigoudialogVisible = true
    },
    assignUser () {
      const user = this.userList.find(item => item.userId === this.userId)
      if (!user) {
        this.$message.warning('请先选择采购人员')
        return
      }
      this.caigoudialogVisible = false
      this.$http({
        url: this.$http.adornUrl('/ware/purchase/assign'),
        method: 'post',
        data: this.$http.adornData({
          id: this.currentRow.id,
          assigneeId: user.userId,
          assigneeName: user.username,
          phone: user.mobile
        }, false)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message({
            message: '分配成功',
            type: 'success',
            duration: 1500,
            onClose: () => {
              this.userId = ''
              this.getDataList()
            }
          })
        } else {
          this.$message.error(data.msg)
        }
      })
    },
    // 领取：必须是分配给自己的单，领取之后这张单和它下面的需求单一起冻结
    receiveHandle (row) {
      this.$confirm(
        `确定领取采购单[id=${row.id}]? 领取后这张单和它下面的需求单都不能再改`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl('/ware/purchase/receive'),
          method: 'post',
          // 领取人不由前端传：后端从网关注入的 X-Admin 取当前登录管理员
          data: this.$http.adornData([row.id], false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: '领取成功',
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
    doneHandle (row) {
      this.$refs.purchaseDone.init(row.id)
    },
    getUserList () {
      this.$http({
        url: this.$http.adornUrl('/sys/user/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 500
        })
      }).then(({ data }) => {
        this.userList = data.page.list
      })
    },
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/ware/purchase/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.dataForm.key,
          status: this.dataForm.status
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
    // 删除：只有"还没被领取、且没有明细"的空单能删，前端先挡一道，
    // "有没有明细"后端会再判（11106）
    deleteHandle (id) {
      const rows = id ? this.dataList.filter(item => item.id === id) : this.dataListSelections
      const ids = rows.map(item => item.id)
      if (!ids.length) {
        this.$message.warning('请先勾选要删除的采购单')
        return
      }
      const blocked = rows.filter(item => !this.hasAction(item, 'delete'))
      if (blocked.length) {
        this.$message.warning('采购单[' + blocked.map(item => item.id).join(',') + ']已被领取、正在采购中，不能删除')
        return
      }
      this.$confirm(
        `确定删除采购单[id=${ids.join(',')}]? 还没开始采购的会把它的需求退回"新建"；已完成的会连它的采购需求一起删掉（库存不回滚）`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl('/ware/purchase/delete'),
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
