# Proximity - Credit Repair Platform

A premium credit repair platform with a luxury fintech aesthetic (dark theme with gold accents).

## Architecture

- **Backend**: Node.js + Express (in `proximity/backend/`)
- **Frontend**: Vanilla HTML/CSS/JS (in `proximity/frontend/`)
- **Database**: MongoDB via Mongoose (optional — app starts without it)
- **Auth**: JWT-based with role separation (`client` vs `admin`)

## Project Structure

```
proximity/
  backend/
    server.js          # Express entry point
    models/            # Mongoose schemas (User, Dispute, ContactMessage)
    routes/            # API routes (auth, users, disputes, contact)
    middleware/        # Auth + error middleware
    utils/             # Email service (nodemailer)
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

The server runs from the project root:
```
node proximity/backend/server.js
```

It serves the frontend statically and provides REST API under `/api/`.

## Environment Variables

Set in Replit's environment (Secrets tab):
- `JWT_SECRET` — required for auth tokens
- `NODE_ENV` — `development` or `production`
- `PORT` — default 5000
- `ALLOWED_ORIGIN` — CORS allowed origin (use `*` for dev)
- `MONGO_URI` — MongoDB connection string (optional; app works without DB but auth/disputes won't function)

## Key Features

- Credit dispute management across Equifax, Experian, TransUnion
- JWT auth with client/admin roles
- Admin panel for user and dispute management
- Contact form with email notifications (requires `EMAIL_*` env vars)
- Security: helmet, cors, rate limiting, xss-clean, hpp, mongo-sanitize
