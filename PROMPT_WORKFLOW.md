# Proximity – Replit AI Coding Agent Prompt Workflow
### Complete Step-by-Step Build Guide | Aligned with PRD v2.0 — Fixed & Production-Ready

> **How to use this file:** Paste each prompt directly into the Replit AI Coding Agent in the exact order shown. Wait for each step to fully complete before moving to the next. Each prompt builds on all previous work. Never skip a step — every step has dependencies.

---

## Phase 1 — Project Setup & Architecture

### Step 1.1 — Initialize Folder Structure & Placeholder Files
```
Create the complete folder structure for the Proximity credit repair platform. Create every folder and every file listed below as empty placeholder files — do not write any code yet, just create the files so the structure is in place:

proximity/
├── .gitignore
├── backend/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Dispute.js
│   │   └── ContactMessage.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
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
    │   ├── style.css
    │   ├── animations.css
    │   └── responsive.css
    ├── js/
    │   ├── main.js
    │   ├── auth.js
    │   ├── dashboard.js
    │   └── admin.js
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

### Step 1.2 — Create .gitignore
```
Write proximity/.gitignore with the following contents:

node_modules/
backend/config.env
.env
.DS_Store
*.log
npm-debug.log*

This must be done before any commits so config.env and node_modules are never accidentally tracked.
```

### Step 1.3 — Backend Package Initialization
```
Inside proximity/backend/, set up the Node.js project:
- Write package.json with:
  - name: "proximity-backend"
  - version: "1.0.0"
  - scripts: { "start": "node server.js", "dev": "nodemon server.js" }
  - dependencies: express, mongoose, bcryptjs, jsonwebtoken, dotenv, cors, express-validator, express-rate-limit
  - devDependencies: nodemon
- Run npm install to install all dependencies
```

### Step 1.4 — Environment Configuration
```
Write proximity/backend/config.env with the following variables — use placeholder strings only, I will fill in real values manually before running:

PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_strong_random_secret_min_32_chars_here
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5000

Do not use any real credentials here.
```

### Step 1.5 — Express Server Entry Point
```
Write proximity/backend/server.js:

- Load environment variables from config.env using: require('dotenv').config({ path: './config.env' })
- Import express, cors, mongoose, path, and the errorMiddleware from ./middleware/errorMiddleware
- Import all route files: authRoutes, userRoutes, disputeRoutes, contactRoutes
- Create Express app
- Apply middleware: express.json(), cors({ origin: process.env.ALLOWED_ORIGIN || '*' })
- Mount routes: app.use('/api/auth', authRoutes), app.use('/api/users', userRoutes), app.use('/api/disputes', disputeRoutes), app.use('/api/contact', contactRoutes)
- Add health check route: GET /api/health returns { success: true, status: 'ok', timestamp: Date.now() }
- In production (NODE_ENV === 'production'), serve frontend static files using: app.use(express.static(path.join(__dirname, '../frontend'))). Add a catch-all GET route that sends path.join(__dirname, '../frontend/index.html') for any non-API route.
- Apply errorHandler middleware AFTER all routes
- Connect to MongoDB using mongoose.connect(process.env.MONGO_URI). Log "MongoDB Connected" on success or log the error and exit on failure.
- Listen on process.env.PORT (default 5000). Log "Proximity API running on port [PORT]" on start.

IMPORTANT: Do not start the server yet — route files are still empty. Server is started after all routes are written.
```

---

## Phase 2 — Database Models

### Step 2.1 — User Model
```
Write proximity/backend/models/User.js with a Mongoose schema:

Fields:
- name: String, required, trimmed, maxlength 50
- email: String, required, unique, lowercase, trimmed
- password: String, required, minlength 6, select: false (exclude from queries by default)
- role: String, enum ['client', 'admin'], default 'client'
- phone: String, optional, trimmed
- avatar: String, optional
- createdAt: Date, default Date.now

Pre-save hook:
- Only hash password if it has been modified: if (!this.isModified('password')) return next()
- Hash using bcryptjs with salt rounds 12

Instance method:
- comparePassword(candidatePassword): return await bcrypt.compare(candidatePassword, this.password)

Export the model as 'User'.
```

### Step 2.2 — Dispute Model
```
Write proximity/backend/models/Dispute.js with a Mongoose schema:

Fields:
- userId: ObjectId, ref 'User', required, indexed
- bureau: String, enum ['Equifax', 'Experian', 'TransUnion'], required
- accountName: String, required, trimmed
- accountNumber: String, optional, trimmed
- reason: String, required, minlength 10, maxlength 1000
- status: String, enum ['Pending', 'In Progress', 'Resolved'], default 'Pending'
- notes: String, optional, maxlength 2000 (admin notes)
- createdAt: Date, default Date.now
- updatedAt: Date, default Date.now

Pre-save hook: set this.updatedAt = Date.now() before every save.

Export the model as 'Dispute'.
```

### Step 2.3 — ContactMessage Model
```
Write proximity/backend/models/ContactMessage.js with a Mongoose schema:

Fields:
- name: String, required, trimmed
- email: String, required, trimmed, lowercase
- phone: String, optional, trimmed
- message: String, required, minlength 10, maxlength 2000
- read: Boolean, default false
- createdAt: Date, default Date.now

Export the model as 'ContactMessage'.
```

---

## Phase 3 — Middleware

### Step 3.1 — Auth Middleware
```
Write proximity/backend/middleware/authMiddleware.js:

Import jsonwebtoken and the User model.

Export an async function "protect":
- Read the token from req.headers.authorization
- If it starts with 'Bearer ', extract the token part
- If no token: return res.status(401).json({ success: false, message: 'Not authorized, no token' })
- Verify with jwt.verify(token, process.env.JWT_SECRET)
- Find the user by decoded.id using User.findById(decoded.id).select('-password')
- If user not found: return 401 JSON: { success: false, message: 'User not found' }
- Attach user to req.user and call next()
- Wrap everything in try/catch — on error return 401 JSON: { success: false, message: 'Token invalid or expired' }
```

### Step 3.2 — Admin Middleware
```
Write proximity/backend/middleware/adminMiddleware.js:

Export a function "adminOnly":
- Check if req.user exists and req.user.role === 'admin'
- If yes: call next()
- If no: return res.status(403).json({ success: false, message: 'Admin access required' })

This middleware must always be used AFTER the protect middleware from authMiddleware.js, never alone.
```

### Step 3.3 — Error Middleware
```
Write proximity/backend/middleware/errorMiddleware.js:

Export a function "errorHandler(err, req, res, next)":
- Log err.stack to console only if process.env.NODE_ENV === 'development'
- Determine status code: use err.statusCode if set, otherwise use res.statusCode if not 200, otherwise 500
- Return res.status(statusCode).json({ success: false, message: err.message || 'Internal Server Error' })
```

---

## Phase 4 — Auth Routes & User Routes

### Step 4.1 — Auth Routes
```
Write proximity/backend/routes/authRoutes.js:

Import express, express-validator (check, validationResult), express-rate-limit, jwt, User model, and protect middleware.

Create a rate limiter: max 10 requests per 15 minutes, message: { success: false, message: 'Too many requests, please try again later' }

Helper function generateToken(userId):
- return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' })

POST /register (rate limited):
- Validate: name not empty, email is valid email, password min 6 chars
- If validation errors: return 400 with errors array
- Check if User.findOne({ email }) exists — if yes: return 400 { success: false, message: 'Email already registered' }
- Create new user and save
- Return 201: { success: true, token: generateToken(user._id), user: { _id, name, email, role, createdAt } }

POST /login (rate limited):
- Validate: email is valid email, password not empty
- Find user by email using User.findOne({ email }).select('+password') — need +password because select:false is set
- If not found: return 401 { success: false, message: 'Invalid credentials' }
- Compare password using user.comparePassword(req.body.password)
- If mismatch: return 401 { success: false, message: 'Invalid credentials' }
- Return 200: { success: true, token: generateToken(user._id), user: { _id, name, email, role, phone, createdAt } }

GET /me (protected):
- Use protect middleware
- Return 200: { success: true, user: req.user }

PUT /me (protected):
- Use protect middleware
- Allow updating: name, phone only — do NOT allow email or role updates via this route
- Validate: name not empty if provided
- Update user using User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true }).select('-password')
- Return 200: { success: true, user: updatedUser }
```

### Step 4.2 — User Routes
```
Write proximity/backend/routes/userRoutes.js:

Import express, User model, Dispute model, protect middleware (authMiddleware), and adminOnly middleware (adminMiddleware).

GET / (protected + adminOnly):
- Find all users using User.find().select('-password').sort({ createdAt: -1 })
- Return 200: { success: true, count: users.length, users }

DELETE /:id (protected + adminOnly):
- Validate that req.params.id is a valid MongoDB ObjectId — return 400 if not
- Find and delete user by ID using User.findByIdAndDelete
- If user not found: return 404 { success: false, message: 'User not found' }
- Also delete all disputes belonging to that user: Dispute.deleteMany({ userId: req.params.id })
- Return 200: { success: true, message: 'User and associated disputes deleted' }
```

---

## Phase 5 — Core API Routes

### Step 5.1 — Dispute Routes
```
Write proximity/backend/routes/disputeRoutes.js:

Import express, check/validationResult from express-validator, Dispute model, protect middleware, adminOnly middleware.

GET / (protected):
- Return disputes where userId === req.user._id, sorted by createdAt -1
- Return 200: { success: true, count, disputes }

GET /all (protected + adminOnly):
- Return all disputes, populated with user name and email (populate userId with 'name email'), sorted by createdAt -1
- Return 200: { success: true, count, disputes }

POST / (protected):
- Validate: bureau must be in ['Equifax', 'Experian', 'TransUnion'], accountName not empty, reason min 10 chars
- If validation errors: return 400 with errors array
- Create dispute: { userId: req.user._id, bureau, accountName, accountNumber, reason }
- Return 201: { success: true, dispute }

PUT /:id (protected + adminOnly):
- Only allow updating: status, notes
- Find dispute by ID — return 404 if not found
- Update with { status, notes, updatedAt: Date.now() } using findByIdAndUpdate with { new: true }
- Return 200: { success: true, dispute }

DELETE /:id (protected + adminOnly):
- Find and delete dispute by ID — return 404 if not found
- Return 200: { success: true, message: 'Dispute deleted' }
```

### Step 5.2 — Contact Routes
```
Write proximity/backend/routes/contactRoutes.js:

Import express, check/validationResult from express-validator, ContactMessage model, protect middleware, adminOnly middleware.

POST / (public):
- Validate: name not empty, email is valid, message min 10 chars
- If validation errors: return 400 with errors array
- Create and save ContactMessage
- Return 201: { success: true, message: 'Message sent successfully' }

GET / (protected + adminOnly):
- Return all messages sorted by: read ascending (unread first), then createdAt descending
- Return 200: { success: true, count, messages }

PUT /:id/read (protected + adminOnly):
- Find message by ID — return 404 if not found
- Update read: true using findByIdAndUpdate with { new: true }
- Return 200: { success: true, message: updatedMessage }
```

### Step 5.3 — Create Admin Seed Script
```
Create proximity/backend/seedAdmin.js:

This script creates the first admin user. It is run ONCE manually via: node seedAdmin.js

The script should:
- Load dotenv from config.env
- Connect to MongoDB
- Check if a user with email 'admin@proximity.com' already exists — if yes, log 'Admin already exists' and exit
- Create a new User with: name: 'Proximity Admin', email: 'admin@proximity.com', password: 'Admin@123', role: 'admin'
- Save the user (the pre-save hook will hash the password automatically)
- Log 'Admin user created: admin@proximity.com / Admin@123'
- Log 'IMPORTANT: Change this password immediately after first login'
- Disconnect from MongoDB and exit

IMPORTANT: This file is for initial setup only and should be deleted or excluded from production after use.
```

---

## Phase 6 — Lucide Icons & Chart.js Setup

### Step 6.1 — Lucide Icons Setup
```
Set up Lucide Icons for the Proximity frontend:

1. In proximity/frontend/, create a folder: icons/
2. Download the Lucide icons CDN script by adding this script tag — use it in all HTML pages in the <head>:
   <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

3. To render icons in HTML use: <i data-lucide="icon-name"></i>
   Example: <i data-lucide="shield"></i>

4. To initialize all icons on a page, call this at the bottom of every HTML page's <body>, just before closing </body>:
   <script>lucide.createIcons();</script>

5. Style all Lucide icons in style.css:
   [data-lucide] { width: 24px; height: 24px; stroke: currentColor; }
   .icon-gold { stroke: var(--color-gold); }
   .icon-lg { width: 48px; height: 48px; }

6. Confirm this works by adding a test icon to index.html. Remove the test after confirming it renders.

Common icon names used in this project:
- shield, activity, trending-up, lock, book-open, file-text (services)
- grid, list, plus-circle, user, log-out (dashboard sidebar)
- bar-chart, mail, users (admin sidebar)
- eye, eye-off (password toggle)
- map-pin, phone, mail (contact page)
- check, x (pricing features)
- chevron-down (accordion)
- menu, x (hamburger)
```

---

## Phase 7 — CSS Design System

### Step 7.1 — Global Styles & Design Tokens
```
Write proximity/frontend/css/style.css:

1. Google Fonts import at the very top (before any rules):
   @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Inter:wght@400;500;600&display=swap');

2. :root block with ALL of these exact CSS custom properties:
   --color-gold: #B8924A;
   --color-gold-light: #D4A85C;
   --color-gold-dark: #8A6A32;
   --color-gold-glow: rgba(184,146,74,0.25);
   --color-white: #FFFFFF;
   --color-off-white: #F5F3EF;
   --color-dark-900: #0A0A0A;
   --color-dark-800: #111111;
   --color-dark-700: #1A1A1A;
   --color-dark-600: #222222;
   --color-text-muted: #9A9A9A;
   --font-display: 'Poppins', sans-serif;
   --font-body: 'Inter', sans-serif;
   --text-hero: clamp(3rem, 7vw, 6rem);
   --text-h2: clamp(2rem, 4vw, 3rem);
   --text-h3: clamp(1.25rem, 2.5vw, 1.75rem);
   --text-body: 1rem;
   --text-small: 0.875rem;
   --leading-tight: 1.1;
   --leading-normal: 1.6;
   --tracking-wide: 0.08em;
   --shadow-card: 0 4px 24px rgba(0,0,0,0.4);
   --shadow-gold: 0 0 30px rgba(184,146,74,0.3);
   --shadow-hover: 0 8px 40px rgba(184,146,74,0.4);
   --radius-card: 16px;
   --radius-btn: 8px;
   --radius-input: 10px;
   --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
   --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
   --duration-fast: 200ms;
   --duration-base: 400ms;
   --duration-slow: 700ms;

3. CSS Reset: *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

4. Base styles: html { scroll-behavior: smooth; } body { background-color: var(--color-dark-900); color: var(--color-white); font-family: var(--font-body); font-size: var(--text-body); line-height: var(--leading-normal); }

5. Heading styles (h1–h4): font-family Poppins, line-height tight, appropriate sizes from type scale vars

6. .container class: max-width 1200px, margin auto, padding 0 24px

7. .section class: padding 80px 0

8. Three button classes:
   .btn-primary: background var(--color-gold), color white, padding 14px 32px, border-radius var(--radius-btn), font-weight 600, letter-spacing 0.04em, border none, cursor pointer, transition all 300ms ease — hover: background var(--color-gold-light), box-shadow var(--shadow-hover), transform scale(1.03)
   .btn-secondary: background transparent, color var(--color-gold), border 2px solid var(--color-gold), same padding/radius — hover: background var(--color-gold), color white
   .btn-ghost: background transparent, color white, border none, padding 14px 0, text-decoration underline transparent, transition — hover: text-decoration-color white

9. .glass-card class: background rgba(255,255,255,0.04), border 1px solid rgba(184,146,74,0.2), backdrop-filter blur(20px), border-radius var(--radius-card), box-shadow var(--shadow-card) — hover: border-color rgba(184,146,74,0.6), box-shadow var(--shadow-gold), transform translateY(-4px), all transitions 300ms ease

10. .gold-divider class: display block, height 1px, background linear-gradient(to right, transparent, var(--color-gold), transparent), margin 0, border none

11. Navbar (.navbar): position fixed, top 0, left 0, right 0, z-index 1000, display flex, align-items center, justify-content space-between, padding 20px 40px, transition background 400ms ease, backdrop-filter blur(0px) — .navbar.scrolled: background rgba(10,10,10,0.95), backdrop-filter blur(20px), border-bottom 1px solid var(--color-dark-600)

12. Hero section (.hero): min-height 100vh, display flex, align-items center, background var(--color-dark-900), position relative, overflow hidden — radial gold glow: .hero::before pseudo-element with radial-gradient(ellipse at 50% 100%, rgba(184,146,74,0.15) 0%, transparent 70%), position absolute, inset 0

13. Grain/noise texture overlay (.hero::after): position absolute, inset 0, background SVG noise pattern using: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"), opacity 0.4, pointer-events none

14. Toast container (.toast-container): position fixed, bottom 24px, right 24px, z-index 9999, display flex, flex-direction column, gap 12px — Individual .toast: padding 14px 20px, border-radius 10px, color white, font-size 0.9rem, min-width 280px, max-width 380px, box-shadow 0 4px 20px rgba(0,0,0,0.4), animation slideInRight 300ms ease forwards — .toast.success: background #1a3a2a, border-left 4px solid #4ade80 — .toast.error: background #3a1a1a, border-left 4px solid #f87171 — .toast.info: background #2a2010, border-left 4px solid var(--color-gold) — .toast.dismiss: animation slideOutRight 300ms ease forwards

15. Input/form styles: all inputs and textareas: background var(--color-dark-700), border 1px solid var(--color-dark-600), border-radius var(--radius-input), color white, padding 14px 16px, font-family Inter, width 100%, outline none — focus: border-color var(--color-gold), box-shadow 0 0 0 2px rgba(184,146,74,0.2)

16. Status badge styles: .badge: display inline-block, padding 4px 12px, border-radius 20px, font-size 0.75rem, font-weight 600 — .badge-pending: background rgba(184,146,74,0.2), color var(--color-gold) — .badge-progress: background rgba(59,130,246,0.2), color #60a5fa — .badge-resolved: background rgba(74,222,128,0.2), color #4ade80
```

### Step 7.2 — Animations CSS
```
Write proximity/frontend/css/animations.css:

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes goldGlowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(184,146,74,0.2); }
  50% { box-shadow: 0 0 60px rgba(184,146,74,0.5); }
}

@keyframes slideInRight {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(120%); opacity: 0; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes dashDraw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

Scroll animation utility classes — all elements start hidden and are revealed by JS adding .is-visible:

.animate-fade-up {
  opacity: 0;
  transform: translateY(40px);
  will-change: transform, opacity;
  transition: opacity var(--duration-slow) var(--ease-smooth), transform var(--duration-slow) var(--ease-smooth);
}
.animate-fade-up.is-visible { opacity: 1; transform: translateY(0); }

.animate-fade-left {
  opacity: 0; transform: translateX(-40px);
  will-change: transform, opacity;
  transition: opacity var(--duration-slow) var(--ease-smooth), transform var(--duration-slow) var(--ease-smooth);
}
.animate-fade-left.is-visible { opacity: 1; transform: translateX(0); }

.animate-fade-right {
  opacity: 0; transform: translateX(40px);
  will-change: transform, opacity;
  transition: opacity var(--duration-slow) var(--ease-smooth), transform var(--duration-slow) var(--ease-smooth);
}
.animate-fade-right.is-visible { opacity: 1; transform: translateX(0); }

.animate-scale-in {
  opacity: 0; transform: scale(0.85);
  will-change: transform, opacity;
  transition: opacity var(--duration-slow) var(--ease-bounce), transform var(--duration-slow) var(--ease-bounce);
}
.animate-scale-in.is-visible { opacity: 1; transform: scale(1); }

Animation delay helpers (for staggered reveals):
.delay-100 { transition-delay: 100ms; }
.delay-200 { transition-delay: 200ms; }
.delay-300 { transition-delay: 300ms; }
.delay-400 { transition-delay: 400ms; }
.delay-500 { transition-delay: 500ms; }

Floating hero shapes:
.hero-shape { position: absolute; border-radius: 50%; border: 1px solid rgba(184,146,74,0.25); animation: float 6s ease-in-out infinite; pointer-events: none; }
.hero-shape:nth-child(2) { animation-delay: -2s; animation-duration: 8s; }
.hero-shape:nth-child(3) { animation-delay: -4s; animation-duration: 10s; }
```

### Step 7.3 — Responsive CSS
```
Write proximity/frontend/css/responsive.css with mobile-first breakpoints:

/* === MOBILE BASE (up to 479px) === */
.navbar { padding: 16px 20px; }
.nav-links { display: none; }
.hamburger { display: flex; }
.nav-overlay { display: none; position: fixed; inset: 0; background: var(--color-dark-900); z-index: 999; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
.nav-overlay.open { display: flex; }
.hero { padding-top: 100px; min-height: 100svh; }
.stats-grid { grid-template-columns: repeat(2, 1fr); }
.cards-grid { grid-template-columns: 1fr; }
.pricing-grid { flex-direction: column; align-items: center; }
.pricing-card { width: 100%; max-width: 400px; }
.contact-split { flex-direction: column; }
.dashboard-layout { grid-template-columns: 1fr; }
.sidebar { position: fixed; left: -280px; top: 0; height: 100vh; z-index: 200; transition: left 300ms ease; }
.sidebar.open { left: 0; }
.sidebar-toggle { display: flex; }
.footer-grid { grid-template-columns: 1fr; gap: 32px; }
.blog-layout { flex-direction: column; }

/* === TABLET (480px+) === */
@media (min-width: 480px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}

/* === TABLET LARGE (768px+) === */
@media (min-width: 768px) {
  .navbar { padding: 20px 40px; }
  .nav-links { display: flex; gap: 32px; }
  .hamburger { display: none; }
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
  .contact-split { flex-direction: row; }
  .footer-grid { grid-template-columns: repeat(2, 1fr); }
  .blog-layout { flex-direction: row; }
}

/* === DESKTOP (1024px+) === */
@media (min-width: 1024px) {
  .cards-grid { grid-template-columns: repeat(3, 1fr); }
  .pricing-grid { flex-direction: row; align-items: stretch; }
  .pricing-card { width: auto; flex: 1; }
  .dashboard-layout { grid-template-columns: 240px 1fr; }
  .sidebar { position: sticky; left: auto; top: 0; height: 100vh; }
  .sidebar-toggle { display: none; }
  .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
}

/* === WIDE DESKTOP (1280px+) === */
@media (min-width: 1280px) {
  .container { padding: 0 40px; }
}

/* Touch target safety */
button, a, input, select, textarea { min-height: 44px; }

/* Hamburger icon styles */
.hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; background: none; border: none; }
.hamburger span { display: block; width: 24px; height: 2px; background: white; transition: all 300ms ease; }
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
```

---

## Phase 8 — JavaScript Core

### Step 8.1 — main.js
```
Write proximity/frontend/js/main.js:

This file handles all UI interactions, animations, and the toast system. It must be loaded before auth.js on every page.

1. DOMContentLoaded wrapper: wrap everything in document.addEventListener('DOMContentLoaded', () => { ... })

2. Navbar scroll behavior:
   const navbar = document.querySelector('.navbar');
   if (navbar) {
     window.addEventListener('scroll', () => {
       navbar.classList.toggle('scrolled', window.scrollY > 50);
     });
   }

3. Active nav link detection:
   const currentPage = window.location.pathname.split('/').pop() || 'index.html';
   document.querySelectorAll('.nav-link').forEach(link => {
     const href = link.getAttribute('href').split('/').pop();
     if (href === currentPage) link.classList.add('active');
   });

4. Hamburger menu toggle:
   const hamburger = document.querySelector('.hamburger');
   const navOverlay = document.querySelector('.nav-overlay');
   if (hamburger && navOverlay) {
     hamburger.addEventListener('click', () => {
       hamburger.classList.toggle('open');
       navOverlay.classList.toggle('open');
       document.body.style.overflow = navOverlay.classList.contains('open') ? 'hidden' : '';
     });
     navOverlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
       hamburger.classList.remove('open');
       navOverlay.classList.remove('open');
       document.body.style.overflow = '';
     }));
     document.addEventListener('keydown', e => {
       if (e.key === 'Escape') {
         hamburger.classList.remove('open');
         navOverlay.classList.remove('open');
         document.body.style.overflow = '';
       }
     });
   }

5. Intersection Observer for scroll animations:
   const animatedEls = document.querySelectorAll('.animate-fade-up, .animate-fade-left, .animate-fade-right, .animate-scale-in');
   if (animatedEls.length > 0) {
     const observer = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
         if (entry.isIntersecting) {
           entry.target.classList.add('is-visible');
           observer.unobserve(entry.target);
         }
       });
     }, { threshold: 0.15 });
     animatedEls.forEach(el => observer.observe(el));
   }

6. animateCounter(el, target, duration, prefix, suffix):
   - Uses requestAnimationFrame
   - Counts from 0 to target over duration ms using easeOutCubic easing
   - Formats output: prefix + Math.floor(count).toLocaleString() + suffix
   - Only runs once per element (use a data attribute to track)

7. Stats counter trigger via Intersection Observer:
   const statsSection = document.querySelector('.stats-bar');
   if (statsSection) {
     const statsObserver = new IntersectionObserver((entries) => {
       if (entries[0].isIntersecting) {
         document.querySelectorAll('[data-count]').forEach(el => {
           animateCounter(el, parseInt(el.dataset.count), 2000, el.dataset.prefix || '', el.dataset.suffix || '');
         });
         statsObserver.disconnect();
       }
     }, { threshold: 0.5 });
     statsObserver.observe(statsSection);
   }

8. Toast notification system (exported to window for use by auth.js and other files):
   window.showToast = function(message, type = 'info') {
     let container = document.querySelector('.toast-container');
     if (!container) {
       container = document.createElement('div');
       container.className = 'toast-container';
       document.body.appendChild(container);
     }
     const toast = document.createElement('div');
     toast.className = `toast ${type}`;
     toast.textContent = message;
     container.appendChild(toast);
     if (container.children.length > 4) container.removeChild(container.firstChild);
     setTimeout(() => {
       toast.classList.add('dismiss');
       toast.addEventListener('animationend', () => toast.remove());
     }, 4000);
   }

9. Smooth scroll for all #hash links:
   document.querySelectorAll('a[href^="#"]').forEach(a => {
     a.addEventListener('click', e => {
       const target = document.querySelector(a.getAttribute('href'));
       if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
     });
   });

10. Testimonials carousel (runs only on pages with .testimonials-carousel):
    Auto-advances every 5s. Shows one slide at a time. Dot indicators update. Touch/swipe support via touchstart/touchend events.

11. Pricing FAQ accordion:
    document.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-question').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

12. Call lucide.createIcons() at the end of DOMContentLoaded if lucide is available:
    if (typeof lucide !== 'undefined') lucide.createIcons();
```

### Step 8.2 — auth.js
```
Write proximity/frontend/js/auth.js:

IMPORTANT: main.js must be loaded before auth.js on every page for window.showToast to be available.

1. Determine the correct API base URL dynamically:
   const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
     ? 'http://localhost:5000/api'
     : '/api';

2. localStorage keys as constants:
   const TOKEN_KEY = 'proximity_token';
   const USER_KEY = 'proximity_user';

3. Safe localStorage helpers (wrapped in try/catch for private browsing compatibility):
   function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch(e) { return null; } }
   function setToken(token) { try { localStorage.setItem(TOKEN_KEY, token); } catch(e) {} }
   function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch(e) {} }
   function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
   function setUser(user) { try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch(e) {} }
   function clearUser() { try { localStorage.removeItem(USER_KEY); } catch(e) {} }

4. Auth state helpers:
   function isAuthenticated() { return !!getToken(); }
   function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }

5. Redirect helpers (path-aware — works from any subfolder depth):
   function getRoot() {
     const depth = window.location.pathname.split('/').filter(Boolean).length;
     return depth <= 1 ? '' : Array(depth - 1).fill('..').join('/');
   }
   function redirectIfNotAuth() {
     if (!isAuthenticated()) window.location.href = getRoot() + '/login.html';
   }
   function redirectIfNotAdmin() {
     if (!isAdmin()) window.location.href = getRoot() + '/client/dashboard.html';
   }

6. handleResponse async utility:
   async function handleResponse(res) {
     if (res.status === 401) { clearToken(); clearUser(); window.location.href = getRoot() + '/login.html'; return; }
     const data = await res.json();
     if (!res.ok) throw new Error(data.message || 'Request failed');
     return data;
   }

7. authFetch utility (adds Bearer token automatically):
   async function authFetch(url, options = {}) {
     return fetch(API_BASE + url, {
       ...options,
       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`, ...(options.headers || {}) }
     });
   }

8. Login form handler — runs only if #login-form exists on the page:
   const loginForm = document.getElementById('login-form');
   if (loginForm) {
     loginForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const email = loginForm.email.value.trim();
       const password = loginForm.password.value;
       if (!email || !password) { window.showToast('Please fill in all fields', 'error'); return; }
       const btn = loginForm.querySelector('button[type="submit"]');
       btn.disabled = true; btn.textContent = 'Signing in...';
       try {
         const res = await fetch(API_BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
         const data = await res.json();
         if (!res.ok) throw new Error(data.message);
         setToken(data.token);
         setUser(data.user);
         window.location.href = data.user.role === 'admin' ? getRoot() + '/admin/dashboard.html' : getRoot() + '/client/dashboard.html';
       } catch (err) {
         window.showToast(err.message || 'Login failed', 'error');
       } finally {
         btn.disabled = false; btn.textContent = 'Sign In';
       }
     });
   }

9. Register form handler — runs only if #register-form exists:
   Validate: name not empty, valid email, password min 6 chars, confirm password match.
   POST to /auth/register.
   On success: setToken, setUser, showToast('Account created successfully!', 'success'), redirect to client dashboard after 1.5s.
   On error: showToast with error message.

10. Password show/hide toggle for all .password-toggle buttons.

11. Password strength meter — on keyup of #password field if present. Check length + has uppercase + has number + has symbol. Update .strength-bar width and color class: weak (red 33%), medium (orange 66%), strong (green 100%).

12. Logout function (attached to window for HTML onclick usage):
    window.logout = function() {
      clearToken(); clearUser();
      window.location.href = getRoot() + '/login.html';
    }

13. Dynamic navbar update — run on every page:
    Update nav Login/Register links based on auth state. If authenticated: replace with user name + Logout button. If admin: also show "Admin Panel" link.

14. Expose helpers to window for use in dashboard.js and admin.js:
    window.authUtils = { isAuthenticated, isAdmin, getToken, getUser, redirectIfNotAuth, redirectIfNotAdmin, handleResponse, authFetch, API_BASE, getRoot };
```

---

## Phase 9 — Frontend Pages (Public)

### Step 9.1 — index.html (Home Page)
```
Write proximity/frontend/index.html — the complete home page.

<head> requirements:
- charset UTF-8, viewport meta, X-UA-Compatible
- <link rel="preconnect" href="https://fonts.googleapis.com"> and <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
- <link rel="preload" href="css/style.css" as="style">
- <link rel="stylesheet" href="css/style.css"> + animations.css + responsive.css
- <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
- <title>Repair Your Credit Score Fast | Proximity Credit Repair</title>
- <meta name="description" content="Proximity helps you dispute inaccurate items, rebuild your credit score, and take control of your financial future. Trusted by 10,000+ clients.">
- Open Graph: og:title, og:description, og:type="website", og:url, og:image (placeholder path)
- <link rel="canonical" href="https://proximity.com/">
- <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>P</text></svg>">

Navbar (.navbar):
- Logo: <a href="index.html" class="logo">PROXIMITY<span class="logo-dot"></span></a> — style .logo-dot as a small 6px gold circle
- Center nav: <nav class="nav-links"> — links: Home (index.html), About (about.html), Services (services.html), Pricing (pricing.html), Blog (blog.html), Contact (contact.html) — each with class="nav-link"
- Right side: Login link + <a href="register.html" class="btn-primary">Get Started</a>
- Hamburger button (3 span lines) — hidden on desktop
- .nav-overlay div for mobile fullscreen menu (same links repeated)

Hero section (.hero):
- .hero-shape div ×3 with different sizes (200px, 300px, 150px) at different absolute positions
- Content in .hero-content (z-index above shapes):
  - <p class="hero-eyebrow animate-fade-up">Trusted by 10,000+ Americans</p>
  - <h1 class="animate-fade-up delay-100">Repair Your Credit.<br>Rebuild Your Future.</h1>
  - <p class="hero-subtitle animate-fade-up delay-200">We dispute inaccurate items, monitor your progress, and help you rebuild the financial life you deserve.</p>
  - Two CTAs: <a href="register.html" class="btn-primary animate-fade-up delay-300">Get Started</a> and <a href="#how-it-works" class="btn-secondary animate-fade-up delay-400">Learn More</a>

Stats bar (.stats-bar) — data attributes power the JS counter:
- 4 stat items: data-count="10000" data-suffix="+" label "Clients Helped" | data-count="98" data-suffix="%" label "Satisfaction Rate" | data-count="2" data-prefix="$" data-suffix="M+ Removed" label "Debt Removed" | data-count="500" data-suffix="+" label "5-Star Reviews"

How It Works section (#how-it-works):
- Section heading with .animate-fade-up
- .how-it-works-grid: 3 steps. Each step: numbered circle (1,2,3) in gold, Lucide icon, title, description
- Steps: 1. "Dispute" — We file targeted disputes with all 3 bureaus. 2. "Monitor" — Track your credit score in real time. 3. "Rebuild" — Build healthy credit habits with expert guidance.
- Desktop: flex row with gold dashed connector line between steps. Mobile: stacks vertically.

Services preview section:
- Section heading + subheading
- .cards-grid with 3 .glass-card items: Credit Dispute Filing, Credit Monitoring, Score Optimization — each with .icon-gold Lucide icon, title, 2-sentence excerpt, "Learn More →" ghost button

Testimonials section:
- .testimonials-carousel wrapper
- 4 slides: each has oversized gold " quote mark, quote text, star rating (5 ★), name, title
- Navigation: prev/next arrows + dot indicators

CTA Banner:
- Full-width section with gold background, diagonal stripe CSS pattern overlay
- Dark text: "Ready to Start Your Credit Journey?", subtitle, dark CTA button

Footer (.footer):
- .footer-grid: 4 columns — Brand (logo + tagline + social icons), Quick Links, Services, Contact
- Social icons: Twitter, LinkedIn, Facebook, Instagram (Lucide icons or SVG)
- .footer-bottom: copyright text + "Privacy Policy | Terms of Service" links

<body> end:
- <script src="js/main.js" defer></script>
- <script src="js/auth.js" defer></script>
- <script>lucide.createIcons();</script>
```

### Step 9.2 — about.html
```
Write proximity/frontend/about.html — the About page.

Use the same navbar, footer, CSS links, JS links, and Lucide script as index.html. All CSS paths: css/style.css, etc.

<title>About Proximity | Expert Credit Repair Company</title>
<meta name="description" content="Learn about Proximity's mission to help Americans repair their credit through transparent, results-driven dispute filing and financial coaching.">

Sections:
1. Hero: "We Fight So You Don't Have To" — same dark hero with gold glow and 2 floating shapes. Add subtitle about the mission. animate-fade-up on heading and subtitle.

2. Mission section (.mission-split): CSS grid, 2 columns on desktop —
   Left: text — short paragraphs about why Proximity was founded, who they serve
   Right: inline SVG geometric art — concentric gold circles, diagonal gold lines, a rotating outer ring — all in SVG using stroke="#B8924A", fill="none"

3. Founding Values: 4 .glass-card in .cards-grid:
   - Integrity: icon "shield" — "We only make promises we can keep."
   - Transparency: icon "eye" — "You see every action we take on your behalf."
   - Results: icon "trending-up" — "We measure success by your credit score improvements."
   - Empowerment: icon "zap" — "We teach you how to maintain great credit for life."

4. Team section: 4 cards — .team-card: circular placeholder (80px, border 3px solid gold), name in Poppins bold, role in gold, 2-sentence bio
   Names/Roles: "Marcus Johnson / Founder & CEO", "Diana Reeves / Head of Disputes", "Carlos Mendez / Client Success", "Priya Patel / Financial Coach"

5. Why Proximity: 4-column stat grid — each: gold icon (large), bold big number, label
   - shield "500+" "Disputes Filed Monthly"
   - users "98%" "Client Satisfaction"
   - award "15+" "Years Combined Experience"
   - check-circle "3" "Bureaus Covered"

6. Add .animate-fade-up and .animate-fade-left/.animate-fade-right to all major section elements.
```

### Step 9.3 — services.html
```
Write proximity/frontend/services.html — the Services page.

Use same navbar, footer, CSS/JS links as index.html.

<title>Credit Repair Services | Dispute Filing & Score Optimization | Proximity</title>
<meta name="description" content="Proximity offers full-spectrum credit repair including dispute filing, debt validation, credit monitoring, score optimization, and financial coaching.">

Sections:
1. Hero: "Services Built for Results" — dark hero with gold glow, animated heading, subtitle "Comprehensive credit solutions tailored to your unique situation."

2. Services grid (.cards-grid — 3 columns desktop):
   6 .glass-card items, each with:
   - .icon-gold.icon-lg Lucide icon
   - Bold title
   - 3-sentence description
   - "Learn More" .btn-ghost button
   - .animate-fade-up with staggered delay classes (delay-100 through delay-500)

   Cards:
   1. Credit Dispute Filing | icon: file-text | "We file targeted dispute letters with Equifax, Experian, and TransUnion on your behalf. Our team knows exactly which items can be challenged and how. Most clients see results within 30–45 days."
   2. Credit Monitoring | icon: activity | "Get real-time alerts whenever your credit report changes. We track all 3 bureaus daily so you never miss a score movement. Stay informed and in control at all times."
   3. Debt Validation | icon: shield | "Not all debts on your report are legally valid. We send official debt validation letters to collectors requiring proof of the debt. Invalid debts must be removed by law."
   4. Score Optimization | icon: trending-up | "Beyond disputes, we build a strategic roadmap to maximize your credit score. We advise on credit utilization, account mix, and payment history. Every point counts toward your financial future."
   5. Identity Theft Protection | icon: lock | "If fraudulent accounts appear on your report, we move fast. We dispute unauthorized accounts and help you place fraud alerts and security freezes. Your identity is our priority."
   6. Financial Coaching | icon: book-open | "Our certified coaches teach you the habits that sustain excellent credit. From budgeting to strategic card usage, we give you the tools. Knowledge is the most powerful credit repair tool there is."

3. Process section: "How It Works" — numbered list 1–5:
   1. Sign up and connect your credit report
   2. We analyze all 3 bureaus and identify disputable items
   3. We draft and send certified dispute letters
   4. Bureaus have 30 days to investigate and respond
   5. Resolved items are removed — we track and repeat as needed

4. Bottom CTA: "Ready to dispute your first item?" — paragraph + .btn-primary linking to register.html

5. All sections use appropriate .animate-fade-up and delay classes.
```

### Step 9.4 — pricing.html
```
Write proximity/frontend/pricing.html — the Pricing page.

Use same navbar, footer, CSS/JS links as index.html.

<title>Credit Repair Pricing Plans | Proximity</title>
<meta name="description" content="Affordable credit repair pricing with no hidden fees. Choose from Basic, Standard, or Premium plans. 30-day money-back guarantee on all plans.">

Sections:
1. Hero: "Simple, Transparent Pricing" with subtitle "No hidden fees. No long-term contracts. Cancel anytime."

2. Pricing cards (.pricing-grid — flex row desktop):
   Basic ($79/mo):
   - .pricing-card class, gray subtle border
   - Features (gold checkmarks): Access to all 3 bureaus, Up to 5 disputes/month, Client portal access, Email support
   - Features (gray X): Credit monitoring, Priority support, Score tracking, Dedicated advisor
   - .btn-secondary CTA

   Standard ($149/mo) — FEATURED:
   - .pricing-card.featured: gold border 2px, box-shadow: var(--shadow-gold), slightly taller via padding
   - "Most Popular" badge: absolute top-right, gold background, dark text, small pill
   - Features (all gold checkmarks): Everything in Basic, Unlimited disputes, Priority support, Credit monitoring, Score tracking
   - Features (gray X): Dedicated advisor, Monthly advisor calls, Legal letter templates
   - .btn-primary CTA

   Premium ($299/mo):
   - .pricing-card class
   - All features with gold checkmarks (no X marks)
   - "White-glove concierge" note in gold text
   - .btn-secondary CTA

   Checkmark/X icons: use Lucide icons — <i data-lucide="check" class="icon-gold"></i> and <i data-lucide="x" style="stroke:#555"></i>

3. Money-back guarantee strip: dark section with shield Lucide icon, "30-Day Money-Back Guarantee" in large text, "No Questions Asked." subtitle

4. FAQ accordion (.faq-list):
   6 .faq-item elements — each has a .faq-question div (header with chevron-down icon) and a .faq-answer div (content):
   Q1: "How does the dispute process work?" — explain the 3-step process
   Q2: "How long until I see results?" — 30–90 days typical
   Q3: "Which bureaus do you cover?" — all 3 (Equifax, Experian, TransUnion)
   Q4: "Is my information secure?" — bank-level encryption
   Q5: "Can I cancel anytime?" — yes, no contracts
   Q6: "What if my disputes are rejected?" — explain re-dispute strategy

   CSS for accordion: .faq-answer max-height 0, overflow hidden, transition max-height 400ms ease — .faq-item.open .faq-answer max-height 400px — .faq-item.open .faq-question i transform rotate(180deg)

5. All sections use .animate-fade-up with staggered delays.
```

### Step 9.5 — blog.html
```
Write proximity/frontend/blog.html — the Blog listing page.

Use same navbar, footer, CSS/JS links as index.html.

<title>Credit Repair Tips & Guides | Proximity Blog</title>
<meta name="description" content="Free credit repair guides, dispute tips, and financial advice from the Proximity expert team.">

Sections:
1. Hero: "Credit Repair Insights" with embedded search bar (UI only, no functionality)

2. Main layout (.blog-layout — flex row):
   Left (flex: 1 / ~70%): .blog-grid (CSS grid, 3 columns on desktop, 1 on mobile)
   6 .blog-card items:
   Each card:
   - .blog-card-image: 200px height div with linear-gradient background (dark to gold tones), relative positioned
   - .blog-card-category: gold pill span (positioned over image)
   - .blog-card-body: padding 20px
   - title (h3), excerpt (2 lines, line-clamp), date in muted color
   - "Read More →" link

   6 article entries:
   1. "How to Remove Collections from Your Credit Report" | Dispute Guides | Jan 15, 2025
   2. "Understanding Credit Utilization: The 30% Rule Explained" | Credit Tips | Jan 22, 2025
   3. "What Happens When You Dispute a Credit Item?" | Dispute Guides | Feb 3, 2025
   4. "5 Habits That Will Boost Your Credit Score in 90 Days" | Credit Tips | Feb 14, 2025
   5. "Identity Theft: What to Do If You're a Victim" | Financial News | Feb 28, 2025
   6. "From 520 to 720: A Proximity Client Success Story" | Success Stories | Mar 10, 2025

   Right sidebar (~30%):
   - Search bar (input + gold search button)
   - Categories list: Credit Tips (12), Dispute Guides (8), Financial News (5), Success Stories (4)
   - Recent posts: top 3 from article list, with small gradient placeholder
   - Newsletter subscribe: email input + "Subscribe" .btn-primary

3. .animate-fade-up on all blog cards with staggered delays.
```

### Step 9.6 — blog-single.html
```
Write proximity/frontend/blog-single.html — the single article page.

Use same navbar, footer, CSS/JS links as index.html.

<title>How to Remove Collections from Your Credit Report | Proximity Blog</title>
<meta name="description" content="Step-by-step guide on legally removing collection accounts from your Equifax, Experian, and TransUnion credit reports.">
<meta name="robots" content="index, follow">

Sections:
1. Full-width article hero: dark background with gold radial glow, article title as large H1, author name + date + category tag as overlay text — positioned over a gradient placeholder image div (300px height)

2. Article body: centered, max-width 720px, margin auto, padding 0 24px:
   - 5+ paragraph article about removing collections (real helpful content, not Lorem ipsum)
   - One styled blockquote: left border 4px solid var(--color-gold), padding-left 24px, font-style italic, larger text
   - Subheadings (h2/h3) within article styled with Poppins, gold bottom border

3. Author card: flex layout — circular avatar placeholder (64px, gold ring border), name "Diana Reeves", role "Head of Disputes at Proximity", 2-sentence bio

4. Tags row: 3 gold-outlined pill spans — "Credit Repair", "Collections", "Dispute Letters"

5. Share section: "Share this article" label + 3 icon buttons (Twitter/X, LinkedIn, Facebook) — SVG icons, hover stroke gold

6. Related articles: "Related Articles" heading + 3-column .cards-grid of smaller blog cards (same format as blog.html)

7. Comment form (.comment-form): "Leave a Comment" heading, fields: Name (input), Email (input), Comment (textarea 6 rows), .btn-primary "Post Comment" button — note: non-functional UI only, no API call needed
```

### Step 9.7 — contact.html
```
Write proximity/frontend/contact.html — the Contact page.

Use same navbar, footer, CSS/JS links as index.html.

<title>Contact Proximity | Credit Repair Experts</title>
<meta name="description" content="Get in touch with Proximity's credit repair team. We're available Monday–Friday, 9am–6pm EST. Free consultation available.">

Sections:
1. Hero: "Let's Talk. We're Here to Help." with subtitle "Our team typically responds within 24 hours."

2. Contact layout (.contact-split — flex row):
   Left (60%): Contact form
   - Fields: Name, Email, Phone, Subject (input), Message (textarea 5 rows)
   - All inputs use style from style.css (gold focus ring)
   - .btn-primary "Send Message" (full width)
   - Client-side validation: all fields required except Phone
   - On submit: POST to window.authUtils.API_BASE + '/contact' — do NOT require auth token
   - On success: window.showToast('Message sent! We\'ll respond within 24 hours.', 'success') — reset form
   - On error: window.showToast(errorMessage, 'error')
   - Disable submit button during request, restore after

   Right (40%): Info panel (.contact-info)
   - "Our Office" heading
   - Address block: <i data-lucide="map-pin" class="icon-gold"></i> "123 Financial District, New York, NY 10004"
   - Phone: <i data-lucide="phone" class="icon-gold"></i> "(800) 555-PROX"
   - Email: <i data-lucide="mail" class="icon-gold"></i> "hello@proximity.com"
   - Hours: Mon–Fri 9am–6pm EST
   - Social icons row

3. Map placeholder: .map-placeholder div (300px height, border-radius 16px, background var(--color-dark-700), overflow hidden):
   - CSS-drawn grid lines: use repeating-linear-gradient to create a dark map grid
   - Centered gold map pin icon (Lucide map-pin, 48px)
   - "New York, NY" text below pin

4. All sections use .animate-fade-up.
```

### Step 9.8 — login.html and register.html
```
Write proximity/frontend/login.html AND proximity/frontend/register.html.

Both pages share this base structure:
- Full-page layout, body background: var(--color-dark-900)
- Centered radial gold glow via body::before pseudo (radial-gradient from center)
- Centered card: .auth-card — max-width 460px, margin auto, padding 48px, glass-card style, position relative, z-index 1
- CSS/JS links same as other pages
- <meta name="robots" content="noindex">
- Scripts: main.js then auth.js (both deferred)

login.html specific:
- <title>Login | Proximity</title>
- .auth-card content:
  - Logo: "PROXIMITY" in Poppins 700 gold, centered, mb-32
  - h2: "Welcome Back"
  - p: "Sign in to your account"
  - <form id="login-form">
  - .float-label-group for Email: input[type=email][id=email][name=email] with <label>Email Address</label>
  - .float-label-group for Password: input[type=password][id=password][name=password] with <label>Password</label> AND a .password-toggle button with <i data-lucide="eye"></i>
  - .btn-primary "Sign In" (full width, type=submit)
  - "Forgot password?" link (href="#", non-functional)
  - "Don't have an account? Register" link to register.html

  Float label CSS: .float-label-group { position: relative; margin-bottom: 20px; }
  .float-label-group input { padding-top: 24px; padding-bottom: 8px; }
  .float-label-group label { position: absolute; top: 14px; left: 16px; font-size: 0.875rem; color: var(--color-text-muted); transition: all 200ms ease; pointer-events: none; }
  .float-label-group input:focus ~ label, .float-label-group input:not(:placeholder-shown) ~ label { top: 6px; font-size: 0.7rem; color: var(--color-gold); }
  (use a space character as placeholder to trigger :not(:placeholder-shown))

register.html specific:
- <title>Register | Proximity</title>
- .auth-card content:
  - Logo same as login
  - h2: "Create Your Account"
  - <form id="register-form">
  - Float-label inputs: Full Name, Email Address, Password, Confirm Password
  - Password toggle buttons on both password fields
  - .strength-bar div (below password field): .strength-fill div (width 0%, transitions to 33% red / 66% orange / 100% green based on password strength)
  - .btn-primary "Create Account" (full width, type=submit)
  - "Already have an account? Sign in" link to login.html
```

---

## Phase 10 — Client & Admin Dashboards

### Step 10.1 — dashboard.js
```
Write proximity/frontend/js/dashboard.js:

This file runs only on client/dashboard.html. It assumes authUtils is available from auth.js.

On DOMContentLoaded:
1. Call window.authUtils.redirectIfNotAuth()
2. Load user data: const user = window.authUtils.getUser()
3. Populate greeting: document.querySelector('.user-greeting').textContent = `Welcome back, ${user.name}`
4. Populate avatar initials: take first letter of first name + first letter of last name, uppercase
5. Highlight active sidebar nav item based on current active tab

Tab system:
- All .sidebar-nav-item clicks: remove .active from all, add .active to clicked item
- Hide all .tab-panel divs, show the one matching data-tab attribute
- Store active tab in sessionStorage so it persists on page refresh

fetchDisputes() async function:
- const res = await window.authUtils.authFetch('/disputes')
- const data = await window.authUtils.handleResponse(res)
- return data.disputes

renderDisputeTable(disputes):
- If disputes.length === 0: show empty state HTML — "No disputes yet. Submit your first dispute!" with .btn-primary linking to submit tab
- Build table rows: each row = bureau, accountName, status badge (.badge + .badge-pending/.badge-progress/.badge-resolved), createdAt (format as 'MMM DD, YYYY')
- Inject into #disputes-table-body

renderOverviewStats(disputes):
- open = disputes.filter(d => d.status !== 'Resolved').length
- resolved = disputes.filter(d => d.status === 'Resolved').length
- daysActive: Math.floor((Date.now() - new Date(user.createdAt)) / 86400000)
- Update #stat-open, #stat-resolved, #stat-days text content

renderDisputeChart(disputes) — uses Chart.js:
- Group disputes by month for last 6 months
- Create Chart with:
  const ctx = document.getElementById('dispute-chart').getContext('2d');
  new Chart(ctx, { type: 'line', data: { labels: [...6 month labels], datasets: [{ label: 'Disputes Filed', data: [...counts], borderColor: '#B8924A', backgroundColor: 'rgba(184,146,74,0.1)', pointBackgroundColor: '#B8924A', tension: 0.4, fill: true }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9A9A9A' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9A9A9A', stepSize: 1 } } } } })

submitDisputeForm handler (on #dispute-form submit):
- Validate: bureau selected, accountName not empty, reason at least 10 chars — show inline error messages
- Disable submit button, show loading text
- const res = await window.authUtils.authFetch('/disputes', { method: 'POST', body: JSON.stringify({ bureau, accountName, accountNumber, reason }) })
- On success: window.showToast('Dispute submitted successfully!', 'success'), reset form, re-fetch disputes, re-render table, switch to "My Disputes" tab
- On error: window.showToast(err.message, 'error'), re-enable submit

Profile tab:
- Populate name and phone fields from getUser() on tab open
- On #profile-form submit: PUT to /auth/me via authFetch with { name, phone }
- On success: update stored user with setUser(newUser), showToast('Profile updated', 'success')

Initial load order:
1. redirectIfNotAuth()
2. Populate user UI
3. fetchDisputes().then(disputes => { renderOverviewStats(disputes); renderDisputeTable(disputes); renderDisputeChart(disputes); })
```

### Step 10.2 — client/dashboard.html
```
Write proximity/frontend/client/dashboard.html — the protected client portal.

<head>:
- All CSS: ../css/style.css, ../css/animations.css, ../css/responsive.css
- <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
- <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
- <title>My Dashboard | Proximity</title>
- <meta name="robots" content="noindex">

Layout: .dashboard-layout (CSS grid: 240px sidebar + 1fr main)

Sidebar (.sidebar, dark #111111):
- Logo: "PROXIMITY" gold text
- .sidebar-nav: 4 .sidebar-nav-item buttons with data-tab attributes:
  - <i data-lucide="grid"></i> Overview (data-tab="overview", active by default)
  - <i data-lucide="list"></i> My Disputes (data-tab="disputes")
  - <i data-lucide="plus-circle"></i> Submit Dispute (data-tab="submit")
  - <i data-lucide="user"></i> Profile (data-tab="profile")
- Logout button at bottom: <button onclick="window.logout()" class="logout-btn"><i data-lucide="log-out"></i> Logout</button>
- Mobile: sidebar-toggle button visible, sidebar slides in from left

Main content (.main-content):
Top bar (.top-bar): .user-greeting (populated by JS), .avatar-badge (initials, gold bg, dark text)

Tab panels (.tab-panel, all hidden except active):

#tab-overview:
- 3 .stat-card: Open Disputes (#stat-open), Resolved (#stat-resolved), Days Active (#stat-days) — each with gold Lucide icon, large bold number, label
- .chart-card: heading "Dispute Activity", <canvas id="dispute-chart" height="250">
- Credit progress bar: heading "Estimated Credit Improvement", .progress-bar-bg > .progress-bar-fill (gold, width starts at 0, animate to 35% via CSS transition + JS set after load), label "Track your progress as disputes resolve"

#tab-disputes:
- Heading "My Disputes"
- <table class="disputes-table">: thead (Bureau, Account Name, Status, Date Filed), <tbody id="disputes-table-body"> (populated by JS)

#tab-submit:
- Heading "Submit a Dispute"
- <form id="dispute-form">:
  - Select #bureau: placeholder option + 3 bureau options
  - Input #accountName (required)
  - Input #accountNumber (optional, placeholder "Optional")
  - Textarea #reason (rows 4, required, minlength 10)
  - .btn-primary "Submit Dispute" (full width, type=submit)

#tab-profile:
- Heading "My Profile"
- <form id="profile-form">:
  - Input #profile-name, pre-filled by JS
  - Input #profile-email, type=email, readonly (disabled styling)
  - Input #profile-phone
  - .btn-primary "Save Changes"

Scripts at end of </body>:
<script src="../js/main.js" defer></script>
<script src="../js/auth.js" defer></script>
<script src="../js/dashboard.js" defer></script>
<script>document.addEventListener('DOMContentLoaded', () => { if(typeof lucide !== 'undefined') lucide.createIcons(); });</script>
```

### Step 10.3 — admin.js
```
Write proximity/frontend/js/admin.js:

On DOMContentLoaded:
1. Call window.authUtils.redirectIfNotAuth()
2. Call window.authUtils.redirectIfNotAdmin()

Tab system: same pattern as dashboard.js

fetchAllUsers():
- GET /users via authFetch
- Render into #users-table-body: Name, Email, role badge (.badge with color by role), Date Joined, <button onclick="deleteUser('ID')">Delete</button>
- Add search functionality: on #user-search keyup, filter rows where name or email includes search value (case-insensitive, DOM-based, no API call)

deleteUser(userId):
- if (!confirm('Delete this user and all their disputes?')) return
- DELETE /users/:id via authFetch
- On success: window.showToast('User deleted', 'success'), re-fetch and re-render users and disputes
- On error: window.showToast(err.message, 'error')

fetchAllDisputes():
- GET /disputes/all via authFetch
- Render into #disputes-table-body:
  Each row: user name + email (small muted), bureau, accountName,
  Status: <select class="status-select" data-id="ID"> with Pending/In Progress/Resolved options — selected option matches current status
  Notes: <input type="text" class="notes-input" data-id="ID" value="current notes" placeholder="Add notes...">
  Save: <button onclick="updateDispute('ID', this)">Save</button>

updateDispute(disputeId, btn):
- Get status from .status-select[data-id=disputeId], notes from .notes-input[data-id=disputeId]
- PUT /disputes/:id via authFetch with { status, notes }
- On success: window.showToast('Dispute updated', 'success'), update the row's status badge in place
- On error: window.showToast(err.message, 'error')

fetchAllMessages():
- GET /contact via authFetch
- Render as .message-card items:
  Unread: gold left border (4px solid var(--color-gold)), slightly lighter background
  Each card: sender name (bold), email (muted), message preview (truncated 100 chars), date, "Mark as Read" button (hidden if already read)

markMessageRead(messageId, btn):
- PUT /contact/:id/read via authFetch
- On success: remove gold border from card, hide button, update unread count in KPI card
- On error: window.showToast(err.message, 'error')

renderAdminChart(disputes):
- Count by bureau: equifaxCount, experianCount, transunionCount
- new Chart(document.getElementById('admin-chart').getContext('2d'), { type: 'bar', data: { labels: ['Equifax', 'Experian', 'TransUnion'], datasets: [{ label: 'Disputes', data: [counts], backgroundColor: ['rgba(184,146,74,0.8)', 'rgba(184,146,74,0.6)', 'rgba(184,146,74,0.4)'], borderColor: '#B8924A', borderWidth: 2 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#9A9A9A', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#9A9A9A' }, grid: { display: false } } } } })

renderKPICards(users, disputes, messages):
- #kpi-users: users.length
- #kpi-total-disputes: disputes.length
- #kpi-open: disputes.filter(d => d.status !== 'Resolved').length
- #kpi-unread: messages.filter(m => !m.read).length

Initial load:
Promise.all([fetchAllUsers(), fetchAllDisputes(), fetchAllMessages()]).then(([users, disputes, messages]) => {
  renderKPICards(users, disputes, messages);
  renderAdminChart(disputes);
});
```

### Step 10.4 — admin/dashboard.html
```
Write proximity/frontend/admin/dashboard.html — the protected admin panel.

<head>: same structure as client/dashboard.html (paths use ../css/)
- <title>Admin Panel | Proximity</title>
- <meta name="robots" content="noindex">
- Chart.js CDN: <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

Same .dashboard-layout grid as client dashboard.

Sidebar:
- 4 nav items:
  - <i data-lucide="bar-chart-2"></i> Overview (data-tab="overview")
  - <i data-lucide="users"></i> Users (data-tab="users")
  - <i data-lucide="file-text"></i> Disputes (data-tab="disputes")
  - <i data-lucide="mail"></i> Messages (data-tab="messages")
- Logout button at bottom

Tab panels:

#tab-overview:
- 4 .kpi-card: Total Users (#kpi-users), Total Disputes (#kpi-total-disputes), Open Disputes (#kpi-open), Unread Messages (#kpi-unread) — each with Lucide icon, large number, label
- .chart-card: "Disputes by Bureau", <canvas id="admin-chart" height="200">

#tab-users:
- Heading "All Users"
- Search input (#user-search, placeholder "Search by name or email...")
- <table class="admin-table">: thead (Name, Email, Role, Joined, Action), <tbody id="users-table-body">

#tab-disputes:
- Heading "All Disputes"
- <table class="admin-table">: thead (Client, Bureau, Account, Status, Notes, Action), <tbody id="disputes-table-body">

#tab-messages:
- Heading "Contact Messages"
- <div id="messages-list"> (rendered as cards by admin.js)

Scripts at end of </body>:
<script src="../js/main.js" defer></script>
<script src="../js/auth.js" defer></script>
<script src="../js/admin.js" defer></script>
<script>document.addEventListener('DOMContentLoaded', () => { if(typeof lucide !== 'undefined') lucide.createIcons(); });</script>
```

---

## Phase 11 — Create Admin User & Start Server

### Step 11.1 — Run Admin Seed & Start Server
```
Now that all files are written:

1. Make sure proximity/backend/config.env has your real MongoDB Atlas MONGO_URI and JWT_SECRET filled in.

2. Run the admin seed script ONCE to create the admin user:
   cd proximity/backend && node seedAdmin.js

   Verify the output says "Admin user created: admin@proximity.com / Admin@123"
   If it says "Admin already exists", that's fine — proceed.

3. Start the backend server:
   cd proximity/backend && node server.js

   Verify the console shows:
   - "MongoDB Connected"
   - "Proximity API running on port 5000"

   If there are any errors, fix them before proceeding. Common issues:
   - MONGO_URI invalid: check your Atlas connection string and IP whitelist
   - Port in use: change PORT in config.env to 5001
   - Module not found: run npm install again in the backend folder

4. Open a browser and visit: http://localhost:5000/api/health
   Expected response: { "success": true, "status": "ok", "timestamp": ... }
   If this works, the backend is fully operational.
```

---

## Phase 12 — Testing & Debugging

### Step 12.1 — Backend API Testing
```
With the server running, test every API endpoint. Use the browser console, a REST client, or curl:

AUTH TESTS:
1. POST /api/auth/register — body: { name: "Test User", email: "test@test.com", password: "Test123!" }
   Expected: 201 { success: true, token: "...", user: { role: "client", ... } }

2. POST /api/auth/login — body: { email: "test@test.com", password: "Test123!" }
   Expected: 200 { success: true, token, user }

3. GET /api/auth/me — header: Authorization: Bearer [token from step 2]
   Expected: 200 { success: true, user }

4. POST /api/auth/login — body: { email: "admin@proximity.com", password: "Admin@123" }
   Expected: 200 with user.role === "admin"

DISPUTE TESTS (use client token):
5. POST /api/disputes — body: { bureau: "Equifax", accountName: "Chase Bank", reason: "This account does not belong to me and was never opened." }
   Expected: 201 { success: true, dispute }

6. GET /api/disputes — Expected: 200 with array of disputes for that user only

ADMIN TESTS (use admin token):
7. GET /api/disputes/all — Expected: 200 with all disputes across all users

8. PUT /api/disputes/[id from step 5] — body: { status: "In Progress", notes: "Dispute letter sent." }
   Expected: 200 with updated dispute

9. GET /api/users — Expected: 200 with all users array

CONTACT TESTS:
10. POST /api/contact — body: { name: "Jane", email: "jane@test.com", message: "I need help with my credit report." }
    Expected: 201 { success: true, message: "Message sent successfully" }

11. GET /api/contact (admin token) — Expected: 200 with messages array

12. PUT /api/contact/[message id]/read (admin token) — Expected: 200 with read: true

Fix any failing endpoints before moving to frontend testing.
```

### Step 12.2 — Frontend Auth Flow Testing
```
Open the frontend (serve via the Express server at http://localhost:5000 or directly in browser):

1. Navigate to /register.html
   - Submit empty form → verify each field shows a validation error
   - Submit mismatched passwords → verify "Passwords do not match" error
   - Submit valid form → verify success toast + redirect to /login.html

2. On /login.html:
   - Submit wrong password → verify error toast "Invalid credentials"
   - Submit correct credentials → verify redirect to correct dashboard based on role
   - Submit as admin → verify redirect to /admin/dashboard.html

3. Client dashboard (/client/dashboard.html):
   - Verify greeting shows correct user name
   - Verify avatar initials are correct
   - Verify all 3 stat cards load (Open, Resolved, Days Active)
   - Verify Chart.js line chart renders (no console errors)
   - Verify disputes table loads (or empty state if no disputes)
   - Submit a dispute → verify it appears in the disputes table after submission
   - Switch to Profile tab → verify name and phone fields are pre-populated
   - Update profile → verify success toast

4. Admin dashboard (/admin/dashboard.html):
   - Verify 4 KPI cards load with correct numbers
   - Verify bar chart renders
   - Verify users table loads with search working
   - Update a dispute status → verify success toast
   - Mark a message as read → verify gold border disappears

5. Auth protection:
   - Open /client/dashboard.html while logged out → must redirect to /login.html
   - Open /admin/dashboard.html as client user → must redirect to /client/dashboard.html
   - Click logout → verify token cleared and redirect to /login.html

Fix all issues found before proceeding.
```

### Step 12.3 — UI & Responsive Testing
```
Test every page at 3 breakpoints. Use browser DevTools responsive mode:

375px MOBILE:
- Every page: no horizontal scroll, no content overflow
- Navbar: hamburger visible, links hidden — click hamburger → full overlay opens
- Hero: text readable, not clipped
- Cards: stacked in single column
- Pricing: cards stacked vertically
- Dashboards: sidebar hidden, toggle button visible — click toggle → sidebar slides in
- Contact: form above, info below
- All buttons and inputs: at least 44px tall

768px TABLET:
- Nav links visible, hamburger hidden
- Cards: 2-column grid
- Footer: 2-column

1280px DESKTOP:
- Full layout — 3-column cards, 4-column stats, 4-column footer
- Dashboard sidebar always visible, no toggle

Visual checks (on each page):
- Hero: dark background + gold radial glow visible
- Hero text: staggered animation plays on load
- Scroll: .animate-fade-up elements reveal on scroll
- Stats bar: counters animate up when scrolled into view
- Navbar: transitions to dark/blurred on scroll
- Testimonials: auto-advance every 5s
- FAQ accordion: smooth open/close
- Toast: trigger a form submission to verify toast appears bottom-right and dismisses after 4s

Fix all visual/interaction issues found.
```

### Step 12.4 — Bug Fix Pass
```
Perform a systematic bug fix pass across the entire project:

1. Open browser DevTools console on EVERY page — fix any JavaScript errors or warnings

2. Check all internal links:
   - Every nav link works correctly
   - All CTA buttons link to correct pages
   - "Learn More" buttons on service cards link appropriately
   - Blog "Read More" links go to blog-single.html
   - Pricing "Get Started" buttons link to register.html

3. API call verification:
   - Open Network tab in DevTools while using dashboards
   - Confirm all fetch calls use correct Authorization header
   - Confirm no 404 errors on API routes
   - Confirm CORS errors are not occurring (if using file:// protocol, switch to serving via Express)

4. Edge cases to verify:
   - What happens if MongoDB is disconnected? Server should not crash — verify error handling
   - What if JWT is expired? Frontend should redirect to login without crashing
   - What if dispute table is empty? Empty state message shows, no blank screen
   - What if user has a very long name? UI should not break

5. localStorage private browsing: open in private/incognito mode — verify app does not throw errors (try/catch wrappers should prevent this)

6. Fix any broken CSS: double-check hover states on all buttons and cards, confirm gold glow appears on hover, confirm no elements overlap the fixed navbar (add padding-top: 80px to main content areas)
```

---

## Phase 13 — SEO & Performance

### Step 13.1 — SEO Meta Tags
```
Ensure all public pages have complete SEO meta tags. Update each file's <head> section:

index.html:
<title>Repair Your Credit Score Fast | Proximity Credit Repair</title>
<meta name="description" content="Proximity helps you dispute inaccurate credit items, monitor all 3 bureaus, and rebuild your credit score. Trusted by 10,000+ clients. Get started free.">
<meta name="keywords" content="credit repair, dispute credit report, remove collections, credit score improvement">
<meta property="og:title" content="Repair Your Credit Score Fast | Proximity">
<meta property="og:description" content="Dispute inaccurate items, monitor all 3 bureaus, rebuild your credit. Trusted by 10,000+ clients.">
<meta property="og:type" content="website">
<meta property="og:image" content="/og-image.jpg">
<link rel="canonical" href="https://yourdomain.com/">
<meta name="robots" content="index, follow">

about.html:
<title>About Proximity | Expert Credit Repair Company</title>
<meta name="description" content="Learn about Proximity's expert credit repair team and our mission to help Americans rebuild financial freedom through transparent, results-driven dispute filing.">
<link rel="canonical" href="https://yourdomain.com/about.html">

services.html:
<title>Credit Repair Services | Dispute Filing & Score Optimization | Proximity</title>
<meta name="description" content="Complete credit repair services: dispute filing, debt validation, credit monitoring, score optimization, identity theft protection, and financial coaching.">
<link rel="canonical" href="https://yourdomain.com/services.html">

pricing.html:
<title>Credit Repair Pricing Plans | Proximity</title>
<meta name="description" content="Transparent credit repair pricing starting at $79/mo. No hidden fees, no contracts. 30-day money-back guarantee. Basic, Standard, and Premium plans available.">
<link rel="canonical" href="https://yourdomain.com/pricing.html">

blog.html:
<title>Credit Repair Tips & Guides | Proximity Blog</title>
<meta name="description" content="Free credit repair guides, dispute letter tips, and financial advice from the Proximity expert team. Learn how to improve your credit score today.">
<link rel="canonical" href="https://yourdomain.com/blog.html">

blog-single.html:
<title>How to Remove Collections from Your Credit Report | Proximity Blog</title>
<meta name="description" content="Step-by-step guide to legally removing collection accounts from your credit report with Equifax, Experian, and TransUnion.">
<link rel="canonical" href="https://yourdomain.com/blog/remove-collections">

contact.html:
<title>Contact Proximity | Free Credit Consultation</title>
<meta name="description" content="Contact Proximity's credit repair experts. Free consultation available. Respond within 24 hours. Call (800) 555-PROX or email hello@proximity.com.">
<link rel="canonical" href="https://yourdomain.com/contact.html">

login.html and register.html:
<meta name="robots" content="noindex, nofollow">

client/dashboard.html and admin/dashboard.html:
<meta name="robots" content="noindex, nofollow">

Also add to every public page:
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
```

### Step 13.2 — Performance Optimization
```
Apply performance optimizations across the entire frontend:

1. Font loading optimization — update Google Fonts URL on all pages to include display=swap:
   https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Inter:wght@400;500;600&display=swap

2. Add preconnect to all pages (in <head>, before stylesheet links):
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="preconnect" href="https://unpkg.com">

3. All <img> tags (if any exist): add loading="lazy", explicit width and height attributes

4. All <script> tags: confirm defer attribute is present. Never use async for scripts that depend on each other.

5. Favicon: confirm this SVG favicon is in every page's <head>:
   <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23B8924A'/><text x='50' y='72' font-family='Arial' font-size='65' font-weight='bold' text-anchor='middle' fill='white'>P</text></svg>">

6. Dashboard charts: ensure Chart.js CDN script has the defer attribute:
   <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" defer></script>

7. CSS critical path: confirm style.css is linked without defer (CSS is render-blocking by design — this is correct). animations.css and responsive.css should also load synchronously.

8. Verify all JavaScript files are at the end of <body> with defer.

9. Add .skip-link for accessibility on all pages (before navbar):
   <a href="#main-content" class="skip-link">Skip to main content</a>
   Style: position absolute, left -100%, focus: left 0, top 0, background gold, color dark, padding 8px 16px, z-index 9999

10. Ensure main content area on all pages has id="main-content" on the <main> element.
```

### Step 13.3 — Accessibility Pass
```
Make the entire site accessible:

1. All icon-only buttons must have aria-label:
   - Hamburger: <button class="hamburger" aria-label="Open navigation menu" aria-expanded="false">
   - Password toggle: <button class="password-toggle" aria-label="Show password">
   - Testimonial arrows: aria-label="Previous testimonial" / "Next testimonial"
   - Sidebar toggle (mobile): aria-label="Open sidebar"

2. Update hamburger aria-expanded dynamically in main.js:
   hamburger.setAttribute('aria-expanded', navOverlay.classList.contains('open').toString())

3. All form inputs: confirm every input has a matching <label for="inputId"> or aria-label attribute

4. FAQ accordion: each .faq-question button needs aria-expanded and aria-controls attributes. Update in main.js when toggled.

5. Color contrast check: verify that --color-gold (#B8924A) on --color-dark-900 (#0A0A0A) achieves at least 4.5:1 contrast ratio. (It does — approximately 5.9:1). Confirm white text on gold also passes: white (#FFF) on gold (#B8924A) ≈ 2.8:1 — this fails for body text, so only use white on gold for large text (18px+ bold) or UI elements only.

6. Carousel: add role="region" aria-label="Testimonials" to .testimonials-carousel, and aria-live="polite" to the active slide container so screen readers announce slide changes.

7. Status badges in tables: add role="status" or descriptive aria-label to each badge.
```

---

## Phase 14 — Deployment on Replit

### Step 14.1 — Prepare for Replit Deployment
```
Configure the project for Replit deployment:

1. Verify proximity/backend/server.js already has:
   - Static file serving in production: app.use(express.static(path.join(__dirname, '../frontend')))
   - Catch-all route for frontend SPA: app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')))
   - This must be placed AFTER all /api routes and BEFORE the error handler

2. Update API_BASE in proximity/frontend/js/auth.js:
   Confirm the dynamic detection is in place:
   const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
     ? 'http://localhost:5000/api'
     : '/api';
   This automatically uses relative URLs in production and absolute in development.

3. Update proximity/backend/config.env:
   - Set NODE_ENV=production
   - Set ALLOWED_ORIGIN to your Replit app URL (e.g., https://proximity.yourusername.repl.co)
   - Confirm MONGO_URI and JWT_SECRET have real values

4. Replit run command — set this in the Replit configuration:
   node proximity/backend/server.js

5. Confirm package.json "start" script: "start": "node server.js"

6. Test locally with NODE_ENV=production to confirm static serving works before deploying.
```

### Step 14.2 — Final Production Verification
```
After deploying to Replit (or your hosting), run this final verification checklist:

SERVER:
1. GET /api/health → { success: true, status: 'ok' } ✓

AUTH FLOW:
2. Register new user at /register.html → success toast + redirect ✓
3. Login → redirect to correct dashboard ✓
4. Logout → token cleared + redirect to login ✓

DASHBOARDS:
5. Client dashboard loads all data, chart renders, dispute submission works ✓
6. Admin dashboard loads all KPIs, chart renders, status updates work ✓

PROTECTION:
7. /client/dashboard.html without login → redirect to /login.html ✓
8. /admin/dashboard.html as client → redirect to /client/dashboard.html ✓

PAGES:
9. All 13 pages load without console errors ✓
10. All internal navigation links work correctly ✓
11. Contact form submits and saves to MongoDB ✓

VISUAL:
12. Gold glow effect visible on all hero sections ✓
13. Scroll animations trigger on all public pages ✓
14. Navbar blur transitions on scroll ✓
15. Responsive layout correct on mobile, tablet, desktop ✓

SEO:
16. Each page has unique <title> and <meta name="description"> ✓
17. Login, register, and dashboard pages have noindex meta ✓

SECURITY:
18. config.env is NOT committed to git (check .gitignore) ✓
19. Expired JWT redirects cleanly to login (not an error screen) ✓
20. Admin-only routes return 403 for client users ✓

The project is production-ready when all 20 checks pass with ✓.
```

---

## Quick Reference — Build Order Summary

| Phase | Focus | Est. Time |
|---|---|---|
| 1 | Project setup, .gitignore, server scaffold | 30 min |
| 2 | Database models (User, Dispute, ContactMessage) | 25 min |
| 3 | Middleware (auth, admin, error) | 20 min |
| 4 | Auth routes + user routes (incl. PUT /me) | 30 min |
| 5 | Dispute + contact routes + admin seed script | 30 min |
| 6 | Lucide icons setup | 10 min |
| 7 | CSS design system (style, animations, responsive) | 60 min |
| 8 | JavaScript core (main.js + auth.js) | 45 min |
| 9 | All 8 public-facing pages | 90 min |
| 10 | Both dashboards (dashboard.js + admin.js + HTML) | 60 min |
| 11 | Seed admin, start server, verify health endpoint | 15 min |
| 12 | Full testing + bug fix pass | 60 min |
| 13 | SEO, performance, accessibility | 30 min |
| 14 | Deployment + final 20-point verification | 20 min |
| **Total** | | **~8.5 hours** |

---

> **Between-Phase Review Prompt:** After completing each phase, paste this into the Replit AI Agent before moving on:
>
> *"Review all files created or modified in the last phase. Check for: broken import paths, missing function definitions, CSS class name mismatches between HTML and CSS files, undefined variables, and any logic that references a route or function that doesn't exist yet. Fix everything you find before we continue."*
