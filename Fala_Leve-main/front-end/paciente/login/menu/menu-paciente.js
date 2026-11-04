(() => {
    "use strict";

    let patient;
    try {
        patient = JSON.parse(localStorage.getItem("paciente") || "null");
    } catch {
        patient = null;
    }
    if (!patient?.id_paciente && !patient?.modo_demo) {
        window.location.replace("../entrar.html");
        return;
    }

    // The psychologist directory will be connected to the backend later.
    const PSYCHOLOGISTS_API = "";
    const SCHEDULE_API = "";
    const REQUEST_API = ""; // POST { psicologo_id, solicitacao } when request integration is ready.
    const REQUEST_CANCEL_API = ""; // POST { psicologo_id, solicitacao_id, acao: "cancelar" }.
    const DEMO_PROFILES = [
        {
            id: "demo-psicologo",
            nome: "Dra. Helena Martins",
            email: "demo@falaleve.local",
            especialidade: "Ansiedade e autoestima",
            abordagem: "Terapia cognitivo-comportamental",
            cidade: "São Paulo, SP",
            registro: "CRP 06/123456",
            bio: "Atendimento psicológico para adultos que querem lidar com ansiedade e autoestima.",
            cor: "#c9574f",
            tags: ["Ansiedade", "Adultos", "TCC"]
        },
        {
            id: "demo-psicologo-2",
            nome: "Dr. André Costa",
            email: "demo2@falaleve.local",
            especialidade: "Estresse e qualidade de vida",
            abordagem: "Terapia humanista",
            cidade: "Niterói, RJ",
            registro: "CRP 05/654321",
            bio: "Acompanhamento para quem busca organizar a rotina e lidar com o estresse.",
            cor: "#e88976",
            tags: ["Estresse", "Rotina", "Humanista"]
        },
        {
            id: "demo-psicologo-3",
            nome: "Dra. Beatriz Lima",
            email: "demo3@falaleve.local",
            especialidade: "Relacionamentos e autoestima",
            abordagem: "Terapia integrativa",
            cidade: "Campinas, SP",
            registro: "CRP 06/234567",
            bio: "Atendimento para trabalhar autoestima e dificuldades nos relacionamentos.",
            cor: "#bd4944",
            tags: ["Relacionamentos", "Autoestima", "Adultos"]
        },
        {
            id: "demo-psicologo-4",
            nome: "Dr. Lucas Ferreira",
            email: "demo4@falaleve.local",
            especialidade: "Adolescentes e família",
            abordagem: "Terapia sistêmica",
            cidade: "Santos, SP",
            registro: "CRP 06/345678",
            bio: "Atendimento para adolescentes e orientação psicológica para famílias.",
            cor: "#d97768",
            tags: ["Adolescentes", "Família", "Sistêmica"]
        }
    ];
    const weekdays = [
        { id: "segunda", label: "Segunda-feira" }, { id: "terca", label: "Terça-feira" },
        { id: "quarta", label: "Quarta-feira" }, { id: "quinta", label: "Quinta-feira" },
        { id: "sexta", label: "Sexta-feira" }, { id: "sabado", label: "Sábado" },
        { id: "domingo", label: "Domingo" }
    ];
    const slots = Array.from({ length: 8 }, (_, index) => {
        const hour = String(index + 12).padStart(2, "0");
        return { startTime: `${hour}:00`, endTime: `${String(index + 13).padStart(2, "0")}:00`, label: `${hour}:00` };
    });
    const grid = document.getElementById("psychologistGrid");
    const status = document.getElementById("directoryStatus");
    const empty = document.getElementById("directoryEmpty");
    const dialog = document.getElementById("profileDialog");
    const profileContent = document.getElementById("profileContent");
    let selectedAppointment = null;
    let psychologists = [];

    const readArray = key => {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    };
    const scopedKey = (prefix, id) => `${prefix}:${encodeURIComponent(String(id))}`;
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
    const initials = name => String(name || "PS").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
    const getName = profile => profile.nome_psicologo || profile.nome || profile.name || "Psicólogo(a)";
    const getSpecialty = profile => profile.especialidade || profile.area_especialidade || profile.abordagem || "Psicologia clínica";

    function makeCard(profile, index) {
        const name = getName(profile);
        const tags = Array.isArray(profile.tags) ? profile.tags : [profile.abordagem || "Atendimento individual"];
        const badge = patient.modo_demo ? "DEMO" : (profile.avaliacao ? `✦ ${profile.avaliacao}` : "");
        return `<article class="psych-card" style="--accent:${escapeHtml(profile.cor || (index % 2 ? "#94b8ff" : "#83e1c1"))}">
            <div class="psych-card-top">${badge ? `<span class="rating">${escapeHtml(badge)}</span>` : ""}<span class="portrait">${escapeHtml(initials(name))}</span></div>
            <div class="psych-card-body"><span class="card-specialty">${escapeHtml(getSpecialty(profile))}</span>
                <h3>${escapeHtml(name)}</h3><p class="card-location">${escapeHtml(profile.cidade || profile.localizacao || profile.regiao_psicologo || "Atendimento online")}</p>
                <div class="card-tags">${tags.slice(0, 3).map(tag => `<span class="card-tag">${escapeHtml(tag)}</span>`).join("")}</div>
                <button class="profile-button" type="button" data-profile-id="${escapeHtml(profile.id_psicologo || profile.id)}">Ver perfil e horários</button>
            </div></article>`;
    }

    function renderCards() {
        const query = document.getElementById("searchPsychologists").value.trim().toLocaleLowerCase("pt-BR");
        const filtered = psychologists.filter(profile => `${getName(profile)} ${getSpecialty(profile)} ${profile.abordagem || ""} ${profile.cidade || profile.regiao_psicologo || ""}`.toLocaleLowerCase("pt-BR").includes(query));
        grid.innerHTML = filtered.map(makeCard).join("");
        empty.hidden = filtered.length > 0;
        grid.querySelectorAll("[data-profile-id]").forEach(button => {
            button.addEventListener("click", () => {
                const profile = psychologists.find(item => String(item.id_psicologo || item.id) === button.dataset.profileId);
                if (profile) {
                    selectedAppointment = null;
                    openProfile(profile);
                }
            });
        });
    }

    function isSlotMarked(availability, day, slot) {
        return availability.some(item =>
            (item.weekday || item.dia_semana || item.dia) === day &&
            (item.startTime || item.hora_inicio || item.inicio) === slot.startTime &&
            (!item.status || ["available", "disponivel", "disponível"].includes(String(item.status).toLocaleLowerCase("pt-BR")))
        );
    }

    function nextDateForWeekday(weekdayIndex) {
        const date = new Date();
        const current = date.getDay();
        const distance = (weekdayIndex - current + 7) % 7 || 7;
        date.setDate(date.getDate() + distance);
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    }

    async function getSchedule(profile) {
        if (patient.modo_demo) {
            const availabilityKey = scopedKey("falaleve_disponibilidade", profile.id_psicologo || profile.id);
            const reservationsKey = scopedKey("falaleve_reservas", profile.id_psicologo || profile.id);
            let availability = readArray(availabilityKey);
            if (localStorage.getItem(availabilityKey) === null) {
                const demoSchedules = {
                    "demo-psicologo": [
                        { weekday: "segunda", startTime: "12:00", endTime: "13:00", status: "available" },
                        { weekday: "quarta", startTime: "15:00", endTime: "16:00", status: "available" },
                        { weekday: "sexta", startTime: "18:00", endTime: "19:00", status: "available" }
                    ],
                    "demo-psicologo-2": [
                        { weekday: "terca", startTime: "13:00", endTime: "14:00", status: "available" },
                        { weekday: "quinta", startTime: "16:00", endTime: "17:00", status: "available" },
                        { weekday: "sabado", startTime: "19:00", endTime: "20:00", status: "available" }
                    ],
                    "demo-psicologo-3": [
                        { weekday: "segunda", startTime: "14:00", endTime: "15:00", status: "available" },
                        { weekday: "quinta", startTime: "17:00", endTime: "18:00", status: "available" },
                        { weekday: "domingo", startTime: "12:00", endTime: "13:00", status: "available" }
                    ],
                    "demo-psicologo-4": [
                        { weekday: "terca", startTime: "15:00", endTime: "16:00", status: "available" },
                        { weekday: "sexta", startTime: "16:00", endTime: "17:00", status: "available" },
                        { weekday: "sabado", startTime: "13:00", endTime: "14:00", status: "available" }
                    ]
                };
                availability = demoSchedules[profile.id] || [];
                localStorage.setItem(availabilityKey, JSON.stringify(availability));
            }
            return { availability, reservations: readArray(reservationsKey) };
        }
        if (!SCHEDULE_API) return {
            availability: profile.disponibilidade || profile.availability || [],
            reservations: profile.reservas || []
        };
        const response = await fetch(`${SCHEDULE_API}?psicologo_id=${encodeURIComponent(profile.id_psicologo || profile.id)}`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        return { availability: payload.disponibilidade || [], reservations: payload.reservas || [] };
    }

    async function openProfile(profile) {
        const id = profile.id_psicologo || profile.id;
        const name = getName(profile);
        profileContent.innerHTML = `<div class="profile-cover" style="--accent:${escapeHtml(profile.cor || "#83e1c1")}">
            <span class="portrait">${escapeHtml(initials(name))}</span><div><span class="card-specialty">${escapeHtml(getSpecialty(profile))}</span>
            <h2 id="profileName">${escapeHtml(name)}</h2><p>${escapeHtml(profile.registro || profile.crp || "Psicólogo(a) registrado(a)")} · ${escapeHtml(profile.cidade || "Atendimento online")}</p></div></div>
            <div class="profile-main"><p class="profile-bio">${escapeHtml(profile.bio || profile.descricao || "Profissional de psicologia disponível para acolher você.")}</p>
            <div class="schedule-heading"><h3>Agenda semanal</h3><p>Horários de 12h às 20h</p></div>
            <div class="schedule-legend"><span class="legend-item"><i class="legend-dot"></i>Disponível</span><span class="legend-item"><i class="legend-dot off"></i>Não marcado</span><span class="legend-item"><i class="legend-dot booked"></i>Reservado</span></div>
            <div class="week-grid" id="weekGrid"><p class="schedule-note">Carregando agenda…</p></div>
            <p class="schedule-note">“Não marcado” indica um horário que o profissional ainda não disponibilizou. Horários reservados podem depender da integração com o servidor.</p>
            <div class="request-controls">
                <p class="request-help">Para pedir um horário, selecione uma faixa marcada como disponível. Você também pode solicitar para se tornar paciente fixo.</p>
                <button class="request-button appointment-request" id="appointmentRequest" type="button" disabled>Solicitar horário selecionado</button>
                <button class="request-button ongoing-request" id="ongoingRequest" type="button">Quero me tornar paciente fixo</button>
                <p class="request-feedback" id="requestFeedback" role="status"></p>
            </div></div>`;
        dialog.showModal();
        wireRequestControls(profile);
        try {
            const { availability, reservations } = await getSchedule(profile);
            const weekGrid = document.getElementById("weekGrid");
            weekGrid.innerHTML = weekdays.map((day, dayIndex) => {
            const date = nextDateForWeekday((dayIndex + 1) % 7);
                const dayReservations = reservations.filter(item => item.date === date || item.data === date);
                const availableCount = slots.filter(slot =>
                    !dayReservations.some(item => (item.startTime || item.hora_inicio || item.horario) === slot.startTime) &&
                    isSlotMarked(availability, day.id, slot)
                ).length;
                const slotHtml = slots.map(slot => {
                    const reservation = dayReservations.find(item => (item.startTime || item.hora_inicio || item.horario) === slot.startTime);
                    if (reservation) return `<span class="time-slot booked" title="Horário reservado">${slot.label} · Reservado</span>`;
                    return isSlotMarked(availability, day.id, slot)
                        ? `<button class="time-slot available selectable-slot" type="button" data-day="${day.id}" data-date="${date}" data-start="${slot.startTime}" data-end="${slot.endTime}" aria-pressed="false">${slot.label} · Livre</button>`
                        : `<span class="time-slot">${slot.label} · Não marcado</span>`;
                }).join("");
                return `<section class="day-row"><h4 class="day-title">${day.label}<span class="day-count">${availableCount} livre(s)</span></h4><div class="slot-list">${slotHtml}</div></section>`;
            }).join("");
            weekGrid.querySelectorAll(".selectable-slot").forEach(button => button.addEventListener("click", () => {
                weekGrid.querySelectorAll(".selectable-slot").forEach(slotButton => {
                    slotButton.classList.remove("selected");
                    slotButton.setAttribute("aria-pressed", "false");
                });
                button.classList.add("selected");
                button.setAttribute("aria-pressed", "true");
                selectedAppointment = { weekday: button.dataset.day, date: button.dataset.date, startTime: button.dataset.start, endTime: button.dataset.end };
                document.getElementById("appointmentRequest").disabled = false;
            }));
        } catch {
            const weekGrid = document.getElementById("weekGrid");
            if (weekGrid) weekGrid.innerHTML = "<p class=\"schedule-note\">Não foi possível carregar a agenda deste profissional.</p>";
        }
    }

    function wireRequestControls(profile) {
        document.getElementById("appointmentRequest").addEventListener("click", () => submitRequest(profile, "atendimento"));
        document.getElementById("ongoingRequest").addEventListener("click", () => {
            const formPanel = document.getElementById("longRequestPanel");
            document.getElementById("longRequestForm").reset();
            document.getElementById("longRequestFeedback").textContent = "";
            formPanel.hidden = false;
        });
        document.getElementById("closeLongRequest").onclick = () => { document.getElementById("longRequestPanel").hidden = true; };
        document.getElementById("cancelLongRequest").onclick = () => { document.getElementById("longRequestPanel").hidden = true; };
        document.getElementById("longRequestForm").onsubmit = async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const submit = form.querySelector('[type="submit"]');
            submit.disabled = true;
            document.getElementById("longRequestFeedback").textContent = "Enviando pedido…";
            const details = Object.fromEntries(new FormData(form).entries());
            const sent = await submitRequest(profile, "acompanhamento", details);
            submit.disabled = false;
            if (sent) {
                form.reset();
                document.getElementById("longRequestPanel").hidden = true;
            } else {
                document.getElementById("longRequestFeedback").textContent = document.getElementById("requestFeedback").textContent;
            }
        };
    }

    async function submitRequest(profile, type, details = {}) {
        const feedback = document.getElementById("requestFeedback");
        const id = profile.id_psicologo || profile.id;
        if (type === "atendimento" && !selectedAppointment) {
            feedback.textContent = "Selecione primeiro um horário disponível na agenda.";
            return false;
        }
        const patientId = patient.id_paciente || "demo-paciente";
        const now = new Date().toISOString();
        const request = {
            id: `solicitacao-${encodeURIComponent(String(patientId))}-${id}-${Date.now()}`,
            patientId,
            tipo_atendimento: type,
            descricao_situacao: details.descricao_situacao || "",
            data: type === "atendimento" ? selectedAppointment.date : null,
            horario: type === "atendimento" ? selectedAppointment.startTime : null,
            status: "pendente",
            demo: Boolean(patient.modo_demo),
            createdAt: now,
            paciente: {
                id_paciente: patientId,
                nome_paciente: patient.nome_paciente || patient.nome || "Paciente",
                email_paciente: patient.email_paciente || patient.email || "",
                telefone_paciente: patient.telefone_paciente || patient.telefone || "",
                idade: patient.idade || null,
                cidade: patient.cidade || "",
                motivo: type === "atendimento"
                    ? `Solicita atendimento para ${selectedAppointment.date}, às ${selectedAppointment.startTime}.`
                    : details.descricao_situacao
            }
        };
        if (patient.modo_demo) {
            const key = scopedKey("falaleve_solicitacoes", id);
            const requests = readArray(key);
            const existing = requests.find(item => String(item.patientId) === String(patientId) && ["pendente", "pending"].includes(String(item.status).toLocaleLowerCase("pt-BR")));
            if (existing) {
                feedback.textContent = "Você já tem um pedido pendente para este profissional.";
                return false;
            }
            requests.push(request);
            localStorage.setItem(key, JSON.stringify(requests));
            feedback.textContent = "Pedido enviado! Você poderá acompanhar a resposta na aba Pedidos e horários.";
            renderMine();
            renderRequestHistory();
            return true;
        }
        if (!REQUEST_API) {
            feedback.textContent = "O envio online será ativado quando a integração com o servidor estiver configurada.";
            return false;
        }
        try {
            const response = await fetch(REQUEST_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ psicologo_id: id, solicitacao: request })
            });
            if (!response.ok) throw new Error("Falha ao enviar pedido");
            feedback.textContent = "Pedido enviado ao profissional.";
            return true;
        } catch {
            feedback.textContent = "Não foi possível enviar o pedido. Tente novamente.";
            return false;
        }
    }

    function getPatientRequests() {
        if (patient.modo_demo) {
            return DEMO_PROFILES.flatMap(profile => readArray(scopedKey("falaleve_solicitacoes", profile.id))
                .filter(request => String(request.patientId || request.id_paciente) === String(patient.id_paciente || "demo-paciente"))
                .map(request => ({ ...request, psychologist: profile })));
        }
        return [];
    }

    function renderMine() {
        const requests = getPatientRequests();
        const list = document.getElementById("mineList");
        document.getElementById("mineStatus").textContent = patient.modo_demo
            ? "Pedidos e vínculos desta demonstração, separados por psicólogo."
            : "A consulta aos pedidos será ativada quando a integração com o servidor estiver configurada.";
        const linked = requests.filter(request => request.tipo_atendimento === "acompanhamento" && request.status === "aceita");
        document.getElementById("mineCount").textContent = String(linked.length);
        document.getElementById("mineEmpty").hidden = linked.length > 0;
        list.innerHTML = linked.map(request => {
            const profile = request.psychologist;
            const chatUrl = `chat/chat-paciente.html?psychologistId=${encodeURIComponent(profile.id)}&patientId=${encodeURIComponent(patient.id_paciente)}`;
            return `<article class="mine-card"><div class="mine-avatar" style="--accent:${escapeHtml(profile.cor)}">${escapeHtml(initials(getName(profile)))}</div><div class="mine-details"><span class="card-specialty">Acompanhamento contínuo</span><h3>${escapeHtml(getName(profile))}</h3><p>${escapeHtml(profile.especialidade)}</p></div><span class="request-state accepted">Paciente vinculado</span><a class="chat-open-link" href="${escapeHtml(chatUrl)}">Abrir conversa</a><button class="request-cancel-button" type="button" data-end-link="${escapeHtml(request.id)}" data-psychologist="${escapeHtml(profile.id)}">Encerrar vínculo</button></article>`;
        }).join("");
        list.querySelectorAll("[data-end-link]").forEach(button => {
            const request = linked.find(item => String(item.id) === button.dataset.endLink);
            button.addEventListener("click", () => request && cancelPatientRequest(request));
        });
    }

    function renderRequestHistory() {
        const requests = getPatientRequests();
        const list = document.getElementById("appointmentsList");
        const count = requests.filter(request => ["pendente", "pending"].includes(String(request.status).toLocaleLowerCase("pt-BR"))).length;
        document.getElementById("requestCount").textContent = String(count);
        document.getElementById("appointmentsStatus").textContent = patient.modo_demo
            ? "Pedidos enviados e horários confirmados desta demonstração."
            : "A consulta dos pedidos será ativada quando a integração com o servidor estiver configurada.";
        document.getElementById("appointmentsEmpty").hidden = requests.length > 0;
        list.innerHTML = requests.map(request => {
            const profile = request.psychologist;
            const statusKey = String(request.status || "pendente").toLocaleLowerCase("pt-BR");
            const cancelled = ["cancelada", "cancelado", "cancelada_pelo_paciente", "cancelado_pelo_paciente"].includes(statusKey);
            const accepted = ["aceita", "accepted"].includes(statusKey);
            const state = cancelled ? "Cancelado" : accepted ? "Confirmado" : statusKey === "recusada" ? "Recusado" : "Aguardando resposta";
            const isAppointment = request.tipo_atendimento === "atendimento";
            const kind = isAppointment
                ? `Atendimento · ${request.data || "data pendente"} às ${request.horario || "--:--"}`
                : "Pedido para se tornar paciente fixo";
            const canCancel = !cancelled && (statusKey === "pendente" || statusKey === "pending" || (accepted && isAppointment));
            const canChat = accepted && (isAppointment || request.tipo_atendimento === "acompanhamento");
            const chatUrl = `chat/chat-paciente.html?psychologistId=${encodeURIComponent(profile.id)}&patientId=${encodeURIComponent(patient.id_paciente)}`;
            return `<article class="mine-card request-history-card"><div class="mine-avatar" style="--accent:${escapeHtml(profile.cor)}">${escapeHtml(initials(getName(profile)))}</div><div class="mine-details"><span class="card-specialty">${escapeHtml(kind)}</span><h3>${escapeHtml(getName(profile))}</h3><p>${escapeHtml(profile.especialidade)}${request.tipo_atendimento === "acompanhamento" && request.descricao_situacao ? ` · ${escapeHtml(request.descricao_situacao)}` : ""}</p></div><span class="request-state ${cancelled || statusKey === "recusada" ? "rejected" : accepted ? "accepted" : "pending"}">${state}</span>${canChat ? `<a class="chat-open-link" href="${escapeHtml(chatUrl)}">Abrir conversa</a>` : ""}${canCancel ? `<button class="request-cancel-button" type="button" data-cancel-request="${escapeHtml(request.id)}" data-psychologist="${escapeHtml(profile.id)}">${accepted ? "Cancelar horário" : "Cancelar pedido"}</button>` : ""}</article>`;
        }).join("");
        list.querySelectorAll("[data-cancel-request]").forEach(button => {
            const request = requests.find(item => String(item.id) === button.dataset.cancelRequest);
            button.addEventListener("click", () => request && cancelPatientRequest(request));
        });
    }

    async function cancelPatientRequest(request) {
        const feedback = document.getElementById("appointmentsStatus");
        const profile = request.psychologist;
        const psychologistId = profile.id_psicologo || profile.id;
        const confirmed = window.confirm(request.status === "aceita"
            ? "Confirma o cancelamento deste horário ou vínculo?"
            : "Confirma o cancelamento deste pedido?");
        if (!confirmed) return;
        if (patient.modo_demo) {
            const requestsKey = scopedKey("falaleve_solicitacoes", psychologistId);
            const requests = readArray(requestsKey).map(item => String(item.id || item.id_solicitacao) === String(request.id)
                ? { ...item, status: "cancelada_pelo_paciente", canceladaEm: new Date().toISOString() }
                : item);
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            if (request.tipo_atendimento === "atendimento" && request.status === "aceita") {
                const reservationsKey = scopedKey("falaleve_reservas", psychologistId);
                const reservations = readArray(reservationsKey).filter(item =>
                    String(item.id) !== `reserva-${request.id}` &&
                    !(String(item.patientId || item.id_paciente) === String(patient.id_paciente) && item.date === request.data && item.startTime === request.horario)
                );
                localStorage.setItem(reservationsKey, JSON.stringify(reservations));
            }
            if (request.tipo_atendimento === "acompanhamento" && request.status === "aceita") {
                const patientsKey = scopedKey("falaleve_pacientes", psychologistId);
                const patients = readArray(patientsKey).filter(item => String(item.id || item.id_paciente) !== String(patient.id_paciente));
                localStorage.setItem(patientsKey, JSON.stringify(patients));
            }
            feedback.textContent = request.tipo_atendimento === "atendimento" && request.status === "aceita"
                ? "Horário cancelado."
                : "Pedido ou vínculo cancelado.";
            renderMine();
            renderRequestHistory();
            document.getElementById("mineStatus").textContent = feedback.textContent;
            document.getElementById("appointmentsStatus").textContent = feedback.textContent;
            return;
        }
        if (!REQUEST_CANCEL_API) {
            feedback.textContent = "O cancelamento online será ativado quando a integração com o servidor estiver configurada.";
            return;
        }
        try {
            const response = await fetch(REQUEST_CANCEL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ psicologo_id: psychologistId, solicitacao_id: request.id, acao: "cancelar" })
            });
            if (!response.ok) throw new Error("Falha ao cancelar pedido");
            feedback.textContent = "Pedido cancelado.";
            renderMine();
            renderRequestHistory();
        } catch {
            feedback.textContent = "Não foi possível cancelar. Verifique a conexão e tente novamente.";
        }
    }

    async function loadPsychologists() {
        if (patient.modo_demo) {
            psychologists = DEMO_PROFILES;
            status.textContent = "Modo de demonstração.";
            renderCards();
            return;
        }
        if (!PSYCHOLOGISTS_API) {
            status.textContent = "";
            renderCards();
            return;
        }
        status.textContent = "Carregando profissionais…";
        try {
            const response = await fetch(PSYCHOLOGISTS_API, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            psychologists = Array.isArray(payload) ? payload : (payload.psicologos || []);
            status.textContent = `${psychologists.length} profissional(is) encontrado(s).`;
            renderCards();
        } catch {
            psychologists = [];
            status.textContent = "Não foi possível carregar os profissionais. Verifique sua conexão.";
            renderCards();
        }
    }

    document.getElementById("patientWelcome").textContent = patient.modo_demo
        ? "Modo demonstração"
        : `Olá, ${(patient.nome_paciente || patient.nome || "").split(" ")[0] || "boas-vindas"}`;
    document.getElementById("searchPsychologists").addEventListener("input", renderCards);
    document.querySelectorAll(".menu-tab").forEach(tab => tab.addEventListener("click", () => {
        const selectedView = tab.dataset.view;
        const currentView = document.querySelector(".menu-tab.active")?.dataset.view || "discover";
        const viewOrder = { discover: 0, mine: 1, appointments: 2 };
        const slideClass = viewOrder[selectedView] >= viewOrder[currentView] ? "slide-from-right" : "slide-from-left";
        const heroContent = {
            discover: {
                eyebrow: "FALA LEVE · ÁREA DO PACIENTE",
                title: 'Encontre um <span>psicólogo</span>',
                description: "Consulte os perfis e veja os horários disponíveis para atendimento."
            },
            mine: {
                eyebrow: "SEU ACOMPANHAMENTO",
                title: 'Meus <span>psicólogos</span>',
                description: "Veja os profissionais que aceitaram acompanhar você."
            },
            appointments: {
                eyebrow: "SOLICITAÇÕES E AGENDA",
                title: 'Pedidos e <span>horários</span>',
                description: "Acompanhe suas solicitações, horários confirmados e cancelamentos."
            }
        }[selectedView];
        document.getElementById("heroEyebrow").textContent = heroContent.eyebrow;
        document.getElementById("heroTitle").innerHTML = heroContent.title;
        document.getElementById("heroDescription").textContent = heroContent.description;
        const heroCopy = document.querySelector(".hero > div");
        heroCopy.classList.remove("tab-enter", "slide-from-right", "slide-from-left");
        void heroCopy.offsetWidth;
        heroCopy.classList.add(slideClass);
        heroCopy.addEventListener("animationend", () => heroCopy.classList.remove(slideClass), { once: true });
        document.querySelectorAll(".menu-tab").forEach(item => {
            item.classList.toggle("active", item === tab);
            item.setAttribute("aria-selected", String(item === tab));
        });
        document.getElementById("discoverView").hidden = selectedView !== "discover";
        document.getElementById("mineView").hidden = selectedView !== "mine";
        document.getElementById("appointmentsView").hidden = selectedView !== "appointments";
        const activeView = document.getElementById(`${selectedView}View`);
        activeView.classList.remove("tab-enter", "slide-from-right", "slide-from-left");
        void activeView.offsetWidth;
        activeView.classList.add(slideClass);
        activeView.addEventListener("animationend", () => activeView.classList.remove(slideClass), { once: true });
        if (selectedView === "mine") renderMine();
        if (selectedView === "appointments") renderRequestHistory();
    }));
    document.getElementById("goDiscover").addEventListener("click", () => document.querySelector('[data-view="discover"]').click());
    document.getElementById("goDiscoverFromRequests").addEventListener("click", () => document.querySelector('[data-view="discover"]').click());
    document.getElementById("closeProfile").addEventListener("click", () => {
        document.getElementById("longRequestPanel").hidden = true;
        dialog.close();
    });
    dialog.addEventListener("close", () => { document.getElementById("longRequestPanel").hidden = true; });
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("paciente");
        window.location.replace("../entrar.html");
    });
    renderMine();
    renderRequestHistory();
    loadPsychologists();
})();
