# Proximity — Credit Repair Platform

## Overview
Proximity is a premium credit repair platform with a luxury fintech aesthetic. It features a full-stack architecture with a Node.js/Express backend, MongoDB database, and vanilla HTML/CSS/JS frontend.

## Architecture

### Backend (`proximity/backend/`)
- **Runtime:** Node.js 20 + Express 4
- **Database:** MongoDB + Mongoose 8
- **Auth:** JWT (30-day tokens, stored in localStorage)
- **Entry point:** `server.js`
- **Config:** `config.env` (gitignored — copy from template and add MONGO_URI)

#### Key files
- `server.js` — Express app, static serving, MongoDB connection
- `config.env` — Environment variables (MONGO_URI, JWT_SECRET, PORT)
- `seedAdmin.js` — Seeds admin account (`admin@proximity.com / Admin@123`)
- `models/` — User, Dispute, ContactMessage Mongoose models
- `routes/` — authRoutes, userRoutes, disputeRoutes, contactRoutes
- `middleware/` — authMiddleware (JWT protect), adminMiddleware, errorMiddleware

#### API Routes
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login, returns JWT
- `GET /api/auth/me` — Get current user (auth required)
- `PUT /api/auth/me` — Update profile (auth required)
- `GET /api/disputes` — Get user's disputes (auth required)
- `POST /api/disputes` — Submit new dispute (auth required)
- `GET /api/disputes/all` — All disputes (admin only)
- `PUT /api/disputes/:id` — Update dispute status (admin only)
- `DELETE /api/disputes/:id` — Delete dispute (admin only)
- `GET /api/users` — All users (admin only)
- `DELETE /api/users/:id` — Delete user (admin only)
- `POST /api/contact` — Submit contact message (public)
- `GET /api/contact` — All messages (admin only)
- `PUT /api/contact/:id/read` — Mark message read (admin only)
- `GET /api/health` — Health check

### Frontend (`proximity/frontend/`)
- **Stack:** Vanilla HTML + CSS + JavaScript (no frameworks)
- **Icons:** Lucide Icons via CDN
- **Charts:** Chart.js 4 via CDN
- **Fonts:** Poppins (display) + Inter (body) via Google Fonts

#### Pages
| File | Description |
|------|-------------|
| `index.html` | Landing/home page with hero, stats, features, testimonials |
| `about.html` | About page with team and mission |
| `services.html` | Services detail page |
| `pricing.html` | Pricing plans (Basic $79, Standard $149, Premium $299) + FAQ |
| `blog.html` | Blog listing page with sidebar |
| `blog-single.html` | Single blog article template |
| `contact.html` | Contact form + office info |
| `login.html` | Login form |
| `register.html` | Registration form |
| `client/dashboard.html` | Client portal (Overview, Disputes, Submit, Profile) |
| `admin/dashboard.html` | Admin panel (Overview, Users, Disputes, Messages) |

#### JavaScript files (`frontend/js/`)
- `main.js` — Navbar, hamburger menu, toast notifications, FAQ accordion, scroll animations
- `auth.js` — JWT management, login/register forms, `window.authUtils` helpers, `window.logout()`
- `dashboard.js` — Client portal: dispute listing, dispute submission, profile management, Chart.js
- `admin.js` — Admin panel: user/dispute/message management, KPI stats, Chart.js

#### CSS files (`frontend/css/`)
- `style.css` — Full design system: tokens, components, layout, utilities
- `animations.css` — Keyframes and scroll animation classes
- `responsive.css` — Mobile-first breakpoints

## Design System
- **Background:** `#0A0A0A` (primary), `#111111` (secondary), `#1A1A1A` (cards)
- **Gold accent:** `#B8924A`
- **Text:** `#FFFFFF` (primary), `#999999` (muted)
- **Fonts:** Poppins (headings), Inter (body)
- **Effects:** Glassmorphism cards, gold border highlights, subtle gradient backgrounds

## Setup & Running

### Development
1. `cd proximity/backend && npm install`
2. Add `MONGO_URI` to `proximity/backend/config.env` (MongoDB Atlas or local)
3. Optionally seed admin: `node seedAdmin.js` (creates `admin@proximity.com / Admin@123`)
4. Start: `node server.js` (runs on port 5000)

The server also serves the frontend statically — open `http://localhost:5000` in a browser.

### Environment Variables
| Key | Description |
|-----|-------------|
| `MONGO_URI` | MongoDB connection string (required for DB features) |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `ALLOWED_ORIGIN` | CORS origin (`*` for open) |

The server starts without `MONGO_URI` but API routes requiring the database will fail until it's set.

## Workflow
- **Name:** Start Proximity
- **Command:** `node proximity/backend/server.js`
- **Port:** 5000
