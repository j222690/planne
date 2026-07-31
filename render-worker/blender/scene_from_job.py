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


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--job", required=True)
    p.add_argument("--out", default="./cena.png")
    return p.parse_args(argv)


def hex_rgb(h, fb="#EDE7DA"):
    h = (h or fb).lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)


def mat_pbr(nome, rgba, rough=0.45, metal=0.0, textura=None, grao=0.0):
    """PBR. `textura` = imagem (se houver); `grao` > 0 = textura procedural de
    MDF (relevo fino + leve variação), pra não ficar liso/plástico."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if textura and os.path.exists(textura):
        try:
            img = nt.nodes.new("ShaderNodeTexImage")
            img.image = bpy.data.images.load(textura)
            nt.links.new(img.outputs["Color"], b.inputs["Base Color"])
            return m
        except Exception:
            pass
    if grao > 0:
        try:
            # veio de madeira/MDF: ruído esticado no eixo Y → relevo + grão
            tc = nt.nodes.new("ShaderNodeTexCoord")
            mp = nt.nodes.new("ShaderNodeMapping")
            mp.inputs["Scale"].default_value = (6.0, 60.0, 6.0)  # esticado = veio
            nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
            noise = nt.nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 8.0
            noise.inputs["Detail"].default_value = 6.0
            nt.links.new(mp.outputs["Vector"], noise.inputs["Vector"])
            bump = nt.nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = grao
            nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
            nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
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
    z0 = PISO_AEREO if aereo else 0.0
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
    z_top = A + BANC_ESP / 2
    box("bancada", cx, -(P + 0.02) / 2, z_top, (x1 - x0), P + 0.02, BANC_ESP, mats["banc"])
    # cooktop / cuba nos módulos marcados
    for m in bases:
        cfg = m.get("configuracao", {}) or {}
        mx = m["posicao_x_cm"] / 100.0 + m["largura_cm"] / 200.0
        if cfg.get("tem_recorte_cooktop"):
            box("cooktop", mx, -P * 0.5, A + BANC_ESP + 0.004, 0.58, 0.50, 0.01, mats["eletro"])
        if cfg.get("tem_recorte_cuba"):
            box("cuba", mx, -P * 0.5, A + BANC_ESP - 0.03, 0.44, 0.38, 0.06, mats["eletro"])
            box("torneira", mx, -P * 0.25, A + BANC_ESP + 0.13, 0.02, 0.02, 0.26, mats["pux"])


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
    alvo.location = (cx, -D * 0.32, max_z * 0.5)
    bpy.context.collection.objects.link(alvo)
    cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 24
    cam = bpy.data.objects.new("cam", cam_d)
    # DENTRO do cômodo, perto da frente, num canto (vista 3/4)
    cam.location = (cx - W * 0.30, -(D * 0.94), H * 0.60)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target, trk.track_axis, trk.up_axis = alvo, "TRACK_NEGATIVE_Z", "UP_Y"
    # luzes de teto (apontam pra baixo por padrão) + preenchimento
    for (lx, ly, e, s) in [(cx, -D * 0.4, 550, 3.2), (cx + W * 0.3, -D * 0.75, 200, 4.0)]:
        ld = bpy.data.lights.new("l", type="AREA"); ld.energy = e; ld.size = s
        lo = bpy.data.objects.new("l", ld); lo.location = (lx, ly, H - 0.05)
        bpy.context.collection.objects.link(lo)
    w = bpy.data.worlds.new("w"); w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.86, 0.9, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.25
    bpy.context.scene.world = w


def setup_render(out):
    scn = bpy.context.scene
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scn.render.engine = eng; break
        except TypeError:
            continue
    scn.render.resolution_x, scn.render.resolution_y = 1600, 900
    # AgX evita o "estouro" de branco; fallback p/ versões antigas
    for vt in ("AgX", "Filmic", "Standard"):
        try:
            scn.view_settings.view_transform = vt; break
        except TypeError:
            continue
    scn.view_settings.exposure = -0.4
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
    tex = job.get("chapa_textura")
    mats = {
        "corpo": mat_pbr("chapa", hex_rgb(job.get("chapa_hex")), 0.5, textura=tex, grao=0.10),
        "porta": mat_pbr("porta", hex_rgb(job.get("chapa_hex")), 0.42, textura=tex, grao=0.10),
        "banc": mat_pbr("bancada", hex_rgb(job.get("bancada_hex", "#2b2b2e")), 0.18, 0.0, grao=0.03),
        "pux": mat_pbr("puxador", (0.72, 0.73, 0.75, 1), 0.28, 0.9),
        "eletro": mat_pbr("eletro", (0.09, 0.09, 0.10, 1), 0.22, 0.6),
        "parede": mat_pbr("parede", (0.90, 0.89, 0.86, 1), 0.9),
        "piso": mat_pbr("piso", (0.60, 0.52, 0.44, 1), 0.5, grao=0.06),  # amadeirado
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
    setup_render(a.out)
    bpy.ops.render.render(write_still=True)
    print(f"[scene] {len(modulos)} módulos → {a.out}")


if __name__ == "__main__":
    main()
