<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item label="关键字">
        <el-input
          v-model="dataForm.key"
          placeholder="用户名 / 昵称 / 手机号 / 邮箱"
          clearable
          style="width: 260px"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="dataListLoading" :data="dataList" border style="width: 100%;">
      <el-table-column prop="id" header-align="center" align="center" width="60" label="id"></el-table-column>
      <el-table-column header-align="center" align="center" width="110" label="会员等级">
        <template slot-scope="scope">{{ levelText(scope.row.levelId) }}</template>
      </el-table-column>
      <el-table-column prop="username" header-align="center" align="center" min-width="140" label="用户名"></el-table-column>
      <el-table-column prop="nickname" header-align="center" align="center" min-width="130" label="昵称"></el-table-column>
      <el-table-column header-align="center" align="center" width="130" label="手机号">
        <template slot-scope="scope">{{ dashText(scope.row.mobile) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" min-width="180" label="邮箱">
        <template slot-scope="scope">{{ dashText(scope.row.email) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="70" label="头像">
        <template slot-scope="scope">
          <img v-if="scope.row.header" :src="scope.row.header" class="member__avatar" alt="头像">
          <span v-else class="member__empty">—</span>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="70" label="性别">
        <template slot-scope="scope">{{ genderText(scope.row.gender) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="115" label="生日">
        <template slot-scope="scope">{{ dateText(scope.row.birth) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="90" label="来源">
        <template slot-scope="scope">{{ sourceText(scope.row.sourceType) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="right" width="100" label="积分">
        <template slot-scope="scope">{{ numberText(scope.row.integration) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="right" width="100" label="成长值">
        <template slot-scope="scope">{{ numberText(scope.row.growth) }}</template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="90" label="状态">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" width="160" label="注册时间"></el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="130" label="操作">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="grantHandle(scope.row)">送券</el-button>
          <el-button type="text" size="small" @click="orderHandle(scope.row)">查订单</el-button>
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
    <!-- 送券弹窗：会员是固定的，所以弹窗里选的是券 -->
    <coupon-grant v-if="grantVisible" ref="grant" @refreshDataList="getDataList"></coupon-grant>
  </div>
</template>

<script>
import CouponGrant from './member-coupon-grant'
// 会员列表是只读名册：会员由注册链路产生，后台不提供新增与删除（后端也没有"后台建会员"这个需求）。
// 库里存的是取值，页面负责翻成文案；积分与成长值只展示，改动一律走业务链路，不在这里改数。
export default {
  components: {
    CouponGrant
  },
  data () {
    return {
      dataForm: {
        key: ''
      },
      // 等级 id → 等级名：会员表只存 levelId，映射从等级下拉接口一次取回，不在前端抄一份等级清单
      levelNames: {},
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      grantVisible: false
    }
  },
  activated () {
    this.loadLevelNames()
    this.getDataList()
  },
  methods: {
    // 拉等级名映射；拉不到就退回"未知等级(id=x)"，不影响会员列表本身
    loadLevelNames () {
      this.$http({
        url: this.$http.adornUrl('/member/memberlevel/getMemberSelect'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (!data || data.code !== 0) {
          return
        }
        const names = {}
        ;(data.data || []).forEach(item => {
          names[item.id] = item.name
        })
        this.levelNames = names
      })
    },
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/member/member/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.dataForm.key
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
    // 清空关键字并回到第一页
    resetQuery () {
      this.dataForm.key = ''
      this.pageIndex = 1
      this.getDataList()
    },
    // 等级名；等级被删或与会员对不上时不假装知道名字，把 id 露出来便于排查
    levelText (levelId) {
      if (levelId === null || levelId === undefined) {
        return '—'
      }
      return this.levelNames[levelId] || `未知等级(id=${levelId})`
    },
    // 性别取值 [0-未知，1-男，2-女]
    genderText (gender) {
      const texts = { 0: '未知', 1: '男', 2: '女' }
      return texts[gender] || '—'
    },
    // 来源取值后台还没定义，库里全是 NULL：只把空值显示成"—"，不猜一套文案
    sourceText (sourceType) {
      return sourceType === null || sourceType === undefined ? '—' : String(sourceType)
    },
    // 积分与成长值允许为 null，按 0 处理；千分位便于肉眼核对台账
    numberText (value) {
      const num = value === null || value === undefined ? 0 : Number(value)
      return num.toLocaleString('en-US')
    },
    // 生日是 datetime，展示只取日期部分
    dateText (value) {
      return value ? String(value).slice(0, 10) : '—'
    },
    dashText (value) {
      return value === null || value === undefined || value === '' ? '—' : value
    },
    // 状态：注册链路不写该字段，NULL 表示"未设置"，不能当成"禁用"显示出来
    statusText (status) {
      if (status === 1) {
        return '启用'
      }
      if (status === 0) {
        return '禁用'
      }
      return '未设置'
    },
    statusTagType (status) {
      if (status === 1) {
        return 'success'
      }
      if (status === 0) {
        return 'danger'
      }
      return 'info'
    },
    // 送券：会员固定，弹窗里选券
    grantHandle (member) {
      this.grantVisible = true
      this.$nextTick(() => {
        this.$refs.grant.init(member)
      })
    },
    // 查订单：订单表存的是 member_username，订单列表的关键字也按它匹配，所以带账号而不是昵称
    orderHandle (member) {
      this.$router.push({ path: '/order-order', query: { key: member.username } })
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
.member__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
}

.member__empty {
  color: #c0c4cc;
}
</style>
