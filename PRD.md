# Proximity – Credit Repair Platform PRD
### Version 2.0 — Premium Visual Build

---

## Vision
Build the most visually dominant and technically robust credit repair platform on the web. Proximity must feel like a luxury fintech product — dark, cinematic, gold-accented — that instantly builds trust and drives conversions.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) — no frameworks |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (stored in localStorage) |
| Animations | Pure CSS keyframes + Intersection Observer + requestAnimationFrame |
| Charts | Chart.js (dashboard stats) |
| Icons | Lucide Icons (SVG, self-hosted) |
| Fonts | Google Fonts — Poppins (headings) + Inter (body) |

---

## Folder Structure
```
proximity/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Dispute.js
│   │   └── ContactMessage.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── disputeRoutes.js
│   │   └── contactRoutes.js
│   ├── config.env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── admin/
    │   └── dashboard.html
    ├── client/
    │   └── dashboard.html
    ├── css/
    │   ├── style.css        # Global + design tokens
    │   ├── animations.css   # All keyframes & transitions
    │   └── responsive.css   # Mobile-first breakpoints
    ├── js/
    │   ├── main.js          # Navbar, scroll, animations, toasts
    │   ├── auth.js          # Login/register/logout logic
    │   ├── dashboard.js     # Client portal logic + charts
    │   └── admin.js         # Admin panel logic
    ├── index.html
    ├── about.html
    ├── services.html
    ├── pricing.html
    ├── blog.html
    ├── blog-single.html
    ├── contact.html
    ├── login.html
    └── register.html
```

---

## Design System — Premium Tier

### Color Palette
```css
--color-gold:         #B8924A;   /* Primary — CTAs, accents */
--color-gold-light:   #D4A85C;   /* Hover state */
--color-gold-dark:    #8A6A32;   /* Active/pressed state */
--color-gold-glow:    rgba(184,146,74,0.25);  /* Glow/shadow effects */
--color-white:        #FFFFFF;
--color-off-white:    #F5F3EF;   /* Section alternates */
--color-dark-900:     #0A0A0A;   /* Deepest black — hero bg */
--color-dark-800:     #111111;   /* Navbar, footer */
--color-dark-700:     #1A1A1A;   /* Cards on dark */
--color-dark-600:     #222222;   /* Borders on dark */
--color-text-muted:   #9A9A9A;   /* Subtext on dark */
```

### Typography Scale
```css
--font-display:   'Poppins', sans-serif;   /* Headings */
--font-body:      'Inter', sans-serif;     /* Body, UI */
--text-hero:      clamp(3rem, 7vw, 6rem);  /* Hero H1 */
--text-h2:        clamp(2rem, 4vw, 3rem);
--text-h3:        clamp(1.25rem, 2.5vw, 1.75rem);
--text-body:      1rem;
--text-small:     0.875rem;
--leading-tight:  1.1;
--leading-normal: 1.6;
--tracking-wide:  0.08em;
```

### Elevation & Depth
```css
--shadow-card:    0 4px 24px rgba(0,0,0,0.4);
--shadow-gold:    0 0 30px rgba(184,146,74,0.3);
--shadow-hover:   0 8px 40px rgba(184,146,74,0.4);
--radius-card:    16px;
--radius-btn:     8px;
--radius-input:   10px;
```

### Animation Tokens
```css
--ease-smooth:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:  200ms;
--duration-base:  400ms;
--duration-slow:  700ms;
```

### Buttons
- **Primary:** Gold background `#B8924A`, white text, `box-shadow: var(--shadow-gold)` on hover, scale `1.03` on hover
- **Secondary:** Transparent background, gold border + gold text, fills gold on hover
- **Ghost:** White text only, underline on hover — for dark backgrounds
- All buttons: `border-radius: var(--radius-btn)`, `padding: 14px 32px`, `font-weight: 600`, `letter-spacing: 0.04em`

---

## Visual Effects — The Power Layer

### Hero Sections (All Pages)
- Deep dark background `#0A0A0A` with a **radial gold gradient glow** emanating from center-bottom
- Animated **noise/grain texture overlay** (CSS or SVG filter) for cinematic depth
- Floating **geometric shapes** (thin gold rings, diagonal lines) animated with slow drift keyframes
- Text enters with **staggered fade-up** animation — headline first, then subtext, then CTAs (100ms delays)

### Glassmorphism Cards
- Background: `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(184,146,74,0.2)`
- Backdrop-filter: `blur(20px)`
- On hover: border color transitions to `rgba(184,146,74,0.6)`, subtle `box-shadow: var(--shadow-gold)`

### Scroll Animations (Intersection Observer)
- `fade-up` — elements rise 40px into place as they enter viewport
- `fade-in-left` / `fade-in-right` — alternating section reveals
- `scale-in` — stat numbers and icons scale from 0.8 → 1
- All animations use `will-change: transform, opacity` for GPU acceleration

### Animated Counter Numbers
- Stats bar numbers count up from 0 when scrolled into view
- Duration: 2s with ease-out easing using `requestAnimationFrame`

### Navbar
- Transparent on page load, transitions to `rgba(10,10,10,0.95)` + `backdrop-filter: blur(20px)` on scroll
- Gold left-border underline that slides in on active link
- Hamburger menu on mobile: animated X/menu icon with slide-down full-screen overlay

### Gold Divider Lines
- All major section breaks use a thin horizontal rule styled as: `1px solid linear-gradient(to right, transparent, #B8924A, transparent)`

---

## Backend Specs

### Models
**User**
```
name, email, password (bcrypt), role ('client'|'admin'),
avatar (optional), phone, createdAt
```

**Dispute**
```
userId (ref: User), bureau ('Equifax'|'Experian'|'TransUnion'),
accountName, accountNumber (optional), reason, status ('Pending'|'In Progress'|'Resolved'),
notes (admin notes), createdAt, updatedAt
```

**ContactMessage**
```
name, email, phone, message, read (boolean), createdAt
```

### API Routes
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register, return JWT |
| POST | `/api/auth/login` | Public | Login, return JWT |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/disputes` | JWT | Get own disputes (client) |
| GET | `/api/disputes/all` | Admin | Get all disputes |
| POST | `/api/disputes` | JWT | Submit new dispute |
| PUT | `/api/disputes/:id` | Admin | Update dispute status/notes |
| DELETE | `/api/disputes/:id` | Admin | Delete dispute |
| GET | `/api/users` | Admin | Get all users |
| DELETE | `/api/users/:id` | Admin | Delete user |
| POST | `/api/contact` | Public | Submit contact message |
| GET | `/api/contact` | Admin | Get all messages |
| PUT | `/api/contact/:id/read` | Admin | Mark message as read |

### Middleware
- `authMiddleware.js` — JWT verification, attaches `req.user`
- `adminMiddleware.js` — role check, returns `403` if not admin
- `errorMiddleware.js` — centralized error handler returning structured JSON

---

## Frontend Pages

### `index.html` — Home
- **Navbar:** Sticky, transparent → blurred dark on scroll. Logo left, nav center, CTA button right
- **Hero:** Full viewport height. Headline: *"Repair Your Credit. Rebuild Your Future."* — 3-word-per-line split animation. Subtext below. Two CTAs: solid gold "Get Started", outline "Learn More". Gold glow orb effect behind text
- **Stats Bar:** Dark strip — animated counters: `10,000+ Clients`, `98% Satisfaction`, `$2M+ Debt Removed`, `500+ 5-Star Reviews`
- **How It Works:** Horizontal 3-step timeline on desktop, vertical on mobile. Steps: Dispute → Monitor → Rebuild. Connected by animated gold dashed line
- **Services Preview:** 3-column cards (glassmorphism) on dark BG with gold icon + title + excerpt
- **Testimonials:** Auto-playing carousel with swipe support. Star ratings in gold. Quote marks in oversized gold
- **CTA Banner:** Full-width, gold background, dark text. Subtle diagonal stripes pattern overlay
- **Footer:** Dark `#0A0A0A`, multi-column links, gold logo, social icons (hover: gold), copyright bar

### `about.html`
- Hero with mission: *"We Fight So You Don't Have To"*
- Story section: split layout — text left, abstract gold geometric right
- Founding values: 4-card grid with icon + title + text
- Team: placeholder cards with gold avatar rings, name, role
- Why Proximity: icon + bold stat + text — 4-column on desktop

### `services.html`
- Hero with animated background pattern
- 6 service cards in 3-column grid (glassmorphism on dark BG):
  - Credit Dispute Filing, Credit Monitoring, Debt Validation
  - Score Optimization, Identity Theft Protection, Financial Coaching
- Each card: SVG icon (gold), title, 2-line description, "Learn More" ghost button
- On hover: card lifts, gold border glows

### `pricing.html`
- Hero
- 3 pricing cards — Standard card highlighted with gold border + "Most Popular" badge:
  - **Basic** $79/mo — core disputes
  - **Standard** $149/mo — all features (highlighted)
  - **Premium** $299/mo — white-glove concierge
- Feature list with gold checkmarks, grayed-out X marks for unavailable
- Guarantee strip: *"30-Day Money-Back Guarantee"* with shield icon
- FAQ: animated accordion with smooth height transition, gold expand icon

### `blog.html`
- Hero with search bar
- Blog grid: 3-column cards — featured image (gradient placeholder), category tag (gold pill), title, excerpt, date, "Read More" link
- Sidebar: search, categories list, recent posts, newsletter subscribe field

### `blog-single.html`
- Full-width featured header with dark overlay + article title
- Article body: `max-width: 720px`, centered, `line-height: 1.9`, `font-size: 1.1rem`
- Author card, share icons, tags
- Related articles: 3-card row
- Comment form at bottom

### `contact.html`
- Split layout: form left (60%), contact info right (40%)
- Form fields: Name, Email, Phone, Subject, Message — all with gold focus ring
- Map placeholder: dark-styled iframe or CSS-drawn mockup
- Contact info block with location, phone, email — each with gold icon

### `login.html` / `register.html`
- Full-page dark background with gold glow radial
- Centered frosted glass card (`max-width: 460px`)
- Fields with animated float labels (label rises on focus)
- Password show/hide toggle
- Login success → store JWT → redirect to `/client/dashboard.html`
- Register success → redirect to `/login.html` with success toast

### `client/dashboard.html` — Protected
- Sidebar: dark `#111111`, gold active states, icon + label nav items
- Top bar: greeting, user avatar initials badge
- Overview tab:
  - 3 stat cards: Open Disputes, Resolved, Days Active
  - Line chart (Chart.js): dispute activity over time
  - Progress bar: credit improvement estimate
- My Disputes tab: sortable table with status badges (color-coded), date, bureau
- Submit Dispute tab: clean multi-field form with validation
- Profile tab: view/update name, email, phone

### `admin/dashboard.html` — Admin Only
- Sidebar matches client dashboard aesthetic, different nav items
- Overview: 4 KPI cards — Total Users, Total Disputes, Open Disputes, Unread Messages
- Bar chart (Chart.js): disputes by bureau
- Users tab: table with search, role badge, delete button
- Disputes tab: table with inline status dropdown, admin notes field, save button
- Messages tab: card list — unread highlighted, mark-read action

---

## Functional Requirements

### API Communication
- All authenticated calls: `fetch()` with `Authorization: Bearer <token>`
- Global `handleResponse(res)` utility — checks for `401` → redirect to login
- Loading spinner shown during all async operations

### Forms
- Client-side validation before any `fetch()` call
- Real-time field validation on blur (red border + error message)
- Disabled submit button while request is in-flight

### Toast Notifications
- Position: bottom-right, stacked
- Types: success (green-tinted), error (red-tinted), info (gold-tinted)
- Auto-dismiss after 4s with slide-out animation

### Performance
- All images use `loading="lazy"` + explicit `width`/`height`
- CSS custom properties used for all tokens — zero magic numbers
- Minimal JS payload — no bundler, no dependencies except Chart.js + Lucide

### SEO
- Unique `<title>` and `<meta name="description">` per page
- Open Graph tags on all pages
- Semantic HTML5 landmarks (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Canonical URLs on each page

---

## Security
- Passwords hashed with `bcrypt` (salt rounds: 12)
- JWT secret in `config.env` only — never in frontend code
- `401` for missing/invalid token, `403` for insufficient role
- `express-rate-limit` on auth routes (max 10 req/15 min)
- Input sanitized with `express-validator` before DB writes
- CORS restricted to frontend origin only

---

## Acceptance Criteria
- [ ] All 13 pages render pixel-perfect on mobile (375px), tablet (768px), desktop (1280px+)
- [ ] Dark hero gradient + gold glow effect renders on all pages
- [ ] All scroll animations trigger correctly without jank
- [ ] Stat counters animate on first scroll into view
- [ ] Navbar blur transition works on scroll
- [ ] Auth flow: register → login → dashboard → logout (full cycle)
- [ ] Client can submit, view, and track disputes
- [ ] Admin can update dispute status and mark messages read
- [ ] Chart.js renders in both dashboards with real data from API
- [ ] All forms validate client-side and show toast on success/error
- [ ] JWT expiry handled gracefully — redirect to login with message
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 85, SEO ≥ 95
- [ ] Zero console errors in production build
