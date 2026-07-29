"""Configuração do worker de render 3D (lê do ambiente / .env)."""
from __future__ import annotations
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


class Config:
    # Supabase (o worker escreve o PNG no Storage e atualiza a fila)
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    # Use a SERVICE ROLE key no worker (server-side), nunca a anon.
    SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
    STORAGE_BUCKET: str = os.environ.get("RENDER_BUCKET", "renders3d")

    # Blender headless
    BLENDER_BIN: str = os.environ.get("BLENDER_BIN", "blender")
    # Script de cena (o pipeline chama o Blender passando o job)
    SCENE_SCRIPT: str = os.environ.get(
        "SCENE_SCRIPT", "blender/scene_from_job.py"
    )

    # Render (MVP: Eevee em CPU)
    RENDER_ENGINE: str = os.environ.get("RENDER_ENGINE", "eevee")  # eevee | cycles
    RENDER_W: int = int(os.environ.get("RENDER_W", "1600"))
    RENDER_H: int = int(os.environ.get("RENDER_H", "900"))

    # Fila
    POLL_INTERVAL_S: float = float(os.environ.get("POLL_INTERVAL_S", "3"))
    MAX_TENTATIVAS: int = int(os.environ.get("MAX_TENTATIVAS", "3"))


config = Config()
