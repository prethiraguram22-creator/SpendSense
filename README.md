# SpendSense — Full-Stack Intelligent Personal Finance Management Platform

SpendSense is a production-ready, full-stack personal finance web application built for college students and young professionals. It pairs the existing modern React frontend with a secure, high-performance Node.js/Express backend, Prisma ORM, and PostgreSQL database with Row-Level Security (RLS) and strict multi-tenant data isolation.

---

## 🏗️ Architecture Overview

```
                                      ┌────────────────────────────────────────┐
                                      │        SpendSense Frontend             │
                                      │   React 18 + Vite + Tailwind CSS       │
                                      │   (Deployed to Vercel)                 │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                        HTTPS / CORS / HttpOnly Cookie + Bearer
                                                         │
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │         SpendSense REST API            │
                                      │   Node.js + Express + Zod + Helmet     │
                                      │   (Deployed to Render)                 │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                                  Prisma Client
                                                         │
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │          PostgreSQL Database           │
                                      │   Prisma Models + RLS + Cascade Deletes│
                                      │   (Render Managed / Supabase / Neon)   │
                                      └────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, React Router v6.
- **Backend**: Node.js, Express, Zod validation, Helmet security headers, cookie-parser, express-rate-limit.
- **Database**: PostgreSQL with Prisma ORM, foreign keys with CASCADE rules, and Row-Level Security (RLS) policies.
- **Authentication**: Bcrypt password hashing (12 rounds), HttpOnly/Secure/SameSite cookies, JWT sessions, single-use expiring password reset tokens.
- **Data Isolation**: Every database query scopes `userId: req.user.id` derived strictly from the server-verified session, preventing IDOR and cross-user data leakage.

---

## 🔒 Security & Data Isolation Measures

1. **Server-Derived Identity**:
   - `req.user.id` is extracted strictly from verified JWT tokens / cookies.
   - Any client-submitted `userId` in request bodies, query strings, or params is rejected or ignored.
2. **Insecure Direct Object Reference (IDOR) Prevention**:
   - Every read, update, and delete query uses compound criteria: `where: { id: recordId, userId: req.user.id }`.
   - Access attempts to other users' records return `404 Not Found` to prevent account probing.
3. **Password Security**:
   - Passwords hashed with `bcryptjs` using 12 salt rounds.
   - Password hashes are never returned by any API endpoint (`select` filtering).
4. **Token Security**:
   - Auth tokens are not stored in `localStorage` to mitigate XSS exposure.
   - Single-use password reset tokens are hashed with SHA-256 before storage in the database and expire in 1 hour.
5. **Rate Limiting**:
   - Strict rate limiting on `/api/auth/login`, `/api/auth/register`, and `/api/auth/forgot-password` to prevent brute force.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & issue HttpOnly cookie/token | No |
| `POST` | `/api/auth/logout` | Invalidate cookie & session | Yes |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |
| `POST` | `/api/auth/forgot-password` | Issue single-use 1-hr password reset token | No |
| `POST` | `/api/auth/reset-password` | Set new password with valid token | No |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/transactions` | List user transactions (supports search, filters, pagination) | Yes |
| `POST` | `/api/transactions` | Record a new income or expense transaction | Yes |
| `GET` | `/api/transactions/:id` | Retrieve single transaction (verifies ownership) | Yes |
| `PATCH` | `/api/transactions/:id` | Update transaction (verifies ownership) | Yes |
| `DELETE` | `/api/transactions/:id` | Delete transaction (verifies ownership) | Yes |
| `GET` | `/api/transactions/export` | Download verified CSV export of user's transactions | Yes |

### Budgets (`/api/budgets`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/budgets?month=YYYY-MM` | List user category budgets with utilization & pace | Yes |
| `POST` | `/api/budgets` | Set new category budget limit | Yes |
| `PATCH` | `/api/budgets/:id` | Update budget amount or threshold | Yes |
| `DELETE` | `/api/budgets/:id` | Remove category budget | Yes |

### Savings Goals (`/api/goals`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/goals` | List user savings goals with mathematical monthly target | Yes |
| `POST` | `/api/goals` | Create a new savings goal | Yes |
| `GET` | `/api/goals/:id` | Retrieve single savings goal | Yes |
| `PATCH` | `/api/goals/:id` | Update goal target or details | Yes |
| `POST` | `/api/goals/:id/contribute` | Add contribution deposit to goal | Yes |
| `DELETE` | `/api/goals/:id` | Delete savings goal | Yes |

### Dashboard & Analytics (`/api/dashboard`, `/api/analytics`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/summary?month=YYYY-MM` | Comprehensive aggregates (balance, trends, insights) | Yes |
| `GET` | `/api/analytics/spending?month=YYYY-MM` | Category distributions & daily velocity | Yes |
| `GET` | `/api/analytics/monthly?months=6` | Historical cash flow trends | Yes |
| `GET` | `/api/health` | Service health status check | No |

### User Profile (`/api/user`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `PATCH` | `/api/user/profile` | Update display name, currency, monthly target | Yes |
| `PATCH` | `/api/user/notifications` | Update notification preferences | Yes |
| `POST` | `/api/user/change-password` | Change password with current password verification | Yes |
| `DELETE` | `/api/user/account` | Permanently wipe account and all records | Yes |

---

## 🧪 Automated Security & Integration Tests

The project includes an automated test suite verifying all 11 security and functionality requirements:
1. User registration, login, logout, and token expiration.
2. 401 Unauthorized handling on unauthenticated calls.
3. User A CRUD isolation.
4. User B cannot retrieve User A transactions (IDOR prevention).
5. User B cannot update User A transactions.
6. User B cannot delete User A transactions.
7. Spoofed `userId` parameters in payloads are completely ignored.
8. Dashboard summaries and charts contain exclusively the authenticated user's data.
9. Budgets and savings goals isolation between distinct accounts.
10. Payload validation with detailed 400 errors on negative/malformed amounts.
11. Single-use and expiration constraints on password reset tokens.

### Run Automated Tests
```bash
npm run test:server
```

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
# Install root/frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment
Copy `.env.example` to `server/.env`:
```bash
# server/.env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/spendsense?schema=public"
JWT_SECRET="spendsense_super_secure_jwt_signing_secret_key_32chars_min"
FRONTEND_URL="http://localhost:5173"
```

### 3. Generate Prisma Client & Run Migrations
```bash
# Generate client
npm run db:generate

# Apply migrations to PostgreSQL
npm run db:migrate
```

### 4. Run Development Servers
```bash
# In terminal 1: Start Backend API server (Port 5000)
npm run dev:server

# In terminal 2: Start Frontend Vite server (Port 5173)
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🚀 Deployment Instructions

### A. Deploy Backend & PostgreSQL to Render

1. **Create a Managed PostgreSQL Database on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) &rarr; **New** &rarr; **PostgreSQL**.
   - Name: `spendsense-db`
   - Plan: Free or Starter
   - Copy the **Internal Database URL** (or External URL).

2. **Deploy the Web Service**:
   - Click **New** &rarr; **Web Service**.
   - Connect your Git repository.
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate --schema=prisma/schema.prisma && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: *(paste your Render PostgreSQL connection string)*
     - `JWT_SECRET`: *(generate random 32-character string)*
     - `FRONTEND_URL`: `https://your-app.vercel.app`
     - `CORS_ORIGINS`: `https://your-app.vercel.app`

3. **Verify Deployment**:
   - Visit `https://your-backend-service.onrender.com/api/health` &rarr; returns `{"status":"healthy"}`.

### B. Deploy Frontend to Vercel

1. **Import Project into Vercel**:
   - Go to [vercel.com](https://vercel.com) &rarr; **Add New Project** &rarr; select `SpendSense`.
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Configure Environment Variables in Vercel**:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api`

3. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend and serve it with `vercel.json` SPA routing.
   - Update `FRONTEND_URL` on Render to match your assigned Vercel URL.
