# Proximity - Credit Repair Platform

A premium credit repair platform with a luxury fintech aesthetic (dark theme with gold accents).

## Architecture

- **Backend**: Node.js + Express (in `proximity/backend/`)
- **Frontend**: Vanilla HTML/CSS/JS (in `proximity/frontend/`)
- **Database**: MongoDB via Mongoose
- **Auth**: JWT-based with role separation (`client` vs `admin`)

## Project Structure

```
proximity/
  backend/
    server.js          # Express entry point + MongoDB connection
    models/            # Mongoose schemas (User, Dispute, ContactMessage)
    routes/            # API routes (auth, users, disputes, contact)
    middleware/        # Auth + error middleware
    utils/             # Email service (nodemailer)
    seedAdmin.js       # Seeds the initial admin user
  frontend/
    index.html         # Landing page
    login.html         # Login page
    register.html      # Registration page
    client/            # User dashboard
    admin/             # Admin dashboard
    js/                # Frontend JS (auth.js, dashboard.js, admin.js)
    css/               # Styles (style.css, animations.css, responsive.css)
```

## Running the App

The workflow `Start Proximity` starts the server via:
```
node proximity/backend/server.js
```

The server connects to MongoDB, serves the frontend statically, and provides a REST API under `/api/`.

## Seeding the Admin User

Run once after MongoDB is connected:
```
cd proximity/backend && node seedAdmin.js
```

Default credentials: `admin@proximity.com` / `Admin@12345` — **change this immediately after first login**.

## Required Environment Variables

- `MONGO_URI` — MongoDB Atlas connection string (required for full functionality)
- `JWT_SECRET` — Secret for signing JWTs (set to a strong random value)
- `NODE_ENV` — `development` or `production`
- `PORT` — Default 5000
- `ALLOWED_ORIGIN` — CORS allowed origins (comma-separated, or `*`)

## Optional Email Variables

- `EMAIL_HOST` — SMTP host
- `EMAIL_PORT` — SMTP port (default 587)
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `EMAIL_FROM` — Sender display address
- `ADMIN_EMAIL` — Where contact form alerts go
- `APP_URL` — Public URL used in email links

## Key Features

- Credit dispute management across Equifax, Experian, TransUnion
- JWT auth with client/admin roles
- Admin panel for user and dispute management
- Contact form (with subject field) and email notifications (requires `EMAIL_*` env vars)
- Security: helmet, cors, rate limiting, xss-clean, hpp, mongo-sanitize, compression
- No-DB guard middleware: API returns a friendly 503 when MongoDB is not connected

## Audit Fixes Applied

- **Middleware ordering**: `express.json()` now runs before `mongoSanitize`, `xss-clean`, and `hpp` so those middlewares can actually inspect the request body (was a security bug)
- **config.env created**: JWT_SECRET now has a default value so auth works out of the box
- **Contact form `subject` field**: Added `subject` to `ContactMessage` model, contact API route, admin email alert, and the contact form's JS submission handler; admin panel now displays subject in message cards
- **No-DB guard**: Added `requireDb` middleware so all API routes return a clear 503 JSON error instead of a cryptic Mongoose timeout when `MONGO_URI` is not set
