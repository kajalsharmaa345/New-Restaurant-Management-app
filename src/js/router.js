// RestaurantOS - Router Module
import { getState, setState, Icons } from './config.js';
import { renderDashboard } from './dashboard.js';
import { renderMenuPage } from './menu.js';
import { renderOrdersPage } from './orders.js';
import { renderTablesPage } from './tables.js';
import { renderReservationsPage } from './reservations.js';
import { renderAdminPage } from './admin.js';
import { initLanding } from './landing.js';

// Page configuration
const pages = {
   landing: {
    title: 'Welcome',
    icon: '🍽️',
    render: async (container) => {
        try {
            const res = await fetch('./src/pages/landing.html');
            const html = await res.text();
            container.innerHTML = html;

            initLanding();
        } catch (err) {
            console.error("Landing load failed:", err);
            container.innerHTML = "<h2>Landing failed to load</h2>";
        }
    }
},
    dashboard: {
        title: 'Dashboard',
        icon: Icons.dashboard,
        render: renderDashboard
    },
    orders: {
        title: 'Orders',
        icon: Icons.orders,
        render: renderOrdersPage
    },
    menu: {
        title: 'Menu',
        icon: Icons.menu,
        render: renderMenuPage
    },
    tables: {
        title: 'Tables',
        icon: Icons.tables,
        render: renderTablesPage
    },
    reservations: {
        title: 'Reservations',
        icon: Icons.reservations,
        render: renderReservationsPage
    },
    admin: {
        title: 'Admin',
        icon: Icons.admin,
        render: renderAdminPage,
        requiresAdmin: true
    }
};

// Navigate to page
export async function navigateTo(pageName) {
    const state = getState();
    const page = pages[pageName];

    if (!page) {
        console.error(`Page "${pageName}" not found`);
        return;
    }

    // Check admin permission
    if (page.requiresAdmin && state.profile?.role !== 'admin') {
        alert('You need admin privileges to access this page.');
        return;
    }

    setState({ currentPage: pageName });

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Update page title
    const headerTitle = document.querySelector('.header-title h2');
    if (headerTitle) {
        headerTitle.innerHTML = `${page.icon} ${page.title}`;
    }

    // Render page content
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
        await page.render(pageContent);
    }
}

// Get current page
export function getCurrentPage() {
    return getState().currentPage;
}

export { pages };
