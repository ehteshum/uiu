@echo off
cd /d "C:\Users\Ehteshum\Downloads\Compressed\uiu-main"  REM Change this to your repository path

git pull origin main  REM Ensure you have the latest changes
git add .
git commit -m "Auto-commit: %date% %time%"
git push origin main
