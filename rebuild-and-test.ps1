#!/usr/bin/env pwsh
# Attendance System - Rebuild and Test Script
# This script rebuilds the backend and tests the fixes

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Attendance System - Fix & Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Step 1: Stop running processes
Write-Host "`n[1/5] Stopping existing Java/Maven processes..." -ForegroundColor Yellow
Get-Process java,mvn -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ Processes stopped" -ForegroundColor Green

# Step 2: Clean rebuild
Write-Host "`n[2/5] Building backend (this may take 1-2 minutes)..." -ForegroundColor Yellow
cd c:\Users\selva\Documents\attendance-system
mvn clean package -DskipTests -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed - check errors above" -ForegroundColor Red
    exit 1
}

# Step 3: Start backend
Write-Host "`n[3/5] Starting backend server..." -ForegroundColor Yellow
Write-Host "Please wait 30 seconds for server to fully start..." -ForegroundColor Gray
Start-Job -ScriptBlock {
    cd c:\Users\selva\Documents\attendance-system
    java -jar target/attendance-system-0.0.1-SNAPSHOT.jar
} | Out-Null
Start-Sleep -Seconds 30

# Step 4: Test API endpoints
Write-Host "`n[4/5] Testing API endpoints..." -ForegroundColor Yellow
$testsPassed = 0
$testsFailed = 0

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/students" -Method Get -TimeoutSec 5
    Write-Host "✓ GET /api/students - OK ($(($response | Measure-Object).Count) students)" -ForegroundColor Green
    $testsPassed++
    
    # Check if userId is present
    if ($response[0].userId) {
        Write-Host "  ✓ userId field present in response" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ✗ userId field MISSING in response - fix not applied!" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Failed to connect to backend at http://localhost:8080" -ForegroundColor Red
    Write-Host "  Make sure backend is running" -ForegroundColor Gray
    $testsFailed++
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/diagnostic" -Method Get -TimeoutSec 5
    Write-Host "✓ GET /api/admin/diagnostic - OK" -ForegroundColor Green
    Write-Host "  Total students: $($response.totalStudents)" -ForegroundColor Gray
    Write-Host "  Total attendance: $($response.totalAttendanceRecords)" -ForegroundColor Gray
    $testsPassed++
} catch {
    Write-Host "✗ Diagnostic endpoint failed" -ForegroundColor Red
    $testsFailed++
}

# Step 5: Results
Write-Host "`n[5/5] Test Summary" -ForegroundColor Yellow
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "2. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "3. Login to the system" -ForegroundColor White
Write-Host "4. Test each feature:" -ForegroundColor White
Write-Host "   - Teacher: Mark attendance" -ForegroundColor Gray
Write-Host "   - Student: Check 'My Attendance'" -ForegroundColor Gray
Write-Host "   - Student: View AI Scorecard" -ForegroundColor Gray
Write-Host "   - Admin: Check Reports" -ForegroundColor Gray

if ($testsFailed -eq 0) {
    Write-Host "`n✓ All tests passed! System should be working now." -ForegroundColor Green
} else {
    Write-Host "`n✗ Some tests failed. Check errors above and run this script again." -ForegroundColor Red
}

Write-Host "`nBackend is running at: http://localhost:8080" -ForegroundColor Gray
Write-Host "Frontend is running at: http://localhost:5174 or 5173" -ForegroundColor Gray
