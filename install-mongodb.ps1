# MongoDB Installation Helper Script
Write-Host "MongoDB Installation Helper" -ForegroundColor Cyan

# Check if MongoDB is already installed
$mongodbService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongodbService) {
    Write-Host "MongoDB service is already installed and its status is: $($mongodbService.Status)" -ForegroundColor Green
} else {
    Write-Host "MongoDB service is not installed or not detected." -ForegroundColor Yellow
    Write-Host "Please make sure to complete the MongoDB installation from the browser download." -ForegroundColor Yellow
}

# Create data directory if it doesn't exist
$dataDir = "C:\data\db"
if (-not (Test-Path $dataDir)) {
    Write-Host "Creating MongoDB data directory at $dataDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "MongoDB data directory created successfully." -ForegroundColor Green
} else {
    Write-Host "MongoDB data directory already exists at $dataDir." -ForegroundColor Green
}

# Start MongoDB service if it's not running
if ($mongodbService -and $mongodbService.Status -ne "Running") {
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    Start-Service -Name "MongoDB"
    Write-Host "MongoDB service started successfully." -ForegroundColor Green
}

# Set MongoDB to start automatically
if ($mongodbService) {
    Set-Service -Name "MongoDB" -StartupType Automatic
    Write-Host "MongoDB service set to start automatically." -ForegroundColor Green
}

Write-Host "Setup completed. You can now install MongoDB Compass if it wasn't included in your installation." -ForegroundColor Cyan
Write-Host "MongoDB Compass download: https://www.mongodb.com/try/download/compass" -ForegroundColor Cyan

# Open MongoDB Compass download page
$openCompassPage = Read-Host "Would you like to open the MongoDB Compass download page? (y/n)"
if ($openCompassPage -eq "y") {
    Start-Process "https://www.mongodb.com/try/download/compass"
}

# Display connection information
Write-Host "`nAfter installation is complete, use this connection string in your .env file:" -ForegroundColor Green
Write-Host "MONGODB_URI=mongodb://localhost:27017/quick-teams" -ForegroundColor Yellow
