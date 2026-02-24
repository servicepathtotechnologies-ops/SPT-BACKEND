# Deploy SPT Backend to Render — Step by Step

Frontend is live at **https://spt-frontend-sable.vercel.app/**. Follow these steps to deploy the backend to Render so the site can use the API.

---

## Prerequisites

- GitHub repo pushed: **https://github.com/servicepathtotechnologies-ops/SPT-BACKEND**
- A Render account: [render.com](https://render.com) (sign up with GitHub)

---

## Render database connection (reference)

After the database is created (Step 1), use these for schema and admin tasks:

| Use | Value |
|-----|--------|
| **External Database URL** | `postgresql://spt:yyUZ5pyOOZR0rVuq2QASGqlxNvgELorx@dpg-d6ejq388tnhs73bboh20-a.oregon-postgres.render.com/spt_enp5` (store the full URL with password in env only; never commit it). |
| **Database name** | `spt_enp5` |
| **psql via Render CLI** | `render psql dpg-d6ejq388tnhs73bboh20-a` (opens an interactive psql session; requires [Render CLI](https://render.com/docs/cli) and `render login`). |

For the Web Service (Step 4), use the **Internal Database URL** from the Render dashboard so the backend talks to the DB inside Render’s network.

---

## Step 1: Create a PostgreSQL database on Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Set:
   - **Name:** e.g. `spt-db`
   - **Database:** e.g. `spt`
   - **User:** e.g. `spt`
   - **Region:** choose closest to your users (e.g. Oregon).
   - **Plan:** Free (or paid if you need more).
4. Click **Create Database**.
5. Wait until the DB is **Available**.
6. Open the database → **Info** (or **Connections**):
   - Copy **Internal Database URL** (use this for the backend service on Render).
   - Keep **External Database URL** if you need to run migrations from your PC later.

---

## Step 2: Run the database schema (one-time)

You must create tables in the new database.

**Free tier:** Render’s free Web Service plan does **not** include Shell. Use **Option B** (from your PC) or **Option D** (Render Postgres SQL tab) to run the schema.

**Option A — Using Render Shell (paid plans only)**  
Open your **Web Service** → **Shell** and run (DATABASE_URL is already set):

```bash
psql $DATABASE_URL -f sql/schema.sql
```

**Option B — From your PC (psql + External URL)** — recommended if you don’t have Shell

1. Install [psql](https://www.postgresql.org/download/windows/) (or use “Command Line Tools” from the PostgreSQL installer) so `psql` is on your PATH.
2. Open a terminal in the repo and run from the `backend` folder.

**PowerShell (Windows):** Use **two separate commands**. `set VAR=value` does *not* set env vars in PowerShell, so psql would otherwise connect to localhost.

```powershell
cd backend
$env:DATABASE_URL = "postgresql://spt:yyUZ5pyOOZR0rVuq2QASGqlxNvgELorx@dpg-d6ejq388tnhs73bboh20-a.oregon-postgres.render.com/spt_enp5"
psql $env:DATABASE_URL -f sql/schema.sql
```

Or pass the URL directly in one go (replace `YOUR_PASSWORD` with your real password):

```powershell
cd backend
psql "postgresql://spt:yyUZ5pyOOZR0rVuq2QASGqlxNvgELorx@dpg-d6ejq388tnhs73bboh20-a.oregon-postgres.render.com/spt_enp5" -f sql/schema.sql
```

**CMD (Windows):** Run on **separate lines** so the variable is set before psql runs:

```cmd
cd backend
set DATABASE_URL=postgresql://spt:YOUR_PASSWORD@dpg-d6ejq388tnhs73bboh20-a.oregon-postgres.render.com/spt_enp5
psql "%DATABASE_URL%" -f sql/schema.sql
```

**Linux/macOS:** `export DATABASE_URL="..."` then `psql "$DATABASE_URL" -f sql/schema.sql`.

**Option C — Render CLI psql**

1. Install the [Render CLI](https://render.com/docs/cli) and run `render login`.
2. Open a psql session: `render psql dpg-d6ejq388tnhs73bboh20-a`.
3. In the interactive psql session, paste and run the contents of `backend/sql/schema.sql`.

**Option D — Render Postgres SQL tab**  
In the Render dashboard, open your Postgres service → **Connect** or **Info**. If your plan has a SQL tab, paste and run `sql/schema.sql` there.

---

## Step 3: Create the Web Service (backend API)

1. In Render Dashboard, click **New +** → **Web Service**.
2. **Connect repository:**
   - If not connected: **Connect account** (GitHub) and authorize Render.
   - Select repo: **servicepathtotechnologies-ops/SPT-BACKEND**.
3. Configure the service:
   - **Name:** e.g. `spt-backend`
   - **Region:** same as DB (e.g. Oregon).
   - **Branch:** `main`
   - **Root Directory:** leave **empty** (the repo root is the backend).
   - **Runtime:** **Node**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid).

4. Click **Advanced** and add:
   - **Health Check Path:** `/health`  
     (Render will ping this to know the app is up.)

5. Do **not** create the service yet — add environment variables first (Step 4).

---

## Step 4: Add environment variables

In the same **Web Service** setup page, scroll to **Environment** and add:

| Key            | Value | Notes |
|----------------|-------|--------|
| `NODE_ENV`     | `production` | Often auto-set by Render; add if missing. |
| `PORT`         | *(leave blank)* | Render sets this automatically. |
| `DATABASE_URL` | *(Internal Database URL from Step 1)* | From your Render Postgres **Internal** URL. |
| `JWT_SECRET`   | Long random string | e.g. run `openssl rand -base64 32` and paste. |
| `CORS_ORIGIN`  | `https://spt-frontend-sable.vercel.app` | Your frontend URL (no trailing slash). Add more comma-separated if you have other origins. |
| `MAIL_USER`    | Your Gmail address | For contact form emails. |
| `MAIL_PASS`    | Gmail App Password | [Create one](https://support.google.com/accounts/answer/185833); do not use your normal password. |

Then click **Create Web Service**. Render will build and deploy.

---

## Step 5: Create the first admin user (one-time)

After the first successful deploy:

1. Open the **Web Service** → **Shell** (or use **Manual Deploy** with a one-off command if your plan supports it).
2. In Shell, with `DATABASE_URL` already set:

```bash
ADMIN_EMAIL=admin@yourcompany.com ADMIN_PASSWORD=YourSecurePassword123 npm run create-admin
```

3. Remove the password from your memory/env; use it only to log in to the admin (e.g. from the frontend).

If Render does not offer a shell, run the same command **locally** with `DATABASE_URL` set to the **External Database URL** (see **Render database connection** at the top):

```bash
cd backend
set DATABASE_URL=postgresql://spt:YOUR_PASSWORD@dpg-d6ejq388tnhs73bboh20-a.oregon-postgres.render.com/spt_enp5
set ADMIN_EMAIL=admin@yourcompany.com
set ADMIN_PASSWORD=YourSecurePassword123
npm run create-admin
```

---

## Step 6: Verify deployment

1. **Logs:** In the Web Service → **Logs**, look for:
   - `Server running on port ... (NODE_ENV=production)`
   - `[DB] Connection successful` (or similar from your app).

2. **Health check:** Open in a browser:
   - `https://<your-service-name>.onrender.com/health`  
   You should see something like:  
   `{ "success": true, "message": "OK", "env": "production" }`

3. **Frontend:** In Vercel, set **`BACKEND_URL`** to your Render URL (see Step 7).

---

## Step 7: Point the frontend to the backend

Your frontend uses **`BACKEND_URL`** for the API (contact form, admin login, demos, leads).

In your **Vercel** project (SPT frontend):

1. **Settings** → **Environment Variables**.
2. Add (or update):
   - **Key:** `BACKEND_URL`
   - **Value:** `https://<your-render-service-name>.onrender.com` (no trailing slash)
   - Apply to **Production** (and Preview if you want).
3. **Redeploy** the frontend so it uses the new variable.

The backend will accept requests from `https://spt-frontend-sable.vercel.app` because you set `CORS_ORIGIN` in Step 4.

---

## Summary checklist

- [ ] Render Postgres created (e.g. instance ID `dpg-d6ejq388tnhs73bboh20-a`, database `spt_enp5`); **Internal Database URL** copied for the Web Service.
- [ ] Schema applied once (`sql/schema.sql`) via Render Shell, `psql` + External URL, `render psql dpg-d6ejq388tnhs73bboh20-a`, or Render SQL tab.
- [ ] Web Service created from **SPT-BACKEND** repo; Root Directory empty; Build: `npm install`, Start: `npm start`; Health Check Path: `/health`.
- [ ] Env vars set: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `MAIL_USER`, `MAIL_PASS`.
- [ ] First admin created (`npm run create-admin`).
- [ ] `/health` returns success.
- [ ] Frontend env **`BACKEND_URL`** set to Render URL in Vercel; frontend redeployed.

---

## Troubleshooting

- **Build fails:** Check **Logs** for the build step; ensure **Root Directory** is empty (repo is backend-only).
- **App crashes / DB errors:** Verify `DATABASE_URL` is the **Internal** URL and schema was run.
- **CORS errors from frontend:** Ensure `CORS_ORIGIN` is exactly `https://spt-frontend-sable.vercel.app` (no trailing slash, HTTPS).
- **Free tier spin-down:** Render free web services sleep after inactivity; first request may be slow (cold start).

For more options (Neon, Railway, etc.) see **DEPLOYMENT.md**.
