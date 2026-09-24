<template>
  <div class="mod-config">
    <!-- 只读页面：库存行只由"采购完成"创建、stock 只由采购增加、stock_locked 只由订单增减，
         没有一条合法路径需要人工写，所以这里没有新增/修改/删除 -->
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item label="仓库">
        <el-select style="width:160px;" v-model="dataForm.wareId" placeholder="请选择仓库" clearable>
          <el-option :label="w.name" :value="w.id" v-for="w in wareList" :key="w.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="sku">
        <sku-select v-model="dataForm.skuId"></sku-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      style="width: 100%;"
    >
      <el-table-column prop="id" header-align="center" align="center" label="id"></el-table-column>
      <el-table-column prop="wareName" header-align="center" align="center" label="仓库"></el-table-column>
      <el-table-column prop="skuName" header-align="center" align="center" label="商品"></el-table-column>
      <el-table-column prop="stock" header-align="center" align="center" label="库存数"></el-table-column>
      <el-table-column prop="stockLocked" header-align="center" align="center" label="锁定库存"></el-table-column>
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
import SkuSelect from '../common/sku-select.vue'
export default {
  data () {
    return {
      wareList: [],
      dataForm: {
        wareId: '',
        skuId: ''
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false
    }
  },
  components: {
    SkuSelect
  },
  activated () {
    if (this.$route.query.skuId) {
      this.dataForm.skuId = this.$route.query.skuId
    }
    this.getWares()
    this.getDataList()
  },
  methods: {
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
        url: this.$http.adornUrl('/ware/waresku/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          skuId: this.dataForm.skuId,
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
    }
  }
}
</script>
