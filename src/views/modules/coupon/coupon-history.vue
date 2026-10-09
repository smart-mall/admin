<template>
  <el-dialog
    :title="`领取记录 · ${couponName}`"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="900px"
  >
    <el-table :data="rows" border v-loading="loading" height="380">
      <el-table-column prop="id" header-align="center" align="center" width="90" label="记录 ID"></el-table-column>
      <el-table-column prop="memberId" header-align="center" align="center" width="90" label="会员 ID"></el-table-column>
      <el-table-column prop="memberNickName" header-align="center" align="center" label="会员昵称">
        <template slot-scope="scope">
          <span v-if="scope.row.memberNickName">{{ scope.row.memberNickName }}</span>
          <span v-else class="history__empty">—</span>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="110" label="领取方式">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.getType === 0" type="warning" size="small">后台赠送</el-tag>
          <el-tag v-else size="small">主动领取</el-tag>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="110" label="使用状态">
        <template slot-scope="scope">
          <el-tag :type="useTagType(scope.row.useType)" size="small">{{ useText(scope.row.useType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" width="160" label="领取时间"></el-table-column>
      <el-table-column prop="orderSn" header-align="center" align="center" width="170" label="关联订单号">
        <template slot-scope="scope">
          <span v-if="scope.row.orderSn">{{ scope.row.orderSn }}</span>
          <span v-else class="history__empty">—</span>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
    ></el-pagination>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
/**
 * 单张优惠券的领取记录弹窗，从券列表的行内按钮打开。
 *
 * 只读，不带任何增删改入口：领取记录是领取与核销链路的结果，后台直接改会让券上的计数对不上。
 */
export default {
  data () {
    return {
      visible: false,
      loading: false,
      couponId: 0,
      couponName: '',
      rows: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0
    }
  },
  methods: {
    init (coupon) {
      this.couponId = coupon.id
      this.couponName = coupon.couponName
      this.pageIndex = 1
      this.visible = true
      this.getDataList()
    },
    getDataList () {
      this.loading = true
      this.$http({
        url: this.$http.adornUrl('/coupon/couponhistory/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          couponId: this.couponId
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.rows = data.data.rows
          this.totalPage = data.data.total
        } else {
          this.rows = []
          this.totalPage = 0
        }
        this.loading = false
      })
    },
    useText (useType) {
      const texts = { 0: '未使用', 1: '已使用', 2: '已过期', 3: '占用中' }
      return texts[useType] || '未知'
    },
    useTagType (useType) {
      if (useType === 1) {
        return 'success'
      }
      if (useType === 2) {
        return 'info'
      }
      return ''
    },
    sizeChangeHandle (val) {
      this.pageSize = val
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (val) {
      this.pageIndex = val
      this.getDataList()
    }
  }
}
</script>

<style scoped>
.history__empty {
  color: #c0c4cc;
}
</style>
