# 🔧 CareQ Troubleshooting Guide

## ✅ System Status: OPERATIONAL

Your CareQ system is **fully operational**:
- ✅ Backend running (120 beds loaded)
- ✅ API responding correctly
- ✅ Frontend built successfully
- ✅ Socket.io connected
- ✅ Bed management system ready

---

## 🎯 Quick Fix for "Error" or "Can't Update"

### The Problem
You're seeing errors or can't update beds because your **browser is using old cached JavaScript**.

### The Solution (Takes 5 seconds)

**Step 1: Hard Refresh Your Browser**
- **Windows/Linux**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`

This forces your browser to load the new JavaScript code with the bed control modal.

---

## 📋 Step-by-Step Testing

### 1. Open the Application
```
http://localhost:5000
```

### 2. Hard Refresh (IMPORTANT!)
Press `Ctrl + Shift + R` to clear cache

### 3. Login as Staff
- Email: `staff@careq.com`
- Password: `staff123`

### 4. Navigate to Bed Management
- Click "Staff Dashboard" in navigation
- Scroll down to "Bed Infrastructure Node"
- You should see colored bed squares:
  - 🟢 Green = Available
  - 🔴 Red = Occupied
  - 🟡 Yellow = Maintenance

### 5. Test Bed Control
- **Click any bed** → Modal should open
- **Available beds** → Shows "Assign Patient" form
- **Occupied beds** → Shows patient info + Release/Transfer buttons
- **Maintenance beds** → Shows "Mark as Available" button

---

## 🐛 If Still Not Working

### Check 1: Browser Console
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Look for red errors
4. **Common issues:**
   - "Failed to fetch" → Backend not running
   - "socket.io" errors → Connection issue
   - "undefined" errors → Need hard refresh

### Check 2: Network Tab
1. Press `F12` → Go to "Network" tab
2. Click a bed
3. Look for API calls to `/api/beds/`
4. **If you see calls** → Backend is working
5. **If no calls** → JavaScript not loaded (hard refresh needed)

### Check 3: Run System Check
```powershell
./quick-check.ps1
```

This will verify:
- Backend is running
- API is responding
- Frontend is built
- Beds are loaded

---

## 🔄 Nuclear Option (If Nothing Works)

If hard refresh doesn't work, do a complete cache clear:

### Option 1: Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Time range: "All time"
4. Click "Clear data"
5. Close and reopen browser
6. Go to `http://localhost:5000`

### Option 2: Restart Everything
```powershell
# Stop backend
Get-Process -Name node | Stop-Process -Force

# Rebuild frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
```

Then open browser and hard refresh.

---

## 🎓 Common Error Messages

### "Could not reach server"
**Cause**: Backend not running or wrong port  
**Fix**: Check backend is running on port 5000
```powershell
Get-Process -Name node
```

### "Modal doesn't open when clicking bed"
**Cause**: Old JavaScript cached in browser  
**Fix**: Hard refresh (`Ctrl + Shift + R`)

### "No patients in search"
**Cause**: No patients registered yet  
**Fix**: 
1. Go to Patient Dashboard
2. Register a new patient
3. Get token (e.g., A-005)
4. Now try assigning bed

### "Bed color doesn't change"
**Cause**: Socket.io not connected  
**Fix**: 
1. Check backend console for socket messages
2. Hard refresh browser
3. Check firewall isn't blocking port 5000

---

## ✅ How to Know It's Working

### Visual Indicators:
1. ✅ Beds show with colors (green/red/yellow)
2. ✅ Hovering over bed shows tooltip
3. ✅ Cursor changes to pointer on hover
4. ✅ Clicking bed opens modal immediately

### Functional Tests:
1. ✅ Click available bed → See "Assign Patient" form
2. ✅ Search for patient → Patient list appears
3. ✅ Select patient → Form fills with patient data
4. ✅ Click "Assign" → Success toast appears
5. ✅ Bed changes from green to red
6. ✅ Open another browser tab → See the change

---

## 🚀 Test Workflow

### Test 1: Assign a Bed
1. Register a patient (Patient Dashboard)
2. Go to Staff Dashboard
3. Click a green (available) bed
4. Search for the patient token
5. Select patient from list
6. Choose doctor
7. Add admission notes
8. Click "Assign Bed to Patient"
9. ✅ Should see success toast
10. ✅ Bed should turn red

### Test 2: Release a Bed
1. Click a red (occupied) bed
2. See patient information
3. Click "Release Bed (Discharge Patient)"
4. ✅ Should see success toast
5. ✅ Bed should turn green

### Test 3: Transfer a Patient
1. Click a red (occupied) bed
2. Click "Transfer Patient to Another Bed"
3. Select a green (available) bed from list
4. Click "Transfer Patient"
5. ✅ Old bed turns green
6. ✅ New bed turns red

---

## 📊 System Architecture

### Backend (Port 5000)
- Express.js server
- Socket.io for real-time updates
- 120 beds across 5 wards
- Enhanced bed data structure with patient tracking

### Frontend (React + Vite)
- Built to `frontend/dist/`
- Served by backend at `http://localhost:5000`
- Socket.io client for live updates
- BedAvailability component with modal system

### Real-time Flow
```
User clicks bed
  ↓
Modal opens (frontend)
  ↓
User assigns patient
  ↓
Socket.io emits 'bed:assign'
  ↓
Backend updates bed data
  ↓
Backend broadcasts 'bed:update'
  ↓
All connected clients update UI
```

---

## 🎯 Most Likely Solution

**99% of the time, the fix is:**

```
Press Ctrl + Shift + R in your browser
```

This forces the browser to load the new JavaScript with the bed control modal.

---

## 📞 Still Stuck?

1. Run the system check:
   ```powershell
   ./quick-check.ps1
   ```

2. Check backend console for errors

3. Check browser console (F12) for JavaScript errors

4. Try the test page:
   ```
   Open: test-bed-click.html
   ```

5. Share the error message from browser console

---

## 💡 Pro Tips

- **Always hard refresh** after code changes
- **Check browser console** for errors (F12)
- **Use test page** (`test-bed-click.html`) to verify backend
- **Open multiple tabs** to see real-time updates
- **Check backend console** for socket connection messages

---

**Current Status**: System is ready. Just hard refresh your browser! 🎯
