const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const dpadBtns = document.querySelectorAll('.dpad-btn');
const nicknameInput = document.getElementById('nickname');
const rankBtn = document.getElementById('rankBtn');
const submitModal = document.getElementById('submitModal');
const rankModal = document.getElementById('rankModal');
const finalScoreEl = document.getElementById('finalScore');
const rankInfoEl = document.getElementById('rankInfo');
const submitNickInput = document.getElementById('submitNick');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const submitTipEl = document.getElementById('submitTip');
const closeModalBtn = document.getElementById('closeModal');
const closeRankBtn = document.getElementById('closeRankModal');
const rankListEl = document.getElementById('rankList');
const totalCountEl = document.getElementById('totalCount');

const API_BASE = '/api';
const baseSize = 400;
const gridSize = 20;
const tileCount = baseSize / gridSize;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let isPaused = false;
let gameStarted = false;
let changingDirection = false;
let lastFinalScore = 0;
let submittedThisRound = false;

let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30;

highScoreElement.textContent = highScore;
nicknameInput.value = localStorage.getItem('snakeNickname') || '';

nicknameInput.addEventListener('input', () => {
    localStorage.setItem('snakeNickname', nicknameInput.value.trim());
});

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const maxWidth = Math.min(wrapper.clientWidth, baseSize);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = baseSize * dpr;
    canvas.height = baseSize * dpr;
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = maxWidth + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    submittedThisRound = false;
    scoreElement.textContent = score;
    generateFood();
    draw();
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, baseSize, baseSize);

    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, baseSize);
        ctx.stroke();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(baseSize, i * gridSize);
        ctx.stroke();
    }

    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    snake.forEach((segment, index) => {
        const gradient = ctx.createLinearGradient(
            segment.x * gridSize,
            segment.y * gridSize,
            (segment.x + 1) * gridSize,
            (segment.y + 1) * gridSize
        );

        if (index === 0) {
            gradient.addColorStop(0, '#2ed573');
            gradient.addColorStop(1, '#1e90ff');
        } else {
            const alpha = 1 - (index / snake.length) * 0.5;
            gradient.addColorStop(0, `rgba(46, 213, 115, ${alpha})`);
            gradient.addColorStop(1, `rgba(30, 144, 255, ${alpha})`);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
            4
        );
        ctx.fill();

        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = 3;
            let eyeOffsetX1, eyeOffsetY1, eyeOffsetX2, eyeOffsetY2;

            if (dx === 1) {
                eyeOffsetX1 = 12; eyeOffsetY1 = 5;
                eyeOffsetX2 = 12; eyeOffsetY2 = 13;
            } else if (dx === -1) {
                eyeOffsetX1 = 4; eyeOffsetY1 = 5;
                eyeOffsetX2 = 4; eyeOffsetY2 = 13;
            } else if (dy === 1) {
                eyeOffsetX1 = 5; eyeOffsetY1 = 12;
                eyeOffsetX2 = 13; eyeOffsetY2 = 12;
            } else {
                eyeOffsetX1 = 5; eyeOffsetY1 = 4;
                eyeOffsetX2 = 13; eyeOffsetY2 = 4;
            }

            ctx.beginPath();
            ctx.arc(segment.x * gridSize + eyeOffsetX1, segment.y * gridSize + eyeOffsetY1, eyeSize, 0, Math.PI * 2);
            ctx.arc(segment.x * gridSize + eyeOffsetX2, segment.y * gridSize + eyeOffsetY2, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + eyeOffsetX1, segment.y * gridSize + eyeOffsetY1, eyeSize / 2, 0, Math.PI * 2);
            ctx.arc(segment.x * gridSize + eyeOffsetX2, segment.y * gridSize + eyeOffsetY2, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function update() {
    if (isPaused || !gameStarted) return;

    changingDirection = false;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        generateFood();
    } else {
        snake.pop();
    }

    draw();
}

function gameOver() {
    gameStarted = false;
    clearInterval(gameLoop);
    gameLoop = null;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, baseSize, baseSize);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', baseSize / 2, baseSize / 2 - 20);

    ctx.font = '18px Arial';
    ctx.fillText(`得分: ${score}`, baseSize / 2, baseSize / 2 + 20);
    ctx.fillText('弹窗内提交分数上榜', baseSize / 2, baseSize / 2 + 55);

    lastFinalScore = score;
    showSubmitModal();
}

function showSubmitModal() {
    finalScoreEl.textContent = lastFinalScore;
    rankInfoEl.textContent = '';
    submitTipEl.textContent = '';
    submitTipEl.className = 'submit-tip';
    submittedThisRound = false;

    const savedNick = localStorage.getItem('snakeNickname') || '';
    submitNickInput.value = savedNick;

    if (lastFinalScore === 0) {
        submitTipEl.textContent = '0分无法上榜哦~';
        submitTipEl.className = 'submit-tip error';
        submitScoreBtn.disabled = true;
    } else {
        submitScoreBtn.disabled = false;
    }

    submitModal.classList.remove('hidden');
}

async function submitScore() {
    if (submittedThisRound) return;

    const nickname = (submitNickInput.value || '').trim();
    if (!nickname) {
        submitTipEl.textContent = '请输入昵称~';
        submitTipEl.className = 'submit-tip error';
        return;
    }

    submitScoreBtn.disabled = true;
    submitTipEl.textContent = '提交中...';
    submitTipEl.className = 'submit-tip';

    try {
        const res = await fetch(`${API_BASE}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, score: lastFinalScore })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            submittedThisRound = true;
            submitTipEl.textContent = `✅ 提交成功！当前排名第 ${data.rank} 名`;
            submitTipEl.className = 'submit-tip success';
            rankInfoEl.textContent = `🥇 你已上榜，排名第 ${data.rank} 位！`;
            localStorage.setItem('snakeNickname', nickname);
            nicknameInput.value = nickname;
        } else {
            throw new Error(data.error || '提交失败');
        }
    } catch (err) {
        submitTipEl.textContent = '❌ 提交失败: ' + (err.message || '网络错误');
        submitTipEl.className = 'submit-tip error';
        submitScoreBtn.disabled = false;
    }
}

async function loadRank() {
    rankListEl.innerHTML = '<div class="loading">加载排行榜...</div>';
    totalCountEl.textContent = '?';

    try {
        const res = await fetch(`${API_BASE}/scores/top?limit=10`);
        const data = await res.json();

        if (res.ok && data.success) {
            totalCountEl.textContent = data.total;

            if (!data.data || data.data.length === 0) {
                rankListEl.innerHTML = '<div class="rank-empty">还没有人上榜，快来冲榜第一！</div>';
                return;
            }

            rankListEl.innerHTML = data.data.map((item, idx) => `
                <div class="rank-item">
                    <div class="rank-num">${idx + 1}</div>
                    <div class="rank-name">${escapeHtml(item.nickname)}</div>
                    <div class="rank-score">${item.score}</div>
                </div>
            `).join('');
        } else {
            throw new Error(data.error || '加载失败');
        }
    } catch (err) {
        rankListEl.innerHTML = `<div class="rank-empty">❌ 加载失败<br><small>${escapeHtml(err.message || '服务器未连接')}</small></div>`;
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function setDirection(newDx, newDy) {
    if (changingDirection) return;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (newDx === -1 && !goingRight) { dx = -1; dy = 0; changingDirection = true; }
    if (newDx === 1 && !goingLeft) { dx = 1; dy = 0; changingDirection = true; }
    if (newDy === -1 && !goingDown) { dx = 0; dy = -1; changingDirection = true; }
    if (newDy === 1 && !goingUp) { dx = 0; dy = 1; changingDirection = true; }
}

function changeDirection(event) {
    const LEFT_KEY = 37, RIGHT_KEY = 39, UP_KEY = 38, DOWN_KEY = 40;
    const W_KEY = 87, A_KEY = 65, S_KEY = 83, D_KEY = 68;
    const k = event.keyCode;

    if (k === LEFT_KEY || k === A_KEY) setDirection(-1, 0);
    if (k === UP_KEY || k === W_KEY) setDirection(0, -1);
    if (k === RIGHT_KEY || k === D_KEY) setDirection(1, 0);
    if (k === DOWN_KEY || k === S_KEY) setDirection(0, 1);
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!e.changedTouches || !e.changedTouches.length) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (absX < minSwipeDistance && absY < minSwipeDistance) return;

    if (absX > absY) {
        setDirection(diffX > 0 ? 1 : -1, 0);
    } else {
        setDirection(0, diffY > 0 ? 1 : -1);
    }
}

function startGame() {
    if (gameStarted && !isPaused) return;

    if (!gameStarted) {
        initGame();
    }

    gameStarted = true;
    isPaused = false;
    pauseBtn.textContent = '暂停';

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
}

function togglePause() {
    if (!gameStarted) return;

    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '继续' : '暂停';

    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, baseSize, baseSize);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暂停中', baseSize / 2, baseSize / 2);
    }
}

function resetGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = null;
    gameStarted = false;
    isPaused = false;
    pauseBtn.textContent = '暂停';
    initGame();
}

document.addEventListener('keydown', changeDirection);
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
rankBtn.addEventListener('click', () => { loadRank(); rankModal.classList.remove('hidden'); });

dpadBtns.forEach(btn => {
    const dir = btn.dataset.dir;
    const handler = (e) => {
        e.preventDefault();
        if (dir === 'up') setDirection(0, -1);
        if (dir === 'down') setDirection(0, 1);
        if (dir === 'left') setDirection(-1, 0);
        if (dir === 'right') setDirection(1, 0);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchstart', handler, { passive: false });
});

submitScoreBtn.addEventListener('click', submitScore);
submitNickInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitScore(); });
closeModalBtn.addEventListener('click', () => submitModal.classList.add('hidden'));
closeRankBtn.addEventListener('click', () => rankModal.classList.add('hidden'));

submitModal.addEventListener('click', (e) => { if (e.target === submitModal) submitModal.classList.add('hidden'); });
rankModal.addEventListener('click', (e) => { if (e.target === rankModal) rankModal.classList.add('hidden'); });

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

resizeCanvas();
initGame();