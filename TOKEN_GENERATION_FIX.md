# Token Generation & Real-Time Update Fix

## Issues Fixed

### 1. **Blank Screen After Registration**
**Problem:** After completing the patient registration wizard, users were seeing a blank screen instead of their token.

**Root Causes:**
- Missing `Loader2` import in `TokenCard.jsx` causing the loading state to crash
- Inconsistent field names between backend response and frontend expectations
- Missing error handling in the token fetch logic

**Solutions:**
- ✅ Added `Loader2` to imports in `TokenCard.jsx`
- ✅ Normalized field names in backend to support both old and new formats:
  - `token` and `token_number` (both provided)
  - `fullName` and `patient_name` (both provided)
  - `queuePosition` and `position` (both provided)
  - `estimatedWaitMins` and `estimatedWaitTime` (both provided)
- ✅ Updated `TokenCard.jsx` to handle multiple field name variations
- ✅ Added proper error logging and authorization headers

### 2. **Token Not Appearing in Staff Portal**
**Problem:** When patients registered, their tokens weren't appearing in the staff dashboard in real-time.

**Root Causes:**
- Socket.io events weren't being emitted properly after registration
- Missing event listeners in the socket connection handler
- Queue update events weren't being broadcast to all connected clients

**Solutions:**
- ✅ Enhanced socket.io event emissions in `/api/queue/register`:
  ```javascript
  io.emit('patient:new', patientData);
  io.emit('queueUpdate', allActiveQueues);
  io.emit('queue:update', allActiveQueues);
  io.emit('stats:update', patientStore.stats);
  ```
- ✅ Added comprehensive socket event handlers in `io.on('connection')`:
  - `patient:register` - Broadcasts new patient to all clients
  - `queue:update` - Updates queue for all dashboards
  - `bed:update` - Updates bed status
- ✅ Added console logging for debugging socket events

### 3. **Inconsistent Data Structure**
**Problem:** Different parts of the application expected different field names.

**Solutions:**
- ✅ Backend now returns all field name variations for backward compatibility
- ✅ Frontend components updated to check multiple field names
- ✅ Patient endpoint now calculates current queue position dynamically

## Files Modified

### Backend (`backend/server.js`)
1. **Patient Data Structure** - Added dual field names for compatibility
2. **Socket Event Handlers** - Enhanced connection handler with all events
3. **Registration Endpoint** - Improved response structure and real-time broadcasts
4. **Patient Lookup Endpoint** - Added dynamic queue position calculation

### Frontend Components

#### `frontend/src/components/TokenCard.jsx`
- Added `Loader2` import
- Updated to handle multiple field name variations
- Added authorization headers to API calls
- Improved error handling and logging

#### `frontend/src/components/PatientWizard.jsx`
- Enhanced error handling in `submitForm`
- Added `visitType` to registration payload
- Improved token extraction from response
- Better error messages for users

## Testing

### Backend API Test
```powershell
# Test token generation
$body = @{
  patient_name="Test Patient"
  condition="Test condition"
  severity=30
  department="General OPD"
  visitType="Walk-in"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/queue/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json";"Authorization"="Bearer bypass"} `
  -Body $body

# Expected Response:
# token: A-XXX
# success: True
# position: X
# estimatedWaitMins: XX
```

### Patient Data Retrieval Test
```powershell
# Test patient endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/patient/A-002" `
  -Method GET `
  -Headers @{"Authorization"="Bearer bypass"}

# Expected Response includes:
# - token, token_number
# - fullName, patient_name
# - queuePosition, position
# - estimatedWaitMins
# - All patient details
```

## Real-Time Updates Flow

1. **Patient Registers** → `POST /api/queue/register`
2. **Backend Creates Token** → Generates unique token (e.g., A-001)
3. **Backend Emits Events**:
   - `patient:new` → New patient data
   - `queueUpdate` → Updated queue array
   - `queue:update` → Alternative queue update event
   - `stats:update` → Updated statistics
4. **Staff Dashboard Receives** → Socket listener updates UI
5. **Patient Sees Token** → Redirected to TokenCard with live data

## Socket.io Event Architecture

### Events Emitted by Backend
- `patient:new` - New patient registered
- `queueUpdate` - Queue array updated
- `queue:update` - Alternative queue update
- `bedsUpdate` - Bed status changed
- `stats:update` - Statistics updated
- `activity:log` - Activity feed entry

### Events Listened by Frontend
- **StaffDashboard**: `queueUpdate`, `bedsUpdate`
- **TokenCard**: `queue:update`, `queueUpdate`
- **AdminDashboard**: All events for comprehensive monitoring

## Verification Steps

1. ✅ Backend server running on port 5000
2. ✅ Frontend built successfully (no errors)
3. ✅ Token generation API returns proper structure
4. ✅ Patient endpoint returns complete data
5. ✅ Socket.io events properly configured

## Next Steps for Testing

1. **Start Backend Server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend Dev Server** (or use built version):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Registration Flow**:
   - Navigate to Patient Dashboard
   - Complete registration wizard
   - Verify token appears immediately
   - Check Staff Dashboard shows new patient in real-time

4. **Test Real-Time Updates**:
   - Open Staff Dashboard in one browser tab
   - Register patient in another tab
   - Verify patient appears instantly in staff queue
   - Check queue position updates

## Additional Improvements Made

- Added console logging for debugging
- Improved error messages for users
- Enhanced data validation
- Better field name compatibility
- Comprehensive socket event coverage

## Known Limitations

- Token counter resets at midnight (by design)
- Queue position is calculated dynamically (may have slight delays)
- Socket.io requires stable connection for real-time updates

## Support

If issues persist:
1. Check browser console for errors
2. Check backend console for socket connection logs
3. Verify both frontend and backend are running
4. Clear browser cache and localStorage
5. Test with different browsers
