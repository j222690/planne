"""
Planne — Render 3D · cena a partir do JOB (móvel inteiro).

Lê um payload (os `modulos` já dimensionados pelo motor + chapa + puxador) e monta
o corrido inteiro em 3D: caixa por módulo, portas na frente, puxador por porta,
aéreos a 150cm do piso. Material a partir da cor da chapa. Render com Eevee.

Uso:
  blender --background --python blender/scene_from_job.py -- \
    --job sample_payload.json --out cena.png

O motor é o cérebro (medidas/posições); aqui é só o "corpo 3D".
"""
import bpy
import sys
import json
import argparse

T = 0.015          # espessura painel (m)
PISO_AEREO = 1.50  # aéreo começa a 150cm do piso


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--job", required=True)
    p.add_argument("--out", default="./cena.png")
    return p.parse_args(argv)


def hex_to_rgb(h):
    h = (h or "#EDE7DA").lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)


def novo_material(nome, rgba, rough=0.45):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    return m


def box(nome, cx, cy, cz, sx, sy, sz, mat):
    """Cubo unitário escalado, centrado em (cx,cy,cz)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, cz))
    ob = bpy.context.active_object
    ob.name = nome
    ob.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    ob.data.materials.append(mat)
    bev = ob.modifiers.new("bevel", type="BEVEL")
    bev.width, bev.segments = 0.0015, 2
    return ob


def montar_modulo(m, mat_corpo, mat_porta, mat_puxador):
    """Uma caixa + portas + puxadores, na posição do módulo. Depth para -Y (frente)."""
    L = m["largura_cm"] / 100.0
    A = m["altura_cm"] / 100.0
    P = m["profundidade_cm"] / 100.0
    x0 = m.get("posicao_x_cm", 0) / 100.0            # borda esquerda
    aereo = m.get("posicao_y_cm", 0) >= 100
    z0 = PISO_AEREO if aereo else 0.0                # base do módulo
    cxm = x0 + L / 2
    cym = -P / 2                                       # centro em profundidade (frente = -Y)
    cfg = m.get("configuracao", {}) or {}
    portas = int(cfg.get("num_portas", 0))
    gavetas = int(cfg.get("num_gavetas", 0))

    # carcaça
    box("lat_e", x0 + T / 2, cym, z0 + A / 2, T, P, A, mat_corpo)
    box("lat_d", x0 + L - T / 2, cym, z0 + A / 2, T, P, A, mat_corpo)
    box("base", cxm, cym, z0 + T / 2, L, P, T, mat_corpo)
    box("teto", cxm, cym, z0 + A - T / 2, L, P, T, mat_corpo)
    box("fundo", cxm, -T / 2, z0 + A / 2, L - 2 * T, T, A - 2 * T, mat_corpo)

    # frente: gavetas embaixo (faixa) + portas em cima
    zona_gav = min(A, gavetas * 0.16) if gavetas > 0 and portas > 0 else (A if gavetas > 0 else 0)
    y_frente = -P - T / 2
    # gavetas
    if gavetas > 0:
        gh = zona_gav / gavetas
        for i in range(gavetas):
            gz = z0 + i * gh + gh / 2
            box(f"gav{i}", cxm, y_frente, gz, L - 0.006, T, gh - 0.006, mat_porta)
            box(f"gpux{i}", cxm, y_frente - T, gz, min(0.20, L * 0.5), T * 0.8, 0.012, mat_puxador)
    # portas (ocupam o que sobra acima das gavetas)
    if portas > 0:
        pz0 = z0 + zona_gav
        ph = A - zona_gav
        pw = L / portas
        for d in range(portas):
            px = x0 + (d + 0.5) * pw
            box(f"porta{d}", px, y_frente, pz0 + ph / 2, pw - 0.006, T, ph - 0.006, mat_porta)
            # puxador: barra vertical na beira interna (aéreo: embaixo; base: em cima)
            beira = px + (pw / 2 - 0.03) * (1 if d % 2 == 0 else -1)
            puxz = pz0 + (ph * 0.15 if aereo else ph * 0.85)
            box(f"pux{d}", beira, y_frente - T, puxz, 0.02, T * 0.8, min(0.18, ph * 0.5), mat_puxador)


def enquadrar(min_x, max_x, max_z, max_p):
    cx = (min_x + max_x) / 2
    larg = max(max_x - min_x, 1.0)
    alvo = bpy.data.objects.new("alvo", None)
    alvo.location = (cx, -max_p / 2, max_z * 0.45)
    bpy.context.collection.objects.link(alvo)
    cam_d = bpy.data.cameras.new("cam")
    cam_d.lens = 40
    cam = bpy.data.objects.new("cam", cam_d)
    cam.location = (cx + larg * 0.15, -(max_p + larg * 1.15 + 1.0), max_z * 0.95)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target, trk.track_axis, trk.up_axis = alvo, "TRACK_NEGATIVE_Z", "UP_Y"
    # luz + mundo + piso + parede
    ld = bpy.data.lights.new("key", type="AREA"); ld.energy = 800; ld.size = 6
    lo = bpy.data.objects.new("key", ld)
    lo.location = (cx, -(max_p + larg), max_z * 2.2)
    bpy.context.collection.objects.link(lo)
    w = bpy.data.worlds.new("w"); w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.92, 0.92, 0.94, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.7
    bpy.context.scene.world = w
    piso_m = novo_material("piso", (0.85, 0.85, 0.87, 1), 0.6)
    box("piso", cx, 0.5, -0.001, larg * 3, max_p * 6, 0.002, piso_m)
    parede_m = novo_material("parede", (0.96, 0.95, 0.93, 1), 0.8)
    box("parede", cx, 0.02, max_z / 2 + 0.3, larg * 3, 0.02, max_z + 0.8, parede_m)


def setup_render(out):
    scn = bpy.context.scene
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scn.render.engine = eng; break
        except TypeError:
            continue
    scn.render.resolution_x, scn.render.resolution_y = 1600, 900
    scn.view_settings.view_transform = "Standard"
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
    mat_corpo = novo_material("chapa", hex_to_rgb(job.get("chapa_hex")))
    mat_porta = novo_material("porta", hex_to_rgb(job.get("chapa_hex")), 0.4)
    mat_pux = novo_material("puxador", (0.75, 0.76, 0.78, 1), 0.25)

    min_x, max_x, max_z, max_p = 1e9, -1e9, 0.1, 0.5
    for m in modulos:
        montar_modulo(m, mat_corpo, mat_porta, mat_pux)
        x0 = m.get("posicao_x_cm", 0) / 100.0
        min_x = min(min_x, x0)
        max_x = max(max_x, x0 + m["largura_cm"] / 100.0)
        z_top = (PISO_AEREO if m.get("posicao_y_cm", 0) >= 100 else 0) + m["altura_cm"] / 100.0
        max_z = max(max_z, z_top)
        max_p = max(max_p, m["profundidade_cm"] / 100.0)

    enquadrar(min_x, max_x, max_z, max_p)
    setup_render(a.out)
    bpy.ops.render.render(write_still=True)
    print(f"[scene] {len(modulos)} módulos → {a.out}")


if __name__ == "__main__":
    main()
