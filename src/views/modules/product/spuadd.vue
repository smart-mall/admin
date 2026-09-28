<template>
  <div>
    <el-row>
      <el-col :span="24">
        <el-steps :active="step" finish-status="success">
          <el-step title="基本信息"></el-step>
          <el-step title="规格参数"></el-step>
          <el-step title="销售属性"></el-step>
          <el-step title="SKU信息"></el-step>
          <el-step title="保存完成"></el-step>
        </el-steps>
      </el-col>
      <el-col :span="24" v-show="step==0">
        <el-card class="box-card" style="width:80%;margin:20px auto">
          <el-form ref="spuBaseForm" :model="spu" label-width="120px" :rules="spuBaseInfoRules">
            <el-form-item label="商品名称" prop="spuName">
              <el-input v-model="spu.spuName"></el-input>
            </el-form-item>
            <el-form-item label="商品描述" prop="spuDescription">
              <el-input v-model="spu.spuDescription"></el-input>
            </el-form-item>
            <el-form-item label="选择分类" prop="catalogId">
              <category-cascader></category-cascader>
            </el-form-item>
            <el-form-item label="选择品牌" prop="brandId">
              <brand-select v-model="spu.brandId"></brand-select>
            </el-form-item>
            <el-form-item label="商品重量(Kg)" prop="weight">
              <el-input-number v-model.number="spu.weight" :min="0" :precision="3" :step="0.1"></el-input-number>
            </el-form-item>
            <el-form-item label="设置积分" prop="bounds">
              <label>金币</label>
              <el-input-number
                style="width:130px"
                placeholder="金币"
                v-model="spu.bounds.buyBounds"
                :min="0"
                controls-position="right"
              ></el-input-number>
              <label style="margin-left:15px">成长值</label>
              <el-input-number
                style="width:130px"
                placeholder="成长值"
                v-model="spu.bounds.growBounds"
                :min="0"
                controls-position="right"
              >
                <template slot="prepend">成长值</template>
              </el-input-number>
            </el-form-item>
            <el-form-item label="商品介绍" prop="description">
              <multi-upload v-model="spu.description"></multi-upload>
            </el-form-item>

            <el-form-item label="商品图集" prop="images">
              <multi-upload :show-file-list="false" @uploaded="handleImageUploaded"></multi-upload>
              <sortable-image-list
                :value="spu.images"
                radio-name="spu-default-image"
                @input="handleSpuImagesChange"
              ></sortable-image-list>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="collectSpuBaseInfo">下一步：设置基本参数</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="24" v-show="step===1">
        <el-card class="box-card" style="width:80%;margin:20px auto">
          <el-tabs tab-position="left" style="width:98%">
            <el-tab-pane
              :label="group.attrGroupName"
              v-for="(group,gidx) in dataResp.attrGroups"
              :key="group.attrGroupId"
            >
              <!-- 遍历属性,每个tab-pane对应一个表单，每个属性是一个表单项  spu.baseAttrs[0] = [{attrId:xx,val:}]-->
              <el-form ref="form" :model="spu">
                <el-form-item
                  :label="attr.attrName"
                  v-for="(attr,aidx) in group.attrs"
                  :key="attr.attrId"
                >
                  <el-input
                    v-model="dataResp.baseAttrs[gidx][aidx].attrId"
                    type="hidden"
                    v-show="false"
                  ></el-input>
                  <el-select
                    v-model="dataResp.baseAttrs[gidx][aidx].attrValues"
                    :multiple="attr.valueType===1"
                    filterable
                    allow-create
                    default-first-option
                    placeholder="请选择或输入值"
                  >
                    <el-option
                      v-for="(val,vidx) in attr.valueSelect.split(';')"
                      :key="vidx"
                      :label="val"
                      :value="val"
                    ></el-option>
                  </el-select>
                  <el-checkbox
                    v-model="dataResp.baseAttrs[gidx][aidx].showDesc"
                    :true-label="1"
                    :false-label="0"
                  >快速展示
                  </el-checkbox>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
          <div style="margin:auto">
            <el-button type="primary" @click="step = 0">上一步</el-button>
            <el-button type="success" @click="generateSaleAttrs">下一步：设置销售属性</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="24" v-show="step==2">
        <el-card class="box-card" style="width:80%;margin:20px auto">
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span>选择销售属性</span>
              <el-form ref="saleform" :model="spu">
                <el-form-item
                  :label="attr.attrName"
                  v-for="(attr,aidx) in dataResp.saleAttrs"
                  :key="attr.attrId"
                >
                  <el-input
                    v-model="dataResp.tempSaleAttrs[aidx].attrId"
                    type="hidden"
                    v-show="false"
                  ></el-input>
                  <el-checkbox-group v-model="dataResp.tempSaleAttrs[aidx].attrValues">
                    <el-checkbox
                      v-if="dataResp.saleAttrs[aidx].valueSelect !== ''"
                      :label="val"
                      v-for="val in dataResp.saleAttrs[aidx].valueSelect.split(';')"
                      :key="val"
                    ></el-checkbox>
                    <div style="margin-left:20px;display:inline">
                      <el-button
                        v-show="!inputVisible[aidx].view"
                        class="button-new-tag"
                        size="mini"
                        @click="showInput(aidx)"
                      >+自定义
                      </el-button>
                      <el-input
                        v-show="inputVisible[aidx].view"
                        v-model="inputValue[aidx].val"
                        :ref="'saveTagInput'+aidx"
                        size="mini"
                        style="width:150px"
                        @keyup.enter.native="handleInputConfirm(aidx)"
                        @blur="handleInputConfirm(aidx)"
                      ></el-input>
                    </div>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
            </div>
            <el-button type="primary" @click="step = 1">上一步</el-button>
            <el-button type="success" @click="generateSkus">下一步：设置SKU信息</el-button>
          </el-card>
        </el-card>
      </el-col>
      <el-col :span="24" v-show="step==3">
        <el-card class="box-card" style="width:80%;margin:20px auto">
          <el-table :data="spu.skus" style="width: 100%">
            <el-table-column label="属性组合">
              <el-table-column
                :label="item.attrName"
                v-for="(item,index) in dataResp.tableAttrColumn"
                :key="item.attrId"
              >
                <template slot-scope="scope">
                  <span style="margin-left: 10px">{{ scope.row.attr[index].attrValue }}</span>
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="商品名称" prop="skuName">
              <template slot-scope="scope">
                <el-input v-model="scope.row.skuName"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="标题" prop="skuTitle">
              <template slot-scope="scope">
                <el-input v-model="scope.row.skuTitle"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="副标题" prop="skuSubtitle">
              <template slot-scope="scope">
                <el-input v-model="scope.row.skuSubtitle"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="价格" prop="price">
              <template slot-scope="scope">
                <el-input v-model="scope.row.price"></el-input>
              </template>
            </el-table-column>
            <el-table-column type="expand">
              <template slot-scope="scope">
                <el-row>
                  <el-col :span="24">
                    <label style="display:block;float:left">选择图集 或</label>
                    <multi-upload
                      style="float:left;margin-left:10px;"
                      :show-file-list="false"
                      @uploaded="handleImageUploaded($event, scope.$index)"
                    ></multi-upload>
                    <div style="clear:both;padding-top:6px;font-size:12px;color:#909399">
                      勾选「选用」把图加进本 SKU，拖动卡片调整顺序，带「默认」的图是本 SKU 的主图
                    </div>
                  </el-col>
                  <el-col :span="24">
                    <el-divider></el-divider>
                  </el-col>
                  <el-col :span="24">
                    <sortable-image-list
                      v-model="scope.row.images"
                      show-select
                      :radio-name="'sku-default-image-' + scope.$index"
                    ></sortable-image-list>
                  </el-col>
                </el-row>
                <!-- 折扣，满减，会员价 -->
                <el-form :model="scope.row">
                  <el-row>
                    <el-col :span="24">
                      <el-form-item label="设置折扣">
                        <label>满</label>
                        <el-input-number
                          style="width:160px"
                          :min="0"
                          controls-position="right"
                          v-model="scope.row.fullCount"
                        ></el-input-number>
                        <label>件</label>

                        <label style="margin-left:15px;">打</label>
                        <el-input-number
                          style="width:160px"
                          v-model="scope.row.discount"
                          :precision="2"
                          :max="1"
                          :min="0"
                          :step="0.01"
                          controls-position="right"
                        ></el-input-number>
                        <label>折</label>
                        <el-checkbox
                          v-model="scope.row.countStatus"
                          :true-label="1"
                          :false-label="0"
                        >可叠加优惠
                        </el-checkbox>
                      </el-form-item>
                    </el-col>
                    <el-col :span="24">
                      <el-form-item label="设置满减">
                        <label>满</label>
                        <el-input-number
                          style="width:160px"
                          v-model="scope.row.fullPrice"
                          :step="100"
                          :min="0"
                          controls-position="right"
                        ></el-input-number>
                        <label>元</label>
                        <label style="margin-left:15px;">减</label>
                        <el-input-number
                          style="width:160px"
                          v-model="scope.row.reducePrice"
                          :step="10"
                          :min="0"
                          controls-position="right"
                        ></el-input-number>
                        <label>元</label>
                        <el-checkbox
                          v-model="scope.row.priceStatus"
                          :true-label="1"
                          :false-label="0"
                        >可叠加优惠
                        </el-checkbox>
                      </el-form-item>
                    </el-col>

                    <el-col :span="24">
                      <el-form-item label="设置会员价" v-if="scope.row.memberPrice.length>0">
                        <br/>
                        <!--   @change="handlePriceChange(scope,mpidx,$event)" -->
                        <el-form-item v-for="(mp,mpidx) in scope.row.memberPrice" :key="mp.id">
                          {{ mp.name }}
                          <el-input-number
                            style="width:160px"
                            v-model="scope.row.memberPrice[mpidx].price"
                            :precision="2"
                            :min="0"
                            controls-position="right"
                          ></el-input-number>
                        </el-form-item>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" @click="step = 2">上一步</el-button>
          <el-button type="success" @click="submitSkus">下一步：保存商品信息</el-button>
        </el-card>
      </el-col>
      <el-col :span="24" v-show="step==4">
        <el-card class="box-card" style="width:80%;margin:20px auto">
          <h1>保存成功</h1>
          <el-button type="primary" @click="addAgian">继续添加</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
// 这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
import CategoryCascader from '../common/category-cascader'
import BrandSelect from '../common/brand-select'
import MultiUpload from '@/components/upload/multiUpload'
import SortableImageList from '@/components/upload/sortableImageList'
import PubSub from 'pubsub-js'

export default {
  // import引入的组件需要注入到对象中才能使用
  components: {CategoryCascader, BrandSelect, MultiUpload, SortableImageList},
  props: {},
  data () {
    return {
      catPathSub: null,
      brandIdSub: null,
      uploadDialogVisible: false,
      step: 0,
      // spu_name  spu_description  catalog_id  brand_id  weight  publish_status
      spu: {
        // 要提交的数据
        spuName: '',
        spuDescription: '',
        catalogId: 0,
        brandId: '',
        weight: '',
        publishStatus: 0,
        description: [], // 商品详情
        // 商品图集，元素为 {imgName, imgUrl, defaultImg}；数组顺序就是落库的 imgSort
        images: [],
        bounds: {
          // 积分
          buyBounds: 0,
          growBounds: 0
        },
        baseAttrs: [], // 基本属性
        skus: [] // 所有sku信息
      },
      spuBaseInfoRules: {
        spuName: [
          {required: true, message: '请输入商品名字', trigger: 'blur'}
        ],
        spuDescription: [
          {required: true, message: '请编写一个简单描述', trigger: 'blur'}
        ],
        catalogId: [
          {required: true, message: '请选择一个分类', trigger: 'blur'}
        ],
        brandId: [
          {required: true, message: '请选择一个品牌', trigger: 'blur'}
        ],
        description: [
          {required: true, message: '请上传商品详情图集', trigger: 'blur'}
        ],
        images: [
          {required: true, message: '请上传商品图片集', trigger: 'blur'}
        ],
        weight: [
          {
            type: 'number',
            required: true,
            message: '请填写正确的重量值',
            trigger: 'blur'
          }
        ]
      },
      dataResp: {
        // 后台返回的所有数据
        attrGroups: [],
        baseAttrs: [],
        saleAttrs: [],
        tempSaleAttrs: [],
        tableAttrColumn: [],
        memberLevels: [],
        steped: [false, false, false, false, false]
      },
      inputVisible: [],
      inputValue: []
    }
  },
  computed: {},
  // 监控data中的数据变化
  watch: {},
  // 方法集合
  methods: {
    addAgian () {
      this.step = 0
      this.resetSpuData()
    },
    resetSpuData () {
      this.spu = {
        spuName: '',
        spuDescription: '',
        catalogId: 0,
        brandId: '',
        weight: '',
        publishStatus: 0,
        description: [],
        images: [],
        bounds: {
          buyBounds: 0,
          growBounds: 0
        },
        baseAttrs: [],
        skus: []
      }
    },
    handlePriceChange (scope, mpidx, e) {
      this.spu.skus[scope.$index].memberPrice[mpidx].price = e
    },
    getMemberLevels () {
      this.$http({
        url: this.$http.adornUrl('/member/memberlevel/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 500
        })
      })
        .then(({data}) => {
          this.dataResp.memberLevels = data.data.rows
        })
        .catch(e => {
          console.log(e)
        })
    },
    showInput (idx) {
      console.log('``````', this.view)
      this.inputVisible[idx].view = true
      // this.$refs['saveTagInput'+idx].$refs.input.focus();
    },
    // 商品图集的增删改与拖拽都从这里进：先补默认图，再换掉整份图集，最后让各 sku 的槽位对齐
    handleSpuImagesChange (images) {
      this.applyDefaultFallback(images)
      this.spu.images = images
      this.syncSkuImageSlots()
    },
    // 上传成功后把图并进商品图集；传了 skuIndex 说明是在某个 sku 里上传的，同时勾选进该 sku
    handleImageUploaded (info, skuIndex) {
      const url = info.url
      if (!this.spu.images.some(item => item.imgUrl === url)) {
        this.spu.images.push({
          imgName: info.name,
          imgUrl: url,
          defaultImg: 0
        })
      }
      this.applyDefaultFallback(this.spu.images)
      this.syncSkuImageSlots()
      if (skuIndex !== undefined && skuIndex !== null) {
        const slot = this.spu.skus[skuIndex].images.find(item => item.imgUrl === url)
        if (slot) {
          slot.selected = 1
        }
      }
    },
    // 一张都没标默认时把第一张设为默认，保证图集不会整组没有主图
    applyDefaultFallback (images) {
      if (images && images.length > 0 && !images.some(item => item.defaultImg === 1)) {
        this.$set(images[0], 'defaultImg', 1)
      }
    },
    /**
     * 让每个 sku 各持一份与商品图集同集合的槽位。
     *
     * 按 imgUrl 配对而不是按下标：图集在页面上可以拖拽换位，下标随时会变，
     * 按下标配对会让某个 sku 的勾选状态错挂到别的图上。
     * 已存在的槽位对象原样复用，勾选与默认标记因此得以保留。
     */
    syncSkuImageSlots () {
      this.spu.skus.forEach(sku => {
        const existed = new Map(sku.images.map(item => [item.imgUrl, item]))
        sku.images = this.spu.images.map(spuImg => {
          const slot = existed.get(spuImg.imgUrl)
          if (slot) {
            return slot
          }
          return {
            imgName: spuImg.imgName,
            imgUrl: spuImg.imgUrl,
            selected: 0,
            defaultImg: 0
          }
        })
      })
    },
    handleInputConfirm (idx) {
      let inputValue = this.inputValue[idx].val
      if (inputValue) {
        // this.dynamicTags.push(inputValue);
        if (this.dataResp.saleAttrs[idx].valueSelect === '') {
          this.dataResp.saleAttrs[idx].valueSelect = inputValue
        } else {
          this.dataResp.saleAttrs[idx].valueSelect += ';' + inputValue
        }
      }
      this.inputVisible[idx].view = false
      this.inputValue[idx].val = ''
    },
    collectSpuBaseInfo () {
      // spuBaseForm
      this.$refs.spuBaseForm.validate(valid => {
        if (valid) {
          this.step = 1
          this.showBaseAttrs()
        } else {
          return false
        }
      })
    },
    generateSaleAttrs () {
      // 把页面绑定的所有attr处理到spu里面,这一步都要做
      this.spu.baseAttrs = []
      this.dataResp.baseAttrs.forEach(item => {
        item.forEach(attr => {
          let {attrId, attrValues, showDesc} = attr
          // 跳过没有录入值的属性
          if (attrValues !== '') {
            if (attrValues instanceof Array) {
              // 多个值用;隔开
              attrValues = attrValues.join(';')
            }
            this.spu.baseAttrs.push({attrId, attrValues, showDesc})
          }
        })
      })
      console.log('baseAttrs', this.spu.baseAttrs)
      this.step = 2
      this.getShowSaleAttr()
    },
    generateSkus () {
      this.step = 3

      // 根据笛卡尔积运算进行生成sku
      let selectValues = []
      this.dataResp.tableAttrColumn = []
      this.dataResp.tempSaleAttrs.forEach(item => {
        if (item.attrValues.length > 0) {
          selectValues.push(item.attrValues)
          this.dataResp.tableAttrColumn.push(item)
        }
      })

      let descartes = this.descartes(selectValues)
      // [["黑色","6GB","移动"],["黑色","6GB","联通"],["黑色","8GB","移动"],["黑色","8GB","联通"],
      // ["白色","6GB","移动"],["白色","6GB","联通"],["白色","8GB","移动"],["白色","8GB","联通"],
      // ["蓝色","6GB","移动"],["蓝色","6GB","联通"],["蓝色","8GB","移动"],["蓝色","8GB","联通"]]
      console.log('生成的组合', JSON.stringify(descartes))
      // 有多少descartes就有多少sku
      let skus = []

      descartes.forEach((descar, descaridx) => {
        let attrArray = [] // sku属性组
        descar.forEach((de, index) => {
          // 构造saleAttr信息
          let saleAttrItem = {
            attrId: this.dataResp.tableAttrColumn[index].attrId,
            attrName: this.dataResp.tableAttrColumn[index].attrName,
            attrValue: de
          }
          attrArray.push(saleAttrItem)
        })
        // 会员价，也必须在循环里面生成，否则会导致数据绑定问题
        let memberPrices = []
        if (this.dataResp.memberLevels.length > 0) {
          for (let i = 0; i < this.dataResp.memberLevels.length; i++) {
            if (this.dataResp.memberLevels[i].priviledgeMemberPrice === 1) {
              memberPrices.push({
                id: this.dataResp.memberLevels[i].id,
                name: this.dataResp.memberLevels[i].name,
                price: 0
              })
            }
          }
        }
        // ;descaridx，判断如果之前有就用之前的值;
        let res = this.hasAndReturnSku(this.spu.skus, descar)
        if (res === null) {
          skus.push({
            attr: attrArray,
            skuName: this.spu.spuName + ' ' + descar.join(' '),
            price: 0,
            skuTitle: this.spu.spuName + ' ' + descar.join(' '),
            skuSubtitle: '',
            images: [],
            descar: descar,
            fullCount: 0,
            discount: 0,
            countStatus: 0,
            fullPrice: 0.0,
            reducePrice: 0.0,
            priceStatus: 0,
            memberPrice: [].concat(memberPrices)
          })
        } else {
          skus.push(res)
        }
      })
      this.spu.skus = skus
      // 刚生成的 sku 图集是空的，按商品图集补齐槽位
      this.syncSkuImageSlots()
      console.log('结果!!!', this.spu.skus, this.dataResp.tableAttrColumn)
    },
    // 判断如果包含之前的sku的descar组合，就返回这个sku的详细信息；
    hasAndReturnSku (skus, descar) {
      let res = null
      if (skus.length > 0) {
        for (let i = 0; i < skus.length; i++) {
          if (skus[i].descar.join(' ') === descar.join(' ')) {
            res = skus[i]
          }
        }
      }
      return res
    },
    getShowSaleAttr () {
      // 获取当前分类可以使用的销售属性
      if (!this.dataResp.steped[1]) {
        this.$http({
          url: this.$http.adornUrl(
            `/product/attr/sale/list/${this.spu.catalogId}`
          ),
          method: 'get',
          params: this.$http.adornParams({
            page: 1,
            limit: 500
          })
        }).then(({data}) => {
          this.dataResp.saleAttrs = data.data.rows
          data.data.rows.forEach(item => {
            this.dataResp.tempSaleAttrs.push({
              attrId: item.attrId,
              attrValues: [],
              attrName: item.attrName
            })
            this.inputVisible.push({view: false})
            this.inputValue.push({val: ''})
          })
          this.dataResp.steped[1] = true
        })
      }
    },
    showBaseAttrs () {
      if (!this.dataResp.steped[0]) {
        this.$http({
          url: this.$http.adornUrl(
            `/product/attrgroup/${this.spu.catalogId}/withattr`
          ),
          method: 'get',
          params: this.$http.adornParams({})
        }).then(({data}) => {
          // 先对表单的baseAttrs进行初始化
          data.data.forEach(item => {
            let attrArray = []
            item.attrs.forEach(attr => {
              attrArray.push({
                attrId: attr.attrId,
                attrValues: '',
                showDesc: attr.showDesc
              })
            })
            this.dataResp.baseAttrs.push(attrArray)
          })
          this.dataResp.steped[0] = 0
          this.dataResp.attrGroups = data.data
        })
      }
    },

    /**
     * 组装提交体：图集要转成后端契约的形状。
     *
     * 列表顺序即 img_sort，在这里按下标重新编号；sku 图集还要先滤掉没勾选「选用」的图。
     */
    buildSubmitPayload () {
      return {
        ...this.spu,
        images: this.normalizeImages(this.spu.images),
        skus: this.spu.skus.map(sku => ({
          ...sku,
          images: this.normalizeImages(sku.images.filter(item => item.selected === 1))
        }))
      }
    },
    // 只保留后端认识的四个字段，并保证本组恰好有一张默认图
    normalizeImages (images) {
      const normalized = images.map((item, index) => ({
        imgName: item.imgName,
        imgUrl: item.imgUrl,
        imgSort: index,
        defaultImg: item.defaultImg === 1 ? 1 : 0
      }))
      if (normalized.length > 0 && !normalized.some(item => item.defaultImg === 1)) {
        normalized[0].defaultImg = 1
      }
      return normalized
    },
    submitSkus () {
      const payload = this.buildSubmitPayload()
      console.log('~~~~~', JSON.stringify(payload))
      this.$confirm('将要提交商品数据，需要一小段时间，是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl('/product/spuinfo/save'),
            method: 'post',
            data: this.$http.adornData(payload, false)
          }).then(({data}) => {
            if (data.code === 0) {
              this.$message({
                type: 'success',
                message: '新增商品成功!'
              })
              this.step = 4
            } else {
              this.$message({
                type: 'error',
                message: '保存失败，原因【' + data.msg + '】'
              })
            }
          })
        })
        .catch(e => {
          console.log(e)
          this.$message({
            type: 'info',
            message: '已取消'
          })
        })
    },
    // 笛卡尔积运算
    descartes (list) {
      // parent上一级索引;count指针计数
      var point = {}

      var result = []
      var pIndex = null
      var tempCount = 0
      var temp = []

      // 根据参数列生成指针对象
      for (var index in list) {
        if (typeof list[index] === 'object') {
          point[index] = {parent: pIndex, count: 0}
          pIndex = index
        }
      }

      // 单维度数据结构直接返回
      if (pIndex === null) {
        return list
      }

      // 动态生成笛卡尔积
      while (true) {
        for (var index01 in list) {
          tempCount = point[index01]['count']
          temp.push(list[index01][tempCount])
        }

        // 压入结果数组
        result.push(temp)
        temp = []

        // 检查指针最大值问题
        while (true) {
          if (point[index01]['count'] + 1 >= list[index01].length) {
            point[index01]['count'] = 0
            pIndex = point[index01]['parent']
            if (pIndex === null) {
              return result
            }

            // 赋值parent进行再次检查
            index01 = pIndex
          } else {
            point[index01]['count']++
            break
          }
        }
      }
    }
  },
  // 生命周期创建完成（可以访问当前this实例）
  created () {
  },
  // 生命周期挂载完成（可以访问DOM元素）
  mounted () {
    this.catPathSub = PubSub.subscribe('catPath', (msg, val) => {
      this.spu.catalogId = val[val.length - 1]
    })
    this.brandIdSub = PubSub.subscribe('brandId', (msg, val) => {
      this.spu.brandId = val
    })
    this.getMemberLevels()
  },
  beforeCreate () {
  }, // 生命周期 创建之前
  beforeMount () {
  }, // 生命周期 挂载之前
  beforeUpdate () {
  }, // 生命周期 更新之前
  updated () {
  }, // 生命周期 更新之后
  beforeDestroy () {
    PubSub.unsubscribe(this.catPathSub)
    PubSub.unsubscribe(this.brandIdSub)
  },
  destroyed () {
  }, // 生命周期 销毁完成
  activated () {
  } // 如果页面有keep-alive缓存功能，这个函数会触发
}
</script>
<style scoped>
</style>
