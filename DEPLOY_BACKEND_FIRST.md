# 🚨 URGENT: Deploy Backend First

## Why you're seeing "Server unreachable" errors

Your frontend is live on Vercel: `https://care-q-fgy2.vercel.app`

But your `frontend/.env` has:
```
VITE_API_URL=http://localhost:5000
```

**localhost only works on YOUR computer.** Other devices can't reach it.

---

## ✅ Solution: Deploy Backend to Railway (Free)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (free)

### Step 2: Deploy Backend
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your CareQ repository
4. Railway will ask which folder — select **`backend`**
5. Click **"Deploy"**

### Step 3: Add Environment Variables in Railway
Click **"Variables"** tab and add these one by one:

```
PORT=5000
JWT_SECRET=d1860f559e3f8fe61238a4f8ea10730c66e62c80967e4690ca1ca309e091e1c8ef02f216970c2f9addedb63728d967ce3b3132e8e2b3e63aafcd45cf8ab12df1
ADMIN_EMAIL=admin@careq.com
ADMIN_PASSWORD=d6eb1903965f91c1838a4718e7e97bcd
DEMO_STAFF_EMAIL=staff@careq.com
DEMO_STAFF_PASSWORD=d0b9d23149e6058176da7df72bc047a6
STAFF_PASSWORD=9ec33ff485257b906584868480609a66
FRONTEND_URL=https://care-q-fgy2.vercel.app
SUPABASE_URL=https://qrcnpaikpzrcabdnrydu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_TWn36JbaxGkp3YnEk0-Xpg_sk0OvkR_
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_TWn36JbaxGkp3YnEk0-Xpg_sk0OvkR_
```

### Step 4: Get Your Backend URL
After deployment, Railway will give you a URL like:
```
https://careq-backend-production.up.railway.app
```

Copy that URL.

### Step 5: Update Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add/Update these:

```
VITE_API_URL=https://careq-backend-production.up.railway.app
VITE_SUPABASE_URL=https://qrcnpaikpzrcabdnrydu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_TWn36JbaxGkp3YnEk0-Xpg_sk0OvkR_
```

(Replace `careq-backend-production.up.railway.app` with YOUR actual Railway URL)

### Step 6: Redeploy Frontend
1. In Vercel dashboard, click **"Deployments"**
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

---

## Alternative: Use Render (also free)

If Railway doesn't work, use Render:

1. Go to https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo
5. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Add the same environment variables as above
7. Copy the Render URL (e.g., `https://careq-backend.onrender.com`)
8. Update Vercel's `VITE_API_URL` to that URL
9. Redeploy frontend

---

## ⚠️ Important: Update FRONTEND_URL in Backend

After you get your Railway/Render URL, also update the backend's `FRONTEND_URL` variable to:
```
FRONTEND_URL=https://care-q-fgy2.vercel.app
```

This allows CORS to work properly.

---

## Quick Test After Deployment

Open your phone browser and go to:
```
https://care-q-fgy2.vercel.app/patient
```

Try registering for a queue token. If it works, you'll see a token like `A-001`.

If you still see "Server unreachable", check:
1. Backend is running on Railway/Render (check the logs)
2. `VITE_API_URL` in Vercel points to the correct backend URL
3. `FRONTEND_URL` in Railway/Render includes your Vercel URL
