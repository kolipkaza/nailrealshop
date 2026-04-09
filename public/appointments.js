// appointments.js - NailReal Shop

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadServices();
    await loadAppointments();
    setupForm();
    setupFilters();
    setDefaultDate();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appt-date').value = today;
    document.getElementById('appt-date').min = today;
}

// Load services for dropdown
async function loadServices() {
    try {
        const res = await fetch(`${API_URL}/services`);
        const services = await res.json();
        const select = document.getElementById('service-select');
        services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} - ฿${Number(s.price || 0).toLocaleString()} (${s.duration || 0} นาที)`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Error loading services:', err);
    }
}

// Load appointments
let allAppointments = [];

async function loadAppointments() {
    try {
        const res = await fetch(`${API_URL}/appointments`);
        allAppointments = await res.json();
        renderAppointments(allAppointments);
    } catch (err) {
        console.error('Error loading appointments:', err);
        document.getElementById('appointments-list').innerHTML = '<p style="color:#d63031;">❌ โหลดข้อมูลไม่สำเร็จ</p>';
    }
}

// Render appointments
function renderAppointments(appointments) {
    const container = document.getElementById('appointments-list');
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p style="color: #7A7A7A; text-align: center; padding: 2rem;">ไม่มีนัดหมาย</p>';
        return;
    }

    // Sort by date desc
    appointments.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    container.innerHTML = appointments.map(appt => `
        <div class="appointment-card" data-id="${appt.id}" onclick="viewDetail('${appt.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <h3 style="font-size:1.1rem; font-weight:600; color:#3D3D3D;">${appt.serviceName || 'ไม่ระบุบริการ'}</h3>
                <span class="status-badge status-${appt.status || 'pending'}">${getStatusLabel(appt.status)}</span>
            </div>
            <p style="color:#5A5A5A; font-size:0.9rem; margin-bottom:0.4rem;">👤 ${appt.customerName || 'ไม่ระบุชื่อ'}</p>
            <p style="color:#7A7A7A; font-size:0.85rem; margin-bottom:0.4rem;">📅 ${formatDate(appt.date)} ${appt.time ? '⏰ ' + appt.time : ''}</p>
            ${appt.notes ? `<p style="color:#999; font-size:0.8rem;">📝 ${appt.notes}</p>` : ''}
            <div style="margin-top:0.75rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
                ${getStatusButtons(appt)}
            </div>
        </div>
    `).join('');
}

// Status buttons based on current status
function getStatusButtons(appt) {
    const id = appt.id;
    const status = appt.status;
    let buttons = '';

    if (status === 'pending') {
        buttons += `<button class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="event.stopPropagation(); changeStatus('${id}','confirmed')">✅ ยืนยัน</button>`;
        buttons += `<button class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="event.stopPropagation(); changeStatus('${id}','cancelled')">❌ ยกเลิก</button>`;
    } else if (status === 'confirmed') {
        buttons += `<button class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="event.stopPropagation(); changeStatus('${id}','in-progress')">🔄 เริ่มทำ</button>`;
        buttons += `<button class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="event.stopPropagation(); changeStatus('${id}','cancelled')">❌ ยกเลิก</button>`;
    } else if (status === 'in-progress') {
        buttons += `<button class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="event.stopPropagation(); changeStatus('${id}','completed')">💯 เสร็จ</button>`;
    }

    return buttons;
}

// Change appointment status
async function changeStatus(id, newStatus) {
    try {
        const res = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!res.ok) throw new Error('Failed');
        
        await loadAppointments();
        // Re-apply current filter
        const activeBtn = document.querySelector('.filter-btn.active');
        if (activeBtn) applyFilter(activeBtn.dataset.filter);
    } catch (err) {
        console.error('Error changing status:', err);
        alert('❌ เปลี่ยนสถานะไม่สำเร็จ');
    }
}

// View appointment detail
function viewDetail(id) {
    window.location.href = `appointment_detail.html?id=${id}`;
}

// Setup form submission
function setupForm() {
    document.getElementById('new-appointment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            customerName: document.getElementById('cust-name').value.trim(),
            customerPhone: document.getElementById('cust-phone').value.trim(),
            serviceId: document.getElementById('service-select').value,
            date: document.getElementById('appt-date').value,
            time: document.getElementById('appt-time').value,
            notes: document.getElementById('appt-notes').value.trim()
        };

        try {
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed');
            }

            alert('✅ จองคิวสำเร็จ!');
            e.target.reset();
            setDefaultDate();
            await loadAppointments();
        } catch (err) {
            console.error('Error booking:', err);
            alert('❌ จองคิวไม่สำเร็จ: ' + err.message);
        }
    });
}

// Setup filter buttons
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.dataset.filter);
        });
    });
}

function applyFilter(filter) {
    if (filter === 'all') {
        renderAppointments(allAppointments);
    } else {
        const filtered = allAppointments.filter(a => a.status === filter);
        renderAppointments(filtered);
    }
}

// Helpers
function getStatusLabel(status) {
    const labels = {
        'pending': '⏳ รอยืนยัน',
        'confirmed': '✅ ยืนยันแล้ว',
        'in-progress': '🔄 กำลังทำ',
        'completed': '💯 เสร็จแล้ว',
        'cancelled': '❌ ยกเลิก'
    };
    return labels[status] || status || '⏳ รอยืนยัน';
}

function formatDate(dateStr) {
    if (!dateStr) return 'ไม่ระบุวัน';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}
