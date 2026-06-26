// RestaurantOS - Main Application Entry Point
import { supabaseClient, getState, setState, Icons } from './config.js';
import { checkAuth, renderLoginPage, initAuthListener, signOut } from './auth.js';
import { navigateTo, pages } from './router.js';

async function initApp() {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="loading-screen">
            <div class="loading-spinner"></div>
            <p>Loading RestaurantOS...</p>
        </div>
    `;

    setTimeout(async () => {

        const isAuthenticated = await checkAuth();

        if (!isAuthenticated) {
            const res = await fetch("./src/pages/landing.html");
            app.innerHTML = await res.text();

            // Landing buttons initialize
            const { initLanding } = await import("./landing.js");
            initLanding();

            return;
        }

        // Logged in user
        renderMainLayout(app);
        await navigateTo("dashboard");
        initAuthListener();

    }, 300);
}
// Render Main Layout
function renderMainLayout(container) {
    const state = getState();
    const isAdmin = state.profile?.role === 'admin';

    container.innerHTML = `
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <div class="sidebar-logo-icon">🍽️</div>
                    <div>
                        <h1>RestaurantOS</h1>
                        <span>Management System</span>
                    </div>
                </div>
            </div>

            <nav class="sidebar-nav">
                <p class="nav-section-title">Main Menu</p>
                ${Object.entries(pages)
                    .filter(([_, config]) => !config.requiresAdmin || isAdmin)
                    .map(([key, config]) => `
                        <div class="nav-item ${key === state.currentPage ? 'active' : ''}" data-page="${key}">
                            <div class="nav-item-icon">${config.icon}</div>
                            <span>${config.title}</span>
                        </div>
                    `).join('')}
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar">${state.profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div>
                        <p class="user-name">${state.profile?.full_name || 'User'}</p>
                        <p class="user-role">${state.profile?.role || 'staff'}</p>
                    </div>
                </div>
                <button class="logout-btn" id="logout-btn">
                    ${Icons.logout} Sign Out
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="main-content" id="main-content">
            <!-- Header -->
            <header class="header">
                <div class="header-left">
                    <button class="menu-toggle" id="menu-toggle">
                        ☰
                    </button>
                    <div class="header-title">
                        <h2>${Icons.dashboard} Dashboard</h2>
                        <p>Welcome back, ${state.profile?.full_name?.split(' ')[0] || 'User'}!</p>
                    </div>
                </div>
                <div class="header-right">
                    <div class="search-box">
                        <input type="text" placeholder="Search...">
                        <span class="search-box-icon">${Icons.search}</span>
                    </div>
                    <div class="header-actions">
                        <button class="header-btn">
                            ${Icons.bell}
                            <span class="notification-dot"></span>
                        </button>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="page-content" id="page-content">
                <!-- Dynamic content renders here -->
            </main>
        </div>
    `;

    // Event Listeners
    setupEventListeners(container);
}

// Setup Event Listeners
function setupEventListeners(container) {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    // Menu Toggle (Mobile)
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to sign out?')) {
                await signOut();
            }
        });
    }

    // Responsive sidebar
    function handleResize() {
        if (window.innerWidth < 1024) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // Popstate for browser navigation
    window.addEventListener('popstate', (event) => {
        if (event.state?.page) {
            navigateTo(event.state.page);
        }
    });
}

// Start the application
initApp();
document.addEventListener("click", (e) => {
    const app = document.getElementById('app');

    if (e.target.id === "loginBtn") {
        renderLoginPage(app);
    }

    if (e.target.id === "getStartedBtn") {
        renderLoginPage(app);
    }
});