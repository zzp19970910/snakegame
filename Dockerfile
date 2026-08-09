# ============================================================
# 📦 前端 Dockerfile（构建前端镜像）
# 作用：把 HTML/CSS/JS 打包进 Nginx 镜像，形成一个网站服务器
# ============================================================

# 【基础镜像】用 Nginx 的 Alpine 版本
# - nginx 是官方高性能Web服务器
# - alpine 是超精简版Linux，体积小（只有几十MB），启动快
FROM nginx:alpine

# 【清理默认内容】删掉Nginx自带的默认欢迎页，避免冲突
RUN rm -rf /usr/share/nginx/html/*

# 【复制前端文件】把本机 frontend 文件夹里的所有内容
# 复制到容器里的网站根目录 /usr/share/nginx/html
COPY frontend /usr/share/nginx/html

# 【复制Nginx配置】把我们写的 nginx.conf 覆盖容器里的默认配置
COPY nginx.conf /etc/nginx/nginx.conf

# 【声明端口】告诉别人这个容器开放80端口（只是文档，不实际开端口）
# 真正的端口映射在 docker-compose.yml 的 ports 里
EXPOSE 80

# 【启动命令】容器运行时执行的命令
# - nginx 启动Nginx程序
# - -g "daemon off;" 意思是不要后台运行，而是在前台跑
#   （Docker容器必须有一个前台进程，否则容器会自动退出！）
CMD ["nginx", "-g", "daemon off;"]