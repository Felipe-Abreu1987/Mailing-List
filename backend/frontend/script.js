// URL base do servidor Node
const API_URL = "http://localhost:3000";

// Elementos gerais
const loginSection = document.getElementById("login-section");
const mainApp = document.getElementById("main-app");
const loginForm = document.getElementById("login-form");
const loginResult = document.getElementById("login-result");

const pasteEmails = document.getElementById("paste-emails");
const btnSeparate = document.getElementById("btn-separate");
const listsUl = document.getElementById("lists-ul");
const btnCreateList = document.getElementById("btn-create-list");
const btnDeleteList = document.getElementById("btn-delete-list");
const btnRenameList = document.getElementById("btn-rename-list");

const selectedListInfo = document.getElementById("selected-list-info");
const emailsTableBody = document.querySelector("#emails-table tbody");

// Botões de integração
const btnCreateEmail = document.getElementById("btn-create-email");
const btnExportOutlook = document.getElementById("btn-export-outlook");
const btnImportCsv = document.getElementById("btn-import-csv");
const btnExportCsv = document.getElementById("btn-export-csv");
const btnGenerateReport = document.getElementById("btn-generate-report");

// Modal criar e-mail
const createEmailModal = document.getElementById("create-email-modal");
const closeCreateEmail = document.getElementById("close-create-email");
const btnSendEmail = document.getElementById("btn-send-email");
const emailTo = document.getElementById("email-to");
const emailBcc = document.getElementById("email-bcc");
const emailSubject = document.getElementById("email-subject");
const emailMessage = document.getElementById("email-message");

let currentListName = null;

/* =========================
   LOGIN
========================= */
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      loginSection.style.display = "none";
      mainApp.style.display = "block";
      loadLists();
    } else {
      loginResult.innerText = data.message;
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   CARREGA LISTAS
========================= */
async function loadLists() {
  listsUl.innerHTML = "";
  try {
    const res = await fetch(`${API_URL}/lists`);
    const data = await res.json();
    data.forEach((list) => {
      const li = document.createElement("li");
      li.textContent = `${list.name} (${list.count} e-mails)`;
      li.addEventListener("click", () => {
        currentListName = list.name;
        selectedListInfo.textContent = `Lista selecionada: ${list.name} (${list.count} e-mails)`;
        loadEmails(list.name);
      });
      listsUl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   CARREGA E-MAILS DA LISTA
========================= */
async function loadEmails(listName) {
  emailsTableBody.innerHTML = "";
  try {
    const res = await fetch(`${API_URL}/lists/${listName}/emails`);
    const data = await res.json();
    data.forEach((emailData, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td contenteditable="true" class="editable" data-field="email">${emailData.email}</td>
        <td contenteditable="true" class="editable" data-field="empresa">${emailData.empresa}</td>
        <td contenteditable="true" class="editable" data-field="contato">${emailData.contato}</td>
        <td contenteditable="true" class="editable" data-field="telefone">${emailData.telefone}</td>
        <td contenteditable="true" class="editable" data-field="obs">${emailData.obs}</td>
        <td contenteditable="true" class="editable" data-field="tags">${(emailData.tags || "").join(", ")}</td>
        <td>
          <button class="btn-move">Mover</button>
          <button class="btn-delete">Excluir</button>
        </td>
      `;
      // Evento de edição
      row.querySelectorAll(".editable").forEach((cell) => {
        cell.addEventListener("blur", () => {
          const newValue = cell.innerText;
          const field = cell.dataset.field;
          updateEmail(listName, emailData.email, field, newValue);
        });
      });
      // Botão mover
      row.querySelector(".btn-move").addEventListener("click", async () => {
        const destination = prompt("Digite o nome da lista de destino:");
        if (destination) {
          await fetch(`${API_URL}/lists/${listName}/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailData.email,
              destinationList: destination
            })
          });
          loadLists();
          loadEmails(listName);
        }
      });
      // Botão excluir
      row.querySelector(".btn-delete").addEventListener("click", async () => {
        if (confirm(`Deseja excluir o e-mail '${emailData.email}'?`)) {
          await fetch(`${API_URL}/lists/${listName}/emails/${encodeURIComponent(emailData.email)}`, {
            method: "DELETE"
          });
          loadLists();
          loadEmails(listName);
        }
      });

      emailsTableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   ATUALIZAÇÃO DE E-MAIL
========================= */
async function updateEmail(listName, oldEmail, field, newValue) {
  try {
    await fetch(`${API_URL}/lists/${listName}/emails/${encodeURIComponent(oldEmail)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, newValue })
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   SEPARAR E-MAILS
========================= */
btnSeparate.addEventListener("click", async () => {
  const rawEmails = pasteEmails.value.trim();
  if (!rawEmails) return alert("Nenhum e-mail foi colado.");
  const listName = prompt("Digite um nome para a lista de e-mails:");
  if (!listName) return;

  try {
    const res = await fetch(`${API_URL}/lists/${listName}`, {
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

/* =========================
   CRIAR LISTA
========================= */
btnCreateList.addEventListener("click", async () => {
  const newList = prompt("Nome da nova lista:");
  if (!newList) return;
  try {
    const res = await fetch(`${API_URL}/lists/${newList}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawEmails: "" })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Lista "${newList}" criada com sucesso.`);
      loadLists();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   EXCLUIR LISTA
========================= */
btnDeleteList.addEventListener("click", async () => {
  if (!currentListName) return alert("Nenhuma lista selecionada.");
  if (!confirm(`Tem certeza que deseja excluir a lista "${currentListName}"?`)) return;
  try {
    const res = await fetch(`${API_URL}/lists/${currentListName}`, {
      method: "DELETE"
    });
    if (res.ok) {
      alert(`Lista "${currentListName}" excluída.`);
      currentListName = null;
      selectedListInfo.textContent = "";
      emailsTableBody.innerHTML = "";
      loadLists();
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   RENOMEAR LISTA
========================= */
btnRenameList.addEventListener("click", async () => {
  if (!currentListName) return alert("Nenhuma lista selecionada.");
  const newListName = prompt(`Digite o novo nome para a lista "${currentListName}":`);
  if (!newListName) return;
  try {
    const res = await fetch(`${API_URL}/lists/${currentListName}/rename`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName: newListName })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      currentListName = newListName;
      loadLists();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   CRIAR E-MAIL
========================= */
btnCreateEmail.addEventListener("click", () => {
  if (!currentListName) return alert("Nenhuma lista selecionada.");
  // Carregar e-mails da lista para o campo BCC
  fetch(`${API_URL}/lists/${currentListName}/emails`)
    .then((res) => res.json())
    .then((data) => {
      const addresses = data.map((item) => item.email);
      emailBcc.value = addresses.join("; ");
      createEmailModal.style.display = "block";
    });
});

// Fecha modal
closeCreateEmail.addEventListener("click", () => {
  createEmailModal.style.display = "none";
});

/* =========================
   ENVIAR E-MAIL (Outlook)
========================= */
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
      createEmailModal.style.display = "none";
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   EXPORTAR PARA OUTLOOK
========================= */
btnExportOutlook.addEventListener("click", async () => {
  if (!currentListName) return alert("Nenhuma lista selecionada.");
  try {
    const res = await fetch(`${API_URL}/export-outlook/${currentListName}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(`E-mails exportados para o Outlook no campo CCo: ${data.message}`);
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   IMPORTAR CSV
========================= */
btnImportCsv.addEventListener("click", async () => {
  if (!currentListName) return alert("Nenhuma lista selecionada.");
  // Em um caso real, exibir um <input type="file"> ou usar <input hidden> para pegar o arquivo local
  const filePath = prompt("Digite o caminho do CSV no servidor:");
  if (!filePath) return;

  try {
    const res = await fetch(`${API_URL}/lists/${currentListName}/import-csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`${data.imported} e-mails importados da CSV com sucesso.`);
      loadEmails(currentListName);
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   EXPORTAR CSV
========================= */
btnExportCsv.addEventListener("click", async () => {
  if (!currentListName) return alert("Nenhuma lista selecionada.");
  try {
    const res = await fetch(`${API_URL}/lists/${currentListName}/export-csv`);
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

/* =========================
   GERAR RELATÓRIO
========================= */
btnGenerateReport.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_URL}/reports/general`);
    const data = await res.json();
    if (res.ok) {
      alert(`Relatório:\n- Total de listas: ${data.totalLists}\n- Total de e-mails: ${data.totalEmails}\n- Lista mais populosa: ${data.topList}`);
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
  }
});
