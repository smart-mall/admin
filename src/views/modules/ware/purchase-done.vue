<template>
  <el-dialog title="完成采购" :visible.sync="visible" width="70%">
    <p style="margin:0 0 10px;color:#909399;">
      逐条确认采购结果，只有"已完成"的会入库；默认全部算成功，把失败的那几条改成"采购失败"即可。
    </p>
    <el-table :data="detailList" border v-loading="loading" style="width:100%;">
      <el-table-column prop="id" header-align="center" align="center" width="90" label="需求单id"></el-table-column>
      <el-table-column prop="skuName" header-align="center" align="center" label="商品"></el-table-column>
      <el-table-column prop="skuNum" header-align="center" align="center" width="100" label="采购数量"></el-table-column>
      <el-table-column prop="wareName" header-align="center" align="center" width="140" label="仓库"></el-table-column>
      <el-table-column header-align="center" align="center" width="200" label="采购结果">
        <template slot-scope="scope">
          <el-radio-group v-model="scope.row.result">
            <el-radio :label="3">已完成</el-radio>
            <el-radio :label="4">采购失败</el-radio>
          </el-radio-group>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" width="200" label="失败原因">
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.reason"
            :disabled="scope.row.result !== 4"
            placeholder="可选"
          ></el-input>
        </template>
      </el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" @click="submit">确认完成</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      loading: false,
      purchaseId: null,
      detailList: []
    }
  },
  methods: {
    init (purchaseId) {
      this.purchaseId = purchaseId
      this.detailList = []
      this.visible = true
      this.getDetails()
    },
    // 只取这张采购单下的明细
    getDetails () {
      this.loading = true
      this.$http({
        url: this.$http.adornUrl('/ware/purchasedetail/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 500,
          purchaseId: this.purchaseId
        })
      }).then(({ data }) => {
        this.loading = false
        if (data && data.code === 0) {
          this.detailList = data.data.rows.map(item => {
            item.result = 3
            item.reason = ''
            return item
          })
        } else {
          this.$message.error(data.msg)
        }
      })
    },
    submit () {
      if (!this.detailList.length) {
        this.$message.warning('这张采购单下没有采购需求')
        return
      }
      const items = this.detailList.map(item => {
        return { itemId: item.id, status: item.result, reason: item.reason }
      })
      this.$http({
        url: this.$http.adornUrl('/ware/purchase/done'),
        method: 'post',
        data: this.$http.adornData({ id: this.purchaseId, items: items }, false)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message({
            message: '采购单已完成，成功的数量已经入库',
            type: 'success',
            duration: 1500,
            onClose: () => {
              this.visible = false
              this.$emit('refreshDataList')
            }
          })
        } else {
          this.$message.error(data.msg)
        }
      })
    }
  }
}
</script>
