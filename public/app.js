// NailReal Shop - Dashboard JavaScript

const API_URL = 'http://localhost:3000/api';

// Fetch and update dashboard stats
async function loadDashboardStats() {
    try {
        // Fetch services
        const servicesRes = await fetch(`${API_URL}/services`);
        const services = await servicesRes.json();
        
        // Fetch customers
        const customersRes = await fetch(`${API_URL}/customers`);
        const customers = await customersRes.json();
        
        // Update stats
        document.getElementById('total-services').textContent = services.length;
        document.getElementById('total-customers').textContent = customers.length;
        
        // Today's appointments (simplified - should filter by date in production)
        const appointmentsRes = await fetch(`${API_URL}/appointments`);
        const appointments = await appointmentsRes.json();
        document.getElementById('today-appointments').textContent = appointments.length;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Initialize
loadDashboardStats();
