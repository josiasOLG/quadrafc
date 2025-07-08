# Script de deploy automático para os 3 projetos no Vercel
# Execute: .\deploy-all.ps1

Write-Host "🚀 Iniciando deploy de todos os projetos no Vercel..." -ForegroundColor Cyan

# Função para verificar sucesso
function Test-Success {
    param($Description)
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $Description executado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao executar $Description" -ForegroundColor Red
        exit 1
    }
}

# 1. Deploy do Backend (deve ser primeiro para gerar as URLs)
Write-Host "📦 Fazendo deploy do Backend..." -ForegroundColor Blue
Set-Location backend
vercel --prod --yes
Test-Success "Deploy do Backend"
Set-Location ..

Write-Host "⏰ Aguardando 30 segundos para o backend ficar disponível..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 2. Deploy do Frontend
Write-Host "🌐 Fazendo deploy do Frontend..." -ForegroundColor Blue
Set-Location frontend
vercel --prod --yes
Test-Success "Deploy do Frontend"
Set-Location ..

# 3. Deploy do Admin
Write-Host "⚙️ Fazendo deploy do Admin..." -ForegroundColor Blue
Set-Location admin
vercel --prod --yes
Test-Success "Deploy do Admin"
Set-Location ..

Write-Host "🎉 Todos os deploys foram concluídos com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs dos projetos:" -ForegroundColor Blue
Write-Host "Backend API: https://quadrafc-backend.vercel.app"
Write-Host "Frontend: https://quadrafc-frontend.vercel.app"
Write-Host "Admin: https://quadrafc-admin.vercel.app"
Write-Host ""
Write-Host "📚 Documentação da API: https://quadrafc-backend.vercel.app/api/docs" -ForegroundColor Blue
