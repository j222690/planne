@echo off
setlocal enabledelayedexpansion
REM ─── Planne · render FOTORREALISTA (Cycles) do movel inteiro ──────────────────
REM Dois cliques: mesmo payload, mas com GI real. E mais lento (alguns minutos).

set "BLENDER="
where blender >nul 2>nul && set "BLENDER=blender"
if not defined BLENDER (
  for /d %%D in ("C:\Program Files\Blender Foundation\Blender *") do set "BLENDER=%%D\blender.exe"
)
if not defined BLENDER (
  echo [ERRO] Blender nao encontrado. Instale em https://www.blender.org/download/
  pause & exit /b 1
)

set "JOB=%~dp0..\sample_payload.json"
set "OUT=%~dp0..\cena_cycles.png"

echo Blender: !BLENDER!
echo Render FOTORREALISTA (Cycles) a partir de: %JOB%
echo (pode levar alguns minutos)
echo.
"!BLENDER!" --background --python "%~dp0..\blender\scene_from_job.py" -- --job "%JOB%" --out "%OUT%" --engine cycles

if exist "%OUT%" (
  echo. & echo [OK] Cena gerada: %OUT%
  start "" "%OUT%"
) else (
  echo. & echo [FALHOU] Veja as mensagens acima.
)
echo.
pause
