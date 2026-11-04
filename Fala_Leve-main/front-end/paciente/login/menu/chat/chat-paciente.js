(() => {
    "use strict";
    let patient;
    try { patient = JSON.parse(localStorage.getItem("paciente") || "null"); }
    catch { patient = null; }
    const params = new URLSearchParams(location.search);
    const patientId = params.get("patientId") || patient?.id_paciente;
    const psychologistId = params.get("psychologistId");
    if (!patient?.id_paciente || !patientId || String(patient.id_paciente) !== String(patientId) || !psychologistId) {
        location.replace("../../entrar.html");
        return;
    }

    const scopedKey = (prefix, id) => `${prefix}:${encodeURIComponent(String(id))}`;
    const requestKey = scopedKey("falaleve_solicitacoes", psychologistId);
    const statusAccepted = status => ["aceita", "accepted"].includes(String(status || "").toLocaleLowerCase("pt-BR"));
    if (patient.modo_demo) {
        let requests = [];
        try { requests = JSON.parse(localStorage.getItem(requestKey) || "[]"); } catch { requests = []; }
        const hasAccess = Array.isArray(requests) && requests.some(request =>
            String(request.patientId || request.id_paciente) === String(patientId) && statusAccepted(request.status)
        );
        if (!hasAccess) { location.replace("../menu-paciente.html"); return; }
    }

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
            time.textContent = `${message.senderRole === "psychologist" ? "Psicólogo" : "Você"} · ${formatTime(message.createdAt)}`;
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
            senderRole: "patient",
            senderId: patientId,
            senderName: patient.nome_paciente || patient.nome || "Paciente",
            text,
            createdAt: new Date().toISOString()
        });
        try { localStorage.setItem(historyKey, JSON.stringify(history)); }
        catch { return; }
        input.value = "";
        renderMessages();
    });
    document.getElementById("chatPatientName").textContent = "Conversa com seu psicólogo";
    document.getElementById("chatPatientTag").textContent = "Psicólogo";
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("paciente");
        location.replace("../../entrar.html");
    });
    window.addEventListener("storage", event => { if (event.key === historyKey) renderMessages(); });
    renderMessages();
})();
