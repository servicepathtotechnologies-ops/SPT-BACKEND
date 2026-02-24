# Production deployment

This guide covers deploying the Node.js + PostgreSQL backend to **Render** and **Railway**, and using **cloud PostgreSQL** (Neon, Supabase, Railway Postgres, Render Postgres).

---

## Environment

- Set **NODE_ENV=production** on the platform (Render and Railway set this automatically for production services).
- All config is read from environment variables; see `.env.example` and **Project folder structure** below.

---

## 1. Cloud PostgreSQL

Use a managed PostgreSQL instance and set **DATABASE_URL** in your app’s environment.

### Option A: Neon

1. Sign up at [neon.tech](https://neon.tech).
2. Create a project and copy the connection string (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. Set **DATABASE_URL** in your app to this string.

### Option B: Supabase

1. Sign up at [supabase.com](https://supabase.com).
2. Create a project → **Settings** → **Database** → **Connection string** (URI).
3. Use the **URI** format; add `?sslmode=require` if needed. Set **DATABASE_URL**.

### Option C: Railway Postgres

1. In [Railway](https://railway.app), create a new project.
2. Click **+ New** → **Database** → **PostgreSQL**.
3. After creation, open the Postgres service → **Variables** → copy **DATABASE_URL** (or **POSTGRES_URL** / **DATABASE_PRIVATE_URL**).
4. Use this as **DATABASE_URL** for your backend service (see Railway steps below).

### Option D: Render Postgres

1. In [Render](https://render.com), **New +** → **PostgreSQL**.
2. Create the database; note **Internal Database URL** (use this for services on Render) or **External Database URL** (for local or other clouds).
3. Set **DATABASE_URL** in your backend service to the Internal (or External) URL.

### After DB is created

1. Run the schema once against the cloud DB:
   - **Local:** `psql "YOUR_DATABASE_URL" -f sql/schema.sql`
   - Or use a GUI (Neon/Supabase/Railway/Render SQL editor) and paste the contents of `sql/schema.sql`.
2. Create the first admin:  
   `ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npm run create-admin`  
   (run from your machine with **DATABASE_URL** set to the cloud URL, or use the platform’s shell if available.)

---

## 2. Deploy to Render

1. **Connect repo**  
   Push your code to GitHub/GitLab and connect the repo to Render.

2. **New Web Service**  
   - **New +** → **Web Service** → select your repo.  
   - **Root Directory:** `backend` (if the backend lives in a `backend` folder).  
   - **Runtime:** Node.  
   - **Build Command:** `npm install` (or leave default).  
   - **Start Command:** `npm start` (runs `node server.js`).

3. **Environment variables** (in the Render dashboard for this service):

   | Variable         | Value / note |
   |------------------|---------------|
   | NODE_ENV         | `production` (often set by Render) |
   | PORT             | Leave default (Render sets this) |
   | DATABASE_URL     | Your cloud PostgreSQL URL (e.g. Render Postgres Internal URL) |
   | JWT_SECRET       | Long random string (e.g. `openssl rand -base64 32`) |
   | CORS_ORIGIN      | Your frontend URL(s), e.g. `https://yoursite.com` (comma-separated if multiple) |
   | MAIL_USER        | Gmail address (for contact form emails) |
   | MAIL_PASS        | Gmail App Password |
   | (optional) REQUEST_SIZE_LIMIT | e.g. `10kb` |

4. **Database (optional on Render)**  
   Add a **PostgreSQL** instance in the same Render account and use its **Internal Database URL** as **DATABASE_URL**.

5. **Deploy**  
   Save; Render builds and starts the service. Use **Logs** to confirm “Server running…” and “[DB] Connection successful.”

6. **Health check**  
   Open `https://your-service.onrender.com/health` — should return `{ "success": true, "message": "OK", "env": "production" }`.

---

## 3. Deploy to Railway

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
   | DATABASE_URL   | From Railway Postgres (see Option C above) or another cloud DB |
   | JWT_SECRET     | Long random string |
   | CORS_ORIGIN    | Frontend URL(s), comma-separated |
   | MAIL_USER      | Gmail address |
   | MAIL_PASS      | Gmail App Password |

   **PORT** is set by Railway; do not override unless required.

5. **PostgreSQL on Railway**  
   Add **PostgreSQL** from **+ New** → **Database** → **PostgreSQL**. In your backend service, add variable **DATABASE_URL** and reference the Postgres variable (e.g. `${{Postgres.DATABASE_URL}}`).

6. **Deploy**  
   Push to the linked branch or deploy from CLI. Check **Deployments** and **Logs** for “Server running…” and “[DB] Connection successful.”

7. **Health check**  
   Open `https://your-service.up.railway.app/health` (or the URL Railway assigns).

---

## 4. Using cloud PostgreSQL (summary)

- **DATABASE_URL** must point to your cloud instance (Neon, Supabase, Railway Postgres, Render Postgres, etc.).
- Use **Internal** URLs when the app runs on the same provider (e.g. Render app → Render Postgres) for lower latency and no egress.
- Use **External** URLs when the app runs elsewhere (e.g. Railway app → Neon DB).
- Most cloud Postgres use **SSL**; this backend enables `ssl: { rejectUnauthorized: true }` in production (see `src/config/db.js`).
- Run `sql/schema.sql` once and create the first admin with `npm run create-admin` (with **DATABASE_URL** and **ADMIN_EMAIL** / **ADMIN_PASSWORD** set).

---

## 5. Post-deploy checklist

- [ ] **NODE_ENV=production** (or equivalent) on the platform.
- [ ] **DATABASE_URL** set and schema + first admin created.
- [ ] **JWT_SECRET** set to a long random value.
- [ ] **CORS_ORIGIN** set to your frontend URL(s).
- [ ] **MAIL_USER** / **MAIL_PASS** set if you use contact form emails.
- [ ] **/health** returns 200 and expected JSON.
- [ ] Contact form and admin login work from the frontend.
