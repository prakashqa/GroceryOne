@echo off 
title GroOne Web App 
cd /d "D:\my app\application-gro-one\GroOne\web" 
node "D:\my app\application-gro-one\GroOne\node_modules\next\dist\bin\next" dev -p 3001 
echo. 
echo Web app stopped. Press any key to close. 
pause >nul 
