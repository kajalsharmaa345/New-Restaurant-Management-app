// RestaurantOS - Configuration
// Supabase Configuration (PostgreSQL Database)

const SUPABASE_URL = 'https://ykkgnzcusbrklcyvmktm.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2duemN1c2Jya2xjeXZta3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTA0MTAsImV4cCI6MjA5NzQyNjQxMH0.8qVAhOE15EjBMHBJBvqWHc14LD-W_qFuYeNJbuUUTnY';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Export for use in other modules
export { supabaseClient };

// Application State
const AppState = {
    user: null,
    profile: null,
    currentPage: 'landing',
    sidebarOpen: window.innerWidth >= 1024,
    isLoading: false
};

// Helper to get state
export function getState() {
    return AppState;
}

// Helper to update state
export function setState(updates) {
    Object.assign(AppState, updates);
    if (updates.currentPage) {
        window.dispatchEvent(new CustomEvent('pageChange', { detail: updates.currentPage }));
    }
}

// Icons (SVG)
export const Icons = {
    menu: '☰',
    close: '✕',
    dashboard: '📊',
    orders: '📋',
    menu: '🍽️',
    tables: '🪑',
    reservations: '📅',
    admin: '⚙️',
    users: '👥',
    logout: '🚪',
    search: '🔍',
    bell: '🔔',
    plus: '+',
    edit: '✏️',
    delete: '🗑️',
    check: '✓',
    x: '✕',
    arrowUp: '↑',
    arrowDown: '↓',
    clock: '🕐',
    money: '💰',
    calendar: '📆',
    phone: '📞',
    email: '📧',
    user: '👤',
    settings: '⚙️',
    chart: '📈',
    trending: '📈',
    vegetarian: '🌱',
    vegan: '🌿',
    glutenFree: '🌾',
    indoor: '🏠',
    outdoor: '🌳',
    patio: '☀️',
    private: '🔐'
};

// Order Status Configuration
export const OrderStatusConfig = {
    pending: { label: 'Pending', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)', icon: '⏳' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: '✓' },
    preparing: { label: 'Preparing', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', icon: '👨‍🍳' },
    ready: { label: 'Ready', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: '🔔' },
    completed: { label: 'Completed', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)', icon: '✓' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: '✕' }
};

// Reservation Status Configuration
export const ReservationStatusConfig = {
    pending: { label: 'Pending', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)', icon: '⏳' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: '✓' },
    completed: { label: 'Completed', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: '✓' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: '✕' },
    'no-show': { label: 'No Show', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)', icon: '?' }
};

// Order Type Configuration
export const OrderTypeConfig = {
    'dine-in': { label: 'Dine In', icon: '🍽️', color: '#10b981' },
    'takeaway': { label: 'Takeaway', icon: '📦', color: '#3b82f6' },
    'delivery': { label: 'Delivery', icon: '🚗', color: '#f59e0b' }
};

// Table Location Configuration
export const TableLocationConfig = {
    indoor: { label: 'Indoor', icon: '🏠', color: '#3b82f6' },
    outdoor: { label: 'Outdoor', icon: '🌳', color: '#10b981' },
    patio: { label: 'Patio', icon: '☀️', color: '#f59e0b' },
    private: { label: 'Private', icon: '🔐', color: '#8b5cf6' }
};
