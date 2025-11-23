// Главный класс игры
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
        { name: 'background', src: './assets/background.jpg' },
        { name: 'heart', src: './assets/heart.png' },
        { name: 'gameOver', src: './assets/game-over.jpg' }
    ];
    
    console.log('🔄 Starting assets loading...');
    
    // Сбрасываем счетчик
    this.loadedAssets = 0;
    this.totalAssets = assets.length;
    
    try {
        // Загружаем все картинки параллельно
        await Promise.all(assets.map(asset => this.loadImage(asset)));
        console.log('✅ All assets loaded successfully!');
        
        // Переходим к меню только после загрузки
        this.showScreen('menuScreen');
        this.gameState = 'menu';
        
    } catch (error) {
        console.log('❌ Some assets failed to load:', error);
        // Все равно показываем меню, но используем fallback
        this.showScreen('menuScreen');
        this.gameState = 'menu';
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
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // Создаем разноцветные квадраты вместо картинок
    switch(name) {
        case 'plane':
            ctx.fillStyle = '#4ecdc4'; // голубой
            ctx.fillRect(0, 0, 50, 50);
            break;
        case 'obstacle':
            ctx.fillStyle = '#ff6b6b'; // красный
            ctx.beginPath();
            ctx.arc(25, 25, 25, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'background':
            ctx.fillStyle = '#000000'; // черный
            ctx.fillRect(0, 0, 500, 800);
            break;
        case 'heart':
            ctx.fillStyle = '#ff6b6b'; // красный
            ctx.fillRect(0, 0, 16, 16);
            break;
        default:
            ctx.fillStyle = '#ffff00'; // желтый
            ctx.fillRect(0, 0, 50, 50);
    }
    
    this.images[name] = new Image();
    this.images[name].src = canvas.toDataURL();
}

createFallbackImage(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // Создаем разноцветные квадраты вместо картинок
    switch(name) {
        case 'plane':
            ctx.fillStyle = '#4ecdc4'; // голубой
            ctx.fillRect(0, 0, 50, 50);
            break;
        case 'obstacle':
            ctx.fillStyle = '#ff6b6b'; // красный
            ctx.beginPath();
            ctx.arc(25, 25, 25, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'background':
            ctx.fillStyle = '#000000'; // черный
            ctx.fillRect(0, 0, 500, 800);
            break;
        case 'heart':
            ctx.fillStyle = '#ff6b6b'; // красный
            ctx.fillRect(0, 0, 16, 16);
            break;
        default:
            ctx.fillStyle = '#ffff00'; // желтый
            ctx.fillRect(0, 0, 50, 50);
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
        
        addTouchStart(leftBtn, 'ArrowLeft');
        addTouchEnd(leftBtn, 'ArrowLeft');
        
        addTouchStart(rightBtn, 'ArrowRight');
        addTouchEnd(rightBtn, 'ArrowRight');
        
        addTouchStart(upBtn, 'ArrowUp');
        addTouchEnd(upBtn, 'ArrowUp');
        
        addTouchStart(shootBtn, 'Space');
        addTouchEnd(shootBtn, 'Space');
    }
    
    startGame() {
        // Сброс состояния игры
        this.player = new Player(this);
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
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2); // Ограничиваем deltaTime
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Обновляем игрока
        this.player.update(deltaTime);
        
        // Спавн препятствий
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= 2.0) { // Каждые 2 секунды
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
                this.score += 5; // Очки за уклонение
                this.updateUI();
            }
        }
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            
            // Удаляем пули за экраном
            if (bullet.y < -bullet.height) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            // Удаляем "мертвые" частицы
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
                    // Уничтожаем пулю и препятствие
                    this.bullets.splice(i, 1);
                    this.obstacles.splice(j, 1);
                    
                    // Добавляем очки
                    this.score += 1;
                    this.updateUI();
                    
                    // Создаем эффект взрыва
                    this.createExplosion(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                    break;
                }
            }
        }
        
        // Проверка столкновений игрока с препятствиями (только если не неуязвим)
        if (this.invincibleTimer <= 0) {
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                
                if (this.isColliding(this.player, obstacle)) {
                    // Обрабатываем столкновение
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
        // Уменьшаем жизни
        this.player.lives--;
        this.updateUI();
        
        // Включаем неуязвимость
        this.invincibleTimer = this.config.INVINCIBLE_TIME;
        
        // Создаем эффект столкновения
        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
        
        // Проверяем Game Over
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(
                x, y,
                Math.random() * 4 - 2,
                Math.random() * 4 - 2,
                `hsl(${Math.random() * 60}, 100%, 50%)`,
                Math.random() * 30 + 20
            ));
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
        this.gameLoop(); // Перезапускаем игровой цикл
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // Обновляем рекорд
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spacejet_highscore', this.highScore);
        }
        
        // Обновляем финальный экран
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('finalLevel').textContent = this.level;
        
        this.showScreen('gameOverScreen');
        
        // Отправляем результат в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                action: 'game_over',
                score: this.score,
                level: this.level
            }));
        }
    }
    
    pauseGame() {
        // Реализация паузы (можно добавить позже)
        console.log('Game paused');
    }
    
    render() {
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
        
        // Рендер фона
        this.ctx.drawImage(this.images.background, 0, 0, this.config.WIDTH, this.config.HEIGHT);
        
        // Рендер препятствий
        this.obstacles.forEach(obstacle => {
            this.ctx.drawImage(this.images.obstacle, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Рендер пуль
        this.bullets.forEach(bullet => {
            bullet.render(this.ctx);
        });
        
        // Рендер частиц
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        // Рендер игрока (с эффектом мигания при неуязвимости)
        if (this.invincibleTimer <= 0 || Math.floor(this.invincibleTimer / 5) % 2 === 0) {
            this.player.render(this.ctx, this.images.plane);
        }
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('livesValue').textContent = this.player?.lives || 0;
        document.getElementById('bulletsValue').textContent = `${this.player?.bulletStorage || 0}/5`;
        document.getElementById('levelValue').textContent = this.level;
    }
    
    showScreen(screenId) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Показываем нужный экран
        document.getElementById(screenId).classList.remove('hidden');
    }
}

// Класс игрока
class Player {
    constructor(game) {
        this.game = game;
        this.x = game.config.WIDTH / 2 - 25;
        this.y = game.config.HEIGHT - 100;
        this.width = 50;
        this.height = 50;
        this.speed = game.config.PLANE_SPEED;
        this.lives = 3;
        this.bulletStorage = 5;
        this.fireCooldown = 0;
        this.size = 1.0;
    }
    
    update(deltaTime) {
        // Движение
        if (this.game.keys['ArrowLeft'] || this.game.keys['KeyA']) {
            this.x = Math.max(0, this.x - this.speed * deltaTime);
        }
        if (this.game.keys['ArrowRight'] || this.game.keys['KeyD']) {
            this.x = Math.min(this.game.config.WIDTH - this.width, this.x + this.speed * deltaTime);
        }
        if (this.game.keys['ArrowUp'] || this.game.keys['KeyW']) {
            this.y = Math.max(0, this.y - this.speed * deltaTime);
        }
        if (this.game.keys['ArrowDown'] || this.game.keys['KeyS']) {
            this.y = Math.min(this.game.config.HEIGHT - this.height, this.y + this.speed * deltaTime);
        }
        
        // Стрельба
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }
        
        if ((this.game.keys['Space'] || this.game.touchControls['Space']) && this.canShoot()) {
            this.shoot();
        }
    }
    
    canShoot() {
        return this.bulletStorage > 0 && this.fireCooldown <= 0;
    }
    
    shoot() {
        this.game.bullets.push(new Bullet(
            this.x + this.width / 2 - 2.5,
            this.y,
            this.game.config.BULLET_SPEED
        ));
        
        this.bulletStorage--;
        this.fireCooldown = 15;
        this.game.updateUI();
    }
    
    render(ctx, image) {
        const renderWidth = this.width * this.size;
        const renderHeight = this.height * this.size;
        const renderX = this.x + (this.width - renderWidth) / 2;
        const renderY = this.y + (this.height - renderHeight) / 2;
        
        ctx.drawImage(image, renderX, renderY, renderWidth, renderHeight);
    }
}

// Класс пули
class Bullet {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = speed;
        this.color = '#ffff00';
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Эффект свечения
        ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
        ctx.fillRect(this.x - 1, this.y - 2, this.width + 2, this.height + 4);
    }
}

// Класс частиц для эффектов
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Гравитация
        this.life -= deltaTime;
        this.size *= 0.95;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Инициализация игры когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceJetGame();
    
    // Назначаем обработчики кнопок
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
        // Здесь можно загрузить таблицу лидеров
    });
    
    document.getElementById('shareButton').addEventListener('click', () => {
        // Поделиться результатом
        if (navigator.share) {
            navigator.share({
                title: 'SpaceJet Game',
                text: `I scored ${game.score} points in SpaceJet! Can you beat me?`,
                url: window.location.href
            });
        }
    });
    
    // Обработчики улучшений
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const upgradeType = btn.dataset.upgrade;
            game.applyUpgrade(upgradeType);
        });
    });
    
    // Делаем глобальным для отладки
    window.game = game;
});
