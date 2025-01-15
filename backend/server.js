/********************************************************************
 * server.js
 * Versão consolidada e corrigida, sem duplicações.
 ********************************************************************/

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");
const db = require("./db");
const fs = require("fs");
const path = require("path");

// CSV import/export
const csv = require("csv-parser");
const { Parser } = require("json2csv");

// Se existir um schedule_tasks.js para agendamentos, carrega (opcional)
try {
  require("./schedule_tasks");
} catch (err) {
  // Se o arquivo não existir, ignora
  // console.warn("schedule_tasks.js não encontrado:", err);
}

// Inicializando app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// ====================================================
// ============== Rotas da Aplicação ==================
// ====================================================

// --------------------------
//  AUTENTICAÇÃO (CHAMA JAVA) ou DB local
// --------------------------
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  // Verifica no DB local se há esse user
  const user = db
    .prepare(`
      SELECT * FROM users
      WHERE username = ? AND password = ?
    `)
    .get(username, password);

  if (user) {
    // Caso queira chamar Java ou outro microserviço, poderia aqui.
    // Mas simplifica-se, assumindo autenticado:
    return res.json({ success: true });
  } else {
    return res.json({ success: false, message: "Usuário ou senha inválidos." });
  }
});

// --------------------------
//  LISTAR LISTAS
// --------------------------
app.get("/lists", (req, res) => {
  const lists = db
    .prepare(
      `
      SELECT
        l.name,
        COUNT(e.id) as count
      FROM lists l
      LEFT JOIN emails e ON e.list_id = l.id
      GROUP BY l.id
      ORDER BY l.name
    `
    )
    .all();
  res.json(lists);
});

// --------------------------
//  CRIAR / ATUALIZAR LISTA
// --------------------------
app.post("/lists/:listName", (req, res) => {
  const listName = req.params.listName;
  const { rawEmails } = req.body;

  // Cria a lista (caso não exista)
  try {
    db.prepare(`
      INSERT OR IGNORE INTO lists (name) VALUES (?)
    `).run(listName);
  } catch (err) {
    return res.status(400).json({ message: "Erro ao criar lista." });
  }

  // Busca ID da lista
  const list = db
    .prepare(`
      SELECT id FROM lists WHERE name = ?
    `)
    .get(listName);

  if (!list) {
    return res.status(400).json({
      message: "Não foi possível obter ID da lista."
    });
  }

  // Função auxiliar para separar e-mails
  const emailsArray = separateAndCleanEmails(rawEmails);
  if (emailsArray.length > 0) {
    // Inserir e-mails
    const insertStmt = db.prepare(`
      INSERT INTO emails
      (list_id, email, empresa, contato, telefone, obs, tags)
      VALUES (?, ?, '', '', '', '', '')
    `);

    const uniqueEmails = [...new Set(emailsArray)];
    uniqueEmails.forEach((em) => {
      // Verifica se já existe
      const already = db
        .prepare(`
          SELECT * FROM emails
          WHERE list_id = ? AND email = ?
        `)
        .get(list.id, em);

      if (!already) {
        insertStmt.run(list.id, em);
      }
    });

    return res.json({ count: uniqueEmails.length });
  } else {
    return res.json({ count: 0 });
  }
});

// --------------------------
//  OBTÉM E-MAILS DE UMA LISTA
// --------------------------
app.get("/lists/:listName/emails", (req, res) => {
  const listName = req.params.listName;
  const list = db.prepare(`SELECT id FROM lists WHERE name = ?`).get(listName);

  if (!list) return res.json([]);

  const emails = db
    .prepare(
      `
      SELECT email, empresa, contato, telefone, obs, tags
      FROM emails
      WHERE list_id = ?
      ORDER BY email
    `
    )
    .all(list.id);

  // Transforma tags (string) em array
  emails.forEach((e) => {
    e.tags = e.tags ? e.tags.split(",").map((t) => t.trim()) : [];
  });

  res.json(emails);
});

// --------------------------
//  EDITAR E-MAIL (PUT)
// --------------------------
app.put("/lists/:listName/emails/:email", (req, res) => {
  const listName = req.params.listName;
  const email = decodeURIComponent(req.params.email);
  const { field, newValue } = req.body;

  const list = db.prepare(`
    SELECT id FROM lists WHERE name = ?
  `).get(listName);

  if (!list)
    return res.status(404).json({ message: "Lista não encontrada." });

  // Se for "tags", pode converter para string etc.
  let valueToSet = newValue;
  // if (field === "tags") { ... }

  // Monta SQL dinamicamente
  const sql = `
    UPDATE emails
    SET ${field} = ?
    WHERE list_id = ? AND email = ?
  `;

  try {
    db.prepare(sql).run(valueToSet, list.id, email);
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// --------------------------
//  MOVER E-MAIL
// --------------------------
app.post("/lists/:listName/move", (req, res) => {
  const listName = req.params.listName;
  const { email, destinationList } = req.body;

  const originList = db
    .prepare(`
      SELECT id FROM lists WHERE name = ?
    `)
    .get(listName);

  if (!originList)
    return res.status(404).json({ message: "Lista de origem não encontrada." });

  // Cria destino se não existir
  db.prepare(`INSERT OR IGNORE INTO lists (name) VALUES (?)`).run(destinationList);
  const dest = db.prepare(`SELECT id FROM lists WHERE name = ?`).get(destinationList);

  if (!dest)
    return res.status(404).json({ message: "Lista de destino não encontrada." });

  // Pega dados do e-mail
  const emailData = db
    .prepare(`
      SELECT * FROM emails
      WHERE list_id = ? AND email = ?
    `)
    .get(originList.id, email);

  if (!emailData)
    return res.status(404).json({
      message: "E-mail não encontrado na lista de origem."
    });

  // Insere no destino
  db.prepare(`
    INSERT INTO emails (list_id, email, empresa, contato, telefone, obs, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    dest.id,
    emailData.email,
    emailData.empresa,
    emailData.contato,
    emailData.telefone,
    emailData.obs,
    emailData.tags
  );

  // Remove do original
  db.prepare(`
    DELETE FROM emails WHERE id = ?
  `).run(emailData.id);

  res.json({
    success: true,
    message: `E-mail movido para ${destinationList}.`
  });
});

// --------------------------
//  EXCLUIR E-MAIL
// --------------------------
app.delete("/lists/:listName/emails/:email", (req, res) => {
  const listName = req.params.listName;
  const email = decodeURIComponent(req.params.email);

  const list = db.prepare(`
    SELECT id FROM lists WHERE name = ?
  `).get(listName);

  if (!list)
    return res.status(404).json({ message: "Lista não encontrada." });

  db.prepare(`
    DELETE FROM emails
    WHERE list_id = ? AND email = ?
  `).run(list.id, email);

  res.json({ success: true });
});

// --------------------------
//  EXCLUIR LISTA
// --------------------------
app.delete("/lists/:listName", (req, res) => {
  const listName = req.params.listName;
  const list = db.prepare(`
    SELECT id FROM lists
    WHERE name = ?
  `).get(listName);

  if (!list)
    return res.status(404).json({ message: "Lista não encontrada." });

  db.prepare(`
    DELETE FROM emails
    WHERE list_id = ?
  `).run(list.id);

  db.prepare(`
    DELETE FROM lists
    WHERE id = ?
  `).run(list.id);

  res.json({ success: true });
});

// --------------------------
//  RENOMEAR LISTA
// --------------------------
app.put("/lists/:listName/rename", (req, res) => {
  const listName = req.params.listName;
  const { newName } = req.body;

  const list = db.prepare(`
    SELECT id FROM lists
    WHERE name = ?
  `).get(listName);

  if (!list)
    return res.status(404).json({ message: "Lista não encontrada." });

  // Verifica se o newName já existe
  const check = db.prepare(`
    SELECT * FROM lists
    WHERE name = ?
  `).get(newName);

  if (check) {
    return res
      .status(400)
      .json({ message: "Já existe uma lista com esse nome." });
  }

  db.prepare(`
    UPDATE lists
    SET name = ?
    WHERE id = ?
  `).run(newName, list.id);

  res.json({ message: `Lista renomeada para '${newName}'.` });
});

// --------------------------
//  ENVIAR E-MAIL (Outlook) - usando Python
// --------------------------
app.post("/send-email", (req, res) => {
  const { to, bcc, subject, message } = req.body;

  // Chamamos o script Python (outlook_integration.py)
  const pythonProcess = spawn("python", [
    "outlook_integration.py",
    to,
    bcc,
    subject,
    message
  ]);

  let errorData = "";

  pythonProcess.stderr.on("data", (data) => {
    errorData += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: errorData });
    }
  });
});

// --------------------------
//  EXPORTAR PARA OUTLOOK
// --------------------------
app.post("/export-outlook/:listName", (req, res) => {
  const listName = req.params.listName;
  const list = db.prepare(`
    SELECT id FROM lists
    WHERE name = ?
  `).get(listName);

  if (!list) return res.status(404).json({ error: "Lista não encontrada." });

  const emails = db
    .prepare(`
      SELECT email FROM emails
      WHERE list_id = ?
    `)
    .all(list.id);

  const emailsJoined = emails.map((e) => e.email).join("; ");

  // Chamamos o script Python
  const pythonProcess = spawn("python", [
    "outlook_integration.py",
    "recepcao@prevenirss.com.br",
    emailsJoined,
    "Assunto do E-mail",
    "Conteúdo do E-mail"
  ]);

  let errorData = "";

  pythonProcess.stderr.on("data", (data) => {
    errorData += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      return res.json({ success: true, message: emailsJoined });
    } else {
      return res.status(500).json({ error: errorData });
    }
  });
});

// --------------------------
//  IMPORTAR DE CSV
// --------------------------
app.post("/lists/:listName/import-csv", (req, res) => {
  const listName = req.params.listName;
  const { filePath } = req.body;
  const list = db.prepare(`
    SELECT id FROM lists WHERE name = ?
  `).get(listName);

  if (!list)
    return res.status(404).json({ error: "Lista não encontrada." });

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "Arquivo CSV não encontrado." });
  }

  let count = 0;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      const insertStmt = db.prepare(`
        INSERT INTO emails
        (list_id, email, empresa, contato, telefone, obs, tags)
        VALUES (?, ?, '', '', '', '', '')
      `);

      results.forEach((row) => {
        const em = row.email;
        if (em) {
          const already = db
            .prepare(`
              SELECT * FROM emails
              WHERE list_id = ? AND email = ?
            `)
            .get(list.id, em);

          if (!already) {
            insertStmt.run(list.id, em.trim());
            count++;
          }
        }
      });
      res.json({ imported: count });
    });
});

// --------------------------
//  EXPORTAR PARA CSV
// --------------------------
app.get("/lists/:listName/export-csv", (req, res) => {
  const listName = req.params.listName;
  const list = db
    .prepare(`
      SELECT id FROM lists
      WHERE name = ?
    `)
    .get(listName);

  if (!list)
    return res.status(404).json({ error: "Lista não encontrada." });

  const emails = db
    .prepare(`
      SELECT email, empresa, contato, telefone, obs, tags
      FROM emails
      WHERE list_id = ?
    `)
    .all(list.id);

  // Converter para CSV
  const parser = new Parser({
    fields: ["email", "empresa", "contato", "telefone", "obs", "tags"]
  });
  const csvData = parser.parse(emails);

  res.setHeader("Content-disposition", `attachment; filename=${listName}.csv`);
  res.set("Content-Type", "text/csv");
  res.status(200).send(csvData);
});

// --------------------------
//  GERAR RELATÓRIO
// --------------------------
app.get("/reports/general", (req, res) => {
  try {
    const totalLists = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM lists
    `).get().cnt;

    const totalEmails = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM emails
    `).get().cnt;

    // Lista mais populosa
    const top = db.prepare(`
      SELECT l.name, COUNT(e.id) as count
      FROM lists l
      LEFT JOIN emails e ON e.list_id = l.id
      GROUP BY l.id
      ORDER BY count DESC
      LIMIT 1
    `).get();

    const topListName = top ? `${top.name} (${top.count} e-mails)` : "N/A";

    return res.json({
      totalLists,
      totalEmails,
      topList: topListName
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Servindo o Front-end estático a partir de /frontend
// ----------------------------------------------------
app.use(express.static("frontend"));

// Abre index.html em "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ROTA DE REGISTRO DE NOVO USUÁRIO
app.post("/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Usuário e senha são obrigatórios." });
  }

  // Verifica se usuário já existe
  const existing = db
    .prepare(`
      SELECT * FROM users WHERE username = ?
    `)
    .get(username);

  if (existing) {
    return res.json({
      success: false,
      message: "Usuário já cadastrado."
    });
  }

  // Insere no banco
  try {
    db.prepare(`
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `).run(username, password);

    return res.json({
      success: true,
      message: "Usuário registrado com sucesso!"
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Erro ao registrar usuário." });
  }
});

// --------------------------
//  FUNÇÃO AUXILIAR: LIMPAR E SEPARAR E-MAILS
// --------------------------
function separateAndCleanEmails(raw) {
  // Substitui vírgulas e quebras de linha por ponto-e-vírgula
  const replaced = raw.replace(/,/g, ";").replace(/\n/g, ";");
  const parts = replaced.split(";").map((p) => p.trim()).filter(Boolean);

  // Regex básica de e-mail
  const emailRegex = /[\w.-]+@[\w.-]+/;
  const validEmails = [];

  for (const part of parts) {
    const match = part.match(emailRegex);
    if (match) validEmails.push(match[0]);
  }

  // Ordenar por domínio e depois por nome
  validEmails.sort((a, b) => {
    const domainA = a.split("@")[1];
    const domainB = b.split("@")[1];
    if (domainA < domainB) return -1;
    if (domainA > domainB) return 1;

    // Se domínios iguais, comparar a parte antes do @
    const userA = a.split("@")[0];
    const userB = b.split("@")[0];
    return userA.localeCompare(userB);
  });

  return validEmails;
}

// Inicia servidor
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});


