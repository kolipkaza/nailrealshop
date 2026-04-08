// Technician History Page

const API_URL = 'http://localhost:3000/api';

// Load page with technician ID from URL parameter
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const technicianId = urlParams.get('techId');

    if (!technicianId) {
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('no-technician').style.display = 'block';
        return;
    }

    await loadTechnicianHistory(technicianId);
});

async function loadTechnicianHistory(technicianId) {
    const loadingMessage = document.getElementById('loading-message');
    const noTechnician = document.getElementById('no-technician');
    const technicianStats = document.getElementById('technician-stats');
    const historyContainer = document.getElementById('history-container');

    // Clear all containers first before loading new data
    loadingMessage.style.display = 'block';
    noTechnician.style.display = 'none';
    technicianStats.style.display = 'none';
    historyContainer.style.display = 'none';
    historyContainer.innerHTML = '';

    try {
        // 1. Fetch technician details
        const techRes = await fetch('/api/technicians');
        const technicians = await techRes.json();
        const technician = technicians.find(t => t.techId === technicianId);

        if (!technician) {
            loadingMessage.style.display = 'none';
            noTechnician.style.display = 'block';
            document.getElementById('no-technician').querySelector('h2').textContent = 'ไม่พบข้อมูลช่างนี้';
            return;
        }

        // 2. Load technician stats and history
        const logsRes = await fetch(`/api/logs/technician/${encodeURIComponent(technicianId)}`);
        const logs = await logsRes.json();

        // 3. Display technician info
        document.getElementById('technician-name').textContent = `${technician.name} - ${technician.role}`;

        // 4. Calculate stats
        const totalCount = logs.length;
        const completedCount = logs.filter(log => log.isFinished).length;
        const activeCount = logs.filter(log => !log.isFinished).length;
        const totalDuration = logs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);

        document.getElementById('total-count').textContent = totalCount;
        document.getElementById('completed-count').textContent = completedCount;
        document.getElementById('active-count').textContent = activeCount;

        // Format duration
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        if (hours > 0) {
            document.getElementById('total-duration').textContent = `${hours}h ${minutes}m`;
        } else {
            document.getElementById('total-duration').textContent = `${minutes}m`;
        }

        // 5. Display history
        loadingMessage.style.display = 'none';
        technicianStats.style.display = 'block';

        if (logs.length === 0) {
            historyContainer.style.display = 'none';
            alert(`ไม่พบประวัติการทำงานของช่าง ${technician.name}`);
            return;
        }

        historyContainer.style.display = 'block';
        historyContainer.innerHTML = '';

        logs.forEach(log => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const statusClass = log.isFinished ? 'status-completed' : 'status-active';
            const statusText = log.isFinished ? '✅ เสร็จสิ้น' : '⏳ กำลังดำเนินการ';

            historyItem.innerHTML = `
                <div class="history-header">
                    <div>
                        <div class="history-service">${log.serviceName || log.serviceId}</div>
                        <div class="history-appointment">Appointment: ${log.appointmentId}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="history-details">
                    <div class="detail-item">
                        <span class="detail-label">⏰ เริ่ม:</span>
                        <span class="detail-value">${new Date(log.startTime).toLocaleString('th-TH')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">⏱️ จบ:</span>
                        <span class="detail-value">${log.endTime ? new Date(log.endTime).toLocaleString('th-TH') : '---'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📊 เวลาทำ:</span>
                        <span class="detail-value">${log.durationSeconds ? (log.durationSeconds / 60).toFixed(1) + ' นาที' : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">👤 ลูกค้า:</span>
                        <span class="detail-value">${log.customerName || 'N/A'}</span>
                    </div>
                </div>
            `;

            historyContainer.appendChild(historyItem);
        });

    } catch (error) {
        console.error('Error loading technician history:', error);
        loadingMessage.style.display = 'none';
        noTechnician.style.display = 'block';
        document.getElementById('no-technician').querySelector('h2').textContent = `เกิดข้อผิดพลาด: ${error.message}`;
    }
}
