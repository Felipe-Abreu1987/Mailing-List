// Criar um template
app.post("/templates", (req, res) => {
    const { name, subject, body } = req.body;
  
    try {
      db.prepare(`
        INSERT INTO email_templates (name, subject, body)
        VALUES (?, ?, ?)
      `).run(name, subject, body);
  
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });
  
  // Listar templates
  app.get("/templates", (req, res) => {
    try {
      const templates = db
        .prepare(`SELECT * FROM email_templates`)
        .all();
      res.json(templates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
