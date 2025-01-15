Este projeto é um sistema de Mailing List completo, composto por:

Back-end em Node.js (server.js) para gerenciamento de listas de e-mails, edição de templates e integração via REST.
Banco de Dados (db.js) em SQLite, com tabelas para listas, e-mails, usuários e templates.
Scripts de Agendamento (schedule_tasks.js) utilizando node-cron para rotinas automáticas (por exemplo, relatórios diários).
Integração com Outlook (outlook_integration.py), script Python chamado pelo back-end para preparar/envio de e-mail via Outlook.
Autenticação Java (MailingAuth.java), caso se deseje chamar um microserviço Java para verificar usuário/senha.
Front-end (HTML, CSS, JS) para interface do usuário, possibilitando login, registro, criação/edição de listas, etc.

Pré-requisitos
Node.js (v14 ou superior).
Python instalado, caso deseje usar o script outlook_integration.py.
Java instalado, caso queira usar MailingAuth.java.
SQLite local ou better-sqlite3 (já incluído nas dependências Node).
(Opcional) Microsoft Outlook instalado, se quiser realmente disparar e-mails via Outlook.

Como Rodar
Instale dependências: npm install
(Certifique-se de que better-sqlite3, node-cron, csv-parser e json2csv estejam no package.json.)

Execute o servidor:
node server.js
O servidor subirá na porta 3000 (por padrão).

Acesse o front-end no navegador: localhost:3000

Tela de Login:
User: admin
Pass: 1234 (padrão, criado em db.js).

Observações Adicionais
Banco de dados: Armazenado em database.sqlite. Em produção, considere backups, ou migração para DB mais robusto.
Criptografia de senhas: O código está simplificado, armazenando senhas em texto puro (ex.: admin / 1234). Para uso real, use hashing (bcrypt, etc.).
Uso do Outlook: O script Python abre o e-mail no modo de visualização (mail.Display()). Se quiser enviar direto, use mail.Send().
