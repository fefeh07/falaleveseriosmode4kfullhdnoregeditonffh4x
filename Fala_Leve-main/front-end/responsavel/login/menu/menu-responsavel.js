(() => {
    "use strict";

    let responsible;
    try { responsible = JSON.parse(localStorage.getItem("responsavel") || "null"); }
    catch { responsible = null; }
    if (!responsible?.id_responsavel) {
        window.location.replace("../entrar.html");
        return;
    }
    // Recognize existing offline demo sessions saved before modo_demo was added.
    const isDemo = Boolean(responsible.modo_demo || String(responsible.id_responsavel).startsWith("demo-responsavel-"));

    // The psychologist directory will be connected to the backend later.
    const PSYCHOLOGISTS_API = "";
    const SCHEDULE_API = "";
    const REQUEST_API = "";
    const REQUEST_CANCEL_API = "";
    const profiles = [
        { id: "demo-psicologo", nome: "Dra. Helena Martins", especialidade: "Ansiedade e autoestima", abordagem: "Terapia cognitivo-comportamental", cidade: "São Paulo, SP", registro: "CRP 06/123456", bio: "Atendimento psicológico para adultos que querem lidar com ansiedade e autoestima.", cor: "#286b4f", tags: ["Ansiedade", "Adultos", "TCC"] },
        { id: "demo-psicologo-2", nome: "Dr. André Costa", especialidade: "Estresse e qualidade de vida", abordagem: "Terapia humanista", cidade: "Niterói, RJ", registro: "CRP 05/654321", bio: "Acompanhamento para quem busca organizar a rotina e lidar com o estresse.", cor: "#438565", tags: ["Estresse", "Rotina", "Humanista"] },
        { id: "demo-psicologo-3", nome: "Dra. Beatriz Lima", especialidade: "Relacionamentos e autoestima", abordagem: "Terapia integrativa", cidade: "Campinas, SP", registro: "CRP 06/234567", bio: "Atendimento para trabalhar autoestima e dificuldades nos relacionamentos.", cor: "#4f8064", tags: ["Relacionamentos", "Autoestima", "Adultos"] },
        { id: "demo-psicologo-4", nome: "Dr. Lucas Ferreira", especialidade: "Adolescentes e família", abordagem: "Terapia sistêmica", cidade: "Santos, SP", registro: "CRP 06/345678", bio: "Atendimento para adolescentes e orientação psicológica para famílias.", cor: "#367458", tags: ["Adolescentes", "Família", "Sistêmica"] }
    ];
    profiles.push(
        { id: "demo-psicologo-5", nome: "Dra. Camila Rocha", especialidade: "Ansiedade e autocuidado", abordagem: "Terapia cognitivo-comportamental", cidade: "Curitiba, PR", registro: "CRP 08/456789", bio: "Espaço de escuta para trabalhar ansiedade, limites e autocuidado.", cor: "#527d68", tags: ["Ansiedade", "Autocuidado", "TCC"] },
        { id: "demo-psicologo-6", nome: "Dr. Pedro Almeida", especialidade: "Luto e mudanças de vida", abordagem: "Abordagem humanista", cidade: "Belo Horizonte, MG", registro: "CRP 04/567890", bio: "Acompanhamento em momentos de perda, transição e adaptação.", cor: "#3b765b", tags: ["Luto", "Transições", "Adultos"] },
        { id: "demo-psicologo-7", nome: "Dra. Júlia Nascimento", especialidade: "Relacionamentos e família", abordagem: "Terapia sistêmica", cidade: "Recife, PE", registro: "CRP 02/678901", bio: "Atendimento voltado à comunicação e aos vínculos familiares.", cor: "#648b72", tags: ["Relacionamentos", "Família", "Sistêmica"] }
    );
    const weekdays = [
        { id: "segunda", label: "Segunda-feira" }, { id: "terca", label: "Terça-feira" },
        { id: "quarta", label: "Quarta-feira" }, { id: "quinta", label: "Quinta-feira" },
        { id: "sexta", label: "Sexta-feira" }, { id: "sabado", label: "Sábado" },
        { id: "domingo", label: "Domingo" }
    ];
    const slots = Array.from({ length: 8 }, (_, index) => {
        const hour = String(index + 12).padStart(2, "0");
        return { start: `${hour}:00`, end: `${String(index + 13).padStart(2, "0")}:00`, label: `${hour}:00` };
    });
    const grid = document.getElementById("psychologistGrid");
    const directoryStatus = document.getElementById("directoryStatus");
    const dialog = document.getElementById("profileDialog");
    let psychologists = [];
    let selectedSlot = null;
    let requestMode = "atendimento";
    let currentPsychologist = null;

    const readArray = key => {
        try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
        catch { return []; }
    };
    const keyFor = (prefix, id) => `${prefix}:${encodeURIComponent(String(id))}`;
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
    const getName = profile => profile.nome_psicologo || profile.nome || profile.name || "Psicólogo(a)";
    const getId = profile => profile.id_psicologo || profile.id;
    const initials = name => String(name || "PS").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

    function seedResponsibleDemo() {
        if (!isDemo) return;
        const seedKey = keyFor("falaleve_responsavel_demo_inicializado", responsible.id_responsavel);
        if (localStorage.getItem(seedKey)) return;
        const second = responsible.id_responsavel === "demo-responsavel-2";
        const targetPsychologist = second ? "demo-psicologo-2" : "demo-psicologo";
        const beneficiaryName = second ? "Rafael de demonstração" : "Marina de demonstração";
        const beneficiaryId = `beneficiario-${responsible.id_responsavel}-${second ? "rafael" : "marina"}`;
        const requestId = `demo-pedido-${responsible.id_responsavel}`;
        const requestsKey = keyFor("falaleve_solicitacoes", targetPsychologist);
        const requests = readArray(requestsKey);
        if (!requests.some(item => item.id === requestId)) {
            requests.push({
                id: requestId,
                patientId: beneficiaryId,
                responsavelId: responsible.id_responsavel,
                solicitanteTipo: "responsavel",
                tipo_atendimento: "acompanhamento",
                descricao_situacao: second
                    ? "Ele tem passado por um período de estresse e gostaria de conversar com um profissional."
                    : "Ela tem se sentido ansiosa e gostaria de receber acompanhamento psicológico.",
                status: "pendente",
                demo: true,
                createdAt: new Date().toISOString(),
                responsavel: {
                    id_responsavel: responsible.id_responsavel,
                    nome_responsavel: responsible.nome_responsavel,
                    email_responsavel: responsible.email_responsavel
                },
                paciente: {
                    id_paciente: beneficiaryId,
                    nome_paciente: beneficiaryName,
                    idade: second ? 34 : 29,
                    cidade: second ? "Niterói - RJ" : "São Paulo - SP",
                    relacao_responsavel: second ? "Amigo(a)" : "Familiar",
                    responsavel_nome: responsible.nome_responsavel,
                    responsavel_email: responsible.email_responsavel,
                    motivo: second
                        ? "Ele tem passado por um período de estresse e gostaria de conversar com um profissional."
                        : "Ela tem se sentido ansiosa e gostaria de receber acompanhamento psicológico."
                }
            });
            localStorage.setItem(requestsKey, JSON.stringify(requests));
        }
        localStorage.setItem(seedKey, "1");
    }
    seedResponsibleDemo();

    function renderDirectory() {
        const query = document.getElementById("searchPsychologists").value.trim().toLocaleLowerCase("pt-BR");
        const shown = psychologists.filter(profile => `${getName(profile)} ${profile.especialidade || profile.area_especialidade || ""} ${profile.abordagem || ""} ${profile.cidade || profile.regiao_psicologo || ""}`.toLocaleLowerCase("pt-BR").includes(query));
        document.getElementById("directoryEmpty").hidden = shown.length > 0;
        grid.innerHTML = shown.map((profile, index) => {
            const name = getName(profile);
            const tags = Array.isArray(profile.tags) ? profile.tags : [profile.abordagem || profile.area_especialidade || "Atendimento psicológico"];
            const demoBadge = isDemo ? "DEMO" : (profile.avaliacao ? `Nota ${profile.avaliacao}` : "");
            return `<article class="psych-card" style="--accent:${escapeHtml(profile.cor || (index % 2 ? "#438565" : "#286b4f"))}">
                <div class="psych-card-top"><span class="portrait">${escapeHtml(initials(name))}</span>${demoBadge ? `<span class="rating">${escapeHtml(demoBadge)}</span>` : ""}</div>
                <div class="psych-card-body"><span class="card-specialty">${escapeHtml(profile.especialidade || profile.area_especialidade || profile.abordagem || "Psicologia clínica")}</span>
                    <h3>${escapeHtml(name)}</h3><p class="card-location">${escapeHtml(profile.cidade || profile.regiao_psicologo || "Atendimento online")}</p>
                    <div class="card-tags">${tags.slice(0, 3).map(tag => `<span class="card-tag">${escapeHtml(tag)}</span>`).join("")}</div>
                    <button class="profile-button" type="button" data-profile-id="${escapeHtml(getId(profile))}">Ver perfil e horários</button>
                </div></article>`;
        }).join("");
        grid.querySelectorAll("[data-profile-id]").forEach(button => button.addEventListener("click", () => {
            const profile = psychologists.find(item => String(getId(item)) === button.dataset.profileId);
            if (profile) openProfile(profile);
        }));
    }

    function nextDateForWeekday(index) {
        const date = new Date();
        const distance = (index - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + distance);
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    }
    function hasAvailability(availability, weekday, slot) {
        return availability.some(item => (item.weekday || item.dia_semana || item.dia) === weekday &&
            (item.startTime || item.hora_inicio || item.inicio) === slot.start &&
            (!item.status || ["available", "disponivel", "disponível"].includes(String(item.status).toLocaleLowerCase("pt-BR"))));
    }
    function demoSchedule(profileId) {
        const defaults = {
            "demo-psicologo": [{ weekday: "segunda", startTime: "12:00" }, { weekday: "quarta", startTime: "15:00" }, { weekday: "sexta", startTime: "18:00" }],
            "demo-psicologo-2": [{ weekday: "terca", startTime: "13:00" }, { weekday: "quinta", startTime: "16:00" }, { weekday: "sabado", startTime: "19:00" }],
            "demo-psicologo-3": [{ weekday: "segunda", startTime: "14:00" }, { weekday: "quinta", startTime: "17:00" }, { weekday: "domingo", startTime: "12:00" }],
            "demo-psicologo-4": [{ weekday: "terca", startTime: "15:00" }, { weekday: "sexta", startTime: "16:00" }, { weekday: "sabado", startTime: "13:00" }]
        };
        return (defaults[profileId] || []).map(item => {
            const startHour = Number(item.startTime.slice(0, 2));
            return { ...item, endTime: `${String(startHour + 1).padStart(2, "0")}:00`, status: "available" };
        });
    }
    async function getSchedule(profile) {
        const id = getId(profile);
        if (isDemo) {
            const availabilityKey = keyFor("falaleve_disponibilidade", id);
            if (localStorage.getItem(availabilityKey) === null) localStorage.setItem(availabilityKey, JSON.stringify(demoSchedule(id)));
            return {
                availability: readArray(availabilityKey),
                reservations: readArray(keyFor("falaleve_reservas", id))
            };
        }
        if (!SCHEDULE_API) return { availability: profile.disponibilidade || profile.availability || [], reservations: profile.reservas || [] };
        const response = await fetch(`${SCHEDULE_API}?psicologo_id=${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Não foi possível carregar a agenda");
        const data = await response.json();
        return { availability: data.disponibilidade || [], reservations: data.reservas || [] };
    }

    async function openProfile(profile) {
        currentPsychologist = profile;
        selectedSlot = null;
        const name = getName(profile);
        document.getElementById("profileContent").innerHTML = `<div class="profile-cover" style="--accent:${escapeHtml(profile.cor || "#286b4f")}">
            <span class="portrait">${escapeHtml(initials(name))}</span><div><span class="card-specialty">${escapeHtml(profile.especialidade || "Psicologia clínica")}</span>
            <h2 id="profileName">${escapeHtml(name)}</h2><p>${escapeHtml(profile.registro || profile.crp || "Psicólogo(a)")} · ${escapeHtml(profile.cidade || "Atendimento online")}</p></div></div>
            <div class="profile-main"><p class="profile-bio">${escapeHtml(profile.bio || profile.descricao || "")}</p>
            <div class="schedule-heading"><h3>Agenda semanal</h3><p>12h às 20h</p></div>
            <div class="schedule-legend"><span class="legend-item"><i class="legend-dot"></i>Disponível</span><span class="legend-item"><i class="legend-dot off"></i>Não marcado</span><span class="legend-item"><i class="legend-dot booked"></i>Reservado</span></div>
            <div class="week-grid" id="weekGrid"><p class="schedule-note">Carregando agenda…</p></div>
            <p class="schedule-note">Para solicitar uma sessão, selecione um horário disponível. Você informará quem receberá o atendimento no próximo passo.</p>
            <div class="request-controls"><p class="request-help">O pedido contínuo permite solicitar acompanhamento para essa pessoa.</p>
                <button class="request-button appointment-request" id="appointmentRequest" type="button" disabled>Solicitar horário selecionado</button>
                <button class="request-button ongoing-request" id="ongoingRequest" type="button">Solicitar acompanhamento contínuo</button>
                <p class="request-feedback" id="requestFeedback" role="status"></p></div></div>`;
        dialog.showModal();
        wireRequestForm();
        try {
            const { availability, reservations } = await getSchedule(profile);
            const weekGrid = document.getElementById("weekGrid");
            weekGrid.innerHTML = weekdays.map((day, index) => {
                const date = nextDateForWeekday((index + 1) % 7);
                const dayReservations = reservations.filter(item => (item.date || item.data) === date);
                const count = slots.filter(slot => !dayReservations.some(item => (item.startTime || item.hora_inicio || item.time) === slot.start) && hasAvailability(availability, day.id, slot)).length;
                const items = slots.map(slot => {
                    const reserved = dayReservations.some(item => (item.startTime || item.hora_inicio || item.time) === slot.start);
                    if (reserved) return `<span class="time-slot booked">${slot.label} · Reservado</span>`;
                    if (hasAvailability(availability, day.id, slot)) return `<button class="time-slot available selectable-slot" type="button" data-day="${day.id}" data-date="${date}" data-start="${slot.start}" data-end="${slot.end}" aria-pressed="false">${slot.label} · Livre</button>`;
                    return `<span class="time-slot">${slot.label} · Não marcado</span>`;
                }).join("");
                return `<section class="day-row"><h4 class="day-title">${day.label}<span class="day-count">${count} livre(s)</span></h4><div class="slot-list">${items}</div></section>`;
            }).join("");
            weekGrid.querySelectorAll(".selectable-slot").forEach(button => button.addEventListener("click", () => {
                weekGrid.querySelectorAll(".selectable-slot").forEach(item => { item.classList.remove("selected"); item.setAttribute("aria-pressed", "false"); });
                button.classList.add("selected");
                button.setAttribute("aria-pressed", "true");
                selectedSlot = { date: button.dataset.date, weekday: button.dataset.day, start: button.dataset.start, end: button.dataset.end };
                document.getElementById("appointmentRequest").disabled = false;
            }));
        } catch {
            const weekGrid = document.getElementById("weekGrid");
            if (weekGrid) weekGrid.innerHTML = "<p class=\"schedule-note\">Não foi possível carregar os horários.</p>";
        }
    }

    function wireRequestForm() {
        const form = document.getElementById("beneficiaryForm");
        const panel = document.getElementById("beneficiaryPanel");
        document.getElementById("appointmentRequest").addEventListener("click", () => {
            if (!selectedSlot) return;
            requestMode = "atendimento";
            form.reset();
            document.getElementById("situationDescription").required = false;
            document.getElementById("situationDescription").minLength = 0;
            document.getElementById("beneficiaryTitle").textContent = "Solicitar este horário";
            document.getElementById("sendBeneficiaryRequest").textContent = "Enviar pedido";
            document.getElementById("formFeedback").textContent = "";
            panel.hidden = false;
        });
        document.getElementById("ongoingRequest").addEventListener("click", () => {
            requestMode = "acompanhamento";
            form.reset();
            document.getElementById("situationDescription").required = true;
            document.getElementById("situationDescription").minLength = 20;
            document.getElementById("beneficiaryTitle").textContent = "Solicitar acompanhamento contínuo";
            document.getElementById("sendBeneficiaryRequest").textContent = "Enviar pedido";
            document.getElementById("formFeedback").textContent = "";
            panel.hidden = false;
        });
        document.getElementById("closeBeneficiaryPanel").onclick = () => { panel.hidden = true; };
        document.getElementById("cancelBeneficiaryForm").onclick = () => { panel.hidden = true; };
        form.onsubmit = async event => {
            event.preventDefault();
            const submit = document.getElementById("sendBeneficiaryRequest");
            submit.disabled = true;
            const values = Object.fromEntries(new FormData(form).entries());
            const sent = await sendRequest(values);
            submit.disabled = false;
            if (sent) {
                form.reset();
                panel.hidden = true;
            }
        };
    }

    function createBeneficiaryId(name, relationship) {
        const slug = `${name}-${relationship}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return `beneficiario-${responsible.id_responsavel}-${slug}`;
    }
    async function sendRequest(values) {
        const feedback = document.getElementById("requestFeedback");
        const formFeedback = document.getElementById("formFeedback");
        if (!currentPsychologist) return false;
        const psychologistId = getId(currentPsychologist);
        const patientId = createBeneficiaryId(values.nome_paciente, values.relacao_responsavel);
        const description = values.descricao_situacao.trim();
        const request = {
            id: `pedido-${encodeURIComponent(String(responsible.id_responsavel))}-${psychologistId}-${Date.now()}`,
            patientId,
            responsavelId: responsible.id_responsavel,
            solicitanteTipo: "responsavel",
            tipo_atendimento: requestMode,
            data: requestMode === "atendimento" ? selectedSlot.date : null,
            horario: requestMode === "atendimento" ? selectedSlot.start : null,
            status: "pendente",
            demo: isDemo,
            createdAt: new Date().toISOString(),
            responsavel: {
                id_responsavel: responsible.id_responsavel,
                nome_responsavel: responsible.nome_responsavel,
                email_responsavel: responsible.email_responsavel,
                telefone_responsavel: responsible.telefone_responsavel || ""
            },
            paciente: {
                id_paciente: patientId,
                nome_paciente: values.nome_paciente.trim(),
                idade: values.idade ? Number(values.idade) : null,
                relacao_responsavel: values.relacao_responsavel,
                responsavel_nome: responsible.nome_responsavel,
                responsavel_email: responsible.email_responsavel,
                responsavel_telefone: responsible.telefone_responsavel || "",
                motivo: requestMode === "atendimento"
                    ? (description || `Pedido para ${selectedSlot.date}, às ${selectedSlot.start}.`)
                    : description
            }
        };
        if (isDemo) {
            const key = keyFor("falaleve_solicitacoes", psychologistId);
            const requests = readArray(key);
            const pending = requests.some(item => String(item.responsavelId) === String(responsible.id_responsavel) && String(item.patientId) === String(patientId) && ["pendente", "pending"].includes(String(item.status).toLowerCase()));
            if (pending) {
                formFeedback.textContent = "Já existe um pedido pendente para essa pessoa com este profissional.";
                feedback.textContent = formFeedback.textContent;
                return false;
            }
            requests.push(request);
            localStorage.setItem(key, JSON.stringify(requests));
            feedback.textContent = "Pedido enviado. Acompanhe a resposta na aba Pedidos e horários.";
            formFeedback.textContent = feedback.textContent;
            renderPeople();
            renderRequests();
            return true;
        }
        if (!REQUEST_API) {
            formFeedback.textContent = "O envio de pedidos online ainda não está disponível.";
            return false;
        }
        try {
            const response = await fetch(REQUEST_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ psicologo_id: psychologistId, solicitacao: request })
            });
            if (!response.ok) throw new Error("Falha no envio");
            feedback.textContent = "Pedido enviado ao profissional.";
            return true;
        } catch {
            formFeedback.textContent = "Não foi possível enviar o pedido. Tente novamente.";
            return false;
        }
    }

    function ownRequests() {
        if (!isDemo) return [];
        return profiles.flatMap(profile => readArray(keyFor("falaleve_solicitacoes", profile.id))
            .filter(item => String(item.responsavelId) === String(responsible.id_responsavel))
            .map(item => ({ ...item, psychologist: profile })));
    }
    function renderPeople() {
        const requests = ownRequests();
        const linked = requests.filter(item => item.tipo_atendimento === "acompanhamento" && item.status === "aceita");
        document.getElementById("peopleCount").textContent = String(linked.length);
        document.getElementById("peopleStatus").textContent = isDemo ? "Acompanhamentos deste perfil de demonstração." : "A consulta dos vínculos depende da integração com o servidor.";
        document.getElementById("peopleEmpty").hidden = linked.length > 0;
        document.getElementById("peopleList").innerHTML = linked.map(request => {
            const chatUrl = `chat/chat-responsavel.html?psychologistId=${encodeURIComponent(getId(request.psychologist))}&patientId=${encodeURIComponent(request.patientId)}`;
            return `<article class="mine-card"><div class="mine-avatar">${escapeHtml(initials(request.paciente.nome_paciente))}</div><div class="mine-details"><span class="card-specialty">${escapeHtml(request.paciente.relacao_responsavel || "Pessoa acompanhada")}</span><h3>${escapeHtml(request.paciente.nome_paciente)}</h3><p>${escapeHtml(getName(request.psychologist))} · ${escapeHtml(request.psychologist.especialidade)}</p></div><span class="request-state accepted">Acompanhamento ativo</span><a class="chat-open-link" href="${escapeHtml(chatUrl)}">Abrir conversa</a><button class="request-cancel-button" type="button" data-end-id="${escapeHtml(request.id)}">Encerrar</button></article>`;
        }).join("");
        document.getElementById("peopleList").querySelectorAll("[data-end-id]").forEach(button => {
            const request = linked.find(item => item.id === button.dataset.endId);
            button.addEventListener("click", () => request && cancelRequest(request));
        });
    }
    function renderRequests() {
        const requests = ownRequests();
        document.getElementById("requestsStatus").textContent = isDemo ? "Pedidos e horários deste perfil de demonstração." : "A consulta dos pedidos depende da integração com o servidor.";
        document.getElementById("requestCount").textContent = String(requests.filter(item => ["pendente", "pending"].includes(String(item.status).toLowerCase())).length);
        document.getElementById("requestsEmpty").hidden = requests.length > 0;
        const list = document.getElementById("requestsList");
        list.innerHTML = requests.map(request => {
            const stateKey = String(request.status || "pendente").toLowerCase();
            const cancelled = stateKey.includes("cancel");
            const accepted = ["aceita", "accepted"].includes(stateKey);
            const isAppointment = request.tipo_atendimento === "atendimento";
            const kind = isAppointment ? `Atendimento · ${request.data} às ${request.horario}` : "Acompanhamento contínuo";
            const state = cancelled ? "Cancelado" : accepted ? (isAppointment ? "Confirmado" : "Aceito") : stateKey === "recusada" ? "Recusado" : "Aguardando resposta";
            const canCancel = !cancelled && (stateKey === "pendente" || stateKey === "pending" || (accepted && isAppointment));
            const canChat = accepted && (isAppointment || request.tipo_atendimento === "acompanhamento");
            const chatUrl = `chat/chat-responsavel.html?psychologistId=${encodeURIComponent(getId(profile))}&patientId=${encodeURIComponent(request.patientId)}`;
            return `<article class="mine-card request-history-card"><div class="mine-avatar">${escapeHtml(initials(request.paciente.nome_paciente))}</div><div class="mine-details"><span class="card-specialty">${escapeHtml(kind)} · ${escapeHtml(request.paciente.relacao_responsavel || "Pessoa atendida")}</span><h3>${escapeHtml(request.paciente.nome_paciente)}</h3><p>${escapeHtml(getName(request.psychologist))}${request.paciente.motivo ? ` · ${escapeHtml(request.paciente.motivo)}` : ""}</p></div><span class="request-state ${cancelled || stateKey === "recusada" ? "rejected" : accepted ? "accepted" : "pending"}">${state}</span>${canChat ? `<a class="chat-open-link" href="${escapeHtml(chatUrl)}">Abrir conversa</a>` : ""}${canCancel ? `<button class="request-cancel-button" type="button" data-cancel-id="${escapeHtml(request.id)}">${accepted ? "Cancelar horário" : "Cancelar pedido"}</button>` : ""}</article>`;
        }).join("");
        list.querySelectorAll("[data-cancel-id]").forEach(button => {
            const request = requests.find(item => item.id === button.dataset.cancelId);
            button.addEventListener("click", () => request && cancelRequest(request));
        });
    }

    async function cancelRequest(request) {
        if (!window.confirm(request.status === "aceita" ? "Confirma o cancelamento deste horário ou acompanhamento?" : "Confirma o cancelamento do pedido?")) return;
        const psychologistId = getId(request.psychologist);
        if (isDemo) {
            const requestsKey = keyFor("falaleve_solicitacoes", psychologistId);
            const updated = readArray(requestsKey).map(item => item.id === request.id ? { ...item, status: "cancelada_pelo_responsavel", canceladaEm: new Date().toISOString() } : item);
            localStorage.setItem(requestsKey, JSON.stringify(updated));
            if (request.tipo_atendimento === "atendimento" && request.status === "aceita") {
                const reservationsKey = keyFor("falaleve_reservas", psychologistId);
                const reservations = readArray(reservationsKey).filter(item => String(item.patientId || item.id_paciente) !== String(request.patientId) || item.date !== request.data || item.startTime !== request.horario);
                localStorage.setItem(reservationsKey, JSON.stringify(reservations));
            }
            if (request.tipo_atendimento === "acompanhamento" && request.status === "aceita") {
                const anotherActive = updated.some(item => String(item.patientId) === String(request.patientId) && item.tipo_atendimento === "acompanhamento" && item.status === "aceita");
                if (!anotherActive) {
                    const patientsKey = keyFor("falaleve_pacientes", psychologistId);
                    const patients = readArray(patientsKey).filter(item => String(item.id || item.id_paciente) !== String(request.patientId));
                    localStorage.setItem(patientsKey, JSON.stringify(patients));
                }
            }
            document.getElementById("requestsStatus").textContent = request.status === "aceita" && request.tipo_atendimento === "atendimento" ? "Horário cancelado." : "Pedido ou acompanhamento encerrado.";
            renderPeople();
            renderRequests();
            return;
        }
        if (!REQUEST_CANCEL_API) {
            document.getElementById("requestsStatus").textContent = "O cancelamento online ainda não está disponível.";
            return;
        }
        try {
            const response = await fetch(REQUEST_CANCEL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ psicologo_id: psychologistId, solicitacao_id: request.id, acao: "cancelar" })
            });
            if (!response.ok) throw new Error("Falha ao cancelar");
            renderPeople();
            renderRequests();
        } catch {
            document.getElementById("requestsStatus").textContent = "Não foi possível cancelar. Tente novamente.";
        }
    }

    async function loadDirectory() {
        if (isDemo) {
            psychologists = profiles;
            directoryStatus.textContent = "Modo de demonstração.";
            renderDirectory();
            return;
        }
        if (!PSYCHOLOGISTS_API) { psychologists = []; directoryStatus.textContent = ""; renderDirectory(); return; }
        directoryStatus.textContent = "Carregando profissionais…";
        try {
            const response = await fetch(PSYCHOLOGISTS_API, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("Falha ao carregar profissionais");
            const data = await response.json();
            psychologists = Array.isArray(data) ? data : data.psicologos || [];
            renderDirectory();
        } catch { psychologists = []; directoryStatus.textContent = "Não foi possível carregar os profissionais."; renderDirectory(); }
    }

    document.getElementById("responsibleWelcome").textContent = isDemo ? "Modo demonstração" : `Olá, ${(responsible.nome_responsavel || "").split(" ")[0] || "responsável"}`;
    document.getElementById("searchPsychologists").addEventListener("input", renderDirectory);
    document.querySelectorAll(".menu-tab").forEach(tab => tab.addEventListener("click", () => {
        const selected = tab.dataset.view;
        const current = document.querySelector(".menu-tab.active")?.dataset.view || "discover";
        const order = { discover: 0, people: 1, requests: 2 };
        const direction = order[selected] >= order[current] ? "slide-from-right" : "slide-from-left";
        const titles = {
            discover: ["FALA LEVE · ÁREA DO RESPONSÁVEL", "Encontre apoio para <span>alguém</span>", "Consulte profissionais e solicite atendimento para uma pessoa próxima."],
            people: ["ACOMPANHAMENTO", "Pessoas <span>acompanhadas</span>", "Veja quem está em acompanhamento e com qual profissional."],
            requests: ["SOLICITAÇÕES E AGENDA", "Pedidos e <span>horários</span>", "Consulte pedidos, horários confirmados e cancelamentos."]
        }[selected];
        document.getElementById("heroEyebrow").textContent = titles[0];
        document.getElementById("heroTitle").innerHTML = titles[1];
        document.getElementById("heroDescription").textContent = titles[2];
        const copy = document.querySelector(".hero > div");
        copy.classList.remove("slide-from-right", "slide-from-left"); void copy.offsetWidth; copy.classList.add(direction);
        copy.addEventListener("animationend", () => copy.classList.remove(direction), { once: true });
        document.querySelectorAll(".menu-tab").forEach(item => {
            item.classList.toggle("active", item === tab);
            item.setAttribute("aria-selected", String(item === tab));
        });
        for (const view of ["discover", "people", "requests"]) document.getElementById(`${view}View`).hidden = view !== selected;
        const activeView = document.getElementById(`${selected}View`);
        activeView.classList.remove("slide-from-right", "slide-from-left"); void activeView.offsetWidth; activeView.classList.add(direction);
        activeView.addEventListener("animationend", () => activeView.classList.remove(direction), { once: true });
        if (selected === "people") renderPeople();
        if (selected === "requests") renderRequests();
    }));
    document.getElementById("goDiscover").addEventListener("click", () => document.querySelector('[data-view="discover"]').click());
    document.getElementById("goDiscoverFromRequests").addEventListener("click", () => document.querySelector('[data-view="discover"]').click());
    document.getElementById("closeProfile").addEventListener("click", () => { document.getElementById("beneficiaryPanel").hidden = true; dialog.close(); });
    document.getElementById("closeBeneficiaryPanel").addEventListener("click", () => { document.getElementById("beneficiaryPanel").hidden = true; });
    dialog.addEventListener("close", () => { document.getElementById("beneficiaryPanel").hidden = true; });
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    document.getElementById("logoutButton").addEventListener("click", () => { localStorage.removeItem("responsavel"); window.location.replace("../entrar.html"); });
    renderPeople();
    renderRequests();
    loadDirectory();
})();
