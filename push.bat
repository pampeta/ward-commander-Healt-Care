@echo off
git add .
set /p mensaje="Mensaje del commit: "
git commit -m "%mensaje%"
git push origin main --force
echo ¡Listo y subido!
pause