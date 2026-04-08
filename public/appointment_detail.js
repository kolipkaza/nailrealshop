// Appointment Detail Page

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('id');

    if (!appointmentId) {
        document.getElementById('appointment-detail').innerHTML = '<p class="error-message">ไม่พบรหัสนัดหมาย</p>';
        return;
    }

    await loadAppointmentDetail(appointmentId);
});

async function loadAppointmentDetail(appointmentId) {
    const container = document.getElementById('appointment-detail');

    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}`);
        const appointment = await response.json();

        if (!response.ok) {
            throw new Error(appointment.error || 'ไม่พบข้อมูลนัดหมาย');
        }

        container.innerHTML = `
            <div class="detail-card">
                <h1>📅 รายละเอียดนัดหมาย</h1>
                <div class="detail-info">
                    <p><strong>รหัสนัดหมาย:</strong> ${appointment.id}</p>
                    <p><strong>ลูกค้า:</strong> ${appointment.customerName || 'N/A'}</p>
                    <p><strong>บริการ:</strong> ${appointment.serviceName || 'N/A'}</p>
                    <p><strong>วันที่:</strong> ${appointment.date}</p>
                    <p><strong>เวลา:</strong> ${appointment.time}</p>
                    <p><strong>สถานะ:</strong> ${appointment.status || 'scheduled'}</p>
                </div>
                <a href="index.html" class="btn-back">⬅️ กลับหน้าหลัก</a>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p class="error-message">❌ ${error.message}</p>`;
    }
}
