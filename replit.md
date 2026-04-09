# Proximity - Credit Repair Platform

A premium credit repair platform with a luxury fintech aesthetic (dark theme with gold accents).

## Architecture

- **Backend**: Node.js + Express (in `proximity/backend/`)
- **Frontend**: Vanilla HTML/CSS/JS (in `proximity/frontend/`)
- **Database**: Replit PostgreSQL (via `pg` pool in `proximity/backend/db.js`)
- **Auth**: JWT-based with role separation (`client` vs `admin`)

## Project Structure

```
proximity/
  backend/
    server.js          # Express entry point
    db.js              # PostgreSQL pool + table initialisation
    models/            # DB query functions (User, Dispute, ContactMessage)
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

The server runs from the `proximity/backend/` directory. The workflow `Start Proximity` handles this via:
```
node proximity/backend/server.js
```

It initialises PostgreSQL tables on startup, serves the frontend statically, and provides a REST API under `/api/`.

## Seeding the Admin User

Run once to create the initial admin account:
```
cd proximity/backend && node seedAdmin.js
```

Default credentials: `admin@proximity.com` / `Admin@12345` — **change this immediately after first login**.

## Environment Variables

Configured in Replit's Secrets/Environment tab:
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit DB)
- `JWT_SECRET` — Cryptographically strong random secret for JWTs (set)
- `NODE_ENV` — Set to `production`
- `PORT` — Default 5000
- `ALLOWED_ORIGIN` — CORS allowed origins (comma-separated or `*`)

### Optional Email Variables (for transactional emails)
- `EMAIL_HOST` — SMTP host
- `EMAIL_PORT` — SMTP port (default 587)
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `EMAIL_FROM` — Sender address
- `ADMIN_EMAIL` — Where admin contact notifications go
- `APP_URL` — Public URL used in email links

## Key Features

- Credit dispute management across Equifax, Experian, TransUnion
- JWT auth with client/admin roles
- Admin panel for user and dispute management
- Contact form with email notifications (requires `EMAIL_*` env vars)
- Security: helmet, cors, rate limiting, xss-clean, hpp, compression
- PostgreSQL database with UUID primary keys, foreign key constraints
