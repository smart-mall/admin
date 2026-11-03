<template>
  <div class="home">
    <!-- 顶部横幅 -->
    <section class="hero">
      <div class="hero__main">
        <h2 class="hero__title">谷粒商城 · 后台管理</h2>
        <p class="hero__sub">基于 Spring Cloud Alibaba 的微服务电商系统，统一网关接入，Nacos 做注册与配置，前后端分离部署。</p>
      </div>
      <div v-if="userName" class="hero__user">
        <span class="hero__user-label">当前登录</span>
        <span class="hero__user-name">{{ userName }}</span>
      </div>
    </section>

    <!-- 核心能力 -->
    <section class="cards">
      <div v-for="item in capabilities" :key="item.title" class="card">
        <div class="card__icon">
          <i :class="item.icon"></i>
        </div>
        <div class="card__body">
          <h4 class="card__title">{{ item.title }}</h4>
          <p class="card__desc">{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="panel">
      <h3 class="panel__title">技术栈</h3>
      <div v-for="group in stack" :key="group.name" class="stack">
        <span class="stack__name">{{ group.name }}</span>
        <div class="stack__tags">
          <el-tag v-for="tag in group.items" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
        </div>
      </div>
    </section>

    <!-- 请求链路 -->
    <section class="panel">
      <h3 class="panel__title">请求链路</h3>
      <div class="flow">
        <span class="flow__node">浏览器</span>
        <i class="el-icon-right flow__arrow"></i>
        <span class="flow__node">网关 · 路由与鉴权</span>
        <i class="el-icon-right flow__arrow"></i>
        <span class="flow__node">业务服务</span>
        <i class="el-icon-right flow__arrow"></i>
        <span class="flow__node">MySQL / Redis / ES / MQ / MinIO</span>
      </div>
      <p class="flow__desc">
        服务启动时注册到 Nacos，配置由配置中心下发；商城端与后台端走不同的鉴权通道，后台接口只对管理端开放。
      </p>
    </section>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        capabilities: [
          { icon: 'el-icon-goods', title: '商品与库存', desc: '分类、品牌、属性与 SPU/SKU 维护，库存与采购联动。' },
          { icon: 'el-icon-s-ticket', title: '营销', desc: '优惠券发放与核销，秒杀活动与库存预热。' },
          { icon: 'el-icon-s-order', title: '交易', desc: '下单、支付与订单状态流转，支持查询与管理。' },
          { icon: 'el-icon-user', title: '会员', desc: '会员信息、等级与成长值维护。' },
          { icon: 'el-icon-search', title: '搜索', desc: '商品数据同步到 Elasticsearch，支持检索与条件筛选。' },
          { icon: 'el-icon-setting', title: '系统', desc: '菜单、角色、用户与定时任务，动态菜单驱动路由。' }
        ],
        stack: [
          { name: '服务治理', items: ['Nacos', 'Spring Cloud Gateway', 'Sentinel', 'OpenFeign'] },
          { name: '数据与中间件', items: ['MySQL', 'Redis', 'Elasticsearch', 'RabbitMQ', 'MinIO'] },
          { name: '前端', items: ['Vue3 + Vite + TypeScript + Pinia', 'Vue2 + Element UI'] }
        ]
      }
    },
    computed: {
      userName () {
        return this.$store.state.user.name
      }
    }
  }
</script>

<style scoped>
.home {
  padding: 20px;
  line-height: 1.6;
  color: #303133;
}

/* 横幅 */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px;
  margin-bottom: 20px;
  border-radius: 6px;
  background: linear-gradient(135deg, #4a90e2 0%, #3a78c2 100%);
  color: #fff;
}

.hero__title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}

.hero__sub {
  margin: 0;
  max-width: 720px;
  font-size: 13px;
  opacity: 0.9;
}

.hero__user {
  flex: none;
  margin-left: 24px;
  padding: 8px 16px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.16);
  text-align: right;
}

.hero__user-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.hero__user-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
}

/* 能力卡片 */
.cards {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px 10px;
}

.card {
  display: flex;
  width: calc(33.333% - 20px);
  margin: 0 10px 20px;
  padding: 18px;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card__icon {
  flex: none;
  width: 44px;
  height: 44px;
  margin-right: 14px;
  border-radius: 50%;
  background: rgba(74, 144, 226, 0.08);
  color: #4a90e2;
  font-size: 22px;
  line-height: 44px;
  text-align: center;
}

.card__title {
  margin: 2px 0 6px;
  font-size: 15px;
  font-weight: 600;
}

.card__desc {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

/* 面板 */
.panel {
  margin-bottom: 20px;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.panel__title {
  margin: 0 0 16px;
  padding-left: 10px;
  border-left: 3px solid #4a90e2;
  font-size: 15px;
  font-weight: 600;
}

.stack {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
}

.stack:last-child {
  margin-bottom: 0;
}

.stack__name {
  flex: none;
  width: 100px;
  font-size: 13px;
  color: #909399;
  line-height: 24px;
}

.stack__tags .el-tag {
  margin: 0 8px 8px 0;
}

/* 请求链路 */
.flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.flow__node {
  padding: 6px 14px;
  border-radius: 4px;
  background: #f4f6f8;
  border: 1px solid #e4e7ed;
  font-size: 13px;
}

.flow__arrow {
  margin: 0 10px;
  color: #c0c4cc;
}

.flow__desc {
  margin: 14px 0 0;
  font-size: 13px;
  color: #606266;
}
</style>
