// sidebar.js - Reusable Sidebar Component
// Include this on every page: <script src="./sidebar.js"></script>

(function() {
    // Detect current page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    // Menu items
    const menuItems = [
        { href: 'index.html', icon: '📊', label: 'Dashboard', match: ['index.html', ''] },
        { href: 'appointments.html', icon: '📅', label: 'นัดหมาย', match: ['appointments.html', 'appointment_detail.html'] },
        { href: 'customers.html', icon: '👥', label: 'ลูกค้า', match: ['customers.html'] },
        { href: 'services.html', icon: '💅', label: 'บริการ', match: ['services.html', 'service-detail.html'] },
        { href: 'employee_dashboard.html', icon: '🧑‍💼', label: 'พนักงาน', match: ['employee_dashboard.html', 'technician_history.html'] },
        { href: 'transactions.html', icon: '💰', label: 'การเงิน', match: ['transactions.html'] },
        { href: 'reports.html', icon: '📊', label: 'รายงาน', match: ['reports.html'] },
        { href: 'admin_panel.html', icon: '⚙️', label: 'Admin', match: ['admin_panel.html'] },
    ];
    const footerItems = [
        { href: 'login.html', icon: '🔐', label: 'เข้าสู่ระบบ', match: ['login.html'] },
    ];

    // Find active item
    const activeItem = menuItems.find(m => m.match.includes(page));
    const activeHref = activeItem ? activeItem.href : '';

    // Build nav HTML
    const navHTML = menuItems.map(m => {
        const isActive = m.href === activeHref ? ' active' : '';
        return `<a href="${m.href}" class="sidebar-item${isActive}" data-tooltip="${m.label}">
            <span class="sidebar-icon">${m.icon}</span>
            <span class="sidebar-label">${m.label}</span>
        </a>`;
    }).join('');

    // Create sidebar element
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    // Build footer nav (login)
    const activeFooter = footerItems.find(m => m.match.includes(page));
    const activeFooterHref = activeFooter ? activeFooter.href : '';
    const footerHTML = footerItems.map(m => {
        const isActive = m.href === activeFooterHref ? ' active' : '';
        return `<a href="${m.href}" class="sidebar-item${isActive}" data-tooltip="${m.label}">
            <span class="sidebar-icon">${m.icon}</span>
            <span class="sidebar-label">${m.label}</span>
        </a>`;
    }).join('');

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <a href="index.html" style="text-decoration:none;">
                <span class="sidebar-logo-full">💅 NailReal</span>
                <span class="sidebar-logo-mini">💅</span>
            </a>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
            <div style="margin-bottom:0.5rem;">${footerHTML}</div>
            <button class="sidebar-toggle" id="sidebarToggle" title="พับ/กางเมนู">
                <span class="toggle-icon" id="toggleIcon">◀</span>
            </button>
        </div>
    `;

    // Create main wrapper (if not already present)
    let wrapper = document.querySelector('.main-wrapper');
    if (!wrapper) {
        // Wrap body content in main-wrapper
        wrapper = document.createElement('div');
        wrapper.className = 'main-wrapper';
        wrapper.id = 'mainWrapper';
        // Move all body children into wrapper (except sidebar)
        while (document.body.firstChild) {
            wrapper.appendChild(document.body.firstChild);
        }
    }

    // Remove old navbar if exists
    const oldNavbar = wrapper.querySelector('.navbar');
    if (oldNavbar) oldNavbar.remove();

    // Insert sidebar and wrapper
    document.body.prepend(sidebar);
    if (!document.querySelector('.main-wrapper')) {
        document.body.appendChild(wrapper);
    }

    // Toggle logic
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') sidebar.classList.add('collapsed');

    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
    }
})();
