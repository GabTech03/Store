from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
import psycopg
import os
import json
from pathlib import Path
from fastapi.staticfiles import StaticFiles
import shutil
import uuid

# ==========================
# INTEGRAZIONE OPENAI (facoltativa)
# ==========================
import openai

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    # In dev puoi non averla: alza solo un warning, non bloccare l'app
    print("WARN: OPENAI_API_KEY non configurata. L'endpoint /chat restituirà errore se chiamato.")
else:
    openai.api_key = OPENAI_API_KEY

# ==========================
# Configurazione App FastAPI
# ==========================
app = FastAPI(
    title="La Biglietteria API",
    description="API per la gestione di eventi, biglietti e utenti.",
    version="1.0.0"
)

# Se vuoi servire anche i file statici del sito dallo stesso dominio (eviti CORS):
# app.mount("/site", StaticFiles(directory="progetto biglietti", html=True), name="site")

# ==========================
# Cartella immagini
# ==========================
IMAGES_DIR = Path("progetto biglietti/immagini")
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/immagini", StaticFiles(directory=str(IMAGES_DIR)), name="immagini")

# Base URL per immagini (aggiorna col tuo dominio in prod)
BASE_URL = "http://127.0.0.1:8000"

# ==========================
# Configurazione DB e Sicurezza
# ==========================
DATABASE_URL = os.getenv("DATABASE_URL")

# Normalizza eventuale postgres:// -> postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]
print("DATABASE_URL (sanitized):", DATABASE_URL)  # log utile in dev

# Usa bcrypt_sha256 per evitare il limite 72 byte e supporta vecchi hash bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto"
)

# Email admin (configurabile via .env)
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@gmail.com").strip().lower()

# ==========================
# Middleware CORS (DEV: aperto e senza credenziali)
# ==========================
print(">>> CORS DEV WIDE OPEN <<<")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",   # accetta qualsiasi origin in dev
    allow_credentials=False,   # se ti servono cookie, restringi origins e metti True
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# MODELLI Pydantic
# ==========================
class RegisterUser(BaseModel):
    nome: str
    cognome: str
    email: str
    password: str

class LoginUser(BaseModel):
    email: str
    password: str

class LuogoCreate(BaseModel):
    nome: str
    tipo: str  # "festival" o "stadio"

class ChatPrompt(BaseModel):
    prompt: str

class AddTicket(BaseModel):
    evento_id: int
    nome: str
    cognome: str

# ==========================
# Funzione DB
# ==========================
def get_db_connection():
    try:
        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL mancante (controlla .env)")
        return psycopg.connect(DATABASE_URL)
    except Exception as e:
        print("DB CONNECTION ERROR:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore di connessione al database: {e}"
        )

# ==========================
# Health check DB
# ==========================
@app.get("/_health/db")
def health_db():
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            cur.fetchone()
        conn.close()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

# ==========================
# Chatbot sugli artisti
# ==========================
@app.post("/chat")
async def chat_with_openai(chat_prompt: ChatPrompt):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY non configurata.")
    try:
        system_prompt = (
            "Sei un assistente virtuale esperto di musica e artisti italiani e internazionali. "
            "Puoi dare informazioni su cantanti, gruppi musicali, album e concerti. "
            "Rispondi in modo chiaro, conciso e adatto ad un utente che usa una biglietteria online. "
            "Se la domanda non riguarda la musica o gli artisti, "
            "rispondi educatamente che puoi solo parlare di artisti e musica."
        )
        final_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": chat_prompt.prompt}
            ],
            max_tokens=300
        )
        return {"response": final_response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore OpenAI: {str(e)}")

# ==========================
# Registrazione/Login (UTENTE)
# ==========================
@app.post("/register")
def register(user: RegisterUser):
    hashed_pw = pwd_context.hash(user.password)
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO utente (nome, cognome) VALUES (%s, %s) RETURNING id",
                (user.nome, user.cognome),
            )
            utente_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO autentificazione (utente_id, email, password_hash) VALUES (%s, %s, %s)",
                (utente_id, user.email, hashed_pw),
            )
            conn.commit()
        return {"message": "Utente registrato con successo"}
    except psycopg.errors.UniqueViolation:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=409, detail="Questa email è già registrata.")
    except Exception as e:
        if conn:
            conn.rollback()
        print("REGISTER ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=f"Errore interno registrazione: {e}")
    finally:
        if conn:
            conn.close()

@app.post("/login")
def login(user: LoginUser):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT password_hash FROM autentificazione WHERE email=%s", (user.email,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Email non trovata")
            # Verifica supporta sia bcrypt_sha256 che bcrypt
            if not pwd_context.verify(user.password, row[0]):
                raise HTTPException(status_code=401, detail="Password errata")
        return {"message": "Login effettuato con successo"}
    except HTTPException:
        raise
    except Exception as e:
        print("LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=f"Errore interno login: {e}")
    finally:
        if conn:
            conn.close()

# ==========================
# Login ADMIN (endpoint separato)
# ==========================
@app.post("/admin/login")
def admin_login(user: LoginUser):
    """
    Login riservato all'admin.
    - Controlla che l'email corrisponda a ADMIN_EMAIL (default admin@gmail.com)
    - Verifica la password sulla tabella 'autentificazione'
    Ritorna 403 se l'email non è quella dell'admin, 401 se credenziali non valide.
    """
    # 1) verifica email admin
    if (user.email or "").strip().lower() != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Accesso non autorizzato")

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT password_hash FROM autentificazione WHERE email=%s",
                (user.email,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Credenziali non valide")

            # 2) verifica password
            if not pwd_context.verify(user.password, row[0]):
                raise HTTPException(status_code=401, detail="Credenziali non valide")

        # success
        return {
            "message": "Login admin effettuato con successo",
            "is_admin": True,
            # opzionale: percorso utile per redirect lato client
            "redirect_url": "/site/admin/Admin.html"
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ADMIN LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=f"Errore interno: {e}")
    finally:
        if conn:
            conn.close()

# ==========================
# Endpoint Eventi (GET, POST, PUT, DELETE)
# ==========================
@app.get("/eventi")
def lista_eventi(filtro: str = None):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            sql_query = """
                SELECT e.id, e.nome, e.data_ev, e.ora_ev, l.nome, l.tipo, e.immagine
                FROM evento e
                JOIN luogo l ON e.luogo_id = l.id
            """
            if filtro == "oggi":
                sql_query += " WHERE e.data_ev = CURRENT_DATE"
            elif filtro == "domani":
                sql_query += " WHERE e.data_ev = CURRENT_DATE + 1"
            elif filtro == "fine settimana":
                sql_query += " WHERE EXTRACT(DOW FROM e.data_ev) IN (6,0)"
            sql_query += " ORDER BY e.data_ev, e.ora_ev"
            cur.execute(sql_query)
            righe_eventi = cur.fetchall()

        eventi = []
        for row in righe_eventi:
            evento_id = row[0]
            with conn.cursor() as cur_costi:
                cur_costi.execute("SELECT fascia, prezzo FROM costo WHERE evento_id=%s", (evento_id,))
                fasce = [{"fascia": f[0], "prezzo": float(f[1])} for f in cur_costi.fetchall()]
            eventi.append({
                "id": evento_id,
                "nome": row[1],
                "data": str(row[2]),
                "ora": str(row[3]),
                "luogo": row[4],
                "tipo_luogo": row[5],
                "fasce_prezzo": fasce,
                "immagine_url": f"{BASE_URL}/immagini/{row[6]}" if row[6] else None
            })
        return {"eventi": eventi}
    finally:
        if conn:
            conn.close()

@app.post("/eventi")
async def crea_evento(
    nome: str = Form(...),
    data_ev: str = Form(...),
    ora_ev: str = Form(...),
    luogo_id: int = Form(...),
    fasce_prezzo: str = Form(..., description='JSON es: [{"fascia": "VIP", "prezzo": 120.0}]'),
    immagine: UploadFile = File(...)
):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Inserisci evento base
                cur.execute(
                    "INSERT INTO evento (nome, data_ev, ora_ev, luogo_id) VALUES (%s, %s, %s, %s) RETURNING id",
                    (nome, data_ev, ora_ev, luogo_id),
                )
                evento_id = cur.fetchone()[0]

                # Salva immagine con nome unico
                estensione = Path(immagine.filename).suffix
                nuovo_nome = f"evento_{evento_id}_{uuid.uuid4().hex}{estensione}"
                file_path = IMAGES_DIR / nuovo_nome
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(immagine.file, buffer)

                # Aggiorna evento con immagine
                cur.execute("UPDATE evento SET immagine=%s WHERE id=%s", (nuovo_nome, evento_id))

                # Inserisci fasce di prezzo
                fasce = json.loads(fasce_prezzo)
                for f in fasce:
                    cur.execute(
                        "INSERT INTO costo (evento_id, fascia, prezzo) VALUES (%s, %s, %s)",
                        (evento_id, f["fascia"], f["prezzo"]),
                    )

                conn.commit()

                return {
                    "message": "Evento creato con successo",
                    "evento_id": evento_id,
                    "immagine_url": f"/immagini/{nuovo_nome}"
                }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/eventi/{evento_id}")
async def modifica_evento(
    evento_id: int,
    nome: str = Form(...),
    data_ev: str = Form(...),
    ora_ev: str = Form(...),
    luogo_id: int = Form(...),
    fasce_prezzo: str = Form(..., description='JSON es: [{"fascia": "VIP", "prezzo": 120.0}]'),
    immagine: UploadFile = File(None)
):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Recupera l'immagine precedente
                cur.execute("SELECT immagine FROM evento WHERE id = %s", (evento_id,))
                vecchio_nome_immagine = cur.fetchone()[0]

                nuovo_nome_immagine = vecchio_nome_immagine
                if immagine:
                    # Salva la nuova immagine
                    estensione = Path(immagine.filename).suffix
                    nuovo_nome_immagine = f"evento_{evento_id}_{uuid.uuid4().hex}{estensione}"
                    file_path = IMAGES_DIR / nuovo_nome_immagine
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(immagine.file, buffer)

                    # Elimina l'immagine vecchia se esiste
                    if vecchio_nome_immagine and (IMAGES_DIR / vecchio_nome_immagine).exists():
                        os.remove(IMAGES_DIR / vecchio_nome_immagine)

                # Aggiorna l'evento nel database
                cur.execute(
                    """
                    UPDATE evento
                    SET nome=%s,
                        data_ev=%s,
                        ora_ev=%s,
                        luogo_id=%s,
                        immagine=%s
                    WHERE id = %s
                    """,
                    (nome, data_ev, ora_ev, luogo_id, nuovo_nome_immagine, evento_id),
                )

                # Rimpiazza fasce di prezzo
                cur.execute("DELETE FROM costo WHERE evento_id=%s", (evento_id,))
                fasce = json.loads(fasce_prezzo)
                for f in fasce:
                    cur.execute(
                        "INSERT INTO costo (evento_id, fascia, prezzo) VALUES (%s, %s, %s)",
                        (evento_id, f["fascia"], f["prezzo"]),
                    )

                conn.commit()
                return {"message": "Evento modificato con successo"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/eventi/{evento_id}")
def elimina_evento(evento_id: int):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Recupera il nome dell'immagine per eliminarla
                cur.execute("SELECT immagine FROM evento WHERE id = %s", (evento_id,))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Evento non trovato.")

                immagine_nome = row[0]

                # Rimuovi i costi associati all'evento
                cur.execute("DELETE FROM costo WHERE evento_id = %s", (evento_id,))

                # Rimuovi l'evento stesso
                cur.execute("DELETE FROM evento WHERE id = %s", (evento_id,))

                # Rimuovi l'immagine dal file system
                if immagine_nome:
                    immagine_path = IMAGES_DIR / immagine_nome
                    if immagine_path.exists():
                        os.remove(immagine_path)

                conn.commit()
                return {"message": f"Evento con ID {evento_id} eliminato con successo."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================
# Endpoint Ricerca
# ==========================
@app.get("/eventi/ricerca")
def ricerca_eventi(nome: str):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT e.id, e.nome, e.data_ev, e.ora_ev, l.nome, l.tipo, e.immagine
                FROM evento e
                JOIN luogo l ON e.luogo_id = l.id
                WHERE e.nome ILIKE %s
                ORDER BY e.data_ev, e.ora_ev
            """, (f"%{nome}%",))
            righe_eventi = cur.fetchall()

        eventi = []
        for row in righe_eventi:
            evento_id = row[0]
            with conn.cursor() as cur_costi:
                cur_costi.execute("SELECT fascia, prezzo FROM costo WHERE evento_id=%s", (evento_id,))
                fasce = [{"fascia": f[0], "prezzo": float(f[1])} for f in cur_costi.fetchall()]
            eventi.append({
                "id": evento_id,
                "nome": row[1],
                "data": str(row[2]),
                "ora": str(row[3]),
                "luogo": row[4],
                "tipo_luogo": row[5],
                "fasce_prezzo": fasce,
                "immagine_url": f"{BASE_URL}/immagini/{row[6]}" if row[6] else None
            })
        return {"eventi": eventi}
    finally:
        if conn:
            conn.close()

# ==========================
# Endpoint Carrello (IN MEMORIA per demo)
# ==========================
carrello = []

@app.post("/carrello")
def aggiungi_al_carrello(ticket: AddTicket):
    carrello.append(ticket.dict())
    return {"message": "Biglietto aggiunto al carrello", "carrello": carrello}

@app.get("/carrello")
def mostra_carrello():
    return {"carrello": carrello}

@app.delete("/carrello")
def svuota_carrello():
    carrello.clear()
    return {"message": "Carrello svuotato"}

@app.get("/user/{email}")
def get_user(email: str):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.nome, u.cognome, a.email
                    FROM utente u
                    JOIN autentificazione a ON u.id = a.utente_id
                    WHERE a.email = %s
                """, (email,))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Utente non trovato")
                return {"nome": row[0], "cognome": row[1], "email": row[2]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================
# Endpoint: Creazione Luogo
# ==========================
@app.post("/luoghi")
def crea_luogo(luogo: LuogoCreate):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO luogo (nome, tipo) VALUES (%s, %s) RETURNING id",
                    (luogo.nome, luogo.tipo),
                )
                luogo_id = cur.fetchone()[0]
                conn.commit()
                return {"message": "Luogo creato con successo", "luogo_id": luogo_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
