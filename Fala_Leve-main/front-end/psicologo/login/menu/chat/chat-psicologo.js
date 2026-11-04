document.addEventListener("DOMContentLoaded", () => {
    let psychologist = null;
    try {
        psychologist = JSON.parse(sessionStorage.getItem("psicologo") || "null");
    } catch {
        sessionStorage.removeItem("psicologo");
    }
    if (!psychologist?.id_psicologo || !psychologist?.email_psicologo) {
        window.location.replace("../../entrar.html");
        return;
    }

    const profileKey = key => `${key}:${encodeURIComponent(String(psychologist.id_psicologo))}`;
    const PATIENTS_KEY = profileKey("falaleve_pacientes");
    const NOTES_KEY = profileKey("falaleve_anotacoes");
    if (psychologist.modo_demo && psychologist.id_psicologo === "demo-psicologo") {
        [["falaleve_pacientes", PATIENTS_KEY], ["falaleve_anotacoes", NOTES_KEY]]
            .forEach(([legacyKey, scopedKey]) => {
                if (localStorage.getItem(scopedKey) === null && localStorage.getItem(legacyKey) !== null) {
                    localStorage.setItem(scopedKey, localStorage.getItem(legacyKey));
                }
            });
    }

    document.getElementById("logoutButton")?.addEventListener("click", () => {
        sessionStorage.removeItem("psicologo");
        window.location.href = "../../entrar.html";
    });

    function readArray(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch { return []; }
    }
    function saveArray(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); return true; }
        catch { alert("Não foi possível salvar no navegador."); return false; }
    }

    const patientId = new URLSearchParams(location.search).get("patientId");
    const patient = readArray(PATIENTS_KEY).find(p => String(p.id) === String(patientId));
    if (!patient) {
        alert("Paciente não encontrado. Abra o chat pela lista de pacientes.");
        location.replace("../menu-psicologo.html");
        return;
    }
    const patientName = patient.name || patient.nome || "Paciente";
    document.getElementById("chatPatientName").textContent = `Conversa com ${patientName}`;
    document.getElementById("chatPatientTag").textContent = patientName;
    const historyKey = `falaleve_chat:${encodeURIComponent(String(psychologist.id_psicologo))}:${encodeURIComponent(String(patient.id))}`;

    const titleInput = document.getElementById("noteTitle");
    const contentInput = document.getElementById("noteContent");
    const feedback = document.getElementById("noteFeedback");

    document.getElementById("saveNotes").addEventListener("click", () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title && !content) {
            feedback.textContent = "Escreva um título ou uma observação antes de salvar.";
            return;
        }
        const notes = readArray(NOTES_KEY);
        const note = {
            id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            patientId: patient.id,
            title: title || "Anotação do atendimento",
            content,
            date: new Date().toISOString(),
            source: "chat-psicologo"
        };
        if (!saveArray(NOTES_KEY, [...notes, note])) return;
        titleInput.value = "";
        contentInput.value = "";
        feedback.textContent = `Anotação salva para ${patientName}. Ela aparecerá no menu do psicólogo.`;
    });

    document.getElementById("clearNotes").addEventListener("click", () => {
        titleInput.value = "";
        contentInput.value = "";
        feedback.textContent = "Campos limpos. As anotações já salvas foram mantidas.";
        titleInput.focus();
    });

    const messageForm = document.getElementById("messageForm");
    const messageInput = document.getElementById("messageInput");
    const messages = document.getElementById("messages");

    function readMessages() {
        try {
            const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
            return Array.isArray(history) ? history : [];
        } catch { return []; }
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
        const dividerText = document.createElement("span");
        dividerText.textContent = history.length ? "Histórico da conversa" : "Início da conversa";
        divider.append(dividerText);
        messages.append(divider);
        history.forEach(message => {
            const isPsychologist = message.senderRole === "psychologist";
            const wrapper = document.createElement("div");
            wrapper.className = `message ${isPsychologist ? "sent" : "received"}`;
            const bubble = document.createElement("div");
            bubble.className = "message-bubble";
            bubble.textContent = message.text;
            const time = document.createElement("span");
            time.className = "message-time";
            const sender = isPsychologist
                ? "Você · Psicólogo"
                : message.senderRole === "responsible"
                    ? `Responsável · ${message.senderName || ""}`
                    : `Paciente · ${message.senderName || patientName}`;
            time.textContent = `${sender} · ${formatTime(message.createdAt)}`;
            wrapper.append(bubble, time);
            messages.append(wrapper);
        });
        messages.scrollTop = messages.scrollHeight;
    }
    messageForm?.addEventListener("submit", event => {
        event.preventDefault();
        const value = messageInput.value.trim();
        if (!value) return;
        const history = readMessages();
        history.push({
            id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            senderRole: "psychologist",
            senderId: psychologist.id_psicologo,
            senderName: psychologist.nome_psicologo || "Psicólogo",
            text: value,
            createdAt: new Date().toISOString()
        });
        if (!saveArray(historyKey, history)) return;
        messageInput.value = "";
        renderMessages();
    });
    window.addEventListener("storage", event => { if (event.key === historyKey) renderMessages(); });
    renderMessages();
});
