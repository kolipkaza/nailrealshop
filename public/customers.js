// Customers Page - CRUD Operations
const API_URL = 'http://localhost:3000/api';

let allCustomers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
});

async function loadCustomers() {
    try {
        const res = await fetch(`${API_URL}/customers`);
        if (!res.ok) throw new Error('Failed to load');
        allCustomers = await res.json();
        renderCustomers(allCustomers);
    } catch (err) {
        document.getElementById('customer-list').innerHTML =
            `<tr><td colspan="5" class="empty-state">❌ โหลดข้อมูลไม่ได้: ${err.message}</td></tr>`;
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customer-list');

    if (!customers.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">ยังไม่มีข้อมูลลูกค้า</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td style="font-family:monospace; font-size:0.82rem; color:#7A7A7A;">${c.id}</td>
            <td class="customer-name">${c.name}</td>
            <td class="customer-phone">${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-sm btn-edit" onclick="openEditModal('${c.id}', '${esc(c.name)}', '${esc(c.phone || '')}', '${esc(c.email || '')}')">✏️ แก้</button>
                    <button class="btn-sm btn-del" onclick="deleteCustomer('${c.id}', '${esc(c.name)}')">🗑️ ลบ</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Escape single quotes for inline onclick
function esc(str) {
    return str.replace(/'/g, "\\'");
}

// Search/filter
function filterCustomers() {
    const q = document.getElementById('searchBox').value.toLowerCase().trim();
    if (!q) { renderCustomers(allCustomers); return; }
    const filtered = allCustomers.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q)
    );
    renderCustomers(filtered);
}

// ============================================
// Modal: Add / Edit
// ============================================

function openAddCustomerModal() {
    document.getElementById('modalTitle').textContent = '➕ เพิ่มลูกค้าใหม่';
    document.getElementById('editCustomerId').value = '';
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-email').value = '';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('customerModal').style.display = 'flex';
}

function openEditModal(id, name, phone, email) {
    document.getElementById('modalTitle').textContent = '✏️ แก้ไขลูกค้า';
    document.getElementById('editCustomerId').value = id;
    document.getElementById('cust-name').value = name;
    document.getElementById('cust-phone').value = phone;
    document.getElementById('cust-email').value = email;
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('customerModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
}

// Close on backdrop click
document.addEventListener('click', e => {
    if (e.target.id === 'customerModal') closeModal();
});

async function saveCustomer() {
    const id = document.getElementById('editCustomerId').value;
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const errEl = document.getElementById('modal-error');

    if (!name) { errEl.textContent = 'กรุณาใส่ชื่อ'; errEl.style.display = 'block'; return; }
    if (!phone) { errEl.textContent = 'กรุณาใส่เบอร์โทร'; errEl.style.display = 'block'; return; }

    errEl.style.display = 'none';

    try {
        let res;
        if (id) {
            // Edit - find customer and update
            res = await fetch(`${API_URL}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email })
            });
        } else {
            // Add new
            res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email })
            });
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Save failed');
        }

        closeModal();
        await loadCustomers();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    }
}

async function deleteCustomer(id, name) {
    if (!confirm(`ต้องการลบ "${name}" ใช่ไหม?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

    try {
        const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        await loadCustomers();
    } catch (err) {
        alert('ไม่สามารถลบได้: ' + err.message);
    }
}
