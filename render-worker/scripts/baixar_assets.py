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
import urllib.request
from pathlib import Path

API = "https://www.blenderkit.com/api/v1"
DEST = Path(__file__).resolve().parent.parent / "assets" / "models"

# Curadoria (assetBaseId da busca). Escolhidos por casarem com o padrão BR.
ASSETS = {
    "geladeira": "17579aa4-98fd-4c42-8e69-3e4303e3c97c",  # Electrolux French Door
    "coifa": "b5ca85cf-94d8-4c25-b8d5-b7f35a081261",       # Whirlpool Range Hood
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


def baixar(nome: str, base_id: str, key: str) -> None:
    # 1) acha o asset e o arquivo .blend (menor resolução serve p/ eletro)
    data = _get(f"{API}/search/?query=asset_base_id:{base_id}", key)
    results = data.get("results") or []
    if not results:
        print(f"[{nome}] não encontrado ({base_id})"); return
    a = results[0]
    blend = next((f for f in a.get("files", []) if f.get("fileType") == "blend"), None)
    if not blend:
        print(f"[{nome}] sem arquivo .blend"); return
    # 2) resolve a URL de download assinada
    dl = _get(blend["downloadUrl"], key)
    file_url = dl.get("filePath") or dl.get("url")
    if not file_url:
        print(f"[{nome}] sem URL de download: {dl}"); return
    # 3) baixa o .blend
    DEST.mkdir(parents=True, exist_ok=True)
    out = DEST / f"{nome}.blend"
    urllib.request.urlretrieve(file_url, out)
    print(f"[{nome}] OK -> {out}  ({out.stat().st_size // 1024} KB)")


def main() -> None:
    key = _key()
    for nome, base_id in ASSETS.items():
        try:
            baixar(nome, base_id, key)
        except Exception as e:  # noqa: BLE001
            print(f"[{nome}] erro: {e}")


if __name__ == "__main__":
    main()
