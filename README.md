# 🐍 贪吃蛇全栈游戏 - 项目文档

> Docker + Nginx + Node.js + Express + SQLite + HTML5 Canvas 实战项目

---

## 📋 目录

1. [项目简介](#1-项目简介)
2. [技术架构](#2-技术架构)
3. [目录结构](#3-目录结构)
4. [快速启动](#4-快速启动)
5. [API 接口文档](#5-api-接口文档)
6. [前端功能说明](#6-前端功能说明)
7. [后端工作原理](#7-后端工作原理)
8. [Docker 核心知识](#8-docker-核心知识)
9. [公网部署方案](#9-公网部署方案)
10. [常见问题排查](#10-常见问题排查)
11. [扩展玩法](#11-扩展玩法)

---

## 1. 项目简介

这是一个**完整的全栈小游戏项目**，包含：
- 🎮 用 HTML5 Canvas 写的贪吃蛇游戏（支持电脑+手机）
- 🏆 全网排行榜系统，玩家可以提交分数并查看排名
- 💾 SQLite 数据库持久化存储（数据不会因为重启容器丢失）
- 🐳 Docker Compose 一键部署（包含 Nginx 反向代理）
- 📱 移动端适配（虚拟方向键 + 滑动手势）

### 适合学习的点
- Docker / Docker Compose 的实际使用
- 前后端分离架构 + Nginx 反向代理
- Node.js Express 写 API 接口
- SQLite 文件型数据库
- 前端 Canvas 游戏开发
- 响应式网页 + 移动端适配

---

## 2. 技术架构

```
                    浏览器 (http://localhost:8080)
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Nginx 反向代理    │ 端口: 80 (容器内)
                    │   - 托管静态文件    │ 端口: 8080 (映射到主机)
                    │   - 转发 /api 请求 │
                    └──────┬──────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
   /api/*  请求                     其他请求
            │                             │
            ▼                             ▼
  ┌──────────────────┐          返回 HTML/CSS/JS
  │ Node.js Express  │
  │   后端 API 服务  │ 端口: 3000 (仅内部网络)
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │  SQLite 数据库   │ 文件: /app/data/snake.db
  │  (snake-data 卷) │ 存储在 Docker Volume
  └──────────────────┘
```

### 为什么用 Nginx 反向代理？
| 好处 | 说明 |
|------|------|
| ✅ 解决跨域 | 前端和API同一个域名，不用处理CORS问题 |
| ✅ 静态加速 | Nginx处理静态文件比Node.js快得多 |
| ✅ 安全隔离 | 后端3000端口不暴露给公网，只能Nginx访问 |
| ✅ Gzip压缩 | 自动压缩JS/CSS，减少传输体积 |
| ✅ 负载均衡 | 以后加后端实例，Nginx可以分发请求 |

---

## 3. 目录结构

```
myWeb/
│
├── 📂 frontend/              # 【前端】游戏页面
│   ├── index.html            #   HTML结构 + 弹窗DOM
│   ├── style.css             #   样式 + 响应式 + 移动端适配
│   └── game.js               #   游戏逻辑 + Canvas渲染 + API调用
│
├── 📂 backend/               # 【后端】Node.js API 服务
│   ├── Dockerfile            #   后端镜像构建文件
│   ├── package.json          #   npm 依赖清单
│   ├── package-README.txt    #   ✨ 每个依赖库的解释
│   └── server.js             #   ✨ Express 4个API接口 + SQLite
│
├── nginx.conf                # 【Nginx配置】反向代理规则
├── Dockerfile                # 【前端镜像】Nginx + 静态文件
├── docker-compose.yml        # ✨ ⭐ 核心文件：一键编排启动
└── README.md                 # 【本文件】你正在看的文档
```

---

## 4. 快速启动

### ⚠️ 前提条件
1. **Windows 电脑**
2. **Docker Desktop 已安装**（桌面蓝色鲸鱼图标）
   - 如果没装，去官网下载：https://www.docker.com/products/docker-desktop/
   - 安装时勾选 WSL2（推荐）

---

### 🚀 启动步骤（3步）

#### 第1步：启动 Docker Desktop
双击桌面 **Docker Desktop** 图标，等右下角图标从黄色变成绿色（Running状态）。

#### 第2步：打开 PowerShell，进入项目目录
```powershell
cd f:\docker\docker\myWeb
```

#### 第3步：运行一键启动命令
```powershell
docker-compose up -d --build
```

参数解释：
- `up` = 创建并启动容器
- `-d` = 后台运行（detached模式，不占着终端）
- `--build` = 每次启动前重新构建镜像（代码改了必须加这个）

**第一次运行会慢一点**（5~15分钟，取决于网速），因为要下载：
- Node.js 20 Alpine 镜像 (~100MB)
- Nginx Alpine 镜像 (~50MB)
- 还要编译 better-sqlite3 原生模块

之后再启动就几秒的事。

---

### ✅ 验证启动成功

打开浏览器，依次测试：

| 测试项 | 访问地址 | 期望结果 |
|--------|----------|----------|
| 🎮 游戏页面 | http://localhost:8080 | 看到贪吃蛇界面 |
| ❤️ API健康 | http://localhost:8080/api/health | `{"status":"ok",...}` |
| 🏆 排行榜 | http://localhost:8080/api/scores/top | `{"success":true,...}` |

**如果正常**：玩一把游戏 → 结束输入昵称 → 点「🏆 排行」看能不能看到自己的分数。

---

### 🛑 常用命令

```powershell
# 查看运行状态
docker-compose ps

# 查看实时日志（排查问题神器！）
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 停止服务（保留数据）
docker-compose down

# 停止 + 删掉数据库（危险！清榜慎用）
docker-compose down -v
```

---

## 5. API 接口文档

后端一共 4 个接口，全部返回 JSON 格式。

### 5.1 健康检查
```
GET /api/health
```

**响应示例：**
```json
{ "status": "ok", "uptime": 123.456 }
```

---

### 5.2 提交分数
```
POST /api/scores
Content-Type: application/json

请求体：
{
  "nickname": "小明",
  "score": 120
}
```

**校验规则：**
- 昵称不能为空，最多20个字符
- 分数必须是 0 ~ 100000 的数字
- 自动剔除 `<` `>` 字符（防XSS注入）

**成功响应：**
```json
{
  "success": true,
  "id": 5,
  "nickname": "小明",
  "score": 120,
  "rank": 3
}
```
`rank = 3` 表示玩家排在第 3 名。

---

### 5.3 获取排行榜 TOP N
```
GET /api/scores/top?limit=10
```
- `limit` 参数：取前几名，默认10，最大50

**成功响应：**
```json
{
  "success": true,
  "total": 42,
  "count": 10,
  "data": [
    { "id": 1, "nickname": "王者", "score": 9999, "created_at": "2024-01-15 10:30:00" },
    { "id": 8, "nickname": "大神", "score": 6666, "created_at": "2024-01-15 11:20:00" },
    ...
  ]
}
```
排序规则：分数高 → 低；同分的话，先提交的排前面。

---

### 5.4 查询某玩家的最高分
```
GET /api/scores/my-best?nickname=小明
```

**成功响应（有记录）：**
```json
{
  "success": true,
  "data": { "id": 5, "nickname": "小明", "score": 120, "created_at": "..." }
}
```

**成功响应（无记录）：**
```json
{ "success": true, "data": null }
```

---

## 6. 前端功能说明

### 🎮 操作方式

| 设备 | 控制方式1 | 控制方式2 |
|------|----------|----------|
| 💻 电脑 | ⬆️⬇️⬅️➡️ 方向键 | W A S D 键 |
| 📱 手机 | 屏幕下方的虚拟方向键 | 在画布上滑动手指 |

### 🎨 UI 交互

1. **昵称输入框**：页面顶部的输入框，填一次自动保存到浏览器
2. **🏆 排行按钮**：点击弹出全网TOP10排行榜
3. **游戏结束弹窗**：
   - 显示本局得分
   - 输入昵称后「提交分数」按钮上榜
   - 提交成功显示当前排名
4. **本地最高分**：存在浏览器 localStorage，换电脑会变（但服务器排行榜不变）

---

## 7. 后端工作原理

### 数据库表结构（scores 表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键，每条记录唯一ID |
| nickname | TEXT NOT NULL | 玩家昵称 |
| score | INTEGER NOT NULL | 本局分数 |
| created_at | DATETIME | 提交时间，默认当前时间 |

**索引**：`idx_scores_score` 在 `score` 字段上建索引（倒序），排行榜查询更快。

### 排名计算逻辑

不是用 ROW_NUMBER() 窗口函数，而是更简单的方法：
```
排名 = 分数比我高的人数 + 1
```

SQL：`SELECT COUNT(*) as rank FROM scores WHERE score > ?`

优点：简单、快。缺点：同分排名不连续（比如两个100分都是第1名，下一个80分是第3名），但对小游戏完全够用。

---

## 8. Docker 核心知识

### 8.1 什么是镜像（Image）？
> 镜像 = 打包好的「只读模板」，包含运行程序需要的一切（代码+环境+依赖）
>
> 就像「Windows系统安装盘」.iso 文件

```powershell
# 查看本地有哪些镜像
docker images
```

### 8.2 什么是容器（Container）？
> 容器 = 镜像跑起来后的「实例」，是隔离的轻量虚拟机
>
> 就像「安装好系统的电脑」，一个镜像可以启动无数个容器

```powershell
# 查看正在运行的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a
```

### 8.3 什么是数据卷（Volume）？
> 数据卷 = Docker 专门存持久化数据的「保险箱」
>
> 容器是临时的（删了就没了），但数据卷里的内容会一直保留！

本项目用 `snake-data` 数据卷存 SQLite 数据库文件。即使你：
```powershell
docker-compose down    # 删掉所有容器
docker-compose up -d   # 重新启动
```
你的排行榜数据**完全不会丢**！

⚠️ 只有加了 `-v` 参数才会删除卷：
```powershell
docker-compose down -v  # 危险！排行榜全没了！
```

### 8.4 什么是 Docker Compose？
> Docker Compose 是「一键编排工具」，把启动多个容器的命令写成配置文件。

本项目一次要启动两个容器（Nginx + Node），还要创建网络和数据卷。如果用纯docker命令需要敲很多次，`docker-compose.yml` 把这些全写好，一条命令全部搞定。

---

## 9. 公网部署方案

本地跑起来了，但朋友访问不了。下面是几种免费/便宜的部署方式。

### 方案A：Render.com（⭐ 最推荐，真·全免费）
支持 Docker Compose，直接连 GitHub 自动部署。

**步骤：**
1. 把整个 `myWeb` 文件夹上传到 GitHub 仓库（Public/Private都行）
2. 打开 https://render.com → 用 GitHub 登录
3. 点击 **New +** → **Blueprint** → 选择你的仓库
4. Render 自动解析 `docker-compose.yml`，点 **Apply**
5. 等几分钟就好了，给你一个 `xxx.onrender.com` 的域名

免费套餐额度：
- 750小时/月（够个人项目24小时跑）
- 512MB RAM
- 数据库磁盘：免费版用实例磁盘（重启清数据，不介意可以用，介意就挂Render Disk）

---

### 方案B：Railway.app
和 Render 类似，新用户送 $5 额度，够用好几个月。

**步骤：**
1. 打开 https://railway.app
2. New Project → Deploy from GitHub repo
3. 选你的仓库，自动检测 Docker，设置端口8080
4. 添加 Volume 挂载到 `/app/data`（持久化数据库）

---

### 方案C：前端 Netlify + 后端 Render（分离部署）
- **前端**：直接把 `frontend` 文件夹拖到 https://app.netlify.com/drop（秒好）
- **backend 文件夹**：单独推到 GitHub，用 Render 只部署后端
- **修改前端代码**：把 `frontend/game.js` 第一行改成：
  ```javascript
  const API_BASE = 'https://你的后端地址.onrender.com/api';
  ```

优点：Netlify 前端全球CDN快，Render管后端，各司其职。

---

### 方案D：自己买云服务器（进阶）
阿里云/腾讯云轻量服务器，几十块一个月：
1. 装 Docker + Docker Compose
2. 代码上传到服务器（git clone / scp）
3. `docker-compose up -d --build`
4. 开放服务器安全组的 8080 端口
5. 买个域名解析过来，再配 Nginx + HTTPS（Certbot）

---

## 10. 常见问题排查

### ❌ 问题1：`no configuration file provided: not found`
**原因**：运行命令的目录不对，`docker-compose.yml` 不在当前目录

**解决**：
```powershell
cd f:\docker\docker\myWeb
docker-compose up -d --build
```

---

### ❌ 问题2：`docker daemon is not running`
**原因**：Docker Desktop 没启动

**解决**：双击桌面 Docker Desktop，等右下角图标变绿再试。

---

### ❌ 问题3：端口被占用 `Bind for 0.0.0.0:8080 failed: port is already allocated`
**原因**：8080端口被别的程序占了（比如Tomcat、其他Docker容器）

**解决**：改 `docker-compose.yml` 的端口映射：
```yaml
ports:
  - "8081:80"    # 改成 8081 或其他没被占的端口
```
然后重新 `docker-compose up -d --build`，访问 http://localhost:8081

---

### ❌ 问题4：构建后端时 npm install 报错（better-sqlite3 编译失败）
**常见报错**：`No prebuilt binaries found`

**原因**：网络问题导致预编译包下载失败，fallback到本地编译但缺工具。

**解决1（推荐）**：配置npm淘宝镜像，重试
```powershell
# 先停止
docker-compose down

# 删掉旧镜像（强制重新构建）
docker rmi myweb-backend myweb-frontend

# 设置npm镜像，重新build
docker-compose build --no-cache backend
docker-compose up -d
```

**解决2**：检查网络，开代理/挂梯子再试（better-sqlite3 从 GitHub release 下载预编译包）。

---

### ❌ 问题5：提交分数时提示「提交失败：网络错误」
**排查步骤**：
1. F12 打开浏览器开发者工具 → Network（网络）标签
2. 提交分数，看请求的状态码
   - **红色/没响应**：后端挂了，看日志 `docker-compose logs -f backend`
   - **400 Bad Request**：参数问题（昵称为空/分数不对，直接看响应JSON有提示）
   - **500 Internal Error**：数据库异常，看后端日志
3. 直接访问 http://localhost:8080/api/health 看是不是返回 ok

---

### ❌ 问题6：改了代码但没生效
**重要**：改了任何代码，必须**重新构建**！
```powershell
docker-compose up -d --build
# 或者
docker-compose restart    # 这个不会重新构建，改了代码没用
```

---

## 11. 扩展玩法

觉得这个项目太简单？下面这些可以自己加：

### 🍼 简单难度
1. **换主题配色**：改 `style.css` 的渐变颜色
2. **调节速度**：改 `game.js` 里 `setInterval(update, 100)`，数字越小越快
3. **食物多样化**：加金色食物（50分）、毒蘑菇（扣分）
4. **障碍物**：画布中间加固定障碍墙

### 🔥 中等难度
5. **账号系统**：加注册/登录（用 SQLite 存用户表，密码用 bcrypt 加密）
6. **个人战绩页**：某昵称的历史所有分数、平均分、最高/最低分
7. **实时排行榜**：用 WebSocket 推送，有人上榜立刻更新
8. **地图编辑器**：玩家自定义障碍物，生成关卡码分享

### 🚀 高难度
9. **多人对战**：用 Socket.io 做房间系统，多个人同屏PK
10. **回放系统**：记录每一步操作，游戏结束可以看回放
11. **服务端反作弊**：把每一步蛇的位置同步给后端，后端校验路径合法性（防止前端改分数）
12. **AI 自动玩蛇**：写一个BFS/贪心/强化学习的AI，自动跑贪吃蛇

---

## 🎉 恭喜你完成了！

从一个空文件夹，到完整的全栈 Docker 项目，你已经学会了：
- ✅ HTML5 Canvas 游戏开发
- ✅ 移动端适配和触摸处理
- ✅ Node.js Express 写 RESTful API
- ✅ SQLite 数据库设计和操作
- ✅ 参数校验、防注入等安全意识
- ✅ Docker 镜像构建和分层缓存
- ✅ Docker Compose 多容器编排
- ✅ Nginx 反向代理和静态资源托管
- ✅ 数据持久化和 Volume 原理
- ✅ 全项目文档编写

有问题随时回来看看这个文档，或者继续加功能升级你的游戏！🐍🚀

---

*文档生成时间：2026-08-09*