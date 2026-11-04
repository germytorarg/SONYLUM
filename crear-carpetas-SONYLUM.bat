@echo off
chcp 65001 >nul
rem Crea la estructura de trabajo de SONYLUM en Documentos.
set "BASE=%USERPROFILE%\Documents\SONYLUM"

for %%D in (
  "assets\marcas"
  "assets\tipografias"
  "assets\audio"
  "assets\imagenes"
  "assets\video\dron"
  "assets\video\camara"
  "assets\video\celular"
  "proyectos"
  "plantilla-motion"
) do mkdir "%BASE%\%%~D" 2>nul

echo.
echo Listo. Carpetas creadas en:
echo %BASE%
echo.
start "" "%BASE%"
pause
