"""
Planne — Render 3D · ENTREGA 3: caixa (gabinete) parametrizada.

Gera, POR CÓDIGO, o corpo de um módulo a partir de 3 variáveis (largura, altura,
profundidade) + espessura, aplica um material de MDF, posiciona câmera/luz e
renderiza um PNG com Eevee. É a prova de conceito do "peça-base gerada por
código" antes de expandir pro catálogo inteiro.

Uso (Blender 4.x no PATH):
  blender --background --python blender/box_demo.py -- \
    --largura 800 --altura 720 --profundidade 550 --espessura 15 \
    --cor "#EDE7DA" --out ./caixa.png

Tudo em milímetros; convertido para metros (unidade do Blender) internamente.
"""
import bpy
import sys
import math
import argparse


# ─── args (o que vem depois de "--") ─────────────────────────────────────────
def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--largura", type=float, default=800)        # mm
    p.add_argument("--altura", type=float, default=720)         # mm
    p.add_argument("--profundidade", type=float, default=550)   # mm
    p.add_argument("--espessura", type=float, default=15)       # mm
    p.add_argument("--cor", type=str, default="#EDE7DA")        # hex
    p.add_argument("--out", type=str, default="./caixa.png")
    return p.parse_args(argv)


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    # sRGB → linear (aprox.) para cor correta no render
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.cursor.location = (0, 0, 0)


def material_mdf(nome, rgba, rugosidade=0.45):
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rugosidade
    return mat


def painel(nome, sx, sy, sz, loc, mat):
    """Um painel = cubo unitário escalado (geometria pura, paramétrica)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = nome
    ob.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    ob.data.materials.append(mat)
    # bevel sutil pra pegar luz nas quinas (aparência de MDF real)
    bev = ob.modifiers.new("bevel", type="BEVEL")
    bev.width = 0.0015
    bev.segments = 2
    return ob


def criar_caixa(L, A, P, t, mat):
    """Carcaça: 2 laterais + base + teto + fundo. x=largura, y=prof, z=altura."""
    # laterais (t × P × A) nas pontas
    painel("lateral_esq", t, P, A, (-(L / 2 - t / 2), 0, A / 2), mat)
    painel("lateral_dir", t, P, A, (+(L / 2 - t / 2), 0, A / 2), mat)
    # base e teto (L × P × t)
    painel("base", L, P, t, (0, 0, t / 2), mat)
    painel("teto", L, P, t, (0, 0, A - t / 2), mat)
    # fundo (L × t × A) no fundo (y negativo)
    painel("fundo", L - 2 * t, t, A - 2 * t, (0, -(P / 2 - t / 2), A / 2), mat)


def setup_camera_luz(L, A, P):
    alvo_z = A / 2
    # câmera 3/4 na frente, ligeiramente acima
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 42
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (L * 1.3, -(P * 2.4 + 0.8), A * 1.15)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    # alvo pra câmera olhar
    alvo = bpy.data.objects.new("alvo", None)
    alvo.location = (0, 0, alvo_z)
    bpy.context.collection.objects.link(alvo)
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target = alvo
    trk.track_axis = "TRACK_NEGATIVE_Z"
    trk.up_axis = "UP_Y"
    # luz principal (área) + preenchimento pelo mundo
    luz_data = bpy.data.lights.new("key", type="AREA")
    luz_data.energy = 400
    luz_data.size = 3
    luz = bpy.data.objects.new("key", luz_data)
    luz.location = (L, -P * 3, A * 2)
    bpy.context.collection.objects.link(luz)
    # mundo cinza claro (ambiente)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.9, 0.92, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    bpy.context.scene.world = world
    # chão neutro
    bpy.ops.mesh.primitive_plane_add(size=max(L, P) * 12, location=(0, 0, 0))
    piso = bpy.context.active_object
    pm = material_mdf("piso", (0.82, 0.82, 0.84, 1), 0.6)
    piso.data.materials.append(pm)


def setup_render(out_png):
    scn = bpy.context.scene
    # Eevee (nome do engine varia entre 4.0–4.1 e 4.2+ EEVEE Next)
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scn.render.engine = eng
            break
        except TypeError:
            continue
    scn.render.resolution_x = 1600
    scn.render.resolution_y = 900
    scn.render.film_transparent = False
    scn.view_settings.view_transform = "Standard"
    scn.render.filepath = out_png
    scn.render.image_settings.file_format = "PNG"


def main():
    a = parse_args()
    mm = 0.001  # mm → m
    L, A, P, t = a.largura * mm, a.altura * mm, a.profundidade * mm, a.espessura * mm

    limpar_cena()
    mat = material_mdf("mdf", hex_to_rgb(a.cor))
    criar_caixa(L, A, P, t, mat)
    setup_camera_luz(L, A, P)
    setup_render(a.out)
    bpy.ops.render.render(write_still=True)
    print(f"[box_demo] render salvo em {a.out} "
          f"({a.largura:.0f}×{a.altura:.0f}×{a.profundidade:.0f}mm)")


if __name__ == "__main__":
    main()
