# Run this whenever "Cannot reach server" appears on a USB-connected phone.
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  Write-Error "adb not found. Install Android SDK platform-tools."
  exit 1
}

& $adb devices
& $adb reverse --remove-all 2>$null
& $adb reverse tcp:5001 tcp:5001
Write-Host ""
Write-Host "ADB reverse active:"
& $adb reverse --list
Write-Host ""
Write-Host "Use API_BASE_URL=http://127.0.0.1:5001 in deliveryapp/.env"
Write-Host "Then stop and run: flutter run  (full restart, not hot reload)"
