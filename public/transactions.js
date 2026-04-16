const API_URL = '/api';

let allTransactions = [];
let customers = [];
let appointments = [];
let services = [];

// Load initial data
async function initData() {
    try {
        const [txnRes, custRes, apptRes, svcRes] = await Promise.all([
            fetch(`${API_URL}/transactions`).then(r => r.json()),
            fetch(`${API_URL}/customers`).then(r => r.json()),
            fetch(`${API_URL}/appointments`).then(r => r.json()),
            fetch(`${API_URL}/services`).then(r => r.json()),
        ]);
        allTransactions = Array.isArray(txnRes) ? txnRes : [];
        customers = Array.isArray(custRes) ? custRes : [];
        appointments = Array.isArray(apptRes) ? apptRes : [];
        services = Array.isArray(svcRes) ? svcRes : [];
        populateDropdowns();
        renderTable();
    } catch (err) {
        console.error('Init error:', err);
    }
}

function populateDropdowns() {
    const custSelect = document.getElementById('customerId');
    custSelect.innerHTML = '<option value="">-- เลือกลูกค้า --</option>' +
        customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const apptSelect = document.getElementById('appointmentId');
    apptSelect.innerHTML = '<option value="">-- เลือกนัดหมาย --</option>' +
        appointments.map(a => `<option value="${a.id}">${a.id} - ${a.customerName || ''} (${a.date})</option>`).join('');
}

function renderTable() {
    const body = document.getElementById('txnBody');
    let filtered = [...allTransactions];

    // Search
    const search = document.getElementById('searchInput').value.toLowerCase();
    if (search) {
        filtered = filtered.filter(t => {
            const custName = getCustomerName(t.customerId);
            return (t.id || '').toLowerCase().includes(search) ||
                custName.toLowerCase().includes(search) ||
                (t.notes || '').toLowerCase().includes(search);
        });
    }

    // Date range
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    if (dateFrom) filtered = filtered.filter(t => t.createdAt >= dateFrom);
    if (dateTo) filtered = filtered.filter(t => t.createdAt <= dateTo + 'T23:59:59.999Z');

    // Status
    const status = document.getElementById('statusFilter').value;
    if (status) filtered = filtered.filter(t => t.status === status);

    // Sort by newest first
    filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (!filtered.length) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#7A7A7A;">ไม่มีข้อมูล</td></tr>';
        return;
    }

    body.innerHTML = filtered.map(t => {
        const date = (t.createdAt || '').split('T')[0];
        const custName = getCustomerName(t.customerId);
        const items = (t.items || []).map(i => `${i.serviceName || ''} x${i.qty || 1}`).join(', ');
        const statusClass = `status-${t.status}`;
        const statusText = t.status === 'paid' ? 'ชำระแล้ว' : t.status === 'refunded' ? 'คืนเงิน' : 'รอชำระ';
        const payMethod = t.paymentMethod === 'cash' ? 'เงินสด' : t.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เครดิต';

        return `<tr>
            <td>${date}</td>
            <td>${custName}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${items}">${items}</td>
            <td>฿${(t.totalAmount || 0).toLocaleString()}</td>
            <td>${payMethod}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-sm" style="background:#C9A86C;color:white;" onclick="editTxn('${t.id}')">✏️</button>
                <button class="btn-sm" style="background:#dc3545;color:white;" onclick="deleteTxn('${t.id}')">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function getCustomerName(customerId) {
    if (!customerId) return '-';
    const c = customers.find(c => c.id === customerId);
    return c ? c.name : customerId;
}

// Modal
function openModal(txn = null) {
    document.getElementById('txnModal').classList.add('show');
    document.getElementById('txnForm').reset();
    document.getElementById('txnId').value = '';
    document.getElementById('discount').value = '0';
    document.getElementById('itemsContainer').innerHTML = '';
    document.getElementById('totalDisplay').textContent = '0';

    if (txn) {
        document.getElementById('modalTitle').textContent = '✏️ แก้ไขรายการ';
        document.getElementById('txnId').value = txn.id;
        document.getElementById('customerId').value = txn.customerId || '';
        document.getElementById('appointmentId').value = txn.appointmentId || '';
        document.getElementById('paymentMethod').value = txn.paymentMethod || 'cash';
        document.getElementById('discount').value = txn.discount || 0;
        document.getElementById('notes').value = txn.notes || '';
        (txn.items || []).forEach(item => addItemRow(item));
        calcTotal();
    } else {
        document.getElementById('modalTitle').textContent = '➕ สร้างรายการใหม่';
        addItemRow();
    }
}

function closeModal() {
    document.getElementById('txnModal').classList.remove('show');
}

function addItemRow(data = null) {
    const container = document.getElementById('itemsContainer');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <select class="item-service" onchange="onServiceSelect(this)">
            <option value="">-- บริการ --</option>
            ${services.map(s => `<option value="${s.id}" data-price="${s.price}" data-name="${s.name}">${s.name} (฿${s.price})</option>`).join('')}
        </select>
        <input type="number" class="item-price" placeholder="ราคา" min="0" onchange="calcTotal()">
        <input type="number" class="item-qty" placeholder="จำนวน" value="1" min="1" onchange="calcTotal()">
        <button type="button" class="btn-sm" style="background:#dc3545;color:white;" onclick="this.parentElement.remove();calcTotal();">✕</button>
    `;
    if (data) {
        row.querySelector('.item-service').value = data.serviceId || '';
        row.querySelector('.item-price').value = data.price || 0;
        row.querySelector('.item-qty').value = data.qty || 1;
    }
    container.appendChild(row);
}

function onServiceSelect(el) {
    const opt = el.options[el.selectedIndex];
    const row = el.parentElement;
    row.querySelector('.item-price').value = opt.dataset.price || 0;
    calcTotal();
}

function calcTotal() {
    const rows = document.querySelectorAll('.item-row');
    let total = 0;
    rows.forEach(row => {
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const qty = parseInt(row.querySelector('.item-qty').value) || 1;
        total += price * qty;
    });
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    total -= discount;
    document.getElementById('totalDisplay').textContent = Math.max(0, total).toLocaleString();
}

// Submit form
document.getElementById('txnForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('txnId').value;
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const sel = row.querySelector('.item-service');
        const opt = sel.options[sel.selectedIndex];
        items.push({
            serviceId: sel.value,
            serviceName: opt ? opt.dataset.name || opt.textContent : '',
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            qty: parseInt(row.querySelector('.item-qty').value) || 1,
        });
    });

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0) - (parseFloat(document.getElementById('discount').value) || 0);

    const payload = {
        customerId: document.getElementById('customerId').value,
        appointmentId: document.getElementById('appointmentId').value,
        items,
        totalAmount: Math.max(0, totalAmount),
        paymentMethod: document.getElementById('paymentMethod').value,
        discount: parseFloat(document.getElementById('discount').value) || 0,
        notes: document.getElementById('notes').value,
        status: 'pending'
    };

    try {
        let res;
        if (id) {
            res = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`${API_URL}/transactions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
        }
        if (!res.ok) throw new Error('Save failed');
        closeModal();
        await initData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
});

// Edit
async function editTxn(id) {
    const txn = allTransactions.find(t => t.id === id);
    if (txn) openModal(txn);
}

// Delete
async function deleteTxn(id) {
    if (!confirm('ต้องการลบรายการนี้?')) return;
    try {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
        await initData();
    } catch (err) {
        alert('ลบไม่สำเร็จ: ' + err.message);
    }
}

// Filters
['searchInput', 'dateFrom', 'dateTo', 'statusFilter'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderTable);
    document.getElementById(id).addEventListener('change', renderTable);
});

// Init
initData();
