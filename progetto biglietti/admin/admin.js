document.addEventListener('DOMContentLoaded', () => {
    const createEventForm = document.getElementById('admin-create-event-form');
    const manageEventsSection = document.getElementById('manage-events-section');
    const eventList = document.getElementById('admin-event-list');
    const editEventSection = document.getElementById('edit-event-section');
    const editEventForm = document.getElementById('admin-edit-event-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // Base URL della tua API
    const API_BASE_URL = 'http://localhost:8000';

    // Funzione per caricare e visualizzare gli eventi
    async function fetchEvents() {
        try {
            const response = await fetch(`${API_BASE_URL}/eventi`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            displayEvents(data.eventi);
        } catch (error) {
            console.error("Errore nel recupero degli eventi:", error);
            alert("Errore nel caricamento degli eventi. Controlla la console per i dettagli.");
        }
    }

    // Funzione per mostrare gli eventi nella lista
    function displayEvents(events) {
        eventList.innerHTML = '';
        if (events.length === 0) {
            eventList.innerHTML = '<p>Nessun evento presente.</p>';
            return;
        }

        events.forEach(event => {
            const listItem = document.createElement('li');
            listItem.className = 'event-list-item';
            listItem.dataset.eventId = event.id;

            const eventInfo = document.createElement('div');
            eventInfo.className = 'event-info';
            eventInfo.innerHTML = `
                <strong>${event.nome}</strong>
                <p>Data: ${event.data} | Luogo: ${event.luogo}</p>
            `;

            const eventActions = document.createElement('div');
            eventActions.className = 'event-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Modifica';
            editBtn.onclick = () => showEditForm(event);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Elimina';
            deleteBtn.onclick = () => deleteEvent(event.id);

            eventActions.appendChild(editBtn);
            eventActions.appendChild(deleteBtn);
            listItem.appendChild(eventInfo);
            listItem.appendChild(eventActions);
            eventList.appendChild(listItem);
        });
    }

    // Funzione per la creazione di un evento
    createEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(createEventForm);

        try {
            const response = await fetch(`${API_BASE_URL}/eventi`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Errore nella creazione dell\'evento');
            }

            alert("Evento creato con successo!");
            createEventForm.reset();
            fetchEvents(); // Aggiorna la lista
        } catch (error) {
            console.error("Errore:", error);
            alert(`Errore: ${error.message}`);
        }
    });

    // Funzione per mostrare il modulo di modifica con i dati pre-popolati
    function showEditForm(event) {
        // Nascondi la sezione di gestione
        manageEventsSection.classList.add('hidden');
        // Mostra il modulo di modifica
        editEventSection.classList.remove('hidden');

        // Pre-popola il modulo
        document.getElementById('edit-event-id').value = event.id;
        document.getElementById('edit-event-name').value = event.nome;
        document.getElementById('edit-event-date').value = event.data;
        document.getElementById('edit-event-time').value = event.ora;
        document.getElementById('edit-event-location').value = event.luogo_id; // Questo campo richiede l'ID del luogo, che dovrai aggiungere al tuo backend e al frontend se non lo hai già fatto.
        document.getElementById('edit-event-prices').value = JSON.stringify(event.fasce_prezzo, null, 2);
    }

    // Gestisci l'invio del modulo di modifica
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = document.getElementById('edit-event-id').value;
        const formData = new FormData(editEventForm);

        try {
            const response = await fetch(`${API_BASE_URL}/eventi/${eventId}`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Errore nella modifica dell\'evento');
            }

            alert("Evento modificato con successo!");
            // Ritorna alla lista e aggiorna
            editEventSection.classList.add('hidden');
            manageEventsSection.classList.remove('hidden');
            fetchEvents();
        } catch (error) {
            console.error("Errore:", error);
            alert(`Errore: ${error.message}`);
        }
    });

    // Gestisci il pulsante "Annulla"
    cancelEditBtn.addEventListener('click', () => {
        editEventSection.classList.add('hidden');
        manageEventsSection.classList.remove('hidden');
    });

    // Funzione per eliminare un evento
    async function deleteEvent(eventId) {
        if (!confirm("Sei sicuro di voler eliminare questo evento?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/eventi/${eventId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.detail || 'Errore nell\'eliminazione dell\'evento');
            }

            alert("Evento eliminato con successo!");
            fetchEvents(); // Aggiorna la lista
        } catch (error) {
            console.error("Errore:", error);
            alert(`Errore: ${error.message}`);
        }
    }

    // Inizializza la pagina
    fetchEvents();
});