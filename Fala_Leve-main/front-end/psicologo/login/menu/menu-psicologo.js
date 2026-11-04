
document.addEventListener("DOMContentLoaded", () => {
    let psicologo = null;
    try {
        psicologo = JSON.parse(sessionStorage.getItem("psicologo") || "null");
    } catch {
        sessionStorage.removeItem("psicologo");
    }

    if (!psicologo?.id_psicologo || !psicologo?.email_psicologo) {
        window.location.replace("../entrar.html");
        return;
    }

    document.querySelector(".logout-button")?.addEventListener("click", () => {
        sessionStorage.removeItem("psicologo");
    });

    const profileKey = key => `${key}:${encodeURIComponent(String(psicologo.id_psicologo))}`;
    const PATIENTS_KEY = profileKey("falaleve_pacientes");
    const NOTES_KEY = profileKey("falaleve_anotacoes");
    const APPOINTMENTS_KEY = profileKey("falaleve_agendamentos");

    if (psicologo.modo_demo && psicologo.id_psicologo === "demo-psicologo") {
        [["falaleve_pacientes", PATIENTS_KEY], ["falaleve_anotacoes", NOTES_KEY], ["falaleve_agendamentos", APPOINTMENTS_KEY]]
            .forEach(([legacyKey, scopedKey]) => {
                if (localStorage.getItem(scopedKey) === null && localStorage.getItem(legacyKey) !== null) {
                    localStorage.setItem(scopedKey, localStorage.getItem(legacyKey));
                }
            });
    }

    const patientList = document.getElementById("patientList");
    const patientEmpty = document.getElementById("patientEmpty");
    const patientSearch = document.getElementById("patientSearch");

    const notesList = document.getElementById("notesList");
    const notesEmpty = document.getElementById("notesEmpty");
    const notesSearch = document.getElementById("notesSearch");
    const notesPatientFilter = document.getElementById("notesPatientFilter");

    const patientCount = document.getElementById("patientCount");
    const noteCount = document.getElementById("noteCount");

    const noteDialog = document.getElementById("noteDialog");
    const closeNoteDialog = document.getElementById("closeNoteDialog");
    const doneNoteDialog = document.getElementById("doneNoteDialog");

    let patients = readStorage(PATIENTS_KEY);
    let notes = readStorage(NOTES_KEY);

    function readStorage(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function saveStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch {
            alert("Não foi possível salvar. Verifique o armazenamento do navegador.");
            return false;
        }
    }

    if (psicologo.modo_demo) {
        const demoPatientId = `demo-paciente-${psicologo.id_psicologo}`;
        if (!patients.some(patient => patient.id === demoPatientId)) {
            const demoPatient = {
                id: demoPatientId,
                name: psicologo.id_psicologo === "demo-psicologo-2"
                    ? "Caio Demonstração"
                    : "Lia Demonstração",
                demo: true,
                createdAt: new Date().toISOString()
            };
            const updatedPatients = [...patients, demoPatient];
            if (saveStorage(PATIENTS_KEY, updatedPatients)) patients = updatedPatients;
        }
    }

    function formatDate(value) {
        if (!value) return "Data não informada";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Data não informada";

        return date.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    function getPatientName(id) {
        return patients.find(patient => patient.id === id)?.name
            || "Paciente não identificado";
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function renderPatients() {
        const search = patientSearch.value.trim().toLocaleLowerCase("pt-BR");

        const filtered = patients.filter(patient =>
            String(patient.name || "").toLocaleLowerCase("pt-BR").includes(search)
        );

        patientList.replaceChildren();
        patientEmpty.hidden = filtered.length > 0;
        patientCount.textContent = patients.length;

        filtered.forEach(patient => {
            const card = createElement("article", "patient-card");
            const avatar = createElement(
                "div",
                "patient-avatar",
                (patient.name || "?").trim().charAt(0).toUpperCase()
            );
            avatar.setAttribute("aria-hidden", "true");

            const info = createElement("div", "patient-info");
            info.append(
                createElement("h3", "", patient.name || "Sem nome"),
                createElement(
                    "p",
                    "",
                    `${notes.filter(note => note.patientId === patient.id).length} anotação(ões)`
                ),
                ...([patient.tipoVinculo === "atendimento" ? "Atendimento pontual" : "", patient.relacaoResponsavel, patient.responsavelNome ? `Responsável: ${patient.responsavelNome}` : ""].some(Boolean)
                    ? [createElement("p", "", [patient.tipoVinculo === "atendimento" ? "Atendimento pontual" : "", patient.relacaoResponsavel, patient.responsavelNome ? `Responsável: ${patient.responsavelNome}` : ""].filter(Boolean).join(" · "))]
                    : [])
            );

            const removeButton = createElement(
                "button",
                "small-button remove-patient-button",
                "Remover paciente"
            );
            
            removeButton.type = "button";
            

            removeButton.addEventListener("click", () => {
                const deleteDialog = document.getElementById("deletePatientDialog");
                const deleteMessage = document.getElementById("deletePatientMessage");
                const cancelDelete = document.getElementById("cancelDeletePatient");
                const confirmDelete = document.getElementById("confirmDeletePatient");
            
                deleteMessage.textContent =
                    `Tem certeza de que deseja remover ${patient.name}?`;
            
                const handleCancel = () => {
                    deleteDialog.close();
                    cancelDelete.removeEventListener("click", handleCancel);
                    confirmDelete.removeEventListener("click", handleConfirm);
                };
            
                const handleConfirm = () => {
                    const updatedPatients = patients.filter(
                        item => item.id !== patient.id
                    );
            
                    const updatedNotes = notes.filter(
                        note => note.patientId !== patient.id
                    );
            
                    const appointments = readStorage(APPOINTMENTS_KEY);
            
                    const updatedAppointments = appointments.filter(
                        appointment => appointment.patientId !== patient.id
                    );
            
                    if (!saveStorage(PATIENTS_KEY, updatedPatients)) return;
                    if (!saveStorage(NOTES_KEY, updatedNotes)) return;
                    if (!saveStorage(APPOINTMENTS_KEY, updatedAppointments)) return;
            
                    patients = updatedPatients;
                    notes = updatedNotes;
            
                    deleteDialog.close();
                    cancelDelete.removeEventListener("click", handleCancel);
                    confirmDelete.removeEventListener("click", handleConfirm);
            
                    renderPatients();
                    renderNotes();
                };
            
                cancelDelete.addEventListener("click", handleCancel);
                confirmDelete.addEventListener("click", handleConfirm);
            
                deleteDialog.showModal();
            });
            
            const actions = createElement("div", "patient-actions");

            const notesButton = createElement("button", "small-button", "Ver anotações");
            notesButton.type = "button";
            notesButton.addEventListener("click", () => {
                notesPatientFilter.value = patient.id;
                renderNotes();
                document.querySelector(".notes-section")
                    .scrollIntoView({ behavior: "smooth", block: "start" });
            });

            const chatButton = createElement("button", "small-button primary", "Abrir chat");
            chatButton.type = "button";
            chatButton.addEventListener("click", () => {
                const params = new URLSearchParams({ patientId: patient.id });
                window.location.href = `chat/chat-psicologo.html?${params.toString()}`;
            });

            actions.append(removeButton, notesButton, chatButton);
            info.append(actions);
            card.append(avatar, info);
            patientList.append(card);
        });

        renderPatientFilter();
    }

    function renderPatientFilter() {
        const currentValue = notesPatientFilter.value || "all";
        notesPatientFilter.replaceChildren();

        const allOption = createElement("option", "", "Todos os pacientes");
        allOption.value = "all";
        notesPatientFilter.append(allOption);

        patients.forEach(patient => {
            const option = createElement("option", "", patient.name);
            option.value = patient.id;
            notesPatientFilter.append(option);
        });

        notesPatientFilter.value =
            [...notesPatientFilter.options].some(option => option.value === currentValue)
                ? currentValue
                : "all";
    }

    function renderNotes() {
        const search = notesSearch.value.trim().toLocaleLowerCase("pt-BR");
        const selectedPatient = notesPatientFilter.value;

        const filtered = notes
            .filter(note => selectedPatient === "all" || note.patientId === selectedPatient)
            .filter(note => {
                const content = `${note.title || ""} ${note.content || ""} ${getPatientName(note.patientId)}`;
                return content.toLocaleLowerCase("pt-BR").includes(search);
            })
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        notesList.replaceChildren();
        notesEmpty.hidden = filtered.length > 0;
        noteCount.textContent = notes.length;

        filtered.forEach(note => {
            const card = createElement("article", "note-card");
            const symbol = createElement("div", "note-symbol", "▤");
            symbol.setAttribute("aria-hidden", "true");

            const info = createElement("div", "note-info");
            info.append(
                createElement("h3", "", note.title || "Anotação sem título"),
                createElement("p", "", getPatientName(note.patientId)),
                createElement("p", "", formatDate(note.date)),
                createElement(
                    "p",
                    "note-preview",
                    note.content || "Sem observações registradas."
                )
            );

            const button = createElement("button", "small-button", "Ler");
            button.type = "button";
            button.addEventListener("click", () => openNote(note));

            card.append(symbol, info, button);
            notesList.append(card);
        });
    }

    function openNote(note) {
        document.getElementById("dialogNoteTitle").textContent =
            note.title || "Anotação sem título";
        document.getElementById("dialogNotePatient").textContent =
            `Paciente: ${getPatientName(note.patientId)}`;
        document.getElementById("dialogNoteDate").textContent =
            `Data: ${formatDate(note.date)}`;
        document.getElementById("dialogNoteContent").textContent =
            note.content || "Sem observações registradas.";

        noteDialog.showModal();
    }

    patientSearch.addEventListener("input", renderPatients);
    notesSearch.addEventListener("input", renderNotes);
    notesPatientFilter.addEventListener("change", renderNotes);

    closeNoteDialog.addEventListener("click", () => noteDialog.close());
    doneNoteDialog.addEventListener("click", () => noteDialog.close());

    noteDialog.addEventListener("click", event => {
        if (event.target === noteDialog) noteDialog.close();
    });

    renderPatients();
    renderNotes();

    window.addEventListener("pageshow", event => {
        if (!event.persisted) return;
        patients = readStorage(PATIENTS_KEY);
        notes = readStorage(NOTES_KEY);
        renderPatients();
        renderNotes();
    });

    window.addEventListener("falaleve:patient-updated", () => {
        patients = readStorage(PATIENTS_KEY);
        renderPatients();
        renderNotes();
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".page-tab");
    const sections = document.querySelectorAll(".page-section");
    let activePsychologist = null;
    try {
        activePsychologist = JSON.parse(sessionStorage.getItem("psicologo") || "null");
    } catch {
        sessionStorage.removeItem("psicologo");
    }
    if (!activePsychologist?.id_psicologo) return;

    const profileKey = key => `${key}:${encodeURIComponent(String(activePsychologist.id_psicologo))}`;
    const AVAILABILITY_KEY = profileKey("falaleve_disponibilidade");
    const RESERVATIONS_KEY = profileKey("falaleve_reservas");
    const CANCELLATIONS_KEY = profileKey("falaleve_cancelamentos");
    const REQUESTS_KEY = profileKey("falaleve_solicitacoes");
    // GET should return { disponibilidade: [...], reservas: [...], cancelamentos: [...] };
    // PUT should accept { disponibilidade: [...] } for the authenticated psychologist.
    const SCHEDULE_API = ""; // Configure when the schedule API is implemented.
    // POST should accept { reserva_id, motivo } for the authenticated psychologist.
    const CANCELLATION_API = ""; // Configure when the cancellation endpoint is implemented.
    const REQUESTS_API = ""; // Configure when the pending-requests API is implemented.
    // POST should accept { solicitacao_id, acao: "aceitar" | "recusar" }.
    const REQUEST_ACTION_API = ""; // Configure when request decisions are supported by the server.
    const secondDemoProfile = activePsychologist.id_psicologo === "demo-psicologo-2";
    const demoScheduleByProfile = {
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
    const availabilityGrid = document.getElementById("availabilityGrid");
    const availabilityFeedback = document.getElementById("availabilityFeedback");
    const reservedAppointmentsList = document.getElementById("reservedAppointmentsList");
    const reservedAppointmentsEmpty = document.getElementById("reservedAppointmentsEmpty");
    const cancellationHistoryBody = document.getElementById("cancellationHistoryBody");
    const cancellationHistoryEmpty = document.getElementById("cancellationHistoryEmpty");
    const cancelReservationDialog = document.getElementById("cancelReservationDialog");
    const cancelReservationForm = document.getElementById("cancelReservationForm");
    const cancelReservationSummary = document.getElementById("cancelReservationSummary");
    const cancellationReason = document.getElementById("cancellationReason");
    const cancellationFeedback = document.getElementById("cancellationFeedback");
    const dismissCancellation = document.getElementById("dismissCancellation");
    const requestsList = document.getElementById("requestsList");
    const requestsEmpty = document.getElementById("requestsEmpty");
    const requestsStatus = document.getElementById("requestsStatus");
    const refreshRequests = document.getElementById("refreshRequests");

    const WEEKDAYS = [
        { id: "segunda", label: "Segunda-feira" },
        { id: "terca", label: "Terça-feira" },
        { id: "quarta", label: "Quarta-feira" },
        { id: "quinta", label: "Quinta-feira" },
        { id: "sexta", label: "Sexta-feira" },
        { id: "sabado", label: "Sábado" },
        { id: "domingo", label: "Domingo" }
    ];
    const TIME_SLOTS = Array.from({ length: 8 }, (_, index) => {
        const start = 12 + index;
        return {
            startTime: `${String(start).padStart(2, "0")}:00`,
            endTime: `${String(start + 1).padStart(2, "0")}:00`,
            label: `${String(start).padStart(2, "0")}–${String(start + 1).padStart(2, "0")}`
        };
    });

    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    if (activePsychologist.modo_demo) {
        const demoPatientId = `demo-solicitante-${activePsychologist.id_psicologo}`;
        const demoPatientName = secondDemoProfile ? "Rafael Exemplo" : "Marina Exemplo";
        const demoPatient = secondDemoProfile
            ? {
                nome_paciente: demoPatientName,
                email_paciente: "rafael.exemplo@falaleve.local",
                idade: 34,
                telefone: "(21) 98888-0202",
                cidade: "Niterói - RJ",
                motivo: "Procura apoio para organizar a rotina e lidar com o estresse no trabalho."
            }
            : {
                nome_paciente: demoPatientName,
                email_paciente: "marina.exemplo@falaleve.local",
                idade: 29,
                telefone: "(11) 90000-0101",
                cidade: "São Paulo - SP",
                motivo: "Busca acompanhamento para cuidar da ansiedade e da saúde emocional."
            };
        const demoRequest = {
            id: `demo-solicitacao-${activePsychologist.id_psicologo}`,
            patientId: demoPatientId,
            status: "pendente",
            demo: true,
            createdAt: new Date().toISOString(),
            paciente: demoPatient
        };
        const storedRequests = readArray(REQUESTS_KEY);
        if (localStorage.getItem(REQUESTS_KEY) === null) {
            localStorage.setItem(REQUESTS_KEY, JSON.stringify([demoRequest]));
        } else {
            let requestsChanged = false;
            const updatedRequests = storedRequests.map(request => {
                const isCurrentDemoRequest = request.demo && request.id === demoRequest.id
                    && String(request.status || "pendente").toLocaleLowerCase("pt-BR") === "pendente";
                if (!isCurrentDemoRequest) return request;
                requestsChanged = true;
                return { ...request, patientId: demoPatientId, paciente: demoPatient };
            });
            if (requestsChanged) localStorage.setItem(REQUESTS_KEY, JSON.stringify(updatedRequests));
        }
    }
    let availability = readArray(AVAILABILITY_KEY);
    let reservations = readArray(RESERVATIONS_KEY);
    let cancellationHistory = readArray(CANCELLATIONS_KEY);
    let reservationBeingCancelled = null;

    const demoDateInDays = days => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    };

    if (activePsychologist.modo_demo && !SCHEDULE_API && localStorage.getItem(AVAILABILITY_KEY) === null) {
        availability = demoScheduleByProfile[activePsychologist.id_psicologo] || [];
        localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(availability));
    }

    if (activePsychologist.modo_demo && !SCHEDULE_API && localStorage.getItem(RESERVATIONS_KEY) === null) {
        const demoPatientId = `demo-paciente-${activePsychologist.id_psicologo}`;
        const demoPatientName = secondDemoProfile
            ? "Caio Demonstração"
            : "Lia Demonstração";
        const days = secondDemoProfile ? [1, 5] : [2, 4];
        const hours = secondDemoProfile ? ["13:00", "18:00"] : ["14:00", "16:00"];
        reservations = days.map((offset, index) => {
            const startHour = Number(hours[index].slice(0, 2));
            return {
                id: `demo-reserva-${activePsychologist.id_psicologo}-${index + 1}`,
                patientId: demoPatientId,
                patientName: demoPatientName,
                date: demoDateInDays(offset),
                startTime: hours[index],
                endTime: `${String(startHour + 1).padStart(2, "0")}:00`,
                status: "reservado",
                demo: true
            };
        });
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    } else if (activePsychologist.modo_demo && !SCHEDULE_API) {
        const days = secondDemoProfile ? [1, 5] : [2, 4];
        const hours = secondDemoProfile ? ["13:00", "18:00"] : ["14:00", "16:00"];
        let changedDemoReservations = false;
        reservations = reservations.map(reservation => {
            const match = reservation.demo && reservation.id.startsWith(`demo-reserva-${activePsychologist.id_psicologo}-`);
            if (!match) return reservation;
            const index = Number(reservation.id.slice(-1)) - 1;
            if (index < 0 || index > 1) return reservation;
            const startHour = Number(hours[index].slice(0, 2));
            const endTime = `${String(startHour + 1).padStart(2, "0")}:00`;
            if (reservation.startTime === hours[index] && reservation.endTime === endTime) return reservation;
            const updated = {
                ...reservation,
                date: demoDateInDays(days[index]),
                startTime: hours[index],
                endTime
            };
            changedDemoReservations = true;
            return updated;
        });
        if (changedDemoReservations) localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    }

    async function saveAvailability(nextAvailability) {
        if (!SCHEDULE_API) {
            try {
                localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(nextAvailability));
                availabilityFeedback.textContent = "Disponibilidade salva neste dispositivo. A sincronização online será ativada na integração.";
                return true;
            } catch {
                availabilityFeedback.textContent = "Não foi possível salvar a disponibilidade neste navegador.";
                return false;
            }
        }

        try {
            const response = await fetch(SCHEDULE_API, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ disponibilidade: nextAvailability })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            availabilityFeedback.textContent = "Disponibilidade sincronizada com o servidor.";
            return true;
        } catch {
            availabilityFeedback.textContent = "Não foi possível sincronizar a disponibilidade com o servidor.";
            return false;
        }
    }

    function getBookedPatientName(slot) {
        if (slot.patientName || slot.nome_paciente) return slot.patientName || slot.nome_paciente;
        const patientId = slot.patientId || slot.id_paciente;
        if (patientId === undefined || patientId === null) return "Paciente reservado";
        const patient = readArray(profileKey("falaleve_pacientes"))
            .find(item => String(item.id || item.id_paciente) === String(patientId));
        return patient?.name || patient?.nome_paciente || "Paciente reservado";
    }

    function renderAvailability() {
        availabilityGrid.replaceChildren();
        const header = document.createElement("div");
        header.className = "availability-row availability-header";
        const dayHeading = document.createElement("strong");
        dayHeading.className = "availability-day";
        dayHeading.textContent = "Dia";
        header.append(dayHeading);
        TIME_SLOTS.forEach(slot => {
            const time = document.createElement("span");
            time.className = "availability-time-heading";
            time.textContent = `${slot.startTime.slice(0, 2)}h`;
            header.append(time);
        });
        availabilityGrid.append(header);

        WEEKDAYS.forEach(day => {
            const row = document.createElement("div");
            row.className = "availability-row";
            const label = document.createElement("strong");
            label.className = "availability-day";
            label.textContent = day.label;
            row.append(label);

            TIME_SLOTS.forEach(timeSlot => {
                const record = availability.find(slot =>
                    slot.weekday === day.id && slot.startTime === timeSlot.startTime
                );
                const button = document.createElement("button");
                button.type = "button";
                button.className = `availability-slot${record ? " is-available" : ""}`;
                button.setAttribute("aria-pressed", String(Boolean(record)));
                button.setAttribute("aria-label", `${day.label}, ${timeSlot.startTime} às ${timeSlot.endTime}: ${record ? "disponível, clique para remover" : "indisponível, clique para liberar"}`);
                button.textContent = timeSlot.label;

                button.addEventListener("click", async () => {
                    const exists = Boolean(record);
                    const nextAvailability = exists
                        ? availability.filter(slot => !(slot.weekday === day.id && slot.startTime === timeSlot.startTime))
                        : [...availability, {
                            weekday: day.id,
                            startTime: timeSlot.startTime,
                            endTime: timeSlot.endTime,
                            status: "available"
                        }];
                    button.disabled = true;
                    const saved = await saveAvailability(nextAvailability);
                    if (saved) {
                        availability = nextAvailability;
                        renderAvailability();
                    } else {
                        button.disabled = false;
                    }
                });
                row.append(button);
            });
            availabilityGrid.append(row);
        });
    }

    function renderReservations() {
        reservedAppointmentsList.replaceChildren();
        const orderedReservations = reservations.filter(reservation =>
            !["cancelado", "cancelada", "cancelled"].includes(String(reservation.status || "").toLocaleLowerCase("pt-BR"))
        ).sort((a, b) =>
            `${a.date || a.data || ""}T${a.startTime || a.time || ""}`.localeCompare(
                `${b.date || b.data || ""}T${b.startTime || b.time || ""}`
            )
        );
        reservedAppointmentsEmpty.hidden = orderedReservations.length > 0;
        orderedReservations.forEach(reservation => {
            const card = document.createElement("article");
            card.className = "reserved-appointment-card";
            const date = reservation.date || reservation.data || "Data a confirmar";
            const parsedDate = new Date(`${date}T12:00:00`);
            const dateLabel = Number.isNaN(parsedDate.getTime())
                ? date
                : parsedDate.toLocaleDateString("pt-BR");
            const time = reservation.startTime || reservation.time || "Horário a confirmar";
            const patientName = getBookedPatientName(reservation);
            const name = document.createElement("strong");
            name.textContent = patientName;
            const detail = document.createElement("span");
            detail.textContent = `${dateLabel} · ${time}${reservation.endTime ? `–${reservation.endTime}` : ""}${reservation.demo ? " · Demonstração" : ""}`;
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.className = "cancel-reservation-button";
            cancelButton.textContent = "Não posso comparecer";
            cancelButton.addEventListener("click", () => {
                reservationBeingCancelled = reservation;
                cancellationReason.value = "";
                cancellationFeedback.textContent = "";
                cancelReservationSummary.textContent = `${patientName} · ${dateLabel} · ${time}`;
                cancelReservationDialog.showModal();
            });
            card.append(name, detail, cancelButton);
            reservedAppointmentsList.append(card);
        });
    }

    function renderCancellationHistory() {
        cancellationHistoryBody.replaceChildren();
        cancellationHistoryEmpty.hidden = cancellationHistory.length > 0;
        cancellationHistory.forEach(record => {
            const row = document.createElement("tr");
            const date = record.date || "Data a confirmar";
            const parsedDate = new Date(`${date}T12:00:00`);
            const dateLabel = Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString("pt-BR");
            [dateLabel, record.startTime || "Horário a confirmar", record.patientName || "Paciente", record.reason || record.motivo || "Motivo não informado"]
                .forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.append(cell);
                });
            cancellationHistoryBody.append(row);
        });
    }

    dismissCancellation.addEventListener("click", () => cancelReservationDialog.close());
    cancelReservationForm.addEventListener("submit", async event => {
        event.preventDefault();
        const reason = cancellationReason.value.trim();
        if (!reservationBeingCancelled || !reason) {
            cancellationFeedback.textContent = "Informe o motivo para continuar.";
            return;
        }

        const reservation = reservationBeingCancelled;
        const cancellation = {
            id: `cancelamento-${reservation.id}`,
            reservationId: reservation.id,
            patientId: reservation.patientId || reservation.id_paciente,
            patientName: getBookedPatientName(reservation),
            date: reservation.date || reservation.data || "",
            startTime: reservation.startTime || reservation.time || "",
            reason,
            status: "cancelada",
            createdAt: new Date().toISOString()
        };

        cancellationFeedback.textContent = "Registrando motivo...";
        try {
            if (activePsychologist.modo_demo) {
                const nextReservations = reservations.filter(item => item.id !== reservation.id);
                const nextHistory = [cancellation, ...cancellationHistory];
                localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(nextReservations));
                localStorage.setItem(CANCELLATIONS_KEY, JSON.stringify(nextHistory));
            } else {
                if (!CANCELLATION_API) {
                    cancellationFeedback.textContent = "A integração de cancelamentos ainda não foi configurada.";
                    return;
                }
                const response = await fetch(CANCELLATION_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ reserva_id: reservation.id, motivo: reason })
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
            }

            reservations = reservations.filter(item => item.id !== reservation.id);
            cancellationHistory = [cancellation, ...cancellationHistory];
            renderReservations();
            renderCancellationHistory();
            cancelReservationDialog.close();
            cancelReservationForm.reset();
            reservationBeingCancelled = null;
        } catch {
            cancellationFeedback.textContent = "Não foi possível registrar o motivo. Tente novamente.";
        }
    });

    async function loadAvailability() {
        if (!SCHEDULE_API) {
            availability = readArray(AVAILABILITY_KEY);
            reservations = readArray(RESERVATIONS_KEY);
            cancellationHistory = readArray(CANCELLATIONS_KEY);
            renderAvailability();
            renderReservations();
            renderCancellationHistory();
            return;
        }
        availabilityFeedback.textContent = "Carregando disponibilidade...";
        try {
            const response = await fetch(SCHEDULE_API, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (!Array.isArray(payload.disponibilidade) || !Array.isArray(payload.reservas)) {
                throw new Error("Formato de agenda inválido");
            }
            availability = payload.disponibilidade;
            reservations = payload.reservas;
            if (Array.isArray(payload.cancelamentos)) cancellationHistory = payload.cancelamentos;
            renderAvailability();
            renderReservations();
            renderCancellationHistory();
            availabilityFeedback.textContent = "Disponibilidade carregada do servidor.";
        } catch {
            availabilityFeedback.textContent = "Não foi possível carregar a disponibilidade do servidor.";
            renderAvailability();
            renderReservations();
            renderCancellationHistory();
        }
    }

    let localRequests = readArray(REQUESTS_KEY);

    function getRequestPatient(request) {
        return request.paciente || request.patient || request;
    }

    function getRequestPatientId(request) {
        const patient = getRequestPatient(request);
        return request.patientId || request.id_paciente || patient.id_paciente || patient.id || `solicitante-${request.id}`;
    }

    function renderRequest(request) {
        const patient = getRequestPatient(request);
        const card = document.createElement("article");
        card.className = "request-card";
        const heading = document.createElement("div");
        heading.className = "request-card-heading";
        const titleGroup = document.createElement("div");
        const eyebrow = document.createElement("span");
        eyebrow.className = "eyebrow";
        eyebrow.textContent = request.demo ? "SOLICITAÇÃO DE DEMONSTRAÇÃO" : "NOVA SOLICITAÇÃO";
        const name = document.createElement("h3");
        name.textContent = patient.nome_paciente || patient.nome || patient.name || "Solicitante";
        titleGroup.append(eyebrow, name);
        const status = document.createElement("span");
        status.className = "request-pending-badge";
        status.textContent = "Pendente";
        heading.append(titleGroup, status);

        const sheetTitle = document.createElement("h4");
        sheetTitle.className = "request-sheet-title";
        sheetTitle.textContent = "Ficha do paciente";
        const sheet = document.createElement("dl");
        sheet.className = "request-sheet";
        const fields = [];
        if (request.solicitanteTipo === "responsavel") {
            const responsible = request.responsavel || {};
            fields.push(
                ["Responsável", responsible.nome_responsavel || patient.responsavel_nome || "Não informado"],
                ["Relação com a pessoa", patient.relacao_responsavel || "Não informada"],
                ["Contato do responsável", responsible.email_responsavel || patient.responsavel_email || "Não informado"]
            );
        }
        fields.push(
            ["Tipo de pedido", request.tipo_atendimento === "atendimento" ? "Atendimento pontual" : "Acompanhamento contínuo"],
            ["Data e horário", request.data && request.horario ? `${request.data} às ${request.horario}` : "Sem horário específico"],
            ["E-mail", patient.email_paciente || patient.email || "Não informado"],
            ["Idade", patient.idade ? `${patient.idade} anos` : "Não informada"],
            ["Telefone", patient.telefone_paciente || patient.telefone || "Não informado"],
            ["Cidade", [patient.cidade, patient.estado].filter(Boolean).join(" - ") || "Não informada"],
            ["Motivo do pedido", patient.motivo || patient.mensagem || request.mensagem || "Não informado"]
        );
        fields.forEach(([labelText, valueText]) => {
            const item = document.createElement("div");
            const label = document.createElement("dt");
            label.textContent = labelText;
            const value = document.createElement("dd");
            value.textContent = valueText;
            item.append(label, value);
            sheet.append(item);
        });

        const actions = document.createElement("div");
        actions.className = "request-actions";
        const reject = document.createElement("button");
        reject.type = "button";
        reject.className = "small-button request-reject";
        reject.textContent = "Recusar";
        reject.addEventListener("click", () => handleRequestAction(request, "recusar", reject));
        const accept = document.createElement("button");
        accept.type = "button";
        accept.className = "primary-button request-accept";
        accept.textContent = "Aceitar paciente";
        accept.addEventListener("click", () => handleRequestAction(request, "aceitar", accept));
        actions.append(reject, accept);
        card.append(heading, sheetTitle, sheet, actions);
        return card;
    }

    function renderPendingRequests(requests) {
        const pending = requests.filter(request =>
            ["pendente", "pending"].includes(
                String(request.status || request.estado || "pendente").toLocaleLowerCase("pt-BR")
            )
        );
        requestsList.replaceChildren(...pending.map(renderRequest));
        requestsEmpty.hidden = pending.length > 0;
        return pending.length;
    }

    async function handleRequestAction(request, action, button) {
        const requestId = request.id || request.id_solicitacao;
        if (requestId == null) {
            requestsStatus.textContent = "Não foi possível identificar esta solicitação.";
            return;
        }
        const nextStatus = action === "aceitar" ? "aceita" : "recusada";

        if (activePsychologist.modo_demo) {
            if (button) button.disabled = true;
            try {
                const storedRequests = readArray(REQUESTS_KEY);
                let matched = false;
                const nextRequests = storedRequests.map(item => {
                    const itemId = item.id ?? item.id_solicitacao;
                    if (itemId == null || String(itemId) !== String(requestId)) return item;
                    matched = true;
                    return { ...item, status: nextStatus, decididoEm: new Date().toISOString() };
                });
                if (!matched) {
                    requestsStatus.textContent = "Esta solicitação não está mais disponível. Atualize a lista.";
                    return;
                }
                localStorage.setItem(REQUESTS_KEY, JSON.stringify(nextRequests));
                if (action === "aceitar" && request.tipo_atendimento !== "atendimento") {
                    const patient = getRequestPatient(request);
                    const patientId = getRequestPatientId(request);
                    const patientKey = profileKey("falaleve_pacientes");
                    const patients = readArray(patientKey);
                    if (!patients.some(item => String(item.id || item.id_paciente) === String(patientId))) {
                        patients.push({
                            id: patientId,
                            name: patient.nome_paciente || patient.nome || patient.name || "Paciente",
                            email: patient.email_paciente || patient.email || "",
                            telefone: patient.telefone_paciente || patient.telefone || "",
                            idade: patient.idade || null,
                            cidade: patient.cidade || "",
                            relacaoResponsavel: patient.relacao_responsavel || "",
                            responsavelNome: request.responsavel?.nome_responsavel || patient.responsavel_nome || "",
                            responsavelEmail: request.responsavel?.email_responsavel || patient.responsavel_email || "",
                            descricaoSituacao: patient.motivo || "",
                            createdAt: new Date().toISOString(),
                            demo: true
                        });
                        localStorage.setItem(patientKey, JSON.stringify(patients));
                        window.dispatchEvent(new Event("falaleve:patient-updated"));
                    }
                } else if (action === "aceitar" && request.tipo_atendimento === "atendimento") {
                    const patient = getRequestPatient(request);
                    const appointmentDate = request.data;
                    const appointmentTime = request.horario;
                    if (appointmentDate && appointmentTime) {
                        const reservationKey = RESERVATIONS_KEY;
                        const reservations = readArray(reservationKey);
                        const alreadyReserved = reservations.some(item =>
                            item.date === appointmentDate && item.startTime === appointmentTime
                        );
                        if (!alreadyReserved) {
                            const endHour = Number(appointmentTime.slice(0, 2)) + 1;
                            reservations.push({
                                id: `reserva-${requestId}`,
                                patientId: getRequestPatientId(request),
                                patientName: patient.nome_paciente || patient.nome || patient.name || "Paciente",
                                date: appointmentDate,
                                startTime: appointmentTime,
                                endTime: `${String(endHour).padStart(2, "0")}:00`,
                                status: "reserved",
                                demo: true
                            });
                            localStorage.setItem(reservationKey, JSON.stringify(reservations));
                            reservations = readArray(reservationKey);
                            renderReservations();
                        }
                    }
                    const patientKey = profileKey("falaleve_pacientes");
                    const patients = readArray(patientKey);
                    const patientId = getRequestPatientId(request);
                    if (!patients.some(item => String(item.id || item.id_paciente) === String(patientId))) {
                        patients.push({
                            id: patientId,
                            name: patient.nome_paciente || patient.nome || patient.name || "Paciente",
                            email: patient.email_paciente || patient.email || "",
                            telefone: patient.telefone_paciente || patient.telefone || "",
                            idade: patient.idade || null,
                            cidade: patient.cidade || "",
                            relacaoResponsavel: patient.relacao_responsavel || "",
                            responsavelNome: request.responsavel?.nome_responsavel || patient.responsavel_nome || "",
                            responsavelEmail: request.responsavel?.email_responsavel || patient.responsavel_email || "",
                            descricaoSituacao: patient.motivo || "",
                            tipoVinculo: "atendimento",
                            createdAt: new Date().toISOString(),
                            demo: true
                        });
                        localStorage.setItem(patientKey, JSON.stringify(patients));
                        window.dispatchEvent(new Event("falaleve:patient-updated"));
                    }
                }
                localRequests = nextRequests;
                const remaining = renderPendingRequests(localRequests);
                requestsStatus.textContent = action === "aceitar"
                    ? request.tipo_atendimento === "atendimento"
                        ? "Atendimento aceito e horário reservado na agenda."
                        : "Acompanhamento aceito. O paciente foi adicionado à sua lista."
                    : "Solicitação recusada.";
                if (!remaining) requestsEmpty.hidden = false;
            } catch {
                requestsStatus.textContent = "Não foi possível salvar a decisão neste navegador.";
            } finally {
                if (button) button.disabled = false;
            }
            return;
        }

        if (!REQUEST_ACTION_API) {
            requestsStatus.textContent = "A integração para aceitar ou recusar solicitações ainda não foi configurada.";
            return;
        }
        try {
            const response = await fetch(REQUEST_ACTION_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ solicitacao_id: requestId, acao: action })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            requestsStatus.textContent = action === "aceitar" ? "Solicitação aceita." : "Solicitação recusada.";
            await loadPendingRequests();
        } catch {
            requestsStatus.textContent = "Não foi possível registrar a decisão. Verifique a conexão com o servidor.";
        }
    }

    async function loadPendingRequests() {
        requestsList.replaceChildren();
        requestsEmpty.hidden = true;
        if (!REQUESTS_API) {
            localRequests = readArray(REQUESTS_KEY);
            const pendingCount = renderPendingRequests(localRequests);
            requestsStatus.textContent = activePsychologist.modo_demo
                ? `${pendingCount} solicitação(ões) de demonstração carregada(s) neste navegador.`
                : "A integração com o servidor ainda não está configurada. Nenhuma solicitação foi consultada.";
            return;
        }
        refreshRequests.disabled = true;
        refreshRequests.textContent = "Atualizando...";
        requestsStatus.textContent = "Carregando solicitações...";
        try {
            const response = await fetch(REQUESTS_API, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            const allRequests = Array.isArray(payload) ? payload : payload.solicitacoes;
            if (!Array.isArray(allRequests)) throw new Error("Formato de resposta inválido");
            localRequests = allRequests;
            const pendingCount = renderPendingRequests(localRequests);
            requestsStatus.textContent = pendingCount
                ? `${pendingCount} solicitação(ões) pendente(s).`
                : "Consulta concluída.";
        } catch {
            requestsStatus.textContent = "Não foi possível carregar as solicitações. Verifique a conexão com o servidor.";
            requestsEmpty.hidden = false;
        } finally {
            refreshRequests.disabled = false;
            refreshRequests.textContent = "Atualizar";
        }
    }
    refreshRequests.addEventListener("click", loadPendingRequests);
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(item => {
                const selected = item === tab;
                item.classList.toggle("active", selected);
                item.setAttribute("aria-selected", String(selected));
            });
            sections.forEach(section => section.classList.toggle("active", section.id === tab.dataset.page));
            if (tab.dataset.page === "appointmentsPage") loadAvailability();
            if (tab.dataset.page === "requestsPage") loadPendingRequests();
        });
    });

    renderAvailability();
    renderReservations();
    renderCancellationHistory();
});


