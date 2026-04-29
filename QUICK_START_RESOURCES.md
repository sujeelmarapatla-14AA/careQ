# 🚀 Quick Start - Resource Management System

## Start the System

### 1. Start Backend
```bash
cd backend
node server.js
```

Expected output:
```
Ultimate Node.js API + Socket.io Server active on port 5000
✅ Phase 2 Resource Management API loaded
[DB] Seeded comprehensive hospital resources (61 resources across 8 categories)
```

### 2. Access Staff Portal
- URL: `http://localhost:5000`
- Login: `staff@careq.com` / `staff123`
- Click **"Resource Availability"** tab

---

## Test the System

### Quick API Test
```powershell
./test-resources-simple.ps1
```

Expected: `SUCCESS: Retrieved 61 resources`

---

## Use the System

### View Resources
1. Login to Staff Portal
2. Click **"Resource Availability"** tab
3. Browse 8 categories with 61 resources

### Update Resource
1. Find resource card
2. Click **"Edit"** button
3. Enter new occupied count
4. Click **"Save"**
5. Watch real-time update!

### Monitor Real-time
1. Open 2 browser windows
2. Edit in Window 1
3. See instant update in Window 2

---

## Resource Categories

| Category | Count | Examples |
|----------|-------|----------|
| Beds | 7 | General, ICU, Emergency |
| Diagnostic | 11 | X-Ray, MRI, CT, Ultrasound |
| OT | 9 | Major OT, Minor OT, Dialysis |
| OPD | 10 | Cardiology, Neurology, Pediatrics |
| Critical | 12 | Ventilators, Oxygen, Blood Bank |
| Ambulance | 4 | 2 ALS, 2 BLS vehicles |
| Pharmacy | 5 | Antibiotics, Pain Mgmt, Cardiac |
| Support | 3 | Wheelchairs, Stretchers, Cafeteria |

**Total: 61 resources**

---

## Status Colors

- 🟢 **GREEN** (≥80% available) - Fully available
- 🟡 **YELLOW** (20-79% available) - Limited
- 🔴 **RED** (<20% available) - Full/Critical
- ⚪ **GRAY** - Maintenance/Offline

---

## Key Files

- `backend/database.js` - Resource seeding
- `backend/resource-api.js` - API endpoints
- `frontend/src/components/ResourceDashboard.jsx` - UI component
- `COMPREHENSIVE_RESOURCE_SYSTEM.md` - Full documentation

---

## Troubleshooting

### Backend not starting?
```bash
cd backend
npm install
node server.js
```

### Frontend not loading?
```bash
cd frontend
npm run build
```

### Database issues?
```bash
# Delete and recreate
rm backend/careq.db
node backend/server.js
```

---

## Next Steps

✅ System is ready for use!  
✅ Add more resources via API  
✅ Customize categories  
✅ Integrate with existing systems  

---

**Need help?** Check `COMPREHENSIVE_RESOURCE_SYSTEM.md` for full documentation.
