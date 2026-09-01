@echo off
cd /d C:\Projects\aerojet-academy
bun tsc --noEmit --pretty false --skipLibCheck > tsc-results.txt 2>&1
echo EXITCODE=%ERRORLEVEL% >> tsc-results.txt
exit
