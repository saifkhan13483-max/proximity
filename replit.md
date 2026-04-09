# Proximity - Credit Repair Platform

## Overview
Proximity is a premium credit repair platform with a luxury fintech aesthetic. It helps users monitor their credit, submit disputes to credit bureaus (Equifax, Experian, TransUnion), and track progress through a dedicated dashboard.

## Project Structure
```
proximity/
├── backend/                # Node.js/Express API
│   ├── middleware/         # Auth, Admin, and Error handling
│   ├── models/             # Mongoose schemas (User, Dispute, ContactMessage)
│   ├── routes/             # API endpoints (Auth, Users, Disputes, Contact)
│   ├── utils/              # Helper services (emailService.js)
│   ├── server.js           # Entry point & static file serving
│   └── seedAdmin.js        # Script to create initial admin account
└── frontend/               # Vanilla JS SPA-like frontend
    ├── admin/              # Admin dashboard HTML
    ├── client/             # Client dashboard HTML
    ├── css/                # Design system (style, animations, responsive)
    ├── js/                 # Logic (main, auth, dashboard, admin)
    └── (root)/             # Landing pages (index, about, services, pricing, etc.)
```

## Tech Stack
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+), Chart.js, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT stored in localStorage
- **Security:** helmet, express-mongo-sanitize, xss-clean, hpp, express-rate-limit, bcryptjs

## Running the App
The workflow "Start Proximity" runs: `node proximity/backend/server.js`
- Server runs on port 5000
- Frontend served as static files from `proximity/frontend/`
- API endpoints under `/api/`

## Environment Variables (set in .replit [userenv.shared])
- `JWT_SECRET` - Secret for signing JWT tokens
- `NODE_ENV` - development or production
- `PORT` - Server port (default 5000)
- `ALLOWED_ORIGIN` - CORS allowed origin (use `*` for dev)
- `MONGO_URI` - MongoDB connection string (must be set to enable auth/database features)

## Key API Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users` - User management (admin)
- `GET/POST /api/disputes` - Dispute management
- `POST /api/contact` - Contact form submission
- `GET /api/health` - Health check

## Database Setup
To create an admin user, run: `node proximity/backend/seedAdmin.js`
- Default admin email: `admin@proximity.com`
- Default admin password: `Admin@123`

## Notes
- MongoDB URI must be configured in environment variables for full functionality
- The server starts without DB but API endpoints requiring DB will fail gracefully
- All dependencies are in `proximity/backend/package.json`
