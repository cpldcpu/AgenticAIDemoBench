@echo off
rem Play the lean brotli build (intro_lean.html.br): serves it on http://localhost:8125 and opens the browser.
rem The page is black while it precalculates, then shows a still picture: click it to start. Ctrl+C here stops the server.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\tools\serve_br.ps1" "%~dp0." -Name intro_lean.html.br
