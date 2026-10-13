<template>
  <div class="mod-config">
    <!-- 审核页：评价只能由会员端发起、删除还会连带清掉回复与订单上的评价时间，
         所以这里没有新增与删除，只有下架与恢复 -->
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item label="skuId">
        <el-input style="width:140px" v-model="dataForm.skuId" clearable></el-input>
      </el-form-item>
      <el-form-item label="spuId">
        <el-input style="width:140px" v-model="dataForm.spuId" clearable></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select style="width:140px" v-model="dataForm.showStatus" placeholder="全部" clearable>
          <el-option label="显示" :value="1"></el-option>
          <el-option label="已下架" :value="0"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input style="width:160px" v-model="dataForm.key" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table
      ref="tbl"
      :data="dataList"
      row-key="id"
      border
      v-loading="dataListLoading"
      style="width: 100%;"
    >
      <el-table-column header-align="center" align="center" label="类型" width="80">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.rowType === 'reply' ? 'warning' : ''">
            {{ scope.row.rowType === 'reply' ? '回复' : '评价' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="id" header-align="center" align="center" label="id" width="70"></el-table-column>
      <el-table-column prop="spuName" header-align="center" align="center" label="商品" show-overflow-tooltip></el-table-column>
      <el-table-column header-align="center" align="center" label="skuId" width="90">
        <template slot-scope="scope">{{ text(scope.row.skuId) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" label="会员" width="120">
        <template slot-scope="scope">{{ text(scope.row.memberNickName) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" label="星级" width="70">
        <template slot-scope="scope">{{ text(scope.row.star) }}</template>
      </el-table-column>
      <el-table-column prop="content" header-align="center" align="center" label="内容" show-overflow-tooltip></el-table-column>
      <el-table-column header-align="center" align="center" label="回复数" width="80">
        <template slot-scope="scope">{{ text(scope.row.replyCount) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" label="获赞" width="70">
        <template slot-scope="scope">{{ text(scope.row.likesCount) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" label="状态" width="90">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.showStatus === 1 ? 'success' : 'info'">
            {{ scope.row.showStatus === 1 ? '显示' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" label="时间" width="160">
        <template slot-scope="scope">{{ text(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="90" label="操作">
        <template slot-scope="scope">
          <el-button v-if="scope.row.showStatus === 1" type="text" size="small" @click="auditHandle(scope.row, 0)">下架</el-button>
          <el-button v-else type="text" size="small" @click="auditHandle(scope.row, 1)">恢复</el-button>
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
  </div>
</template>

<script>
export default {
  data () {
    return {
      dataForm: {
        skuId: '',
        spuId: '',
        showStatus: '',
        key: ''
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false
    }
  },
  activated () {
    if (this.$route.query.skuId) {
      this.dataForm.skuId = this.$route.query.skuId
    }
    this.getDataList()
  },
  methods: {
    // 空值统一显示成占位符：回复行没有商品、星级与回复数，直接绑字段会印出 undefined
    text (value) {
      return value === null || value === undefined || value === '' ? '—' : value
    },
    // 主行与回复共用同一套列，靠 rowType 区分。
    // 子节点必须叫 children：这个版本的表格树形写死读该键，没有 tree-props 可配
    decorate (rows) {
      return (rows || []).map(row => {
        row.rowType = 'comment'
        row.children = (row.replies || []).map(reply => {
          reply.rowType = 'reply'
          return reply
        })
        delete row.replies
        return row
      })
    },
    // 树形默认是折叠的，而 2.8.2 没有公开的"默认展开"（default-expand-all 只服务 type=expand 的展开行），
    // 只能逐个调 store 的展开方法——点三角走的也是它。每次数据变化 treeData 都会重建为折叠，所以要重新展开
    expandAllReplies () {
      const store = this.$refs.tbl && this.$refs.tbl.store
      if (!store) return
      this.dataList.forEach(row => {
        const node = store.states.treeData[row.id]
        if (node && node.expanded === false && row.children && row.children.length) {
          store.toggleTreeExpansion(row.id)
        }
      })
    },
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/product/spucomment/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          skuId: this.dataForm.skuId,
          spuId: this.dataForm.spuId,
          showStatus: this.dataForm.showStatus,
          key: this.dataForm.key
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = this.decorate(data.data.rows)
          this.totalPage = data.data.total
          this.$nextTick(this.expandAllReplies)
        } else {
          this.dataList = []
          this.totalPage = 0
        }
        this.dataListLoading = false
      })
    },
    // 下架或恢复，showStatus 为 0 是下架、1 是恢复
    auditHandle (row, showStatus) {
      const action = showStatus === 0 ? '下架' : '恢复'
      const label = row.rowType === 'reply' ? '回复' : '评价'
      this.$confirm(`确定要${action}这条${label}吗？下架后前台不再展示。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl(`/product/spucomment/audit/${row.id}`),
          method: 'post',
          params: this.$http.adornParams({ showStatus })
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: `${action}成功`,
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
    }
  }
}
</script>
