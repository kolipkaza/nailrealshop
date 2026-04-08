const API_URL = 'http://localhost:3000/api';

async function loadDashboardStats() {
    try {
        const servicesRes = await fetch(`${API_URL}/services`);
        const services = await servicesRes.json();
        document.getElementById('total-services').textContent = services.length;

        const customersRes = await fetch(`${API_URL}/customers`);
        const customers = await customersRes.json();
        document.getElementById('total-customers').textContent = customers.length;

        const appointmentsRes = await fetch(`${API_URL}/appointments?available=true`);
        const appointments = await appointmentsRes.json();
        document.getElementById('today-appointments').textContent = appointments.length;
    } catch (error) {
        console.error('Error:', error);
    }
}

loadDashboardStats();
