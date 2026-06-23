// RestaurantOS - Reservations Management Module
import { getState, Icons, ReservationStatusConfig } from './config.js';
import { getReservations, createReservation, updateReservation, deleteReservation, getTables } from './api.js';

let allReservations = [];
let allTables = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedDate = new Date().toISOString().split('T')[0];

export async function renderReservationsPage(container) {
    container.innerHTML = `
        <div class="page-header animate-slideUp">
            <div>
                <h1>${Icons.reservations} Reservations</h1>
                <p>Manage restaurant bookings and reservations</p>
            </div>
            <button class="btn btn-primary" id="new-reservation-btn">
                ${Icons.plus} New Reservation
            </button>
        </div>

        <div class="filter-bar animate-slideUp" style="animation-delay: 0.1s;">
            <div style="position: relative; flex: 1; max-width: 400px;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">${Icons.search}</span>
                <input type="text" id="res-search" placeholder="Search by name, phone, or email..." style="width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); font-size: 0.875rem;">
            </div>
            <div id="res-status-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; margin-bottom: 1.5rem;" class="animate-slideUp" style="animation-delay: 0.2s;">
            <button class="btn btn-secondary" id="prev-day-btn">${Icons.arrowUp}</button>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">${Icons.calendar}</span>
                <input type="date" id="date-picker" value="${selectedDate}" style="background: transparent; border: none; color: var(--text-primary); font-size: 1.125rem; font-weight: 600; cursor: pointer;">
            </div>
            <button class="btn btn-secondary" id="next-day-btn">${Icons.arrowDown}</button>
            <button class="btn" id="today-btn" style="background: rgba(251, 191, 36, 0.1); color: var(--primary); padding: 0.5rem 1rem; border-radius: 0.75rem;">Today</button>
        </div>

        <div id="reservations-list">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading reservations...</p>
            </div>
        </div>
    `;

    await loadReservationsData();

    document.getElementById('res-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderReservationsList();
    });

    document.getElementById('date-picker').addEventListener('change', (e) => {
        selectedDate = e.target.value;
        renderReservationsList();
    });

    document.getElementById('prev-day-btn').addEventListener('click', () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        selectedDate = date.toISOString().split('T')[0];
        document.getElementById('date-picker').value = selectedDate;
        renderReservationsList();
    });

    document.getElementById('next-day-btn').addEventListener('click', () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        selectedDate = date.toISOString().split('T')[0];
        document.getElementById('date-picker').value = selectedDate;
        renderReservationsList();
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        selectedDate = new Date().toISOString().split('T')[0];
        document.getElementById('date-picker').value = selectedDate;
        renderReservationsList();
    });

    document.getElementById('new-reservation-btn').addEventListener('click', () => {
        openReservationModal();
    });
}

async function loadReservationsData() {
    try {
        const [reservations, tables] = await Promise.all([
            getReservations(),
            getTables()
        ]);

        allReservations = reservations || [];
        allTables = tables || [];

        // Status filters
        const filtersContainer = document.getElementById('res-status-filters');
        const statuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
        filtersContainer.innerHTML = statuses.map(status => {
            const todaysReservations = allReservations.filter(r => r.reservation_date === selectedDate);
            const count = status === 'all' ? todaysReservations.length : todaysReservations.filter(r => r.status === status).length;
            return `
                <button class="filter-btn ${currentFilter === status ? 'active' : ''}" data-status="${status}">
                    ${status === 'all' ? 'All' : ReservationStatusConfig[status]?.label || status}
                    ${count > 0 ? `<span style="margin-left: 0.375rem; opacity: 0.6;">(${count})</span>` : ''}
                </button>
            `;
        }).join('');

        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.status;
                filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderReservationsList();
            });
        });

        renderReservationsList();
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
}

function renderReservationsList() {
    const dayReservations = allReservations.filter(r => r.reservation_date === selectedDate);
    const filtered = dayReservations.filter(res => {
        const matchesFilter = currentFilter === 'all' || res.status === currentFilter;
        const matchesSearch = res.customer_name.toLowerCase().includes(searchQuery) ||
            res.customer_phone.includes(searchQuery) ||
            res.customer_email?.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const list = document.getElementById('reservations-list');

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="loading-container">
                <span style="font-size: 3rem; opacity: 0.3;">${Icons.calendar}</span>
                <p style="color: var(--text-muted);">No reservations for ${formatDate(selectedDate)}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map((res, index) => {
        const statusConfig = ReservationStatusConfig[res.status] || ReservationStatusConfig.pending;
        const table = allTables.find(t => t.id === res.table_id);

        return `
            <div class="card reservation-card animate-slideUp" style="margin-bottom: 1rem; cursor: pointer; transition: all 0.2s;"
                 style="animation-delay: ${index * 0.05}s;"
                 onclick="window.viewReservationDetails('${res.id}')">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <div style="padding: 1rem; border-radius: 1rem; background: ${statusConfig.bgColor};">
                            <span style="font-size: 1.5rem; color: ${statusConfig.color};">${Icons.clock}</span>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                                <h3 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary);">${res.customer_name}</h3>
                                <span class="badge" style="background: ${statusConfig.bgColor}; color: ${statusConfig.color};">
                                    ${statusConfig.icon} ${statusConfig.label}
                                </span>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                                <span style="display: flex; align-items: center; gap: 0.25rem; font-weight: 500; color: var(--primary);">
                                    ${Icons.clock} ${formatTime(res.reservation_time)}
                                </span>
                                <span>${Icons.users} ${res.party_size} guests</span>
                                ${table ? `<span class="badge badge-purple">Table ${table.table_number}</span>` : ''}
                            </div>
                            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                                ${res.customer_phone ? `<span>${Icons.phone} ${res.customer_phone}</span>` : ''}
                                ${res.customer_email ? `<span>${Icons.email} ${res.customer_email}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${res.status === 'pending' ? `
                            <button class="btn btn-sm" style="background: rgba(59, 130, 246, 0.1); color: var(--info);"
                                    onclick="event.stopPropagation(); window.updateResStatus('${res.id}', 'confirmed')">
                                ${Icons.check} Confirm
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); window.updateResStatus('${res.id}', 'cancelled')">
                                Cancel
                            </button>
                        ` : res.status === 'confirmed' ? `
                            <button class="btn btn-sm" style="background: rgba(16, 185, 129, 0.1); color: var(--success);"
                                    onclick="event.stopPropagation(); window.updateResStatus('${res.id}', 'completed')">
                                ${Icons.check} Complete
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.editReservation('${res.id}')">
                            ${Icons.edit}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); window.deleteReservation('${res.id}')">
                            ${Icons.delete}
                        </button>
                    </div>
                </div>
                ${res.notes ? `<div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-input); border-radius: 0.75rem; font-size: 0.875rem; color: var(--text-muted);">${res.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Modal handling
let editingReservation = null;

function openReservationModal(reservation = null) {
    editingReservation = reservation;
    const isEditing = !!reservation;

    const modalHTML = `
        <div class="modal-overlay" id="reservation-modal">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">${isEditing ? 'Edit Reservation' : 'New Reservation'}</h3>
                    </div>
                    <button class="modal-close" onclick="window.closeReservationModal()">${Icons.close}</button>
                </div>
                <form class="modal-body" id="reservation-form">
                    <div class="form-group">
                        <label class="form-label">Customer Name *</label>
                        <div class="form-input-icon">
                            <input type="text" class="form-input" id="res-customer-name" value="${reservation?.customer_name || ''}" required>
                            <span class="icon">${Icons.user}</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Phone *</label>
                            <div class="form-input-icon">
                                <input type="tel" class="form-input" id="res-phone" value="${reservation?.customer_phone || ''}" required>
                                <span class="icon">${Icons.phone}</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <div class="form-input-icon">
                                <input type="email" class="form-input" id="res-email" value="${reservation?.customer_email || ''}">
                                <span class="icon">${Icons.email}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Date *</label>
                            <input type="date" class="form-input" id="res-date" value="${reservation?.reservation_date || selectedDate}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Time *</label>
                            <input type="time" class="form-input" id="res-time" value="${reservation?.reservation_time || '19:00'}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Guests *</label>
                            <input type="number" class="form-input" id="res-guests" value="${reservation?.party_size || 2}" min="1" max="20" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Table</label>
                        <select class="form-input form-select" id="res-table">
                            <option value="">No Table Assigned</option>
                            ${allTables.map(t => `<option value="${t.id}" ${reservation?.table_id === t.id ? 'selected' : ''}>Table ${t.table_number} (${t.capacity} seats) - ${t.location}</option>`).join('')}
                        </select>
                    </div>

                    ${isEditing ? `
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                ${Object.entries(ReservationStatusConfig).map(([key, config]) => `
                                    <button type="button" onclick="this.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active'); document.getElementById('res-status').value = '${key}';"
                                            style="padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8125rem; cursor: pointer;
                                            ${reservation?.status === key
                                                ? `background: ${config.bgColor}; color: ${config.color}; border: 1px solid currentColor;`
                                                : 'background: var(--bg-input); color: var(--text-secondary); border: 1px solid transparent;'
                                            }">
                                        ${config.icon} ${config.label}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" id="res-status" value="${reservation?.status || 'pending'}">
                        </div>
                    ` : ''}

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-input" id="res-notes" rows="2" placeholder="Special requests...">${reservation?.notes || ''}</textarea>
                    </div>
                </form>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-block" type="button" onclick="window.closeReservationModal()">Cancel</button>
                    <button class="btn btn-primary btn-block" type="button" onclick="window.saveReservation()">
                        ${isEditing ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openAddReservation = () => openReservationModal();
window.editReservation = (id) => {
    const res = allReservations.find(r => r.id === id);
    if (res) openReservationModal(res);
};

window.closeReservationModal = () => {
    const modal = document.getElementById('reservation-modal');
    if (modal) modal.remove();
};

window.saveReservation = async () => {
    const customerName = document.getElementById('res-customer-name').value;
    const phone = document.getElementById('res-phone').value;
    const email = document.getElementById('res-email').value || null;
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const guests = parseInt(document.getElementById('res-guests').value);
    const tableId = document.getElementById('res-table').value || null;
    const notes = document.getElementById('res-notes').value || null;
    const status = document.getElementById('res-status')?.value || 'pending';

    const resData = {
        customer_name: customerName,
        customer_phone: phone,
        customer_email: email,
        reservation_date: date,
        reservation_time: time,
        party_size: guests,
        table_id: tableId,
        notes,
        status
    };

    try {
        if (editingReservation) {
            await updateReservation(editingReservation.id, resData);
        } else {
            await createReservation(resData);
        }

        window.closeReservationModal();
        await loadReservationsData();
    } catch (error) {
        alert('Error saving reservation: ' + error.message);
    }
};

window.deleteReservation = async (id) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    try {
        await deleteReservation(id);
        await loadReservationsData();
    } catch (error) {
        alert('Error deleting reservation: ' + error.message);
    }
};

window.updateResStatus = async (id, status) => {
    try {
        await updateReservation(id, { status });
        await loadReservationsData();
    } catch (error) {
        alert('Error updating reservation: ' + error.message);
    }
};

window.viewReservationDetails = (id) => {
    const res = allReservations.find(r => r.id === id);
    if (!res) return;
    window.editReservation(id);
};
