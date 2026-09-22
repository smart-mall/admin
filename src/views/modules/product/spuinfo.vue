<template>
  <div class="mod-config">
    <!-- 不加 isAuth：这个项目没有为商品删除配权限项，加了之后按钮会被 v-if 直接藏掉 -->
    <el-form :inline="true">
      <el-form-item>
        <el-button type="danger" @click="deleteHandle()" :disabled="dataListSelections.length <= 0">批量删除</el-button>
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
      <el-table-column prop="id" header-align="center" align="center" label="id"></el-table-column>
      <el-table-column prop="spuName" header-align="center" align="center" label="名称"></el-table-column>
      <el-table-column prop="spuDescription" header-align="center" align="center" label="描述"></el-table-column>
      <el-table-column prop="catalogName" header-align="center" align="center" label="分类"></el-table-column>
      <el-table-column prop="brandName" header-align="center" align="center" label="品牌"></el-table-column>
      <el-table-column prop="weight" header-align="center" align="center" label="重量"></el-table-column>
      <el-table-column prop="publishStatus" header-align="center" align="center" label="上架状态">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.publishStatus === 0">新建</el-tag>
          <el-tag v-if="scope.row.publishStatus === 1">已上架</el-tag>
          <el-tag v-if="scope.row.publishStatus === 2">已下架</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" label="创建时间"></el-table-column>
      <el-table-column prop="updateTime" header-align="center" align="center" label="修改时间"></el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="180" label="操作">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.publishStatus === 0"
            type="text"
            size="small"
            @click="productUp(scope.row.id)"
          >上架
          </el-button>
          <!-- 只在未上架时给删除入口：已上架的会被后端拒绝（11001），摆一个点了必然失败的按钮没意义 -->
          <el-button
            v-if="scope.row.publishStatus === 0"
            type="text"
            size="small"
            @click="deleteHandle(scope.row.id)"
          >删除
          </el-button>
          <el-button type="text" size="small" @click="attrUpdateShow(scope.row)">规格</el-button>
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
import PubSub from 'pubsub-js'

export default {
  data () {
    return {
      dataSub: null,
      dataForm: {},
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false
    }
  },
  props: {
    catId: {
      type: Number,
      default: 0
    }
  },
  components: {},
  activated () {
    this.getDataList()
  },
  methods: {
    productUp (id) {
      this.$http({
        url: this.$http.adornUrl('/product/spuinfo/' + id + '/up'),
        method: 'post'
      }).then(({data}) => {
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
    },
    // 删除。传了 id 就是单条，不传就是删勾选的那几条
    deleteHandle (id) {
      const ids = id ? [id] : this.dataListSelections.map(item => item.id)
      if (!ids.length) {
        this.$message.warning('请先勾选要删除的商品')
        return
      }
      this.$confirm(
        `确定删除商品[id=${ids.join(',')}]? 它的 sku、图片、规格参数和优惠数据会一起清掉`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl('/product/spuinfo/delete'),
          method: 'post',
          data: this.$http.adornData(ids, false)
        }).then(({data}) => {
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
            // 11001（商品已上架，请先下架再删除）不带 errors，msg 本身就是那句话；
            // 10001 的字段级错误已经被 utils/httpRequest.js 摊平进 msg。两条路都直接显示 msg
            this.$message.error(data.msg)
          }
        })
      }).catch(() => {})
    },
    attrUpdateShow (row) {
      console.log(row)
      this.$router.push({
        path: '/product-attrupdate',
        query: {spuId: row.id, catalogId: row.catalogId}
      })
    },
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      let param = {}
      Object.assign(param, this.dataForm, {
        page: this.pageIndex,
        limit: this.pageSize
      })
      this.$http({
        url: this.$http.adornUrl('/product/spuinfo/list'),
        method: 'get',
        params: this.$http.adornParams(param)
      }).then(({data}) => {
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
    // 新增 / 修改
    addOrUpdateHandle (id) {
    }
  },
  mounted () {
    this.dataSub = PubSub.subscribe('dataForm', (msg, val) => {
      console.log('~~~~~', val)
      this.dataForm = val
      this.getDataList()
    })
  },
  beforeDestroy () {
    PubSub.unsubscribe(this.dataSub)
  }
}
</script>
