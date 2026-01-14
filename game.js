// SpaceJet Game - Minimal Working Version
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
        
        this.init();
        this.loadTextures();
    }
    
    loadTextures() {
        // Загружаем текстуры
        this.textures = {
            player: new Image(),
            obstacle: new Image(),
            bullet: new Image(),
            heart: new Image(),
            background: new Image()
        };
        
        // Указываем пути к вашим картинкам
        this.textures.player.src = './assets/player.png';      // ваш корабль
        this.textures.obstacle.src = './assets/obstacle.png';        // ваши враги
        this.textures.bullet.src = './assets/bullet.png';      // ваши пули
        this.textures.heart.src = './assets/heart.png';        // ваши сердечки
        this.textures.background.src = './assets/background.png'; // фон (опционально)
        
        // Счётчик загруженных текстур
        let loadedCount = 0;
        const totalTextures = Object.keys(this.textures).length;
        
        // Проверяем загрузку каждой текстуры
        Object.values(this.textures).forEach(img => {
            img.onload = () => {
                loadedCount++;
                console.log(`✅ Загружено: ${loadedCount}/${totalTextures}`);
                
                if (loadedCount === totalTextures) {
                    this.texturesLoaded = true;
                    console.log('✅ Все текстуры загружены!');
                    
                    // Если уже в меню, обновляем отображение
                    if (this.gameState === 'menu') {
                        this.renderMenu();
                    }
                }
            };
            
            img.onerror = (e) => {
                console.log(`❌ Ошибка загрузки: ${img.src}`);
                console.log('Проверьте:');
                console.log('1. Файл существует в папке assets/');
                console.log('2. Правильное название файла');
                console.log('3. Файл загружен на GitHub');
                
                // Увеличиваем счётчик даже при ошибке, чтобы игра не зависла
                loadedCount++;
                if (loadedCount === totalTextures) {
                    this.texturesLoaded = false;
                    console.log('⚠️ Некоторые текстуры не загрузились, используем фигуры');
                }
            };
        });
    }
    
    init() {
        this.resizeCanvas();
        this.setupControls();
        this.showScreen('menuScreen');
    }
    
    resizeCanvas() {
        this.canvas.width = this.config.WIDTH;
        this.canvas.height = this.config.HEIGHT;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
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
        
        // Сразу начинаем спавн препятствий
        this.startObstacleSpawning();
    }
    
    startObstacleSpawning() {
        setInterval(() => {
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
        // Движение игрока
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
        
        // Стрельба
        if (this.player.fireCooldown > 0) {
            this.player.fireCooldown--;
        }
        
        if (this.keys['Space'] && this.player.bulletStorage > 0 && this.player.fireCooldown === 0) {
            this.bullets.push({
                x: this.player.x + 22.5,
                y: this.player.y,
                width: 5,
                height: 15,
                speed: -10
            });
            this.player.bulletStorage--;
            this.player.fireCooldown = 15;
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
        
        // Фон (если есть текстура, иначе черный)
        if (this.textures.background.complete && this.texturesLoaded) {
            this.ctx.drawImage(this.textures.background, 0, 0, this.config.WIDTH, this.config.HEIGHT);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
        }
        
        // Игрок (текстура или синий квадрат)
        if (this.textures.player.complete && this.texturesLoaded) {
            this.ctx.drawImage(this.textures.player, this.player.x, this.player.y, 50, 50);
        } else {
            this.ctx.fillStyle = '#4ecdc4';
            this.ctx.fillRect(this.player.x, this.player.y, 50, 50);
        }
        
        // Препятствия (текстура или красные круги)
        this.obstacles.forEach(obstacle => {
            if (this.textures.obstacle.complete && this.texturesLoaded) {
                this.ctx.drawImage(this.textures.obstacle, obstacle.x, obstacle.y, 50, 50);
            } else {
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 25, obstacle.y + 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Пули (текстура или желтые прямоугольники)
        this.bullets.forEach(bullet => {
            if (this.textures.bullet.complete && this.texturesLoaded) {
                this.ctx.drawImage(this.textures.bullet, bullet.x, bullet.y, 5, 15);
            } else {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(bullet.x, bullet.y, 5, 15);
            }
        });
        
        // UI на канвасе (дополнительные сердечки)
        if (this.textures.heart.complete && this.texturesLoaded) {
            for (let i = 0; i < this.player.lives; i++) {
                this.ctx.drawImage(this.textures.heart, 120 + i * 35, 45, 30, 30);
            }
        }
        
        // UI текст на канвасе (если хотите)
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
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
    
    // Рендер меню с текстурами
    renderMenu() {
        if (this.texturesLoaded) {
            console.log('Меню с текстурами готово');
        }
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
    
    window.game = game;
    
    // Сразу показываем меню
    game.showScreen('menuScreen');
    
    // Проверка загрузки текстур через 3 секунды
    setTimeout(() => {
        if (!game.texturesLoaded) {
            console.log('⚠️ Текстуры всё ещё загружаются...');
            console.log('Проверьте консоль на ошибки загрузки');
        }
    }, 3000);
});
