"""
DFTPro - Solicitudes de cambio de contraseña
Requiere: pip install "scrapling[fetchers]" && scrapling install

Uso:
  python main.py                        ← lee de stdin (pega el texto y Ctrl+D)
  python main.py "DFT\nusername=>..."   ← texto como argumento
  Importable desde Flask/FastAPI:       from main import run_cuentas
"""

from scrapling.fetchers import StealthyFetcher
from playwright.sync_api import Page
from datetime import datetime
import sys
import re
import time
from urllib.parse import urlparse

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
URL        = "https://dftpro.com/user/forget_password"
SEL_USER   = 'input[name="username"]'
SEL_EMAIL  = 'input[name="email"]'
SEL_BUTTON = 'button[type="submit"]'
INTERVALO_SOLICITUDES_SEGUNDOS = 120

# ─────────────────────────────────────────────
# PARSER — busca username y email en texto libre
# Formato esperado (flexible, en cualquier orden):
#   username=>MiUser   email=>correo@x.com
# ─────────────────────────────────────────────
def parsear_cuentas(texto: str) -> list[dict]:
    """Extrae pares {username, email} de un texto con formato DFTPro."""
    cuentas = []
    # Divide por bloques "DFT" (cabecera de cada cuenta)
    for bloque in re.split(r'\bDFT\b', texto):
        bloque = bloque.strip()
        if not bloque:
            continue
        u = re.search(r'username\s*=>\s*(\S+)', bloque)
        e = re.search(r'email\s*=>\s*(\S+)', bloque)
        if u and e:
            cuentas.append({"username": u.group(1), "email": e.group(1)})
    return cuentas

# ─────────────────────────────────────────────
# ACCIÓN EN EL FORMULARIO
# ─────────────────────────────────────────────
def fill_form(username: str, email: str, submission: dict):
    def action(page: Page):
        page.wait_for_selector(SEL_USER, timeout=15000)

        # La navegación inicial y el polling de /job no prueban que el formulario
        # se haya enviado. Registrar únicamente solicitudes del sitio tras el clic.
        def site_request(request):
            parsed = urlparse(request.url)
            if submission["clicked"] and parsed.hostname in ("dftpro.com", "www.dftpro.com") and parsed.path == "/user/forget_password" and request.method == "POST":
                submission["requests"].append({"method": request.method, "path": parsed.path, "status": None})

        def site_response(response):
            request = response.request
            parsed = urlparse(request.url)
            if parsed.hostname in ("dftpro.com", "www.dftpro.com") and parsed.path == "/user/forget_password" and request.method == "POST":
                for item in reversed(submission["requests"]):
                    if item["method"] == request.method and item["path"] == parsed.path and item["status"] is None:
                        item["status"] = response.status
                        break

        page.on("request", site_request)
        page.on("response", site_response)

        page.fill(SEL_USER, username, timeout=15000)
        page.fill(SEL_EMAIL, email, timeout=15000)

        val_user  = page.input_value(SEL_USER)
        val_email = page.input_value(SEL_EMAIL)
        print(f"\n     user_field='{val_user}' | email_field='{val_email}'", end=" ")

        time.sleep(0.8)
        submission["before_click"] = page.evaluate('''() => {
            const form = document.querySelector('input[name="username"]')?.form;
            const valid = form?.checkValidity() ?? false;
            window.__dftDiagnostics = { submit: 0, invalid: [] };
            form?.addEventListener('submit', () => window.__dftDiagnostics.submit++, true);
            form?.addEventListener('invalid', event =>
                window.__dftDiagnostics.invalid.push(event.target.name), true);
            return { valid,
                     turnstile_token: Boolean(form?.querySelector('[name="cf-turnstile-response"]')?.value) };
        }''')
        submission["clicked"] = True
        page.click(SEL_BUTTON)
        page.wait_for_timeout(3000)
        submission["after_click"] = page.evaluate('''() => ({
            url: location.pathname,
            submit: window.__dftDiagnostics?.submit ?? null,
            invalid: window.__dftDiagnostics?.invalid ?? [],
            turnstile_token: Boolean(document.querySelector('[name="cf-turnstile-response"]')?.value)
        })''')
    return action

# ─────────────────────────────────────────────
# MOTOR PRINCIPAL — importable desde la API
# Devuelve un dict con resultados para la API
# ─────────────────────────────────────────────
def run_cuentas(texto: str) -> dict:
    """
    Recibe el texto con las cuentas, las parsea y ejecuta el flujo Playwright.
    Retorna: {"ok": int, "err": int, "detalles": [...]}
    """
    hoy = datetime.now().strftime("%d/%m/%Y")
    print("=" * 50)
    print(f"  DFTPro - Cambios de contraseña [{hoy}]")
    print("=" * 50)

    cuentas = parsear_cuentas(texto)
    if not cuentas:
        print("  ⚠️  No se encontraron cuentas válidas en el texto.")
        return {"ok": 0, "err": 0, "detalles": [], "error": "No se encontraron cuentas"}

    print(f"\n  Total cuentas a procesar : {len(cuentas)}")
    print("\n  Cuentas detectadas:")
    for c in cuentas:
        print(f"    • {c['username']}")
    print()

    ok, err, warning = 0, 0, 0
    detalles = []

    for i, cuenta in enumerate(cuentas, 1):
        print(f"[{i}/{len(cuentas)}] {cuenta['username']} ...", end=" ", flush=True)
        try:
            submission = {"clicked": False, "requests": []}
            page = StealthyFetcher.fetch(
                URL,
                headless=True,
                solve_cloudflare=True,
                block_webrtc=True,
                hide_canvas=True,
                timeout=60000,
                google_search=True,
                network_idle=True,
                page_action=fill_form(cuenta["username"], cuenta["email"], submission),
                wait_selector=SEL_USER,
            )

            requests = submission["requests"]
            # Scrapling registra algunas excepciones de page_action y aun así
            # devuelve la página. Sin esta comprobación parecían ejecuciones válidas.
            if "before_click" not in submission:
                raise RuntimeError("No se completó el llenado del formulario; no hubo POST")
            if "after_click" not in submission and not requests:
                raise RuntimeError("El clic no terminó y no se observó el POST")
            trace = ", ".join(f"{r['method']} {r['path']} -> {r['status'] or 'sin respuesta'}" for r in requests)
            print(f"formulario antes: {submission.get('before_click')}; después: {submission.get('after_click')}; solicitudes: {trace or 'ninguna'}")
            # Un POST con HTTP 200 confirma recepción HTTP, no entrega del correo.
            # El sitio debe ofrecer una señal explícita antes de marcar ok.
            if requests:
                status = requests[-1]["status"]
                msg = f"POST del formulario: HTTP {status}; correo sin confirmar" if status else "POST del formulario sin respuesta"
            else:
                msg = "No se observó el POST del formulario"
            warning += 1
            detalles.append({"username": cuenta["username"], "status": "warning", "msg": msg})

        except Exception as e:
            print(f"❌  {e}")
            err += 1
            detalles.append({"username": cuenta["username"], "status": "error", "msg": str(e)})

        if i < len(cuentas):
            print(f"  Esperando {INTERVALO_SOLICITUDES_SEGUNDOS} segundos antes de la siguiente cuenta...", flush=True)
            time.sleep(INTERVALO_SOLICITUDES_SEGUNDOS)

    print(f"\n{'=' * 50}")
    print(f"  ✅ Confirmadas : {ok}   ⚠️ Sin verificar : {warning}   ❌ Errores : {err}")
    print(f"{'=' * 50}\n")

    return {"ok": ok, "warning": warning, "err": err, "detalles": detalles}

# ─────────────────────────────────────────────
# ENTRY POINT CLI
# Acepta texto por argumento o por stdin
# ─────────────────────────────────────────────
def main():
    """
    Entry point CLI.
    Uso:
      python main.py                   → lee de stdin (pega el texto, luego Ctrl+D)
      python main.py "DFT\n..."        → texto como primer argumento
    """
    if len(sys.argv) > 1:
        # Texto pasado como argumento (útil para pruebas rápidas)
        texto = " ".join(sys.argv[1:])
    elif not sys.stdin.isatty():
        # Texto por pipe o redirección:  cat cuentas.txt | python main.py
        texto = sys.stdin.read()
    else:
        # Modo interactivo: el usuario pega el bloque y presiona Ctrl+D
        print("  Pega el texto con las cuentas y presiona Ctrl+D cuando termines:\n")
        texto = sys.stdin.read()

    resultado = run_cuentas(texto)
    sys.exit(0 if resultado["err"] == 0 else 1)

if __name__ == "__main__":
    main()
