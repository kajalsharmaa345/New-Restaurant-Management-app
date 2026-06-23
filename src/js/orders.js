// RestaurantOS - Orders Management Module
import { getState, setState, Icons, OrderStatusConfig, OrderTypeConfig } from './config.js';
import { getOrders, createOrder, updateOrderStatus, deleteOrder, getMenuItems, getTables } from './api.js';

let allOrders = [];
let allMenuItems = [];
let allTables = [];
let currentFilter = 'all';
let searchQuery = '';

export async function renderOrdersPage(container) {
    container.innerHTML = `
        <div class="page-header animate-slideUp">
            <div>
                <h1>${Icons.orders} Orders Management</h1>
                <p>Track and manage all orders in real-time</p>
            </div>
            <button class="btn btn-primary" id="new-order-btn">
                ${Icons.plus} New Order
            </button>
        </div>

        <div class="filter-bar animate-slideUp" style="animation-delay: 0.1s;">
            <div style="position: relative; flex: 1; max-width: 400px;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">${Icons.search}</span>
                <input type="text" id="orders-search" placeholder="Search orders..." style="width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); font-size: 0.875rem;">
            </div>
            <div id="status-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
        </div>

        <div id="orders-grid" class="orders-grid">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading orders...</p>
            </div>
        </div>
    `;

    await loadOrdersData();

    document.getElementById('orders-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderOrdersGrid();
    });

    document.getElementById('new-order-btn').addEventListener('click', () => {
        openNewOrderModal();
    });
}

async function loadOrdersData() {
    try {
        const [orders, items, tables] = await Promise.all([
            getOrders(),
            getMenuItems(),
            getTables()
        ]);

        allOrders = orders || [];
        allMenuItems = items || [];
        allTables = tables || [];

        // Render status filters
        const statusFilters = document.getElementById('status-filters');
        const statuses = ['all', 'pending', 'preparing', 'ready', 'completed'];
        statusFilters.innerHTML = statuses.map(status => {
            const count = status === 'all' ? allOrders.length : allOrders.filter(o => o.status === status).length;
            return `
                <button class="filter-btn ${currentFilter === status ? 'active' : ''}" data-status="${status}">
                    ${status === 'all' ? 'All' : OrderStatusConfig[status]?.label || status}
                    <span style="margin-left: 0.375rem; opacity: 0.6;">(${count})</span>
                </button>
            `;
        }).join('');

        statusFilters.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.status;
                statusFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderOrdersGrid();
            });
        });

        renderOrdersGrid();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrdersGrid() {
    const filtered = allOrders.filter(order => {
        const matchesFilter = currentFilter === 'all' || order.status === currentFilter;
        const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery) ||
            order.id.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const grid = document.getElementById('orders-grid');

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="loading-container" style="grid-column: 1 / -1;">
                <span style="font-size: 3rem; opacity: 0.3;">${Icons.orders}</span>
                <p style="color: var(--text-muted);">No orders found</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map((order, index) => {
        const typeConfig = OrderTypeConfig[order.order_type] || OrderTypeConfig['dine-in'];
        const statusConfig = OrderStatusConfig[order.status] || OrderStatusConfig.pending;
        const table = allTables.find(t => t.id === order.table_id);

        return `
            <div class="order-card animate-slideUp" style="animation-delay: ${index * 0.05}s;" onclick="window.viewOrderDetails('${order.id}')">
                <div class="order-header">
                    <div class="order-info">
                        <div class="order-type-icon" style="background: rgba(${typeConfig.color === '#10b981' ? '16, 185, 129' : typeConfig.color === '#3b82f6' ? '59, 130, 246' : '245, 158, 11'}, 0.1);">
                            ${typeConfig.icon}
                        </div>
                        <div>
                            <p class="order-id">#${order.id.slice(0, 8)}</p>
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">${order.customer_name}</h3>
                            ${table ? `<p class="order-table">Table ${table.table_number}</p>` : ''}
                        </div>
                    </div>
                    <span class="badge" style="background: ${statusConfig.bgColor}; color: ${statusConfig.color};">
                        ${statusConfig.icon} ${statusConfig.label}
                    </span>
                </div>

                <div class="order-items-preview">
                    ${(order.order_items || []).slice(0, 3).map(item => `
                        <div class="order-item-preview">
                            <span class="order-item-name">${item.quantity}x ${item.menu_item?.name || 'Item'}</span>
                            <span class="order-item-price">₹${Number(item.unit_price).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    ${(order.order_items?.length || 0) > 3 ? `<p style="font-size: 0.75rem; color: var(--text-muted);">+${order.order_items.length - 3} more items</p>` : ''}
                </div>

                <div class="order-footer">
                    <div class="order-time">
                        ${Icons.clock} ${getTimeAgo(order.created_at)}
                        <span class="badge badge-purple" style="margin-left: 0.5rem; font-size: 0.625rem;">${order.order_items?.length || 0} items</span>
                    </div>
                   <span class="order-total">₹${Number(order.total_amount).toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
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

// Order Details Modal
window.viewOrderDetails = (orderId) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const statusConfig = OrderStatusConfig[order.status] || OrderStatusConfig.pending;

    const modalHTML = `
        <div class="modal-overlay" id="order-modal">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">${OrderTypeConfig[order.order_type]?.icon || '📋'} ${order.customer_name}</h3>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">#${order.id.slice(0, 8)}</p>
                    </div>
                    <button class="modal-close" onclick="window.closeOrderModal()">${Icons.close}</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">Update Status</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${Object.entries(OrderStatusConfig).map(([key, config]) => `
                                <button onclick="window.updateOrderStatus('${order.id}', '${key}')"
                                        style="padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.375rem;
                                        ${order.status === key
                                            ? `background: ${config.bgColor}; color: ${config.color}; border: 1px solid ${config.color};`
                                            : 'background: var(--bg-input); color: var(--text-secondary); border: 1px solid transparent;'
                                        }">
                                    ${config.icon} ${config.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">Order Items</p>
                        ${(order.order_items || []).map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--bg-input); border-radius: 0.75rem; margin-bottom: 0.5rem;">
                                <div>
                                    <p style="color: var(--text-primary); font-weight: 500;">${item.menu_item?.name || 'Item'}</p>
                                    <p style="font-size: 0.75rem; color: var(--text-muted);">${item.quantity}x @ ₹${Number(item.unit_price).toFixed(2)}</p>
                                </div>
                                <p style="font-weight: 500; color: var(--text-primary);">₹${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>

                    <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-muted);">Subtotal</span>
                            <span style="color: var(--text-primary);">₹${Number(order.total_amount).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-muted);">Tax (10%)</span>
                            <span style="color: var(--text-primary);">₹${(Number(order.total_amount) * 0.1).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 700; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.75rem;">
                            <span style="color: var(--text-primary);">Total</span>
                            <span style="color: var(--primary);">₹${(Number(order.total_amount) * 1.1).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closeOrderModal = () => {
    const modal = document.getElementById('order-modal');
    if (modal) modal.remove();
};

window.updateOrderStatus = async (orderId, status) => {
    try {
        await updateOrderStatus(orderId, status);
        // Update local data
        const order = allOrders.find(o => o.id === orderId);
        if (order) order.status = status;

        window.closeOrderModal();
        renderOrdersGrid();
    } catch (error) {
        alert('Error updating order: ' + error.message);
    }
};

// New Order Modal
let newOrderItems = [];

function openNewOrderModal() {
    newOrderItems = allMenuItems.length > 0 ? [{ menuItemId: allMenuItems[0].id, quantity: 1 }] : [];

    const modalHTML = `
        <div class="modal-overlay" id="new-order-modal">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">New Order</h3>
                    </div>
                    <button class="modal-close" onclick="window.closeNewOrderModal()">${Icons.close}</button>
                </div>
                <form class="modal-body" id="new-order-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Customer Name *</label>
                            <input type="text" class="form-input" id="new-customer-name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone</label>
                            <input type="tel" class="form-input" id="new-customer-phone">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Order Type</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                                ${Object.entries(OrderTypeConfig).map(([key, config]) => `
                                    <button type="button" onclick="this.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active'); document.getElementById('new-order-type').value = '${key}';"
                                            style="padding: 0.75rem; border-radius: 0.75rem; text-align: center; background: var(--bg-input); border: 1px solid transparent; cursor: pointer; transition: all 0.2s;">
                                        <span style="font-size: 1.25rem;">${config.icon}</span>
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" id="new-order-type" value="dine-in">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Table</label>
                            <select class="form-input form-select" id="new-table-id">
                                <option value="">No Table</option>
                                ${allTables.map(t => `<option value="${t.id}">Table ${t.table_number} (${t.capacity} seats)</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label class="form-label" style="margin: 0;">Items</label>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.addOrderItem()">+ Add Item</button>
                        </div>
                        <div id="new-order-items"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 700; padding-top: 1rem; border-top: 1px solid var(--border);">
                        <span style="color: var(--text-primary);">Total</span>
                       <span style="color: var(--primary);" id="new-order-total">₹0.00</span>
                    </div>
                </form>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-block" type="button" onclick="window.closeNewOrderModal()">Cancel</button>
                    <button class="btn btn-primary btn-block" type="button" onclick="window.submitNewOrder()">Create Order</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    renderNewOrderItems();
}

window.closeNewOrderModal = () => {
    const modal = document.getElementById('new-order-modal');
    if (modal) modal.remove();
};

window.addOrderItem = () => {
    if (allMenuItems.length > 0) {
        newOrderItems.push({ menuItemId: allMenuItems[0].id, quantity: 1 });
        renderNewOrderItems();
    }
};

window.removeOrderItem = (index) => {
    newOrderItems.splice(index, 1);
    renderNewOrderItems();
};

function renderNewOrderItems() {
    const container = document.getElementById('new-order-items');
    if (!container) return;

    container.innerHTML = newOrderItems.map((item, index) => {
        const menuItem = allMenuItems.find(m => m.id === item.menuItemId);
        return `
            <div style="display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem; background: var(--bg-input); border-radius: 0.75rem; margin-bottom: 0.5rem;">
                <select style="flex: 1; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary);"
                        onchange="window.updateOrderItemSelect(${index}, this.value)">
                   ${allMenuItems.map(m => `
<option value="${m.id}" ${item.menuItemId === m.id ? 'selected' : ''}>
    ${m.name} - ₹${Number(m.price).toFixed(2)}
</option>
`).join('')}
                </select>
                <input type="number" min="1" value="${item.quantity}" style="width: 60px; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary); text-align: center;"
                       onchange="window.updateOrderItemQty(${index}, this.value)">
                <button type="button" class="btn btn-danger" style="padding: 0.5rem;" onclick="window.removeOrderItem(${index})">${Icons.close}</button>
            </div>
        `;
    }).join('');

    updateTotal();
}

window.updateOrderItemSelect = (index, value) => {
    newOrderItems[index].menuItemId = value;
    updateTotal();
};

window.updateOrderItemQty = (index, value) => {
    newOrderItems[index].quantity = parseInt(value) || 1;
    updateTotal();
};

function updateTotal() {
    const total = newOrderItems.reduce((sum, item) => {
        const menuItem = allMenuItems.find(m => m.id === item.menuItemId);
        return sum + (menuItem ? Number(menuItem.price) * item.quantity : 0);
    }, 0);

    const totalEl = document.getElementById('new-order-total');
    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

window.submitNewOrder = async () => {
    const customerName = document.getElementById('new-customer-name').value;
    const customerPhone = document.getElementById('new-customer-phone').value;
    const orderType = document.getElementById('new-order-type').value;
    const tableId = document.getElementById('new-table-id').value || null;

    if (!customerName) {
        alert('Please enter customer name');
        return;
    }

    const total = newOrderItems.reduce((sum, item) => {
        const menuItem = allMenuItems.find(m => m.id === item.menuItemId);
        return sum + (menuItem ? Number(menuItem.price) * item.quantity : 0);
    }, 0);

    const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone || null,
        order_type: orderType,
        table_id: tableId,
        total_amount: total,
        status: 'pending'
    };

    const items = newOrderItems.map(item => {
        const menuItem = allMenuItems.find(m => m.id === item.menuItemId);
        return {
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            unit_price: menuItem?.price || 0
        };
    });

    try {
        await createOrder(orderData, items);
        window.closeNewOrderModal();
        await loadOrdersData();
    } catch (error) {
        alert('Error creating order: ' + error.message);
    }
};
