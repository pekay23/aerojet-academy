@echo off
cd /d C:\Projects\aerojet-academy
bunx tsc --noEmit --pretty false --skipLibCheck 2> tsc-check.txt
echo DONE > tsc-check-done.txt
