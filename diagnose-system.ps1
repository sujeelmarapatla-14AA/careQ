# ========================================
# CareQ System Diagnostic Script
# ========================================

Write-Host "`n🔍 CAREQ SYSTEM DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 1. Check Backend Status
Write-Host "`n1️⃣ BACKEND STATUS" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Backend is RUNNING" -ForegroundColor Green
    Write-Host "   Process IDs: $($nodeProcesses.Id -join ', ')" -ForegroundColor Gray
    Write-Host "   Started: $($nodeProcesses[0].StartTime)" -ForegroundColor Gray
} else {
    Write-Host "❌ Backend is NOT RUNNING" -ForegroundColor Red
    Write-Host "   Run: cd backend; npm start" -ForegroundColor Yellow
}

# 2. Test Backend API
Write-Host "`n2️⃣ BACKEND API TEST" -ForegroundColor Yellow
try {
    $bedTest = Invoke-RestMethod -Uri "http://localhost:5000/api/beds/GM-01" -Headers @{"Authorization"="Bearer bypass"} -TimeoutSec 5
    Write-Host "✅ API is RESPONDING" -ForegroundColor Green
    Write-Host "   Bed ID: $($bedTest.bedId)" -ForegroundColor Gray
    Write-Host "   Status: $($bedTest.status)" -ForegroundColor Gray
    Write-Host "   Has patient fields: $(if($bedTest.patientToken -ne $null -or $bedTest.PSObject.Properties.Name -contains 'patientToken'){'YES'}else{'NO'})" -ForegroundColor Gray
} catch {
    Write-Host "❌ API is NOT RESPONDING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Check Frontend Build
Write-Host "`n3️⃣ FRONTEND BUILD STATUS" -ForegroundColor Yellow
if (Test-Path "frontend/dist/index.html") {
    $distFiles = Get-ChildItem "frontend/dist/assets/*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host "✅ Frontend is BUILT" -ForegroundColor Green
    Write-Host "   Last build: $($distFiles.LastWriteTime)" -ForegroundColor Gray
    Write-Host "   Main file: $($distFiles.Name)" -ForegroundColor Gray
    
    # Check if BedAvailability component exists
    $bedComponent = Get-ChildItem "frontend/dist/assets/BedAvailability*.js" -ErrorAction SilentlyContinue
    if ($bedComponent) {
        Write-Host "   ✅ BedAvailability component found" -ForegroundColor Green
        Write-Host "      Size: $([math]::Round($bedComponent.Length/1KB, 2)) KB" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ BedAvailability component NOT found" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Frontend is NOT BUILT" -ForegroundColor Red
    Write-Host "   Run: cd frontend; npm run build" -ForegroundColor Yellow
}

# 4. Check Socket.io Connection
Write-Host "`n4️⃣ SOCKET.IO TEST" -ForegroundColor Yellow
try {
    $socketTest = Invoke-WebRequest -Uri "http://localhost:5000/socket.io/" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Socket.io endpoint is ACCESSIBLE" -ForegroundColor Green
} catch {
    Write-Host "❌ Socket.io endpoint is NOT ACCESSIBLE" -ForegroundColor Red
}

# 5. Check Port 5000
Write-Host "`n5️⃣ PORT STATUS" -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "✅ Port 5000 is LISTENING" -ForegroundColor Green
    Write-Host "   Process ID: $($port5000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "❌ Port 5000 is NOT LISTENING" -ForegroundColor Red
}

# 6. Test Queue API
Write-Host "`n6️⃣ QUEUE API TEST" -ForegroundColor Yellow
try {
    $queueTest = Invoke-RestMethod -Uri "http://localhost:5000/api/queue" -Headers @{"Authorization"="Bearer bypass"} -TimeoutSec 5
    Write-Host "✅ Queue API is RESPONDING" -ForegroundColor Green
    Write-Host "   Patients in queue: $($queueTest.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Queue API is NOT RESPONDING" -ForegroundColor Red
}

# 7. Check All Beds
Write-Host "`n7️⃣ BED INFRASTRUCTURE TEST" -ForegroundColor Yellow
try {
    $allBeds = Invoke-RestMethod -Uri "http://localhost:5000/api/beds" -Headers @{"Authorization"="Bearer bypass"} -TimeoutSec 5
    Write-Host "✅ Bed API is RESPONDING" -ForegroundColor Green
    Write-Host "   Total beds: $($allBeds.Count)" -ForegroundColor Gray
    
    $available = ($allBeds | Where-Object { $_.status -eq 'available' }).Count
    $occupied = ($allBeds | Where-Object { $_.status -eq 'occupied' }).Count
    $maintenance = ($allBeds | Where-Object { $_.status -eq 'maintenance' }).Count
    
    Write-Host "   🟢 Available: $available" -ForegroundColor Green
    Write-Host "   🔴 Occupied: $occupied" -ForegroundColor Red
    Write-Host "   🟡 Maintenance: $maintenance" -ForegroundColor Yellow
    
    # Check if beds have enhanced fields
    $sampleBed = $allBeds[0]
    $hasEnhancedFields = $sampleBed.PSObject.Properties.Name -contains 'patientToken' -and 
                         $sampleBed.PSObject.Properties.Name -contains 'history' -and
                         $sampleBed.PSObject.Properties.Name -contains 'assignedDoctor'
    
    if ($hasEnhancedFields) {
        Write-Host "   ✅ Beds have ENHANCED fields (patientToken, history, etc.)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Beds are MISSING enhanced fields" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Bed API is NOT RESPONDING" -ForegroundColor Red
}

# 8. System Summary
Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
Write-Host "📊 SYSTEM SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$backendOk = $nodeProcesses -ne $null
$apiOk = $bedTest -ne $null
$frontendOk = Test-Path "frontend/dist/index.html"

if ($backendOk -and $apiOk -and $frontendOk) {
    Write-Host "`n✅ SYSTEM IS FULLY OPERATIONAL" -ForegroundColor Green
    Write-Host "`n📝 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "   1. Open browser: http://localhost:5000" -ForegroundColor White
    Write-Host "   2. Press Ctrl+Shift+R to hard refresh" -ForegroundColor White
    Write-Host "   3. Login as staff: staff@careq.com / staff123" -ForegroundColor White
    Write-Host "   4. Go to Staff Dashboard" -ForegroundColor White
    Write-Host "   5. Scroll to 'Bed Infrastructure Node'" -ForegroundColor White
    Write-Host "   6. Click any bed to open control modal" -ForegroundColor White
} else {
    Write-Host "`n⚠️ SYSTEM HAS ISSUES" -ForegroundColor Yellow
    Write-Host "`n🔧 TROUBLESHOOTING:" -ForegroundColor Cyan
    
    if (-not $backendOk) {
        Write-Host "   ❌ Start backend: cd backend; npm start" -ForegroundColor Red
    }
    if (-not $frontendOk) {
        Write-Host "   ❌ Build frontend: cd frontend; npm run build" -ForegroundColor Red
    }
    if ($backendOk -and -not $apiOk) {
        Write-Host "   ❌ Backend is running but API not responding - check backend console for errors" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
Write-Host "🎯 If everything is green but browser still shows errors:" -ForegroundColor Yellow
Write-Host "   → Press Ctrl+Shift+R in browser (hard refresh)" -ForegroundColor White
Write-Host "   → Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   → Check browser console (F12) for JavaScript errors" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
