// RestaurantOS - Tables Management Module
import { getState, Icons, TableLocationConfig } from './config.js';
import { getTables, createTable, updateTable, deleteTable } from './api.js';

let allTables = [];

export async function renderTablesPage(container) {
    container.innerHTML = `
        <div class="page-header animate-slideUp">
            <div>
                <h1>${Icons.tables} Tables Management</h1>
                <p id="tables-count">Loading tables...</p>
            </div>
            <button class="btn btn-primary" id="add-table-btn">
                ${Icons.plus} Add Table
            </button>
        </div>

        <div class="stats-grid animate-slideUp" style="animation-delay: 0.1s;" id="tables-stats"></div>

        <div id="tables-grid" class="tables-grid">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading tables...</p>
            </div>
        </div>

        <div class="card animate-slideUp" style="animation-delay: 0.3s; margin-top: 1.5rem;">
            <h3 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem;">Legend</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; background: var(--success); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">✓</div>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">Available</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; background: var(--danger); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">✕</div>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">Occupied</span>
                </div>
                ${Object.entries(TableLocationConfig).map(([_, config]) => `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 32px; height: 32px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">${config.icon}</div>
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">${config.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    await loadTablesData();

    document.getElementById('add-table-btn').addEventListener('click', () => {
        openTableModal();
    });
}

async function loadTablesData() {
    try {
        allTables = await getTables() || [];

        document.getElementById('tables-count').textContent = `${allTables.length} tables configured`;

        // Stats
        const statsContainer = document.getElementById('tables-stats');
        statsContainer.innerHTML = `
            <div class="stat-card animate-slideUp" style="animation-delay: 0.2s;">
                <div class="stat-value">${allTables.length}</div>
                <div class="stat-label">Total Tables</div>
            </div>
            <div class="stat-card animate-slideUp" style="animation-delay: 0.3s;">
                <div class="stat-value" style="color: var(--success);">${allTables.filter(t => t.is_available).length}</div>
                <div class="stat-label">Available</div>
            </div>
            <div class="stat-card animate-slideUp" style="animation-delay: 0.4s;">
                <div class="stat-value" style="color: var(--danger);">${allTables.filter(t => !t.is_available).length}</div>
                <div class="stat-label">Occupied</div>
            </div>
            <div class="stat-card animate-slideUp" style="animation-delay: 0.5s;">
                <div class="stat-value">${allTables.reduce((sum, t) => sum + t.capacity, 0)}</div>
                <div class="stat-label">Total Seats</div>
            </div>
        `;

        renderTablesGrid();
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

function renderTablesGrid() {
    const grid = document.getElementById('tables-grid');

    if (allTables.length === 0) {
        grid.innerHTML = `
            <div class="loading-container" style="grid-column: 1 / -1;">
                <span style="font-size: 3rem; opacity: 0.3;">${Icons.tables}</span>
                <p style="color: var(--text-muted);">No tables configured</p>
                <button class="btn btn-primary" onclick="window.openAddTable()">Add First Table</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = allTables.map((table, index) => {
        const locationConfig = TableLocationConfig[table.location] || TableLocationConfig.indoor;
        return `
            <div class="table-card ${table.is_available ? '' : 'occupied'} animate-scaleIn" style="animation-delay: ${index * 0.05}s;">
                <div class="table-header">
                    <span class="badge" style="background: rgba(251, 191, 36, 0.1); color: var(--primary); font-size: 0.75rem;">
                        ${locationConfig.icon} ${locationConfig.label}
                    </span>
                    <button class="table-status ${table.is_available ? 'available' : 'occupied'}"
                            onclick="window.toggleTableAvailability('${table.id}', ${!table.is_available})"
                            title="${table.is_available ? 'Available' : 'Occupied'}">
                        ${table.is_available ? Icons.check : Icons.close}
                    </button>
                </div>
                <div class="table-number">${table.table_number}</div>
                <div class="table-capacity">
                    ${Icons.users} ${table.capacity} seats
                </div>
                <div class="table-actions">
                    <button class="btn btn-secondary" onclick="window.editTable('${table.id}')">
                        ${Icons.edit} Edit
                    </button>
                    <button class="btn btn-danger" onclick="window.deleteTable('${table.id}')">
                        ${Icons.delete}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal handling
let editingTable = null;

function openTableModal(table = null) {
    editingTable = table;
    const isEditing = !!table;
    const maxTableNum = allTables.length > 0 ? Math.max(...allTables.map(t => t.table_number)) : 0;

    const modalHTML = `
        <div class="modal-overlay" id="table-modal">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">${isEditing ? 'Edit Table' : 'Add Table'}</h3>
                    </div>
                    <button class="modal-close" onclick="window.closeTableModal()">${Icons.close}</button>
                </div>
                <form class="modal-body" id="table-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Table Number *</label>
                            <input type="number" class="form-input" id="table-number" value="${table?.table_number || maxTableNum + 1}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Capacity *</label>
                            <input type="number" class="form-input" id="table-capacity" value="${table?.capacity || 4}" min="1" max="20" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                            ${Object.entries(TableLocationConfig).map(([key, config]) => `
                                <button type="button" onclick="this.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active'); document.getElementById('table-location').value = '${key}';"
                                        style="padding: 0.75rem; border-radius: 0.75rem; text-align: center; background: ${table?.location === key ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-input)'}; border: 1px solid ${table?.location === key ? 'var(--primary)' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
                                    <span style="font-size: 1.25rem;">${config.icon}</span>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">${config.label}</p>
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="table-location" value="${table?.location || 'indoor'}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-input" id="table-notes" rows="2" placeholder="Window seat, near kitchen...">${table?.notes || ''}</textarea>
                    </div>

                    <label class="form-checkbox" style="padding: 0.75rem; background: var(--bg-input); border-radius: 0.75rem;">
                        <input type="checkbox" id="table-available" ${table?.is_available !== false ? 'checked' : ''}>
                        <span>Available for seating</span>
                    </label>
                </form>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-block" type="button" onclick="window.closeTableModal()">Cancel</button>
                    <button class="btn btn-primary btn-block" type="button" onclick="window.saveTable()">
                        ${isEditing ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openAddTable = () => openTableModal();
window.editTable = (id) => {
    const table = allTables.find(t => t.id === id);
    if (table) openTableModal(table);
};

window.closeTableModal = () => {
    const modal = document.getElementById('table-modal');
    if (modal) modal.remove();
};

window.saveTable = async () => {
    const tableNumber = parseInt(document.getElementById('table-number').value);
    const capacity = parseInt(document.getElementById('table-capacity').value);
    const location = document.getElementById('table-location').value;
    const notes = document.getElementById('table-notes').value || null;
    const isAvailable = document.getElementById('table-available').checked;

    const tableData = {
        table_number: tableNumber,
        capacity,
        location,
        notes,
        is_available: isAvailable
    };

    try {
        if (editingTable) {
            await updateTable(editingTable.id, tableData);
        } else {
            await createTable(tableData);
        }

        window.closeTableModal();
        await loadTablesData();
    } catch (error) {
        alert('Error saving table: ' + error.message);
    }
};

window.deleteTable = async (id) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
        await deleteTable(id);
        await loadTablesData();
    } catch (error) {
        alert('Error deleting table: ' + error.message);
    }
};

window.toggleTableAvailability = async (id, newStatus) => {
    try {
        await updateTable(id, { is_available: newStatus });
        const table = allTables.find(t => t.id === id);
        if (table) {
            table.is_available = newStatus;
            renderTablesGrid();
        }
    } catch (error) {
        alert('Error updating table: ' + error.message);
    }
};
