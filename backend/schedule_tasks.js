const cron = require("node-cron");
const db = require("./db");
const { spawn } = require("child_process");

// Exemplo: Tarefa diária às 08:00
cron.schedule("0 8 * * *", () => {
  console.log("[Agendador] Gerando relatório diário...");

  // Lógica de relatório ou disparo de e-mail
  const totalLists = db.prepare(`
    SELECT COUNT(*) as cnt
    FROM lists
  `).get().cnt;

  const totalEmails = db.prepare(`
    SELECT COUNT(*) as cnt
    FROM emails
  `).get().cnt;

  // Caso queira enviar e-mail com esses dados, utilize lógica similar a /send-email
  // (Ex.: chamando script Python, etc.)
  console.log(
    `[Relatório Diário] Listas: ${totalLists}, E-mails: ${totalEmails}`
  );
});

