(() => {
    "use strict";
    let responsible;
    try { responsible = JSON.parse(localStorage.getItem("responsavel") || "null"); }
    catch { responsible = null; }
    const params = new URLSearchParams(location.search);
    const patientId = params.get("patientId");
    const psychologistId = params.get("psychologistId");
    if (!responsible?.id_responsavel || !patientId || !psychologistId) {
        location.replace("../../entrar.html");
        return;
    }

    const scopedKey = (prefix, id) => `${prefix}:${encodeURIComponent(String(id))}`;
    const requestKey = scopedKey("falaleve_solicitacoes", psychologistId);
    const accepted = status => ["aceita", "accepted"].includes(String(status || "").toLocaleLowerCase("pt-BR"));
    let ownRequests = [];
    if (responsible.modo_demo) {
        try { ownRequests = JSON.parse(localStorage.getItem(requestKey) || "[]"); } catch { ownRequests = []; }
        ownRequests = Array.isArray(ownRequests) ? ownRequests.filter(request =>
            String(request.responsavelId) === String(responsible.id_responsavel) &&
            String(request.patientId || request.id_paciente) === String(patientId) && accepted(request.status)
        ) : [];
        if (!ownRequests.length) { location.replace("../menu-responsavel.html"); return; }
    }

    const beneficiary = ownRequests[0]?.paciente;
    const beneficiaryName = beneficiary?.nome_paciente || "Pessoa acompanhada";
    const historyKey = `falaleve_chat:${encodeURIComponent(String(psychologistId))}:${encodeURIComponent(String(patientId))}`;
    const messages = document.getElementById("messages");
    const form = document.getElementById("messageForm");
    const input = document.getElementById("messageInput");
    function readMessages() {
        try { const saved = JSON.parse(localStorage.getItem(historyKey) || "[]"); return Array.isArray(saved) ? saved : []; }
        catch { return []; }
    }
    function formatTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    function renderMessages() {
        const history = readMessages();
        messages.replaceChildren();
        const divider = document.createElement("div");
        divider.className = "date-divider";
        const label = document.createElement("span");
        label.textContent = history.length ? "Histórico da conversa" : "Início da conversa";
        divider.append(label);
        messages.append(divider);
        history.forEach(message => {
            const wrapper = document.createElement("div");
            wrapper.className = `message ${message.senderRole === "psychologist" ? "received" : "sent"}`;
            const bubble = document.createElement("div");
            bubble.className = "message-bubble";
            bubble.textContent = message.text;
            const time = document.createElement("span");
            time.className = "message-time";
            time.textContent = `${message.senderRole === "psychologist" ? "Psicólogo" : "Você · Responsável"} · ${formatTime(message.createdAt)}`;
            wrapper.append(bubble, time);
            messages.append(wrapper);
        });
        messages.scrollTop = messages.scrollHeight;
    }
    form.addEventListener("submit", event => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const history = readMessages();
        history.push({
            id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            senderRole: "responsible",
            senderId: responsible.id_responsavel,
            senderName: responsible.nome_responsavel || "Responsável",
            text,
            createdAt: new Date().toISOString()
        });
        try { localStorage.setItem(historyKey, JSON.stringify(history)); }
        catch { return; }
        input.value = "";
        renderMessages();
    });
    document.getElementById("chatPatientName").textContent = `Conversa sobre ${beneficiaryName}`;
    document.getElementById("chatPatientTag").textContent = "Psicólogo";
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("responsavel");
        location.replace("../../entrar.html");
    });
    window.addEventListener("storage", event => { if (event.key === historyKey) renderMessages(); });
    renderMessages();
})();
