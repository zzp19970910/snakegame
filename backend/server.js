// ============================================================
// 🚀 后端服务入口文件 (server.js)
// 功能：
//   1. 提供 3 个 HTTP API 接口（保存分数、取排行榜、查个人最高分）
//   2. 用 SQLite 数据库存分数数据（数据就是一个 .db 文件，不用单独装数据库）
// ============================================================

// ---------- 第1步：导入需要的库 ----------
const express = require('express');      // Express：写Web接口最常用的框架
const cors = require('cors');            // CORS：允许跨域请求（前后端不同源时用）
const Database = require('better-sqlite3'); // SQLite数据库操作库
const path = require('path');            // Node内置：处理文件路径
const fs = require('fs');                // Node内置：操作文件系统

// ---------- 第2步：初始化 Express 应用 ----------
const app = express();
const PORT = process.env.PORT || 3000;   // 端口：优先用环境变量，默认3000

// ---------- 第3步：准备数据库文件夹 ----------
// 数据库文件存 ./data 目录，如果文件夹不存在就创建
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    // recursive: true 意思是如果父目录也不存在，一起创建（类似 mkdir -p）
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------- 第4步：连接/创建 SQLite 数据库 ----------
// better-sqlite3 是同步API（写起来简单，不用async/await）
// 如果 snake.db 文件不存在，会自动创建一个空数据库
const db = new Database(path.join(DATA_DIR, 'snake.db'));

// ---------- 第5步：建表（如果还没建的话） ----------
// db.exec 执行 SQL 语句
db.exec(`
    -- 分数表 scores：存每一个玩家提交的分数
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 主键，自增ID
        nickname TEXT NOT NULL,                -- 玩家昵称（必填）
        score INTEGER NOT NULL,                -- 分数（必填）
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 提交时间，自动填当前时间
    );

    -- 索引：按分数倒序排
    -- 加了之后 SELECT ... ORDER BY score DESC 会快很多（排行榜查询）
    CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
`);

// ---------- 第6步：给 Express 加中间件 ----------
app.use(cors());                          // 允许跨域
app.use(express.json({ limit: '1mb' })); // 解析 JSON 请求体（提交分数时用），限制最多1MB

// ============================================================
// 📡 API 接口 1：健康检查
// 方法：GET /api/health
// 用途：监控用，看看服务是不是活着
// ============================================================
app.get('/api/health', (req, res) => {
    // process.uptime() 返回 Node进程已运行的秒数
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ============================================================
// 📡 API 接口 2：提交玩家分数
// 方法：POST /api/scores
// 请求体(JSON)：{ "nickname": "小明", "score": 120 }
// 返回：提交成功 + 当前排名
// ============================================================
app.post('/api/scores', (req, res) => {
    try {
        // 从请求体里取昵称和分数
        const { nickname, score } = req.body;

        // -------- 参数校验（防止乱提交） --------
        if (!nickname || typeof nickname !== 'string') {
            return res.status(400).json({ error: '昵称不能为空' });
        }
        if (nickname.length > 20) {
            return res.status(400).json({ error: '昵称最多20个字符' });
        }
        if (typeof score !== 'number' || score < 0 || score > 100000) {
            return res.status(400).json({ error: '分数不合法' });
        }

        // 简单的XSS防护：去掉 < > 字符，防止别人提交恶意HTML/JS代码
        const cleanNick = nickname.trim().replace(/[<>]/g, '');

        // -------- 写入数据库 --------
        // db.prepare 预编译SQL（防SQL注入，性能也更好）
        // ? 是占位符，run() 里的参数会按顺序替换进去
        const stmt = db.prepare('INSERT INTO scores (nickname, score) VALUES (?, ?)');
        const info = stmt.run(cleanNick, score);
        // info.lastInsertRowid 是刚插入那条数据的自增ID

        // -------- 算当前排名 --------
        // 思路：统计 "分数比我高的有多少人"，排名 = 这个数 + 1
        const rankStmt = db.prepare(`
            SELECT COUNT(*) as rank FROM scores WHERE score > ?
        `);
        const rankResult = rankStmt.get(score); // get() 取1条数据

        // 返回成功响应
        res.json({
            success: true,
            id: info.lastInsertRowid,
            nickname: cleanNick,
            score: score,
            rank: rankResult.rank + 1  // 排名从1开始
        });

    } catch (err) {
        // 出错了，打日志并返回500（服务器内部错误）
        console.error('Insert error:', err);
        res.status(500).json({ error: '保存失败，请稍后重试' });
    }
});

// ============================================================
// 📡 API 接口 3：获取排行榜（TOP N）
// 方法：GET /api/scores/top?limit=10
// 参数：limit=取前几名（默认10，最多50）
// 返回：按分数降序的排行榜列表 + 总上榜人数
// ============================================================
app.get('/api/scores/top', (req, res) => {
    try {
        // 取 limit 参数，默认10，最多50（防止一次取太多拖垮数据库）
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        // 查询排行榜：分数高的在前，同分则先提交的在前
        // .all(参数) 取所有匹配的行（返回数组）
        const rows = db.prepare(`
            SELECT id, nickname, score, created_at
            FROM scores
            ORDER BY score DESC, created_at ASC
            LIMIT ?
        `).all(limit);

        // 查询总共有多少条记录
        const total = db.prepare('SELECT COUNT(*) as c FROM scores').get().c;

        res.json({
            success: true,
            total: total,       // 总上榜人数
            count: rows.length, // 本次返回多少条
            data: rows          // 排行榜数组
        });

    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: '查询失败' });
    }
});

// ============================================================
// 📡 API 接口 4：查某个玩家的最高分
// 方法：GET /api/scores/my-best?nickname=小明
// 用途：前端可以显示"你的历史最高成绩"
// ============================================================
app.get('/api/scores/my-best', (req, res) => {
    try {
        const nickname = req.query.nickname;
        if (!nickname) {
            return res.status(400).json({ error: '缺少昵称参数' });
        }
        // 按分数降序，取第1条就是最高分
        const row = db.prepare(`
            SELECT id, nickname, score, created_at
            FROM scores
            WHERE nickname = ?
            ORDER BY score DESC
            LIMIT 1
        `).get(nickname);

        // 如果没有记录，返回 null（用 || 很方便）
        res.json({ success: true, data: row || null });

    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: '查询失败' });
    }
});

// ============================================================
// 兜底：访问不存在的路径，统一返回 404 JSON
// ============================================================
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// ============================================================
// 启动服务：监听 0.0.0.0:3000
// - 0.0.0.0 的意思是：监听所有网卡，局域网/容器外部都能访问
// - 如果只写 127.0.0.1，就只有本机自己能访问
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Snake Backend running on port ${PORT}`);
    console.log(`📁 Database: ${path.join(DATA_DIR, 'snake.db')}`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});