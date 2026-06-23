# RestaurantOS - Complete Restaurant Management System

A full-featured restaurant management system built with vanilla HTML, CSS, and JavaScript, powered by Supabase (PostgreSQL) backend.

## Features

### Core Modules
- **Dashboard** - Real-time analytics, revenue tracking, order statistics
- **Menu Management** - CRUD operations for menu items with categories
- **Orders** - Create, track, and manage dine-in, takeaway, and delivery orders
- **Tables** - Manage restaurant seating with status tracking
- **Reservations** - Booking system with calendar navigation
- **Admin Panel** - Staff management, categories, and analytics

### Authentication
- Email/Password authentication via Supabase Auth
- Role-based access control (Admin, Staff, Customer)
- Automatic profile creation on signup

### Technology Stack

**Frontend (Downloadable Source Code)**
- HTML5
- CSS3 (Custom styles, no framework)
- Vanilla JavaScript (ES6+ modules)
- Responsive design for all devices

**Backend & Database**
- Supabase (PostgreSQL database)
- Row Level Security (RLS) for data protection
- Real-time capabilities ready

## Project Structure

```
restaurantos/
├── index.html              # Main HTML entry point
├── src/
│   ├── css/
│   │   └── styles.css      # Complete stylesheet (~2000 lines)
│   └── js/
│       ├── config.js       # Supabase configuration & icons
│       ├── auth.js         # Authentication module
│       ├── api.js          # Database API operations
│       ├── dashboard.js    # Dashboard page
│       ├── menu.js         # Menu management
│       ├── orders.js       # Orders management
│       ├── tables.js       # Tables management
│       ├── reservations.js # Reservations management
│       ├── admin.js        # Admin panel
│       ├── router.js       # Client-side routing
│       └── app.js          # Main application entry
├── dist/                   # Production build
└── package.json
```

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Database Schema

The system uses the following tables:
- `profiles` - User profiles with roles
- `categories` - Menu categories
- `menu_items` - Menu items with dietary options
- `restaurant_tables` - Table configurations
- `orders` - Customer orders
- `order_items` - Order line items
- `reservations` - Table reservations

## Default Login

Sign up with any email and password (6+ characters) to create an account.
The first user to sign up may need to be promoted to admin role via database.

## API Operations

All database operations are handled through the `api.js` module:
- Full CRUD for menu items, categories, tables, reservations
- Order creation with items
- Status updates
- Analytics queries

## Features Highlight

### Dashboard
- Real-time statistics cards with animations
- Hourly order chart
- Order type breakdown
- Top selling items
- Recent orders list

### Menu Management
- Grid view with image previews
- Category filtering
- Search functionality
- Dietary tags (vegetarian, vegan, gluten-free)
- Availability toggle

### Orders
- Status workflow: Pending → Confirmed → Preparing → Ready → Completed
- Order type icons (dine-in, takeaway, delivery)
- Quick status updates
- Item breakdown

### Tables
- Visual table cards
- Location types (indoor, outdoor, patio, private)
- Capacity tracking
- Availability toggle

### Reservations
- Calendar date navigation
- Time-based filtering
- Customer contact info
- Table assignment

### Admin Panel
- Tab-based navigation (Analytics, Staff, Categories)
- Role management for staff
- Category CRUD operations
- Revenue analytics

## Customization

### Colors
Edit CSS variables in `src/css/styles.css`:
```css
:root {
    --primary: #fbbf24;
    --success: #10b981;
    --danger: #ef4444;
    /* ... more variables */
}
```

### Database
All database operations use Supabase client. Update `src/js/config.js` with your Supabase credentials.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - Free to use for personal and commercial projects.

---

Built with modern vanilla JavaScript, no external UI frameworks required.
