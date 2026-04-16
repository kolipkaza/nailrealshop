const API_URL = '/api';

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`sec-${btn.dataset.tab}`).classList.add('active');
    });
});

// Set default dates
document.getElementById('dailyDate').value = new Date().toISOString().split('T')[0];
document.getElementById('monthlyMonth').value = new Date().toISOString().slice(0, 7);

// Daily report
async function loadDaily() {
    const date = document.getElementById('dailyDate').value;
    if (!date) return alert('เลือกวันก่อน');
    try {
        const res = await fetch(`${API_URL}/reports/daily?date=${date}`);
        const data = await res.json();
        const el = document.getElementById('dailyContent');
        const maxSvc = Math.max(...Object.values(data.serviceBreakdown || {}), 1);
        el.innerHTML = `
            <div class="report-card">
                <h3>📅 รายงานวันที่ ${date}</h3>
                <div class="stat-row">
                    <div class="stat-box"><div class="stat-value">${data.appointmentsCount}</div><div class="stat-label">นัดหมาย</div></div>
                    <div class="stat-box"><div class="stat-value">${data.completedCount}</div><div class="stat-label">เสร็จแล้ว</div></div>
                    <div class="stat-box"><div class="stat-value">฿${data.revenue.toLocaleString()}</div><div class="stat-label">รายรับ</div></div>
                    <div class="stat-box"><div class="stat-value">${data.transactionsCount}</div><div class="stat-label">ธุรกรรม</div></div>
                </div>
            </div>
            <div class="report-card">
                <h3>💅 รายได้ตามบริการ</h3>
                <div class="bar-chart">
                    ${Object.entries(data.serviceBreakdown || {}).map(([name, amount]) =>
                        `<div class="bar-row">
                            <div class="bar-label" title="${name}">${name}</div>
                            <div class="bar-track"><div class="bar-fill" style="width:${(amount/maxSvc*100).toFixed(1)}%">฿${amount.toLocaleString()}</div></div>
                        </div>`
                    ).join('') || '<p style="color:#7A7A7A;">ไม่มีข้อมูล</p>'}
                </div>
            </div>`;
    } catch (err) {
        document.getElementById('dailyContent').innerHTML = `<p style="color:red;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</p>`;
    }
}

// Monthly report
async function loadMonthly() {
    const month = document.getElementById('monthlyMonth').value;
    if (!month) return alert('เลือกเดือนก่อน');
    try {
        const res = await fetch(`${API_URL}/reports/monthly?month=${month}`);
        const data = await res.json();
        const el = document.getElementById('monthlyContent');
        const dailyRev = data.dailyRevenue || {};
        const maxDay = Math.max(...Object.values(dailyRev), 1);
        el.innerHTML = `
            <div class="report-card">
                <h3>📆 รายงานเดือน ${month}</h3>
                <div class="stat-row">
                    <div class="stat-box"><div class="stat-value">${data.appointmentsCount}</div><div class="stat-label">นัดหมาย</div></div>
                    <div class="stat-box"><div class="stat-value">${data.completedCount}</div><div class="stat-label">เสร็จแล้ว</div></div>
                    <div class="stat-box"><div class="stat-value">฿${data.revenue.toLocaleString()}</div><div class="stat-label">รายรับ</div></div>
                    <div class="stat-box"><div class="stat-value">${data.transactionsCount}</div><div class="stat-label">ธุรกรรม</div></div>
                </div>
            </div>
            <div class="report-card">
                <h3>📊 รายรับรายวัน</h3>
                <div class="bar-chart">
                    ${Object.entries(dailyRev).sort((a,b) => a[0].localeCompare(b[0])).map(([day, amount]) =>
                        `<div class="bar-row">
                            <div class="bar-label">${day.slice(8)}</div>
                            <div class="bar-track"><div class="bar-fill" style="width:${(amount/maxDay*100).toFixed(1)}%">฿${amount.toLocaleString()}</div></div>
                        </div>`
                    ).join('') || '<p style="color:#7A7A7A;">ไม่มีข้อมูล</p>'}
                </div>
            </div>`;
    } catch (err) {
        document.getElementById('monthlyContent').innerHTML = `<p style="color:red;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</p>`;
    }
}

// Services ranking
async function loadServices() {
    try {
        const res = await fetch(`${API_URL}/reports/services`);
        const data = await res.json();
        const el = document.getElementById('servicesContent');
        const maxCount = Math.max(...data.map(d => d.count), 1);
        el.innerHTML = data.length ? `
            <div class="report-card">
                <h3>💅 อันดับบริการยอดนิยม</h3>
                <div class="bar-chart">
                    ${data.map(d =>
                        `<div class="bar-row">
                            <div class="bar-label" title="${d.name}">${d.name}</div>
                            <div class="bar-track"><div class="bar-fill" style="width:${(d.count/maxCount*100).toFixed(1)}%">${d.count} ครั้ง (฿${d.revenue.toLocaleString()})</div></div>
                        </div>`
                    ).join('')}
                </div>
            </div>` : '<div class="report-card"><p style="color:#7A7A7A;">ไม่มีข้อมูล</p></div>';
    } catch (err) {
        document.getElementById('servicesContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
}

// Customers ranking
async function loadCustomers() {
    try {
        const res = await fetch(`${API_URL}/reports/customers`);
        const data = await res.json();
        const el = document.getElementById('customersContent');
        const maxSpent = Math.max(...data.map(d => d.totalSpent), 1);
        el.innerHTML = data.length ? `
            <div class="report-card">
                <h3>👥 ลูกค้าท็อป (ตามยอดใช้จ่าย)</h3>
                <div class="bar-chart">
                    ${data.map(d =>
                        `<div class="bar-row">
                            <div class="bar-label" title="${d.name}">${d.name}</div>
                            <div class="bar-track"><div class="bar-fill" style="width:${(d.totalSpent/maxSpent*100).toFixed(1)}%">฿${d.totalSpent.toLocaleString()} (${d.visits} ครั้ง)</div></div>
                        </div>`
                    ).join('')}
                </div>
            </div>` : '<div class="report-card"><p style="color:#7A7A7A;">ไม่มีข้อมูล</p></div>';
    } catch (err) {
        document.getElementById('customersContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
}

// Technicians performance
async function loadTechnicians() {
    try {
        const res = await fetch(`${API_URL}/reports/technicians`);
        const data = await res.json();
        const el = document.getElementById('techniciansContent');
        const maxJobs = Math.max(...data.map(d => d.jobsDone), 1);
        el.innerHTML = data.length ? `
            <div class="report-card">
                <h3>🧑‍💼 ประสิทธิภาพช่าง</h3>
                <div class="bar-chart">
                    ${data.map(d => {
                        const mins = Math.round(d.totalSeconds / 60);
                        return `<div class="bar-row">
                            <div class="bar-label" title="${d.name}">${d.name}</div>
                            <div class="bar-track"><div class="bar-fill" style="width:${(d.jobsDone/maxJobs*100).toFixed(1)}%">${d.jobsDone} งาน (${mins} นาที)</div></div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : '<div class="report-card"><p style="color:#7A7A7A;">ไม่มีข้อมูล</p></div>';
    } catch (err) {
        document.getElementById('techniciansContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
}

// Load all reports on init
loadServices();
loadCustomers();
loadTechnicians();
