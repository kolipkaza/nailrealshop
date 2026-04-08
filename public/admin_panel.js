// --- Technician Management Logic ---

// 1. Load Technicians on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadTechnicians();
    await loadHistoryTechnicianList();
    await loadInitialData();
    await loadRecentLogs(); // Load recent logs automatically
});

async function loadTechnicians() {
    const techListContainer = document.getElementById('tech-list-container');
    try {
        const response = await fetch('/api/technicians');
        const technicians = await response.json();

        techListContainer.innerHTML = '';

        if (technicians.length === 0) {
            techListContainer.innerHTML = '<p class="loading-message">ยังไม่มีข้อมูลช่างในระบบ</p>';
            return;
        }

        technicians.forEach(tech => {
            const techCard = document.createElement('div');
            techCard.className = 'tech-card';
            techCard.id = `tech-card-${tech.techId}`;
            techCard.innerHTML = `
                <div class="tech-avatar" style="background-image: url('${tech.profilePic || 'https://via.placeholder.com/80'}')"></div>
                <div class="tech-info">
                    <h4 class="tech-name">${tech.name}</h4>
                    <p class="tech-role">${tech.role}</p>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="btn-details" onclick="viewTechnicianDetails('${tech.techId}')">ดูข้อมูล</button>
                        <button class="btn-delete" onclick="confirmDeleteTechnician('${tech.techId}', '${tech.name}')">🗑️ ลบ</button>
                    </div>
                </div>
            `;
            techListContainer.appendChild(techCard);
        });

    } catch (error) {
        techListContainer.innerHTML = `<p class="error-message">❌ ไม่สามารถโหลดข้อมูลช่างได้: ${error.message}</p>`;
        console.error('Error loading technicians:', error);
    }
}

// 2. Load history list for all technicians
async function loadHistoryTechnicianList() {
    const historyList = document.getElementById('history-technician-list');
    historyList.innerHTML = ''; // Clear before loading new data
    
    try {
        const response = await fetch('/api/technicians');
        const technicians = await response.json();

        if (technicians.length === 0) {
            historyList.innerHTML = '<p style="color: #636e72;">ยังไม่มีข้อมูลช่าง</p>';
            return;
        }

        technicians.forEach(tech => {
            const techCard = document.createElement('a');
            techCard.href = `technician_history.html?techId=${encodeURIComponent(tech.techId)}`;
            techCard.style.cssText = `
                display: block;
                background: white;
                border-radius: 10px;
                padding: 1rem;
                text-decoration: none;
                color: #2D3436;
                border: 1px solid #F5E6E8;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            `;

            techCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #B76E79 0%, #D4AF37 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${tech.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 700; color: #B76E79;">${tech.name}</div>
                        <div style="font-size: 0.85rem; color: #636e72;">${tech.role}</div>
                    </div>
                </div>
            `;

            historyList.appendChild(techCard);
        });
    } catch (error) {
        console.error('Error loading history list:', error);
    }
}

// 3. Add New Technician
document.getElementById('add-tech-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('tech-name').value.trim();
    const profilePic = document.getElementById('tech-profilepic').value.trim();
    const role = document.getElementById('tech-role').value;

    if (!name || !role) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วนค่ะ');
        return;
    }

    const newTech = {
        techId: `TECH_${Date.now()}`,
        name: name,
        profilePic: profilePic || 'default_tech.jpg',
        role: role
    };

    try {
        const response = await fetch('/api/technicians', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTech)
        });

        if (response.ok) {
            alert('✅ เพิ่มช่างเรียบร้อยแล้ว!');
            document.getElementById('add-tech-form').reset();
            await loadTechnicians(); // Reload list
            await loadHistoryTechnicianList(); // Reload history list
        } else {
            const error = await response.json();
            alert('❌ ไม่สามารถเพิ่มช่างได้: ' + error.error);
        }
    } catch (error) {
        alert('❌ ข้อผิดพลาดในการเชื่อมต่อ: ' + error.message);
        console.error('Error adding technician:', error);
    }
});

// 4. View Technician Details (demo function)
async function viewTechnicianDetails(techId) {
    alert('ดูรายละเอียดช่าง: ' + techId);
}

// 5. Delete Technician with Confirmation
function confirmDeleteTechnician(techId, techName) {
    const card = document.getElementById(`tech-card-${techId}`);

    // Show confirmation buttons
    card.innerHTML = `
        <div class="tech-avatar" style="background-image: url('${card.querySelector('.tech-avatar').style.backgroundImage.slice(5, -2)}')"></div>
        <div class="tech-info">
            <h4 class="tech-name">⚠️ ยืนยันการลบ</h4>
            <p style="color: #d63031; font-weight: bold; margin: 10px 0;">ลบช่าง "${techName}" หรือไม่?</p>
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button class="btn-confirm-delete" onclick="deleteTechnician('${techId}', '${techName}')" style="background: #d63031; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">✅ ยืนยันลบ</button>
                <button class="btn-cancel-delete" onclick="cancelDelete('${techId}')" style="background: #636e72; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">❌ ยกเลิก</button>
            </div>
        </div>
    `;
}

// Cancel delete - restore original card
function cancelDelete(techId) {
    loadTechnicians(); // Reload all technicians
}

// Actually delete the technician
async function deleteTechnician(techId, techName) {
    try {
        const response = await fetch(`/api/technicians/${techId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert(`✅ ลบช่าง "${techName}" เรียบร้อยแล้ว`);
            await loadTechnicians(); // Reload list
            await loadHistoryTechnicianList(); // Reload history list
        } else {
            const error = await response.json();
            alert('❌ ไม่สามารถลบช่างได้: ' + error.error);
        }
    } catch (error) {
        alert('❌ ข้อผิดพลาดในการเชื่อมต่อ: ' + error.message);
        console.error('Error deleting technician:', error);
    }
}

// --- Log Review Logic ---
document.getElementById('btn-load-logs').addEventListener('click', async () => {
    const appId = document.getElementById('log-appointment-id').value.trim();
    const logContainer = document.getElementById('log-results-container');
    const header = document.getElementById('log-results-header');

    if (!appId) {
        alert('กรุณากรอก Appointment ID ก่อนดู Log ค่ะ.');
        return;
    }

    // Clear previous results and show loading
    logContainer.innerHTML = '<p class="loading-message">กำลังดึงประวัติการทำงาน...</p>';
    header.style.display = 'none';

    try {
        // Fetch data from the newly created API endpoint
        const response = await fetch(`/api/logs/appointment/${encodeURIComponent(appId)}`);
        const logs = await response.json();

        if (response.ok && logs.length > 0) {
            header.style.display = 'block';
            logContainer.innerHTML = ''; // เคลียร์ข้อความโหลดดิ้ง

            let htmlContent = '<table style="width:100%; border-collapse: collapse; margin-top: 15px;">';
            htmlContent += '<thead style="background-color: #B76E79; color: white;">';
            htmlContent += '<tr style="text-align: left;">';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Service ID</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">ช่างผู้ทำ</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Start Time</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">End Time</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Duration</th>';
            htmlContent += '</tr></thead><tbody>';

            logs.forEach(log => {
                let statusText = log.isFinished ? '<span style="color: green; font-weight: bold;">✅ เสร็จสิ้น</span>' : '<span style="color: orange; font-weight: bold;">⏳ กำลังดำเนินการ</span>';

                htmlContent += `<tr style="border-bottom: 1px solid #eee;">`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.serviceId}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.technicianId}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${new Date(log.startTime).toLocaleString('th-TH')}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.endTime ? new Date(log.endTime).toLocaleString('th-TH') : '---'}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${log.durationSeconds > 0 ? (log.durationSeconds / 60).toFixed(1) + ' นาที' : 'N/A'}</td>`;
                htmlContent += '</tr>';
            });

            htmlContent += '</tbody></table>';
            logContainer.innerHTML = htmlContent;

        } else {
            logContainer.innerHTML = `<p style="color: #B76E79;">ℹ️ ไม่พบ Log การจับเวลาสำหรับ Appointment ID: ${appId} หรือยังไม่มีการทำรายการค่ะ</p>`;
            header.style.display = 'none';
        }

    } catch (error) {
        logContainer.innerHTML = `<p class="error-message">❌ ข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ${error.message}</p>`;
        console.error("Error loading logs:", error);
    }
});

// --- Recent Logs Auto-Loading ---
async function loadRecentLogs() {
    const recentContainer = document.getElementById('recent-logs-container');

    try {
        const response = await fetch('/api/logs/recent');
        const logs = await response.json();

        if (response.ok && logs.length > 0) {
            let htmlContent = '<table style="width:100%; border-collapse: collapse;">';
            htmlContent += '<thead style="background-color: #B76E79; color: white;">';
            htmlContent += '<tr style="text-align: left;">';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Appointment ID</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">ลูกค้า</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">บริการ</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">ช่างผู้ทำ</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Start Time</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">End Time</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Duration</th>';
            htmlContent += '<th style="padding: 10px; border: 1px solid #ddd;">Status</th>';
            htmlContent += '</tr></thead><tbody>';

            logs.forEach(log => {
                let statusText = log.isFinished ?
                    '<span style="color: green; font-weight: bold;">✅ เสร็จสิ้น</span>' :
                    '<span style="color: orange; font-weight: bold;">⏳ กำลังดำเนินการ</span>';

                htmlContent += `<tr style="border-bottom: 1px solid #eee;">`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${log.appointmentId}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.customerName}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.serviceName}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.technicianName}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${new Date(log.startTime).toLocaleString('th-TH')}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${log.endTime ? new Date(log.endTime).toLocaleString('th-TH') : '---'}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${log.durationSeconds > 0 ? (log.durationSeconds / 60).toFixed(1) + ' นาที' : 'N/A'}</td>`;
                htmlContent += `<td style="padding: 10px; border: 1px solid #ddd;">${statusText}</td>`;
                htmlContent += '</tr>';
            });

            htmlContent += '</tbody></table>';
            recentContainer.innerHTML = htmlContent;
        } else {
            recentContainer.innerHTML = '<p style="color: #B76E79;">ℹ️ ยังไม่มีประวัติการทำงานค่ะ</p>';
        }
    } catch (error) {
        recentContainer.innerHTML = `<p class="error-message">❌ ข้อผิดพลาดในการโหลดประวัติล่าสุด: ${error.message}</p>`;
        console.error("Error loading recent logs:", error);
    }
}

// Refresh button
document.getElementById('btn-refresh-recent').addEventListener('click', async () => {
    await loadRecentLogs();
    alert('✅ รีเฟรชประวัติล่าสุดเรียบร้อยแล้วค่ะ!');
});
