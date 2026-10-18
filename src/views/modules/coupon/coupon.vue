<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item>
        <el-input v-model="dataForm.key" placeholder="券名 / 券 ID" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="dataForm.couponType" placeholder="券类型" clearable>
          <el-option :value="0" label="全场赠券"></el-option>
          <el-option :value="1" label="会员赠券"></el-option>
          <el-option :value="2" label="购物赠券"></el-option>
          <el-option :value="3" label="注册赠券"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="dataForm.useType" placeholder="适用范围" clearable>
          <el-option :value="0" label="全场通用"></el-option>
          <el-option :value="1" label="指定分类"></el-option>
          <el-option :value="2" label="指定商品"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="dataForm.memberLevel" placeholder="会员等级" clearable>
          <el-option :value="0" label="不限等级"></el-option>
          <el-option
            v-for="level in memberLevels"
            :key="level.id"
            :value="level.id"
            :label="level.name"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="dataForm.status" placeholder="券状态" clearable>
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="dataForm.publish" placeholder="发布状态" clearable>
          <el-option :value="1" label="已发布"></el-option>
          <el-option :value="0" label="未发布"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker
          v-model="dataForm.enableRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="领取窗口起"
          end-placeholder="领取窗口止"
          value-format="yyyy-MM-dd HH:mm:ss"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button @click="resetFilter()">重置</el-button>
        <el-button
          v-if="isAuth('coupon:coupon:save')"
          type="primary"
          @click="addOrUpdateHandle()"
        >新增</el-button>
        <el-button
          v-if="isAuth('coupon:coupon:delete')"
          type="danger"
          @click="deleteHandle()"
          :disabled="dataListSelections.length <= 0"
        >批量删除</el-button>
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
      <el-table-column prop="couponName" header-align="center" align="center" min-width="150" label="券名"></el-table-column>
      <el-table-column header-align="center" align="center" width="110" label="类型">
        <template slot-scope="scope">{{ typeText(scope.row.couponType) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="140" label="优惠">
        <template slot-scope="scope">{{ discountText(scope.row) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="120" label="适用范围">
        <template slot-scope="scope">{{ scopeText(scope.row.useType) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="220" label="领取时间 / 有效期">
        <template slot-scope="scope">
          <div class="cell-sub">领取 {{ scope.row.enableStartTime }} ~ {{ scope.row.enableEndTime }}</div>
          <div class="cell-sub">可用 {{ scope.row.startTime }} ~ {{ scope.row.endTime }}</div>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="160" label="领取进度">
        <template slot-scope="scope">
          <el-progress :percentage="percent(scope.row)" :stroke-width="10"></el-progress>
          <div class="cell-sub">
            已领 {{ scope.row.receiveCount || 0 }} / {{ scope.row.publishCount || 0 }}，已用 {{ scope.row.useCount || 0 }}
          </div>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="100" label="状态">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.statusText)" size="small">{{ scope.row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="250" label="操作">
        <template slot-scope="scope">
          <el-button v-if="can(scope.row, 'edit')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          <el-button v-if="can(scope.row, 'publish')" type="text" size="small" @click="publishHandle(scope.row)">发布</el-button>
          <el-button v-if="can(scope.row, 'revoke')" type="text" size="small" @click="revokeHandle(scope.row)">停发</el-button>
          <el-button v-if="can(scope.row, 'grant')" type="text" size="small" @click="grantHandle(scope.row)">发券</el-button>
          <el-button type="text" size="small" @click="historyHandle(scope.row)">领取记录</el-button>
          <el-button v-if="can(scope.row, 'delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
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

    <add-or-update v-if="addOrUpdateVisible" ref="addOrUpdate" @refreshDataList="getDataList"></add-or-update>
    <coupon-grant v-if="grantVisible" ref="grant" @refreshDataList="getDataList"></coupon-grant>
    <coupon-history v-if="historyVisible" ref="history"></coupon-history>
  </div>
</template>

<script>
import AddOrUpdate from './coupon-add-or-update'
import CouponGrant from './coupon-grant'
import CouponHistory from './coupon-history'

/**
 * 优惠券列表页。
 *
 * 行内按钮的显隐全部来自后端下发的 allowedActions，本页不自行推断"这张券能不能删"——
 * 前端推断一份、后端守卫一份，两份规则迟早会分叉。
 */
export default {
  data () {
    return {
      dataForm: {
        key: '',
        couponType: '',
        useType: '',
        memberLevel: '',
        status: '',
        publish: '',
        enableRange: []
      },
      /**
       * 券状态下拉。
       *
       * 值取后端 CouponStatusEnum 的枚举名而不是中文：状态不落库、由后端现算，
       * 传枚举名才不受文案调整影响。
       */
      statusOptions: [
        { value: 'DRAFT', label: '草稿' },
        { value: 'NOT_STARTED', label: '未开始' },
        { value: 'RECEIVING', label: '领取中' },
        { value: 'SOLD_OUT', label: '已领完' },
        { value: 'REVOKED', label: '已停发' },
        { value: 'ENDED', label: '已结束' }
      ],
      /** 会员等级下拉，形状 { id, name }；打开页面时从 member 拉一次。 */
      memberLevels: [],
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false,
      grantVisible: false,
      historyVisible: false
    }
  },
  components: {
    AddOrUpdate,
    CouponGrant,
    CouponHistory
  },
  created () {
    this.loadMemberLevels()
  },
  activated () {
    this.getDataList()
  },
  methods: {
    /**
     * 拉一次会员等级下拉选项。
     *
     * 等级清单在 member 侧维护，前端不写死：写死等于同一份清单存在两处，加一档要改两个仓库。
     */
    loadMemberLevels () {
      this.$http({
        url: this.$http.adornUrl('/member/memberlevel/getMemberSelect'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        // 拉不到等级就只留"不限等级"一项：等级拉不到不该让整个列表页打不开
        this.memberLevels = (data && data.code === 0 && data.data) || []
      })
    },
    can (row, action) {
      return (row.allowedActions || []).indexOf(action) >= 0
    },
    typeText (couponType) {
      const texts = { 0: '全场赠券', 1: '会员赠券', 2: '购物赠券', 3: '注册赠券' }
      return texts[couponType] || '未知'
    },
    scopeText (useType) {
      const texts = { 0: '全场通用', 1: '指定分类', 2: '指定商品' }
      return texts[useType] || '未知'
    },
    discountText (row) {
      const amount = row.amount == null ? 0 : Number(row.amount)
      const minPoint = row.minPoint == null ? 0 : Number(row.minPoint)
      return minPoint > 0 ? `满 ${minPoint} 减 ${amount}` : `无门槛减 ${amount}`
    },
    percent (row) {
      const publishCount = Number(row.publishCount || 0)
      if (publishCount <= 0) {
        return 0
      }
      // 上限截到 100：计数并发写入的瞬间可能略超发行量，进度条不接受超过 100 的值
      return Math.min(100, Math.round(Number(row.receiveCount || 0) * 100 / publishCount))
    },
    statusTagType (statusText) {
      const types = {
        领取中: 'success',
        未开始: 'warning',
        已停发: 'warning',
        已领完: 'info',
        已结束: 'info'
      }
      return types[statusText] || ''
    },
    /**
     * 组装查询参数。
     *
     * 清空下拉后 el-select 会把值置成空串，直接发出去会变成"按空串筛选"；
     * 这里统一剔掉空值，让后端收到的是"没传这个条件"而不是一个空参数。
     * 注意 0 是有意义的取值（全场赠券、全场通用、不限等级、未发布），不能被当成空值剔掉。
     *
     * @return 只含已填条件的查询参数
     */
    buildParams () {
      const range = this.dataForm.enableRange || []
      const raw = {
        page: this.pageIndex,
        limit: this.pageSize,
        key: this.dataForm.key,
        couponType: this.dataForm.couponType,
        useType: this.dataForm.useType,
        memberLevel: this.dataForm.memberLevel,
        status: this.dataForm.status,
        publish: this.dataForm.publish,
        enableStartFrom: range[0],
        enableStartTo: range[1]
      }
      const params = {}
      Object.keys(raw).forEach(key => {
        const value = raw[key]
        if (value !== '' && value !== null && value !== undefined) {
          params[key] = value
        }
      })
      return params
    },
    resetFilter () {
      this.dataForm = {
        key: '',
        couponType: '',
        useType: '',
        memberLevel: '',
        status: '',
        publish: '',
        enableRange: []
      }
      this.pageIndex = 1
      this.getDataList()
    },
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/coupon/coupon/list'),
        method: 'get',
        params: this.$http.adornParams(this.buildParams())
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
    sizeChangeHandle (val) {
      this.pageSize = val
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (val) {
      this.pageIndex = val
      this.getDataList()
    },
    selectionChangeHandle (val) {
      this.dataListSelections = val
    },
    addOrUpdateHandle (id) {
      this.addOrUpdateVisible = true
      this.$nextTick(() => {
        this.$refs.addOrUpdate.init(id)
      })
    },
    grantHandle (row) {
      this.grantVisible = true
      this.$nextTick(() => {
        this.$refs.grant.init(row)
      })
    },
    historyHandle (row) {
      this.historyVisible = true
      this.$nextTick(() => {
        this.$refs.history.init(row)
      })
    },
    publishHandle (row) {
      this.$confirm(`确定发布「${row.couponName}」？发布后会员即可领取。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.postAction(`/coupon/coupon/${row.id}/publish`, '发布成功')
      })
    },
    revokeHandle (row) {
      this.$confirm(
        `确定停发「${row.couponName}」？停发后不再接受新的领取，已经领到手的券不受影响。`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.postAction(`/coupon/coupon/${row.id}/revoke`, '已停发')
      })
    },
    postAction (url, successMsg) {
      this.$http({
        url: this.$http.adornUrl(url),
        method: 'post',
        data: this.$http.adornData({})
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message({
            message: successMsg,
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
    },
    deleteHandle (id) {
      const ids = id
        ? [id]
        : this.dataListSelections.map(item => {
          return item.id
        })
      this.$confirm(
        `确定对[id=${ids.join(',')}]进行[${id ? '删除' : '批量删除'}]操作?`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl('/coupon/coupon/delete'),
          method: 'post',
          data: this.$http.adornData(ids, false)
        }).then(({ data }) => {
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
        })
      })
    }
  }
}
</script>

<style scoped>
.cell-sub {
  font-size: 12px;
  line-height: 18px;
  color: #909399;
}
</style>
