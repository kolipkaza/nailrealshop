// Services Page - Load and Display Services

const API_URL = 'http://localhost:3000/api';

// Load services on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadServices();
});

async function loadServices() {
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const servicesGrid = document.getElementById('services-grid');

    try {
        // Fetch services from API
        const response = await fetch(`${API_URL}/services`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const services = await response.json();

        // Hide loading, show services
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        servicesGrid.style.display = 'grid';
        servicesGrid.innerHTML = ''; // Clear previous content

        // Render each service
        services.forEach(service => {
            const serviceCard = createServiceCard(service);
            servicesGrid.appendChild(serviceCard);
        });

    } catch (error) {
        console.error('Error loading services:', error);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        document.getElementById('error-details').textContent = error.message;
    }
}

function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.onclick = () => window.location.href = `service-detail.html?id=${service.id}`;

    // Get icon based on category
    const icon = service.icon || '💅';
    const imageHtml = service.image
        ? `<img src="${service.image}" alt="${service.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" onerror="this.outerHTML='<div class=\'service-image-placeholder\'><div class=\'icon\'>${icon}</div><div class=\'slot-id\'>${service.id}</div></div>'">`
        : `<div class="service-image-placeholder"><div class="icon">${icon}</div><div class="slot-id">${service.id}</div></div>`;

    card.innerHTML = `
        <div class="service-image-container">
            ${imageHtml}
        </div>
        <div class="service-card-content">
            <div class="service-icon">${icon}</div>
            <h3 class="service-name">${service.name}</h3>
            <p class="service-description">${service.description || 'ไม่มีรายละเอียด'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                <span class="service-price">${service.price}฿</span>
                <span class="service-duration">⏱️ ${service.duration} นาที</span>
            </div>
            <button class="btn-delete-service" data-id="${service.id}" style="margin-top: 1rem; width: 100%; padding: 8px; background: #d63031; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                🗑️ ลบบริการ
            </button>
        </div>
    `;

    // Add delete button event listener
    const deleteBtn = card.querySelector('.btn-delete-service');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click (navigation)
            deleteService(service.id, service.name);
        });
    }

    return card;
}

async function deleteService(id, name) {
    if (!confirm(`ต้องการลบบริการ "${name}" ใช่ไหม?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/services/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete service: ${response.status}`);
        }

        await loadServices();
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('ไม่สามารถลบบริการได้: ' + error.message);
    }
}

// ============================================
// Add Service Modal
// ============================================

function openAddModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'flex';
    // Clear previous inputs
    document.getElementById('add-name').value = '';
    document.getElementById('add-desc').value = '';
    document.getElementById('add-price').value = '';
    document.getElementById('add-duration').value = '';
    document.getElementById('add-category').value = 'basic';
    document.getElementById('add-icon').value = '💅';
    document.getElementById('add-error').style.display = 'none';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.id === 'addModal') closeAddModal();
});

async function submitAddService() {
    const name = document.getElementById('add-name').value.trim();
    const desc = document.getElementById('add-desc').value.trim();
    const price = document.getElementById('add-price').value;
    const duration = document.getElementById('add-duration').value;
    const category = document.getElementById('add-category').value;
    const icon = document.getElementById('add-icon').value.trim() || '💅';
    const errorEl = document.getElementById('add-error');

    // Validation
    if (!name) { errorEl.textContent = 'กรุณาใส่ชื่อบริการ'; errorEl.style.display = 'block'; return; }
    if (!price || price <= 0) { errorEl.textContent = 'กรุณาใส่ราคา'; errorEl.style.display = 'block'; return; }
    if (!duration || duration <= 0) { errorEl.textContent = 'กรุณาใส่ระยะเวลา'; errorEl.style.display = 'block'; return; }

    errorEl.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: desc, price: Number(price), duration: Number(duration), category, icon })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create service');
        }

        closeAddModal();
        await loadServices();
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
    }
}
