#!/bin/sh
# ============================================================
# ⏳ Nginx 启动前的等待脚本
# 解决：Nginx 启动时找不到 backend（DNS还没准备好）就挂了
# 用法：在 Dockerfile 里替换默认 CMD
# ============================================================

set -e

echo "🚀 [entrypoint] 开始等待 backend 服务可用..."

# 超时时间（秒）
MAX_WAIT=120
WAIT_COUNT=0

# 循环检查 backend 的3000端口通不通（用 /bin/sh 最基础的 nc 或 wget）
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if wget -q -O- --timeout=2 --tries=1 http://backend:3000/api/health >/dev/null 2>&1; then
        echo "✅ [entrypoint] backend 已经准备好了！($WAIT_COUNT 秒后成功)"
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 2))
    echo "⏳ [entrypoint] 等待 backend... $WAIT_COUNT / $MAX_WAIT 秒"
    sleep 2
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "⚠️ [entrypoint] 等了 $MAX_WAIT 秒 backend 还是没好，强行启动 Nginx 试试吧..."
fi

echo "🌐 [entrypoint] 启动 Nginx..."
# 最后执行 Dockerfile 里原来的 CMD 命令（参数透传过来的 $@）
exec nginx -g "daemon off;"