# Admin authentication

Admin routes are protected by JWT. Passwords are hashed with bcrypt (12 rounds).

## Folder structure (relevant to auth)

```
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js    # login, hashPassword
│   │   └── contactController.js  # getAllContacts, submitContact, deleteContact
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verify → req.user
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── adminRoutes.js        # POST /api/admin/login
│   │   └── contactRoutes.js      # GET/DELETE protected by authenticate
│   ├── validators/
│   │   └── adminValidator.js     # login validation
│   └── app.js
├── scripts/
│   └── create-admin.js           # one-time first admin creation
├── sql/
│   └── schema.sql                # includes admins table
├── .env                          # JWT_SECRET, ADMIN_EMAIL/ADMIN_PASSWORD (one-time)
└── package.json
```

## Endpoints

| Method | Path                 | Auth        | Description                    |
|--------|----------------------|------------|--------------------------------|
| POST   | /api/admin/login     | No         | Email + password → JWT         |
| GET    | /api/contact         | Bearer JWT | List all contact submissions   |
| DELETE | /api/contact/:id     | Bearer JWT | Delete one contact by UUID     |
| POST   | /api/contact         | No         | Submit contact form (public)   |

## Security practices

- **JWT_SECRET:** Long, random string (e.g. `openssl rand -base64 32`). Never commit. Rotate if leaked.
- **Passwords:** Stored only as bcrypt hashes (12 rounds). Never log or return plain passwords.
- **Login response:** Same message for invalid email or invalid password (“Invalid email or password”) to avoid user enumeration.
- **Rate limiting:** 10 login attempts per 15 min per IP on `/api/admin/login`.
- **Token:** Send in header: `Authorization: Bearer <token>`. Default expiry 7 days (`JWT_EXPIRES_IN`).

## Create first admin

1. Run the schema so `admins` table exists.
2. Set in `.env` (or inline for one run): `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Run: `ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npm run create-admin`
4. Remove `ADMIN_PASSWORD` from `.env` and do not commit it.

## Example: list contacts with JWT

```bash
# Login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
# → { "success": true, "token": "eyJ...", "admin": { "id": "...", "email": "..." } }

# List contacts (use token from above)
curl -H "Authorization: Bearer eyJ..." http://localhost:5000/api/contact

# Delete a contact
curl -X DELETE -H "Authorization: Bearer eyJ..." http://localhost:5000/api/contact/<uuid>
```
