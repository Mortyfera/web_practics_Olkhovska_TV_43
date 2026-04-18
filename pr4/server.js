const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json({ limit: '100kb' }));

let apiStats = {
    totalRequests: 0,
    methods: { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 }
};

app.use((req, res, next) => {
    apiStats.totalRequests++;
    if (apiStats.methods[req.method] !== undefined) {
        apiStats.methods[req.method]++;
    }
    next();
});

app.use((req, res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.originalUrl}`);
    next();
});

let capacitorBanks = [
    {
        id: 1,
        name: "КУ-1 10кВ Головна",
        ratedPower: 900,
        activePower: 450,
        stepsCount: 6,
        activeSteps: 3,
        voltage: 10.5,
        powerFactor: 0.95,
        mode: "auto"
    },
    {
        id: 2,
        name: "КУ-2 0.4кВ Цех",
        ratedPower: 300,
        activePower: 100,
        stepsCount: 3,
        activeSteps: 1,
        voltage: 0.4,
        powerFactor: 0.92,
        mode: "manual"
    }
];

app.get('/api/capacitor-banks', (req, res) => {
    const { mode } = req.query;
    if (mode) {
        const filtered = capacitorBanks.filter(cb => cb.mode === mode);
        return res.json(filtered);
    }
    res.json(capacitorBanks);
});

app.get('/api/capacitor-banks/:id', (req, res) => {
    const bank = capacitorBanks.find(cb => cb.id === parseInt(req.params.id));
    if (!bank) {
        return res.status(404).json({ error: 'Установку не знайдено' });
    }
    res.json(bank);
});

app.get('/api/capacitor-banks/:id/compensation', (req, res) => {
    const bank = capacitorBanks.find(cb => cb.id === parseInt(req.params.id));
    if (!bank) {
        return res.status(404).json({ error: 'Установку не знайдено' });
    }
    
    const compensationData = {
        activePower: bank.activePower,
        ratedPower: bank.ratedPower,
        powerFactor: bank.powerFactor,
        usagePercentage: ((bank.activePower / bank.ratedPower) * 100).toFixed(1) + '%'
    };
    res.json(compensationData);
});

app.post('/api/capacitor-banks', (req, res) => {
    const { name, ratedPower, stepsCount, voltage, mode } = req.body;
    
    if (!name || !ratedPower || !stepsCount || !voltage || !mode) {
        return res.status(400).json({ 
            error: 'Відсутні обов\'язкові поля',
            required: ['name', 'ratedPower', 'stepsCount', 'voltage', 'mode']
        });
    }

    const newBank = {
        id: capacitorBanks.length > 0 ? Math.max(...capacitorBanks.map(b => b.id)) + 1 : 1,
        name,
        ratedPower,
        activePower: 0,
        stepsCount,
        activeSteps: 0,
        voltage,
        powerFactor: 1.0,
        mode
    };
    
    capacitorBanks.push(newBank);
    res.status(201).json(newBank);
});

app.post('/api/capacitor-banks/:id/switch-step', (req, res) => {
    const bank = capacitorBanks.find(cb => cb.id === parseInt(req.params.id));
    if (!bank) {
        return res.status(404).json({ error: 'Установку не знайдено' });
    }

    if (bank.mode === 'auto') {
        return res.status(400).json({ error: 'Неможливо перемкнути ступінь вручну в автоматичному режимі' });
    }

    const { action } = req.body;
    
    if (action === 'up') {
        if (bank.activeSteps < bank.stepsCount) {
            bank.activeSteps++;
            bank.activePower += (bank.ratedPower / bank.stepsCount);
        } else {
            return res.status(400).json({ error: 'Увімкнені всі можливі ступені' });
        }
    } else if (action === 'down') {
        if (bank.activeSteps > 0) {
            bank.activeSteps--;
            bank.activePower -= (bank.ratedPower / bank.stepsCount);
        } else {
            return res.status(400).json({ error: 'Всі ступені вже вимкнені' });
        }
    } else {
        return res.status(400).json({ error: 'Некоректна дія. Використовуйте "up" або "down"' });
    }

    res.json({ message: 'Ступінь успішно перемкнуто', bank });
});

app.put('/api/capacitor-banks/:id/mode', (req, res) => {
    const bank = capacitorBanks.find(cb => cb.id === parseInt(req.params.id));
    if (!bank) {
        return res.status(404).json({ error: 'Установку не знайдено' });
    }

    const { mode } = req.body;
    if (mode !== 'auto' && mode !== 'manual') {
        return res.status(400).json({ error: 'Некоректний режим. Використовуйте "auto" або "manual"' });
    }

    bank.mode = mode;
    res.json({ message: 'Режим успішно змінено', bank });
});

app.patch('/api/capacitor-banks/:id', (req, res) => {
    const bank = capacitorBanks.find(cb => cb.id === parseInt(req.params.id));
    if (!bank) {
        return res.status(404).json({ error: 'Установку не знайдено' });
    }

    Object.assign(bank, req.body);
    bank.id = parseInt(req.params.id); 

    res.json({ message: 'Дані частково оновлено', bank });
});

app.delete('/api/capacitor-banks/:id', (req, res) => {
    const index = capacitorBanks.findIndex(cb => cb.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Установку не знайдено' });
    }

    const deleted = capacitorBanks.splice(index, 1);
    res.json({ message: 'Установку видалено', bank: deleted[0] });
});

app.get('/api/stats', (req, res) => {
    res.json(apiStats);
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
    console.log('Доступні endpoints (Варіант 13 + Усі додаткові функції):');
    console.log('  GET    /api/capacitor-banks');
    console.log('  GET    /api/capacitor-banks/:id');
    console.log('  GET    /api/capacitor-banks/:id/compensation');
    console.log('  POST   /api/capacitor-banks');
    console.log('  POST   /api/capacitor-banks/:id/switch-step');
    console.log('  PUT    /api/capacitor-banks/:id/mode');
    console.log('  PATCH  /api/capacitor-banks/:id');
    console.log('  DELETE /api/capacitor-banks/:id');
    console.log('  GET    /api/stats');
});
