# SPT Backend API

Production-ready Node.js + Express + PostgreSQL API with environment-based config, centralized error handling, morgan logging, and graceful shutdown.

## Architecture

- **MVC + layers** — Controllers (HTTP) → Services (business logic) → Repositories (data access). Validation and auth in middleware.
- **Config** — `src/config/index.js` (NODE_ENV, port, CORS, DB, JWT, mail, logging). Single source of truth.
- **Central error handler** — `src/middleware/errorHandler.js`; all errors go through it; env-aware messages.
- **Logging** — morgan (HTTP) + `src/utils/logger.js` (app logs); production-safe.
- **Graceful shutdown** — `server.js` handles SIGTERM/SIGINT, closes server and DB pool.

See **docs/ARCHITECTURE.md** for full folder structure, layer responsibilities, and best practices. See **docs/PROJECT_STRUCTURE.md** for a short overview.

## Tech stack

- **Node.js** (ES modules)
- **Express** — web framework
- **PostgreSQL** — database (`pg`)
- **bcrypt** — password hashing
- **jsonwebtoken** — JWT for admin auth
- **express-validator** — request validation
- **helmet** — security headers
- **cors** — cross-origin requests
- **dotenv** — environment config
- **morgan** — HTTP logging
- **express-rate-limit** — rate limiting

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set your values:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/yourdbname

# Email (contact form notifications to servicepathtotechnologies@gmail.com)
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-gmail-app-password

# Admin auth (required for GET /api/contact and DELETE /api/contact/:id)
JWT_SECRET=your-long-random-secret-at-least-32-chars
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password. See **docs/EMAIL_SETUP.md** for step-by-step Gmail App Password setup.

### 3. Database

Create your PostgreSQL database, then run the schema:

```bash
psql -U youruser -d yourdbname -f sql/schema.sql
```

Or run the contents of `sql/schema.sql` in your DB client. The schema includes an `admins` table for admin authentication.

**Create the first admin user (one-time):**

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=your-secure-password npm run create-admin
```

Then remove `ADMIN_PASSWORD` from `.env`. Do not commit credentials.

### 4. Run

```bash
# Development (NODE_ENV=development by default; nodemon)
npm run dev

# Production (set NODE_ENV=production on the host)
npm start
```

Server runs at `http://localhost:5000` (or your `PORT`). Health check: **GET** `/health` returns `{ success: true, message: "OK", env: "development" | "production" }`.

## API

### Health

- **GET** `/health` — returns `{ success: true, message: "OK" }`

### Contact

- **POST** `/api/contact` — submit contact form (public)

**Body (JSON):**

| Field      | Type   | Required | Validation              |
|-----------|--------|----------|-------------------------|
| full_name | string | yes      | min 2 chars              |
| email     | string | yes      | valid email              |
| phone     | string | no       | max 20 chars             |
| company   | string | no       | max 150 chars            |
| message   | string | yes      | min 10 chars             |

**Success (201):**

```json
{
  "success": true,
  "message": "Your message has been received. We will contact you soon."
}
```

**Validation error (400):**

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address." }
  ]
}
```

**Server error (5xx):**

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

- **GET** `/api/contact` — list all submissions (admin only; requires `Authorization: Bearer <token>`). Query: `?limit=100&offset=0`.
- **DELETE** `/api/contact/:id` — delete one submission by UUID (admin only; requires `Authorization: Bearer <token>`). Returns 204 on success, 404 if not found.

### Admin authentication

- **POST** `/api/admin/login`

**Body (JSON):**

| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | yes      |
| password | string | yes      |

**Success (200):**

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "id": "uuid", "email": "admin@example.com" }
}
```

**Invalid credentials (401):** `{ "success": false, "message": "Invalid email or password." }`

Use the returned `token` in the `Authorization` header for protected routes: `Authorization: Bearer <token>`.

## Security

- **helmet** — security headers
- **cors** — configurable via `CORS_ORIGIN`
- **express.json({ limit: "10kb" })** — body size limit
- **express-rate-limit** — 100 requests per 15 min per IP on `/api/`; 10 per 15 min on `/api/admin/login` (brute force protection)
- **JWT** — admin routes protected by Bearer token; store `JWT_SECRET` securely (e.g. `openssl rand -base64 32`)
- **bcrypt** — admin passwords hashed with 12 rounds; never store plain passwords

## Deploy

See **docs/DEPLOYMENT.md** for:

- **Supabase** — Database only; full setup in **../docs/SUPABASE_SETUP.md**
- **Railway** — Deploy the backend; use Supabase for **DATABASE_URL**

Set **NODE_ENV=production** and provide **DATABASE_URL**, **JWT_SECRET**, **CORS_ORIGIN**, and optionally **MAIL_USER**/**MAIL_PASS** on the platform.
