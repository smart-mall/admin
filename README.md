# GrainMall · 后台管理前端

谷粒商城的后台管理界面：Vue 2 + Element UI，打包成 nginx 静态镜像，由后端仓库的 compose 发布在 56731。

## 启动

需要 Node 16（node-sass 6 的 binding 只到 Node 16）。

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:56731
```

接口地址在 `static/config/index.js` 的 `window.SITE_CONFIG['baseUrl']`，默认指向网关 `http://localhost:53000/api`。生产构建用 `npm run build`（gulp 打包，产物落在带时间戳的版本目录里）。

## 构建镜像

```bash
docker build -t grain-mall-admin:latest .
```

## 部署

在后端仓库执行：

```bash
docker compose -f gl-com.yml up -d gl-front-end
```
