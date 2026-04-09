// service-detail.js - Load and display service details

const API_BASE = '/api';

// Get service ID from URL params
function getServiceId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// DOM Elements
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');
const serviceDetailCard = document.getElementById('service-detail-card');
const serviceImage = document.getElementById('service-image');
const serviceTitle = document.getElementById('service-title');
const serviceCategoryBadge = document.getElementById('service-category-badge');
const serviceDescriptionContent = document.getElementById('service-description-content');
const servicePriceContent = document.getElementById('service-price-content');
const serviceDurationContent = document.getElementById('service-duration-content');

// Edit mode elements
const btnEdit = document.getElementById('btn-edit');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');

// Load service data
async function loadService() {
    const serviceId = getServiceId();
    
    if (!serviceId) {
        showError();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/services/${serviceId}`);
        
        if (!response.ok) {
            showError();
            return;
        }
        
        const service = await response.json();
        displayService(service);
    } catch (err) {
        console.error('Error loading service:', err);
        showError();
    }
}

// Display service data
function displayService(service) {
    // Hide loading, show card
    loadingMessage.style.display = 'none';
    serviceDetailCard.style.display = 'block';
    
    // Populate data
    serviceTitle.textContent = service.name || 'ไม่ระบุชื่อบริการ';
    serviceCategoryBadge.textContent = service.category || 'ทั่วไป';
    serviceDescriptionContent.textContent = service.description || 'ไม่มีรายละเอียด';
    servicePriceContent.textContent = `฿${Number(service.price || 0).toLocaleString()}`;
    serviceDurationContent.textContent = `${service.duration || 0} นาที`;
    
    // Image
    if (service.image) {
        serviceImage.src = service.image;
    } else {
        serviceImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect fill="%23F5EFE6" width="150" height="150"/><text x="75" y="75" text-anchor="middle" dy=".3em" font-size="48" fill="%238B7355">💅</text></svg>';
    }
    
    // Store service data for editing
    window.currentService = service;
}

// Show error state
function showError() {
    loadingMessage.style.display = 'none';
    errorMessage.style.display = 'block';
}

// Edit mode
btnEdit.addEventListener('click', () => {
    const service = window.currentService;
    if (!service) return;
    
    // Show inputs, hide content
    serviceTitle.style.display = 'none';
    document.getElementById('service-title-input').value = service.name || '';
    document.getElementById('service-title-input').style.display = 'block';
    
    serviceDescriptionContent.style.display = 'none';
    document.getElementById('service-description-input').value = service.description || '';
    document.getElementById('service-description-input').style.display = 'block';
    
    servicePriceContent.style.display = 'none';
    document.getElementById('service-price-input').value = service.price || 0;
    document.getElementById('service-price-input').style.display = 'block';
    
    serviceDurationContent.style.display = 'none';
    document.getElementById('service-duration-input').value = service.duration || 0;
    document.getElementById('service-duration-input').style.display = 'block';
    
    // Show upload section
    document.getElementById('upload-section').classList.add('visible');
    
    // Toggle buttons
    btnEdit.style.display = 'none';
    btnSave.style.display = 'inline-flex';
    btnCancel.style.display = 'inline-flex';
});

// Cancel edit
btnCancel.addEventListener('click', () => {
    cancelEdit();
});

function cancelEdit() {
    // Hide inputs, show content
    serviceTitle.style.display = 'block';
    document.getElementById('service-title-input').style.display = 'none';
    
    serviceDescriptionContent.style.display = 'block';
    document.getElementById('service-description-input').style.display = 'none';
    
    servicePriceContent.style.display = 'block';
    document.getElementById('service-price-input').style.display = 'none';
    
    serviceDurationContent.style.display = 'block';
    document.getElementById('service-duration-input').style.display = 'none';
    
    // Hide upload section
    document.getElementById('upload-section').classList.remove('visible');
    
    // Toggle buttons
    btnEdit.style.display = 'inline-flex';
    btnSave.style.display = 'none';
    btnCancel.style.display = 'none';
}

// Save changes
btnSave.addEventListener('click', async () => {
    const serviceId = getServiceId();
    if (!serviceId) return;
    
    const updatedData = {
        name: document.getElementById('service-title-input').value,
        description: document.getElementById('service-description-input').value,
        price: parseFloat(document.getElementById('service-price-input').value) || 0,
        duration: parseInt(document.getElementById('service-duration-input').value) || 0,
        category: window.currentService?.category || 'ทั่วไป'
    };
    
    try {
        btnSave.textContent = '⏳ กำลังบันทึก...';
        btnSave.disabled = true;
        
        const response = await fetch(`${API_BASE}/services/${serviceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save');
        }
        
        const updatedService = await response.json();
        
        // Update display
        window.currentService = updatedService;
        displayService(updatedService);
        cancelEdit();
        
        alert('✅ บันทึกสำเร็จ');
    } catch (err) {
        console.error('Error saving:', err);
        alert('❌ บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
        btnSave.textContent = '💾 บันทึก';
        btnSave.disabled = false;
    }
});

// Image upload
document.getElementById('image-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const serviceId = getServiceId();
    if (!serviceId) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        document.getElementById('upload-preview').textContent = '⏳ กำลังอัปโหลด...';
        
        const response = await fetch(`${API_BASE}/services/${serviceId}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const result = await response.json();
        
        // Update image preview
        serviceImage.src = result.image + '?t=' + Date.now();
        document.getElementById('upload-preview').textContent = '✅ อัปโหลดสำเร็จ';
        
        setTimeout(() => {
            document.getElementById('upload-preview').textContent = '';
        }, 2000);
    } catch (err) {
        console.error('Error uploading:', err);
        document.getElementById('upload-preview').textContent = '❌ อัปโหลดไม่สำเร็จ';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadService);
