# 🚀 CareQ - Quick Reference Card

## 🟢 SYSTEM STATUS
**Backend**: ✅ Running on port 5000  
**Frontend**: ✅ Ready at http://localhost:5173  
**Database**: ✅ SQLite connected  
**Real-time**: ✅ Socket.IO active  

---

## 🔐 LOGIN CREDENTIALS

| Portal | Email | Password |
|--------|-------|----------|
| **Staff** | staff@careq.com | staff123 |
| **Admin** | admin@careq.com | admin123 |
| **Patient** | No login required | - |

---

## 🏥 BED SUMMARY

| Ward | Beds | Available | Occupied |
|------|------|-----------|----------|
| General | 40 | 12 | 26 |
| ICU | 20 | 4 | 15 |
| Emergency | 25 | 6 | 19 |
| Pediatrics | 15 | 5 | 9 |
| Maternity | 20 | 8 | 11 |
| **TOTAL** | **120** | **35** | **80** |

---

## 🎯 QUICK WORKFLOWS

### Register Patient
1. Go to Patient Portal
2. Fill form (name, age, gender, phone, symptoms)
3. Click "Register"
4. Get token (e.g., A-003)

### Assign Bed
1. Login to Staff Portal
2. Click patient in queue
3. Review details in modal
4. Click "Select & Assign to Bed"
5. Click available bed (green)
6. Done! ✅

### Release Bed
1. Click occupied bed (red)
2. Click "Release Bed"
3. Done! ✅

---

## 📁 KEY FILES

### Backend
- `backend/server.js` - Main server (955 lines)
- `backend/database.js` - SQLite schema
- `backend/resource-api.js` - Phase 2 API
- `backend/.env` - Environment config

### Frontend
- `frontend/src/pages/StaffDashboard.jsx` - Staff portal
- `frontend/src/pages/PatientDashboard.jsx` - Patient portal
- `frontend/src/components/BedAvailability.jsx` - Bed UI
- `frontend/.env` - Environment config

---

## 🔧 COMMANDS

### Start Backend
```bash
cd backend
npm start
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Test Backend
```bash
cd backend
node test-supabase.js  # Test Supabase connection
```

---

## 🌐 API ENDPOINTS

### Patient Queue
- `POST /api/queue/register` - Register patient
- `GET /api/queue` - Get all patients
- `GET /api/patient/:token` - Get patient by token
- `PATCH /api/queue/:id` - Update patient status

### Bed Management
- `GET /api/beds` - Get all beds
- `GET /api/beds/:bedId` - Get bed details
- `PATCH /api/beds/:id` - Update bed
- Socket: `bed:assign`, `bed:release`, `bed:transfer`

### Resources (Phase 2)
- `GET /api/resources` - List resources
- `POST /api/assign-resource` - Assign resource
- `POST /api/release-resource` - Release resource
- `GET /api/slots` - Get time slots
- `POST /api/book-slot` - Book slot

---

## 🔄 SOCKET.IO EVENTS

### Listen For
- `patient:new` - New patient
- `queueUpdate` - Queue changed
- `bedsUpdate` - Beds changed
- `bed:update` - Bed updated
- `stats:update` - Stats updated

### Emit
- `bed:assign` - Assign bed
- `bed:release` - Release bed
- `bed:transfer` - Transfer patient
- `bed:maintenance` - Maintenance mode

---

## 📊 RESOURCES (Phase 2)

### Available Resources (14 total)
- **Consultation Rooms**: 3
- **MRI Machines**: 2 (slot-based)
- **X-Ray Machines**: 2 (slot-based)
- **CT Scanner**: 1 (slot-based)
- **ICU Units**: 2 (Cardiac, Neuro)
- **Equipment**: 4 (Ventilators, Wheelchairs)

---

## 🗄️ DATABASE TABLES

1. `users` - Authentication
2. `queue_tokens` - Patient queue
3. `beds` - Bed tracking
4. `resources` - Resources
5. `resource_slots` - Time slots
6. `resource_assignments` - Assignments
7. `activity_log` - Audit trail
8. `authorized_domains` - Domains

---

## 🔐 SUPABASE SETUP (Optional)

### Status
✅ Environment files ready  
✅ Setup guide created  
✅ SQL schema prepared  
⏳ Waiting for credentials  

### Quick Setup (15 min)
1. Get credentials from https://app.supabase.com
2. Update `backend/.env` and `frontend/.env`
3. Run SQL schema in Supabase SQL Editor
4. Install: `npm install @supabase/supabase-js`
5. Create client files (see guide)
6. Test connection

**See**: `SUPABASE_SETUP_GUIDE.md` for details

---

## 📚 DOCUMENTATION

| File | Description |
|------|-------------|
| `SYSTEM_STATUS.md` | Complete system overview |
| `SUPABASE_READY_STATUS.md` | Supabase integration status |
| `SUPABASE_SETUP_GUIDE.md` | Step-by-step Supabase setup |
| `PHASE2_BACKEND_COMPLETE.md` | Phase 2 API documentation |
| `STAFF_BED_CONTROL_COMPLETE.md` | Bed management guide |
| `PATIENT_DETAILS_MODAL.md` | Patient modal implementation |
| `BED_ASSIGNMENT_WORKFLOW.md` | Assignment workflow |

---

## 🆘 TROUBLESHOOTING

### Backend not starting?
```bash
cd backend
npm install
npm start
```

### Frontend not loading?
```bash
cd frontend
npm install
npm run build
npm run dev
```

### Port 5000 already in use?
- Change `PORT=5000` in `backend/.env`
- Update `VITE_API_URL` in `frontend/.env`

### Socket.IO not connecting?
- Check backend is running
- Check browser console (F12)
- Hard refresh (Ctrl+Shift+R)

### Beds not updating?
- Check Socket.IO connection
- Restart backend server
- Hard refresh browser

---

## ✅ FEATURE CHECKLIST

- ✅ Patient registration with token
- ✅ Real-time queue updates
- ✅ 120 beds across 5 wards
- ✅ Bed assignment workflow
- ✅ Patient details modal
- ✅ Bed release/transfer
- ✅ Maintenance mode
- ✅ Phase 2 resources (14)
- ✅ Activity logging
- ✅ Real-time Socket.IO
- ✅ Supabase ready

---

## 🎉 READY TO USE!

**Your system is fully operational. Start using it now!**

**Need Supabase?** See `SUPABASE_SETUP_GUIDE.md`  
**Need help?** Check `SYSTEM_STATUS.md`  
**Want details?** Read documentation files  

**Happy coding! 🚀**
