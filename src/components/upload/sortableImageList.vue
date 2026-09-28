<template>
  <div class="image-list">
    <div
      v-for="(img, index) in list"
      :key="img.imgUrl"
      class="image-list__item"
      :class="{
        'is-dragging': dragIndex === index,
        'is-target': dragOverIndex === index && dragIndex !== index
      }"
      draggable="true"
      @dragstart="handleDragStart(index)"
      @dragover.prevent="handleDragOver(index)"
      @dragleave="handleDragLeave(index)"
      @drop.prevent="handleDrop(index)"
      @dragend="handleDragEnd"
    >
      <img class="image-list__img" :src="img.imgUrl" :alt="img.imgName"/>
      <div class="image-list__footer">
        <span class="image-list__order">{{ index + 1 }}</span>
        <span class="image-list__name" :title="img.imgName">{{ img.imgName || '未命名' }}</span>
      </div>
      <div class="image-list__actions">
        <el-checkbox
          v-if="showSelect"
          v-model="img.selected"
          :true-label="1"
          :false-label="0"
          @change="handleSelectChange"
        >选用
        </el-checkbox>
        <label v-if="showDefault" class="image-list__default">
          <input
            type="radio"
            :name="radioName"
            :checked="img.defaultImg === 1"
            :disabled="showSelect && img.selected !== 1"
            @change="handleDefaultChange(index)"
          />
          默认
        </label>
        <el-button type="text" size="mini" @click="handleRemove(index)">删除</el-button>
      </div>
    </div>
    <div v-if="list.length === 0" class="image-list__empty">还没有图片，先在上方上传</div>
  </div>
</template>

<script>
/**
 * 可拖拽排序的图集卡片列表，spu 图集与 sku 图集共用。
 *
 * 列表顺序即落库的 img_sort：本组件不维护 imgSort 字段，调用方在提交前按下标重新编号，
 * 这样拖拽过程中不会出现「顺序变了但 sort 没跟上」的中间状态。
 *
 * 组件不做任何请求，只对传入数组做增删改后整体 emit，因此无状态、可多实例并存。
 */
export default {
  name: 'SortableImageList',
  props: {
    /** 图集，元素含 imgName、imgUrl、defaultImg，showSelect 为真时还需 selected。 */
    value: {
      type: Array,
      default: () => []
    },
    /** 是否显示「选用」勾选框：sku 图集要从 spu 图集里挑子集时才需要。 */
    showSelect: {
      type: Boolean,
      default: false
    },
    /** 是否显示「默认」单选。 */
    showDefault: {
      type: Boolean,
      default: true
    },
    /**
     * 单选组的 name。
     *
     * 同一页面上多组图集必须各不相同：原生 radio 的互斥范围是整个文档，
     * 重名会导致在一个 sku 里选默认图时把另一个 sku 的选择顶掉。
     */
    radioName: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      dragIndex: -1,
      dragOverIndex: -1
    }
  },
  computed: {
    list () {
      return this.value || []
    }
  },
  methods: {
    handleDragStart (index) {
      this.dragIndex = index
    },
    // 模板上必须带 .prevent：不阻止默认行为浏览器就不认这个元素为放置目标，drop 不会触发
    handleDragOver (index) {
      this.dragOverIndex = index
    },
    handleDragLeave (index) {
      if (this.dragOverIndex === index) {
        this.dragOverIndex = -1
      }
    },
    handleDrop (index) {
      this.move(this.dragIndex, index)
    },
    handleDragEnd () {
      this.dragIndex = -1
      this.dragOverIndex = -1
    },
    move (from, to) {
      if (from < 0 || to < 0 || from === to) {
        return
      }
      const list = this.clone()
      const moved = list.splice(from, 1)[0]
      list.splice(to, 0, moved)
      this.emit(list)
    },
    handleDefaultChange (index) {
      const list = this.clone()
      list.forEach((item, idx) => {
        item.defaultImg = idx === index ? 1 : 0
      })
      this.emit(list)
    },
    // 勾选状态由 v-model 直接写进元素对象，这里只需把整组收敛后重新抛出
    handleSelectChange () {
      this.emit(this.clone())
    },
    handleRemove (index) {
      const list = this.clone()
      list.splice(index, 1)
      this.emit(list)
    },
    // 克隆元素再改：入参数组与其中的对象都归调用方所有，直接改会让父子共享同一份状态
    clone () {
      return this.list.map(item => ({ ...item }))
    },
    /**
     * 收敛默认图后抛出整份列表。
     *
     * 一次用户操作可能刚好把默认图取消勾选，此时本组就一张默认图都不剩，
     * 必须补第一张，否则 sku 会存出没有主图的图集。
     */
    emit (list) {
      const scope = this.showSelect ? list.filter(item => item.selected === 1) : list
      if (scope.length > 0 && !scope.some(item => item.defaultImg === 1)) {
        scope[0].defaultImg = 1
      }
      this.$emit('input', list)
    }
  }
}
</script>

<style scoped>
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-list__item {
  width: 170px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  cursor: move;
}

.image-list__item.is-dragging {
  opacity: 0.4;
}

.image-list__item.is-target {
  border-color: #409eff;
}

.image-list__img {
  display: block;
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.image-list__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: #606266;
}

.image-list__order {
  flex: none;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
}

.image-list__name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.image-list__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 6px;
}

.image-list__default {
  font-size: 12px;
  color: #606266;
  cursor: pointer;
}

.image-list__empty {
  font-size: 12px;
  color: #909399;
}
</style>
