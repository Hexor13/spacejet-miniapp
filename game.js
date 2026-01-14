// SpaceJet Game - Working Version with Mobile Controls
class SpaceJetGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.config = {
            WIDTH: 500,
            HEIGHT: 800,
            PLANE_SPEED: 5
        };
        
        this.gameState = 'menu';
        this.score = 0;
        this.player = null;
        this.obstacles = [];
        this.bullets = [];
        this.keys = {};
        this.texturesLoaded = false;
        this.mobileButtons = {}; // Для отслеживания состояния мобильных кнопок
        
        this.init();
        this.loadTextures();
        this.setupMobileControls(); // Добавляем мобильное управление
    }
    
    loadTextures() {
        // Загружаем только нужные текстуры (пули рисуем программно)
        this.textures = {
            player: new Image(),
            enemy: new Image(),
            heart: new Image(),
            background: new Image()
        };
        
        this.textures.player.src = './assets/plane.png';
        this.textures.enemy.src = './assets/obstacle.png';
        this.textures.heart.src = './assets/heart.png';
        this.textures.background.src = './assets/background.jpg';
        
        let loadedCount = 0;
        const totalTextures = Object.keys(this.textures).length;
        
        Object.values(this.textures).forEach(img => {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalTextures) {
                    this.texturesLoaded = true;
                }
            };
            
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalTextures) {
                    this.texturesLoaded = false;
                }
            };
        });
    }
    
    init() {
        this.resizeCanvas();
        this.setupKeyboardControls();
        this.showScreen('menuScreen');
    }
    
    resizeCanvas() {
        this.canvas.width = this.config.WIDTH;
        this.canvas.height = this.config.HEIGHT;
    }
    
    setupKeyboardControls() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupMobileControls() {
        // Инициализируем состояние кнопок
        this.mobileButtons = {
            left: false,
            right: false,
            up: false,
            shoot: false
        };
        
        // Находим кнопки
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const upBtn = document.getElementById('upBtn');
        const shootBtn = document.getElementById('shootBtn');
        
        // Функции для обработки нажатий
        const addButtonListeners = (button, direction) => {
            if (!button) return;
            
            // Нажатие
            const downHandler = (e) => {
                e.preventDefault();
                this.mobileButtons[direction] = true;
                button.classList.add('active');
            };
            
            // Отпускание
            const upHandler = (e) => {
                e.preventDefault();
                this.mobileButtons[direction] = false;
                button.classList.remove('active');
            };
            
            // Добавляем обработчики для мыши
            button.addEventListener('mousedown', downHandler);
            button.addEventListener('mouseup', upHandler);
            button.addEventListener('mouseleave', upHandler);
            
            // Добавляем обработчики для касания
            button.addEventListener('touchstart', downHandler);
            button.addEventListener('touchend', upHandler);
            button.addEventListener('touchcancel', upHandler);
        };
        
        // Настраиваем кнопки
        addButtonListeners(leftBtn, 'left');
        addButtonListeners(rightBtn, 'right');
        addButtonListeners(upBtn, 'up');
        addButtonListeners(shootBtn, 'shoot');
    }
    
    startGame() {
        this.player = {
            x: this.config.WIDTH / 2 - 25,
            y: this.config.HEIGHT - 100,
            width: 50,
            height: 50,
            lives: 3,
            bulletStorage: 5,
            fireCooldown: 0
        };
        
        this.obstacles = [];
        this.bullets = [];
        this.score = 0;
        
        this.showScreen('gameScreen');
        this.gameState = 'playing';
        this.gameLoop();
        
        this.startObstacleSpawning();
    }
    
    startObstacleSpawning() {
        // Очищаем предыдущий интервал если есть
        if (this.obstacleInterval) {
            clearInterval(this.obstacleInterval);
        }
        
        this.obstacleInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.obstacles.push({
                    x: Math.random() * (this.config.WIDTH - 50),
                    y: -50,
                    width: 50,
                    height: 50,
                    speed: 3
                });
            }
        }, 2000);
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Движение игрока - КЛАВИАТУРА
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - 5);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.config.WIDTH - 50, this.player.x + 5);
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(0, this.player.y - 5);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(this.config.HEIGHT - 50, this.player.y + 5);
        }
        
        // Движение игрока - МОБИЛЬНЫЕ КНОПКИ
        if (this.mobileButtons.left) {
            this.player.x = Math.max(0, this.player.x - 5);
        }
        if (this.mobileButtons.right) {
            this.player.x = Math.min(this.config.WIDTH - 50, this.player.x + 5);
        }
        if (this.mobileButtons.up) {
            this.player.y = Math.max(0, this.player.y - 5);
        }
        
        // Стрельба - КЛАВИАТУРА
        if (this.player.fireCooldown > 0) {
            this.player.fireCooldown--;
        }
        
        if ((this.keys['Space'] || this.mobileButtons.shoot) && 
            this.player.bulletStorage > 0 && 
            this.player.fireCooldown === 0) {
            this.bullets.push({
                x: this.player.x + 22.5,
                y: this.player.y,
                width: 5,
                height: 15,
                speed: -10
            });
            this.player.bulletStorage--;
            this.player.fireCooldown = 15;
            
            // Сбрасываем состояние кнопки стрельбы (чтобы не залипала)
            this.mobileButtons.shoot = false;
            document.getElementById('shootBtn')?.classList.remove('active');
        }
        
        // Обновление препятствий
        this.obstacles.forEach(obstacle => {
            obstacle.y += obstacle.speed;
        });
        this.obstacles = this.obstacles.filter(obs => obs.y < this.config.HEIGHT);
        
        // Обновление пуль
        this.bullets.forEach(bullet => {
            bullet.y += bullet.speed;
        });
        this.bullets = this.bullets.filter(bullet => bullet.y > -20);
        
        // Проверка коллизий
        this.checkCollisions();
        
        // Обновление UI
        this.updateUI();
    }
    
    checkCollisions() {
        // Пули с препятствиями
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.obstacles.length - 1; j >= 0; j--) {
                const obstacle = this.obstacles[j];
                if (this.isColliding(bullet, obstacle)) {
                    this.bullets.splice(i, 1);
                    this.obstacles.splice(j, 1);
                    this.score += 1;
                    break;
                }
            }
        }
        
        // Игрок с препятствиями
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (this.isColliding(this.player, obstacle)) {
                this.obstacles.splice(i, 1);
                this.player.lives--;
                if (this.player.lives <= 0) {
                    this.gameOver();
                }
                break;
            }
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    render() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
        
        // Фон
        if (this.textures.background.complete && this.texturesLoaded) {
            this.ctx.drawImage(this.textures.background, 0, 0, this.config.WIDTH, this.config.HEIGHT);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
            
            // Звёзды
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.config.WIDTH;
                const y = Math.random() * this.config.HEIGHT;
                const size = Math.random() * 2;
                this.ctx.fillRect(x, y, size, size);
            }
        }
        
        // Игрок
        if (this.textures.player.complete && this.texturesLoaded) {
            this.ctx.drawImage(this.textures.player, this.player.x, this.player.y, 50, 50);
        } else {
            this.ctx.fillStyle = '#4ecdc4';
            this.ctx.fillRect(this.player.x, this.player.y, 50, 50);
        }
        
        // Враги
        this.obstacles.forEach(obstacle => {
            if (this.textures.enemy.complete && this.texturesLoaded) {
                this.ctx.drawImage(this.textures.enemy, obstacle.x, obstacle.y, 50, 50);
            } else {
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 25, obstacle.y + 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Пули
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, 5, 15);
        });
        
        // UI на канвасе
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Bullets: ${this.player.bulletStorage}/5`, 10, 90);
    }
    
    updateUI() {
        const scoreElement = document.getElementById('scoreValue');
        const livesElement = document.getElementById('livesValue');
        const bulletsElement = document.getElementById('bulletsValue');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = this.player.lives;
        if (bulletsElement) bulletsElement.textContent = `${this.player.bulletStorage}/5`;
    }
    
    gameOver() {
        this.gameState = 'gameover';
        clearInterval(this.obstacleInterval);
        document.getElementById('finalScore').textContent = this.score;
        
        // Сохраняем рекорд если есть Telegram
        if (window.telegramApp && window.telegramApp.tg) {
            window.telegramApp.saveScore(this.score);
        }
        
        this.showScreen('gameOverScreen');
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
}

// Запуск игры
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
    });
    
    document.getElementById('leaderboardButton').addEventListener('click', () => {
        game.showScreen('leaderboardScreen');
    });
    
    document.getElementById('backButton').addEventListener('click', () => {
        game.showScreen('menuScreen');
    });
    
    window.game = game;
    
    // Сразу показываем меню
    game.showScreen('menuScreen');
});
