const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const form = document.getElementById('accountingForm');
const messageDiv = document.getElementById('message');
const pointsList = document.getElementById('accountingPointsList');
const filterOverdueBtn = document.getElementById('filterOverdueBtn');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');

let allPoints = [];
let currentFilteredPoints = []; 
let showOnlyOverdue = false;
let searchQuery = '';
let statusChartInstance = null;
let controlChartInstance = null;
let currentPage = 1;
const itemsPerPage = 3;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        showApp();
        loadPoints();
    } else {
        showLogin();
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();

        if (result.success) {
            localStorage.setItem('jwt_token', result.token); 
            loginError.style.display = 'none';
            loginForm.reset();
            showApp();
            loadPoints();
        } else {
            loginError.textContent = result.message;
            loginError.style.display = 'block';
        }
    } catch (error) {
        loginError.textContent = "Помилка з'єднання з сервером";
        loginError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwt_token'); 
    showLogin();
});

function showLogin() {
    mainApp.classList.add('hidden');
    loginScreen.classList.remove('hidden');
}

function showApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
    };
}

function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('jwt_token');
        showLogin();
        alert('Сесія закінчилась. Будь ласка, увійдіть знову.');
        throw new Error('Unauthorized');
    }
}

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    currentPage = 1; 
    displayPoints(); 
});

filterOverdueBtn.addEventListener('click', () => {
    showOnlyOverdue = !showOnlyOverdue;
    filterOverdueBtn.classList.toggle('active-filter');
    currentPage = 1; 
    displayPoints(); 
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.underControl = formData.get('underControl') ? true : false;
    
    try {
        const response = await fetch('/api/points', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        handleAuthError(response);
        const result = await response.json();
        
        if (result.success) {
            showMessage('success', result.message);
            form.reset();
            currentPage = 1; 
            loadPoints();
        } else {
            showMessage('error', result.message);
        }
    } catch (error) {
        if(error.message !== 'Unauthorized') showMessage('error', 'Помилка з\'єднання');
    }
});

async function loadPoints() {
    try {
        const response = await fetch('/api/points', { headers: getAuthHeaders() });
        handleAuthError(response);
        allPoints = await response.json();
        
        updateCharts(); 
        displayPoints();
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayPoints() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    currentFilteredPoints = allPoints.filter(point => {
        const isOverdueMatch = showOnlyOverdue ? point.verificationDate < currentDate : true;
        const isSearchMatch = point.pointNumber.toLowerCase().includes(searchQuery);
        return isOverdueMatch && isSearchMatch;
    });

    const totalItems = currentFilteredPoints.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    if (totalItems === 0) {
        pointsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Немає записів для відображення</p>';
        paginationContainer.innerHTML = ''; 
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pointsToDisplay = currentFilteredPoints.slice(startIndex, endIndex);
    
    pointsList.innerHTML = pointsToDisplay.map(point => {
        const isOverdue = point.verificationDate < currentDate;
        const overdueStyle = isOverdue ? 'color: var(--primary); font-weight: 700;' : '';
        return `
            <div class="data-item-card">
                <div class="data-item-header">
                    <span class="data-item-title">Точка №${point.pointNumber}</span>
                    ${point.underControl ? '<span class="badge-control">Особливий контроль</span>' : ''}
                </div>
                <div class="data-item-details">
                    <p><strong>Об'єкт:</strong> ${point.objectName}</p>
                    <p><strong>Лічильник:</strong> ${point.meterDetails}</p>
                    <p><strong>Повірка:</strong> <span style="${overdueStyle}">${new Date(point.verificationDate).toLocaleDateString('uk-UA')}</span></p>
                </div>
                <button class="btn-delete" onclick="deletePoint('${point.id}')">Видалити запис</button>
            </div>
        `;
    }).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    let buttonsHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        buttonsHTML += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }
    paginationContainer.innerHTML = buttonsHTML;
}

window.goToPage = function(pageNumber) {
    currentPage = pageNumber;
    displayPoints();
    document.querySelector('.list-card').scrollIntoView({ behavior: 'smooth' });
};

window.deletePoint = async function(id) {
    if (!confirm('Ви впевнені?')) return;
    try {
        const response = await fetch(`/api/points/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        handleAuthError(response);
        const result = await response.json();
        if (result.success) {
            showMessage('success', result.message);
            loadPoints();
        } else {
            showMessage('error', 'Помилка видалення');
        }
    } catch (error) {
        if(error.message !== 'Unauthorized') showMessage('error', 'Помилка з\'єднання');
    }
}

function showMessage(type, text) {
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    setTimeout(() => { messageDiv.style.display = 'none'; }, 4000);
}

function updateCharts() {
    const currentDate = new Date().toISOString().split('T')[0];
    let overdueCount = 0, validCount = 0, controlCount = 0, normalCount = 0;

    allPoints.forEach(point => {
        if (point.verificationDate < currentDate) overdueCount++; else validCount++;
        if (point.underControl) controlCount++; else normalCount++;
    });

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: { labels: ['Дійсні', 'Прострочені'], datasets: [{ data: [validCount, overdueCount], backgroundColor: ['#F4A460', '#E35336'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Статус повірки', color: '#A0522D', font: { family: 'Inter', size: 14 } }, legend: { position: 'bottom', labels: { font: { family: 'Inter' } } } } }
    });

    const controlCtx = document.getElementById('controlChart').getContext('2d');
    if (controlChartInstance) controlChartInstance.destroy();
    controlChartInstance = new Chart(controlCtx, {
        type: 'pie',
        data: { labels: ['Звичайні', 'На контролі'], datasets: [{ data: [normalCount, controlCount], backgroundColor: ['#E8D8C8', '#A0522D'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Контроль об\'єктів', color: '#A0522D', font: { family: 'Inter', size: 14 } }, legend: { position: 'bottom', labels: { font: { family: 'Inter' } } } } }
    });
}

window.exportCSV = function() {
    if (currentFilteredPoints.length === 0) return alert('Немає даних для експорту');
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Номер точки,Об'єкт,Лічильник,Дата повірки,Особливий контроль\n"; 
    currentFilteredPoints.forEach(p => {
        const control = p.underControl ? 'Так' : 'Ні';
        const row = `${p.pointNumber},"${p.objectName}","${p.meterDetails}",${p.verificationDate},${control}`;
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Звіт_Точки_Обліку.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.exportExcel = function() {
    if (currentFilteredPoints.length === 0) return alert('Немає даних для експорту');
    const dataForExcel = currentFilteredPoints.map(p => ({
        'Номер точки': p.pointNumber,
        'Об\'єкт': p.objectName,
        'Лічильник': p.meterDetails,
        'Дата повірки': p.verificationDate,
        'Особливий контроль': p.underControl ? 'Так' : 'Ні'
    }));
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Звіт");
    XLSX.writeFile(wb, "Звіт_Точки_Обліку.xlsx");
};

window.exportPDF = function() {
    if (currentFilteredPoints.length === 0) return alert('Немає даних для експорту');
    
    const htmlContent = `
        <div style="padding: 20px; font-family: sans-serif; background: #fff;">
            <h2 style="text-align: center; color: #A0522D; margin-bottom: 20px;">Звіт: Комерційний облік електроенергії</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Номер</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Об'єкт</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Лічильник</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Повірка</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Контроль</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentFilteredPoints.map(p => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">${p.pointNumber}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${p.objectName}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${p.meterDetails}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${new Date(p.verificationDate).toLocaleDateString('uk-UA')}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${p.underControl ? 'Так' : 'Ні'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    const opt = {
        margin:       10,
        filename:     'Звіт_Точки_Обліку.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(htmlContent).save();
};
