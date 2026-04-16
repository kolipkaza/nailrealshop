const API_URL = '/api';

// Thai date/time helper
class THAINow {
    constructor() { this.date = new Date(); }
    get dateString() {
        const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
        const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                        'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
        const d = this.date;
        return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
    }
    get timeString() {
        return this.date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// Clock
function updateClock() {
    const now = new THAINow();
    const dateEl = document.getElementById('topbarDate');
    const timeEl = document.getElementById('topbarTime');
    if (dateEl) dateEl.textContent = now.dateString;
    if (timeEl) timeEl.textContent = now.timeString;
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
});

// ============================================
// Dashboard Stats
// ============================================
async function loadDashboardStats() {
    try {
        const [servicesRes, customersRes, appointmentsRes, techsRes, logsRes, txnSummaryRes] = await Promise.all([
            fetch(`${API_URL}/services`).catch(() => ({ json: () => [] })),
            fetch(`${API_URL}/customers`).catch(() => ({ json: () => [] })),
            fetch(`${API_URL}/appointments`).catch(() => ({ json: () => [] })),
            fetch(`${API_URL}/technicians`).catch(() => ({ json: () => [] })),
            fetch(`${API_URL}/logs/recent`).catch(() => ({ json: () => [] })),
            fetch(`${API_URL}/transactions/summary`).catch(() => ({ json: () => ({}) })),
        ]);

        const services = await servicesRes.json();
        const customers = await customersRes.json();
        const appointments = await appointmentsRes.json();
        const technicians = await techsRes.json();
        const logs = await logsRes.json();
        const txnSummary = await txnSummaryRes.json();

        // Stat numbers
        setText('total-services', services.length);
        setText('total-customers', customers.length);
        setText('total-technicians', Array.isArray(technicians) ? technicians.length : 0);

        // Today's revenue
        const today = new Date().toISOString().split('T')[0];
        const todayRevenue = (txnSummary.byDate && txnSummary.byDate[today]) || 0;
        setText('today-revenue', `฿${todayRevenue.toLocaleString()}`);

        // Today's appointments
        const todayAppts = Array.isArray(appointments)
            ? appointments.filter(a => a.date === today || a.date === 'today')
            : [];
        setText('today-appointments', todayAppts.length);

        // In progress
        const inProgress = Array.isArray(appointments)
            ? appointments.filter(a => a.status === 'in-progress')
            : [];
        setText('in-progress', inProgress.length);

        // Recent appointments list
        renderRecentAppointments(todayAppts);

        // Recent logs
        renderRecentLogs(Array.isArray(logs) ? logs.slice(0, 8) : []);

    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderRecentAppointments(appts) {
    const container = document.getElementById('recent-appointments');
    if (!container) return;

    if (!appts.length) {
        container.innerHTML = '<p class="empty-msg">ไม่มีนัดหมายวันนี้</p>';
        return;
    }

    container.innerHTML = appts.slice(0, 8).map(a => {
        const statusClass = a.status === 'completed' ? 'status-completed'
            : a.status === 'in-progress' ? 'status-booked'
            : 'status-available';
        const statusText = a.status === 'completed' ? 'เสร็จแล้ว'
            : a.status === 'in-progress' ? 'กำลังทำ'
            : 'รอบริการ';

        return `<div class="mini-item">
            <div>
                <div class="mini-item-name">${a.customer_name || a.customerId || '-'}</div>
                <div class="mini-item-detail">${a.service_name || a.service || '-'} · ${a.time || ''}</div>
            </div>
            <span class="mini-item-status ${statusClass}">${statusText}</span>
        </div>`;
    }).join('');
}

function renderRecentLogs(logs) {
    const container = document.getElementById('recent-logs');
    if (!container) return;

    if (!logs.length) {
        container.innerHTML = '<p class="empty-msg">ยังไม่มีข้อมูล</p>';
        return;
    }

    container.innerHTML = logs.map(l => {
        return `<div class="mini-item">
            <div>
                <div class="mini-item-name">${l.technician_name || l.techId || '-'}</div>
                <div class="mini-item-detail">${l.service || l.appointmentId || '-'} · ${l.duration || '-'}</div>
            </div>
            <span class="mini-item-detail">${l.date || ''}</span>
        </div>`;
    }).join('');
}

// Init
loadDashboardStats();
