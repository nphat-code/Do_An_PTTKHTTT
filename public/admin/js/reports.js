// ==================== QUẢN LÝ BÁO CÁO (MODULARIZED) ====================

let financialChartInstance = null;
let qualityChartInstance = null;

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

        // 2. Inventory Advanced (4.2)
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
                renderQualityChart(qualityData.data);
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

function renderQualityChart(data) {
    const canvas = document.getElementById('qualityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (qualityChartInstance) qualityChartInstance.destroy();

    const metrics = data.serviceQualityMetrics || [];

    qualityChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: metrics.map(m => m.name),
            datasets: [{
                label: 'Chỉ số chất lượng (%)',
                data: metrics.map(m => m.value),
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10b981',
                pointBackgroundColor: '#10b981',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${parseFloat(context.raw).toFixed(1)}%`
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20,
                        backdropColor: 'transparent'
                    }
                }
            }
        }
    });
}

function renderSalesStaffReport(data) {
    const tbody = document.getElementById('salesPerformanceTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Không có dữ liệu bán hàng</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(s => `
        <tr>
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có dữ liệu kỹ thuật</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(s => `
        <tr>
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
