# Backend project structure

Clean, scalable layout: **MVC** + **config**, **services**, **repositories**, **middleware**, **validation**. See **ARCHITECTURE.md** for full explanation and best practices.

```
backend/
│
├── src/
│   ├── config/
│   │   ├── index.js          # Environment-based config (NODE_ENV, port, CORS, DB, JWT, etc.)
│   │   └── db.js             # PostgreSQL pool; uses config
│   │
│   ├── controllers/          # MVC — HTTP only
│   │   ├── adminController.js
│   │   └── contactController.js
│   │
│   ├── services/             # Business logic
│   │   ├── authService.js
│   │   ├── contactService.js
│   │   └── mailService.js
│   │
│   ├── repositories/         # Data access (SQL only)
│   │   ├── adminRepository.js
│   │   └── contactRepository.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   │
│   ├── validators/
│   │   ├── adminValidator.js
│   │   └── contactValidator.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   └── contactRoutes.js
│   │
│   ├── utils/
│   │   └── logger.js         # Env-aware logger
│   │
│   └── app.js
│
├── scripts/
│   └── create-admin.js
│
├── sql/
│   └── schema.sql
│
├── docs/
│   ├── ARCHITECTURE.md       # Full architecture, layers, best practices
│   ├── DEPLOYMENT.md
│   ├── PROJECT_STRUCTURE.md  # This file
│   ├── ADMIN_AUTH.md
│   └── EMAIL_SETUP.md
│
├── .env.example
├── package.json
├── server.js
└── README.md
```

## Flow

Request → **app.js** (security, morgan, rate limit) → **Route** → **Validation** → **Auth** (if protected) → **Controller** → **Service** (business logic) → **Repository** (DB). Errors → **errorHandler**.
