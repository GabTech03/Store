# La Biglietteria

![La Biglietteria Logo](progetto%20biglietti/immagini/logo.jpg)

## Descrizione del Progetto

La Biglietteria è una piattaforma web completa per la vendita di biglietti per eventi e concerti. Il sistema permette agli utenti di sfogliare eventi, acquistare biglietti, gestire il proprio profilo e molto altro. Include anche un'interfaccia di amministrazione per la gestione degli eventi.

## Caratteristiche Principali

### Per gli Utenti
- **Registrazione e Login**: Sistema di autenticazione completo per gli utenti
- **Ricerca Eventi**: Possibilità di cercare eventi per nome
- **Filtri Eventi**: Filtrare eventi per data (oggi, domani, fine settimana)
- **Dettagli Eventi**: Visualizzazione dettagliata di ogni evento con informazioni su data, ora, luogo e prezzi
- **Carrello Acquisti**: Aggiunta di biglietti al carrello e gestione degli acquisti
- **Profilo Utente**: Gestione delle informazioni personali e visualizzazione dei biglietti acquistati
- **Assistente Virtuale**: Chatbot basato su OpenAI per rispondere a domande su artisti e musica
- **Recensioni**: Possibilità di lasciare recensioni sulla piattaforma

### Per gli Amministratori
- **Gestione Eventi**: Creazione, modifica ed eliminazione di eventi
- **Gestione Luoghi**: Aggiunta di nuovi luoghi per gli eventi
- **Pannello di Controllo**: Interfaccia dedicata per la gestione del sistema

## Tecnologie Utilizzate

### Backend
- **FastAPI**: Framework Python per la creazione di API
- **PostgreSQL**: Database relazionale per la memorizzazione dei dati
- **Psycopg**: Adattatore PostgreSQL per Python
- **OpenAI API**: Integrazione per il chatbot assistente
- **Docker**: Containerizzazione dell'applicazione

### Frontend
- **HTML/CSS/JavaScript**: Tecnologie web standard per l'interfaccia utente
- **Font Awesome**: Icone per l'interfaccia utente
- **Responsive Design**: Interfaccia adattabile a diversi dispositivi

## Installazione

### Prerequisiti
- Docker e Docker Compose
- Account PostgreSQL (locale o remoto)
- Account OpenAI API (opzionale, per la funzionalità chatbot)

### Configurazione
1. Clona il repository:
   ```
   git clone https://github.com/tuousername/la-biglietteria.git
   cd la-biglietteria
   ```

2. Crea un file `.env` nella directory principale con le seguenti variabili:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ADMIN_EMAIL=admin@gmail.com
   OPENAI_API_KEY=your_openai_api_key  # Opzionale
   ```

3. Avvia l'applicazione con Docker Compose:
   ```
   docker-compose up -d
   ```

4. L'applicazione sarà disponibile all'indirizzo `http://localhost:8000`

## Utilizzo

### Accesso Utente
- Visita la homepage per sfogliare gli eventi disponibili
- Registrati o accedi per acquistare biglietti
- Aggiungi biglietti al carrello e completa il processo di acquisto

### Accesso Amministratore
- Accedi all'area amministrativa tramite `/admin/Login.html`
- Usa le credenziali admin per gestire eventi e luoghi

## Struttura del Progetto

```
la-biglietteria/
├── backend/                  # Backend FastAPI
│   ├── main.py               # API endpoints
│   ├── Dockerfile            # Configurazione Docker per il backend
│   └── requirements.txt      # Dipendenze Python
├── progetto biglietti/       # Frontend principale
│   ├── biglietteria.html     # Pagina principale
│   ├── styles.css            # Stili CSS
│   ├── script.js             # JavaScript per la logica frontend
│   ├── admin/                # Interfaccia amministrativa
│   │   ├── Login.html        # Pagina di login admin
│   │   ├── Admin.html        # Dashboard admin
│   │   └── style.css         # Stili per l'area admin
│   └── immagini/             # Immagini e risorse
├── chi_siamo/                # Pagina "Chi Siamo"
├── contatti/                 # Pagina "Contatti"
├── privacy_policy/           # Pagina "Privacy Policy"
├── termini_condizioni/       # Pagina "Termini e Condizioni"
├── docker-compose.yml        # Configurazione Docker Compose
└── README.md                 # Documentazione del progetto
```

## Licenza

Questo progetto è distribuito con licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Contatti

Per domande o supporto, contattaci a:
- Email: gabriele.infojob@gmail.com


---

© 2025 La Biglietteria - Tutti i diritti riservati