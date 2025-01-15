/****************************************************
 * script.js adaptado para uso com o novo index.html
 * e style.css que aproveitam o Bootstrap
 ****************************************************/

// URL base do servidor Node
const API_URL = "http://localhost:3000";

/* ========== Seletores do DOM ========== */

// Seções principais
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const mainSection = document.getElementById("main-section");

// Botões e campos de login
const btnLogin = document.getElementById("btn-login");
const loginResult = document.getElementById("login-result");
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");

// Links para alternar entre login e registro
const linkRegister = document.getElementById("link-register");
const linkBackLogin = document.getElementById("link-back-login");

// Campos e botão de registro
const registerUsername = document.getElementById("register-username");
const registerPassword = document.getElementById("register-password");
const btnCreateUser = document.getElementById("btn-create-user");
const registerResult = document.getElementById("register-result");

// Campo para colar e-mails e botão
const pasteEmails = document.getElementById("paste-emails");
const btnSeparate = document.getElementById("btn-separate");

// Lista de listas e botões
const listsUl = document.getElementById("lists-ul");
const btnDeleteList = document.getElementById("btn-delete-list");
const btnRenameList = document.getElementById("btn-rename-list");
const btnExportOutlook = document.getElementById("btn-export-outlook");

// Exibição da lista selecionada e tabela de e-mails
const selectedListTitle = document.getElementById("selected-list-title"); 
const emailsTableBody = document.querySelector("#emails-table tbody");

// Botões de importação/exportação
const btnImportCsv = document.getElementById("btn-import-csv");
const btnExportCsv = document.getElementById("btn-export-csv");

// Relatório
const btnGenerateReport = document.getElementById("btn-generate-report");

// (Opcional) Botão para criar lista
const btnCreateList = document.getElementById("btn-create-list"); 

// Modal de criar e-mail
const btnCreateEmail = document.getElementById("btn-create-email");
const emailTo = document.getElementById("email-to");
const emailBcc = document.getElementById("email-bcc");
const emailSubject = document.getElementById("email-subject");
const emailMessage = document.getElementById("email-message");
const btnSendEmail = document.getElementById("btn-send-email");

// Identificador do modal
// Vamos abrir/fechar usando Bootstrap ( $('#modal-create-email').modal(...) )
const modalCreateEmail = document.getElementById("modal-create-email");

// Estado global
let currentListName = null;

/* =========================
   ALTERNÂNCIA LOGIN/REGISTRO
========================= */
if (linkRegister) {
  linkRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginSection.classList.add("d-none");
    registerSection.classList.remove("d-none");
  });
}
if (linkBackLogin) {
  linkBackLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerSection.classList.add("d-none");
    loginSection.classList.remove("d-none");
  });
}

/* =========================
   LOGIN
========================= */
if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    const user = usernameField.value.trim();
    const pass = passwordField.value.trim();
    if (!user || !pass) {
      loginResult.innerText = "Usuário e senha são obrigatórios.";
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        // Esconde login e registro, mostra main
        loginSection.classList.add("d-none");
        registerSection.classList.add("d-none");
        mainSection.classList.remove("d-none");
        loadLists(); // Carrega as listas
      } else {
        loginResult.innerText = data.message || "Falha no login.";
      }
    } catch (err) {
      console.error(err);
      loginResult.innerText = "Erro ao tentar logar.";
    }
  });
}

/* =========================
   REGISTRO
========================= */
if (btnCreateUser) {
  btnCreateUser.addEventListener("click", async () => {
    const user = registerUsername.value.trim();
    const pass = registerPassword.value.trim();
    if (!user || !pass) {
      registerResult.innerText = "Usuário e senha são obrigatórios.";
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        registerResult.innerText = data.message || "Usuário criado!";
        registerUsername.value = "";
        registerPassword.value = "";
      } else {
        registerResult.innerText = data.message || "Erro ao criar usuário.";
      }
    } catch (err) {
      console.error(err);
      registerResult.innerText = "Erro na requisição de registro.";
    }
  });
}

/* =========================
   CARREGAR LISTAS
========================= */
async function loadLists() {
  if (!listsUl) return;
  listsUl.innerHTML = "";
  try {
    const res = await fetch(`${API_URL}/lists`);
    const data = await res.json();
    data.forEach((list) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item");
      li.textContent = `${list.name} (${list.count} e-mails)`;
      li.addEventListener("click", () => {
        currentListName = list.name;
        if (selectedListTitle) {
          selectedListTitle.textContent = `Lista: ${list.name} (${list.count} e-mails)`;
        }
        loadEmails(list.name);
      });
      listsUl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   CARREGAR E-MAILS DA LISTA
========================= */
async function loadEmails(listName) {
  if (!emailsTableBody) return;
  emailsTableBody.innerHTML = "";
  try {
    const res = await fetch(`${API_URL}/lists/${encodeURIComponent(listName)}/emails`);
    const data = await res.json();

    data.forEach((emailData, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td contenteditable="true" class="editable" data-field="email">${emailData.email || ""}</td>
        <td contenteditable="true" class="editable" data-field="empresa">${emailData.empresa || ""}</td>
        <td contenteditable="true" class="editable" data-field="contato">${emailData.contato || ""}</td>
        <td contenteditable="true" class="editable" data-field="telefone">${emailData.telefone || ""}</td>
        <td contenteditable="true" class="editable" data-field="obs">${emailData.obs || ""}</td>
        <td contenteditable="true" class="editable" data-field="tags">${(emailData.tags || []).join(", ")}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary btn-move">Mover</button>
          <button class="btn btn-sm btn-outline-danger btn-delete">Excluir</button>
        </td>
      `;

      // Edição inline (blur)
      row.querySelectorAll(".editable").forEach((cell) => {
        cell.addEventListener("blur", () => {
          const newValue = cell.innerText;
          const field = cell.dataset.field;
          updateEmail(listName, emailData.email, field, newValue);
        });
      });

      // Botão "Mover"
      const btnMove = row.querySelector(".btn-move");
      btnMove.addEventListener("click", async () => {
        const destination = prompt("Digite o nome da lista de destino:");
        if (!destination) return;
        try {
          await fetch(`${API_URL}/lists/${encodeURIComponent(listName)}/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailData.email,
              destinationList: destination
            })
          });
          loadLists();
          loadEmails(listName);
        } catch (err) {
          console.error(err);
        }
      });

      // Botão "Excluir"
      const btnDelete = row.querySelector(".btn-delete");
      btnDelete.addEventListener("click", async () => {
        if (confirm(`Deseja excluir o e-mail "${emailData.email}"?`)) {
          try {
            await fetch(`${API_URL}/lists/${encodeURIComponent(listName)}/emails/${encodeURIComponent(emailData.email)}`, {
              method: "DELETE"
            });
            loadLists();
            loadEmails(listName);
          } catch (err) {
            console.error(err);
          }
        }
      });

      emailsTableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   ATUALIZAR UM E-MAIL
========================= */
async function updateEmail(listName, oldEmail, field, newValue) {
  try {
    await fetch(`${API_URL}/lists/${encodeURIComponent(listName)}/emails/${encodeURIComponent(oldEmail)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, newValue })
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   CRIAR/ATUALIZAR LISTA via "Separar E-mails"
========================= */
if (btnSeparate) {
  btnSeparate.addEventListener("click", async () => {
    if (!pasteEmails) return;
    const rawEmails = pasteEmails.value.trim();
    if (!rawEmails) {
      alert("Nenhum e-mail foi colado.");
      return;
    }
    const listName = prompt("Digite um nome para a lista de e-mails:");
    if (!listName) return;

    try {
      const res = await fetch(`${API_URL}/lists/${encodeURIComponent(listName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawEmails })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.count} e-mails adicionados à lista "${listName}".`);
        pasteEmails.value = "";
        loadLists();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   EXCLUIR LISTA
========================= */
if (btnDeleteList) {
  btnDeleteList.addEventListener("click", async () => {
    if (!currentListName) return alert("Nenhuma lista selecionada.");
    if (!confirm(`Tem certeza que deseja excluir a lista "${currentListName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/lists/${encodeURIComponent(currentListName)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert(`Lista "${currentListName}" excluída.`);
        currentListName = null;
        if (selectedListTitle) {
          selectedListTitle.textContent = "Nenhuma lista selecionada";
        }
        emailsTableBody.innerHTML = "";
        loadLists();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   RENOMEAR LISTA
========================= */
if (btnRenameList) {
  btnRenameList.addEventListener("click", async () => {
    if (!currentListName) return alert("Nenhuma lista selecionada.");
    const newListName = prompt(`Digite o novo nome para a lista "${currentListName}":`);
    if (!newListName) return;
    try {
      const res = await fetch(`${API_URL}/lists/${encodeURIComponent(currentListName)}/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: newListName })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Lista renomeada.");
        currentListName = newListName;
        loadLists();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   CRIAR E-MAIL (Mostrar Modal do Bootstrap)
========================= */
if (btnCreateEmail) {
  btnCreateEmail.addEventListener("click", async () => {
    if (!currentListName) return alert("Nenhuma lista selecionada.");
    // Carrega e-mails da lista
    try {
      const res = await fetch(`${API_URL}/lists/${encodeURIComponent(currentListName)}/emails`);
      const data = await res.json();
      const addresses = data.map((item) => item.email);
      emailBcc.value = addresses.join("; ");

      // Exibe modal (via Bootstrap)
      $('#modal-create-email').modal('show');

    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   ENVIAR E-MAIL (Outlook)
========================= */
if (btnSendEmail) {
  btnSendEmail.addEventListener("click", async () => {
    const to = emailTo.value;
    const bcc = emailBcc.value;
    const subject = emailSubject.value;
    const message = emailMessage.value;
    try {
      const res = await fetch(`${API_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, bcc, subject, message })
      });
      const data = await res.json();
      if (res.ok) {
        alert("E-mail preparado no Outlook com sucesso!");
        // Fecha o modal do Bootstrap
        $('#modal-create-email').modal('hide');
      } else {
        alert(data.error || "Erro ao enviar e-mail.");
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   EXPORTAR PARA OUTLOOK
========================= */
if (btnExportOutlook) {
  btnExportOutlook.addEventListener("click", async () => {
    if (!currentListName) return alert("Nenhuma lista selecionada.");
    try {
      const res = await fetch(`${API_URL}/export-outlook/${encodeURIComponent(currentListName)}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`E-mails exportados para o Outlook no campo CCo: ${data.message}`);
      } else {
        alert(data.error || "Erro ao exportar para Outlook.");
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   IMPORTAR CSV
========================= */
if (btnImportCsv) {
  btnImportCsv.addEventListener("click", async () => {
    if (!currentListName) return alert("Nenhuma lista selecionada.");
    const filePath = prompt("Digite o caminho do CSV no servidor:");
    if (!filePath) return;
    try {
      const res = await fetch(`${API_URL}/lists/${encodeURIComponent(currentListName)}/import-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.imported} e-mails importados da CSV com sucesso.`);
        loadEmails(currentListName);
      } else {
        alert(data.error || "Erro ao importar CSV.");
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   EXPORTAR CSV
========================= */
if (btnExportCsv) {
  btnExportCsv.addEventListener("click", async () => {
    if (!currentListName) return alert("Nenhuma lista selecionada.");
    try {
      const res = await fetch(`${API_URL}/lists/${encodeURIComponent(currentListName)}/export-csv`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentListName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

/* =========================
   GERAR RELATÓRIO
========================= */
if (btnGenerateReport) {
  btnGenerateReport.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_URL}/reports/general`);
      const data = await res.json();
      if (res.ok) {
        alert(`Relatório:\n- Total de listas: ${data.totalLists}\n- Total de e-mails: ${data.totalEmails}\n- Lista mais populosa: ${data.topList}`);
      } else {
        alert(data.error || "Erro ao gerar relatório.");
      }
    } catch (err) {
      console.error(err);
    }
  });
}



