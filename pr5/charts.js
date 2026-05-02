class DashboardCharts {
    constructor() {
        this.powerChart = null;
        this.initPowerChart();
        this.initTSDiagram();
    }

    initPowerChart() {
        const ctx = document.getElementById('powerChart').getContext('2d');
        this.powerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], 
                datasets: [{
                    label: 'Електрична потужність (МВт)',
                    data: [], 
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: false } }
            }
        });
    }

    initTSDiagram() {
        const saturationCurve = {
            x: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
            y: [20, 60, 100, 130, 100, 60, 20],
            mode: 'lines',
            name: 'Купол насичення',
            line: { dash: 'dot', color: '#6c757d', shape: 'spline' }
        };

        const cycleTrace = {
            x: [], 
            y: [], 
            mode: 'lines+markers',
            name: 'Цикл',
            line: { color: '#dc3545', width: 2 }
        };

        const layout = {
            margin: { t: 10, r: 10, b: 40, l: 40 },
            xaxis: { title: 'Ентропія S' },
            yaxis: { title: 'Температура T (°C)' }
        };

        Plotly.newPlot('tsDiagram', [saturationCurve, cycleTrace], layout); 
    }

    updateData(timeLabel, data) {
        this.powerChart.data.labels.push(timeLabel);
        this.powerChart.data.datasets[0].data.push(data.power); 
        
        if (this.powerChart.data.labels.length > 20) {
            this.powerChart.data.labels.shift();
            this.powerChart.data.datasets[0].data.shift(); 
        }
        this.powerChart.update('none');

        if (data.tsPoints && data.tsPoints.s && data.tsPoints.t && data.tsPoints.t.length > 0) {
            Plotly.update('tsDiagram', {
                x: [data.tsPoints.s],
                y: [data.tsPoints.t]
            }, {}, [1]);
        }
    }
}
