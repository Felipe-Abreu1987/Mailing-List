@echo off
REM ============================
REM 1) Ir para a pasta do projeto
REM ============================
cd /d "F:\DEV\mailing-list-system\backend"

REM ============================
REM 2) Iniciar o servidor Node.js
REM ============================
REM start /min abre em uma nova janela minimizada.
REM Se quiser deixar aberto, use só 'start'
start node server.js

REM ============================
REM 3) Aguardar alguns segundos (opcional)
REM ============================
REM Usamos "ping" como um delay: ping 127.0.0.1 -n 3 = ~3 segundos
ping 127.0.0.1 -n 3 >nul

REM ============================
REM 4) Abrir o navegador padrão em http://localhost:3000
REM ============================
start http://localhost:3000

REM Fecha o script (não fecha a janela do Node)
exit
