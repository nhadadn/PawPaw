Write-Host "🚀 Iniciando ngrok y Backend..." -ForegroundColor Green

npx ngrok config check
if ($LASTEXITCODE -ne 0) { exit 1 }

Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "ngrok http 4000"
Start-Sleep -Seconds 3

$ngrokResponse = curl.exe -s http://127.0.0.1:4040/api/tunnels | ConvertFrom-Json
$NGROK_URL = $ngrokResponse.tunnels[0].public_url

Write-Host "✅ ngrok URL: $NGROK_URL" -ForegroundColor Green

docker compose down
docker compose up -d
Start-Sleep -Seconds 5

$response = curl.exe -s http://localhost:4000/api/seed-status
if ($response) {
  Write-Host "✅ Backend corriendo" -ForegroundColor Green
  Write-Host "📊 URLs:" -ForegroundColor Yellow
  Write-Host "   Local: http://localhost:4000" -ForegroundColor Cyan
  Write-Host "   ngrok: $NGROK_URL" -ForegroundColor Cyan
  Write-Host "   Swagger: http://localhost:4000/api/docs" -ForegroundColor Cyan
  Write-Host "   Monitor: http://127.0.0.1:4040" -ForegroundColor Cyan
} else {
  Write-Host "❌ Backend no responde" -ForegroundColor Red
  exit 1
}
