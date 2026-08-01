"""
Baixa modelos 3D grátis do BlenderKit para render-worker/assets/models/.

Requer a sua API key do BlenderKit (conta grátis):
  avatar (canto sup. direito) -> ADD-ON -> Show API Key.

Uso:
  export BLENDERKIT_API_KEY=<sua_chave>        # (ou .env)
  python render-worker/scripts/baixar_assets.py

Licença: os assets grátis do BlenderKit são CC0 ou Royalty-Free. Nós entregamos
RENDERS ao cliente (não a cena/modelo), o que a licença permite.
"""
import os
import json
import uuid
import urllib.request
import urllib.parse
from pathlib import Path

API = "https://www.blenderkit.com/api/v1"
DEST = Path(__file__).resolve().parent.parent / "assets" / "models"
ADDON_VER = "3.12.3"

# Curadoria por NOME (a busca casa e a gente pega o assetBaseId). Padrão BR.
ASSETS = {
    "geladeira": "Electrolux French Door Refrigerator",
    "coifa": "Whirlpool Range Hood",
    "cooktop": "Electrolux Black Cooktop Gas",
    "micro": "Microwave Oven",
    "cuba": "Stainless steel kitchen sink with faucet",
}


def _key() -> str:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except Exception:
        pass
    k = os.environ.get("BLENDERKIT_API_KEY", "").strip()
    if not k:
        raise SystemExit("Defina BLENDERKIT_API_KEY (ADD-ON -> Show API Key no site).")
    return k


def _get(url: str, key: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def _achar(query: str, key: str) -> dict | None:
    q = urllib.parse.quote_plus(query + " asset_type:model")
    data = _get(f"{API}/search/?query={q}&page_size=12", key)
    results = [r for r in (data.get("results") or [])
               if r.get("isFree") and r.get("canDownload")
               and any(f.get("fileType") == "blend" for f in r.get("files", []))]
    if not results:
        return None
    alvo = query.strip().lower()
    return next((r for r in results if (r.get("name") or "").strip().lower() == alvo), results[0])


def baixar(nome: str, query: str, key: str) -> None:
    a = _achar(query, key)
    if not a:
        print(f"[{nome}] não encontrado p/ '{query}'"); return
    blend = next((f for f in a.get("files", []) if f.get("fileType") == "blend"), None)
    # resolve a URL assinada (exige scene_uuid válido, como o addon)
    su = str(uuid.uuid4())
    dl = _get(f"{blend['downloadUrl']}?scene_uuid={su}&addon_version={ADDON_VER}", key)
    file_url = dl.get("filePath")
    if not file_url:
        print(f"[{nome}] sem URL de download: {dl}"); return
    DEST.mkdir(parents=True, exist_ok=True)
    out = DEST / f"{nome}.blend"
    # o CDN exige User-Agent (sem ele -> 403)
    req = urllib.request.Request(file_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=180) as r, open(out, "wb") as f:
        f.write(r.read())
    print(f"[{nome}] OK ({a.get('name')}) -> {out.name}  ({out.stat().st_size // 1024} KB)")


def main() -> None:
    key = _key()
    for nome, query in ASSETS.items():
        try:
            baixar(nome, query, key)
        except Exception as e:  # noqa: BLE001
            print(f"[{nome}] erro: {e}")


if __name__ == "__main__":
    main()
