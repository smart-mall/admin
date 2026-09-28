<template>
  <div class="picker">
    <el-button size="small" @click="open">{{ value.length ? '重新选择会员' : '选择会员' }}</el-button>
    <span v-if="value.length" class="picker__count">已选 {{ value.length }} 个会员</span>

    <div v-if="value.length" class="picker__chips">
      <el-tag
        v-for="item in value"
        :key="item.id"
        closable
        size="small"
        @close="remove(item.id)"
      >{{ item.name || item.id }}</el-tag>
    </div>

    <el-dialog
      title="选择会员"
      :visible.sync="visible"
      :close-on-click-modal="false"
      append-to-body
      width="820px"
    >
      <el-form :inline="true" @keyup.enter.native="search">
        <el-form-item>
          <el-input v-model="keyword" placeholder="账号 / 昵称 / 手机号 / 邮箱" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="search">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table
        ref="table"
        :data="rows"
        border
        v-loading="loading"
        height="360"
        @selection-change="selectionChangeHandle"
      >
        <el-table-column type="selection" header-align="center" align="center" width="50"></el-table-column>
        <el-table-column prop="id" header-align="center" align="center" width="80" label="会员 ID"></el-table-column>
        <el-table-column prop="username" header-align="center" align="center" label="账号"></el-table-column>
        <el-table-column prop="nickname" header-align="center" align="center" label="昵称"></el-table-column>
        <el-table-column prop="mobile" header-align="center" align="center" label="手机号"></el-table-column>
        <el-table-column prop="email" header-align="center" align="center" label="邮箱"></el-table-column>
      </el-table>

      <el-pagination
        @size-change="sizeChangeHandle"
        @current-change="currentChangeHandle"
        :current-page="pageIndex"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        :total="totalPage"
        layout="total, prev, pager, next"
      ></el-pagination>

      <span slot="footer" class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
/**
 * 会员多选器，值形状统一为 { id, name }，与分类、商品选择器一致；name 取昵称。
 *
 * 检索走管理端的会员列表接口，该接口支持按账号、昵称、手机号、邮箱模糊匹配 ——
 * 发券时要能按手机号找到人，只翻页是找不动的。
 *
 * 弹窗里改的是临时勾选集合，点确定才写回 value。组件自身只读接口、不改任何数据。
 */
export default {
  name: 'MemberPicker',
  props: {
    /** 已选会员，元素为 { id, name }。 */
    value: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      visible: false,
      loading: false,
      keyword: '',
      rows: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      selection: []
    }
  },
  methods: {
    open () {
      this.visible = true
      this.pageIndex = 1
      this.getDataList()
    },
    search () {
      this.pageIndex = 1
      this.getDataList()
    },
    getDataList () {
      this.loading = true
      this.$http({
        url: this.$http.adornUrl('/member/member/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.keyword
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
        this.restoreSelection()
      })
    },
    // 翻页后把已选项重新勾上：el-table 的勾选状态不跨数据源保留
    restoreSelection () {
      const selected = new Set(this.value.map(item => item.id))
      this.$nextTick(() => {
        this.rows.forEach(row => {
          if (selected.has(row.id)) {
            this.$refs.table.toggleRowSelection(row, true)
          }
        })
      })
    },
    selectionChangeHandle (val) {
      this.selection = val
    },
    confirm () {
      // 只把当前页的勾选合并进已选，保留其它页选过的会员
      const kept = this.value.filter(item => !this.rows.some(row => row.id === item.id))
      const picked = this.selection.map(row => ({ id: row.id, name: row.nickname || row.username }))
      this.$emit('input', kept.concat(picked))
      this.visible = false
    },
    remove (id) {
      this.$emit('input', this.value.filter(item => item.id !== id))
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
.picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.picker__count {
  font-size: 12px;
  color: #909399;
}

.picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}
</style>
