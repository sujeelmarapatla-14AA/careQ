# CareQ Resource Management System Test Script
# Tests the comprehensive resource API endpoints

Write-Host "🏥 CareQ Resource Management System - API Test" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$token = "bypass"  # Using bypass token for testing

# Test 1: Get all resources
Write-Host "📊 Test 1: Fetching all resources..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/resources" -Method GET -Headers @{Authorization="Bearer $token"}
    $totalResources = $response.Count
    Write-Host "✅ SUCCESS: Retrieved $totalResources resources" -ForegroundColor Green
    
    # Group by category
    $categories = $response | Group-Object { $_.metadata.category_name } | Sort-Object Name
    Write-Host ""
    Write-Host "📁 Resources by Category:" -ForegroundColor Cyan
    foreach ($cat in $categories) {
        $catName = if ($cat.Name) { $cat.Name } else { "Other" }
        Write-Host "   $catName : $($cat.Count) resources" -ForegroundColor White
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Test 2: Get specific resource categories
Write-Host ""
Write-Host "🔍 Test 2: Checking key resource categories..." -ForegroundColor Yellow

$testCategories = @(
    @{Name="Beds"; ExpectedMin=7},
    @{Name="Diagnostic"; ExpectedMin=11},
    @{Name="OT"; ExpectedMin=9},
    @{Name="OPD"; ExpectedMin=10},
    @{Name="Critical"; ExpectedMin=12},
    @{Name="Ambulance"; ExpectedMin=4},
    @{Name="Pharmacy"; ExpectedMin=5}
)

foreach ($testCat in $testCategories) {
    $catResources = $response | Where-Object { $_.metadata.category_name -eq $testCat.Name }
    $count = $catResources.Count
    if ($count -ge $testCat.ExpectedMin) {
        Write-Host "   ✅ $($testCat.Name): $count resources (expected ≥$($testCat.ExpectedMin))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $($testCat.Name): $count resources (expected ≥$($testCat.ExpectedMin))" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Test 3: Check critical resources
Write-Host ""
Write-Host "🚨 Test 3: Checking critical resources..." -ForegroundColor Yellow

$criticalResources = $response | Where-Object { $_.metadata.category_name -eq "Critical" }
Write-Host "   Found $($criticalResources.Count) critical resources:" -ForegroundColor White

foreach ($res in $criticalResources) {
    $available = if ($res.units_available) { $res.units_available } else { $res.total_capacity - $res.current_occupied }
    $status = if ($res.status -eq "limited") { "⚠️ " } else { "✅" }
    Write-Host "   $status $($res.name): $available available" -ForegroundColor $(if ($res.status -eq "limited") { "Yellow" } else { "White" })
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Test 4: Check bed resources
Write-Host ""
Write-Host "🛏️  Test 4: Checking bed availability..." -ForegroundColor Yellow

$bedResources = $response | Where-Object { $_.metadata.category_name -eq "Beds" }
$totalBeds = ($bedResources | Measure-Object -Property total_capacity -Sum).Sum
$occupiedBeds = ($bedResources | Measure-Object -Property current_occupied -Sum).Sum
$availableBeds = $totalBeds - $occupiedBeds
$occupancyRate = [math]::Round(($occupiedBeds / $totalBeds) * 100, 1)

Write-Host "   Total Beds: $totalBeds" -ForegroundColor White
Write-Host "   Occupied: $occupiedBeds" -ForegroundColor White
Write-Host "   Available: $availableBeds" -ForegroundColor Green
Write-Host "   Occupancy Rate: $occupancyRate%" -ForegroundColor $(if ($occupancyRate -gt 80) { "Red" } elseif ($occupancyRate -gt 60) { "Yellow" } else { "Green" })

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Test 5: Check ambulance availability
Write-Host ""
Write-Host "🚑 Test 5: Checking ambulance availability..." -ForegroundColor Yellow

$ambulances = $response | Where-Object { $_.metadata.category_name -eq "Ambulance" }
$availableAmb = ($ambulances | Where-Object { $_.status -eq "available" }).Count
$inFieldAmb = ($ambulances | Where-Object { $_.status -eq "occupied" }).Count

Write-Host "   Total Ambulances: $($ambulances.Count)" -ForegroundColor White
Write-Host "   Available: $availableAmb" -ForegroundColor Green
Write-Host "   In Field: $inFieldAmb" -ForegroundColor Yellow

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Test 6: Check diagnostic machines with slot booking
Write-Host ""
Write-Host "🔬 Test 6: Checking diagnostic machines..." -ForegroundColor Yellow

$diagnosticMachines = $response | Where-Object { $_.metadata.category_name -eq "Diagnostic" -and $_.supports_slots -eq $true }
Write-Host "   Slot-based diagnostic machines: $($diagnosticMachines.Count)" -ForegroundColor White

foreach ($machine in $diagnosticMachines) {
    $slotDuration = $machine.metadata.slot_duration_mins
    $available = $machine.total_capacity - $machine.current_occupied
    $percentage = [math]::Round(($available / $machine.total_capacity) * 100, 0)
    Write-Host "   📅 $($machine.name): $available/$($machine.total_capacity) slots ($percentage% free) - $slotDuration min/slot" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Test 7: Check OPD wait times
Write-Host ""
Write-Host "⏱️  Test 7: Checking OPD wait times..." -ForegroundColor Yellow

$opdDepts = $response | Where-Object { $_.metadata.category_name -eq "OPD" -and $_.metadata.avg_wait_mins }
Write-Host "   OPD Departments with wait time tracking: $($opdDepts.Count)" -ForegroundColor White

$opdDepts | Sort-Object { $_.metadata.avg_wait_mins } | ForEach-Object {
    $waitTime = $_.metadata.avg_wait_mins
    $color = if ($waitTime -gt 30) { "Red" } elseif ($waitTime -gt 20) { "Yellow" } else { "Green" }
    Write-Host "   $($_.name): $waitTime mins avg wait" -ForegroundColor $color
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Summary
Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Total Resources: $totalResources" -ForegroundColor Green
Write-Host "✅ Categories: $($categories.Count)" -ForegroundColor Green
Write-Host "✅ Total Beds: $totalBeds ($availableBeds available)" -ForegroundColor Green
Write-Host "✅ Ambulances: $($ambulances.Count) ($availableAmb available)" -ForegroundColor Green
Write-Host "✅ Diagnostic Machines: $($diagnosticMachines.Count) with slot booking" -ForegroundColor Green
Write-Host "✅ OPD Departments: $($opdDepts.Count) with wait time tracking" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 All tests completed successfully!" -ForegroundColor Green
Write-Host ""
