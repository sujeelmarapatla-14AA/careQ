# CareQ Resource Management System Test Script
Write-Host "CareQ Resource Management System - API Test" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$token = "bypass"

# Test: Get all resources
Write-Host "Test: Fetching all resources..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/resources" -Method GET -Headers @{Authorization="Bearer $token"}
    $totalResources = $response.Count
    Write-Host "SUCCESS: Retrieved $totalResources resources" -ForegroundColor Green
    
    # Group by category
    Write-Host ""
    Write-Host "Resources by Category:" -ForegroundColor Cyan
    
    $beds = ($response | Where-Object { $_.metadata.category_name -eq "Beds" }).Count
    $diagnostic = ($response | Where-Object { $_.metadata.category_name -eq "Diagnostic" }).Count
    $ot = ($response | Where-Object { $_.metadata.category_name -eq "OT" }).Count
    $opd = ($response | Where-Object { $_.metadata.category_name -eq "OPD" }).Count
    $critical = ($response | Where-Object { $_.metadata.category_name -eq "Critical" }).Count
    $ambulance = ($response | Where-Object { $_.metadata.category_name -eq "Ambulance" }).Count
    $pharmacy = ($response | Where-Object { $_.metadata.category_name -eq "Pharmacy" }).Count
    $support = ($response | Where-Object { $_.metadata.category_name -eq "Support" }).Count
    
    Write-Host "  Beds: $beds resources" -ForegroundColor White
    Write-Host "  Diagnostic: $diagnostic resources" -ForegroundColor White
    Write-Host "  OT: $ot resources" -ForegroundColor White
    Write-Host "  OPD: $opd resources" -ForegroundColor White
    Write-Host "  Critical: $critical resources" -ForegroundColor White
    Write-Host "  Ambulance: $ambulance resources" -ForegroundColor White
    Write-Host "  Pharmacy: $pharmacy resources" -ForegroundColor White
    Write-Host "  Support: $support resources" -ForegroundColor White
    
    Write-Host ""
    Write-Host "SUMMARY:" -ForegroundColor Cyan
    Write-Host "  Total Resources: $totalResources" -ForegroundColor Green
    Write-Host "  Categories: 8" -ForegroundColor Green
    Write-Host ""
    Write-Host "All tests completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
