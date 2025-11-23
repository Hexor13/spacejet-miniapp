// SpaceJet Game - Complete Version with Error Handling
class SpaceJetGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Настройки игры
        this.config = {
            WIDTH: 500,
            HEIGHT: 800,
            PLANE_SPEED: 5,
            OBSTACLE_SPEED: 3,
            BULLET_SPEED: -10,
            INVINCIBLE_TIME: 120
        };
        
        // Состояние игры
        this.gameState = 'loading'; // loading, menu, playing, levelup, gameover
        this.score = 0;
        this.highScore = localStorage.getItem('spacejet_highscore') || 0;
        this.level = 1;
        this.levelThresholds = [20, 50, 100, 200, 500];
        
        // Игровые объекты
        this.player = null;
        this.obstacles = [];
        this.bullets = [];
        this.particles = [];
        
        // Время и анимации
        this.lastTime = 0;
        this.invincibleTimer = 0;
        this.obstacleSpawnTimer = 0;
        
        // Ресурсы
        this.images = {};
        this.loadedAssets = 0;
        this.totalAssets = 5;
        
        // Управление
        this.keys = {};
        this.touchControls = {};
        
        this.init();
    }
    
    async init() {
        // Устанавливаем размер canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Загружаем ресурсы
        await this.loadAssets();
        
        // Настраиваем управление
        this.setupControls();
        
        // Показываем меню
        this.showScreen('menuScreen');
        this.gameState = 'menu';
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = this.config.WIDTH;
        this.canvas.height = this.config.HEIGHT;
        
        // Масштабируем для мобильных устройств
        const scale = Math.min(
            container.clientWidth / this.config.WIDTH,
            container.clientHeight / this.config.HEIGHT
        );
        
        this.canvas.style.transform = `scale(${scale})`;
        this.canvas.style.transformOrigin = 'top left';
    }
    
    async loadAssets() {
        const assets = [
            { name: 'plane', src: './assets/plane.png' },
            { name: 'obstacle', src: './assets/obstacle.png' },
            { name: 'background', src: './assets/background.png' },
            { name: 'heart', src: './assets/heart.png' },
            { name: 'gameOver', src: './assets/game-over.png' }
        ];
        
        console.log('Starting to load assets...');
        
        try {
            const loadPromises = assets.map(asset => this.loadImage(asset));
            await Promise.all(loadPromises);
            console.log('All assets loaded successfully!');
            
            this.showScreen('menuScreen');
        } catch (error) {
            console.log('Some assets failed, but continuing...');
            this.showScreen('menuScreen');
        }
    }
    
    loadImage(asset) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log('✅ Loaded:', asset.src);
                this.images[asset.name] = img;
                this.loadedAssets++;
                this.updateLoadingProgress();
                resolve(img);
            };
            img.onerror = (e) => {
                console.log('❌ Failed to load:', asset.src, e);
                // Создаем временную картинку если не загрузилась
                this.createFallbackImage(asset.name);
                this.loadedAssets++;
                this.updateLoadingProgress();
                resolve(this.images[asset.name]);
            };
            img.src = asset.src;
        });
    }
    
    createFallbackImage(name) {
        const canvas = document.createElement('canvas');
        
        switch(name) {
            case 'plane':
                canvas.width = 50;
                canvas.height = 50;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#4ecdc4';
                ctx.fillRect(0, 0, 50, 50);
                break;
            case 'obstacle':
                canvas.width = 50;
                canvas.height = 50;
                const ctx2 = canvas.getContext('2d');
                ctx2.fillStyle = '#ff6b6b';
                ctx2.beginPath();
                ctx2.arc(25, 25, 25, 0, Math.PI * 2);
                ctx2.fill();
                break;
            case 'background':
                canvas.width = 500;
                canvas.height = 800;
                const ctx3 = canvas.getContext('2d');
                ctx3.fillStyle = '#000000';
                ctx3.fillRect(0, 0, 500, 800);
                break;
            case 'heart':
                canvas.width = 16;
                canvas.height = 16;
                const ctx4 = canvas.getContext('2d');
                ctx4.fillStyle = '#ff6b6b';
                ctx4.fillRect(0, 0, 16, 16);
                break;
            default:
                canvas.width = 50;
                canvas.height = 50;
                const ctx5 = canvas.getContext('2d');
                ctx5.fillStyle = '#ffff00';
                ctx5.fillRect(0, 0, 50, 50);
        }
        
        this.images[name] = new Image();
        this.images[name].src = canvas.toDataURL();
    }
    
    updateLoadingProgress() {
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }
    
    setupControls() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Пауза на ESC
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Мобильное управление
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const upBtn = document.getElementById('upBtn');
        const shootBtn = document.getElementById('shootBtn');
        
        // Нажатие
        const addTouchStart = (btn, key) => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
                this.touchControls[key] = true;
            });
        };
        
        // Отпускание
        const addTouchEnd = (btn, key) => {
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
                this.touchControls[key] = false;
            });
        };
        
        if (leftBtn) addTouchStart(leftBtn, 'ArrowLeft');
        if (leftBtn) addTouchEnd(leftBtn, 'ArrowLeft');
        if (rightBtn) addTouchStart(rightBtn, 'ArrowRight');
        if (rightBtn) addTouchEnd(rightBtn, 'ArrowRight');
        if (upBtn) addTouchStart(upBtn, 'ArrowUp');
        if (upBtn) addTouchEnd(upBtn, 'ArrowUp');
        if (shootBtn) addTouchStart(shootBtn, 'Space');
        if (shootBtn) addTouchEnd(shootBtn, 'Space');
    }
    
    startGame() {
        // Сброс состояния игры
        this.player = {
            x: this.config.WIDTH / 2 - 25,
            y: this.config.HEIGHT - 100,
            width: 50,
            height: 50,
            speed: this.config.PLANE_SPEED,
            lives: 3,
            bulletStorage: 5,
            fireCooldown: 0,
            size: 1.0
        };
        
        this.obstacles = [];
        this.bullets = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.invincibleTimer = 0;
        this.obstacleSpawnTimer = 0;
        
        // Обновляем UI
        this.updateUI();
        
        // Показываем игровой экран
        this.showScreen('gameScreen');
        this.gameState = 'playing';
        
        // Запускаем игровой цикл
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Обновляем игрока
        this.updatePlayer(deltaTime);
        
        // Спавн препятствий
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= 2.0) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Обновляем препятствия
        this.updateObstacles(deltaTime);
        
        // Обновляем пули
        this.updateBullets(deltaTime);
        
        // Обновляем частицы
        this.updateParticles(deltaTime);
        
        // Проверяем коллизии
        this.checkCollisions();
        
        // Проверяем уровень
        this.checkLevelUp();
        
        // Обновляем таймер неуязвимости
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
        }
    }
    
    updatePlayer(deltaTime) {
        // Движение
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed * deltaTime);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.config.WIDTH - this.player.width, this.player.x + this.player.speed * deltaTime);
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(0, this.player.y - this.player.speed * deltaTime);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(this.config.HEIGHT - this.player.height, this.player.y + this.player.speed * deltaTime);
        }
        
        // Стрельба
        if (this.player.fireCooldown > 0) {
            this.player.fireCooldown -= deltaTime;
        }
        
        if ((this.keys['Space'] || this.touchControls['Space']) && this.canShoot()) {
            this.shoot();
        }
    }
    
    canShoot() {
        return this.player.bulletStorage > 0 && this.player.fireCooldown <= 0;
    }
    
    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2.5,
            y: this.player.y,
            width: 5,
            height: 15,
            speed: this.config.BULLET_SPEED,
            color: '#ffff00'
        });
        
        this.player.bulletStorage--;
        this.player.fireCooldown = 15;
        this.updateUI();
    }
    
    spawnObstacle() {
        const obstacle = {
            x: Math.random() * (this.config.WIDTH - 50),
            y: -50,
            width: 50,
            height: 50,
            speed: this.config.OBSTACLE_SPEED + this.level * 0.2
        };
        this.obstacles.push(obstacle);
    }
    
    updateObstacles(deltaTime) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += obstacle.speed * deltaTime;
            
            // Удаляем вышедшие за экран препятствия
            if (obstacle.y > this.config.HEIGHT) {
                this.obstacles.splice(i, 1);
                this.score += 5;
                this.updateUI();
            }
        }
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y += bullet.speed * deltaTime;
            
            // Удаляем пули за экраном
            if (bullet.y < -bullet.height) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.y += particle.vy;
            particle.x += particle.vx;
            particle.vy += 0.1;
            particle.life -= deltaTime;
            particle.size *= 0.95;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Проверка столкновений пуль с препятствиями
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.obstacles.length - 1; j >= 0; j--) {
                const obstacle = this.obstacles[j];
                
                if (this.isColliding(bullet, obstacle)) {
                    this.bullets.splice(i, 1);
                    this.obstacles.splice(j, 1);
                    this.score += 1;
                    this.updateUI();
                    this.createExplosion(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                    break;
                }
            }
        }
        
        // Проверка столкновений игрока с препятствиями
        if (this.invincibleTimer <= 0) {
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                
                if (this.isColliding(this.player, obstacle)) {
                    this.handleCollision();
                    this.obstacles.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    handleCollision() {
        this.player.lives--;
        this.updateUI();
        this.invincibleTimer = this.config.INVINCIBLE_TIME;
        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
        
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 - 2,
                color: `hsl(${Math.random() * 60}, 100%, 50%)`,
                life: Math.random() * 30 + 20,
                size: Math.random() * 3 + 1,
                maxLife: 50
            });
        }
    }
    
    checkLevelUp() {
        const currentThreshold = this.levelThresholds[this.level - 1];
        if (currentThreshold && this.score >= currentThreshold) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.gameState = 'levelup';
        this.showScreen('upgradeScreen');
    }
    
    applyUpgrade(upgradeType) {
        switch(upgradeType) {
            case 'smaller':
                this.player.size *= 0.8;
                break;
            case 'life':
                this.player.lives++;
                break;
            case 'bullets':
                this.player.bulletStorage += 5;
                break;
        }
        
        this.updateUI();
        this.showScreen('gameScreen');
        this.gameState = 'playing';
        this.gameLoop();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spacejet_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('finalLevel').textContent = this.level;
        
        this.showScreen('gameOverScreen');
        
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                action: 'game_over',
                score: this.score,
                level: this.level
            }));
        }
    }
    
    pauseGame() {
        console.log('Game paused');
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
        
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.config.WIDTH, this.config.HEIGHT);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
        }
        
        this.obstacles.forEach(obstacle => {
            if (this.images.obstacle) {
                this.ctx.drawImage(this.images.obstacle, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                this.ctx.fillStyle = '#f00';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 25, obstacle.y + 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        if (this.invincibleTimer <= 0 || Math.floor(this.invincibleTimer / 5) % 2 === 0) {
            if (this.images.plane) {
                const renderWidth = this.player.width * this.player.size;
                const renderHeight = this.player.height * this.player.size;
                const renderX = this.player.x + (this.player.width - renderWidth) / 2;
                const renderY = this.player.y + (this.player.height - renderHeight) / 2;
                this.ctx.drawImage(this.images.plane, renderX, renderY, renderWidth, renderHeight);
            } else {
                this.ctx.fillStyle = '#00f';
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
    }
    
    updateUI() {
        const scoreElement = document.getElementById('scoreValue');
        const livesElement = document.getElementById('livesValue');
        const bulletsElement = document.getElementById('bulletsValue');
        const levelElement = document.getElementById('levelValue');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = this.player?.lives || 0;
        if (bulletsElement) bulletsElement.textContent = `${this.player?.bulletStorage || 0}/5`;
        if (levelElement) levelElement.textContent = this.level;
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceJetGame();
    
    document.getElementById('startButton').addEventListener('click', () => {
        game.startGame();
    });
    
    document.getElementById('restartButton').addEventListener('click', () => {
        game.startGame();
    });
    
    document.getElementById('menuButton').addEventListener('click', () => {
        game.showScreen('menuScreen');
        game.gameState = 'menu';
    });
    
    document.getElementById('backButton').addEventListener('click', () => {
        game.showScreen('menuScreen');
    });
    
    document.getElementById('leaderboardButton').addEventListener('click', () => {
        game.showScreen('leaderboardScreen');
    });
    
    document.getElementById('shareButton').addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'SpaceJet Game',
                text: `I scored ${game.score} points in SpaceJet! Can you beat me?`,
                url: window.location.href
            });
        }
    });
    
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const upgradeType = btn.dataset.upgrade;
            game.applyUpgrade(upgradeType);
        });
    });
    
    window.game = game;
});
