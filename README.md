# Study Library Management System

A **Space-as-a-Service** platform for private reading rooms where students pay for dedicated study seats across named time shifts (Morning, Evening, Night, Full Day).

---

## Features

| Area | Capabilities |
|---|---|
| **Seat Map** | Live grid showing availability per shift · click to book or view occupant |
| **Bookings** | 1-month, 3-month, or custom durations · atomic conflict detection · cancellations |
| **Auth** | JWT access + refresh token rotation · role-based access (student / admin) |
| **Admin Dashboard** | Monthly revenue · occupancy % per shift · memberships expiring in 3 days |
| **Email** | Booking confirmation · renewal reminders · cancellation notice (Nodemailer) |
| **Cron** | Daily 09:00 reminder job for expiring memberships |
| **Tests** | 14 Jest unit + integration tests with in-memory MongoDB |

---

## Project Structure

```
study-library/
├── backend/
│   ├── config/
│   │   └── database.js          # Mongoose connection
│   ├── middleware/
│   │   ├── auth.js              # JWT protect + requireAdmin guards
│   │   ├── errorHandler.js      # Centralised error + 404 handler
│   │   └── rateLimiter.js       # express-rate-limit configs
│   ├── models/
│   │   └── index.js             # User, Seat, Shift, Booking schemas
│   ├── routes/
│   │   ├── auth.js              # /api/auth/*
│   │   ├── bookings.js          # /api/bookings/*
│   │   ├── admin.js             # /api/admin/*
│   │   └── seats.js             # /api/seats, /api/shifts
│   ├── services/
│   │   ├── availabilityService.js  # Core logic engine
│   │   ├── authService.js          # Register / login / token refresh
│   │   └── notificationService.js  # Nodemailer email helpers
│   ├── tests/
│   │   └── availability.test.js    # Jest tests (14 cases)
│   ├── utils/
│   │   ├── seeder.js            # DB seed / destroy script
│   │   └── cron.js              # Daily renewal reminder cron
│   ├── server.js                # Express entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Layout.jsx   # Sidebar navigation shell
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Login / logout state
│   │   ├── hooks/
│   │   │   └── useLibrary.js    # All React Query hooks
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── SeatMapPage.jsx
│   │   │   ├── MyBookingsPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminBookings.jsx
│   │   │   └── AdminUsers.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios client with token interceptor
│   │   ├── App.jsx              # Router + protected routes
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind + component classes
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── package.json                 # Root — concurrently dev script
├── .gitignore
└── README.md
```

---

##  Quick Start

### Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| MongoDB | 6.x (local) or a free MongoDB Atlas cluster |

---

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/study-library.git
cd study-library

# Install all dependencies (backend + frontend) in one command
npm run install:all
```

---

### 2. Configure environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# MongoDB — local or Atlas
MONGO_URI=mongodb://127.0.0.1:27017/study-library

# Generate strong secrets:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# SMTP (optional — needed only for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env
# The defaults work for local development — no changes needed.
```

---

### 3. Seed the database

```bash
# From the project root:
npm run seed
```

This creates:
- 4 shifts (Morning, Evening, Night, Full Day)
- 24 seats (rows A–D, seats 1–6)
- **Admin user:** `admin@library.com` / `Admin@123`
- **Demo student:** `student@demo.com` / `Student@123` (with 1 active booking)

To wipe all data and start fresh:
```bash
npm run destroy
```

---

### 4. Run in development mode

```bash
# From the project root — starts both backend (port 5000) and frontend (port 3000):
npm run dev
```

Open **http://localhost:3000** in your browser.

Or run them separately:
```bash
# Terminal 1
cd backend  && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

### 5. Run tests

```bash
npm run test
# or
cd backend && npm test
```

Uses `mongodb-memory-server` — no real database needed.

---

##  API Reference

All routes are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <accessToken>
```

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create student account |
| POST | `/login` | — | Get access + refresh tokens |
| POST | `/refresh` | — | Rotate tokens |
| POST | `/logout` | ✓ | Invalidate refresh token |
| GET | `/me` | ✓ | Get current user |

### Bookings — `/api/bookings`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/availability` | ✓ | Check one seat+shift for a date range |
| GET | `/seat-map` | ✓ | Bulk map for seat grid UI |
| POST | `/` | ✓ | Create booking (atomic) |
| GET | `/my` | ✓ | Student's own bookings |
| GET | `/:id` | ✓ | Get single booking |
| PATCH | `/:id/cancel` | ✓ | Cancel booking |
| PATCH | `/:id/payment` | Admin | Update payment status |
| GET | `/` | Admin | All bookings (paginated) |

### Admin — `/api/admin` *(admin only)*

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Full snapshot (revenue + expiry + occupancy) |
| GET | `/revenue/monthly` | Current month revenue |
| GET | `/memberships/expiring-soon` | Expiring within N days |
| POST | `/memberships/send-reminders` | Batch send renewal emails |
| GET | `/occupancy` | Occupancy % for a shift on a date |
| GET | `/seats` | All seats |
| POST | `/seats` | Create a seat |
| PATCH | `/seats/:id` | Update a seat |
| GET | `/users` | All students (paginated, searchable) |
| PATCH | `/users/:id/deactivate` | Deactivate a student |

### Seats & Shifts — `/api/seats`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | All active seats |
| GET | `/shifts` | ✓ | All shifts |

---

##  Authentication Flow

```
POST /api/auth/login
    → { accessToken (15 min), refreshToken (7 days), user }

Every API request:
    Authorization: Bearer <accessToken>

On 401 (expired):
    POST /api/auth/refresh  { refreshToken }
    → { new accessToken, new refreshToken }   ← token rotation
```

The Axios client in `frontend/src/services/api.js` handles refresh automatically.

---

##  Deployment

### Backend (Railway / Render / Fly.io)

1. Set all `backend/.env` variables as environment variables in your host.
2. Set `NODE_ENV=production`.
3. Deploy `backend/` directory.
4. Run the seeder once: `npm run seed`.

### Frontend (Vercel / Netlify)

1. Set `VITE_API_BASE_URL=https://your-backend-url.com/api`.
2. Build: `npm run build` (output in `frontend/dist/`).
3. Point the host to `frontend/dist/`.

---

##  Database Schema Summary

```
User       { name, email, phone, role, passwordHash, refreshToken, isActive }
Shift      { name, startTime, endTime, priceMultiplier }
Seat       { label, row, number, section, baseMonthlyPrice, amenities, isActive }
Booking    { user→, seat→, shift→, startDate, endDate, durationType,
             totalAmount, paymentStatus, paidAt, status, cancelledAt }
```

**Conflict detection index:** `{ seat, shift, startDate, endDate }` — the availability query uses `startDate ≤ reqEnd AND endDate ≥ reqStart` (overlap condition) and wraps booking creation in a MongoDB session to prevent race conditions.

---

##  Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

##  License

MIT — free to use for personal and commercial projects.
