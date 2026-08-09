# ============================================================
# 📦 后端 Dockerfile（构建后端API镜像）
# 作用：打包 Node.js + Express + SQLite API 服务
# ============================================================

# 【基础镜像】Node.js 20 的 Alpine 版本
# - 20 是当前LTS（长期支持）稳定版
# - Alpine 体积小、安全
FROM node:20-alpine

# 【工作目录】设置容器内的"当前目录"
# 之后所有的 COPY/RUN 命令都以 /app 为基准
WORKDIR /app

# 【安装编译依赖】better-sqlite3 是原生模块，需要编译工具
# better-sqlite3 比 sqlite3 更快、更稳定，但安装时需要C++编译
# apk add 是 Alpine Linux 的包管理命令（类似Ubuntu的apt）
RUN apk add --no-cache python3 make g++

# 【先复制依赖清单】技巧：只复制package.json，利用Docker缓存
# 原理：如果 package.json 没变，下次构建就跳过 npm install 这一步，大大加速！
COPY package.json ./

# 【安装npm依赖】
# --omit=dev 只安装生产依赖，不安装开发依赖（如测试工具），减小体积
RUN npm install --omit=dev

# 【复制代码】再复制真正的业务代码
# （为什么后复制？因为代码经常改，但依赖很少变，这样能利用缓存）
COPY server.js ./

# 【创建数据目录】用于存放 SQLite 数据库文件
RUN mkdir -p /app/data

# 【声明数据卷】标记 /app/data 是持久化目录
# Docker 会把这个目录的内容存到数据卷里，容器删除重建也不丢数据
VOLUME ["/app/data"]

# 【声明端口】API服务跑在3000端口
EXPOSE 3000

# 【环境变量】告诉Node.js现在是生产环境，有些库会启用优化
ENV NODE_ENV=production

# 【启动命令】运行 node server.js 启动后端服务
# 用 JSON 数组格式（exec模式），这样信号传递正确，可以正常关闭
CMD ["node", "server.js"]