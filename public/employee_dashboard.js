// Global State Management
let timerInterval = null;
let currentTimerSeconds = 0;
let isTimerRunning = false;
let previousAppointmentId = null;
let accumulatedSeconds = 0;

// --- API Utility Functions ---

/**
 * เรียก API เพื่อดึงข้อมูลที่จำเป็นทั้งหมด
 */
async function loadInitialData() {
    console.log("Loading initial data for Employee Dashboard...");
    
    // 1. Load Technicians (Techs)
    const techRes = await fetch('/api/technicians');
    const technicians = await techRes.json();
    populateSelect('employee-technician', technicians, 'techId', 'name');

    // 2. Load Services
    const serviceRes = await fetch('/api/services');
    const services = await serviceRes.json();
    populateSelect('employee-service', services, 'id', 'name');

    // 3. Load Available Appointments (exclude in-progress)
    const apptRes = await fetch('/api/appointments?available=true');
    const appointments = await apptRes.json();
    populateSelect('employee-appointment', appointments, 'id', 'customerName');

    // 4. Load Today's Queue (แสดงผลในหน้า - only available)
    displayTodayQueue(appointments);
}

/** Helper function to populate <select> dropdown */
function populateSelect(selectId, data, key, displayKey) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except the placeholder
    select.innerHTML = '<option value="">-- กรุณาเลือก --</option>';
    
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[key]; // ใช้ ID จริงเป็น Value
        option.textContent = item[displayKey] || item[key]; // แสดงชื่อเป็น Text
        select.appendChild(option);
    });
}

/** 
 * 2. Timer Logic
 */
document.getElementById('btn-start-timer').addEventListener('click', async () => {
    if (isTimerRunning) return alert('⚠️ ระบบกำลังจับเวลาอยู่แล้วค่ะ');

    const techId = document.getElementById('employee-technician').value;
    const appId = document.getElementById('employee-appointment').value;
    const serviceId = document.getElementById('employee-service').value;

    if (!techId || !appId || !serviceId) {
        alert('⚠️ กรุณาเลือก ช่าง, คิวลูกค้า, และบริการ ให้ครบถ้วนก่อนเริ่มจับเวลาค่ะ');
        return;
    }

    try {
        // 1. API Call to Start Timer
        const startRes = await fetch('/api/employee/timer/start', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ appointmentId: appId, serviceId: serviceId, technicianId: techId })
        });
        const result = await startRes.json();

        if (startRes.status !== 201) {
             throw new Error(result.error || 'Failed to start timer API.');
        }

        // 2. Start UI Update & Timer Interval
        isTimerRunning = true;
        document.getElementById('btn-start-timer').disabled = true;
        document.getElementById('btn-stop-timer').disabled = false;
        document.getElementById('timer-status').textContent = '🟢 กำลังบันทึกเวลาทำงาน...';

        // Continue from accumulated time if same appointment
        if (previousAppointmentId === appId && accumulatedSeconds > 0) {
            currentTimerSeconds = accumulatedSeconds;
        } else {
            currentTimerSeconds = 0;
            accumulatedSeconds = 0;
            previousAppointmentId = appId;
        }
        updateTimerDisplay();
        timerInterval = setInterval(updateTimerDisplay, 1000);

    } catch (error) {
        console.error("Start Timer Error:", error);
        alert(`⚠️ เกิดข้อผิดพลาดในการเริ่มจับเวลา: ${error.message}`);
    }
});

document.getElementById('btn-stop-timer').addEventListener('click', async () => {
    if (!isTimerRunning) return alert('⚠️ ไม่มี Timer ทำงานอยู่ค่ะ');

    const techId = document.getElementById('employee-technician').value;
    const appId = document.getElementById('employee-appointment').value;
    const serviceId = document.getElementById('employee-service').value;

    try {
        // 1. API Call to Stop Timer
        const stopRes = await fetch('/api/employee/timer/stop', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ appointmentId: appId, serviceId: serviceId, technicianId: techId })
        });
        const result = await stopRes.json();

        if (!stopRes.ok) {
             throw new Error(result.error || 'Failed to stop timer API.');
        }
        
        // 2. Save accumulated time & Reset UI
        accumulatedSeconds = currentTimerSeconds;
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        
        document.getElementById('btn-start-timer').disabled = false;
        document.getElementById('btn-stop-timer').disabled = true;
        document.getElementById('timer-status').textContent = '--- หยุดแล้ว (กดเริ่มใหม่เพื่อนับต่อ) ---';
        // Keep displaying the accumulated time
        // document.getElementById('timer-display').textContent = '00:00:00';

    } catch (error) {
        console.error("Stop Timer Error:", error);
        alert(`⚠️ เกิดข้อผิดพลาดในการหยุดจับเวลา: ${error.message}`);
    }
});

// Close Job - mark appointment as completed and remove from queue
document.getElementById('btn-close-job').addEventListener('click', async () => {
    const appId = document.getElementById('employee-appointment').value;
    if (!appId) {
        alert('⚠️ กรุณาเลือกนัดหมายก่อน');
        return;
    }

    if (!confirm(`ปิดงาน ${appId} และนำออกจากคิว?`)) return;

    try {
        // Stop timer if running
        if (isTimerRunning) {
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
        }

        // Mark appointment as completed
        const res = await fetch(`/api/appointments/${appId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });

        if (!res.ok) throw new Error('Failed to close job');

        // Reset UI
        currentTimerSeconds = 0;
        accumulatedSeconds = 0;
        previousAppointmentId = null;
        document.getElementById('btn-start-timer').disabled = false;
        document.getElementById('btn-stop-timer').disabled = true;
        document.getElementById('timer-status').textContent = '--- ปิดงานแล้ว ---';
        document.getElementById('timer-display').textContent = '00:00:00';

        // Reload dropdowns
        await loadAvailableAppointments();
        await loadTodayQueue();

    } catch (error) {
        console.error('Close Job Error:', error);
        alert(`⚠️ ปิดงานไม่สำเร็จ: ${error.message}`);
    }
});

/** Updates the visible timer display every second */
function updateTimerDisplay() {
    if (!isTimerRunning) return;

    currentTimerSeconds++;
    const hours = Math.floor(currentTimerSeconds / 3600);
    const minutes = Math.floor((currentTimerSeconds % 3600) / 60);
    const seconds = currentTimerSeconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}


/** 
 * 3. Appointment Queue Display
 */
async function displayTodayQueue(appointments) {
    const queueContainer = document.getElementById('appointment-queue-list');
    
    if (!appointments || appointments.length === 0) {
        queueContainer.innerHTML = '<p class="loading-message">วันนี้ยังไม่มีรายการนัดหมายค่ะ</p>';
        return;
    }

    let html = '<div class="grid-container">';
    appointments.forEach(appt => {
        html += `
            <div class="card appointment-card">
                <div class="card-header">
                    <h3>🗓️ ${appt.customerName || 'ลูกค้าผู้ไม่ระบุชื่อ'}</h3>
                </div>
                <p><strong>รหัสคิว:</strong> ${appt.id}</p>
                <p><strong>บริการ:</strong> ${appt.serviceName || 'N/A'}</p>
                <p><strong>เวลา:</strong> ${new Date(appt.appointmentTime).toLocaleString('th-TH')}</p>
                <button class="btn-view-details" data-appt-id="${appt.id}">ดูรายละเอียด</button>
            </div>
        `;
    });
    html += '</div>';
    queueContainer.innerHTML = html;
}

/** Reload just the appointments dropdown */
async function loadAvailableAppointments() {
    const apptRes = await fetch('/api/appointments?available=true');
    const appointments = await apptRes.json();
    populateSelect('employee-appointment', appointments, 'id', 'customerName');
}

/** Reload today's queue display */
async function loadTodayQueue() {
    const apptRes = await fetch('/api/appointments?available=true');
    const appointments = await apptRes.json();
    displayTodayQueue(appointments);
}

// Auto-refresh appointments every 30 seconds
setInterval(() => {
    if (!isTimerRunning) {
        loadAvailableAppointments();
        loadTodayQueue();
    }
}, 30000);

// -----------------------------------------------------------------
// Initialize Application
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
});