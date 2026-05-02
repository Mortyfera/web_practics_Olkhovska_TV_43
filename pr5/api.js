class GeothermalAPI {
    constructor(url, onDataCallback, onStatusCallback) {
        this.url = url;
        this.onData = onDataCallback;
        this.onStatus = onStatusCallback;
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('З\'єднано з сервером');
            this.onStatus(true);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.onData(data);
            } catch (err) {
                console.error('Помилка обробки даних:', err);
            }
        };

        this.socket.onclose = () => {
            console.warn('Зв\'язок втрачено. Спроба перепідключення...');
            this.onStatus(false);
            setTimeout(() => this.connect(), 5000); 
        };

        this.socket.onerror = (error) => {
            console.error('Помилка WebSocket:', error);
        };
    }
}
