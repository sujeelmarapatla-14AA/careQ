# CareQ Token Generation Test Script
# This script tests the token generation and retrieval endpoints

Write-Host "🏥 CareQ Token Generation Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register a new patient
Write-Host "Test 1: Registering new patient..." -ForegroundColor Yellow

$body = @{
    patient_name = "Test Patient $(Get-Date -Format 'HHmmss')"
    condition = "General checkup"
    severity = 30
    department = "General OPD"
    visitType = "Walk-in"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/queue/register" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer bypass"
        } `
        -Body $body
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   Token: $($response.token)" -ForegroundColor White
    Write-Host "   Position: $($response.position)" -ForegroundColor White
    Write-Host "   Wait Time: $($response.estimatedWaitMins) minutes" -ForegroundColor White
    Write-Host ""
    
    $tokenNumber = $response.token
    
    # Test 2: Retrieve patient data
    Write-Host "Test 2: Retrieving patient data for token $tokenNumber..." -ForegroundColor Yellow
    
    $patientData = Invoke-RestMethod -Uri "http://localhost:5000/api/patient/$tokenNumber" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer bypass"
        }
    
    Write-Host "✅ Patient data retrieved!" -ForegroundColor Green
    Write-Host "   Name: $($patientData.fullName)" -ForegroundColor White
    Write-Host "   Department: $($patientData.department)" -ForegroundColor White
    Write-Host "   Status: $($patientData.status)" -ForegroundColor White
    Write-Host "   Queue Position: $($patientData.queuePosition)" -ForegroundColor White
    Write-Host ""
    
    # Test 3: Check queue
    Write-Host "Test 3: Checking current queue..." -ForegroundColor Yellow
    
    $queue = Invoke-RestMethod -Uri "http://localhost:5000/api/queue" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer bypass"
        }
    
    Write-Host "✅ Queue retrieved!" -ForegroundColor Green
    Write-Host "   Total patients in queue: $($queue.Count)" -ForegroundColor White
    Write-Host ""
    
    # Test 4: Check stats
    Write-Host "Test 4: Checking system stats..." -ForegroundColor Yellow
    
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/stats" `
        -Method GET
    
    Write-Host "✅ Stats retrieved!" -ForegroundColor Green
    Write-Host "   Patients today: $($stats.patientsToday)" -ForegroundColor White
    Write-Host "   Avg wait time: $($stats.avgWaitMins) minutes" -ForegroundColor White
    Write-Host "   Beds available: $($stats.bedsAvailable)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎉 All tests passed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:5000 in your browser" -ForegroundColor White
    Write-Host "2. Navigate to Patient Dashboard" -ForegroundColor White
    Write-Host "3. Register a new patient" -ForegroundColor White
    Write-Host "4. Verify token appears immediately" -ForegroundColor White
    Write-Host "5. Open Staff Dashboard in another tab to see real-time updates" -ForegroundColor White
    
} catch {
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure backend server is running: cd backend && npm start" -ForegroundColor White
    Write-Host "2. Check if port 5000 is available" -ForegroundColor White
    Write-Host "3. Verify backend/server.js has no syntax errors" -ForegroundColor White
}
