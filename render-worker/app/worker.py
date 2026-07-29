"""
Worker da fila de render 3D (esqueleto).

Loop: pega o job 'pending' mais antigo → chama o Blender headless para montar a
cena a partir do payload (módulos do motor + chapa + puxador) → sobe o PNG no
Supabase Storage → marca 'completed' (ou 'error').

MVP: as etapas de cena/render estão como STUBS marcados com TODO — o que já é
real e validável é o blender/box_demo.py (a caixa parametrizada). O próximo
passo é evoluir box_demo → scene_from_job (montar o corrido inteiro).
"""
from __future__ import annotations
import time
import subprocess
import tempfile
import os

from .config import config
from .motor_types import RenderPayload

try:
    from supabase import create_client, Client
except Exception:  # deps ainda não instaladas no ambiente de esqueleto
    create_client = None
    Client = object  # type: ignore


def _supabase() -> "Client":
    if not create_client:
        raise RuntimeError("Instale as deps: pip install -r requirements.txt")
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise RuntimeError("Defina SUPABASE_URL e SUPABASE_SERVICE_KEY no ambiente.")
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def pegar_job(sb: "Client") -> dict | None:
    """Pega o job 'pending' mais antigo e marca 'processing' (lock simples)."""
    res = (
        sb.table("render3d_job")
        .select("*")
        .eq("status", "pending")
        .order("created_at")
        .limit(1)
        .execute()
    )
    jobs = res.data or []
    if not jobs:
        return None
    job = jobs[0]
    sb.table("render3d_job").update(
        {"status": "processing", "updated_at": "now()", "tentativas": job.get("tentativas", 0) + 1}
    ).eq("id", job["id"]).execute()
    return job


def renderizar(payload: RenderPayload, out_png: str) -> None:
    """
    Monta a cena e renderiza (Blender headless).
    TODO(MVP): trocar box_demo por scene_from_job.py, que lê o payload inteiro
    (corrido: caixa + divisórias + portas + puxador + chapa) e renderiza tudo.
    Por enquanto, valida com UMA caixa do 1º módulo, provando o pipeline.
    """
    m = payload.modulos[0] if payload.modulos else None
    largura = (m.largura_cm * 10) if m else 800
    altura = (m.altura_cm * 10) if m else 720
    profundidade = (m.profundidade_cm * 10) if m else 550

    cmd = [
        config.BLENDER_BIN, "--background",
        "--python", os.path.join(os.path.dirname(__file__), "..", "blender", "box_demo.py"),
        "--",
        "--largura", str(largura),
        "--altura", str(altura),
        "--profundidade", str(profundidade),
        "--out", out_png,
    ]
    subprocess.run(cmd, check=True)


def concluir(sb: "Client", job: dict, out_png: str) -> None:
    path = f"{job['empresa_id']}/{job['id']}.png"
    with open(out_png, "rb") as f:
        sb.storage.from_(config.STORAGE_BUCKET).upload(
            path, f.read(), {"content-type": "image/png", "upsert": "true"}
        )
    sb.table("render3d_job").update(
        {"status": "completed", "image_path": path, "updated_at": "now()"}
    ).eq("id", job["id"]).execute()


def falhar(sb: "Client", job: dict, msg: str) -> None:
    excedeu = job.get("tentativas", 0) >= config.MAX_TENTATIVAS
    sb.table("render3d_job").update(
        {"status": "error" if excedeu else "pending",
         "error": msg[:500], "updated_at": "now()"}
    ).eq("id", job["id"]).execute()


def loop() -> None:
    sb = _supabase()
    print("[render-worker] ativo. Aguardando jobs…")
    while True:
        try:
            job = pegar_job(sb)
            if not job:
                time.sleep(config.POLL_INTERVAL_S)
                continue
            print(f"[render-worker] job {job['id']} → processando")
            payload = RenderPayload.from_dict(job["payload"])
            with tempfile.TemporaryDirectory() as tmp:
                out = os.path.join(tmp, "render.png")
                renderizar(payload, out)
                concluir(sb, job, out)
            print(f"[render-worker] job {job['id']} → concluído")
        except Exception as e:  # noqa: BLE001
            print(f"[render-worker] erro: {e}")
            try:
                if "job" in locals() and job:
                    falhar(sb, job, str(e))
            except Exception:
                pass
            time.sleep(config.POLL_INTERVAL_S)


if __name__ == "__main__":
    loop()
