// RestaurantOS - Dashboard Module
import { getState, Icons, OrderStatusConfig, OrderTypeConfig } from './config.js';
import { getAnalytics, getOrders, getTables, getReservations } from './api.js';

export async function renderDashboard(container) {
    const state = getState();

    container.innerHTML = `
        <div class="page-header animate-slideUp">
            <div>
                <h1>${Icons.dashboard} Dashboard</h1>
                <p>Welcome back, ${state.profile?.full_name?.split(' ')[0] || 'User'}! Here's what's happening today.</p>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid" id="dashboard-stats">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading statistics...</p>
            </div>
        </div>

        <!-- Charts Row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
            <div class="card" id="hourly-chart">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Hourly Orders</h3>
                        <p class="card-subtitle">Peak hours analysis</p>
                    </div>
                    <span class="badge badge-success">${Icons.trending} +18%</span>
                </div>
                <div id="hourly-bars" style="
    height: 220px;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 10px 0;
    width: 100%;
"></div>
            </div>

            <div class="card" id="status-chart">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Order Status</h3>
                        <p class="card-subtitle">Today's breakdown</p>
                    </div>
                </div>
                <div id="status-breakdown"></div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
            <div class="card" id="popular-items">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Popular Items</h3>
                        <p class="card-subtitle">Best sellers this month</p>
                    </div>
                </div>
                <div id="items-list"></div>
            </div>

            <div class="card" id="recent-orders">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Recent Orders</h3>
                        <p class="card-subtitle">Latest transactions</p>
                    </div>
                </div>
                <div id="orders-list"></div>
            </div>
        </div>
    `;

    // Load data
    await loadDashboardData();
}

async function loadDashboardData() {
    try {
        const [analytics, orders, tables, reservations] = await Promise.all([
            getAnalytics(),
            getOrders().catch(() => []),
            getTables().catch(() => []),
            getReservations().catch(() => [])
        ]);

        // Stats
        const todaysOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at).toDateString();
            return orderDate === new Date().toDateString();
        });

        const statsContainer = document.getElementById('dashboard-stats');
        statsContainer.innerHTML = `
            <div class="stat-card animate-slideUp" style="animation-delay: 0.1s;">
                <div class="stat-header">
                    <div class="stat-icon success">${Icons.money}</div>
                    <span class="stat-change positive">${Icons.arrowUp} +12.5%</span>
                </div>
                <div class="stat-value">₹${analytics.totalRevenue.toLocaleString()}</div>
                <div class="stat-label">Today's Revenue</div>
            </div>

            <div class="stat-card animate-slideUp" style="animation-delay: 0.2s;">
                <div class="stat-header">
                    <div class="stat-icon primary">${Icons.orders}</div>
                    <span class="stat-change positive">${Icons.arrowUp} +8.2%</span>
                </div>
                <div class="stat-value">${todaysOrders.length || analytics.totalOrders}</div>
                <div class="stat-label">Today's Orders</div>
            </div>

            <div class="stat-card animate-slideUp" style="animation-delay: 0.3s;">
                <div class="stat-header">
                    <div class="stat-icon info">${Icons.tables}</div>
                    <span class="stat-change negative">${Icons.arrowDown} 2</span>
                </div>
                <div class="stat-value">${tables.filter(t => !t.is_available).length}</div>
                <div class="stat-label">Active Tables</div>
            </div>

            <div class="stat-card animate-slideUp" style="animation-delay: 0.4s;">
                <div class="stat-header">
                    <div class="stat-icon purple">${Icons.reservations}</div>
                    <span class="stat-change positive">${Icons.arrowUp} +3</span>
                </div>
                <div class="stat-value">${reservations.filter(r => r.status === 'pending').length}</div>
                <div class="stat-label">Pending Reservations</div>
            </div>
        `;

        // Hourly Chart
        const hourlyData = [
            { hour: '11', orders: 3 },
            { hour: '12', orders: 12 },
            { hour: '13', orders: 18 },
            { hour: '14', orders: 8 },
            { hour: '18', orders: 15 },
            { hour: '19', orders: 22 },
            { hour: '20', orders: 14 }
        ];

        const maxOrders = Math.max(...hourlyData.map(d => d.orders));
        const hourlyBars = document.getElementById('hourly-bars');
        hourlyBars.innerHTML = hourlyData.map(d => `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style=" width: 35px;
    height: ${(d.orders / maxOrders) * 200}px;
    border-radius: 8px;
    background: linear-gradient(to top, #fbbf24, #f97316);
    transition: all 0.3s;
    cursor: pointer;
"
                     onmouseover="this.style.background='linear-gradient(to top, rgba(251, 191, 36, 0.5), #fcd34d)'"
                     onmouseout="this.style.background='linear-gradient(to top, rgba(251, 191, 36, 0.3), var(--primary))'"
                     title="${d.orders} orders - ₹${(d.orders * 45).toFixed(0)}"
                     style="height: ${(d.orders / maxOrders) * 100}%; min-height: 10px;"></div>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${d.hour}:00</span>
            </div>
        `).join('');

        // Status Breakdown
        const statusContainer = document.getElementById('status-breakdown');
        const statusBreakdown = analytics.orderTypeBreakdown;
        statusContainer.innerHTML = statusBreakdown.map((type, i) => `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-secondary);">${type.type}</span>
                    <span style="color: var(--text-primary); font-weight: 500;">${type.count} (${type.percent.toFixed(1)}%)</span>
                </div>
                <div style="height: 8px; background: var(--bg-input); border-radius: 999px; overflow: hidden;">
                    <div style="height: 100%; width: ${type.percent}%; background: ${['#10b981', '#3b82f6', '#f59e0b'][i]}; border-radius: 999px; animation: progress 1s ease-out;"></div>
                </div>
            </div>
        `).join('');

        // Popular Items
        const itemsContainer = document.getElementById('items-list');
        itemsContainer.innerHTML = analytics.topItems.map((item, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 0.75rem; background: var(--bg-input); margin-bottom: 0.5rem; transition: all 0.2s;" onmouseover="this.style.background='rgba(251, 191, 36, 0.05)'" onmouseout="this.style.background='var(--bg-input)'">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="width: 28px; height: 28px; background: ${i === 0 ? 'var(--gradient-primary)' : 'var(--bg-card)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; color: ${i === 0 ? 'var(--bg-dark)' : 'var(--text-secondary)'};">#${i + 1}</span>
                    <div>
                        <p style="font-weight: 500; color: var(--text-primary);">${item.name}</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">${item.count} sold</p>
                    </div>
                </div>
                <span style="color: var(--success); font-weight: 600;">₹${item.revenue.toFixed(2)}</span>
            </div>
        `).join('');

        // Recent Orders
        const ordersContainer = document.getElementById('orders-list');
        const recentOrders = orders.slice(0, 5);
        ordersContainer.innerHTML = recentOrders.length > 0 ? recentOrders.map(order => {
            const status = OrderStatusConfig[order.status] || OrderStatusConfig.pending;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 0.75rem; background: var(--bg-input); margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(251, 191, 36, 0.05)'" onmouseout="this.style.background='var(--bg-input)'">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 1.25rem;">${OrderTypeConfig[order.order_type]?.icon || '📋'}</span>
                        <div>
                            <p style="font-weight: 500; color: var(--text-primary);">${order.customer_name}</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted);">#${order.id.slice(0, 8)} • ${getTimeAgo(order.created_at)}</p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-weight: 600; color: var(--primary);">₹${Number(order.total_amount).toFixed(2)}</p>
                        <span class="badge" style="background: ${status.bgColor}; color: ${status.color}; font-size: 0.625rem;">${status.label}</span>
                    </div>
                </div>
            `;
        }).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent orders</p>';

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
}
