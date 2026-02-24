# Production deployment

This guide covers using **Supabase** as the database and deploying the Node.js backend to **Railway** (or another host). The project uses **Supabase only** for PostgreSQL.

---

## Environment

- Set **NODE_ENV=production** on the platform (Railway and similar set this automatically for production services).
- All config is read from environment variables; see `.env.example` and **Project folder structure** below.

---

## 1. Database: Supabase

Use **Supabase** as your PostgreSQL database. Follow the full setup in the repo:

- **[Supabase Setup Guide](../../docs/SUPABASE_SETUP.md)** — create project, run schema, get connection string, set `DATABASE_URL` and `DATABASE_SSL`.

Summary:

1. Create a project at [supabase.com](https://supabase.com) and note your database password.
2. In Supabase **SQL Editor**, paste and run the contents of `backend/sql/schema.sql` (creates `contacts`, `demos`, `admins`).
3. In **Project Settings** → **Database**, copy the **URI** connection string. Replace `[YOUR-PASSWORD]` with your database password.
4. Set in your app environment:
   - **DATABASE_URL** = that URI (with `?sslmode=require` if needed).
   - **DATABASE_SSL** = `true` (recommended for Supabase).

Create the first admin (local or on the host):

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npm run create-admin
```

Run with **DATABASE_URL** set to your Supabase connection string.

---

## 2. Deploy backend to Railway

1. **Connect repo**  
   Install [Railway CLI](https://docs.railway.app/develop/cli) or use the GitHub integration; connect your repo.

2. **New project**  
   Create a new project; add a **Service** from your repo.

3. **Configure service**  
   - **Root Directory:** `backend` (if backend is in a subfolder).  
   - **Build Command:** `npm install`.  
   - **Start Command:** `npm start` (or `node server.js`).  
   - **Watch Paths:** leave default or set to `backend` if needed.

4. **Environment variables** (Railway dashboard → your service → **Variables**):

   | Variable       | Value / note |
   |----------------|---------------|
   | NODE_ENV       | `production` (Railway may set this) |
   | DATABASE_URL   | Your **Supabase** connection string (URI with password) |
   | DATABASE_SSL   | `true` (for Supabase) |
   | JWT_SECRET     | Long random string (e.g. `openssl rand -base64 32`) |
   | CORS_ORIGIN    | Frontend URL(s), comma-separated (e.g. `https://yoursite.com`) |
   | MAIL_USER      | Gmail address (for contact form emails) |
   | MAIL_PASS      | Gmail App Password |

   **PORT** is set by Railway; do not override unless required.

5. **Deploy**  
   Push to the linked branch or deploy from CLI. Check **Deployments** and **Logs** for “Server running…” and “[DB] Connection successful.”

6. **Health check**  
   Open `https://your-service.up.railway.app/health` (or the URL Railway assigns) — should return `{ "success": true, "message": "OK", "env": "production" }`.

---

## 3. Using Supabase (summary)

- **DATABASE_URL** must point to your Supabase instance (from Project Settings → Database → Connection string URI).
- Set **DATABASE_SSL=true** (or ensure `?sslmode=require` in the URL) for Supabase.
- Run `sql/schema.sql` once in the Supabase SQL Editor, then create the first admin with `npm run create-admin` (with **DATABASE_URL**, **ADMIN_EMAIL**, **ADMIN_PASSWORD**).

---

## 4. Post-deploy checklist

- [ ] **NODE_ENV=production** (or equivalent) on the platform.
- [ ] **DATABASE_URL** set to Supabase URI; **DATABASE_SSL=true**.
- [ ] Schema applied in Supabase (SQL Editor) and first admin created.
- [ ] **JWT_SECRET** set to a long random value.
- [ ] **CORS_ORIGIN** set to your frontend URL(s).
- [ ] **MAIL_USER** / **MAIL_PASS** set if you use contact form emails.
- [ ] **/health** returns 200 and expected JSON.
- [ ] Contact form and admin login work from the frontend.
