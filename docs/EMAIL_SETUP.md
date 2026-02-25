# Email setup (Gmail with Nodemailer)

Contact form submissions are saved in PostgreSQL and a notification email is sent to the admin (**servicepathtotechnologies@gmail.com** by default). Email is sent **in the background** so the API responds immediately for a fast user experience. If email fails (e.g. wrong credentials), the API still returns success as long as the database insert succeeds.

---

## Required `.env` variables (backend, e.g. on Render)

| Variable     | Required | Description |
|-------------|----------|-------------|
| `MAIL_USER` | Yes      | Gmail address used to send (e.g. `servicepathtotechnologies@gmail.com`) |
| `MAIL_PASS` | Yes      | Gmail **App Password** (not your normal Gmail password) |
| `MAIL_HOST` | No       | Default: `smtp.gmail.com` |
| `MAIL_PORT` | No       | Default: `587` |
| `MAIL_SECURE` | No     | Default: `false` (use `true` for port 465) |
| `MAIL_FROM` | No        | From address (default: same as `MAIL_USER`) |
| `MAIL_FROM_NAME` | No    | Display name (e.g. "Service Path Technologies") |
| `NOTIFICATION_EMAIL` | No | Recipient for contact/demo emails (default: servicepathtotechnologies@gmail.com) |

**Minimal working example (Render / production):**

```env
MAIL_USER=servicepathtotechnologies@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx
NOTIFICATION_EMAIL=servicepathtotechnologies@gmail.com
```

Set these in Render: **Dashboard → Your Service → Environment**.

---

## How to configure Gmail App Password

Gmail requires an **App Password** when using Nodemailer (or any third‑party app). Your normal account password will not work.

### Step 1: Enable 2-Step Verification

1. Go to [Google Account](https://myaccount.google.com/) → **Security**.
2. Under **How you sign in to Google**, click **2-Step Verification**.
3. Turn it **On** and complete the steps (phone, backup codes, etc.).

### Step 2: Create an App Password

1. In [Google Account](https://myaccount.google.com/) → **Security**.
2. Under **How you sign in to Google**, click **2-Step Verification** (you must have it on).
3. At the bottom, click **App passwords**.
4. Select app: **Mail** (or **Other** and type e.g. "SPT Backend").
5. Select device: **Other** and type e.g. "SPT Contact API".
6. Click **Generate**.
7. Copy the **16-character password** (spaces are optional; the app will accept with or without).

### Step 3: Set on Render (or in `.env` locally)

On **Render**: Dashboard → your backend service → **Environment** → Add:

- `MAIL_USER` = `servicepathtotechnologies@gmail.com` (the Gmail that has 2-Step Verification and the App Password)
- `MAIL_PASS` = the 16-character App Password (no spaces needed)
- `NOTIFICATION_EMAIL` = `servicepathtotechnologies@gmail.com` (optional; this is the default)

Use the same Gmail for `MAIL_USER` that you used to create the App Password. Do **not** commit secrets to git.

---

## Security notes

- **Never commit** `MAIL_USER` or `MAIL_PASS` to version control. Use `.env` and keep it in `.gitignore`.
- Use **App Passwords**, not your main Gmail password.
- On production (Railway, etc.), set `MAIL_USER` and `MAIL_PASS` in the platform’s environment variables, not in code.
- If `MAIL_USER` or `MAIL_PASS` is missing, the API still works; it only skips sending the notification and logs a warning.

---

## Optional: run without email

If you leave `MAIL_USER` and `MAIL_PASS` unset or empty, the API will:

- Still save submissions to PostgreSQL.
- Still return `201` on success.
- Log: `Mail not configured (MAIL_USER/MAIL_PASS missing). Skipping contact notification.`

No email will be sent until you add valid credentials to `.env`.
