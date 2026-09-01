@echo off
cd /d C:\Projects\aerojet-academy
node_modules\.bin\tsc.exe --noEmit --pretty false --skipLibCheck > tsc-out.txt 2>&1
echo EXITCODE=%ERRORLEVEL% >> tsc-out.txt
