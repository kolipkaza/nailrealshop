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

    card.innerHTML = `
        <div class="service-image-container">
            <div class="service-image-placeholder">
                <div class="icon">${icon}</div>
                <div class="slot-id">${service.id}</div>
            </div>
        </div>
        <div class="service-card-content">
            <div class="service-icon">${icon}</div>
            <h3 class="service-name">${service.name}</h3>
            <p class="service-description">${service.description || 'ไม่มีรายละเอียด'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                <span class="service-price">${service.price}฿</span>
                <span class="service-duration">⏱️ ${service.duration} นาที</span>
            </div>
        </div>
    `;

    return card;
}
