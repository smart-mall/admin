<template>
  <el-dialog
    :title="!dataForm.id ? '新增' : '修改'"
    :close-on-click-modal="false"
    :visible.sync="visible"
  >
    <el-form
      :model="dataForm"
      :rules="dataRule"
      ref="dataForm"
      @keyup.enter.native="dataFormSubmit()"
      label-width="120px"
    >
      <el-form-item label="采购商品id" prop="skuId">
        <sku-select v-model="dataForm.skuId"></sku-select>
      </el-form-item>
      <el-form-item label="采购数量" prop="skuNum">
        <el-input v-model="dataForm.skuNum" placeholder="采购数量"></el-input>
      </el-form-item>
      <el-form-item label="采购金额" prop="skuPrice">
        <el-input v-model="dataForm.skuPrice" placeholder="这条需求的采购金额（总额）"></el-input>
        <!-- 只给参考：采购价是跟供应商谈出来的，和售价没关系，所以不预填 -->
        <div v-if="skuPriceRef !== null" style="color:#909399;font-size:12px;line-height:18px;">
          参考售价：{{ skuPriceRef }}
          <span v-if="skuPriceRefTotal !== null">，按售价算这批是 {{ skuPriceRefTotal }}</span>
          。采购金额请按实际谈的价填
        </div>
      </el-form-item>
      <el-form-item label="仓库" prop="wareId">
        <el-select v-model="dataForm.wareId" placeholder="请选择仓库" clearable>
          <el-option :label="w.name" :value="w.id" v-for="w in wareList" :key="w.id"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import SkuSelect from '../common/sku-select.vue'

export default {
  components: {SkuSelect},
  data () {
    return {
      visible: false,
      wareList: [],
      // 选中 sku 的售价，只作为填采购金额时的参考
      skuPriceRef: null,
      dataForm: {
        id: 0,
        purchaseId: '',
        skuId: '',
        skuNum: '',
        skuPrice: '',
        wareId: '',
        status: 0
      },
      dataRule: {
        skuId: [
          { required: true, message: '采购商品id不能为空', trigger: 'blur' }
        ],
        skuNum: [
          { required: true, message: '采购数量不能为空', trigger: 'blur' }
        ],
        skuPrice: [
          { required: true, message: '采购金额不能为空', trigger: 'blur' }
        ],
        wareId: [{ required: true, message: '仓库id不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    // 参考总价 = 售价 × 数量，只在两个值都有时显示
    skuPriceRefTotal () {
      const price = Number(this.skuPriceRef)
      const num = Number(this.dataForm.skuNum)
      if (!this.skuPriceRef || !num || isNaN(price) || isNaN(num)) {
        return null
      }
      return (price * num).toFixed(2)
    }
  },
  watch: {
    'dataForm.skuId' (val) {
      this.loadSkuPriceRef(val)
    }
  },
  created () {
    this.getWares()
  },
  methods: {
    // 拉这个 sku 的售价当参考。采购价是谈出来的，所以不预填进输入框
    loadSkuPriceRef (skuId) {
      this.skuPriceRef = null
      if (!skuId) {
        return
      }
      this.$http({
        url: this.$http.adornUrl(`/product/skuinfo/info/${skuId}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0 && data.skuInfo) {
          this.skuPriceRef = data.skuInfo.price
        }
      })
    },
    getWares () {
      this.$http({
        url: this.$http.adornUrl('/ware/wareinfo/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 500
        })
      }).then(({ data }) => {
        this.wareList = data.data.rows
      })
    },
    init (id) {
      this.dataForm.id = id || 0
      this.visible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].resetFields()
        if (this.dataForm.id) {
          this.$http({
            url: this.$http.adornUrl(
              `/ware/purchasedetail/info/${this.dataForm.id}`
            ),
            method: 'get',
            params: this.$http.adornParams()
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm.purchaseId = data.purchaseDetail.purchaseId
              this.dataForm.skuId = data.purchaseDetail.skuId
              this.dataForm.skuNum = data.purchaseDetail.skuNum
              this.dataForm.skuPrice = data.purchaseDetail.skuPrice
              this.dataForm.wareId = data.purchaseDetail.wareId
              this.dataForm.status = data.purchaseDetail.status
            }
          })
        }
      })
    },
    // 表单提交
    dataFormSubmit () {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          this.$http({
            url: this.$http.adornUrl(
              `/ware/purchasedetail/${!this.dataForm.id ? 'save' : 'update'}`
            ),
            method: 'post',
            data: this.$http.adornData({
              id: this.dataForm.id || undefined,
              purchaseId: this.dataForm.purchaseId,
              skuId: this.dataForm.skuId,
              skuNum: this.dataForm.skuNum,
              skuPrice: this.dataForm.skuPrice,
              wareId: this.dataForm.wareId,
              status: this.dataForm.status
            })
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message({
                message: '操作成功',
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
      })
    }
  }
}
</script>
