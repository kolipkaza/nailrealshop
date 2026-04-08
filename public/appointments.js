const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadAppointments();
});

async function loadAppointments() {
    const container = document.getElementById('appointments-list');
    container.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/appointments?available=true`);
        const appointments = await res.json();

        if (appointments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #636e72;">ไม่มีการนัดหมาย</p>';
            return;
        }

        const validAppointments = appointments.filter(appt => 
            appt.customerName && appt.serviceName && appt.date && appt.time
        );

        if (validAppointments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #636e72;">ไม่มีการนัดหมายที่พร้อมให้บริการ</p>';
            return;
        }

        validAppointments.forEach(appt => {
            const card = document.createElement('a');
            card.href = `appointment_detail.html?id=${appt.id}`;
            card.className = 'appointment-card';
            card.innerHTML = `
                <h3 style="color: #B76E79; margin: 0 0 0.5rem 0;">📅 ${appt.customerName}</h3>
                <p style="margin: 0.25rem 0; color: #636e72;"><strong>บริการ:</strong> ${appt.serviceName}</p>
                <p style="margin: 0.25rem 0; color: #636e72;"><strong>วันที่:</strong> ${appt.date}</p>
                <p style="margin: 0.25rem 0; color: #636e72;"><strong>เวลา:</strong> ${appt.time}</p>
                <p style="margin: 0.5rem 0 0 0; color: #B76E79; font-weight: 600;">ดูรายละเอียด →</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<p class="error-message">โหลดข้อมูลไม่สำเร็จ</p>';
    }
}
