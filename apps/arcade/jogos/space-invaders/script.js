const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

let gameActive = false;
let gamePaused = false;
let gameOver = false;
let victory = false;
let levelComplete = false;
let score = 0;
let lives = 3;
let currentLevel = 1;
let currentDifficulty = 'medium';
let totalEnemies = 0;

const difficultySettings = {
    easy: {
        enemySpeed: 0.4,
        enemyShootRate: 0.005,
        playerSpeed: 7,
        enemyHealth: 1,
        spawnRate: 0.8,
        extraRows: 0,
        extraCols: 0,
        description: '😊 FÁCIL'
    },
    medium: {
        enemySpeed: 0.6,
        enemyShootRate: 0.01,
        playerSpeed: 6,
        enemyHealth: 1,
        spawnRate: 1.0,
        extraRows: 1,
        extraCols: 1,
        description: '😐 MÉDIO'
    },
    hard: {
        enemySpeed: 0.8,
        enemyShootRate: 0.015,
        playerSpeed: 6,
        enemyHealth: 2,
        spawnRate: 1.2,
        extraRows: 2,
        extraCols: 2,
        description: '😰 DIFÍCIL'
    },
    nightmare: {
        enemySpeed: 1.0,
        enemyShootRate: 0.02,
        playerSpeed: 5,
        enemyHealth: 2,
        spawnRate: 1.4,
        extraRows: 3,
        extraCols: 3,
        description: '👹 PESADELO'
    }
};

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 40,
    speed: 6,
    invulnerable: false,
    invulTimer: 0,
    engineGlow: 0,
    maxHealth: 5,
    health: 5
};

let playerBullets = [];
let enemyBullets = [];
const BULLET_SPEED = 5;
let canShoot = true;
const SHOOT_COOLDOWN = 12;
let shootTimer = 0;

let enemies = [];
let enemyDirection = 1;
let enemyMoveCounter = 0;
const ENEMY_MOVE_DELAY = 25;

let powerups = [];
let hasRapidFire = false;
let rapidFireTimer = 0;
let hasShield = false;
let shieldTimer = 0;

const scoreSpan = document.getElementById('score');
const livesSpan = document.getElementById('lives');
const levelSpan = document.getElementById('level');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const victoryScreen = document.getElementById('victoryScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverLevel = document.getElementById('gameOverLevel');
const victoryScore = document.getElementById('victoryScore');
const nextLevelSpan = document.getElementById('nextLevel');
const startGameBtn = document.getElementById('startGameBtn');
const newGameBtn = document.getElementById('newGameBtn');
const restartBtn = document.getElementById('restartBtn');
const victoryRestartBtn = document.getElementById('victoryRestartBtn');
const continueBtn = document.getElementById('continueBtn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

let leftPressed = false;
let rightPressed = false;
let spacePressed = false;

function playerHit() {
    if (player.invulnerable) return;
    
    player.health--;
    updateLives();
    
    player.invulnerable = true;
    player.invulTimer = 0;
    
    if (player.health <= 0) {
        lives--;
        document.getElementById('lives').textContent = lives;
        
        if (lives > 0) {
            player.health = player.maxHealth;
            updateLives();
            
            enemyBullets = [];
            
            console.log("💥 Vida extra consumida! Vidas restantes:", lives);
        } else {

            endGame();
            return;
        }
    }
}

function initLevel() {
    let settings = difficultySettings[currentDifficulty];
    
    enemies = [];
    
    let baseRows = 3;
    let baseCols = 5;
    
    let rows = baseRows + settings.extraRows + Math.min(currentLevel - 1, 2);
    let cols = baseCols + settings.extraCols + Math.min(currentLevel - 1, 2);
    
    rows = Math.min(rows, 6);
    cols = Math.min(cols, 8);
    
    let startX = (canvas.width - (cols * 45)) / 2;
    let startY = 30;
    let spacing = 40;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let type = row % 4;
            let health = settings.enemyHealth;
            if (row < 2) health = 1;
            
            enemies.push({
                x: startX + col * spacing,
                y: startY + row * spacing,
                width: 30,
                height: 30,
                type: type,
                health: health,
                maxHealth: health,
                alive: true,
                rotation: 0,
                pulse: 0,
                wingAngle: 0,
                shootTimer: Math.random() * 200
            });
        }
    }
    
    totalEnemies = enemies.length;
    playerBullets = [];
    enemyBullets = [];
    powerups = [];
    player.x = canvas.width / 2 - 25;
    player.health = player.maxHealth;
    enemyDirection = 1;
    enemyMoveCounter = 0;
    canShoot = true;
    shootTimer = 0;
    
    hasRapidFire = false;
    hasShield = false;
    rapidFireTimer = 0;
    shieldTimer = 0;
    player.invulnerable = false;
    player.invulTimer = 0;
    
    updateScore();
    updateLives();
    levelSpan.textContent = currentLevel;
}

function updateScore() {
    scoreSpan.textContent = score;
}

function updateLives() {

    livesSpan.textContent = player.health;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        leftPressed = true;
    }
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        rightPressed = true;
    }
    if (e.key === ' ') {
        e.preventDefault();
        spacePressed = true;
    }
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (gameActive && !gameOver && !victory && !levelComplete) {
            gamePaused = !gamePaused;
            if (gamePaused) {
                pauseScreen.classList.remove('hidden');
            } else {
                pauseScreen.classList.add('hidden');
            }
        }
    }
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        leftPressed = false;
    }
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        rightPressed = false;
    }
    if (e.key === ' ') {
        e.preventDefault();
        spacePressed = false;
    }
});

function startGame() {
    currentLevel = 1;
    score = 0;
    lives = 3;
    player.maxHealth = 5;
    player.health = 5;
    document.getElementById('lives').textContent = lives;
    initLevel();
    gameActive = true;
    gamePaused = false;
    gameOver = false;
    victory = false;
    levelComplete = false;
    startScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function nextLevel() {
    currentLevel++;
    initLevel();
    gameActive = true;
    levelComplete = false;
    levelCompleteScreen.classList.add('hidden');
}

function endGame() {
    gameActive = false;
    gameOver = true;
    gameOverScore.textContent = `Pontuação: ${score}`;
    gameOverLevel.textContent = `Fase: ${currentLevel}`;
    gameOverScreen.classList.remove('hidden');
}

function winGame() {
    gameActive = false;
    victory = true;
    victoryScore.textContent = `Pontuação final: ${score}`;
    victoryScreen.classList.remove('hidden');
}

function resetGame() {
    startGame();
}

function update() {
    if (!gameActive || gamePaused || gameOver || victory || levelComplete) return;
    
    let settings = difficultySettings[currentDifficulty];
    
    if (leftPressed && player.x > 0) {
        player.x -= settings.playerSpeed;
    }
    if (rightPressed && player.x + player.width < canvas.width) {
        player.x += settings.playerSpeed;
    }
    
    player.engineGlow = (player.engineGlow + 0.1) % (Math.PI * 2);
    
    if (!canShoot) {
        shootTimer++;
        let cooldown = hasRapidFire ? SHOOT_COOLDOWN / 2 : SHOOT_COOLDOWN;
        if (shootTimer > cooldown) {
            canShoot = true;
            shootTimer = 0;
        }
    }
    
    if (spacePressed && canShoot) {
        playerBullets.push({
            x: player.x + player.width / 2 - 3,
            y: player.y - 10,
            width: 6,
            height: 12,
            trail: []
        });
        canShoot = false;
    }
    
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        let bullet = playerBullets[i];
        
        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > 5) bullet.trail.shift();
        
        bullet.y -= BULLET_SPEED;
        
        if (bullet.y < 0) {
            playerBullets.splice(i, 1);
            continue;
        }
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (!enemies[j].alive) continue;
            
            if (bullet.x < enemies[j].x + enemies[j].width &&
                bullet.x + bullet.width > enemies[j].x &&
                bullet.y < enemies[j].y + enemies[j].height &&
                bullet.y + bullet.height > enemies[j].y) {
                
                enemies[j].health--;
                playerBullets.splice(i, 1);
                
                if (enemies[j].health <= 0) {
                    enemies[j].alive = false;
                    score += 10 * currentLevel;
                    
                    if (Math.random() < 0.05) {
                        powerups.push({
                            x: enemies[j].x,
                            y: enemies[j].y,
                            width: 20,
                            height: 20,
                            type: Math.random() < 0.5 ? 'rapid' : 'shield'
                        });
                    }
                }
                updateScore();
                break;
            }
        }
    }
    
    enemies = enemies.filter(e => e.alive);
    
    if (enemies.length === 0) {
        if (currentLevel >= 8) {
            winGame();
        } else {
            levelComplete = true;
            gameActive = false;
            nextLevelSpan.textContent = currentLevel + 1;
            levelCompleteScreen.classList.remove('hidden');
        }
        return;
    }
    
    enemyMoveCounter++;
    if (enemyMoveCounter >= ENEMY_MOVE_DELAY) {
        enemyMoveCounter = 0;
        
        let changeDirection = false;
        let lowestEnemy = 0;
        
        for (let enemy of enemies) {
            if (enemy.x + enemy.width > canvas.width - 40 || enemy.x < 40) {
                changeDirection = true;
            }
            if (enemy.y > lowestEnemy) lowestEnemy = enemy.y;
        }
        
        if (lowestEnemy + 40 > player.y - 50) {
            if (!player.invulnerable) {
                playerHit();
            }
        }
        
        if (changeDirection) {
            enemyDirection *= -1;
            for (let enemy of enemies) {
                enemy.y += 8;
            }
        } else {
            for (let enemy of enemies) {
                enemy.x += enemyDirection * settings.enemySpeed * 3;
                enemy.rotation += 0.02;
                enemy.pulse = Math.sin(Date.now() * 0.01) * 0.05;
                enemy.wingAngle = Math.sin(Date.now() * 0.02) * 0.1;
            }
        }
    }
    
    for (let enemy of enemies) {
        let shootChance = settings.enemyShootRate;
        if (enemy.y > 200) shootChance *= 1.5;
        
        enemy.shootTimer++;
        if (enemy.shootTimer > 100 && Math.random() < shootChance) {
            if (enemy.y < player.y - 50) {
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 3,
                    y: enemy.y + enemy.height,
                    width: 5,
                    height: 10
                });
                enemy.shootTimer = 0;
            }
        }
    }
    
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += BULLET_SPEED * 1.2;
        
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }
        
        if (!player.invulnerable &&
            enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y) {
            
            enemyBullets.splice(i, 1);
            
            if (hasShield) {
                hasShield = false;
                shieldTimer = 0;
            } else {
                playerHit();
            }
        }
    }
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        let power = powerups[i];
        power.y += 1.5;
        
        if (power.y > canvas.height) {
            powerups.splice(i, 1);
            continue;
        }
        
        if (power.x < player.x + player.width &&
            power.x + power.width > player.x &&
            power.y < player.y + player.height &&
            power.y + power.height > player.y) {
            
            if (power.type === 'rapid') {
                hasRapidFire = true;
                rapidFireTimer = 200;
            } else if (power.type === 'shield') {
                hasShield = true;
                shieldTimer = 200;
            }
            
            powerups.splice(i, 1);
        }
    }
    
    if (hasRapidFire) {
        rapidFireTimer--;
        if (rapidFireTimer <= 0) hasRapidFire = false;
    }
    
    if (hasShield) {
        shieldTimer--;
        if (shieldTimer <= 0) hasShield = false;
    }
    
    if (player.invulnerable) {
        player.invulTimer++;
        if (player.invulTimer > 80) player.invulnerable = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 50; i++) {
        let x = (i * 37) % canvas.width;
        let y = (i * 23 + Date.now() * 0.01) % canvas.height;
        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.fillRect(x, y, 1, 1);
    }
    
    if (!player.invulnerable || (player.invulTimer % 10 < 5)) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        
        let glowSize = 20 + Math.sin(player.engineGlow) * 3;
        let gradient = ctx.createRadialGradient(0, player.height/2, 0, 0, player.height/2, glowSize);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, player.height/2, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        
        let gradient2 = ctx.createLinearGradient(-player.width/2, -player.height/2, player.width/2, player.height/2);
        gradient2.addColorStop(0, '#0ff');
        gradient2.addColorStop(0.7, '#09f');
        ctx.fillStyle = gradient2;
        
        ctx.beginPath();
        ctx.moveTo(-player.width/2, -player.height/2);
        ctx.lineTo(player.width/2, -player.height/2);
        ctx.lineTo(player.width/2 + 5, 0);
        ctx.lineTo(player.width/2, player.height/2);
        ctx.lineTo(-player.width/2, player.height/2);
        ctx.lineTo(-player.width/2 - 5, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#ff0';
        ctx.fillRect(-3, -player.height/2 - 8, 6, 10);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-8, -12, 16, 8);
        
        ctx.restore();
        
        if (hasShield) {
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.fillStyle = '#f00';
        ctx.fillRect(player.x, player.y - 15, player.width, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(player.x, player.y - 15, player.width * (player.health / player.maxHealth), 4);
    }
    
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        ctx.rotate(enemy.rotation * 0.3);
        ctx.scale(1 + enemy.pulse * 0.3, 1 + enemy.pulse * 0.3);
        
        ctx.shadowColor = '#f0f';
        ctx.shadowBlur = 8;
        
        if (enemy.type === 0) {
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, -5, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-4, -6, 1.5, 0, Math.PI * 2);
            ctx.arc(4, -6, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (enemy.type === 1) {
            ctx.fillStyle = '#f90';
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(0, -10);
            ctx.lineTo(12, 0);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (enemy.type === 2) {
            ctx.fillStyle = '#0ff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(0, -4, 4, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            ctx.fillStyle = '#90f';
            ctx.beginPath();
            ctx.moveTo(-12, -6);
            ctx.lineTo(0, -12);
            ctx.lineTo(12, -6);
            ctx.lineTo(12, 6);
            ctx.lineTo(0, 12);
            ctx.lineTo(-12, 6);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(-5, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (enemy.maxHealth > 1) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#f00';
            ctx.fillRect(-12, -15, 24, 3);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(-12, -15, 24 * (enemy.health / enemy.maxHealth), 3);
        }
        
        ctx.restore();
    });
    
    playerBullets.forEach(bullet => {
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#0ff';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    enemyBullets.forEach(bullet => {
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#f00';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    powerups.forEach(power => {
        ctx.shadowBlur = 10;
        if (power.type === 'rapid') {
            ctx.shadowColor = '#ff0';
            ctx.font = '20px Arial';
            ctx.fillStyle = '#ff0';
            ctx.fillText('⚡', power.x, power.y + 16);
        } else {
            ctx.shadowColor = '#0ff';
            ctx.font = '20px Arial';
            ctx.fillStyle = '#0ff';
            ctx.fillText('🛡️', power.x, power.y + 16);
        }
    });
    
    ctx.shadowBlur = 0;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
    });
});

startGameBtn.addEventListener('click', startGame);
newGameBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    resetGame();
});

continueBtn.addEventListener('click', nextLevel);

victoryRestartBtn.addEventListener('click', () => {
    victoryScreen.classList.add('hidden');
    resetGame();
});

document.getElementById('backToArcade').addEventListener('click', () => {
    window.location.href = '../index.html';
});

document.getElementById('touchLeft')?.addEventListener('mousedown', () => { leftPressed = true; });
document.getElementById('touchLeft')?.addEventListener('mouseup', () => { leftPressed = false; });
document.getElementById('touchLeft')?.addEventListener('mouseleave', () => { leftPressed = false; });

document.getElementById('touchRight')?.addEventListener('mousedown', () => { rightPressed = true; });
document.getElementById('touchRight')?.addEventListener('mouseup', () => { rightPressed = false; });
document.getElementById('touchRight')?.addEventListener('mouseleave', () => { rightPressed = false; });

document.getElementById('touchFire')?.addEventListener('mousedown', () => { spacePressed = true; });
document.getElementById('touchFire')?.addEventListener('mouseup', () => { spacePressed = false; });
document.getElementById('touchFire')?.addEventListener('mouseleave', () => { spacePressed = false; });

gameLoop();