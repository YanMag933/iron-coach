@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  IRON COACH — локальный сервер
echo  На этом ПК:     http://localhost:8765
echo  На телефоне (тот же Wi-Fi): http://ТВОЙ_IP:8765
echo  IP смотри: Win+R → cmd → ipconfig → IPv4
echo  Полная установка на телефон: файл КАК_ЗАПУСТИТЬ_НА_ТЕЛЕФОНЕ.txt
echo  Остановка: Ctrl+C
echo.
start "" "http://localhost:8765"
where py >nul 2>&1 && (
  py -3 -m http.server 8765
) || (
  python -m http.server 8765
)
if errorlevel 1 (
  echo.
  echo  Python не найден. Установи с https://www.python.org/downloads/
  echo  или открой index.html через Live Server / другой локальный сервер.
  echo.
)
pause
