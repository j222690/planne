"""
Planne — Render 3D · cena a partir do JOB (móvel inteiro, com eletros).

Lê o payload (módulos já dimensionados pelo motor + chapa + puxador + flags de
cooktop/cuba/forno + janela) e monta o ambiente em 3D:
  caixa por módulo · portas + puxador · gavetas · BANCADA · FORNO + MICRO na torre
  · COOKTOP e CUBA na bancada · janela na parede · parede + piso + luz.

Tonemapping AgX + luz calma para não "lavar" a cena. Material da chapa aceita
textura (job.chapa_textura = caminho da imagem); sem imagem, usa a cor.

Uso:
  blender --background --python blender/scene_from_job.py -- --job sample_payload.json --out cena.png
"""
import bpy
import sys
import json
import os
import argparse

T = 0.018            # espessura painel (m)
PISO_AEREO = 1.50    # aéreo a 150cm do piso
BANC_ESP = 0.04      # espessura bancada
RODAPE = 0.10        # recuo dos pés (toe-kick) dos móveis de piso

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
HDRI = os.path.join(ASSETS, "hdri", "studio_1k.hdr")


def tex_set(subdir, prefix):
    """Mapas Color/Roughness/Normal de uma textura CC0 baixada (ambientCG)."""
    base = os.path.join(ASSETS, "textures", subdir)
    def g(suf):
        p = os.path.join(base, f"{prefix}_1K-JPG_{suf}.jpg")
        return p if os.path.exists(p) else None
    return {"color": g("Color"), "rough": g("Roughness"), "normal": g("NormalGL")}


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--job", required=True)
    p.add_argument("--out", default="./cena.png")
    p.add_argument("--engine", default="eevee", choices=["eevee", "cycles"])
    return p.parse_args(argv)


def hex_rgb(h, fb="#EDE7DA"):
    h = (h or fb).lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)


def mat_pbr(nome, rgba, rough=0.45, metal=0.0, texset=None, use_color=True,
           escala=1.0, nrm_forca=1.0):
    """PBR. `texset` = dict Color/Roughness/Normal (imagens CC0). use_color=False
    mantém a cor base (ex.: MDF branco) e usa só relevo/roughness da textura."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if texset:
        try:
            tc = nt.nodes.new("ShaderNodeTexCoord")
            mp = nt.nodes.new("ShaderNodeMapping")
            mp.inputs["Scale"].default_value = (escala, escala, escala)
            nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])  # escala real (m)
            def img(path, noncolor):
                n = nt.nodes.new("ShaderNodeTexImage")
                n.image = bpy.data.images.load(path)
                if noncolor:
                    n.image.colorspace_settings.name = "Non-Color"
                nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
                return n
            if use_color and texset.get("color"):
                nt.links.new(img(texset["color"], False).outputs["Color"], b.inputs["Base Color"])
            if texset.get("rough"):
                nt.links.new(img(texset["rough"], True).outputs["Color"], b.inputs["Roughness"])
            if texset.get("normal"):
                nm = nt.nodes.new("ShaderNodeNormalMap")
                nm.inputs["Strength"].default_value = nrm_forca
                nt.links.new(img(texset["normal"], True).outputs["Color"], nm.inputs["Color"])
                nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
        except Exception:
            pass
    return m


def box(nome, cx, cy, cz, sx, sy, sz, mat, bevel=True):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, cz))
    ob = bpy.context.active_object
    ob.name = nome
    ob.scale = (max(sx, 1e-4), max(sy, 1e-4), max(sz, 1e-4))
    bpy.ops.object.transform_apply(scale=True)
    ob.data.materials.append(mat)
    if bevel:
        bv = ob.modifiers.new("bevel", type="BEVEL")
        bv.width, bv.segments = 0.0018, 2
    return ob


def montar_modulo(m, mats):
    L = m["largura_cm"] / 100.0
    A = m["altura_cm"] / 100.0
    P = m["profundidade_cm"] / 100.0
    x0 = m.get("posicao_x_cm", 0) / 100.0
    aereo = m.get("posicao_y_cm", 0) >= 100
    z0 = PISO_AEREO if aereo else RODAPE   # móvel de piso sobe pelo rodapé
    cx = x0 + L / 2
    cy = -P / 2
    cfg = m.get("configuracao", {}) or {}
    portas = int(cfg.get("num_portas", 0))
    gavetas = int(cfg.get("num_gavetas", 0))
    y_fr = -P - T / 2

    # carcaça
    box("lat_e", x0 + T / 2, cy, z0 + A / 2, T, P, A, mats["corpo"])
    box("lat_d", x0 + L - T / 2, cy, z0 + A / 2, T, P, A, mats["corpo"])
    box("base", cx, cy, z0 + T / 2, L, P, T, mats["corpo"])
    box("teto", cx, cy, z0 + A - T / 2, L, P, T, mats["corpo"])
    box("fundo", cx, -T / 2, z0 + A / 2, L - 2 * T, T, A - 2 * T, mats["corpo"])
    # rodapé recuado (toe-kick escuro) nos móveis de piso
    if not aereo:
        box("rodape", cx, -(P - 0.06), RODAPE / 2, L - 2 * T, 0.03, RODAPE, mats["rodape"], bevel=False)

    # FORNO + MICRO embutidos na torre (insets escuros na frente)
    if cfg.get("tem_forno") and not aereo:
        box("forno", cx, y_fr, z0 + 0.75, L - 0.10, T * 1.6, 0.58, mats["eletro"])
        box("micro", cx, y_fr, z0 + 1.20, L - 0.14, T * 1.4, 0.34, mats["eletro"])
        # restante em portas
        for d, (zc, zh) in enumerate([(z0 + 0.30, 0.52), (z0 + 1.62, A - 1.72)]):
            if zh > 0.1:
                box(f"tp{d}", cx, y_fr, zc, L - 0.006, T, zh - 0.006, mats["porta"])
        _puxador(cx, y_fr, z0 + 0.30, 0.4, mats["pux"])
        return

    # gavetas (faixa embaixo) + portas (acima)
    zona_gav = min(A, gavetas * 0.16) if gavetas and portas else (A if gavetas else 0)
    if gavetas:
        gh = zona_gav / gavetas
        for i in range(gavetas):
            gz = z0 + i * gh + gh / 2
            box(f"gav{i}", cx, y_fr, gz, L - 0.006, T, gh - 0.006, mats["porta"])
            box(f"gpux{i}", cx, y_fr - T, gz, min(0.22, L * 0.55), 0.02, 0.014, mats["pux"])
    if portas:
        pz0, ph, pw = z0 + zona_gav, A - zona_gav, L / portas
        for d in range(portas):
            px = x0 + (d + 0.5) * pw
            box(f"porta{d}", px, y_fr, pz0 + ph / 2, pw - 0.006, T, ph - 0.006, mats["porta"])
            beira = px + (pw / 2 - 0.035) * (1 if d % 2 == 0 else -1)
            puxz = pz0 + (ph * 0.14 if aereo else ph * 0.86)
            _puxador(beira, y_fr, puxz, min(0.22, ph * 0.55), mats["pux"])


def _puxador(x, y_fr, z, alt, mat):
    box("pux", x, y_fr - T * 0.7, z, 0.02, 0.03, alt, mat, bevel=False)


def bancada_e_cooktops(modulos, mats):
    bases = [m for m in modulos if m.get("posicao_y_cm", 0) < 100
             and not (m.get("configuracao", {}) or {}).get("tem_forno")]
    if not bases:
        return
    xs = [m["posicao_x_cm"] / 100.0 for m in bases]
    xe = [m["posicao_x_cm"] / 100.0 + m["largura_cm"] / 100.0 for m in bases]
    A = max(m["altura_cm"] / 100.0 for m in bases)
    P = max(m["profundidade_cm"] / 100.0 for m in bases)
    x0, x1 = min(xs), max(xe)
    cx = (x0 + x1) / 2
    topo = RODAPE + A                    # altura do topo do balcão
    z_banc = topo + BANC_ESP / 2
    box("bancada", cx, -(P + 0.03) / 2, z_banc, (x1 - x0), P + 0.03, BANC_ESP, mats["banc"])
    # frontão / backsplash entre a bancada e os aéreos
    z_bs0, z_bs1 = topo + BANC_ESP, PISO_AEREO
    if z_bs1 > z_bs0 + 0.05:
        box("backsplash", cx, 0.05, (z_bs0 + z_bs1) / 2, (x1 - x0), 0.02, z_bs1 - z_bs0, mats["backsplash"], bevel=False)
    # cooktop (com bocas) / cuba nos módulos marcados
    for m in bases:
        cfg = m.get("configuracao", {}) or {}
        mx = m["posicao_x_cm"] / 100.0 + m["largura_cm"] / 200.0
        if cfg.get("tem_recorte_cooktop"):
            box("cooktop", mx, -P * 0.5, topo + BANC_ESP + 0.005, 0.58, 0.50, 0.01, mats["eletro"])
            for dx, dy in [(-0.14, 0.12), (0.14, 0.12), (-0.14, -0.12), (0.14, -0.12)]:
                box("boca", mx + dx, -P * 0.5 + dy, topo + BANC_ESP + 0.012, 0.11, 0.11, 0.008, mats["boca"], bevel=False)
        if cfg.get("tem_recorte_cuba"):
            box("cuba", mx, -P * 0.5, topo + BANC_ESP - 0.03, 0.44, 0.38, 0.06, mats["eletro"])
            box("torneira", mx, -P * 0.28, topo + BANC_ESP + 0.13, 0.022, 0.022, 0.26, mats["pux"])


def montar_comodo(job, min_x, max_x, max_z, max_p, mats):
    """Cômodo FECHADO: piso, teto, parede do fundo + 2 laterais (frente aberta
    para a câmera). Dimensões do projeto (medidas) ou envolvendo o móvel."""
    med = job.get("medidas", {}) or {}
    cx = (min_x + max_x) / 2
    W = max(max_x - min_x + 0.5, float(med.get("largura", 3.0)))
    D = max(max_p + 1.7, float(med.get("profundidade", 3.0)))
    H = max(max_z + 0.25, float(med.get("altura", 2.7)))
    x0, x1 = cx - W / 2, cx + W / 2
    p, pi = mats["parede"], mats["piso"]
    box("piso", cx, -D / 2, -0.006, W, D, 0.012, pi, bevel=False)
    box("teto", cx, -D / 2, H, W, D, 0.02, p, bevel=False)
    box("parede_fundo", cx, 0.02, H / 2, W, 0.04, H, p, bevel=False)
    box("parede_esq", x0, -D / 2, H / 2, 0.04, D, H, p, bevel=False)
    box("parede_dir", x1, -D / 2, H / 2, 0.04, D, H, p, bevel=False)
    j = job.get("janela")
    if j:
        jx = j.get("centro_x_cm", cx * 100) / 100.0
        jz = (j.get("base_cm", 100) + j.get("altura_cm", 100) / 2) / 100.0
        jw, jh = j.get("largura_cm", 120) / 100.0, j.get("altura_cm", 100) / 100.0
        vidro = bpy.data.materials.new("vidro"); vidro.use_nodes = True
        vb = vidro.node_tree.nodes.get("Principled BSDF")
        vb.inputs["Emission Color"].default_value = (0.95, 0.97, 1.0, 1)
        vb.inputs["Emission Strength"].default_value = 3.0
        box("janela", jx, 0.045, jz, jw, 0.02, jh, vidro, bevel=False)
        box("caixilho", jx, 0.05, jz, jw + 0.06, 0.045, jh + 0.06, mat_pbr("caixilho", (0.14, 0.14, 0.15, 1), 0.5), bevel=False)
    return cx, W, D, H


def camera_luz(cx, W, D, H, max_z):
    alvo = bpy.data.objects.new("alvo", None)
    alvo.location = (cx, -D * 0.30, H * 0.42)
    bpy.context.collection.objects.link(alvo)
    cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 30
    cam = bpy.data.objects.new("cam", cam_d)
    # FORA da frente (aberta), longe o bastante p/ pegar o cômodo INTEIRO; leve 3/4
    dist = D + W * 0.55 + 0.6
    cam.location = (cx - W * 0.10, -dist, H * 0.58)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target, trk.track_axis, trk.up_axis = alvo, "TRACK_NEGATIVE_Z", "UP_Y"
    # Iluminação: softbox quente (key) + preenchimento frio; o HDRI dá o ambiente.
    key = bpy.data.lights.new("key", type="AREA"); key.energy = 450; key.size = 6
    key.color = (1.0, 0.96, 0.9)
    ko = bpy.data.objects.new("key", key)
    ko.location = (cx - W * 0.2, -D * 0.5, H - 0.05); ko.rotation_euler = (0.5, 0, 0)
    bpy.context.collection.objects.link(ko)
    fill = bpy.data.lights.new("fill", type="AREA"); fill.energy = 130; fill.size = 9
    fill.color = (0.9, 0.94, 1.0)
    fo = bpy.data.objects.new("fill", fill)
    fo.location = (cx + W * 0.4, -dist * 0.7, H * 0.8)
    bpy.context.collection.objects.link(fo)
    # Mundo: HDRI de estúdio (luz + reflexos realistas); fallback cinza claro.
    w = bpy.data.worlds.new("w"); w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    if os.path.exists(HDRI):
        env = w.node_tree.nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(HDRI)
        w.node_tree.links.new(env.outputs["Color"], bg.inputs["Color"])
        bg.inputs["Strength"].default_value = 0.7
    else:
        bg.inputs[0].default_value = (0.88, 0.89, 0.93, 1)
        bg.inputs[1].default_value = 0.4
    bpy.context.scene.world = w


def setup_render(out, engine="eevee"):
    scn = bpy.context.scene
    if engine == "cycles":
        # Fotorrealista (GI real). Tenta GPU; sempre com teto de tempo p/ não travar.
        scn.render.engine = "CYCLES"
        usou_gpu = False
        try:
            prefs = bpy.context.preferences.addons["cycles"].preferences
            for backend in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
                try:
                    prefs.compute_device_type = backend
                    prefs.get_devices()
                    ativos = [d for d in prefs.devices if d.type == backend]
                    for d in prefs.devices:
                        d.use = (d.type == backend)
                    if ativos:
                        usou_gpu = True; break
                except Exception:
                    continue
        except Exception:
            pass
        try:
            scn.cycles.device = "GPU" if usou_gpu else "CPU"
            scn.cycles.samples = 96 if usou_gpu else 48
            scn.cycles.use_denoising = True
            scn.cycles.time_limit = 0 if usou_gpu else 150  # CPU: teto de 2m30 e finaliza
            scn.cycles.use_adaptive_sampling = True
        except Exception:
            pass
        print(f"[scene] Cycles em {'GPU' if usou_gpu else 'CPU (teto 150s)'}")
    else:
        for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
            try:
                scn.render.engine = eng; break
            except TypeError:
                continue
        # Qualidade: mais amostras + raytracing (GI/reflexo/sombra suave) no EEVEE Next
        try:
            scn.eevee.taa_render_samples = 96
        except Exception:
            pass
        for attr in ("use_raytracing", "use_gtao", "use_shadows"):
            try:
                setattr(scn.eevee, attr, True)
            except Exception:
                pass
    scn.render.resolution_x, scn.render.resolution_y = 1600, 900
    # AgX evita o "estouro" de branco; fallback p/ versões antigas
    for vt in ("AgX", "Filmic", "Standard"):
        try:
            scn.view_settings.view_transform = vt; break
        except TypeError:
            continue
    scn.view_settings.exposure = -0.2
    scn.render.filepath = out
    scn.render.image_settings.file_format = "PNG"


def main():
    a = parse_args()
    with open(a.job, encoding="utf-8") as f:
        job = json.load(f)
    modulos = job.get("modulos", [])
    if not modulos:
        print("[scene] payload sem módulos"); return

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.cursor.location = (0, 0, 0)
    # texturas CC0 (ambientCG). MDF branco: mantém a cor, usa só relevo/roughness.
    t_mad = tex_set("madeira", "Wood095")
    t_ban = tex_set("bancada", "Marble012")
    t_pis = tex_set("piso", "WoodFloor051")
    branco = hex_rgb(job.get("chapa_hex"))
    mats = {
        "corpo": mat_pbr("chapa", branco, 0.45, texset=t_mad, use_color=False, escala=1.2, nrm_forca=0.30),
        "porta": mat_pbr("porta", branco, 0.40, texset=t_mad, use_color=False, escala=1.2, nrm_forca=0.30),
        "banc": mat_pbr("bancada", (1, 1, 1, 1), 0.14, 0.0, texset=t_ban, escala=0.5, nrm_forca=0.6),
        "pux": mat_pbr("puxador", (0.72, 0.73, 0.75, 1), 0.28, 0.9),
        "eletro": mat_pbr("eletro", (0.09, 0.09, 0.10, 1), 0.22, 0.6),
        "boca": mat_pbr("boca", (0.05, 0.05, 0.06, 1), 0.15, 0.3),
        "rodape": mat_pbr("rodape", (0.18, 0.18, 0.2, 1), 0.5),
        "backsplash": mat_pbr("backsplash", (0.94, 0.94, 0.95, 1), 0.3),
        "parede": mat_pbr("parede", (0.90, 0.89, 0.86, 1), 0.9),
        "piso": mat_pbr("piso", (1, 1, 1, 1), 0.5, texset=t_pis, escala=0.45, nrm_forca=0.8),
    }

    for m in modulos:
        montar_modulo(m, mats)
    bancada_e_cooktops(modulos, mats)

    min_x = min(m.get("posicao_x_cm", 0) / 100.0 for m in modulos)
    max_x = max(m.get("posicao_x_cm", 0) / 100.0 + m["largura_cm"] / 100.0 for m in modulos)
    max_z = max((PISO_AEREO if m.get("posicao_y_cm", 0) >= 100 else 0) + m["altura_cm"] / 100.0 for m in modulos)
    max_p = max(m["profundidade_cm"] / 100.0 for m in modulos)
    cx, W, D, H = montar_comodo(job, min_x, max_x, max_z, max_p, mats)
    camera_luz(cx, W, D, H, max_z)
    setup_render(a.out, a.engine)
    bpy.ops.render.render(write_still=True)
    print(f"[scene] {len(modulos)} módulos → {a.out}")


if __name__ == "__main__":
    main()
