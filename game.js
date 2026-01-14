
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
        // Загружаем только нужные текстуры (пули рисуем программно)
        this.textures = {
            player: new Image(),      // plane.png
            enemy: new Image(),       // obstacle.png
            heart: new Image(),       // heart.png
            background: new Image()   // background.jpg
        };
        
        // ИСПРАВЛЕННЫЕ ПУТИ К ВАШИМ ФАЙЛАМ:
        this.textures.player.src = './assets/plane.png';        // ваш корабль
        this.textures.enemy.src = './assets/obstacle.png';      // враги
        this.textures.heart.src = './assets/heart.png';         // сердечки
        this.textures.background.src = './assets/background.jpg'; // фон
        
        // Счётчик загруженных текстур
        let loadedCount = 0;
        const totalTextures = Object.keys(this.textures).length; // теперь 4
        
        // Проверяем загрузку каждой текстуры
        Object.values(this.textures).forEach(img => {
            img.onload = () => {
                loadedCount++;
                console.log(`✅ Загружено: ${loadedCount}/${totalTextures}`);
                
                if (loadedCount === totalTextures) {
                    this.texturesLoaded = true;
                    console.log('✅ Все текстуры загружены!');
                }
            };
            
            img.onerror = (e) => {
                console.log(`❌ Ошибка загрузки: ${img.src}`);
                console.log('Используем запасные варианты...');
                
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
        
        // ФОН: используем background.jpg если есть, иначе черный
        if (this.textures.background.complete && this.texturesLoaded) {
            this.ctx.drawImage(this.textures.background, 0, 0, this.config.WIDTH, this.config.HEIGHT);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
            
            // Рисуем звёзды на фоне (опционально)
            this.drawStars();
        }
        
        // ИГРОК: plane.png если есть, иначе синий квадрат
        if (this.textures.player.complete && this.texturesLoaded) {
            this.ctx.drawImage(this.textures.player, this.player.x, this.player.y, 50, 50);
        } else {
            this.ctx.fillStyle = '#4ecdc4';
            this.ctx.fillRect(this.player.x, this.player.y, 50, 50);
        }
        
        // ВРАГИ: obstacle.png если есть, иначе красные круги
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
        
        // ПУЛИ: рисуем как жёлтые прямоугольники (всегда)
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, 5, 15);
        });
        
        // СЕРДЕЧКИ на канвасе: heart.png если есть, иначе эмодзи
        if (this.textures.heart.complete && this.texturesLoaded) {
            for (let i = 0; i < this.player.lives; i++) {
                this.ctx.drawImage(this.textures.heart, 120 + i * 35, 45, 30, 30);
            }
        } else {
            this.ctx.fillStyle = '#ff0000';
            for (let i = 0; i < this.player.lives; i++) {
                this.ctx.beginPath();
                this.ctx.arc(135 + i * 35, 60, 12, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // UI ТЕКСТ
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Bullets: ${this.player.bulletStorage}/5`, 10, 90);
    }
    
    // Функция для рисования звёзд на фоне
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.config.WIDTH;
            const y = Math.random() * this.config.HEIGHT;
            const size = Math.random() * 2;
            this.ctx.fillRect(x, y, size, size);
        }
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
            console.log('⚠️ Некоторые текстуры не загрузились, но игра работает с запасными вариантами');
        }
    }, 3000);
});
