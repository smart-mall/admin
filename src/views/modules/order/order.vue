<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form-item>
        <el-input v-model="dataForm.key" placeholder="订单号 / 收货人 / 会员名" clearable style="width: 240px"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="dataForm.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option
            v-for="item in statusOptions"
            :key="item.code"
            :label="item.text"
            :value="item.code">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <!-- 删除标记是硬删的准入条件：后台要能一眼看出、也要能单独筛出来 -->
        <el-select v-model="dataForm.deleteStatus" placeholder="删除标记" clearable style="width: 130px">
          <el-option label="未删除" :value="0"></el-option>
          <el-option label="已删除" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker
          v-model="dataForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="下单开始"
          end-placeholder="下单结束"
          value-format="yyyy-MM-dd"
          style="width: 260px">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      style="width: 100%;">
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
        width="120"
        label="会员">
        <template slot-scope="scope">{{ textOrDash(scope.row.memberUsername) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="right"
        width="110"
        label="应付金额">
        <template slot-scope="scope">{{ amountText(scope.row.payAmount) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="100"
        label="状态">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ textOrDash(scope.row.statusText) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="100"
        label="支付方式">
        <template slot-scope="scope">{{ payTypeText(scope.row.payType) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="100"
        label="来源">
        <template slot-scope="scope">{{ sourceTypeText(scope.row.sourceType) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="160"
        label="下单时间">
        <template slot-scope="scope">{{ timeText(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="160"
        label="支付时间">
        <template slot-scope="scope">{{ timeText(scope.row.paymentTime) }}</template>
      </el-table-column>
      <el-table-column
        prop="receiverName"
        header-align="center"
        align="center"
        width="100"
        label="收货人">
      </el-table-column>
      <el-table-column
        prop="receiverPhone"
        header-align="center"
        align="center"
        width="130"
        label="收货人电话">
      </el-table-column>
      <el-table-column
        header-align="center"
        align="center"
        width="100"
        label="删除标记">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.deleteStatus === 1" type="danger">已删除</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        fixed="right"
        header-align="center"
        align="center"
        width="240"
        label="操作">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="detailHandle(scope.row)">详情</el-button>
          <el-button type="text" size="small" @click="noteHandle(scope.row)">改备注</el-button>
          <!-- 关闭只对待付款的订单有意义：其余状态点下去会被服务端拒掉，不如直接不摆按钮 -->
          <el-button v-if="scope.row.status === 0" type="text" size="small" @click="closeHandle(scope.row)">关闭订单</el-button>
          <!-- 只有已付款(1)的订单能发货：其余状态后端会返回"状态不支持" -->
          <el-button v-if="scope.row.status === 1" type="text" size="small" @click="deliverHandle(scope.row)">发货</el-button>
          <!-- 硬删只对会员标记过删除的订单开放；准入条件同样写在后端 SQL 的 WHERE 里 -->
          <el-button v-if="scope.row.deleteStatus === 1" type="text" size="small" @click="removeHandle(scope.row)">删除订单</el-button>
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
    <!-- 弹窗, 订单详情：按分组铺开整单信息 -->
    <order-detail v-if="detailVisible" ref="orderDetail"></order-detail>
    <!-- 弹窗, 改备注：只允许改备注一个字段 -->
    <el-dialog
      title="修改订单备注"
      :visible.sync="noteVisible"
      :close-on-click-modal="false"
      width="480px">
      <el-form :model="noteForm" label-width="90px">
        <el-form-item label="订单号">
          <el-input v-model="noteForm.orderSn" disabled></el-input>
        </el-form-item>
        <el-form-item label="订单备注">
          <el-input
            v-model="noteForm.note"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="留空表示清空备注">
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="noteVisible = false">取消</el-button>
        <el-button type="primary" @click="noteSubmit()">确定</el-button>
      </span>
    </el-dialog>
    <!-- 弹窗, 发货：只收物流信息，订单号由点中的行带过来，不允许手填 -->
    <el-dialog
      title="订单发货"
      :visible.sync="deliverVisible"
      :close-on-click-modal="false"
      width="480px">
      <el-form :model="deliverForm" :rules="deliverRule" ref="deliverForm" label-width="90px">
        <el-form-item label="订单号">
          <el-input v-model="deliverForm.orderSn" disabled></el-input>
        </el-form-item>
        <el-form-item label="物流公司" prop="deliveryCompany">
          <el-select v-model="deliverForm.deliveryCompany" placeholder="请选择物流公司" style="width: 100%">
            <el-option
              v-for="item in deliveryCompanies"
              :key="item.code"
              :label="item.name"
              :value="item.code">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <p style="margin: 0; font-size: 12px; color: #909399;">物流单号由系统生成，无需填写。</p>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deliverVisible = false">取消</el-button>
        <el-button type="primary" @click="deliverSubmit()">确定发货</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import OrderDetail from './order-detail'
  import { amountText, payTypeText, sourceTypeText, statusTagType, textOrDash, timeText } from './order-display'

  export default {
    data () {
      return {
        dataForm: {
          key: '',
          status: '',
          deleteStatus: '',
          dateRange: null
        },
        // 状态选项由服务端下发，前端不抄一份状态文案
        statusOptions: [],
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        detailVisible: false,
        noteVisible: false,
        noteForm: {
          orderSn: '',
          note: ''
        },
        // 发货弹窗：只收物流公司，订单号从点中的行带过来
        deliverVisible: false,
        // 物流公司清单由服务端下发（loadDeliveryCompanies），前端不抄一份
        deliveryCompanies: [],
        deliverForm: {
          orderSn: '',
          deliveryCompany: ''
        },
        deliverRule: {
          deliveryCompany: [
            { required: true, message: '请选择物流公司', trigger: 'change' }
          ]
        }
      }
    },
    components: {
      OrderDetail
    },
    activated () {
      this.getDataList()
      // 选项只在第一次进入页面时拉一次
      if (this.statusOptions.length === 0) {
        this.loadStatusOptions()
      }
    },
    methods: {
      amountText,
      payTypeText,
      sourceTypeText,
      statusTagType,
      textOrDash,
      timeText,
      // 获取数据列表
      getDataList () {
        this.dataListLoading = true
        var params = {
          'page': this.pageIndex,
          'limit': this.pageSize,
          'key': this.dataForm.key,
          'status': this.dataForm.status,
          'deleteStatus': this.dataForm.deleteStatus
        }
        // 起止补足时分秒：只给日期的话结束日当天的订单会被整天排除
        if (this.dataForm.dateRange && this.dataForm.dateRange.length === 2) {
          params.startTime = this.dataForm.dateRange[0] + ' 00:00:00'
          params.endTime = this.dataForm.dateRange[1] + ' 23:59:59'
        }
        this.$http({
          url: this.$http.adornUrl('/order/order/list'),
          method: 'get',
          params: this.$http.adornParams(params)
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
      // 拉状态选项：筛选下拉的文案只此一份
      loadStatusOptions () {
        this.$http({
          url: this.$http.adornUrl('/order/order/status-options'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.statusOptions = data.data
          } else {
            this.$message.error(data.msg)
          }
        })
      },
      // 清空筛选条件并回到第一页
      resetQuery () {
        this.dataForm.key = ''
        this.dataForm.status = ''
        this.dataForm.dateRange = null
        this.dataForm.deleteStatus = ''
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
      },
      // 打开详情弹窗
      detailHandle (row) {
        this.detailVisible = true
        this.$nextTick(() => {
          this.$refs.orderDetail.init(row.orderSn)
        })
      },
      // 打开改备注弹窗
      noteHandle (row) {
        this.noteForm.orderSn = row.orderSn
        this.noteForm.note = row.note || ''
        this.noteVisible = true
      },
      // 保存备注
      noteSubmit () {
        this.$http({
          url: this.$http.adornUrl('/order/order/note'),
          method: 'post',
          data: this.$http.adornData({
            'orderSn': this.noteForm.orderSn,
            'note': this.noteForm.note
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.$message({
              message: '备注已保存',
              type: 'success',
              duration: 1500,
              onClose: () => {
                this.noteVisible = false
                this.getDataList()
              }
            })
          } else {
            this.$message.error(data.msg)
          }
        })
      },
      // 关闭订单：服务端会同时释放库存、退回优惠券，不可撤销
      closeHandle (row) {
        this.$confirm(`确定关闭订单[${row.orderSn}]？关闭后库存会释放、优惠券会退回，且不可撤销。`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl(`/order/order/close/${row.orderSn}`),
            method: 'post',
            data: this.$http.adornData()
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message({
                message: '订单已关闭',
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
      },
      // 硬删订单：不可逆，且只有会员标记过删除的订单能删
      removeHandle (row) {
        this.$confirm(`确定物理删除订单[${row.orderSn}]？订单项、支付流水与库存工作单会一并删除，不可恢复。`, '提示', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl(`/order/order/delete/${row.orderSn}`),
            method: 'post',
            data: this.$http.adornData()
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message({
                message: '订单已删除',
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
      },
      // 打开发货弹窗
      deliverHandle (row) {
        this.deliverForm.orderSn = row.orderSn
        this.deliverForm.deliveryCompany = row.deliveryCompany || ''
        this.deliverVisible = true
        // 清单只在第一次打开发货弹窗时拉一次
        if (this.deliveryCompanies.length === 0) {
          this.loadDeliveryCompanies()
        }
      },
      // 拉物流公司清单：选项只此一份，前端不抄
      loadDeliveryCompanies () {
        this.$http({
          url: this.$http.adornUrl('/order/order/delivery-companies'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.deliveryCompanies = data.data
          } else {
            this.$message.error(data.msg)
          }
        })
      },
      // 提交发货：成功只代表订单状态流转了，库存由仓库侧异步扣减
      deliverSubmit () {
        this.$refs['deliverForm'].validate((valid) => {
          if (valid) {
            this.$http({
              url: this.$http.adornUrl('/order/order/deliver'),
              method: 'post',
              data: this.$http.adornData({
                'orderSn': this.deliverForm.orderSn,
                'deliveryCompany': this.deliverForm.deliveryCompany
              })
            }).then(({data}) => {
              if (data && data.code === 0) {
                this.$message({
                  message: '发货成功',
                  type: 'success',
                  duration: 2000
                })
                this.deliverVisible = false
                this.getDataList()
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
