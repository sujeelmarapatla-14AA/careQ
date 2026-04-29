# 🧪 ADMIN SYNC — TESTING GUIDE

## Quick Test Scenarios

### ✅ Test 1: Patient Registration Sync (30 seconds)

**Setup**:
1. Open http://localhost:5173 → Login as Admin (admin@careq.com / admin123)
2. Open http://localhost:5173 in **incognito/private window** → Patient Portal

**Test Steps**:
1. In Patient Portal: Fill registration form
   - Name: "Test Patient"
   - Age: 30
   - Gender: Male
   - Department: Cardiology
   - Condition: "Chest pain"
   - Severity: 75
2. Click "Register"
3. **Watch Admin Portal** (should update within 200ms)

**Expected Results**:
- ✅ Activity log shows: "👤 New patient: Test Patient — Token A-XXX | Cardiology"
- ✅ "Patients Today" card increases by 1
- ✅ "Waiting" card increases by 1
- ✅ Activity log has **cyan border**
- ✅ Timestamp shows "Just now"

---

### ✅ Test 2: Bed Assignment Sync (45 seconds)

**Setup**:
1. Keep Admin Portal open
2. Open http://localhost:5173 in another tab → Login as Staff (staff@careq.com / staff123)

**Test Steps**:
1. In Staff Portal: Click a patient in the queue
2. Modal opens → Click "Select & Assign to Bed"
3. Click any **green bed** (available)
4. **Watch Admin Portal**

**Expected Results**:
- ✅ Activity log shows: "🛏 Staff assigned Bed XXX to Patient Name (Token) — Ward"
- ✅ Activity log has **amber border**
- ✅ "Beds Occupied" percentage increases
- ✅ Bed grid updates (bed turns red)
- ✅ Timestamp shows "Just now"

---

### ✅ Test 3: Bed Release Sync (30 seconds)

**Test Steps**:
1. In Staff Portal: Click a **red bed** (occupied)
2. Modal opens → Click "Release Bed"
3. **Watch Admin Portal**

**Expected Results**:
- ✅ Activity log shows: "🔓 Staff released Bed XXX — Patient discharged — Ward"
- ✅ Activity log has **green border**
- ✅ "Discharged Today" card increases by 1
- ✅ "Beds Occupied" percentage decreases
- ✅ Bed grid updates (bed turns green)

---

### ✅ Test 4: Queue Status Change (30 seconds)

**Note**: This requires updating the StaffDashboard to have status change buttons. For now, test via API:

**Test Steps**:
1. Open browser console (F12) on Staff Portal
2. Run this code:
```javascript
fetch('http://localhost:5000/api/queue/A-001', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer bypass'
  },
  body: JSON.stringify({
    status: 'In Progress',
    staffName: 'Dr. Smith'
  })
})
```
3. **Watch Admin Portal**

**Expected Results**:
- ✅ Activity log shows: "✅ Dr. Smith marked Patient as In Progress (was Waiting)"
- ✅ Activity log has **blue border**
- ✅ "Waiting" card decreases by 1
- ✅ "In Progress" card increases by 1

---

### ✅ Test 5: Multiple Staff Actions (1 minute)

**Test Steps**:
1. Keep Admin Portal open
2. Perform multiple actions in Staff Portal:
   - Assign 2 beds
   - Release 1 bed
   - Mark 1 bed for maintenance
3. **Watch Admin Portal activity log**

**Expected Results**:
- ✅ All actions appear in activity log
- ✅ Correct colors for each action type
- ✅ Timestamps update correctly
- ✅ KPI cards update for each action
- ✅ No duplicate entries
- ✅ Log auto-scrolls with new entries

---

### ✅ Test 6: Real-Time Performance (30 seconds)

**Test Steps**:
1. Open browser console (F12) on Admin Portal
2. Note the current time
3. In Staff Portal: Assign a bed
4. In Admin Portal console: Check when activity log updated

**Expected Results**:
- ✅ Update appears within **200ms**
- ✅ No console errors
- ✅ Socket connection shows "connected"

---

### ✅ Test 7: Hospital Info Update (30 seconds)

**Test Steps**:
1. Open browser console (F12) on Admin Portal
2. Run this code:
```javascript
fetch('http://localhost:5000/api/hospital/info', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer bypass'
  },
  body: JSON.stringify({
    name: 'Updated Hospital Name',
    tokenPrefix: 'B',
    updatedBy: 'Admin User'
  })
})
```
3. **Watch Admin Portal**

**Expected Results**:
- ✅ Activity log shows: "⚙️ Admin User updated hospital information"
- ✅ Activity log has **purple border**
- ✅ Header shows new hospital name
- ✅ Token prefix shows "B"

---

## 🔍 Debugging Tips

### Check Socket Connection
Open browser console (F12) on Admin Portal:
```javascript
// Should see socket connection logs
// Look for: "Admin joined" or "Client connected"
```

### Monitor Socket Events
```javascript
// Add this to browser console to see all socket events
const socket = io('http://localhost:5000');
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### Check Activity Log State
```javascript
// In React DevTools, find AdminDashboard component
// Check 'logs' state array
// Should see entries with: msg, time, color
```

---

## ❌ Common Issues

### Issue: Activity log not updating
**Solution**: 
- Check backend console for "Admin joined" message
- Verify socket connection in browser console
- Hard refresh admin portal (Ctrl+Shift+R)

### Issue: Wrong colors in activity log
**Solution**:
- Check that activity entries have 'color' property
- Verify borderColors object in AdminDashboard.jsx

### Issue: KPI cards not updating
**Solution**:
- Check that 'stats:update' event is being emitted
- Verify metrics state in React DevTools
- Check backend console for stat calculations

### Issue: Duplicate entries in activity log
**Solution**:
- Check that events are only emitted once per action
- Verify no duplicate socket listeners
- Check activity feed array length (should max at 100)

---

## ✅ Success Criteria

Your admin sync is working correctly if:

1. ✅ All 7 test scenarios pass
2. ✅ Activity log shows color-coded entries
3. ✅ KPI cards update in real-time
4. ✅ Bed grid updates in real-time
5. ✅ Timestamps show relative time
6. ✅ No console errors
7. ✅ Updates appear within 200ms
8. ✅ Multiple staff actions all sync correctly

---

## 🎉 You're Done!

If all tests pass, your staff-to-admin real-time sync is **fully operational**!

**Admin sees everything staff does. Zero delay. Complete transparency.**
