document.addEventListener('DOMContentLoaded', () => {
    const charts = new DashboardCharts();
    const dataHistory = []; 
    
    const handleStatusChange = (isOnline) => {
        const statusEl = document.getElementById('status');
        statusEl.textContent = isOnline? 'Онлайн' : 'Офлайн';
        statusEl.className = isOnline? 'status-online' : 'status-offline';
    };

    const handleNewData = (data) => {
        const timeStr = new Date(data.timestamp).toLocaleTimeString();

        document.getElementById('val-temp').textContent = data.fluidTemp.toFixed(1) + ' °C';
        document.getElementById('val-press').textContent = data.steamPressure.toFixed(1) + ' бар';
        document.getElementById('val-power').textContent = data.power.toFixed(2) + ' МВт';
        document.getElementById('val-flow').textContent = data.flowRate.toFixed(1) + ' кг/с';
        document.getElementById('val-eff').textContent = data.efficiency.toFixed(1) + ' %';

        charts.updateData(timeStr, data);

        const pipe = document.getElementById('steam-pipe');
        if (data.steamPressure > 23) {
            pipe.setAttribute('stroke', '#dc3545'); 
        } else {
            pipe.setAttribute('stroke', '#0d6efd'); 
        }

        dataHistory.unshift({ time: timeStr,...data });
        if (dataHistory.length > 10) dataHistory.pop();

        renderTable();
    };

    const renderTable = () => {
        const tbody = document.getElementById('history-table');
        tbody.innerHTML = dataHistory.map(item => `
            <tr>
                <td>${item.time}</td>
                <td>${item.fluidTemp.toFixed(2)}</td>
                <td>${item.steamPressure.toFixed(2)}</td>
                <td><strong>${item.power.toFixed(2)}</strong></td>
                <td>${item.flowRate.toFixed(2)}</td>
                <td>${item.efficiency.toFixed(2)}</td>
            </tr>
        `).join('');
    };

    const api = new GeothermalAPI('ws://localhost:8080', handleNewData, handleStatusChange);
});
