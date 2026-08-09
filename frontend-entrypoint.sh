#!/bin/sh
# ============================================================
# 🚀 Nginx 启动前脚本「终极版」
# 现在 Nginx 已经用 resolver + set 变量动态解析了
# → 启动时完全不需要等 backend！有请求时再动态解析就行
# 唯一要做的：用 envsubst 把 nginx.conf 里的 $BACKEND_URL 换成真实地址
# ============================================================

set -e

echo "🌐 [entrypoint] Nginx 启动前处理..."

# 1. 检查 BACKEND_URL 环境变量
if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  [entrypoint] 警告：BACKEND_URL 环境变量为空！"
    echo "     请在 Render Dashboard 给 frontend 服务加环境变量 BACKEND_URL=https://你的backend.onrender.com"
    # 给个默认的，至少 Nginx 先能启动起来
    BACKEND_URL="http://127.0.0.1:3000"
fi
echo "📡 [entrypoint] 后端地址: $BACKEND_URL"

# 2. 用 envsubst 替换 nginx.conf 里的 $BACKEND_URL
#    -i 直接替换原文件，只替换 BACKEND_URL 这一个变量（保留其他 $ 变量）
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf
echo "✅ [entrypoint] nginx.conf 已注入 BACKEND_URL"

# 3. 直接启动 Nginx！不用等任何人！
echo "🚀 [entrypoint] 启动 Nginx..."
exec nginx -g "daemon off;"