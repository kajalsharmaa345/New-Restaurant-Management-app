// RestaurantOS - Admin Panel Module
import { getState, Icons } from './config.js';
import { getAnalytics, getProfiles, updateProfileRole, getCategories, createCategory, updateCategory, deleteCategory } from './api.js';

let activeTab = 'analytics';
let allProfiles = [];
let allCategories = [];

export async function renderAdminPage(container) {
    const state = getState();

    if (state.profile?.role !== 'admin') {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px;">
                <div style="width: 80px; height: 80px; background: rgba(239, 68, 68, 0.1); border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                    <span style="font-size: 2.5rem; color: var(--danger);">🔒</span>
                </div>
                <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Access Denied</h2>
                <p style="color: var(--text-secondary);">You need admin privileges to access this page.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="page-header animate-slideUp">
            <div>
                <h1>${Icons.admin} Admin Dashboard</h1>
                <p>Manage staff, categories, and view analytics</p>
            </div>
            <button class="btn btn-secondary" id="refresh-admin-btn">
                ${Icons.settings} Refresh Data
            </button>
        </div>

        <div id="admin-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem;" class="animate-slideUp stagger-2">
            <button class="filter-btn active" data-tab="analytics">${Icons.chart} Analytics</button>
            <button class="filter-btn" data-tab="staff">${Icons.users} Staff</button>
            <button class="filter-btn" data-tab="categories">${Icons.settings} Categories</button>
        </div>

        <div id="admin-content">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading admin data...</p>
            </div>
        </div>
    `;

    // Tab event listeners
    document.querySelectorAll('#admin-tabs .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeTab = btn.dataset.tab;
            document.querySelectorAll('#admin-tabs .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadTabContent();
        });
    });

    document.getElementById('refresh-admin-btn').addEventListener('click', loadTabContent);

    await loadTabContent();
}

async function loadTabContent() {
    const content = document.getElementById('admin-content');

    if (activeTab === 'analytics') {
        await loadAnalytics(content);
    } else if (activeTab === 'staff') {
        await loadStaff(content);
    } else {
        await loadCategories(content);
    }
}

async function loadAnalytics(container) {
    container.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div></div>`;

    try {
        const analytics = await getAnalytics();

        container.innerHTML = `
            <!-- Analytics Stats -->
            <div class="stats-grid animate-slideUp">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon success">${Icons.money}</div>
                        <span class="stat-change positive">${Icons.arrowUp} +18%</span>
                    </div>
                    <div class="stat-value">$${analytics.totalRevenue.toLocaleString()}</div>
                    <div class="stat-label">Total Revenue</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Last 30 days</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon primary">${Icons.orders}</div>
                        <span class="stat-change positive">${Icons.arrowUp} +24%</span>
                    </div>
                    <div class="stat-value">${analytics.totalOrders.toLocaleString()}</div>
                    <div class="stat-label">Total Orders</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Last 30 days</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon info">${Icons.chart}</div>
                        <span class="stat-change positive">${Icons.arrowUp} +8%</span>
                    </div>
                    <div class="stat-value">$${analytics.avgOrderValue.toFixed(2)}</div>
                    <div class="stat-label">Avg Order Value</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Per transaction</div>
                </div>
            </div>

            <!-- Charts -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                <div class="card animate-slideUp" style="animation-delay: 0.2s;">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Order Types</h3>
                            <p class="card-subtitle">Distribution breakdown</p>
                        </div>
                    </div>
                    <div>
                        ${analytics.orderTypeBreakdown.map((type, i) => `
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span style="color: var(--text-secondary);">${type.type}</span>
                                    <span style="color: var(--text-primary); font-weight: 500;">${type.count} (${type.percent.toFixed(1)}%)</span>
                                </div>
                                <div style="height: 8px; background: var(--bg-input); border-radius: 999px; overflow: hidden;">
                                    <div style="height: 100%; width: ${type.percent}%; background: ${['#10b981', '#3b82f6', '#f59e0b'][i]}; border-radius: 999px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card animate-slideUp" style="animation-delay: 0.3s;">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Top Selling Items</h3>
                            <p class="card-subtitle">Best performers</p>
                        </div>
                    </div>
                    <div>
                        ${analytics.topItems.map((item, i) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-input); border-radius: 0.75rem; margin-bottom: 0.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <span style="width: 32px; height: 32px; background: ${i === 0 ? 'var(--gradient-primary)' : 'var(--bg-card)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; color: ${i === 0 ? 'var(--bg-dark)' : 'var(--text-secondary)'};">#{'i' + 1}</span>
                                    <div>
                                        <p style="font-weight: 500; color: var(--text-primary);">${item.name}</p>
                                        <p style="font-size: 0.75rem; color: var(--text-muted);">{item.count} sold</p>
                                    </div>
                                </div>
                                <span style="color: var(--success); font-weight: 600;">${item.revenue.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 2rem;">Error loading analytics</p>`;
    }
}

async function loadStaff(container) {
    container.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div></div>`;

    try {
        allProfiles = await getProfiles() || [];

        // Demo profiles if empty
        if (allProfiles.length === 0) {
            allProfiles = [
                { id: '1', email: 'admin@restaurant.com', full_name: 'Admin User', role: 'admin' },
                { id: '2', email: 'manager@restaurant.com', full_name: 'Manager User', role: 'staff' },
                { id: '3', email: 'staff@restaurant.com', full_name: 'Staff User', role: 'staff' }
            ];
        }

        container.innerHTML = `
            <div class="card animate-slideUp">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Staff Members</h3>
                        <p class="card-subtitle">${allProfiles.length} team members</p>
                    </div>
                </div>
                <div id="staff-list">
                    ${allProfiles.map((profile, i) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-input); border-radius: 1rem; margin-bottom: 0.75rem;" class="animate-slideUp" style="animation-delay: ${i * 0.1}s;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 56px; height: 56px; background: ${profile.role === 'admin' ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #64748b, #475569)'}; border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; font-weight: 600;">
                                    ${profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <p style="font-weight: 600; color: var(--text-primary);">${profile.full_name || 'Staff Member'}</p>
                                        ${profile.role === 'admin' ? `<span style="color: var(--primary);">👑</span>` : ''}
                                    </div>
                                    <p style="font-size: 0.875rem; color: var(--text-secondary);">${profile.email}</p>
                                </div>
                            </div>
                            <select onchange="window.updateStaffRole('${profile.id}', this.value)"
                                    style="padding: 0.625rem 2rem 0.625rem 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); font-size: 0.875rem; font-weight: 500; cursor: pointer;">
                                <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="staff" ${profile.role === 'staff' ? 'selected' : ''}>Staff</option>
                                <option value="customer" ${profile.role === 'customer' ? 'selected' : ''}>Customer</option>
                            </select>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 2rem;">Error loading staff</p>`;
    }
}

async function loadCategories(container) {
    container.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div></div>`;

    try {
        allCategories = await getCategories() || [];

        // Demo categories if empty
        if (allCategories.length === 0) {
            allCategories = [
                { id: '1', name: 'Appetizers', description: 'Start your meal right', sort_order: 1, is_active: true },
                { id: '2', name: 'Main Courses', description: 'Hearty main dishes', sort_order: 2, is_active: true },
                { id: '3', name: 'Desserts', description: 'Sweet endings', sort_order: 3, is_active: true },
                { id: '4', name: 'Beverages', description: 'Refreshing drinks', sort_order: 4, is_active: true }
            ];
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">Menu Categories</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary);">${allCategories.length} categories</p>
                </div>
                <button class="btn btn-primary" onclick="window.openAddCategory()">
                    ${Icons.plus} Add Category
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;" id="categories-grid">
                ${allCategories.map((cat, i) => `
                    <div class="card animate-scaleIn" style="animation-delay: ${i * 0.05}s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                            <div style="padding: 0.75rem; background: var(--gradient-purple); border-radius: 0.75rem;">
                                <span style="color: white;">${Icons.settings}</span>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-secondary btn-sm" onclick="window.editCategory('${cat.id}')">${Icons.edit}</button>
                                <button class="btn btn-danger btn-sm" onclick="window.deleteCategory('${cat.id}')">${Icons.delete}</button>
                            </div>
                        </div>
                        <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${cat.name}</h4>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem;">${cat.description || 'No description'}</p>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="badge ${cat.is_active ? 'badge-success' : 'badge-danger'}">${cat.is_active ? 'Active' : 'Inactive'}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Sort: ${cat.sort_order}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 2rem;">Error loading categories</p>`;
    }
}

window.updateStaffRole = async (userId, role) => {
    try {
        await updateProfileRole(userId, role);
        const profile = allProfiles.find(p => p.id === userId);
        if (profile) profile.role = role;
    } catch (error) {
        alert('Error updating role: ' + error.message);
    }
};

// Category Modal
let editingCategory = null;

window.openAddCategory = () => {
    editingCategory = null;
    const modalHTML = `
        <div class="modal-overlay" id="category-modal">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Add Category</h3>
                    <button class="modal-close" onclick="window.closeCategoryModal()">${Icons.close}</button>
                </div>
                <form class="modal-body" id="category-form">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-input" id="cat-name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-input" id="cat-description" rows="3"></textarea>
                    </div>
                </form>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-block" onclick="window.closeCategoryModal()">Cancel</button>
                    <button class="btn btn-primary btn-block" onclick="window.saveCategory()">Create</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.editCategory = (id) => {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;

    editingCategory = cat;
    const modalHTML = `
        <div class="modal-overlay" id="category-modal">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Category</h3>
                    <button class="modal-close" onclick="window.closeCategoryModal()">${Icons.close}</button>
                </div>
                <form class="modal-body" id="category-form">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-input" id="cat-name" value="${cat.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-input" id="cat-description" rows="3">${cat.description || ''}</textarea>
                    </div>
                </form>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-block" onclick="window.closeCategoryModal()">Cancel</button>
                    <button class="btn btn-primary btn-block" onclick="window.saveCategory()">Update</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closeCategoryModal = () => {
    const modal = document.getElementById('category-modal');
    if (modal) modal.remove();
};

window.saveCategory = async () => {
    const name = document.getElementById('cat-name').value;
    const description = document.getElementById('cat-description').value || null;

    try {
        if (editingCategory) {
            await updateCategory(editingCategory.id, { name, description });
        } else {
            await createCategory({ name, description });
        }
        window.closeCategoryModal();
        const content = document.getElementById('admin-content');
        await loadCategories(content);
    } catch (error) {
        alert('Error saving category: ' + error.message);
    }
};

window.deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
        await deleteCategory(id);
        const content = document.getElementById('admin-content');
        await loadCategories(content);
    } catch (error) {
        alert('Error deleting category: ' + error.message);
    }
};
