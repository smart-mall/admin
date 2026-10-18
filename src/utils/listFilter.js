/**
 * 列表页筛选的即时生效能力，全局注册（见 main.js 的 Vue.mixin）。
 *
 * 全站 30 多个列表页的搜索表单都要这个行为。逐个 import + mixins 会把同一段代码抄几十遍，
 * 而且各页 script 的结构并不统一（有的一个 import 都没有、缩进从 0 到 2 空格都有），
 * 逐页往 script 里插代码比逐页在模板上加一个属性更容易改坏。
 *
 * 只提供方法：不碰 data、不挂生命周期。定时器存在模块级的 Map 里按组件 uid 索引，
 * 这样全局注册不会给每个组件实例（包括 Element UI 内部那几千个）多加一份响应式数据。
 */

/** 各组件待触发的防抖定时器，键为组件的 uid。 */
const timers = new Map()

/** 文本输入的防抖间隔：停下 300ms 才刷新，避免每敲一个字发一次请求。 */
const INPUT_DEBOUNCE_MS = 300

export default {
  methods: {
    /**
     * 下拉、日期等"选择类"筛选变化时立即刷新列表。
     */
    handleFilterChange () {
      this.reloadList()
    },

    /**
     * 文本输入变化时刷新列表，带防抖。
     *
     * 同一个组件上连续输入只保留最后一次：每次输入都先清掉上一个定时器。
     */
    handleFilterInput () {
      const uid = this._uid
      const pending = timers.get(uid)
      if (pending) {
        clearTimeout(pending)
      }

      timers.set(uid, setTimeout(() => {
        timers.delete(uid)
        // 组件已销毁就不能再调它的方法：打完字立刻切走页面会踩到这里
        if (this._isDestroyed) {
          return
        }
        this.reloadList()
      }, INPUT_DEBOUNCE_MS))
    },

    /**
     * 按当前筛选条件重新加载列表，两个 handler 最终都走这里。
     *
     * 页码必须复位到第 1 页：停在第 3 页时改筛选条件，新结果可能只有一页，
     * 不复位就会看到一张空列表，看起来像"筛选没生效"。
     *
     * 列表方法不叫 `getDataList`、或分页字段不叫 `pageIndex` 的页面覆盖本方法即可 ——
     * 目前只有两处：`order/refund.vue`（列表方法是 `getApplyList`）与
     * `product/spu.vue`（筛选面板，靠 `searchSpuInfo` 通知子组件）。
     */
    reloadList () {
      this.pageIndex = 1
      this.getDataList()
    }
  }
}
