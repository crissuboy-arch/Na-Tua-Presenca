/* ===== Na Tua Presenca - SPA v1.0 ===== */
const API = window.location.origin + "/api";
let state = { user: null, token: null, currentView: "today", chatHistory: [] };

function escapeHTML(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function apiUrl(path) { return `${API}${path}`; }

async function apiCall(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  const res = await fetch(apiUrl(path), { ...options, headers });
  if (res.status === 401 && state.token) {
    localStorage.removeItem("ntp_token");
    state.token = null; state.user = null;
    showAuth();
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro de rede" }));
    throw new Error(err.detail || "Erro desconhecido");
  }
  return res.json();
}

// ===== Auth =====
function showAuth() {
  document.getElementById("app-container").style.display = "none";
  document.getElementById("auth-page").style.display = "flex";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("login-form").style.display = "none";
  document.getElementById("auth-title").textContent = "Criar Conta";
}

function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
  document.getElementById("auth-title").textContent = "Entrar";
  document.getElementById("login-email").focus();
}

function showRegister() {
  document.getElementById("register-form").style.display = "block";
  document.getElementById("login-form").style.display = "none";
  document.getElementById("auth-title").textContent = "Criar Conta";
  document.getElementById("reg-name").focus();
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById("reg-btn");
  btn.disabled = true; btn.textContent = "A criar...";
  try {
    const data = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("reg-email").value,
        name: document.getElementById("reg-name").value,
        password: document.getElementById("reg-password").value
      })
    });
    state.token = data.access_token;
    state.user = data.user;
    localStorage.setItem("ntp_token", state.token);
    initApp();
  } catch (err) { showError("auth-error", err.message); }
  finally { btn.disabled = false; btn.textContent = "Criar Conta"; }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("login-btn");
  btn.disabled = true; btn.textContent = "A entrar...";
  try {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
      })
    });
    state.token = data.access_token;
    state.user = data.user;
    localStorage.setItem("ntp_token", state.token);
    initApp();
  } catch (err) { showError("auth-error", err.message); }
  finally { btn.disabled = false; btn.textContent = "Entrar"; }
}

async function handleLogout() {
  localStorage.removeItem("ntp_token");
  state.token = null; state.user = null;
  showAuth();
}

// ===== App Init =====
async function initApp() {
  document.getElementById("auth-page").style.display = "none";
  document.getElementById("app-container").style.display = "flex";

  if (!state.user && state.token) {
    try { state.user = await apiCall("/auth/me"); }
    catch { showAuth(); return; }
  }

  document.getElementById("user-name").textContent = escapeHTML(state.user.name);
  document.getElementById("user-email").textContent = escapeHTML(state.user.email);
  document.getElementById("user-avatar").textContent = state.user.name.charAt(0).toUpperCase();

  navigate("today");
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = "block"; setTimeout(() => el.style.display = "none", 4000); }
}

// ===== Sidebar =====
function toggleSidebar() {
  const s = document.getElementById("sidebar");
  const o = document.getElementById("sidebar-overlay");
  const t = document.querySelector(".menu-toggle");
  s.classList.toggle("open");
  o.classList.toggle("open");
  t.setAttribute("aria-expanded", s.classList.contains("open"));
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
}

// ===== Navigation =====
function navigate(view) {
  state.currentView = view;
  const content = document.getElementById("page-content");
  const header = document.getElementById("page-header");

  document.querySelectorAll(".nav-item").forEach(n => {
    n.classList.remove("active");
    n.removeAttribute("aria-current");
  });

  const views = {
    today: renderToday,
    calendar: renderCalendar,
    journal: renderJournal,
    prayers: renderPrayers,
    read: renderReader,
    chatbot: renderChatbot
  };

  (views[view] || renderToday)(header, content);
  const activeBtn = document.querySelector(`[data-view="${view}"]`);
  if (activeBtn) { activeBtn.classList.add("active"); activeBtn.setAttribute("aria-current", "page"); }

  closeSidebar();
}

// ===== Today =====
async function renderToday(header, content) {
  header.innerHTML = "<h1>Devocional de Hoje</h1><p>" + new Date().toLocaleDateString("pt-PT", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + "</p>";
  content.innerHTML = '<div class="loading" role="status"><div class="spinner"></div><p>A carregar...</p></div>';

  try {
    const devo = await apiCall("/devotionals/today");
    const stats = await apiCall("/progress/stats");
    renderDevotional(content, devo, stats);
  } catch (err) {
    content.innerHTML = '<div class="error-message" role="alert">' + escapeHTML(err.message) + "</div>";
    if (err.message.includes("nao encontrado")) {
      content.innerHTML = '<div class="empty-state"><div class="icon">📖</div><h3>Nenhum devocional encontrado para hoje</h3></div>';
    }
  }
}

function renderDevotional(container, devo, stats) {
  const pw = stats ? Math.min(stats.percentage, 100) : 0;
  container.innerHTML = `
    <div style="display:flex;gap:32px;flex-wrap:wrap">
      <div class="devotional-card" style="flex:1;min-width:280px">
        <div class="devotional-header">
          <div class="day-badge">Dia ${devo.day} &bull; ${escapeHTML(devo.month)}</div>
          <h2>${escapeHTML(devo.title)}</h2>
          <div class="meta">Semana ${devo.week}</div>
        </div>
        ${devo.verse ? '<div class="devotional-verse">' + escapeHTML(devo.verse) + (devo.reference ? '<span class="ref">' + escapeHTML(devo.reference) + "</span>" : "") + "</div>" : ""}
        <div class="devotional-body">
          <div class="section-label">Reflexao</div>
          ${devo.reflection.split("\n").filter(l => l.trim()).map(p => "<p>" + escapeHTML(p) + "</p>").join("")}
          ${devo.prayer ? '<div class="section-label">Oracao</div><div class="devotional-prayer">' + escapeHTML(devo.prayer).replace(/\n/g, "<br>") + "</div>" : ""}
          ${devo.challenge ? '<div class="section-label">Desafio do Dia</div><div class="devotional-challenge"><h3>' + escapeHTML(devo.title) + '</h3><p>' + escapeHTML(devo.challenge) + "</p></div>" : ""}
        </div>
      </div>
      <div style="width:260px">
        <div class="stat-card gold" style="margin-bottom:16px">
          <div class="stat-value">${pw}%</div>
          <div class="stat-label">Completo</div>
          <div class="progress-bar"><div class="fill" style="width:${pw}%"></div></div>
        </div>
        <div class="stat-card"><div class="stat-value">${stats ? stats.current_streak : 0}</div><div class="stat-label">Dias Seguidos</div></div>
        <div class="stat-card"><div class="stat-value">${stats ? stats.total_read : 0}</div><div class="stat-label">Dias Lidos</div></div>
        <div class="stat-card"><div class="stat-value">${stats ? stats.longest_streak : 0}</div><div class="stat-label">Melhor Sequencia</div></div>
        <button class="btn btn-primary btn-full" onclick="markRead(${devo.day})" style="margin-top:16px" id="btn-mark-read">Marcar como Lido</button>
        <button class="btn btn-secondary btn-full mt-8" onclick="navigate('read')">Ler Outro Dia</button>
      </div>
    </div>
  `;
}

async function markRead(day) {
  const btn = document.getElementById("btn-mark-read");
  if (btn) { btn.disabled = true; btn.textContent = "A marcar..."; }
  try {
    await apiCall("/progress", {
      method: "POST",
      body: JSON.stringify({ day, date: new Date().toISOString().split("T")[0], completed: true })
    });
    navigate("today");
  } catch (err) { alert("Erro: " + err.message); if (btn) { btn.disabled = false; btn.textContent = "Marcar como Lido"; } }
}

// ===== Calendar =====
async function renderCalendar(header, content) {
  header.innerHTML = "<h1>Calendario</h1><p>Os teus 365 dias com Deus</p>";
  content.innerHTML = '<div class="loading" role="status"><div class="spinner"></div></div>';

  try {
    const stats = await apiCall("/progress/stats");
    const calData = await apiCall("/progress/calendar");
    const months = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const now = new Date();
    const yr = now.getFullYear();

    let html = `
      <div class="stats-grid">
        <div class="stat-card gold"><div class="stat-value">${stats.percentage}%</div><div class="stat-label">Completo</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_read}</div><div class="stat-label">Dias Lidos</div></div>
        <div class="stat-card"><div class="stat-value">${stats.current_streak}</div><div class="stat-label">Sequencia Atual</div></div>
        <div class="stat-card"><div class="stat-value">${stats.longest_streak}</div><div class="stat-label">Melhor Sequencia</div></div>
      </div>
    `;

    for (let m = 0; m < 12; m++) {
      html += `<h3 style="margin:24px 0 12px;color:var(--navy)">${months[m]}</h3>`;
      html += '<div class="calendar-header">'+["Dom","Seg","Ter","Qua","Qui","Sex","Sab"].map(d => "<span>"+d+"</span>").join("")+'</div>';
      html += '<div class="calendar-grid">';

      const firstDay = new Date(yr, m, 1).getDay();
      const daysInMonth = new Date(yr, m + 1, 0).getDate();
      const startDayOfYear = Math.floor((new Date(yr, 0, 0) - new Date(yr, 0, 0)) / 86400000);

      for (let d = 0; d < firstDay; d++) html += '<div class="calendar-day empty"></div>';
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = yr+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
        const isToday = now.getFullYear() === yr && now.getMonth() === m && now.getDate() === d;
        const isCompleted = calData && calData[dateStr] && calData[dateStr].completed;
        const dayOfYear = Math.floor((new Date(yr, m, d) - new Date(yr, 0, 0)) / 86400000);
        html += '<div class="calendar-day '+(isToday?"today":"")+" "+(isCompleted?"completed":"")+'" title="Dia '+dayOfYear+'" onclick="navigateToDay('+dayOfYear+')" role="button" tabindex="0"><span class="day-num">'+d+"</span></div>";
      }
      html += "</div>";
    }

    content.innerHTML = html;
  } catch (err) { content.innerHTML = '<div class="error-message" role="alert">'+escapeHTML(err.message)+"</div>"; }
}

function navigateToDay(day) {
  renderReader(document.getElementById("page-header"), document.getElementById("page-content"), day);
}

// ===== Reader =====
async function renderReader(header, content, day = null) {
  header.innerHTML = "<h1>Ler Devocional</h1><p>Escolhe um dia para ler</p>";

  if (day === null) {
    content.innerHTML = `
      <div style="max-width:400px">
        <div class="form-group">
          <label for="day-input">Dia (1-365)</label>
          <input type="number" id="day-input" min="1" max="365" value="${new Date().getDate()}" style="font-size:18px;padding:14px">
        </div>
        <button class="btn btn-primary btn-full" onclick="navigateToDay(document.getElementById('day-input').value)">Ler</button>
        <button class="btn btn-secondary btn-full mt-16" onclick="navigateToDay(${Math.floor(Math.random()*365)+1})">Devocional Aleatorio</button>
      </div>
    `;
    return;
  }

  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const devo = await apiCall("/devotionals/day/${day}");
    content.innerHTML = `
      <div class="devotional-card">
        <div class="devotional-header">
          <div class="day-badge">Dia ${devo.day} &bull; ${escapeHTML(devo.month)}</div>
          <h2>${escapeHTML(devo.title)}</h2>
          <div class="meta">Semana ${devo.week}</div>
        </div>
        ${devo.verse ? '<div class="devotional-verse">' + escapeHTML(devo.verse) + (devo.reference ? '<span class="ref">' + escapeHTML(devo.reference) + "</span>" : "") + "</div>" : ""}
        <div class="devotional-body">
          <div class="section-label">Reflexao</div>
          ${devo.reflection.split("\n").filter(l => l.trim()).map(p => "<p>" + escapeHTML(p) + "</p>").join("")}
          ${devo.prayer ? '<div class="section-label">Oracao</div><div class="devotional-prayer">' + escapeHTML(devo.prayer).replace(/\n/g, "<br>") + "</div>" : ""}
          ${devo.challenge ? '<div class="section-label">Desafio do Dia</div><div class="devotional-challenge"><h3>' + escapeHTML(devo.title) + '</h3><p>' + escapeHTML(devo.challenge) + "</p></div>" : ""}
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="markRead(${devo.day})">Marcar como Lido</button>
        <button class="btn btn-secondary" onclick="navigateToDay(${devo.day + 1})">Dia Seguinte</button>
        <button class="btn btn-secondary" onclick="navigateToDay(${devo.day - 1})">Dia Anterior</button>
      </div>
    `;
  } catch (err) { content.innerHTML = '<div class="error-message" role="alert">'+escapeHTML(err.message)+"</div>"; }
}

// ===== Journal =====
async function renderJournal(header, content) {
  header.innerHTML = "<h1>Diario da Alma</h1><p>Regista os teus pensamentos</p>";
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);

  try {
    let existingEntry = null;
    try { existingEntry = await apiCall("/journal/day/" + dayOfYear); } catch {}

    content.innerHTML = `
      <div style="max-width:700px">
        <div class="journal-editor" style="margin-bottom:24px">
          <h3 style="margin-bottom:8px;color:var(--navy)">Diario - Dia ${dayOfYear}</h3>
          <textarea id="journal-content" placeholder="Escreve aqui os teus pensamentos, oracoes e reflexoes...">${existingEntry ? escapeHTML(existingEntry.content) : ""}</textarea>
          <div style="display:flex;gap:12px;margin-top:12px;align-items:center">
            <button class="btn btn-primary" onclick="saveJournal(${dayOfYear})">Salvar</button>
            <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;font-family:var(--font-sans)">
              <input type="checkbox" id="journal-public" ${existingEntry && existingEntry.is_public ? "checked" : ""}>
              Publico
            </label>
          </div>
        </div>
        <h3 style="margin-bottom:12px;color:var(--navy)">Entradas Anteriores</h3>
        <div id="journal-list"></div>
      </div>
    `;

    const entries = await apiCall("/journal");
    const list = document.getElementById("journal-list");
    if (!entries.items || entries.items.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="icon">📝</div><h3>Nenhuma entrada ainda</h3><p>Comeca a escrever hoje!</p></div>';
    } else {
      list.innerHTML = entries.items.filter(e => e.day !== dayOfYear).sort((a, b) => b.day - a.day).slice(0, 10).map(e =>
        '<div class="journal-entry"><div class="day-label">Dia ' + e.day + '</div><div class="content">' + escapeHTML(e.content.length > 200 ? e.content.substring(0, 200) + "..." : e.content) + '</div><div class="date">' + new Date(e.created_at).toLocaleDateString("pt-PT") + "</div></div>"
      ).join("");
    }
  } catch (err) { content.innerHTML = '<div class="error-message" role="alert">'+escapeHTML(err.message)+"</div>"; }
}

async function saveJournal(day) {
  const content = document.getElementById("journal-content").value;
  const isPublic = document.getElementById("journal-public").checked;
  if (!content.trim()) return alert("Escreve algo primeiro!");
  try {
    await apiCall("/journal", {
      method: "POST",
      body: JSON.stringify({ day, content, is_public: isPublic })
    });
    alert("Salvo com sucesso!");
    navigate("journal");
  } catch (err) { alert("Erro: " + err.message); }
}

// ===== Prayers =====
async function renderPrayers(header, content) {
  header.innerHTML = "<h1>Pedidos de Oracao</h1><p>Compartilha as tuas intencoes</p>";
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const data = await apiCall("/prayers");

    content.innerHTML = `
      <div style="max-width:700px">
        <h3 style="margin-bottom:12px;color:var(--navy)">Novo Pedido</h3>
        <div style="background:var(--white);padding:20px;border-radius:8px;box-shadow:var(--shadow);margin-bottom:32px">
          <div class="form-group">
            <label for="prayer-title">Titulo</label>
            <input type="text" id="prayer-title" placeholder="Ex: Cura, Trabalho, Familia...">
          </div>
          <div class="form-group">
            <label for="prayer-content">Pedido</label>
            <textarea id="prayer-content" rows="3" placeholder="Partilha o teu pedido de oracao..." style="width:100%;padding:12px;border:2px solid var(--cream-dark);border-radius:8px;font-family:inherit;font-size:15px;resize:vertical"></textarea>
          </div>
          <div style="display:flex;gap:12px;align-items:center">
            <button class="btn btn-primary" onclick="submitPrayer()">Enviar</button>
            <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;font-family:var(--font-sans)">
              <input type="checkbox" id="prayer-anonymous"> Anonimo
            </label>
          </div>
        </div>
        <h3 style="margin-bottom:12px;color:var(--navy)">Meus Pedidos</h3>
        <div id="prayer-list"></div>
      </div>
    `;

    const list = document.getElementById("prayer-list");
    if (!data.items || data.items.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="icon">🙏</div><h3>Nenhum pedido ainda</h3></div>';
    } else {
      list.innerHTML = data.items.map(p =>
        '<div class="prayer-card"><div class="title">' + escapeHTML(p.title) + ' ' + (p.is_answered ? '<span style="color:green;font-size:12px">(Respondida)</span>' : "") + '</div><div class="content">' + escapeHTML(p.content) + '</div><div class="meta"><span>' + new Date(p.created_at).toLocaleDateString("pt-PT") + '</span>' + (p.is_anonymous ? "<span>Anonimo</span>" : "") + '<button class="btn btn-danger" style="padding:4px 12px;font-size:12px;margin-left:auto" onclick="deletePrayer(' + p.id + ')">Apagar</button></div></div>'
      ).join("");
    }
  } catch (err) { content.innerHTML = '<div class="error-message" role="alert">'+escapeHTML(err.message)+"</div>"; }
}

async function submitPrayer() {
  const title = document.getElementById("prayer-title").value;
  const content = document.getElementById("prayer-content").value;
  const anonymous = document.getElementById("prayer-anonymous").checked;
  if (!title || !content) return alert("Preenche titulo e pedido!");
  try {
    await apiCall("/prayers", {
      method: "POST",
      body: JSON.stringify({ title, content, is_anonymous: anonymous })
    });
    navigate("prayers");
  } catch (err) { alert("Erro: " + err.message); }
}

async function deletePrayer(id) {
  if (!confirm("Tens certeza?")) return;
  try { await apiCall("/prayers/${id}", { method: "DELETE" }); navigate("prayers"); }
  catch (err) { alert("Erro: " + err.message); }
}

// ===== Chatbot =====
async function renderChatbot(header, content) {
  header.innerHTML = "<h1>Chat Espiritual</h1><p>Pergunta, reflete ou ora connosco</p>";
  content.innerHTML = `
    <div class="chat-container">
      <div id="chat-messages" class="chat-messages">
        <div class="chat-msg bot">
          <div class="msg-label">Assistente</div>
          <div class="msg-content">Ola! Sou o teu irmao em Cristo. Como posso ajudar hoje? Podes fazer uma pergunta, pedir uma oracao, ou refletir sobre um versiculo.</div>
        </div>
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Escreve a tua mensagem..." onkeydown="if(event.key==='Enter') sendChat()" autofocus>
        <button class="btn btn-primary" onclick="sendChat()">Enviar</button>
      </div>
    </div>
  `;
  state.chatHistory = [];
}

async function sendChat() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;

  const container = document.getElementById("chat-messages");

  container.innerHTML += '<div class="chat-msg user"><div class="msg-label">Tu</div><div class="msg-content">' + escapeHTML(msg) + '</div></div>';
  input.value = "";
  container.scrollTop = container.scrollHeight;

  container.innerHTML += '<div class="chat-typing" id="chat-typing"><span></span><span></span><span></span></div>';
  container.scrollTop = container.scrollHeight;

  try {
    const history = state.chatHistory.slice(-10).map(h => h.user + ":::" + h.bot).join("|||");
    const data = await apiCall("/chatbot/chat?message=" + encodeURIComponent(msg) + "&history=" + encodeURIComponent(history));

    document.getElementById("chat-typing")?.remove();

    const botMsg = data.response || "Desculpa, nao consegui processar a tua mensagem. Tenta novamente.";
    container.innerHTML += '<div class="chat-msg bot"><div class="msg-label">Assistente</div><div class="msg-content">' + escapeHTML(botMsg) + '</div></div>';
    state.chatHistory.push({ user: msg, bot: botMsg });
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    document.getElementById("chat-typing")?.remove();
    container.innerHTML += '<div class="chat-msg bot"><div class="msg-label">Assistente</div><div class="msg-content">Desculpa, ocorreu um erro. Tenta novamente.</div></div>';
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  const savedToken = localStorage.getItem("ntp_token");
  if (savedToken) {
    state.token = savedToken;
    initApp();
  } else {
    showAuth();
  }
});
