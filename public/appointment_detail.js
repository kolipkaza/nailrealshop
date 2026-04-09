// appointment_detail.js - NailReal Shop

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        showError();
        return;
    }
    
    await loadAppointment(id);
});

async function loadAppointment(id) {
    try {
        const res = await fetch(`${API_URL}/appointments/${id}`);
        if (!res.ok) throw new Error('Not found');
        
        const appt = await res.json();
        displayAppointment(appt);
    } catch (err) {
        console.error('Error:', err);
        showError();
    }
}

async function displayAppointment(appt) {
    // Hide loading, show card
    document.getElementById('loading').style.display = 'none';
    document.getElementById('detail-card').style.display = 'block';
    
    // Basic info
    document.getElementById('service-name').textContent = appt.serviceName || 'ไม่ระบุบริการ';
    document.getElementById('appt-id').textContent = appt.id;
    document.getElementById('customer-name').textContent = appt.customerName || '-';
    document.getElementById('customer-phone').textContent = appt.customerPhone || '-';
    document.getElementById('appt-date').textContent = formatDate(appt.date);
    document.getElementById('appt-time').textContent = appt.time || '-';
    
    // Status badge
    const badge = document.getElementById('status-badge');
    badge.className = `status-badge status-${appt.status || 'pending'}`;
    badge.textContent = getStatusLabel(appt.status);
    
    // Try to get service details for price
    try {
        if (appt.serviceId) {
            const svcRes = await fetch(`${API_URL}/services/${appt.serviceId}`);
            if (svcRes.ok) {
                const svc = await svcRes.json();
                document.getElementById('service-detail').textContent = svc.name || '-';
                document.getElementById('service-price').textContent = `฿${Number(svc.price || 0).toLocaleString()}`;
            }
        }
    } catch {}
    
    // Notes
    if (appt.notes) {
        document.getElementById('notes-section').style.display = 'block';
        document.getElementById('appt-notes').textContent = appt.notes;
    }
    
    // Status action buttons
    renderStatusActions(appt);
}

function renderStatusActions(appt) {
    const container = document.getElementById('status-actions');
    const status = appt.status;
    let html = '';
    
    if (status === 'pending') {
        html += `<button class="btn btn-primary" onclick="changeStatus('${appt.id}','confirmed')">✅ ยืนยันนัดหมาย</button>`;
        html += `<button class="btn btn-secondary" onclick="changeStatus('${appt.id}','cancelled')">❌ ยกเลิก</button>`;
    } else if (status === 'confirmed') {
        html += `<button class="btn btn-primary" onclick="changeStatus('${appt.id}','in-progress')">🔄 เริ่มทำบริการ</button>`;
        html += `<button class="btn btn-secondary" onclick="changeStatus('${appt.id}','cancelled')">❌ ยกเลิก</button>`;
    } else if (status === 'in-progress') {
        html += `<button class="btn btn-primary" onclick="changeStatus('${appt.id}','completed')">💯 เสร็จสิ้น</button>`;
    }
    
    if (status === 'completed' || status === 'cancelled') {
        html += `<button class="btn btn-secondary" onclick="changeStatus('${appt.id}','pending')">🔄 รีเซ็ตเป็นรอยืนยัน</button>`;
    }
    
    container.innerHTML = html;
}

async function changeStatus(id, newStatus) {
    try {
        const res = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!res.ok) throw new Error('Failed');
        
        const updated = await res.json();
        displayAppointment(updated);
    } catch (err) {
        console.error('Error:', err);
        alert('❌ เปลี่ยนสถานะไม่สำเร็จ');
    }
}

function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
}

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
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return dateStr;
    }
}
