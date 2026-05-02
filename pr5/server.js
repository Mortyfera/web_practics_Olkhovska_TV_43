const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket сервер геотермальної станції запущено на порту 8080');

function generateGeothermalData() {
    const power = 15 + (Math.random() - 0.5) * 2;
    return {
        timestamp: Date.now(),
        fluidTemp: 151 + (Math.random() - 0.5) * 5,
        steamPressure: 22 + (Math.random() - 0.5) * 2,
        power: power,
        flowRate: 112 + (Math.random() - 0.5) * 10,
        efficiency: 12 + (Math.random() - 0.5),
        tsPoints: {
            s: [1.14, 1.34, 1.78, 1.75, 1.14],
            t: [40, 150, 150, 40, 40],
        }
    };
}

wss.on('connection', (ws) => {
    console.log('Клієнт підключився');
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(generateGeothermalData()));
        }
    }, 2000);

    ws.on('close', () => {
        console.log('Клієнт відключився');
        clearInterval(interval);
    });
});
