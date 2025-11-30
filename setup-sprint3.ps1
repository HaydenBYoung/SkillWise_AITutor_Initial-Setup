# Sprint 3 Setup Script for Windows PowerShell

Write-Host "🚀 SkillWise Sprint 3 - AI Integration Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check npm version
$npmVersion = npm --version
Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Backend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend installation failed" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host ""

# Check if .env files exist
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow

if (!(Test-Path "backend\.env")) {
    Write-Host "⚠️  backend/.env not found, creating from .env.example" -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  IMPORTANT: Edit backend/.env and add your GEMINI_API_KEY" -ForegroundColor Red
}

if (!(Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend/.env not found, creating from .env.example" -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
}

Write-Host "✅ Environment files ready" -ForegroundColor Green
Write-Host ""

# Check PostgreSQL
Write-Host "🗄️  Checking PostgreSQL..." -ForegroundColor Yellow
$pgCheck = Get-Process postgres -ErrorAction SilentlyContinue
if ($pgCheck) {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL not detected. Make sure it's running." -ForegroundColor Yellow
    Write-Host "   Or use Docker: docker-compose up -d db" -ForegroundColor Yellow
}
Write-Host ""

# Run database migrations
Write-Host "📊 Running database migrations..." -ForegroundColor Yellow
Set-Location backend
npm run migrate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migrations complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration failed. Check database connection." -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
Set-Location backend
npm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All backend tests passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Review output above." -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Summary
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env and add your GEMINI_API_KEY" -ForegroundColor White
Write-Host "2. Start the application:" -ForegroundColor White
Write-Host "   Backend:  cd backend; npm run dev" -ForegroundColor Gray
Write-Host "   Frontend: cd frontend; npm start" -ForegroundColor Gray
Write-Host "3. Or use Docker: docker-compose up" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - User Stories: docs/SPRINT3_USER_STORIES.md" -ForegroundColor Gray
Write-Host "   - Implementation Guide: docs/SPRINT3_IMPLEMENTATION_GUIDE.md" -ForegroundColor Gray
Write-Host "   - Testing Guide: docs/SPRINT3_TESTING_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Access:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:3001/api" -ForegroundColor Gray
Write-Host ""
Write-Host "Good luck with Sprint 3! 🚀" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
