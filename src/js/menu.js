// RestaurantOS - Menu Management Module
import { getState, setState, Icons } from './config.js';
import { getMenuItems, getCategories, createMenuItem, updateMenuItem, deleteMenuItem } from './api.js';

let currentCategory = 'all';
let searchQuery = '';
let allMenuItems = [];
let allCategories = [];

export async function renderMenuPage(container) {
    container.innerHTML = `
        <div class="page-header animate-slideUp">
            <div>
                <h1>${Icons.menu} Menu Management</h1>
                <p id="menu-count">Loading menu items...</p>
            </div>
            <button class="btn btn-primary" id="add-menu-item-btn">
                ${Icons.plus} Add Item
            </button>
        </div>

        <div class="filter-bar animate-slideUp" style="animation-delay: 0.1s;">
            <div style="position: relative; flex: 1; max-width: 400px;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">${Icons.search}</span>
                <input type="text" id="menu-search" placeholder="Search menu items..." style="width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); font-size: 0.875rem;">
            </div>
            <div id="category-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
        </div>

        <div id="menu-grid" class="menu-grid">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading menu items...</p>
            </div>
        </div>
    `;

    // Load data
    await loadMenuData();

    // Event listeners
    document.getElementById('menu-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderMenuGrid();
    });

    document.getElementById('add-menu-item-btn').addEventListener('click', () => {
        openMenuItemModal();
    });
}

async function loadMenuData() {
    try {
        const [items, categories] = await Promise.all([
            getMenuItems(),
            getCategories()
        ]);

        allMenuItems = items || [];
        allCategories = categories || [];

        document.getElementById('menu-count').textContent = `${allMenuItems.length} items in your menu`;

        // Render category filters
        const categoryFilters = document.getElementById('category-filters');
        categoryFilters.innerHTML = `
            <button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">All</button>
            ${allCategories.map(cat => `
                <button class="filter-btn ${currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">${cat.name}</button>
            `).join('')}
        `;

        // Add filter event listeners
        categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentCategory = btn.dataset.category;
                categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderMenuGrid();
            });
        });

        renderMenuGrid();
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menu-grid').innerHTML = `
            <div class="loading-container">
                <p style="color: var(--danger);">Error loading menu items. Please try again.</p>
            </div>
        `;
    }
}

function renderMenuGrid() {
    const filteredItems = allMenuItems.filter(item => {
        const matchesCategory = currentCategory === 'all' || item.category_id === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) ||
            (item.description && item.description.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    const grid = document.getElementById('menu-grid');

    if (filteredItems.length === 0) {
        grid.innerHTML = `
            <div class="loading-container" style="grid-column: 1 / -1;">
                <span style="font-size: 3rem; opacity: 0.3;">${Icons.menu}</span>
                <p style="color: var(--text-muted);">No menu items found</p>
                <button class="btn btn-primary" onclick="window.openAddMenuItem()">Add First Item</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredItems.map((item, index) => {
        const category = allCategories.find(c => c.id === item.category_id);
        return `
            <div class="menu-item-card animate-slideUp" style="animation-delay: ${index * 0.05}s;">
                <div class="menu-item-image">
                   ${item.image_url
    ? `<img 
        src="${item.image_url}?v=${item.id}" 
        alt="${item.name}" 
        onerror="this.onerror=null;this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'"
      >`
    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">${Icons.menu}</div>`
}
                    <div class="menu-item-availability">
                        <button class="availability-toggle ${item.is_available ? 'available' : 'unavailable'}"
                                onclick="window.toggleItemAvailability('${item.id}', ${!item.is_available})"
                                title="${item.is_available ? 'Available' : 'Unavailable'}">
                            ${item.is_available ? Icons.check : Icons.x}
                        </button>
                    </div>
                    <div class="menu-item-badges">
                        ${item.is_vegetarian ? `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--success);">${Icons.vegetarian}</span>` : ''}
                        ${item.is_vegan ? `<span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #22c55e;">${Icons.vegan}</span>` : ''}
                        ${item.is_gluten_free ? `<span class="badge" style="background: rgba(251, 191, 36, 0.2); color: var(--primary);">${Icons.glutenFree}</span>` : ''}
                    </div>
                </div>
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <div>
                            <h3 class="menu-item-name">${item.name}</h3>
                            <p class="menu-item-category">${category?.name || 'Uncategorized'}</p>
                        </div>
                        <span class="menu-item-price">₹${Number(item.price).toFixed(2)}</span>
                    </div>
                    ${item.description ? `<p class="menu-item-description line-clamp-2">${item.description}</p>` : ''}
                    <div class="menu-item-meta">
                        <span>${Icons.clock} ${item.preparation_time || 15} min</span>
                        ${item.calories ? `<span>${item.calories} cal</span>` : ''}
                    </div>
                   <div class="menu-item-actions">

    <button class="light-btn edit-light" onclick="window.editMenuItem('${item.id}')">
        ✏️ Edit
    </button>

    <button class="light-btn delete-light" onclick="window.deleteMenuItem('${item.id}')">
        🗑️ Delete
    </button>

</div>
                </div>
            </div>
        `;
    }).join('');
}

// Modal handling
let editingItem = null;

function openMenuItemModal(item = null) {
    editingItem = item;
    const isEditing = !!item;

    const modalHTML = `
        <div class="modal-overlay" id="menu-modal">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">${isEditing ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                    </div>
                    <button class="modal-close" onclick="window.closeMenuModal()">${Icons.close}</button>
                </div>
                <form id="menu-item-form" class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-input" id="item-name" value="${item?.name || ''}" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-input" id="item-description" rows="3">${item?.description || ''}</textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Price *</label>
                            <input type="number" step="0.01" class="form-input" id="item-price" value="${item?.price || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Prep Time (min)</label>
                            <input type="number" class="form-input" id="item-prep-time" value="${item?.preparation_time || 15}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-input form-select" id="item-category">
                            <option value="">No Category</option>
                            ${allCategories.map(cat => `
                                <option value="${cat.id}" ${item?.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Image URL</label>
                        <input type="url" class="form-input" id="item-image" value="${item?.image_url || ''}" placeholder="https://example.com/image.jpg">
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                        <label class="form-checkbox">
                            <input type="checkbox" id="item-available" ${item?.is_available !== false ? 'checked' : ''}>
                            <span>Available</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" id="item-vegetarian" ${item?.is_vegetarian ? 'checked' : ''}>
                            <span>${Icons.vegetarian} Vegetarian</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" id="item-vegan" ${item?.is_vegan ? 'checked' : ''}>
                            <span>${Icons.vegan} Vegan</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" id="item-gluten-free" ${item?.is_gluten_free ? 'checked' : ''}>
                            <span>${Icons.glutenFree} Gluten Free</span>
                        </label>
                    </div>
                </form>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-block" onclick="window.closeMenuModal()">Cancel</button>
                    <button class="btn btn-primary btn-block" onclick="window.saveMenuItem()">
                        ${isEditing ? 'Update Item' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openAddMenuItem = () => openMenuItemModal();
window.editMenuItem = (id) => {
    const item = allMenuItems.find(i => i.id === id);
    if (item) openMenuItemModal(item);
};

window.closeMenuModal = () => {
    const modal = document.getElementById('menu-modal');
    if (modal) modal.remove();
};

window.saveMenuItem = async () => {
    const name = document.getElementById('item-name').value;
    const description = document.getElementById('item-description').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const preparation_time = parseInt(document.getElementById('item-prep-time').value) || 15;
    const category_id = document.getElementById('item-category').value || null;
    const image_url = document.getElementById('item-image').value || null;
    const is_available = document.getElementById('item-available').checked;
    const is_vegetarian = document.getElementById('item-vegetarian').checked;
    const is_vegan = document.getElementById('item-vegan').checked;
    const is_gluten_free = document.getElementById('item-gluten-free').checked;

    const itemData = {
        name,
        description: description || null,
        price,
        preparation_time,
        category_id,
        image_url,
        is_available,
        is_vegetarian,
        is_vegan,
        is_gluten_free
    };

    try {
        if (editingItem) {
            await updateMenuItem(editingItem.id, itemData);
        } else {
            await createMenuItem(itemData);
        }

        window.closeMenuModal();
        await loadMenuData();
    } catch (error) {
        alert('Error saving menu item: ' + error.message);
    }
};

window.deleteMenuItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
        await deleteMenuItem(id);
        await loadMenuData();
    } catch (error) {
        alert('Error deleting menu item: ' + error.message);
    }
};

window.toggleItemAvailability = async (id, newStatus) => {
    try {
        await updateMenuItem(id, { is_available: newStatus });
        const item = allMenuItems.find(i => i.id === id);
        if (item) {
            item.is_available = newStatus;
            renderMenuGrid();
        }
    } catch (error) {
        alert('Error updating availability: ' + error.message);
    }
};
