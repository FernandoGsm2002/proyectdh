"""
DFT Runner API — FastAPI wrapper sobre main.py
Puerto: 8098 (interno, no expuesto a internet directamente)
El panel-api actúa como proxy autenticado hacia este servicio.

POST /run   { "texto": "DFT\\nusername=>...\\nemail=>..." }
GET  /health
"""
import asyncio
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from main import run_cuentas, parsear_cuentas

app = FastAPI(title="DFT Runner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Estado de jobs en memoria ───────────────────────────────────────────────
# Guarda el último resultado por job_id (simple, sin persistencia)
jobs: dict[str, dict] = {}
running = False   # Sólo un job a la vez (Playwright no es thread-safe)


class RunRequest(BaseModel):
    texto: str


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "running": running, "jobs_tracked": len(jobs)}


# ─── Preview — parsear sin ejecutar ──────────────────────────────────────────

@app.post("/preview")
def preview(req: RunRequest):
    """Devuelve la lista de cuentas que serían procesadas, sin ejecutar nada."""
    cuentas = parsear_cuentas(req.texto)
    return {"total": len(cuentas), "cuentas": cuentas}


# ─── Run ─────────────────────────────────────────────────────────────────────

@app.post("/run")
async def run(req: RunRequest):
    """
    Dispara el proceso en background.
    Responde inmediatamente con job_id.
    Consulta el estado en GET /job/{job_id}
    """
    global running
    if running:
        raise HTTPException(status_code=409, detail="Ya hay un proceso en ejecución. Espera a que termine.")

    cuentas = parsear_cuentas(req.texto)
    if not cuentas:
        raise HTTPException(status_code=422, detail="No se encontraron cuentas válidas en el texto.")

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "id": job_id,
        "status": "running",
        "total": len(cuentas),
        "started_at": datetime.now().isoformat(),
        "finished_at": None,
        "result": None,
    }

    asyncio.create_task(_run_job(job_id, req.texto))
    return {"job_id": job_id, "total": len(cuentas), "status": "running"}


async def _run_job(job_id: str, texto: str):
    global running
    running = True
    try:
        # run_cuentas es bloqueante — corre en thread pool para no bloquear el event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_cuentas, texto)
        jobs[job_id]["status"] = "done"
        jobs[job_id]["result"] = result
    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["result"] = {"error": str(e)}
    finally:
        jobs[job_id]["finished_at"] = datetime.now().isoformat()
        running = False


# ─── Job status ──────────────────────────────────────────────────────────────

@app.get("/job/{job_id}")
def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job no encontrado")
    return jobs[job_id]


@app.get("/jobs")
def list_jobs():
    return list(jobs.values())
