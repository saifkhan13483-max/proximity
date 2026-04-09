# Proximity – Credit Repair Platform PRD

## Overview
Full-stack credit repair web platform for **Proximity**. Brand colors: White `#FFFFFF` & Gold `#B8924A`. Professional, modern, trustworthy aesthetic.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no frameworks) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (stored in localStorage) |
| Fonts | Google Fonts: Poppins (headings), Inter (body) |

---

## Folder Structure
```
proximity/
├── backend/
│   ├── middleware/authMiddleware.js
│   ├── models/          # User, Dispute, ContactMessage
│   ├── routes/          # authRoutes, disputeRoutes, contactRoutes
│   ├── config.env       # MONGO_URI, JWT_SECRET, PORT=5000
│   └── server.js
└── frontend/
    ├── admin/dashboard.html
    ├── client/dashboard.html
    ├── css/style.css, responsive.css
    ├── js/main.js, auth.js, dashboard.js, admin.js
    ├── index.html, about.html, services.html
    ├── pricing.html, blog.html, blog-single.html
    ├── contact.html, login.html, register.html
```

---

## Backend Specs

### Models
- **User** — name, email, password (hashed), role (`client`|`admin`), createdAt
- **Dispute** — userId (ref), bureau (Equifax|Experian|TransUnion), accountName, reason, status (`Pending`|`In Progress`|`Resolved`), createdAt
- **ContactMessage** — name, email, message, createdAt

### API Routes
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, return JWT |
| GET/POST/PUT/DELETE | `/api/disputes` | JWT Required | CRUD disputes |
| POST | `/api/contact` | Public | Submit contact message |

### Middleware
- `authMiddleware.js` — verifies JWT, attaches user to `req.user`, supports role-based access (`admin` only routes)

---

## Frontend Pages & Key Sections

### `index.html` (Home)
- Sticky navbar: logo "Proximity" + links + Login/Register
- Hero: "Repair Your Credit. Rebuild Your Future." — dark/gold gradient, 2 CTAs
- Stats bar: 10,000+ clients, 98% satisfaction, $2M+ debt removed
- How It Works: 3-step process (Dispute → Monitor → Rebuild)
- Services overview cards
- Testimonials carousel with star ratings
- Gold CTA banner
- Footer with links, social icons, copyright

### `about.html`
- Mission hero, company story, founding values
- Team placeholder cards
- Why Choose Proximity: icon + text grid

### `services.html`
- 6 service cards: Credit Dispute Filing, Credit Monitoring, Debt Validation, Score Optimization, Identity Theft Protection, Financial Coaching
- Each: icon, title, description, "Learn More" button

### `pricing.html`
- 3 tiers: Basic / Standard / Premium — feature lists, prices, CTA
- FAQ accordion

### `blog.html` / `blog-single.html`
- Blog grid with cards (title, excerpt, date, category)
- Sidebar: search, categories, recent posts
- Single: full article, related posts, comment section

### `contact.html`
- Form: Name, Email, Phone, Message
- Contact info block + Google Maps placeholder

### `login.html` / `register.html`
- Centered card layout
- Login: email + password → JWT → redirect to client dashboard
- Register: name, email, password, confirm password → redirect to login

### `client/dashboard.html` (Protected)
- Redirect to login if no JWT
- Sidebar: Overview, My Disputes, Submit Dispute, Profile
- Stats cards: open disputes, resolved, credit score estimate
- Submit Dispute form (bureau, account name, reason)
- Disputes table with status badges

### `admin/dashboard.html` (Admin Role Only)
- Sidebar: Users, Disputes, Messages, Settings
- Tables to view/manage all records
- Inline dispute status update

---

## Design System
- **Primary:** `#B8924A` (gold) — buttons, accents, borders, highlights
- **Secondary:** `#FFFFFF` — backgrounds, cards, text on dark
- **Dark BG:** `#1a1a1a` / `#0d0d0d` — hero, navbar
- CSS custom properties for all colors and fonts
- Mobile-first, fully responsive, hamburger menu on mobile
- Button variants: solid gold (primary), outlined gold (secondary)
- Smooth hover transitions on all interactive elements

---

## Functional Requirements
- All API calls use `fetch()` with `Authorization: Bearer <token>` header
- Client-side form validation before submission
- Toast notifications for success/error states
- Smooth scroll + scroll-triggered fade-in animations (Intersection Observer)
- Unique `<title>` and favicon per page
- No external CSS frameworks — pure custom CSS only

---

## Security & Quality
- Passwords hashed with bcrypt before storage
- JWT secret loaded from `config.env` (never exposed client-side)
- Protected routes return `401` if token missing/invalid
- Admin routes return `403` if role is not `admin`
- Input sanitized server-side before DB writes

---

## Acceptance Criteria
- [ ] All 13 frontend pages render correctly on mobile and desktop
- [ ] Auth flow (register → login → dashboard → logout) works end-to-end
- [ ] Client can submit, view, and track disputes via dashboard
- [ ] Admin can view all users, disputes, messages and update dispute status
- [ ] Contact form saves message to DB and shows toast confirmation
- [ ] All protected routes redirect unauthenticated users to login
- [ ] Design matches brand colors and typography spec throughout
