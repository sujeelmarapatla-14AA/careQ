# Quick System Check
Write-Host "`nCareQ System Status Check" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check Backend
Write-Host "`n1. Backend Status:" -ForegroundColor Yellow
$node = Get-Process -Name node -ErrorAction SilentlyContinue
if ($node) {
    Write-Host "   OK - Backend is running" -ForegroundColor Green
} else {
    Write-Host "   ERROR - Backend not running" -ForegroundColor Red
}

# Check API
Write-Host "`n2. API Status:" -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "http://localhost:5000/api/beds/GM-01" -Headers @{"Authorization"="Bearer bypass"} -TimeoutSec 3
    Write-Host "   OK - API responding" -ForegroundColor Green
    Write-Host "   Bed: $($test.bedId) - Status: $($test.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR - API not responding" -ForegroundColor Red
}

# Check Frontend
Write-Host "`n3. Frontend Build:" -ForegroundColor Yellow
if (Test-Path "frontend/dist/index.html") {
    Write-Host "   OK - Frontend is built" -ForegroundColor Green
    $js = Get-ChildItem "frontend/dist/assets/*.js" | Select-Object -First 1
    Write-Host "   Last build: $($js.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "   ERROR - Frontend not built" -ForegroundColor Red
}

# Check All Beds
Write-Host "`n4. Bed System:" -ForegroundColor Yellow
try {
    $beds = Invoke-RestMethod -Uri "http://localhost:5000/api/beds" -Headers @{"Authorization"="Bearer bypass"} -TimeoutSec 3
    Write-Host "   OK - $($beds.Count) beds loaded" -ForegroundColor Green
    $avail = ($beds | Where-Object { $_.status -eq 'available' }).Count
    $occup = ($beds | Where-Object { $_.status -eq 'occupied' }).Count
    Write-Host "   Available: $avail | Occupied: $occup" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR - Cannot load beds" -ForegroundColor Red
}

# Summary
Write-Host "`n=========================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:5000" -ForegroundColor White
Write-Host "2. Press: Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "3. Login: staff@careq.com / staff123" -ForegroundColor White
Write-Host "4. Click any bed to test modal" -ForegroundColor White
Write-Host ""
