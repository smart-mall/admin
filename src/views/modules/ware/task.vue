<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item>
        <el-input v-model="dataForm.key" placeholder="订单号 / 收货人" clearable style="width: 240px"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table
      ref="taskTable"
      :data="dataList"
      border
      row-key="id"
      v-loading="dataListLoading"
      @expand-change="expandChangeHandle"
      style="width: 100%;">
      <el-table-column type="expand">
        <template slot-scope="props">
          <!-- 工作单自带的订单快照：发货时不必回查订单，这里也只做展示 -->
          <div class="wt-snapshot">
            <el-tag class="wt-tag">配送地址：{{ textOrDash(props.row.deliveryAddress) }}</el-tag>
            <el-tag class="wt-tag">付款方式：{{ paymentWayText(props.row.paymentWay) }}</el-tag>
            <el-tag class="wt-tag">订单备注：{{ textOrDash(props.row.orderComment) }}</el-tag>
          </div>
          <el-table :data="props.row.detailList" size="mini" border style="width: 100%">
            <el-table-column
              prop="skuId"
              header-align="center"
              align="center"
              width="100"
              label="SKU ID">
            </el-table-column>
            <el-table-column
              header-align="left"
              label="SKU 名称">
              <template slot-scope="scope">{{ textOrDash(scope.row.skuName) }}</template>
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="140"
              label="仓库">
              <template slot-scope="scope">{{ textOrDash(scope.row.wareName) }}</template>
            </el-table-column>
            <el-table-column
              prop="skuNum"
              header-align="center"
              align="center"
              width="80"
              label="数量">
            </el-table-column>
            <el-table-column
              header-align="center"
              align="center"
              width="110"
              label="锁定状态">
              <template slot-scope="scope">
                <el-tag :type="lockTagType(scope.row.lockStatus)">{{ lockText(scope.row.lockStatus) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
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
        header-align="center"
        align="center"
        width="100"
        label="收货人">
        <template slot-scope="scope">{{ textOrDash(scope.row.consignee) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="130"
        label="收货人电话">
        <template slot-scope="scope">{{ textOrDash(scope.row.consigneeTel) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="160"
        label="锁定时间">
        <template slot-scope="scope">{{ timeText(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="90"
        label="明细数">
        <template slot-scope="scope">{{ (scope.row.detailList || []).length }} 条</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="180"
        label="锁定状态">
        <template slot-scope="scope">
          <el-tag :type="lockSummary(scope.row).type">{{ lockSummary(scope.row).text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        fixed="right"
        header-align="center"
        align="center"
        width="90"
        label="操作">
        <template slot-scope="scope">
          <!-- 明细是只读的，页面上只留展开与收起 -->
          <el-button type="text" size="small" @click="toggleExpand(scope.row)">{{ isExpanded(scope.row) ? '收起' : '明细' }}</el-button>
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
  const DASH = '—'

  // 取值见 wms_ware_order_task_detail.lock_status 的列注释；该列允许 NULL，因此还要有"未知"
  const LOCK_STATUS_TEXT = {
    1: '已锁定',
    2: '已解锁',
    3: '扣减'
  }
  const LOCK_STATUS_TAG = {
    1: 'warning',
    2: 'info',
    3: 'success'
  }
  // 取值见 wms_ware_order_task.payment_way 的列注释
  const PAYMENT_WAY_TEXT = {
    1: '在线付款',
    2: '货到付款'
  }

  export default {
    data () {
      return {
        dataForm: {
          key: ''
        },
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        // 已展开的行 ID：翻页时清空，否则按钮文字会与实际展开状态不一致
        expandedIds: []
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      textOrDash (value) {
        if (value === null || value === undefined || value === '') {
          return DASH
        }
        return value
      },
      timeText (value) {
        return value || DASH
      },
      paymentWayText (paymentWay) {
        return PAYMENT_WAY_TEXT[paymentWay] || this.textOrDash(paymentWay)
      },
      lockText (lockStatus) {
        return LOCK_STATUS_TEXT[lockStatus] || '未知'
      },
      lockTagType (lockStatus) {
        return LOCK_STATUS_TAG[lockStatus] || 'info'
      },
      // 锁定状态汇总：只有一种状态时直接给结论，混合时把各类条数列全
      lockSummary (row) {
        var details = row.detailList || []
        if (details.length === 0) {
          return { text: '无明细', type: 'info' }
        }
        var locked = details.filter(detail => detail.lockStatus === 1).length
        var unlocked = details.filter(detail => detail.lockStatus === 2).length
        var deducted = details.filter(detail => detail.lockStatus === 3).length
        var unknown = details.length - locked - unlocked - deducted
        if (locked === details.length) {
          return { text: '锁定中', type: 'warning' }
        }
        if (unlocked === details.length) {
          return { text: '已解锁', type: 'info' }
        }
        if (deducted === details.length) {
          return { text: '已扣减', type: 'success' }
        }
        var parts = []
        if (locked > 0) {
          parts.push(locked + ' 锁定')
        }
        if (unlocked > 0) {
          parts.push(unlocked + ' 解锁')
        }
        if (deducted > 0) {
          parts.push(deducted + ' 扣减')
        }
        if (unknown > 0) {
          parts.push(unknown + ' 未知')
        }
        return { text: parts.join(' / '), type: 'info' }
      },
      expandChangeHandle (row, expandedRows) {
        this.expandedIds = expandedRows.map(item => item.id)
      },
      isExpanded (row) {
        return this.expandedIds.indexOf(row.id) >= 0
      },
      toggleExpand (row) {
        this.$refs.taskTable.toggleRowExpansion(row)
      },
      // 获取数据列表
      getDataList () {
        this.dataListLoading = true
        this.expandedIds = []
        this.$http({
          url: this.$http.adornUrl('/ware/wareordertask/list'),
          method: 'get',
          params: this.$http.adornParams({
            'page': this.pageIndex,
            'limit': this.pageSize,
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
      // 清空筛选条件并回到第一页
      resetQuery () {
        this.dataForm.key = ''
        this.pageIndex = 1
        this.getDataList()
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

<style scoped>
  .wt-snapshot {
    padding: 8px 0 12px 48px;
  }
  .wt-tag {
    margin: 0 8px 8px 0;
  }
</style>
