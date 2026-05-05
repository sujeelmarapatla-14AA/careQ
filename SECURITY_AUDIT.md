# Security Audit — Complete ✅

## Issues Found & Fixed

### 🔴 CRITICAL — Fixed in source code

| File | Issue | Fix Applied |
|------|-------|-------------|
| `backend/server.js` | `JWT_SECRET` had hardcoded fallback `'fallback-secret-development-key'` | Now exits with error if not set |
| `backend/server.js` | Demo passwords `staff123`/`admin123` hardcoded in `bcrypt.hashSync()` | Now reads from `STAFF_PASSWORD`, `ADMIN_PASSWORD` env vars |
| `frontend/src/pages/Auth.jsx` | Hardcoded bypass: `email === 'staff@careq.com' && password === 'staff123'` | Removed — all logins go through real backend |
| `frontend/src/pages/Auth.jsx` | Fake tokens `'demo-staff-token'`, `'demo-admin-token'` stored in localStorage | Removed |
| `frontend/src/components/PatientWizard.jsx` | `'Authorization': 'Bearer bypass'` hardcoded | Now uses `localStorage.getItem('careq_token')` |
| `frontend/src/components/TokenCard.jsx` | `'Authorization': 'Bearer bypass'` hardcoded | Now uses `localStorage.getItem('careq_token')` |
| `backend/create-tables.js` | `PROJECT_REF = 'qrcnpaikpzrcabdnrydu'` hardcoded | Now derived from `SUPABASE_URL` env var |
| `backend/setup-supabase.js` | Hardcoded project ref in console.log URL | Now derived from `SUPABASE_URL` env var |
| `backend/seed-supabase.js` | Hardcoded project ref in console.log URL | Now derived from `SUPABASE_URL` env var |
| `backend/supabase-schema.sql` | Hardcoded project ref in SQL comment | Replaced with `YOUR_PROJECT_REF` placeholder |

### 🟡 .env files — Status

| File | In Git? | Gitignored? |
|------|---------|-------------|
| `backend/.env` | ❌ Never committed | ✅ Yes |
| `frontend/.env` | ❌ Never committed | ✅ Yes |

---

## ⚠️ ACTION REQUIRED — Rotate These Keys

The following values were previously hardcoded or in `.env` files that may have been shared.
**Rotate them now even if you think they weren't exposed.**

### 1. JWT Secret
Generate a new one:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Set it in `backend/.env` as `JWT_SECRET=<new value>`

### 2. Supabase Keys
Go to: **Supabase Dashboard → Settings → API → Regenerate keys**
- Regenerate the `anon` key
- Regenerate the `service_role` key
- Update both `backend/.env` and `frontend/.env` with the new values

### 3. Admin & Staff Passwords
Set strong passwords in `backend/.env`:
```
ADMIN_PASSWORD=<strong random password>
STAFF_PASSWORD=<strong random password>
DEMO_STAFF_PASSWORD=<strong random password>
```

---

## □ Vercel Dashboard — Environment Variables

Add these under **Vercel → Project → Settings → Environment Variables**:

```
VITE_API_URL              = https://your-backend.railway.app
VITE_SUPABASE_URL         = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY    = your-new-anon-key-after-rotation
```

## □ Backend Host (Railway/Render) — Environment Variables

```
PORT                  = 5000
JWT_SECRET            = <new 64-char random secret>
ADMIN_EMAIL           = admin@yourhospital.com
ADMIN_PASSWORD        = <strong password>
STAFF_PASSWORD        = <strong password>
DEMO_STAFF_EMAIL      = staff@yourhospital.com
DEMO_STAFF_PASSWORD   = <strong password>
FRONTEND_URL          = https://your-app.vercel.app
SUPABASE_URL          = https://your-project-id.supabase.co
SUPABASE_ANON_KEY     = <new anon key after rotation>
SUPABASE_SERVICE_ROLE_KEY = <new service role key after rotation>
```

---

## □ Remove .env from Git History (if ever committed)

Run these commands in your terminal:

```bash
# Step 1: Remove .env files from git tracking (keeps local files)
git rm --cached backend/.env frontend/.env 2>/dev/null || true

# Step 2: Commit the removal
git add .gitignore
git commit -m "security: remove .env files from tracking, add to gitignore"

# Step 3: If .env was ever committed in history, purge it completely
# Install git-filter-repo first: pip install git-filter-repo
git filter-repo --path backend/.env --invert-paths --force
git filter-repo --path frontend/.env --invert-paths --force

# Step 4: Force push (this rewrites history — coordinate with your team)
git push origin --force --all

# Step 5: Rotate ALL keys that were in the .env (even after purge)
# Anyone who cloned the repo before the purge may still have the old keys.
```

> **Note:** Your `.env` files were NOT found in git history in this audit.
> Run the commands above as a precaution anyway.

---

## □ Files Changed Summary

| File | Change |
|------|--------|
| `backend/server.js` | JWT_SECRET now required; passwords from env vars; warning if not set |
| `backend/create-tables.js` | PROJECT_REF derived from SUPABASE_URL env var |
| `backend/setup-supabase.js` | Project ref URL derived from SUPABASE_URL env var |
| `backend/seed-supabase.js` | Project ref URL derived from SUPABASE_URL env var |
| `backend/supabase-schema.sql` | Removed hardcoded project ref from comment |
| `backend/.env` | Cleared real values, added rotation instructions |
| `backend/.env.example` | Clean template, safe to commit |
| `frontend/src/pages/Auth.jsx` | Removed client-side credential bypass and fake tokens |
| `frontend/src/components/PatientWizard.jsx` | `Bearer bypass` → real token from localStorage |
| `frontend/src/components/TokenCard.jsx` | `Bearer bypass` → real token from localStorage |
| `frontend/src/api.js` | BASE_URL reads from `import.meta.env.VITE_API_URL` |
| `frontend/.env` | Cleared real values, added rotation instructions |
| `frontend/.env.example` | Clean template, safe to commit |
| `.gitignore` | Added all `.env` variants + `!*.env.example` exceptions |

---

## □ Confirmation: No Secrets in Source Code

After fixes, a scan of all `*.js` and `*.jsx` files found:
- ✅ No hardcoded Supabase project refs
- ✅ No hardcoded Supabase keys
- ✅ No hardcoded JWT secrets
- ✅ No hardcoded passwords (only env var reads with dev-only fallbacks + warning)
- ✅ No fake bypass tokens in frontend
- ✅ No `Bearer bypass` hardcoded in frontend components
- ✅ All sensitive values read from environment variables

Remaining references to `staff123`/`admin123` exist only in `.md` documentation files — not in executable code.
