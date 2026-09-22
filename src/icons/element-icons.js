/**
 * Element UI 图标字体的类名清单。
 *
 * 项目里同时存在两套图标，先分清再选：
 *
 *   1. 本地 SVG Sprite（src/icons/svg/*.svg）
 *      名字形如 shouye，模板里写 <icon-svg name="shouye"></icon-svg>，
 *      清单由 src/icons/index.js 的 getNameList() 用 require.context 自动产出。
 *      菜单管理用它。
 *
 *   2. Element UI 图标字体
 *      类名形如 el-icon-goods，模板里写 <i class="el-icon-goods"></i>。
 *      本文件负责它的清单。商品分类用它。
 *
 * 为什么要区分这两套：项目只 import 了一个主题 CSS
 * （src/element-ui-theme/element-#17B3A3/index.css），它带的图标有 70 个；而完整版
 * Element UI 2.8.2 的 lib/theme-chalk/icon.css 是 280 个 —— 也就是说这份主题是从
 * Element UI 1.x 生成的，2.x 新增的那批（el-icon-s-grid、el-icon-folder-opened、
 * el-icon-collection-tag 之类）在本项目里根本渲染不出来。
 *
 * 所以清单不能照 2.8.2 的文档写：那会给出 200 多个点下去看不见的图标。
 * 做法是扫当前已加载的样式表，拿到的是"此刻真的有字形"的集合。
 */

/**
 * 从选择器里取 el-icon 的类名。
 *
 * 这里刻意**不匹配伪元素**。踩过的坑：主题 CSS 源码里写的是 `.el-icon-info:before`，
 * 但浏览器按 CSSOM 规范序列化 `selectorText` 时会把它规范成 `.el-icon-info::before`
 * （双冒号）。所以按 ":before" 去匹配，一条都扫不到——表现为图标选择器一片空白，
 * 而 CSS 和字体本身完全正常。别再把这个正则改回去。
 *
 * 只要求类名，伪元素的判断交给下面的 content 检查。
 */
const ICON_CLASS = /\.el-icon-([a-z0-9][a-z0-9-]*)/

/** 收集一张样式表里的图标名 */
function collectFrom (sheet, names) {
  let rules
  try {
    rules = sheet.cssRules
  } catch (e) {
    // 跨域样式表读 cssRules 会抛 SecurityError。本项目的 element-ui 样式是随包打的
    // （src/element-ui-theme/index.js 里 import 的本地 css），同源可读；
    // 这里只是不让万一出现的外链样式表把整个功能带崩。
    return
  }
  if (!rules) return

  Array.prototype.forEach.call(rules, rule => {
    const selector = rule.selectorText
    if (!selector) return

    // 只认"真的定义了字形"的规则。Element UI 把图标字形写在
    // .el-icon-xxx:before{content:"\eXXX"} 里，所以有 content 才说明这个类名有图形；
    // 顺带把 .el-icon--right / .el-icon--left 这类只做排版、没有 content 的规则挡掉
    // （它们的类名也过不了上面正则的首字符约束）。
    if (!rule.style || !rule.style.content) return

    const matched = ICON_CLASS.exec(selector)
    if (matched) {
      names.add('el-icon-' + matched[1])
    }
  })
}

/**
 * 返回可用的 Element UI 图标类名，按字母升序。
 *
 * 扫描依赖样式表已经加载并解析完。调用点放在组件 `created()` 里是安全的：
 * 这个项目的 CSS 由 init.js 在 <head> 解析阶段就插进 <link>，而路由组件是异步 chunk，
 * 等它创建时样式表早已解析完（实测 app.css 的 cssRules 有 1841 条）。
 *
 * @returns {string[]} 例如 ['el-icon-arrow-down', 'el-icon-goods', ...]
 */
export function collectIconNames () {
  const names = new Set()

  const sheets = document.styleSheets || []
  Array.prototype.forEach.call(sheets, sheet => collectFrom(sheet, names))

  return Array.from(names).sort()
}
