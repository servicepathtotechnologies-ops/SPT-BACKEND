# Backend architecture

Production-grade, scalable Node.js + Express + PostgreSQL API using **MVC**, **config**, **services**, **repositories**, **middleware**, **validation**, and **central error handling**.

---

## Full folder structure

```
backend/
│
├── src/
│   ├── config/                    # Configuration layer
│   │   ├── index.js               # Env-based config (NODE_ENV, port, CORS, DB, JWT, mail, logging)
│   │   └── db.js                  # PostgreSQL pool (uses config)
│   │
│   ├── controllers/               # MVC — Controllers (HTTP only)
│   │   ├── contactController.js   # getAllContacts, submitContact, deleteContact
│   │   └── adminController.js    # login
│   │
│   ├── services/                  # Business logic layer
│   │   ├── contactService.js      # submitContact (spam check, persist, send email)
│   │   ├── authService.js         # login, hashPassword
│   │   └── mailService.js         # sendContactNotification (Nodemailer)
│   │
│   ├── repositories/              # Data access layer (SQL only)
│   │   ├── contactRepository.js   # findAll, create, hasRecentByEmail, deleteById
│   │   └── adminRepository.js     # findByEmail, create
│   │
│   ├── middleware/                # Middleware layer
│   │   ├── authMiddleware.js       # JWT verify → req.user
│   │   └── errorHandler.js        # Central error handler (env-aware)
│   │
│   ├── validators/                # Validation layer (express-validator)
│   │   ├── contactValidator.js    # contactValidationRules, listContactValidationRules, validate
│   │   └── adminValidator.js      # loginValidationRules, validateLogin
│   │
│   ├── routes/                    # Route definitions
│   │   ├── contactRoutes.js       # GET /, POST /, DELETE /:id
│   │   └── adminRoutes.js         # POST /login
│   │
│   ├── utils/
│   │   └── logger.js              # Env-aware logger (info, warn, error)
│   │
│   └── app.js                     # Express app: security, logging, rate limit, routes, errorHandler
│
├── scripts/
│   └── create-admin.js            # One-time first admin (uses authService + adminRepository)
│
├── sql/
│   └── schema.sql                 # contacts + admins tables
│
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   ├── DEPLOYMENT.md              # Supabase DB, Railway deploy
│   ├── PROJECT_STRUCTURE.md      # Folder overview
│   ├── ADMIN_AUTH.md              # JWT and create-admin
│   └── EMAIL_SETUP.md             # Gmail App Password
│
├── .env.example
├── .gitignore
├── package.json
├── server.js                      # Entry: dotenv, app listen, graceful shutdown
└── README.md
```

---

## Request flow (MVC + layers)

```
HTTP Request
    → app.js (Helmet, CORS, body limit, morgan, rate limit)
    → Route (e.g. POST /api/contact)
    → Validation middleware (express-validator)  ← Validation layer
    → Auth middleware (if protected)              ← Middleware layer
    → Controller (contactController.submitContact)
    → Service (contactService.submitContact)    ← Business logic
    → Repository (contactRepository.create)      ← Data access
    → DB (PostgreSQL)
    → Service may call mailService (email)
    → Controller sends response
    → If error: next(err) → errorHandler         ← Central error handler
```

---

## Layer responsibilities

### 1. Config (`src/config/`)

- **index.js** — Single source of truth for env: `NODE_ENV`, `server.port`, `database.url`, `cors.allowedOrigins`, `security.requestSizeLimit`, `security.jwtSecret`, `security.jwtExpiresIn`, `mail.*`, `logging.morganFormat`, `shutdown.timeoutMs`. Used by app, db, middleware, services.
- **db.js** — Creates pg Pool with `config.database.url`; enables SSL in production; logs connection success/failure. No business logic.

**Best practice:** No `process.env` outside config (except in `config/index.js` and scripts). Use `config.*` everywhere else.

---

### 2. Controllers (`src/controllers/`)

- **contactController.js** — Handles HTTP only: reads `req.body` / `req.params` / `req.query`, calls repository or service, sends `res.status().json()` or `res.status(204).send()`. Catches errors and passes to `next(err)`.
- **adminController.js** — Same: calls `authService.login(email, password)`, returns token and admin.

**Best practice:** No SQL, no business rules (e.g. “duplicate within 60s”). Only orchestration and HTTP.

---

### 3. Services (`src/services/`)

- **contactService.js** — Business logic for contact submit: normalize input, check duplicate (via repository), create (via repository), send email (mailService). Throws errors with `statusCode` (e.g. 429) for the error handler.
- **authService.js** — Login: find admin (repository), compare password (bcrypt), sign JWT (config). Throws with `statusCode` 401 or 500.
- **mailService.js** — Sends contact notification email (Nodemailer). Uses config/env for credentials. Returns `{ sent, error }`; does not throw so API still succeeds if email fails.

**Best practice:** Services orchestrate repositories and other services. No HTTP (req/res). Throw typed errors (e.g. `err.statusCode = 429`) for the central handler.

---

### 4. Repositories (`src/repositories/`)

- **contactRepository.js** — All contact SQL: `findAll({ limit, offset })`, `create(data)`, `hasRecentByEmail(email, withinSeconds)`, `deleteById(id)`. Returns plain data or throws DB errors.
- **adminRepository.js** — All admin SQL: `findByEmail(email)`, `create({ email, passwordHash })`.

**Best practice:** Only layer that talks to the DB. Parameterized queries only. No business logic.

---

### 5. Middleware (`src/middleware/`)

- **authMiddleware.js** — Reads `Authorization: Bearer <token>`, verifies JWT with `config.security.jwtSecret`, sets `req.user = { id, email }`. Responds 401 on missing/invalid/expired token.
- **errorHandler.js** — Central handler: logs via `logger` (env-aware), maps pg errors and `statusCode` to HTTP status and JSON body. In production hides message for 500.

**Best practice:** All async errors in controllers/services go to `next(err)`. Error handler is the last middleware.

---

### 6. Validation (`src/validators/`)

- **contactValidator.js** — express-validator rules for POST body (full_name, email, phone, company, message) and GET query (limit, offset). `validate` middleware sends 400 with `{ success, message, errors: [{ field, message }] }`.
- **adminValidator.js** — Rules for login (email, password); same `validate` pattern.

**Best practice:** Validation runs before controller. Use `validate` (or `validateContact` / `validateLogin`) after rules so one place formats validation errors.

---

### 7. Routes (`src/routes/`)

- **contactRoutes.js** — GET `/` (authenticate, list validation, getAllContacts), POST `/` (contact validation, submitContact), DELETE `/:id` (authenticate, deleteContact).
- **adminRoutes.js** — POST `/login` (login validation, login).

**Best practice:** Routes only wire middleware + controllers. No logic.

---

### 8. Logging

- **morgan** (in app.js) — HTTP request logging. Format from `config.logging.morganFormat` (`combined` in production, `dev` in development).
- **utils/logger.js** — App-level logs: `logger.info()`, `logger.warn()`, `logger.error()`. In production, error logs avoid leaking stack to stdout.

**Best practice:** Use `logger` in services and middleware instead of `console.*`.

---

### 9. Security (app.js + config)

- **Helmet** — Security headers (CSP, etc.).
- **CORS** — Only origins in `config.cors.allowedOrigins` (or allow all in dev if empty).
- **Request size** — `express.json({ limit: config.security.requestSizeLimit })` (e.g. 10kb).
- **Rate limiting** — General (100/15min), contact (5/1min), admin login (10/15min).
- **JWT** — Stored in config; used in authMiddleware and authService.

**Best practice:** No secrets in code. All from env via config.

---

### 10. Environment config

- **NODE_ENV** — `development` (default) or `production`. Drives CORS, error messages, morgan format, DB SSL.
- **.env** — PORT, DATABASE_URL, CORS_ORIGIN, JWT_SECRET, MAIL_USER, MAIL_PASS, etc. See `.env.example`.

**Best practice:** Use `config.env`, `config.isProduction`, `config.isDevelopment` instead of reading `process.env.NODE_ENV` outside config.

---

### 11. Production readiness

- **Graceful shutdown** (server.js) — SIGTERM/SIGINT close HTTP server and pool; timeout then force exit.
- **Central error handler** — All errors normalized to JSON; 500 message hidden in production.
- **Parameterized queries** — All repository methods use `$1, $2, ...`; no string concatenation.
- **Validation** — express-validator on all inputs; structured error response.
- **Auth** — JWT with expiry; same message for invalid email/password (no user enumeration).

---

## Best practices summary

| Practice | Where |
|----------|--------|
| Single source of config | `config/index.js` |
| No SQL in controllers or services | Repositories only |
| Business logic in services | contactService, authService |
| HTTP only in controllers | Controllers call services/repositories, send res |
| All errors to central handler | `next(err)`; errorHandler last |
| Validate before controller | Validators as middleware |
| Protect routes with auth | authenticate middleware |
| Log with logger | utils/logger in services/middleware |
| Env-based behavior | NODE_ENV and config throughout |
| Graceful shutdown | server.js SIGTERM/SIGINT |

---

## File contents overview

- **server.js** — `dotenv/config`, import app + config + pool, `app.listen(port)`, graceful shutdown (server.close → pool.end), unhandledRejection log.
- **app.js** — express(), helmet, cors(config), express.json(limit), morgan(config), rate limiters, health GET, mount contactRoutes and adminRoutes, 404 handler, errorHandler.
- **config/index.js** — NODE_ENV, isDevelopment, isProduction, config object (server, database, cors, security, mail, logging, shutdown).
- **config/db.js** — Pool from config.database.url, SSL in production, pool.on("error"), startup ping (skip in test).
- **controllers/** — Thin: call service or repository, res.json/send, try/catch next(err).
- **services/contactService.js** — submitContact: normalize, hasRecentByEmail, create, sendContactNotification; throw with statusCode 429 if duplicate.
- **services/authService.js** — login: findByEmail, bcrypt.compare, jwt.sign; hashPassword for script.
- **services/mailService.js** — sendContactNotification(contact), buildContactEmailHtml, createTransporter from env.
- **repositories/contactRepository.js** — findAll, create, hasRecentByEmail, deleteById (all parameterized).
- **repositories/adminRepository.js** — findByEmail, create (ON CONFLICT DO NOTHING).
- **middleware/authMiddleware.js** — Bearer token, jwt.verify(config.security.jwtSecret), req.user.
- **middleware/errorHandler.js** — Log with logger, map pg/429/statusCode, respond JSON; generic 500 in production.
- **validators/** — body/query rules + validate middleware (400 + errors array).
- **routes/** — Router, route definitions with middleware and controller.
- **utils/logger.js** — info, warn, error; production-safe error logging.

This layout is **scalable**: add new resources by adding repository → service → controller → routes → validators, without mixing SQL or HTTP in the wrong layer.
