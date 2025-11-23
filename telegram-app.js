// Интеграция с Telegram Web App
class TelegramIntegration {
    constructor() {
        this.tg = null;
        this.user = null;
        this.init();
    }
    
    init() {
        // Проверяем, что мы в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            
            // Инициализируем Web App
            this.setupWebApp();
            
            // Получаем данные пользователя
            this.setupUserData();
            
            // Настраиваем интерфейс
            this.setupUI();
            
            console.log('Telegram Web App initialized');
        } else {
            console.log('Running in browser mode');
        }
    }
    
    setupWebApp() {
        // Расширяем на весь экран
        this.tg.expand();
        
        // Настраиваем цвета
        this.tg.setHeaderColor('#000000');
        this.tg.setBackgroundColor('#000000');
        
        // Включаем кнопку "Назад"
        this.tg.BackButton.show();
        this.tg.BackButton.onClick(() => {
            this.handleBackButton();
        });
    }
    
    setupUserData() {
        // Получаем данные пользователя
        this.user = this.tg.initDataUnsafe?.user;
        
        if (this.user) {
            console.log('User data:', this.user);
            
            // Можно персонализировать игру
            if (this.user.first_name) {
                const welcomeElement = document.getElementById('welcomeMessage');
                if (welcomeElement) {
                    welcomeElement.textContent = `Welcome, ${this.user.first_name}!`;
                }
            }
        }
    }
    
    setupUI() {
        // Настраиваем виджет облака тегов
        this.tg.CloudStorage.getItems((error, items) => {
            if (!error && items) {
                console.log('Cloud storage:', items);
            }
        });
    }
    
    handleBackButton() {
        // Логика кнопки "Назад" в зависимости от экрана
        const currentScreen = document.querySelector('.screen:not(.hidden)').id;
        
        switch(currentScreen) {
            case 'gameScreen':
                // Показываем подтверждение выхода
                this.showExitConfirm();
                break;
            case 'upgradeScreen':
            case 'gameOverScreen':
            case 'leaderboardScreen':
                document.getElementById('menuScreen').classList.remove('hidden');
                document.getElementById(currentScreen).classList.add('hidden');
                break;
            default:
                this.tg.close();
        }
    }
    
    showExitConfirm() {
        if (confirm('Are you sure you want to exit the game?')) {
            this.tg.close();
        }
    }
    
    // Сохранение счета в облачное хранилище Telegram
    saveScore(score) {
        if (this.tg) {
            this.tg.CloudStorage.setItem('high_score', score.toString(), (error, success) => {
                if (success) {
                    console.log('Score saved to cloud storage');
                }
            });
        }
    }
    
    // Получение таблицы лидеров
    getLeaderboard() {
        // Здесь можно реализовать получение лидерборда
        // через Cloud Storage или внешний API
        return [
            { name: 'Player1', score: 1500 },
            { name: 'Player2', score: 1200 },
            { name: 'Player3', score: 900 }
        ];
    }
    
    // Отправка данных в бота
    sendGameData(data) {
        if (this.tg) {
            this.tg.sendData(JSON.stringify(data));
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.telegramApp = new TelegramIntegration();
});