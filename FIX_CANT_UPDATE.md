# 🔧 Fix: Can't Update Beds

## Problem
You can see the beds but clicking them doesn't open the modal or update anything.

## ✅ Solution (3 Steps)

### Step 1: Clear Browser Cache
The browser is loading old JavaScript. You need to force refresh:

**Windows/Linux:**
- Press `Ctrl + Shift + R` (hard refresh)
- Or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`

### Step 2: Verify Backend is Running
The backend was just restarted with the new code. Verify it's working:

```powershell
# Test the API
Invoke-RestMethod -Uri "http://localhost:5000/api/beds/GM-01" -Headers @{"Authorization"="Bearer bypass"}
```

You should see a bed with all fields (patientToken, patientName, history, etc.)

### Step 3: Test the System

**Option A: Use Test Page**
1. Open `test-bed-click.html` in your browser
2. Click "Connect to Backend"
3. Click "Assign Patient to Bed GM-01"
4. Watch the live updates
5. If this works, the backend is fine!

**Option B: Test in Main App**
1. Go to http://localhost:5000
2. Press `Ctrl + Shift + R` to hard refresh
3. Login as staff (staff@careq.com / staff123)
4. Go to Staff Dashboard
5. Scroll to Bed Infrastructure Node
6. Click any bed
7. Modal should open!

## 🐛 If Still Not Working

### Check 1: Is the modal code loaded?
Open browser console (F12) and type:
```javascript
// Check if BedAvailability component has the modal
console.log('Modal check');
```

### Check 2: Are there JavaScript errors?
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for red errors
4. Share the error message

### Check 3: Is Socket.io connected?
In browser console:
```javascript
// This should show socket connection
io('http://localhost:5000').on('connect', () => console.log('Connected!'));
```

## 🎯 Quick Debug Steps

### 1. Check if beds are clickable
Look at the bed squares - when you hover, do they:
- Scale up slightly?
- Show a tooltip?
- Change cursor to pointer?

If NO → The click handler isn't attached (need to rebuild)
If YES → The click handler is there, modal might not be rendering

### 2. Check browser console
Press F12 and look for:
- ❌ Red errors → JavaScript issue
- ⚠️ Yellow warnings → Usually okay
- 🔵 Blue logs → Normal

### 3. Check network tab
1. Press F12
2. Go to Network tab
3. Click a bed
4. Do you see API calls to `/api/beds/`?

If YES → Backend is responding
If NO → Frontend isn't making requests

## 🔥 Nuclear Option (If Nothing Works)

```powershell
# 1. Stop everything
Get-Process -Name node | Stop-Process -Force

# 2. Rebuild frontend
cd frontend
npm run build

# 3. Start backend
cd ../backend
npm start

# 4. Hard refresh browser
# Press Ctrl + Shift + R

# 5. Clear browser data
# In browser: Ctrl + Shift + Delete
# Clear "Cached images and files"
# Time range: "All time"
```

## 📊 Expected Behavior

### When you click a bed:
1. ✅ Modal opens immediately
2. ✅ Shows bed ID and status
3. ✅ Shows appropriate controls based on status:
   - 🟢 Available → "Assign Patient" form
   - 🔴 Occupied → Patient info + Release/Transfer buttons
   - 🟡 Maintenance → "Mark as Available" button

### When you assign a bed:
1. ✅ Patient search works
2. ✅ Selecting patient fills form
3. ✅ Clicking "Assign" shows success toast
4. ✅ Modal closes
5. ✅ Bed color changes to red
6. ✅ All other browsers update

## 🎓 Common Issues

### Issue 1: "Modal opens but no patients in search"
**Solution:** Register a patient first
1. Go to Patient Dashboard
2. Register a new patient
3. Get token (e.g., A-005)
4. Now try assigning bed

### Issue 2: "Bed color doesn't change"
**Solution:** Socket.io not connected
1. Check backend is running
2. Check no firewall blocking port 5000
3. Try test-bed-click.html to verify socket

### Issue 3: "Modal doesn't open at all"
**Solution:** JavaScript not loaded
1. Hard refresh (Ctrl + Shift + R)
2. Check browser console for errors
3. Verify you're logged in as staff
4. Make sure you're on "Arundati Hospital" tab (not partner hospitals)

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Browser hard refreshed (Ctrl + Shift + R)
- [ ] Logged in as staff
- [ ] On "Arundati Hospital" tab
- [ ] No red errors in console
- [ ] Beds show with colors (green/red/yellow)
- [ ] Hovering bed shows tooltip
- [ ] Cursor changes to pointer on hover

If ALL checked → Click should work!

## 🚀 Success Indicators

**You'll know it's working when:**
1. ✅ Click bed → Modal opens
2. ✅ Type in search → Patients appear
3. ✅ Click assign → Success toast shows
4. ✅ Bed changes color immediately
5. ✅ Open another browser → See the change

## 📞 Still Stuck?

Try the test page first:
1. Open `test-bed-click.html`
2. Click "Connect to Backend"
3. Click "Assign Patient"
4. If this works → Main app needs hard refresh
5. If this fails → Backend issue (check console)

## 💡 Pro Tip

**Always hard refresh after code changes:**
- `Ctrl + Shift + R` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

This forces browser to load new JavaScript!

---

**Most likely fix: Just press `Ctrl + Shift + R` in your browser!** 🎯
