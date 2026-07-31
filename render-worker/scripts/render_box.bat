@echo off
setlocal enabledelayedexpansion
REM ─── Planne · gerar a caixa parametrizada (Windows) ───────────────────────────
REM Uso: dois cliques (usa 800x720x550) ou:  render_box.bat 900 720 600

REM 1) Acha o Blender (PATH ou instalacao padrao)
set "BLENDER="
where blender >nul 2>nul && set "BLENDER=blender"
if not defined BLENDER (
  for /d %%D in ("C:\Program Files\Blender Foundation\Blender *") do set "BLENDER=%%D\blender.exe"
)
if not defined BLENDER (
  echo.
  echo [ERRO] Blender nao encontrado.
  echo Instale em https://www.blender.org/download/  e rode de novo.
  echo.
  pause
  exit /b 1
)

REM 2) Medidas (mm) com valores padrao
set "L=%~1"
if "%L%"=="" set "L=800"
set "A=%~2"
if "%A%"=="" set "A=720"
set "P=%~3"
if "%P%"=="" set "P=550"
set "OUT=%~dp0..\caixa.png"

echo.
echo Blender: !BLENDER!
echo Gerando caixa !L! x !A! x !P! mm ...
echo.
"!BLENDER!" --background --python "%~dp0..\blender\box_demo.py" -- --largura !L! --altura !A! --profundidade !P! --espessura 15 --out "%OUT%"

if exist "%OUT%" (
  echo.
  echo [OK] Imagem gerada: %OUT%
  start "" "%OUT%"
) else (
  echo.
  echo [FALHOU] Veja as mensagens acima.
)
echo.
pause
