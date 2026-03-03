// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let gameRunning = false;
let gamePaused = false;
let score = 0;
let coins = 0;
let record = localStorage.getItem('kartPointRecord') || 0;

// Player Kart
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 50,
    speed: 0,
    maxSpeed: 7,
    acceleration: 0.3,
    friction: 0.9,
    color: '#ff6b35'
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Enemy Karts
let enemies = [];
const EnemyKart = class {
    constructor() {
        this.x = Math.random() * (canvas.width - 40);
        this.y = -50;
        this.width = 40;
        this.height = 50;
        this.speed = Math.random() * 3 + 2;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.color = '#00ff00';
    }

    update() {
        this.y += this.speed;
        this.x += this.direction * 1.5;

        if (this.x < 0 || this.x + this.width > canvas.width) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Janela
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(this.x + 10, this.y + 10, 20, 15);
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
};

// Obstacles
let obstacles = [];
const Obstacle = class {
    constructor() {
        this.x = Math.random() * (canvas.width - 30);
        this.y = -30;
        this.width = 30;
        this.height = 30;
        this.speed = Math.random() * 2 + 1;
        this.color = '#8B4513';
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
};

// Coins
let coins_list = [];
const Coin = class {
    constructor() {
        this.x = Math.random() * (canvas.width - 20);
        this.y = -20;
        this.width = 20;
        this.height = 20;
        this.speed = Math.random() * 1.5 + 0.5;
        this.color = '#ffd60a';
        this.rotation = 0;
    }

    update() {
        this.y += this.speed;
        this.rotation += 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Moeda
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#ffed4e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
};

// Draw player
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Janela do kart
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(player.x + 10, player.y + 10, 20, 20);
    
    // Detalhes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 5, player.y + 35, 10, 10);
    ctx.fillRect(player.x + 25, player.y + 35, 10, 10);
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game
function updateGame() {
    if (!gameRunning || gamePaused) return;

    // Player movement
    if (keys['arrowleft'] || keys['a']) {
        player.x -= player.maxSpeed;
    }
    if (keys['arrowright'] || keys['d']) {
        player.x += player.maxSpeed;
    }
    if (keys['p']) {
        pauseGame();
        keys['p'] = false;
    }

    // Boundary checking
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

    // Update enemies
    enemies.forEach((enemy, index) => {
        enemy.update();
        if (enemy.isOffScreen()) {
            enemies.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(player, enemy)) {
            score = Math.max(0, score - 20);
            updateScore();
            // Push player back
            player.y -= 30;
        }
    });

    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        if (obstacle.isOffScreen()) {
            obstacles.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(player, obstacle)) {
            score = Math.max(0, score - 20);
            updateScore();
            // Push player back
            player.y -= 30;
        }
    });

    // Update coins
    coins_list.forEach((coin, index) => {
        coin.update();
        if (coin.isOffScreen()) {
            coins_list.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(player, coin)) {
            coins++;
            score += 10;
            updateScore();
            coins_list.splice(index, 1);
        }
    });

    // Spawn new enemies
    if (Math.random() < 0.02) {
        enemies.push(new EnemyKart());
    }

    // Spawn new obstacles
    if (Math.random() < 0.015) {
        obstacles.push(new Obstacle());
    }

    // Spawn new coins
    if (Math.random() < 0.03) {
        coins_list.push(new Coin());
    }
}

// Draw game
function drawGame() {
    // Background
    ctx.fillStyle = 'rgba(26, 58, 82, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player
    drawPlayer();

    // Draw enemies
    enemies.forEach(enemy => enemy.draw());

    // Draw obstacles
    obstacles.forEach(obstacle => obstacle.draw());

    // Draw coins
    coins_list.forEach(coin => coin.draw());

    // Draw game over state
    if (!gameRunning && !gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Game loop
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
}

// Update record
function updateRecord() {
    if (score > record) {
        record = score;
        localStorage.setItem('kartPointRecord', record);
    }
    document.getElementById('record').textContent = record;
}

// Start game
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    coins = 0;
    enemies = [];
    obstacles = [];
    coins_list = [];
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    updateScore();
    toggleMenu();
    document.getElementById('resumeBtn').style.display = 'inline-block';
}

// Pause game
function pauseGame() {
    gamePaused = !gamePaused;
    document.getElementById('resumeBtn').style.display = gamePaused ? 'inline-block' : 'none';
    
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
    }
}

// Resume game
function resumeGame() {
    gamePaused = false;
    toggleMenu();
}

// Reset game
function resetGame() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    coins = 0;
    enemies = [];
    obstacles = [];
    coins_list = [];
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    updateScore();
    toggleMenu();
}

// Toggle menu
function toggleMenu() {
    const menu = document.getElementById('menuModal');
    menu.classList.toggle('active');
}

// End game
function endGame() {
    gameRunning = false;
    updateRecord();
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('finalRecord').textContent = record;
    
    document.getElementById('gameOverModal').classList.add('active');
}

// Go to pitch
function goToPitch() {
    window.location.href = '../index.html';
}

// Responsive canvas
window.addEventListener('resize', () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

// Initialize record display
updateRecord();

// Show menu initially
toggleMenu();

// Start game loop
gameLoop();

// End game after 2 minutes (optional - remove if you want infinite game)
let gameTimer = null;
function startGameTimer() {
    gameTimer = setTimeout(() => {
        if (gameRunning) {
            endGame();
        }
    }, 120000); // 2 minutos
}

// Modify startGame to include timer
const originalStartGame = startGame;
startGame = function() {
    originalStartGame();
    startGameTimer();
};
