# ===================== 构建阶段 =====================
# node-sass 6.0.1 的预编译 binding 最高只支持 Node 16，必须用它构建
FROM node:16.20.2-bullseye-slim AS build
WORKDIR /build

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json package-lock.json ./
# SASS_BINARY_SITE: 容器内访问 GitHub 下 binding 会证书报错，走镜像源
# --legacy-peer-deps: sass-loader@6 的 peer 是 node-sass@^4，与项目实际用的 6 冲突
RUN SASS_BINARY_SITE=https://registry.npmmirror.com/-/binary/node-sass \
    npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ===================== 运行阶段 =====================
# 构建产物放入 nginx
FROM nginx:alpine
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80
