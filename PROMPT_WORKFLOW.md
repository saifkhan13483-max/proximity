# Proximity – Replit AI Coding Agent Prompt Workflow
### Complete Step-by-Step Build Guide | Aligned with PRD v2.0

> **How to use this file:** Paste each prompt directly into the Replit AI Coding Agent in the exact order shown. Wait for each step to fully complete before moving to the next. Each prompt builds on all previous work.

---

## Phase 1 — Project Setup & Architecture

### Step 1.1 — Initialize Folder Structure
```
Create the complete folder structure for the Proximity credit repair platform as follows:

proximity/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── config.env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── admin/
    ├── client/
    ├── css/
    ├── js/
    ├── index.html
    ├── about.html
    ├── services.html
    ├── pricing.html
    ├── blog.html
    ├── blog-single.html
    ├── contact.html
    ├── login.html
    └── register.html

Create all folders and placeholder files. Do not write any code yet — just set up the structure.
```

### Step 1.2 — Backend Initialization
```
Inside proximity/backend/, initialize a Node.js project:
- Create package.json with the project name "proximity-backend"
- Install dependencies: express, mongoose, bcryptjs, jsonwebtoken, dotenv, cors, express-validator, express-rate-limit
- Install dev dependency: nodemon
- Add scripts: "start": "node server.js", "dev": "nodemon server.js"
```

### Step 1.3 — Environment Configuration
```
Create proximity/backend/config.env with the following variables:
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development

Do not use real values — use placeholder strings. I will fill in actual values manually.
```

### Step 1.4 — Express Server Entry Point
```
Create proximity/backend/server.js that:
- Loads environment variables from config.env using dotenv
- Sets up Express app with JSON body parsing and CORS enabled for all origins in development
- Connects to MongoDB via Mongoose using MONGO_URI from config.env — log success or failure
- Mounts route files at: /api/auth, /api/disputes, /api/contact, /api/users
- Uses a centralized error handling middleware
- Listens on PORT from config.env (default 5000)
- Logs "Proximity API running on port 5000" on startup
```

---

## Phase 2 — Database Schema & Backend Models

### Step 2.1 — User Model
```
Create proximity/backend/models/User.js with a Mongoose schema:
Fields:
- name: String, required, trimmed
- email: String, required, unique, lowercase, trimmed
- password: String, required, minlength 6
- role: String, enum ['client', 'admin'], default 'client'
- phone: String, optional
- avatar: String, optional
- createdAt: Date, default Date.now

Before saving, hash the password with bcrypt (salt rounds: 12) using a pre-save hook.
Add a method comparePassword(candidatePassword) that compares plain text to hashed using bcrypt.compare.
Export the model.
```

### Step 2.2 — Dispute Model
```
Create proximity/backend/models/Dispute.js with a Mongoose schema:
Fields:
- userId: ObjectId, ref 'User', required
- bureau: String, enum ['Equifax', 'Experian', 'TransUnion'], required
- accountName: String, required, trimmed
- accountNumber: String, optional
- reason: String, required, minlength 10
- status: String, enum ['Pending', 'In Progress', 'Resolved'], default 'Pending'
- notes: String, optional (admin notes field)
- createdAt: Date, default Date.now
- updatedAt: Date, default Date.now

Update updatedAt automatically on every save using a pre-save hook.
Export the model.
```

### Step 2.3 — ContactMessage Model
```
Create proximity/backend/models/ContactMessage.js with a Mongoose schema:
Fields:
- name: String, required, trimmed
- email: String, required, trimmed
- phone: String, optional
- message: String, required, minlength 10
- read: Boolean, default false
- createdAt: Date, default Date.now

Export the model.
```

---

## Phase 3 — Authentication & User Management

### Step 3.1 — Auth Middleware
```
Create proximity/backend/middleware/authMiddleware.js:
- Export a function "protect" that reads the Bearer token from the Authorization header
- Verify the JWT using JWT_SECRET from process.env
- If valid, attach the decoded user object to req.user and call next()
- If missing or invalid, return 401 JSON: { success: false, message: 'Not authorized' }

Export a second function "adminOnly" that checks req.user.role === 'admin'.
- If not admin, return 403 JSON: { success: false, message: 'Admin access required' }
- If admin, call next()
```

### Step 3.2 — Error Middleware
```
Create proximity/backend/middleware/errorMiddleware.js:
- Export a function "errorHandler(err, req, res, next)"
- Log the error stack to console in development mode only
- Return JSON: { success: false, message: err.message || 'Server Error' } with status err.statusCode or 500
```

### Step 3.3 — Auth Routes
```
Create proximity/backend/routes/authRoutes.js with express-rate-limit applied (max 10 requests per 15 minutes):

POST /api/auth/register:
- Validate: name (not empty), email (valid), password (min 6 chars) using express-validator
- Check if email already exists — return 400 if so
- Create and save new User
- Return JWT token and user object (exclude password)

POST /api/auth/login:
- Validate: email, password
- Find user by email — return 401 if not found
- Compare passwords using comparePassword method — return 401 if mismatch
- Return JWT token and user object (exclude password)

GET /api/auth/me:
- Protected route (use protect middleware)
- Return current user from req.user (exclude password)
```

### Step 3.4 — User Routes
```
Create proximity/backend/routes/userRoutes.js:

GET /api/users:
- Protected + admin only
- Return all users (exclude passwords), sorted by createdAt descending

DELETE /api/users/:id:
- Protected + admin only
- Delete user and all their associated disputes
- Return success message
```

---

## Phase 4 — Core API Routes

### Step 4.1 — Dispute Routes
```
Create proximity/backend/routes/disputeRoutes.js:

GET /api/disputes:
- Protected route
- Return only disputes belonging to req.user._id, sorted newest first

GET /api/disputes/all:
- Protected + admin only
- Return all disputes with user name and email populated, sorted newest first

POST /api/disputes:
- Protected route
- Validate: bureau (must be valid enum), accountName (required), reason (min 10 chars)
- Create dispute with userId = req.user._id
- Return created dispute

PUT /api/disputes/:id:
- Protected + admin only
- Allow updating: status, notes
- Set updatedAt to current date
- Return updated dispute

DELETE /api/disputes/:id:
- Protected + admin only
- Delete dispute by ID
- Return success message
```

### Step 4.2 — Contact Routes
```
Create proximity/backend/routes/contactRoutes.js:

POST /api/contact:
- Public route
- Validate: name, email (valid), message (min 10 chars)
- Save ContactMessage to database
- Return 201 success message

GET /api/contact:
- Protected + admin only
- Return all messages sorted by createdAt descending, unread first

PUT /api/contact/:id/read:
- Protected + admin only
- Set message read = true
- Return updated message
```

---

## Phase 5 — CSS Design System

### Step 5.1 — Global Styles & Design Tokens
```
Create proximity/frontend/css/style.css with:

1. CSS custom properties (variables) in :root — use EXACTLY these values from the PRD:
   - All color tokens: --color-gold (#B8924A), --color-gold-light, --color-gold-dark, --color-gold-glow, --color-white, --color-off-white, --color-dark-900 (#0A0A0A), --color-dark-800 (#111111), --color-dark-700, --color-dark-600, --color-text-muted
   - All typography tokens: --font-display (Poppins), --font-body (Inter), --text-hero (clamp), --text-h2 (clamp), --text-h3 (clamp), --text-body, --text-small
   - All elevation tokens: --shadow-card, --shadow-gold, --shadow-hover, --radius-card (16px), --radius-btn (8px), --radius-input (10px)
   - All animation tokens: --ease-smooth, --ease-bounce, --duration-fast (200ms), --duration-base (400ms), --duration-slow (700ms)

2. CSS reset: box-sizing border-box, margin 0, padding 0, inherit fonts

3. Base body styles: background #0A0A0A, color white, font-family Inter

4. Google Fonts import for Poppins (300,400,600,700,800) and Inter (400,500,600)

5. Heading styles (h1–h4) using Poppins, with appropriate sizes from type scale

6. Three button styles:
   - .btn-primary: gold background, white text, gold glow shadow on hover, scale 1.03 transform
   - .btn-secondary: transparent, gold border, gold text, fills gold on hover
   - .btn-ghost: white text only, underline slides in on hover

7. Glassmorphism card class .glass-card: rgba(255,255,255,0.04) bg, 1px gold border at 20% opacity, blur(20px) backdrop-filter, 16px radius — hover state increases border opacity to 60% with gold shadow

8. Gold divider class .gold-divider: 1px horizontal rule using linear-gradient(to right, transparent, #B8924A, transparent)

9. Navbar base styles: fixed position, full width, z-index 1000, flex layout, padding 20px 40px — transparent by default, .scrolled class adds dark bg and blur

10. Toast notification styles: .toast container fixed bottom-right, individual toast with slide-in animation, variants for success/error/info

11. Section base styles: padding 80px 0, max-width 1200px centered container
```

### Step 5.2 — Animations CSS
```
Create proximity/frontend/css/animations.css with all keyframe definitions:

@keyframes fadeUp: opacity 0 + translateY(40px) → opacity 1 + translateY(0)
@keyframes fadeInLeft: opacity 0 + translateX(-40px) → opacity 1 + translateX(0)
@keyframes fadeInRight: opacity 0 + translateX(40px) → opacity 1 + translateX(0)
@keyframes scaleIn: opacity 0 + scale(0.8) → opacity 1 + scale(1)
@keyframes float: translateY(0) → translateY(-20px) → translateY(0) — 6s infinite ease-in-out
@keyframes goldGlowPulse: box-shadow 0 0 20px gold-glow → 0 0 60px gold-glow → back — 3s infinite
@keyframes slideInRight: translateX(100%) → translateX(0) (for toasts)
@keyframes slideOutRight: translateX(0) → translateX(100%) (for toast dismiss)
@keyframes countUp: used as trigger class for JS counter animation
@keyframes shimmer: background-position left to right — for loading states

Utility classes:
.animate-fade-up, .animate-fade-left, .animate-fade-right, .animate-scale-in
All start hidden (opacity: 0) — JS Intersection Observer adds .is-visible class to trigger the animation
All use will-change: transform, opacity

Hero floating shapes: .hero-shape class with float animation, various gold opacities
```

### Step 5.3 — Responsive CSS
```
Create proximity/frontend/css/responsive.css with mobile-first breakpoints:

Breakpoints: 480px, 768px, 1024px, 1280px

Key responsive rules:
- Navbar: hamburger menu below 768px, full-screen overlay nav
- Hero: reduce clamp font sizes, single column layout
- Stats bar: 2x2 grid on mobile, 4-column on desktop
- Service/pricing/blog cards: 1 column mobile, 2 columns tablet, 3 columns desktop
- Dashboard sidebar: hidden on mobile, toggle button to show as overlay
- Pricing cards: stack vertically on mobile
- Contact page: single column on mobile, split layout on desktop
- Footer: single column on mobile, multi-column on desktop
- All grid layouts use CSS Grid with auto-fit minmax for natural reflow
- Touch-friendly tap targets: minimum 44px height on all interactive elements
```

---

## Phase 6 — JavaScript Core

### Step 6.1 — main.js
```
Create proximity/frontend/js/main.js with:

1. Navbar scroll behavior:
   - On window scroll, add/remove .scrolled class to navbar when scrollY > 50
   - Active link detection: compare current page URL to nav link href, add .active class

2. Hamburger menu toggle:
   - Click hamburger → toggle .open class on nav overlay
   - Animate hamburger icon to X using CSS class toggle
   - Close on overlay link click or ESC key

3. Intersection Observer setup:
   - Select all elements with .animate-fade-up, .animate-fade-left, .animate-fade-right, .animate-scale-in
   - Observe each — when 20% visible, add .is-visible class to trigger CSS animation
   - Unobserve after animation triggers

4. Animated counter function:
   - animateCounter(element, target, duration)
   - Uses requestAnimationFrame to count from 0 to target over duration ms
   - Formats numbers with commas and optional suffix (+, %)
   - Triggered by Intersection Observer when stats bar enters view

5. Toast notification system:
   - showToast(message, type) — types: 'success', 'error', 'info'
   - Creates toast element, appends to .toast-container
   - Auto-dismisses after 4000ms with slideOutRight animation
   - Stack management: max 4 toasts visible at once

6. Smooth scroll: all anchor href="#..." links use scrollIntoView({ behavior: 'smooth' })

7. Gold dividers: auto-inject .gold-divider between all major sections on page load
```

### Step 6.2 — auth.js
```
Create proximity/frontend/js/auth.js with:

1. Constants: API_BASE = 'http://localhost:5000/api'

2. Utility functions:
   - getToken() — returns localStorage.getItem('proximity_token')
   - setToken(token) — localStorage.setItem
   - clearToken() — localStorage.removeItem
   - getUser() — parse localStorage.getItem('proximity_user')
   - setUser(user) — stringify and store
   - isAuthenticated() — returns true if token exists
   - isAdmin() — returns getUser()?.role === 'admin'
   - redirectIfNotAuth() — if not authenticated, redirect to /login.html
   - redirectIfNotAdmin() — if not admin, redirect to /client/dashboard.html

3. handleResponse(res) utility:
   - If res.status === 401, clearToken() and redirect to /login.html
   - If not res.ok, throw error with response message
   - Return res.json()

4. Login form handler (runs on login.html):
   - Validate email and password client-side
   - POST to /api/auth/login with credentials
   - On success: setToken, setUser, redirect to /client/dashboard.html
   - On error: showToast with error message

5. Register form handler (runs on register.html):
   - Validate: name, email, password (min 6), confirm password match
   - POST to /api/auth/register
   - On success: showToast('Account created!', 'success'), redirect to /login.html after 1.5s
   - On error: showToast with error message

6. Logout function:
   - clearToken(), clear user from localStorage
   - Redirect to /login.html

7. Update navbar dynamically: if authenticated, show user name and logout button instead of Login/Register links
```

---

## Phase 7 — Frontend Pages (Public)

### Step 7.1 — index.html (Home Page)
```
Build proximity/frontend/index.html — the full home page. Reference PRD v2.0 exactly.

Include:
- <head>: Google Fonts (Poppins + Inter), link to style.css, animations.css, responsive.css. Title: "Proximity | Credit Repair Experts". Meta description and Open Graph tags.
- Sticky navbar: logo left ("PROXIMITY" in Poppins bold with gold accent dot), center nav links (Home, About, Services, Pricing, Blog, Contact), right side: Login + "Get Started" gold button
- Hero section: full viewport height, background #0A0A0A, radial gold glow from bottom-center using radial-gradient. 3 floating geometric shapes (thin gold rings using border-radius 50% with gold border). Staggered text: "Repair Your Credit." then "Rebuild Your Future." then subtext then two CTAs. All elements use animate-fade-up with CSS animation-delay increments.
- Stats bar: dark strip, 4 columns — animated counter values: 10000 (displays "10,000+"), 98 (displays "98%"), 2 (displays "$2M+"), 500 (displays "500+"). Labels below each number.
- How It Works: 3 steps connected by dashed gold horizontal line on desktop. Step 1: Dispute, Step 2: Monitor, Step 3: Rebuild. Each has a numbered gold circle, icon, title, and description.
- Services preview: 3 glassmorphism cards on dark section — Credit Dispute Filing, Credit Monitoring, Score Optimization. Each with SVG icon, title, excerpt, "Learn More" ghost button.
- Testimonials: carousel of 4 quotes with name, star rating (5 gold stars), and oversized opening quote mark in gold. Auto-advances every 5s. Dot indicators below.
- CTA banner: full-width gold background (#B8924A), dark text "Ready to Start Your Credit Journey?", subtitle, and "Get Started Today" dark button. Diagonal repeating stripe pattern as subtle overlay.
- Footer: dark #0A0A0A, 4 columns (Brand + tagline, Quick Links, Services, Contact Info), social icons row, copyright bar. All links hover gold.
- Link style.css, animations.css, responsive.css, main.js, auth.js at correct paths.
```

### Step 7.2 — about.html
```
Build proximity/frontend/about.html. Reference PRD v2.0.

Include:
- Same navbar and footer as index.html
- Hero: "We Fight So You Don't Have To" — dark hero with gold glow, staggered fade-up text
- Mission statement paragraph below hero
- Story section: 2-column split — left: text content (founding year, mission, growth), right: abstract SVG geometric composition in gold and dark tones (concentric circles, diagonal lines)
- Founding values: 4-card grid using glassmorphism cards — Integrity, Transparency, Results, Empowerment — each with gold icon, bold title, 2-sentence description
- Team section: 4 placeholder cards — circular avatar placeholder with gold ring border, name, role title, and short bio
- Why Proximity section: 4-column icon + stat + label layout — "500+ Disputes Filed Monthly", "98% Client Satisfaction", "15+ Years Combined Experience", "3 Bureau Coverage"
- Page title: "About Us | Proximity"
```

### Step 7.3 — services.html
```
Build proximity/frontend/services.html. Reference PRD v2.0.

Include:
- Same navbar and footer
- Hero: "Services Built for Results" — dark hero, gold glow
- 6 service cards in a 3-column CSS grid (glassmorphism on dark bg):
  1. Credit Dispute Filing — icon: file-text
  2. Credit Monitoring — icon: activity
  3. Debt Validation — icon: shield
  4. Score Optimization — icon: trending-up
  5. Identity Theft Protection — icon: lock
  6. Financial Coaching — icon: book-open
- Each card: gold SVG Lucide icon (48px), bold title, 3-sentence description, "Learn More" ghost button
- On hover: card lifts 8px via translateY, gold border brightens, gold shadow appears
- Process section below cards: numbered list of how the dispute process works (1–5 steps)
- Bottom CTA: "Ready to dispute your first item?" with gold button linking to /register.html
- Page title: "Services | Proximity"
```

### Step 7.4 — pricing.html
```
Build proximity/frontend/pricing.html. Reference PRD v2.0.

Include:
- Same navbar and footer
- Hero: "Simple, Transparent Pricing"
- 3 pricing cards in a row (CSS flex):
  - Basic $79/mo: 3 bureau access, 5 disputes/month, email support, online portal — no monitoring
  - Standard $149/mo (FEATURED): All Basic features, unlimited disputes, priority support, credit monitoring, score tracking — gold border, gold "Most Popular" badge top-right, slightly larger scale
  - Premium $299/mo: All Standard features, dedicated advisor, white-glove concierge, monthly calls, legal letter templates
- Feature rows use gold checkmark SVG for included, gray X SVG for excluded
- Money-back guarantee strip: dark strip with shield icon — "30-Day Money-Back Guarantee. No Questions Asked."
- FAQ accordion: 6 questions — smooth max-height transition, gold rotate icon
  Questions: How does the dispute process work? / How long until I see results? / Which bureaus do you cover? / Is my information secure? / Can I cancel anytime? / What if disputes are rejected?
- Page title: "Pricing | Proximity"
```

### Step 7.5 — blog.html and blog-single.html
```
Build proximity/frontend/blog.html and blog-single.html. Reference PRD v2.0.

blog.html:
- Same navbar and footer
- Hero with embedded search bar (non-functional, UI only)
- Main content: 2-column layout (70% blog grid, 30% sidebar)
- Blog grid: 6 article cards — gradient image placeholder (dark-to-gold), gold category pill, title, 2-line excerpt, date, "Read More" link
- Sidebar: search bar, categories list (Credit Tips, Dispute Guides, Financial News, Success Stories) with post counts, recent posts list, email subscribe input + gold button
- Page title: "Blog | Proximity"

blog-single.html:
- Same navbar and footer
- Full-width dark hero banner with article title and author/date overlay
- Article body: centered max-width 720px, line-height 1.9, font-size 1.1rem — placeholder article text (5 paragraphs) with one blockquote styled in gold left-border
- Author card: small circular avatar placeholder, name, role, 2-sentence bio
- Tags row: gold-outlined tag pills
- Share icons: Twitter, Facebook, LinkedIn (SVG icons, gold on hover)
- Related articles: 3-card row matching blog card style
- Comment form: name, email, comment fields with gold submit button
- Page title: "Blog | Proximity"
```

### Step 7.6 — contact.html
```
Build proximity/frontend/contact.html. Reference PRD v2.0.

Include:
- Same navbar and footer
- Hero: "Let's Talk. We're Here to Help."
- Split layout below hero: 60% form / 40% info panel
- Form (left): Name, Email, Phone, Subject, Message (textarea). All inputs have gold focus ring (outline: 2px solid #B8924A). Gold "Send Message" submit button. Validates all fields before submit, POST to /api/contact, show success toast on completion.
- Info panel (right): Location (address placeholder), Phone, Email — each with gold Lucide icon. Office hours text. Social icons row.
- Map placeholder: dark rectangle with CSS-drawn grid lines and a gold pin icon at center — styled to look like a dark map tile
- Page title: "Contact | Proximity"
```

### Step 7.7 — login.html and register.html
```
Build proximity/frontend/login.html and proximity/frontend/register.html. Reference PRD v2.0.

login.html:
- Full-page dark background #0A0A0A with centered radial gold glow
- Centered frosted glass card (max-width 460px): rgba(255,255,255,0.04), blur, gold border
- "PROXIMITY" logo at top of card in gold
- "Welcome Back" heading
- Float-label inputs: Email, Password (label rises to top on focus using CSS transform)
- Password show/hide toggle (eye icon, Lucide)
- Gold "Sign In" button (full width)
- "Forgot password?" link (non-functional, UI only)
- "Don't have an account? Register" link
- On submit: call auth.js login handler, show loading state on button
- Page title: "Login | Proximity"

register.html:
- Same full-page dark layout
- "Create Your Account" heading
- Float-label inputs: Full Name, Email, Password, Confirm Password
- Password show/hide toggles on both password fields
- Password strength indicator bar (weak/medium/strong using CSS width + color)
- Gold "Create Account" button (full width)
- "Already have an account? Login" link
- Page title: "Register | Proximity"
```

---

## Phase 8 — Client & Admin Dashboards

### Step 8.1 — dashboard.js
```
Create proximity/frontend/js/dashboard.js:

1. On load: call redirectIfNotAuth() from auth.js

2. fetchDisputes() function:
   - GET /api/disputes with Bearer token
   - Handle 401 via handleResponse
   - Return disputes array

3. renderDisputeTable(disputes):
   - Build HTML table rows from disputes array
   - Status badge colors: Pending = gold, In Progress = blue, Resolved = green
   - Sort by createdAt descending
   - If empty, show "No disputes yet" message

4. renderOverviewStats(disputes):
   - Count open (Pending + In Progress) and resolved disputes
   - Calculate days since account creation
   - Update DOM stat card elements

5. renderDisputeChart(disputes):
   - Use Chart.js line chart
   - X-axis: last 6 months labels
   - Y-axis: dispute count per month
   - Gold line color with gold point backgrounds
   - Dark grid lines, white labels

6. submitDisputeForm handler:
   - Validate bureau, accountName (required), reason (min 10 chars)
   - POST to /api/disputes with Bearer token
   - On success: showToast, re-fetch and re-render dispute table, reset form
   - On error: showToast with error

7. Tab navigation:
   - Click tab button → hide all .tab-panel sections, show matching panel
   - Update active state on tab button

8. Profile tab:
   - Load user from getUser() and populate fields
   - Allow name, phone update (PUT /api/auth/me — add this route if not existing)

9. Render user initials in top bar avatar badge
```

### Step 8.2 — client/dashboard.html
```
Build proximity/frontend/client/dashboard.html. Reference PRD v2.0.

Structure:
- <head>: all CSS files linked with ../css/ paths. Chart.js CDN link. Page title: "My Dashboard | Proximity"
- Layout: CSS grid — fixed sidebar (240px) + main content area
- Sidebar (dark #111111):
  - "PROXIMITY" gold logo at top
  - Nav items with Lucide icons: Overview (grid icon), My Disputes (list icon), Submit Dispute (plus-circle icon), Profile (user icon)
  - Active state: gold text + gold left-border + subtle gold background tint
  - Logout button at bottom with Lucide log-out icon
- Top bar: "Welcome back, [Name]" greeting (populated by JS), circular initials badge (gold bg, dark text)
- Tab panels:
  - Overview: 3 stat cards (gold icon, large number, label), Chart.js canvas (dispute trend), credit progress bar (labeled "Estimated Credit Improvement" with gold fill)
  - My Disputes: sortable table (Bureau, Account, Status badge, Date, —), empty state message
  - Submit Dispute: form (bureau select, account name, account number optional, reason textarea), gold submit button
  - Profile: name field, email (read-only), phone field, save button
- Link ../js/main.js, ../js/auth.js, ../js/dashboard.js
```

### Step 8.3 — admin.js
```
Create proximity/frontend/js/admin.js:

1. On load: call redirectIfNotAuth() and redirectIfNotAdmin() from auth.js

2. fetchAllUsers():
   - GET /api/users with Bearer token
   - Render into users table: name, email, role badge, createdAt, delete button

3. deleteUser(userId):
   - Confirm with window.confirm dialog
   - DELETE /api/users/:id with Bearer token
   - On success: re-fetch and re-render table, showToast

4. fetchAllDisputes():
   - GET /api/disputes/all with Bearer token
   - Render into disputes table: user name, bureau, accountName, status (inline select dropdown), notes (text input), save button

5. updateDispute(disputeId, status, notes):
   - PUT /api/disputes/:id with Bearer token, body: { status, notes }
   - On success: showToast('Dispute updated', 'success')

6. fetchAllMessages():
   - GET /api/contact with Bearer token
   - Render as cards: unread cards have gold-left-border highlight, name, email, message, date, "Mark as Read" button

7. markMessageRead(messageId):
   - PUT /api/contact/:id/read with Bearer token
   - On success: remove highlight, disable button

8. renderAdminChart(disputes):
   - Bar chart: disputes grouped by bureau (Equifax, Experian, TransUnion)
   - Gold bars, dark bg, white labels

9. renderKPICards(users, disputes, messages):
   - Total Users, Total Disputes, Open Disputes, Unread Messages

10. Tab navigation: same pattern as dashboard.js
```

### Step 8.4 — admin/dashboard.html
```
Build proximity/frontend/admin/dashboard.html. Reference PRD v2.0.

Structure mirrors client dashboard with different nav and content:
- Sidebar nav items: Overview (bar-chart icon), Users (users icon), Disputes (file-text icon), Messages (mail icon)
- Overview tab: 4 KPI cards (Total Users, Total Disputes, Open Disputes, Unread Messages), Chart.js bar chart canvas
- Users tab: search input (client-side filter), table (Name, Email, Role badge, Date Joined, Delete button)
- Disputes tab: table (User, Bureau, Account, Status dropdown, Notes input, Save button)
- Messages tab: card list (unread = gold left border highlight, name, email, message preview, date, Mark Read button)
- Link ../css/ files, Chart.js CDN, ../js/main.js, ../js/auth.js, ../js/admin.js
- Page title: "Admin Panel | Proximity"
```

---

## Phase 9 — Testing & Debugging

### Step 9.1 — Backend API Testing
```
Test every backend API endpoint:

1. Register a new client user via POST /api/auth/register — verify JWT is returned
2. Login with that user via POST /api/auth/login — verify JWT works
3. Access GET /api/auth/me with the token — verify user data returns
4. Submit a dispute via POST /api/disputes — verify it saves with userId
5. Get own disputes via GET /api/disputes — verify only user's disputes return
6. Register an admin user manually (set role: 'admin' in MongoDB)
7. Login as admin, get all disputes via GET /api/disputes/all — verify all show
8. Update a dispute status via PUT /api/disputes/:id — verify status changes
9. Submit contact message via POST /api/contact — verify it saves
10. Get all messages as admin via GET /api/contact — verify they return
11. Mark a message read via PUT /api/contact/:id/read — verify read: true

Fix any failing endpoints before proceeding.
```

### Step 9.2 — Frontend Auth Flow Testing
```
Test the complete frontend authentication flow:

1. Open /register.html — fill form with invalid data, verify client-side validation errors appear
2. Register with valid data — verify success toast and redirect to /login.html
3. On /login.html — try wrong password — verify error toast appears
4. Login with correct credentials — verify redirect to /client/dashboard.html
5. Verify dashboard loads dispute data and chart renders
6. Submit a new dispute from dashboard — verify it appears in the table
7. Open /admin/dashboard.html directly — if logged in as client, verify redirect occurs
8. Open /client/dashboard.html without being logged in — verify redirect to /login.html
9. Click logout — verify token is cleared and redirect to /login.html

Fix any redirect or auth issues found.
```

### Step 9.3 — UI & Responsive Testing
```
Review and fix all UI issues across pages:

1. Open each page at 375px width (mobile) — check for:
   - Overflow or horizontal scroll
   - Navbar hamburger menu working
   - Cards stacking properly
   - Buttons and inputs sized for touch (min 44px)

2. Open each page at 768px (tablet) — check grid breakpoints

3. Open at 1280px (desktop) — verify full layout matches PRD

4. Verify on each page:
   - Navbar becomes dark/blurred on scroll
   - All .animate-fade-up elements animate on scroll
   - Stat counters count up when visible
   - Testimonial carousel auto-advances
   - Pricing FAQ accordion opens/closes smoothly
   - Toast notifications appear and dismiss
   - Gold glow effect visible in heroes

Fix any visual or interaction issues found.
```

### Step 9.4 — Bug Fixing Pass
```
Perform a full bug fix pass on the entire project:

1. Open browser console on every page — fix any JavaScript errors
2. Check all API calls from frontend — fix any CORS or URL errors
3. Verify all internal page links work correctly (no 404s)
4. Fix any broken CSS — missing hover states, misaligned elements, overflow issues
5. Verify Chart.js renders correctly in both dashboards with actual data
6. Confirm all form submissions show proper loading states and toast feedback
7. Check that JWT expiry is handled — expired token should redirect to login cleanly
8. Verify admin cannot access client dashboard and vice versa is enforced
```

---

## Phase 10 — SEO & Performance Optimization

### Step 10.1 — SEO Meta Tags
```
Add SEO optimization to all 13 pages:

For each page, add inside <head>:
- Unique <title> following the pattern: "Page Name | Proximity Credit Repair"
- <meta name="description"> — unique 150-160 character description per page
- <meta name="keywords"> — relevant credit repair keywords
- Open Graph tags: og:title, og:description, og:type, og:url, og:image (placeholder)
- <link rel="canonical"> pointing to the page's URL
- <meta name="robots" content="index, follow">

Page-specific titles:
- Home: "Repair Your Credit Score Fast | Proximity Credit Repair"
- About: "About Proximity | Expert Credit Repair Company"
- Services: "Credit Repair Services | Dispute Filing & Score Optimization | Proximity"
- Pricing: "Credit Repair Pricing Plans | Proximity"
- Blog: "Credit Repair Tips & Guides | Proximity Blog"
- Contact: "Contact Proximity | Credit Repair Experts"
- Login/Register: add <meta name="robots" content="noindex">
- Dashboards: add <meta name="robots" content="noindex">
```

### Step 10.2 — Performance Optimization
```
Optimize the entire frontend for performance:

1. Add loading="lazy" and explicit width/height to all <img> tags
2. Add <link rel="preconnect" href="https://fonts.googleapis.com"> and preconnect for fonts
3. Add <link rel="preload"> for style.css as the critical stylesheet
4. Minify all inline CSS — remove comments from production style.css
5. Ensure all Intersection Observer animations use will-change: transform, opacity
6. Add font-display: swap to Google Fonts import URL
7. Ensure Chart.js is loaded with defer attribute
8. Verify all scripts use defer or are placed at end of <body>
9. Add a <link rel="icon"> favicon reference to all pages — create a simple gold "P" favicon using an SVG data URI in the href
10. Ensure localStorage reads are wrapped in try/catch to prevent crashes in private browsing
```

### Step 10.3 — Final Production Polish
```
Complete final polish pass before handoff:

1. Remove all console.log statements from all JS files except error logging
2. Add NODE_ENV check to server.js — only show detailed errors in development
3. Verify config.env is listed in .gitignore — create .gitignore if not present
4. Add a /health endpoint to server.js: GET /api/health returns { status: 'ok', timestamp: Date.now() }
5. Ensure all empty states are handled gracefully:
   - No disputes: show "No disputes yet. Submit your first dispute!" with a gold CTA
   - No messages (admin): show "No messages yet"
   - No users: show "No users registered yet"
6. Add skip-to-content link at top of every page for accessibility
7. Ensure all form inputs have associated <label> elements for accessibility
8. Verify color contrast ratios — gold on dark must pass WCAG AA (4.5:1 ratio)
9. Add aria-label attributes to all icon-only buttons (hamburger, close, eye toggle)
10. Final review: open every page, click every link, submit every form — confirm zero errors
```

---

## Phase 11 — Deployment

### Step 11.1 — Prepare for Deployment on Replit
```
Configure the Proximity project for deployment on Replit:

1. Update server.js:
   - Change CORS origin to allow the Replit deployment URL (use process.env.ALLOWED_ORIGIN or '*' for now)
   - Serve the frontend/static files via Express: app.use(express.static('../frontend'))
   - Add a catch-all route that serves frontend/index.html for non-API routes

2. Update config.env:
   - Confirm MONGO_URI is set to a real MongoDB Atlas connection string
   - Confirm JWT_SECRET is a strong random string (min 32 chars)
   - Set NODE_ENV=production

3. Update all frontend API base URLs:
   - In auth.js: change API_BASE from 'http://localhost:5000/api' to a relative path '/api'
   - This allows the frontend and backend to share the same origin on deployment

4. Create a start script in backend/package.json: "start": "node server.js"

5. Verify the Replit run command points to: node proximity/backend/server.js

6. Test the full app at the Replit preview URL — confirm all pages load, auth works, and API calls succeed
```

### Step 11.2 — Final Deployment Verification
```
Perform final deployment verification:

1. Register a new user through the live URL — confirm it saves to MongoDB Atlas
2. Login and submit a dispute — confirm it appears in the dashboard
3. Access the admin dashboard — confirm all data loads
4. Submit the contact form — confirm the message saves
5. Test on a real mobile device (or browser mobile emulator) — confirm full responsive layout
6. Check all page titles in browser tab match SEO spec
7. Confirm no mixed content warnings (HTTP resources on HTTPS pages)
8. Verify JWT tokens persist across page refreshes
9. Confirm that navigating directly to /client/dashboard.html while logged out redirects to /login.html
10. Confirm the /api/health endpoint returns { status: 'ok' }

The project is production-ready when all 10 checks pass.
```

---

## Quick Reference — Build Order Summary

| Phase | Focus | Est. Time |
|---|---|---|
| 1 | Project setup & server | 30 min |
| 2 | Database models | 30 min |
| 3 | Auth & middleware | 45 min |
| 4 | API routes | 45 min |
| 5 | CSS design system | 60 min |
| 6 | JavaScript core | 60 min |
| 7 | All public pages | 90 min |
| 8 | Dashboards | 60 min |
| 9 | Testing & debugging | 60 min |
| 10 | SEO & performance | 30 min |
| 11 | Deployment | 30 min |
| **Total** | | **~9 hours** |

---

> **Pro Tip:** After completing each phase, ask the Replit AI Agent: *"Review everything built so far and fix any inconsistencies, broken references, or missing connections before we continue."* This keeps the codebase clean between phases.
