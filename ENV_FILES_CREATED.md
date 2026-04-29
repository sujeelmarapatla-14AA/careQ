# ✅ Environment Files Created for Supabase

## Files Created

### 1. `backend/.env` (Updated)
Contains:
- PORT, JWT_SECRET (existing)
- **SUPABASE_URL** - Your Supabase project URL
- **SUPABASE_ANON_KEY** - Public API key
- **SUPABASE_SERVICE_ROLE_KEY** - Backend-only secret key
- **DATABASE_URL** - PostgreSQL connection string

### 2. `frontend/.env` (New)
Contains:
- **VITE_API_URL** - Backend API URL
- **VITE_SUPABASE_URL** - Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY** - Public API key

### 3. `SUPABASE_SETUP_GUIDE.md` (New)
Complete step-by-step guide with:
- How to create Supabase project
- Where to find your credentials
- SQL schema to create tables
- How to install Supabase client
- Testing instructions
- Security setup
- Troubleshooting

---

## 🎯 What You Need to Do

### Step 1: Get Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (or select existing)
3. Go to **Settings → API**
4. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...`

### Step 2: Update .env Files

#### Backend (.env)
Open `backend/.env` and replace:
```env
SUPABASE_URL=https://xxxxx.supabase.co  # ← Your Project URL
SUPABASE_ANON_KEY=eyJhbGc...  # ← Your anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← Your service_role key
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

#### Frontend (.env)
Open `frontend/.env` and replace:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # ← Your Project URL
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # ← Your anon key
```

### Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the SQL schema from `SUPABASE_SETUP_GUIDE.md` (Step 4.2)
3. Paste and click **Run**
4. Verify tables created in **Table Editor**

### Step 4: Install Supabase Client

```bash
# Backend
cd backend
npm install @supabase/supabase-js

# Frontend
cd frontend
npm install @supabase/supabase-js
```

### Step 5: Restart Servers

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

---

## 📁 File Locations

```
careq/
├── backend/
│   ├── .env  ← Updated with Supabase config
│   └── (create) supabase.js  ← Supabase client
├── frontend/
│   ├── .env  ← New file with Supabase config
│   └── src/
│       └── (create) supabase.js  ← Supabase client
├── SUPABASE_SETUP_GUIDE.md  ← Complete guide
└── ENV_FILES_CREATED.md  ← This file
```

---

## 🔐 Security Notes

### ⚠️ IMPORTANT:
- **NEVER commit .env files to git**
- **service_role key** is SECRET - backend only
- **anon key** is PUBLIC - safe for frontend
- Add `.env` to `.gitignore`

### .gitignore
Make sure these are in your `.gitignore`:
```
backend/.env
frontend/.env
.env
.env.local
```

---

## 🧪 Quick Test

### Test Backend Connection
```bash
cd backend
node -e "require('dotenv').config(); console.log('URL:', process.env.SUPABASE_URL)"
```

Should output your Supabase URL (not "your-project-id")

### Test Frontend Variables
```bash
cd frontend
cat .env
```

Should show your actual credentials (not placeholders)

---

## 📚 Next Steps

1. **Read**: `SUPABASE_SETUP_GUIDE.md` for complete instructions
2. **Get**: Your Supabase credentials from dashboard
3. **Update**: Both .env files with real values
4. **Run**: SQL schema in Supabase SQL Editor
5. **Install**: `@supabase/supabase-js` in both folders
6. **Test**: Connection using guide instructions

---

## 🆘 Need Help?

Check `SUPABASE_SETUP_GUIDE.md` for:
- Detailed step-by-step instructions
- SQL schema for all tables
- Code examples
- Troubleshooting section
- Security setup

---

**Status**: .env files created with placeholders. Replace with your actual Supabase credentials!
