"""
Planne · Render 3D fotorrealista em GPU serverless (Modal).

Modelo: a GPU LIGA quando chega um render e DESLIGA sozinha (scale-to-zero) —
você paga por segundo (~R$0,02 por render), não por mês.

Fluxo:
  1. O app (Vercel) insere uma linha em `render3d_job` (status 'pending') e chama
     o endpoint /enqueue deste app passando { "job_id": "<uuid>" }.
  2. /enqueue dispara render_job em background (spawn) e responde na hora.
  3. render_job liga a GPU, lê o payload do job no Supabase, roda o Blender
     (scene_from_job.py --engine cycles), sobe o PNG no Storage e marca
     'completed'. O front fica dando poll na linha até ter image_path.

Deploy (uma vez):
  pip install modal
  modal token new                      # login no navegador
  modal secret create planne-supabase \
      SUPABASE_URL=https://wulhokolymckmqqcwyuh.supabase.co \
      SUPABASE_SERVICE_KEY=<service_role_key>
  modal deploy render-worker/modal_app.py
  -> copie a URL do endpoint /enqueue que aparece no fim.
"""
import modal

# Blender Linux headless. Mantenha alinhado (aprox.) com o Blender local.
BLENDER_VER = "4.2.3"
BLENDER_SERIE = "Blender4.2"
BLENDER_URL = (
    f"https://download.blender.org/release/{BLENDER_SERIE}/"
    f"blender-{BLENDER_VER}-linux-x64.tar.xz"
)

# Imagem: Debian + libs gráficas headless + Blender + supabase-py.
# As pastas blender/ (scene_from_job.py) e assets/ (texturas + HDRI) vão junto.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "wget", "xz-utils", "libxrender1", "libxi6", "libxxf86vm1",
        "libxfixes3", "libgl1", "libxkbcommon0", "libsm6",
    )
    .run_commands(
        f"wget -q {BLENDER_URL} -O /tmp/blender.tar.xz",
        "mkdir -p /opt/blender && tar -xf /tmp/blender.tar.xz -C /opt/blender --strip-components=1",
        "ln -s /opt/blender/blender /usr/local/bin/blender",
    )
    .pip_install("supabase>=2.4,<3", "fastapi[standard]")
    .add_local_dir("render-worker/blender", remote_path="/app/blender")
    .add_local_dir("render-worker/assets", remote_path="/app/assets")
)

app = modal.App("planne-render", image=image)
supabase_secret = modal.Secret.from_name("planne-supabase")


def _sb():
    import os
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


@app.function(gpu="L4", timeout=600, secrets=[supabase_secret])
def render_job(job_id: str) -> dict:
    """Renderiza UM job (na GPU) e atualiza a fila + Storage."""
    import os, json, tempfile, subprocess
    sb = _sb()

    job = sb.table("render3d_job").select("*").eq("id", job_id).single().execute().data
    if not job:
        return {"ok": False, "erro": "job não encontrado"}
    sb.table("render3d_job").update(
        {"status": "processing", "updated_at": "now()"}
    ).eq("id", job_id).execute()

    try:
        with tempfile.TemporaryDirectory() as tmp:
            job_path = os.path.join(tmp, "job.json")
            out_png = os.path.join(tmp, "out.png")
            with open(job_path, "w", encoding="utf-8") as f:
                json.dump(job["payload"], f)
            subprocess.run(
                ["blender", "--background", "--python", "/app/blender/scene_from_job.py",
                 "--", "--job", job_path, "--out", out_png, "--engine", "cycles"],
                check=True,
            )
            dest = f"{job['empresa_id']}/{job_id}.png"
            with open(out_png, "rb") as f:
                sb.storage.from_("renders3d").upload(
                    dest, f.read(), {"content-type": "image/png", "upsert": "true"}
                )
            sb.table("render3d_job").update(
                {"status": "completed", "image_path": dest, "updated_at": "now()"}
            ).eq("id", job_id).execute()
            return {"ok": True, "path": dest}
    except Exception as e:  # noqa: BLE001
        sb.table("render3d_job").update(
            {"status": "error", "error": str(e)[:500], "updated_at": "now()"}
        ).eq("id", job_id).execute()
        raise


@app.function(secrets=[supabase_secret])
@modal.fastapi_endpoint(method="POST")
def enqueue(data: dict):
    """Endpoint HTTP que o app (Vercel) chama. Dispara o render e responde na hora."""
    job_id = (data or {}).get("job_id")
    if not job_id:
        return {"ok": False, "erro": "informe job_id"}
    render_job.spawn(job_id)
    return {"ok": True, "job_id": job_id}


@app.local_entrypoint()
def teste(job_id: str = ""):
    """Teste manual:  modal run render-worker/modal_app.py --job-id <uuid>"""
    if not job_id:
        print("Passe --job-id <uuid> de um render3d_job 'pending'.")
        return
    print(render_job.remote(job_id))
