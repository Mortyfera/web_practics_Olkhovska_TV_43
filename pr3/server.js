const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const dataFilePath = path.join(__dirname, 'data.json');
const SECRET_KEY = 'super_secret_energy_key_2026';

app.use(express.json());
app.use(express.static('public'));

function readData() {
    if (!fs.existsSync(dataFilePath)) return [];
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), 'utf8');
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === '12345') {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Невірний логін або пароль' });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Доступ заборонено. Немає токена.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Токен недійсний або прострочений.' });
        req.user = user;
        next();
    });
}


app.get('/api/points', authenticateToken, (req, res) => {
    try {
        const points = readData();
        points.sort((a, b) => b.id - a.id);
        res.json(points);
    } catch (error) {
        res.status(500).json({ error: 'Помилка читання файлу' });
    }
});

app.post('/api/points', authenticateToken, (req, res) => {
    try {
        const points = readData();
        const newPoint = {
            id: Date.now().toString(), 
            pointNumber: req.body.pointNumber,
            objectName: req.body.objectName,
            meterDetails: req.body.meterDetails,
            verificationDate: req.body.verificationDate,
            underControl: req.body.underControl || false,
            registrationDate: new Date().toISOString()
        };
        points.push(newPoint); 
        writeData(points);     
        res.json({ success: true, message: 'Точку успішно зареєстровано' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка запису у файл' });
    }
});

app.delete('/api/points/:id', authenticateToken, (req, res) => {
    try {
        let points = readData();
        points = points.filter(point => point.id !== req.params.id);
        writeData(points);
        res.json({ success: true, message: 'Точку видалено' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка видалення' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущено: http://localhost:${port}`);
});
