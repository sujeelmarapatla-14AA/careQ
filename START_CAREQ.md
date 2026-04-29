# 🚀 Start CareQ - Quick Guide

## ✅ Backend is Already Running!

The backend is currently running in the background. You just need to refresh your browser.

---

## 🎯 Quick Start (3 Steps)

### Step 1: Refresh Browser
Press **`Ctrl + Shift + R`** in your browser

### Step 2: Open Application
Go to: **`http://localhost:5000`**

### Step 3: Login
- Email: **`staff@careq.com`**
- Password: **`staff123`**

---

## 🛏️ Test Bed Management

1. Click **"Staff Dashboard"** in navigation
2. Scroll to **"Bed Infrastructure Node"**
3. **Click any bed** (green/red/yellow squares)
4. Modal should open with bed controls!

### Bed Colors:
- 🟢 **Green** = Available → Click to assign patient
- 🔴 **Red** = Occupied → Click to view/release/transfer
- 🟡 **Yellow** = Maintenance → Click to mark available

---

## 🔧 If Backend Stops

### Start Backend:
```powershell
cd backend
npm start
```

### Or use the batch file:
```
Double-click: start-careq.bat
```

---

## ✅ Verify System

### Quick Check:
```powershell
./quick-check.ps1
```

### Test Page:
```
Open in browser: test-modal.html
```

---

## 📊 Current Status

```
✅ Backend: Running on port 5000
✅ API: Responding
✅ Socket.io: Connected
✅ Beds: 120 beds loaded
✅ Frontend: Built and ready
```

---

## 🎮 What You Can Do

### Patient Portal:
- Register new patients
- Get token numbers
- Check queue status
- View wait times

### Staff Portal:
- View patient queue
- Manage bed assignments
- Release beds
- Transfer patients
- Mark beds for maintenance
- Real-time updates

### Admin Portal:
- View analytics
- Monitor system
- Manage staff
- View activity logs

---

## 💡 Pro Tips

1. **Always hard refresh** after updates (`Ctrl + Shift + R`)
2. **Use test page** to verify system (`test-modal.html`)
3. **Check backend console** for errors
4. **Open multiple tabs** to see real-time updates
5. **Use browser console** (F12) to debug issues

---

## 🐛 Troubleshooting

### "Could not reach server"
→ Backend not running → Start backend

### "Modal doesn't open"
→ Browser cache → Press `Ctrl + Shift + R`

### "No patients in search"
→ No patients registered → Register patient first

### "API errors"
→ Check backend console → Look for red errors

---

## 📞 Need Help?

1. Run: `./quick-check.ps1`
2. Open: `test-modal.html`
3. Check: Browser console (F12)
4. Read: `TROUBLESHOOTING.md`

---

**Your system is ready! Just refresh your browser and start testing!** 🎯
