<template>
  <div class="mod-config">
    <el-table v-loading="dataListLoading" :data="dataList" border style="width: 100%;">
      <el-table-column prop="id" header-align="center" align="center" width="80" label="id"></el-table-column>
      <el-table-column prop="memberId" header-align="center" align="center" width="100" label="会员id"></el-table-column>
      <el-table-column prop="memberNickname" header-align="center" align="center" width="160" label="会员昵称"></el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" width="180" label="变动时间"></el-table-column>
      <el-table-column prop="changeCount" header-align="center" align="center" width="100" label="成长值"></el-table-column>
      <el-table-column header-align="center" align="center" width="120" label="变动类型">
        <template slot-scope="scope">{{ scope.row.changeTypeText || '其他变动' }}</template>
      </el-table-column>
      <el-table-column prop="orderSn" header-align="center" align="center" min-width="220" label="来源订单号"></el-table-column>
      <el-table-column prop="note" header-align="center" align="center" label="备注"></el-table-column>
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
// 只读台账：流水行只由业务代码在成长值真正变动时写入，页面不提供新增、修改与删除 ——
// 后台改一行或删一行都会让流水与会员身上的成长值累计值对不上
export default {
  data () {
    return {
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/member/growthchangehistory/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.data.rows
          this.totalPage = data.data.total
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
    }
  }
}
</script>
