// ==================== QUẢN LÝ BÁO CÁO (MODULARIZED) ====================

let financialChartInstance = null;
let qualityChartInstance = null;
let customerGrowthChartInstance = null;

async function loadReports() {
    const start = document.getElementById('reportStartDate')?.value;
    const end = document.getElementById('reportEndDate')?.value;

    let dateQuery = '';
    if (start && end) {
        dateQuery = `?startDate=${start}&endDate=${end}`;
    }

    try {
        const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

        // 1. Financial Analytics (4.1)
        try {
            const finRes = await fetch(`/api/reports/financial${dateQuery}`, { headers });
            const finData = await finRes.json();
            if (finData.success) {
                renderFinancialSummary(finData.data);
                renderFinancialChart(finData.data);
            }
        } catch (e) { console.error("Lỗi Tài chính:", e); }

        // 2. Customer Growth (New)
        try {
            const growthRes = await fetch(`/api/reports/customer-growth${dateQuery}`, { headers });
            const growthData = await growthRes.json();
            if (growthData.success) {
                renderCustomerGrowthChart(growthData.data);
            }
        } catch (e) { console.error("Lỗi Tăng trưởng khách hàng:", e); }

        // 3. Inventory Advanced (4.2)
        try {
            const invAdvRes = await fetch('/api/reports/inventory-advanced', { headers });
            const invAdvData = await invAdvRes.json();
            // agedStockCount logic removed
        } catch (e) { console.error("Lỗi Kho nâng cao:", e); }

        // 3. Warranty & Quality (4.3)
        try {
            const qualityRes = await fetch('/api/reports/warranty-quality', { headers });
            const qualityData = await qualityRes.json();
            if (qualityData.success) {
                renderQualityMetrics(qualityData.data);
                renderFailingPartsTable(qualityData.data.topFailingParts);
            }
        } catch (e) { console.error("Lỗi Chất lượng:", e); }

        // 4. Staff Performance (Logic 4.4)
        try {
            const staffRes = await fetch(`/api/reports/performance${dateQuery}`, { headers });
            const staffData = await staffRes.json();
            if (staffData.success) {
                renderSalesStaffReport(staffData.data.salesStats || []);
                renderStaffReport(staffData.data.techStats || []);
            }
        } catch (e) { console.error("Lỗi Hiệu suất:", e); }

        // Legacy total orders
        try {
            const salesRes = await fetch(`/api/reports/sales${dateQuery}`, { headers });
            const salesData = await salesRes.json();
            if (salesData.success) {
                const orderVal = document.getElementById('reportTotalOrders');
                if (orderVal) orderVal.innerText = salesData.data.summary.totalOrders || 0;
            }
        } catch (e) { console.error("Lỗi Doanh số:", e); }

    } catch (err) {
        console.error("Lỗi tổng quát:", err);
    }
}

function renderFinancialSummary(data) {
    const revEl = document.getElementById('reportTotalRevenue');
    const proEl = document.getElementById('reportTotalProfit');
    if (revEl) revEl.innerText = Number(data.revenue || 0).toLocaleString() + 'đ';
    if (proEl) proEl.innerText = Number(data.profit || 0).toLocaleString() + 'đ';
}

function renderFinancialChart(data) {
    const canvas = document.getElementById('financialChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (financialChartInstance) financialChartInstance.destroy();

    financialChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Doanh thu', 'Giá vốn (COGS)', 'Chi phí BH', 'Lợi nhuận'],
            datasets: [{
                label: 'Giá trị (VNĐ)',
                data: [data.revenue, data.cogs, data.warrantyCosts, data.profit],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        }
    });
}

function renderCustomerGrowthChart(data) {
    const canvas = document.getElementById('customerGrowthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (customerGrowthChartInstance) customerGrowthChartInstance.destroy();

    const labels = data.map(item => {
        const d = new Date(item.month);
        return `${d.getMonth() + 1}/${d.getFullYear()}`;
    });
    const counts = data.map(item => parseInt(item.count));

    customerGrowthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Khách hàng mới',
                data: counts,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 }
                    },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    ticks: { font: { size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderQualityMetrics(data) {
    const container = document.getElementById('qualityMetricsList');
    if (!container) return;

    const rates = data.failureRates || [];
    if (rates.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">Không có dữ liệu bảo hành model</div>';
        return;
    }

    container.innerHTML = rates.map(m => {
        const val = parseFloat(m.rate || 0).toFixed(1);
        let color = '#10b981'; // Green (Low failure)
        let icon = 'fa-check-circle';
        
        if (val > 5) {
            color = '#f59e0b'; // Orange (Medium failure)
            icon = 'fa-exclamation-triangle';
        }
        if (val > 10) {
            color = '#ef4444'; // Red (High failure)
            icon = 'fa-radiation';
        }

        return `
            <div class="metric-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; background: ${color}15; color: ${color}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${icon}" style="font-size: 0.9rem;"></i>
                        </div>
                        <span style="font-weight: 600; font-size: 0.9rem; color: #475569;">${m.name}</span>
                    </div>
                    <span style="font-weight: 700; font-size: 0.95rem; color: ${color}">${val}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${val}%; height: 100%; background: ${color}; border-radius: 4px; transition: width 0.5s ease-out;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSalesStaffReport(data) {
    const tbody = document.getElementById('salesPerformanceTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có dữ liệu bán hàng</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((s, index) => `
        <tr>
            <td style="text-align: center; vertical-align: middle;">${getRankBadge(index)}</td>
            <td><strong>${s.name}</strong></td>
            <td><span class="badge" style="background:rgba(99,102,241,0.1); color:#6366f1;">${s.orderCount}</span></td>
            <td style="font-weight:600; color:#10b981;">${new Intl.NumberFormat('vi-VN').format(s.totalRevenue)}₫</td>
            <td style="color:#64748b;">${new Intl.NumberFormat('vi-VN').format(s.avgOrderValue)}₫</td>
        </tr>
    `).join('');
}

function renderStaffReport(data) {
    const tbody = document.getElementById('staffPerformanceTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu kỹ thuật</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((s, index) => `
        <tr>
            <td style="text-align: center; vertical-align: middle;">${getRankBadge(index)}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.total}</td>
            <td><span class="badge" style="background:rgba(16,185,129,0.1); color:#10b981;">${s.done}</span></td>
            <td><span class="badge" style="background:rgba(239,68,68,0.1); color:#ef4444;">${s.reworkCount}</span></td>
            <td style="font-weight: 700; color: ${parseFloat(s.qualityRate) > 90 ? '#10b981' : '#f59e0b'};">
                ${s.qualityRate}%
            </td>
        </tr>
    `).join('');
}

function renderFailingPartsTable(data) {
    const tbody = document.getElementById('topFailingPartsTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu thay thế</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr>
            <td><code>${p.maLk}</code></td>
            <td>${p['LinhKien.tenLk'] || 'N/A'}</td>
            <td><strong style="color: #ef4444;">${p.frequency}</strong> lần</td>
        </tr>
    `).join('');
}

function getRankBadge(index) {
    if (index === 0) return '<i class="fas fa-medal" style="color: #ffd700; font-size: 1.2rem;" title="Hạng 1 - Vàng"></i>';
    if (index === 1) return '<i class="fas fa-medal" style="color: #c0c0c0; font-size: 1.1rem;" title="Hạng 2 - Bạc"></i>';
    if (index === 2) return '<i class="fas fa-medal" style="color: #cd7f32; font-size: 1rem;" title="Hạng 3 - Đồng"></i>';
    return `<span style="color: #94a3b8; font-weight: 600;">${index + 1}</span>`;
}
