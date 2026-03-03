// Three.js Setup
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
renderer.setClearColor(0x1a3a52, 1);
camera.position.set(0, 60, -100);
camera.lookAt(0, 10, 50);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
scene.add(directionalLight);

// Game Variables
let gameRunning = false;
let gamePaused = false;
let score = 0;
let coins = 0;
let record = localStorage.getItem('kartPointRecord') || 0;
let roadOffset = 0;
let timeRemaining = 180; // 3 minutos
let gameTimer = null;
let spawnCounter = { enemy: 0, obstacle: 0, coin: 0 };
let difficulty = 1; // Progressão de dificuldade

// Player Kart
const player = {
    x: 0,
    y: 10,
    z: 0,
    width: 30,
    height: 30,
    maxSpeed: 7,
    mesh: null
};

// Create kart mesh
function createKartMesh(color) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(30, 15, 50);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 5;
    group.add(body);
    
    // Window
    const windowGeometry = new THREE.BoxGeometry(20, 10, 10);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 12, -5);
    group.add(window);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(8, 8, 8, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    const wheels = [
        { x: -15, z: -15 },
        { x: 15, z: -15 },
        { x: -15, z: 15 },
        { x: 15, z: 15 }
    ];
    
    wheels.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0, pos.z);
        group.add(wheel);
    });
    
    return group;
}

player.mesh = createKartMesh(0xff6b35);
scene.add(player.mesh);

// Road stripes for visual effect
const roadStripes = [];
function createRoadStripes() {
    for (let i = 0; i < 40; i++) {
        const stripeGeometry = new THREE.PlaneGeometry(200, 20);
        const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xffd60a });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.y = -14.5;
        stripe.position.z = i * 50 - 1000;
        scene.add(stripe);
        roadStripes.push(stripe);
    }
}
createRoadStripes();

// Road mesh
let roadMesh;
const startRoad = () => {
    if (roadMesh) scene.remove(roadMesh);
    const roadGeometry = new THREE.PlaneGeometry(200, 3000);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = -15;
    scene.add(roadMesh);
};
startRoad();

// Road walls
const wallGeometry = new THREE.BoxGeometry(20, 50, 2000);
const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
const wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
wallLeft.position.set(-110, 0, 0);
scene.add(wallLeft);

const wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
wallRight.position.set(110, 0, 0);
scene.add(wallRight);

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
        this.x = (Math.random() - 0.5) * 150;
        this.y = 10;
        this.z = player.z - 600 - Math.random() * 400;
        this.width = 30;
        this.height = 30;
        this.speed = Math.random() * 2 + 2.5;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.mesh = createKartMesh(0x00ff00);
        this.mesh.position.set(this.x, this.y, this.z);
        scene.add(this.mesh);
    }

    update() {
        this.z += this.speed;
        this.x += this.direction * 1.5;

        if (this.x < -90 || this.x > 90) {
            this.direction *= -1;
        }
        
        this.mesh.position.set(this.x, this.y, this.z);
    }

    isOffScreen() {
        return this.z > player.z + 50;
    }

    dispose() {
        scene.remove(this.mesh);
    }
};

// Obstacles
let obstacles = [];
const Obstacle = class {
    constructor() {
        this.x = (Math.random() - 0.5) * 150;
        this.y = 15;
        this.z = player.z - 600 - Math.random() * 400;
        this.width = 30;
        this.height = 30;
        this.speed = Math.random() * 1.5 + 1.5;
        this.rotation = 0;
        
        const obstacleGeometry = new THREE.BoxGeometry(30, 30, 30);
        const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.mesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        this.mesh.position.set(this.x, this.y, this.z);
        scene.add(this.mesh);
    }

    update() {
        this.z += this.speed;
        this.rotation += 0.02;
        this.mesh.rotation.x += 0.02;
        this.mesh.rotation.y += 0.02;
        this.mesh.position.set(this.x, this.y, this.z);
    }

    isOffScreen() {
        return this.z > player.z + 50;
    }

    dispose() {
        scene.remove(this.mesh);
    }
};

// Coins
let coins_list = [];
const Coin = class {
    constructor() {
        this.x = (Math.random() - 0.5) * 150;
        this.y = 30;
        this.z = player.z - 600 - Math.random() * 400;
        this.width = 20;
        this.height = 20;
        this.speed = Math.random() * 1.5 + 1;
        this.rotation = 0;
        
        const coinGeometry = new THREE.CylinderGeometry(15, 15, 5, 32);
        const coinMaterial = new THREE.MeshLambertMaterial({ color: 0xffd60a });
        this.mesh = new THREE.Mesh(coinGeometry, coinMaterial);
        this.mesh.position.set(this.x, this.y, this.z);
        scene.add(this.mesh);
    }

    update() {
        this.z += this.speed;
        this.rotation += 0.05;
        this.mesh.rotation.x = this.rotation;
        this.mesh.position.set(this.x, this.y, this.z);
    }

    isOffScreen() {
        return this.z > player.z + 50;
    }

    dispose() {
        scene.remove(this.mesh);
    }
};

// Collision detection
function checkCollision(pos1, pos2, radius = 30) {
    const distance = Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
    return distance < radius * 2;
}

// Update game
function updateGame() {
    if (!gameRunning || gamePaused) return;

    // Decrement time
    if (!window.frameCounter) window.frameCounter = 0;
    window.frameCounter++;
    if (window.frameCounter >= 60) {
        timeRemaining--;
        updateTimeDisplay();
        window.frameCounter = 0;
        
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            updateTimeDisplay();
            endGame();
            return;
        }
    }

    // Player movement
    if (keys['arrowleft'] || keys['a']) {
        player.x = Math.max(player.x - player.maxSpeed, -100);
    }
    if (keys['arrowright'] || keys['d']) {
        player.x = Math.min(player.x + player.maxSpeed, 100);
    }
    if (keys['p']) {
        pauseGame();
        keys['p'] = false;
    }

    // Player always moves forward
    player.z += 3;

    player.mesh.position.set(player.x, player.y, player.z);

    // Move road stripes
    roadOffset += 3;
    roadStripes.forEach((stripe, index) => {
        stripe.position.z = player.z - 1000 + (index * 50) + (roadOffset % 50);
        if (stripe.position.z > player.z + 200) {
            stripe.position.z -= 2000;
        }
    });

    // Update enemies
    enemies.forEach((enemy, index) => {
        enemy.update();
        if (enemy.isOffScreen()) {
            enemy.dispose();
            enemies.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(player, enemy)) {
            score = Math.max(0, score - 20);
            updateScore();
        }
    });

    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        if (obstacle.isOffScreen()) {
            obstacle.dispose();
            obstacles.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(player, obstacle)) {
            score = Math.max(0, score - 20);
            updateScore();
        }
    });

    // Update coins
    coins_list.forEach((coin, index) => {
        coin.update();
        if (coin.isOffScreen()) {
            coin.dispose();
            coins_list.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(player, coin, 25)) {
            coins++;
            score += 10;
            updateScore();
            coin.dispose();
            coins_list.splice(index, 1);
        }
    });

    // Spawn new enemies - com espaçamento melhor
    spawnCounter.enemy++;
    const enemySpawnRate = Math.max(80, 100 - (180 - timeRemaining) * 0.2); // Aumenta dificuldade
    if (spawnCounter.enemy >= enemySpawnRate) {
        if (enemies.length < 3) { // Máximo de 3 inimigos simultaneamente
            enemies.push(new EnemyKart());
            spawnCounter.enemy = 0;
        }
    }

    // Spawn new obstacles - com espaçamento melhor
    spawnCounter.obstacle++;
    const obstacleSpawnRate = Math.max(100, 120 - (180 - timeRemaining) * 0.25); // Aumenta dificuldade
    if (spawnCounter.obstacle >= obstacleSpawnRate) {
        if (obstacles.length < 2) { // Máximo de 2 obstáculos simultaneamente
            obstacles.push(new Obstacle());
            spawnCounter.obstacle = 0;
        }
    }

    // Spawn new coins - mais frequentes
    spawnCounter.coin++;
    const coinSpawnRate = Math.max(60, 80 - (180 - timeRemaining) * 0.15); // Aumenta dificuldade
    if (spawnCounter.coin >= coinSpawnRate) {
        if (coins_list.length < 4) { // Máximo de 4 moedas simultaneamente
            coins_list.push(new Coin());
            spawnCounter.coin = 0;
        }
    }
}

// Render game
function renderGame() {
    // Câmera em terceira pessoa - fixa atrás do kart, mostrando a pista à frente
    const cameraDistance = 80;
    const cameraHeight = 50;
    
    camera.position.x = player.x;
    camera.position.y = cameraHeight;
    camera.position.z = player.z + cameraDistance;
    
    camera.lookAt(player.x, 20, player.z - 100);
    
    // Atualiza posição da pista
    if (roadMesh) {
        roadMesh.position.z = player.z;
    }
    
    // Atualiza posição das paredes
    wallLeft.position.z = player.z;
    wallRight.position.z = player.z;
    
    renderer.render(scene, camera);
}

// Game loop
function gameLoop() {
    updateGame();
    renderGame();
    requestAnimationFrame(gameLoop);
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
}

// Update time display
function updateTimeDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Update record
function updateRecord() {
    if (score > record) {
        record = score;
        localStorage.setItem('kartPointRecord', record);
    }
    document.getElementById('record').textContent = record;
}

// Clean up game
function cleanupGame() {
    enemies.forEach(enemy => enemy.dispose());
    obstacles.forEach(obstacle => obstacle.dispose());
    coins_list.forEach(coin => coin.dispose());
    enemies = [];
    obstacles = [];
    coins_list = [];
}

// Start game
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    coins = 0;
    timeRemaining = 180; // Reset para 3 minutos
    window.frameCounter = 0;
    spawnCounter = { enemy: 0, obstacle: 0, coin: 0 };
    cleanupGame();
    
    player.x = 0;
    player.y = 10;
    player.z = 0;
    player.mesh.position.set(player.x, player.y, player.z);
    
    updateScore();
    updateTimeDisplay();
    toggleMenu();
    document.getElementById('resumeBtn').style.display = 'inline-block';
}

// Pause game
function pauseGame() {
    gamePaused = !gamePaused;
    document.getElementById('resumeBtn').style.display = gamePaused ? 'inline-block' : 'none';
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
    timeRemaining = 180; // Reset para 3 minutos
    window.frameCounter = 0;
    spawnCounter = { enemy: 0, obstacle: 0, coin: 0 };
    cleanupGame();
    
    player.x = 0;
    player.y = 10;
    player.z = 0;
    player.mesh.position.set(player.x, player.y, player.z);
    
    updateScore();
    updateTimeDisplay();
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
    
    // Mensagem especial quando tempo acaba
    const title = timeRemaining <= 0 ? "🏁 CHEGOU NA LARGADA!" : "JOGO ENCERRADO!";
    document.getElementById('gameOverTitle').textContent = title;
    
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
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Initialize record display
updateRecord();
updateTimeDisplay();

// Show menu initially
toggleMenu();

// Start game loop
gameLoop();
