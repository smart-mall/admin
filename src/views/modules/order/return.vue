<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item label="状态">
        <el-select v-model="dataForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="item in statusOptions"
            :key="item.code"
            :label="item.text"
            :value="String(item.code)">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="dataForm.key" placeholder="订单号 / 会员名" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      style="width: 100%;">
      <el-table-column type="expand">
        <template slot-scope="scope">
          <el-form label-position="left" inline class="after-sale-detail">
            <el-form-item label="退货原因">
              <span>{{ textOrDash(scope.row.reason) }}</span>
            </el-form-item>
            <el-form-item label="补充描述">
              <span>{{ textOrDash(scope.row.description) }}</span>
            </el-form-item>
            <el-form-item label="退货人">
              <span>{{ textOrDash(scope.row.returnName) }} {{ textOrDash(scope.row.returnPhone) }}</span>
            </el-form-item>
            <el-form-item label="凭证">
              <span v-if="!scope.row.descPics">—</span>
              <img
                v-for="pic in splitPics(scope.row.descPics)"
                :key="pic"
                :src="pic"
                class="after-sale-detail__pic">
            </el-form-item>
            <el-form-item label="处理">
              <span>{{ textOrDash(scope.row.handleMan) }} {{ textOrDash(scope.row.handleTime) }}</span>
            </el-form-item>
            <el-form-item label="处理备注">
              <span>{{ textOrDash(scope.row.handleNote) }}</span>
            </el-form-item>
            <el-form-item label="退货地址">
              <span>{{ textOrDash(scope.row.companyAddress) }}</span>
            </el-form-item>
            <el-form-item label="商家收货">
              <span>{{ textOrDash(scope.row.receiveMan) }} {{ textOrDash(scope.row.receivePhone) }}
                {{ textOrDash(scope.row.receiveTime) }}</span>
            </el-form-item>
            <el-form-item label="收货备注">
              <span>{{ textOrDash(scope.row.receiveNote) }}</span>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column
        prop="orderSn"
        header-align="center"
        align="center"
        width="180"
        label="订单号">
      </el-table-column>
      <el-table-column
        prop="memberUsername"
        header-align="center"
        align="center"
        width="130"
        label="会员">
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        label="退货商品">
        <template slot-scope="scope">
          <img v-if="scope.row.skuImg" :src="scope.row.skuImg" class="after-sale-goods__pic">
          <div>{{ textOrDash(scope.row.skuName) }}</div>
          <div class="after-sale-goods__attrs">
            {{ textOrDash(attrsText(scope.row.skuAttrsVals)) }} × {{ scope.row.skuCount }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="returnAmount"
        header-align="center"
        align="center"
        width="110"
        label="退款金额">
      </el-table-column>
      <el-table-column
        prop="statusText"
        header-align="center"
        align="center"
        width="100"
        label="状态">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ textOrDash(scope.row.statusText) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="createTime"
        header-align="center"
        align="center"
        width="160"
        label="申请时间">
      </el-table-column>
      <el-table-column
        fixed="right"
        header-align="center"
        align="center"
        width="150"
        label="操作">
        <template slot-scope="scope">
          <template v-if="scope.row.status === 0">
            <el-button type="text" size="small" @click="approveHandle(scope.row)">通过</el-button>
            <el-button type="text" size="small" @click="rejectHandle(scope.row)">拒绝</el-button>
          </template>
          <el-button
            v-else-if="scope.row.status === 1"
            type="text"
            size="small"
            @click="receiveHandle(scope.row)">确认收货</el-button>
          <span v-else>—</span>
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
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        dataForm: {
          status: '',
          key: ''
        },
        statusOptions: [],
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false
      }
    },
    activated () {
      this.getStatusOptions()
      this.getDataList()
    },
    methods: {
      // 状态选项由服务端下发：文案只在 AfterSaleStatusEnum 里维护一份，前端不抄
      getStatusOptions () {
        this.$http({
          url: this.$http.adornUrl('/order/orderreturnapply/status-options'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.statusOptions = data.data || []
          }
        })
      },
      // 获取数据列表。type 固定为 1（退货退款）：仅退款那条在同级的"退款处理"页看
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/order/orderreturnapply/list'),
          method: 'get',
          params: this.$http.adornParams({
            'page': this.pageIndex,
            'limit': this.pageSize,
            'type': 1,
            'status': this.dataForm.status,
            'key': this.dataForm.key
          })
        }).then(({data}) => {
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
      // 审核通过：只改申请单，把商家的退货地址下发给会员，钱等收到货再退
      approveHandle (row) {
        this.$confirm(`确认同意订单 [${row.orderSn}] 的退货申请？通过后会把退货地址发给会员。`, '审核退货申请', {
          confirmButtonText: '通过',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl('/order/orderreturnapply/audit'),
            method: 'post',
            data: this.$http.adornData({ id: row.id, approve: true })
          }).then(({data}) => {
            this.handleResult(data)
          })
        }).catch(() => {})
      },
      // 审核拒绝：必须写理由，会员要靠这句话决定能不能补齐材料再申请一次
      rejectHandle (row) {
        this.$prompt('请写明驳回理由，会员会看到这句话', '驳回退货申请', {
          confirmButtonText: '驳回',
          cancelButtonText: '取消',
          inputValidator: value => (value && value.trim() ? true : '驳回理由不能为空')
        }).then(({value}) => {
          this.$http({
            url: this.$http.adornUrl('/order/orderreturnapply/audit'),
            method: 'post',
            data: this.$http.adornData({ id: row.id, approve: false, handleNote: value })
          }).then(({data}) => {
            this.handleResult(data)
          })
        }).catch(() => {})
      },
      // 确认收到退货：收货人取当前登录管理员，随后才会向平台发起退款
      receiveHandle (row) {
        this.$prompt('收货备注（可留空）', '确认收到退货', {
          confirmButtonText: '确认收货',
          cancelButtonText: '取消'
        }).then(({value}) => {
          this.$http({
            url: this.$http.adornUrl('/order/orderreturnapply/receive'),
            method: 'post',
            data: this.$http.adornData({ id: row.id, receiveNote: value })
          }).then(({data}) => {
            this.handleResult(data)
          })
        }).catch(() => {})
      },
      handleResult (data) {
        if (data && data.code === 0) {
          this.$message({
            message: '操作成功',
            type: 'success',
            duration: 1500,
            onClose: () => {
              this.getDataList()
            }
          })
        } else {
          this.$message.error(data.msg)
        }
      },
      sizeChangeHandle (val) {
        this.pageSize = val
        this.pageIndex = 1
        this.getDataList()
      },
      currentChangeHandle (val) {
        this.pageIndex = val
        this.getDataList()
      },
      // 凭证图片以逗号隔开，空串与多余空项都滤掉
      splitPics (descPics) {
        return (descPics || '').split(',').filter(pic => pic)
      },
      attrsText (skuAttrsVals) {
        return (skuAttrsVals || '').split(';').join(' / ')
      },
      textOrDash (value) {
        return value === null || value === undefined || value === '' ? '—' : value
      },
      statusTagType (status) {
        if (status === 0) return 'warning'
        if (status === 1) return ''
        if (status === 2) return 'success'
        return 'info'
      }
    }
  }
</script>

<style scoped>
  .after-sale-detail >>> .el-form-item {
    margin-bottom: 0;
    width: 100%;
  }
  .after-sale-detail__pic {
    width: 60px;
    height: 60px;
    margin-right: 6px;
    object-fit: cover;
  }
  .after-sale-goods__pic {
    width: 44px;
    height: 44px;
    object-fit: cover;
  }
  .after-sale-goods__attrs {
    color: #909399;
    font-size: 12px;
  }
</style>
