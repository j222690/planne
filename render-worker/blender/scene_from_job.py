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
MODELS = os.path.join(ASSETS, "models")   # eletros reais (BlenderKit, .blend)


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
    # (rodapé é contínuo — desenhado em detalhes_promob, não por módulo)

    # TORRE de embutir: portas embaixo, FORNO (vidro preto) + nicho do MICRO,
    # portas em cima (o micro-ondas real é inserido em eletros_reais).
    if cfg.get("tem_forno") and not aereo:
        # armário de baixo
        box("tp_base", cx, y_fr, z0 + 0.35, L - 0.006, T, 0.70 - 0.006, mats["porta"])
        _puxador_h(cx, y_fr, z0 + 0.70 - 0.03, L * 0.5, mats["pux"])
        # forno — vidro preto recuado + painel inox + puxador
        fz0, fh = z0 + 0.72, 0.58
        box("forno_vidro", cx, y_fr + T * 0.4, fz0 + fh / 2, L - 0.08, T * 0.6, fh - 0.02, mats["boca"])
        box("forno_painel", cx, y_fr, fz0 + fh - 0.05, L - 0.06, T, 0.06, mats["eletro"])
        box("forno_pux", cx, y_fr - T * 0.7, fz0 + fh - 0.10, L * 0.6, 0.02, 0.016, mats["pux"], bevel=False)
        # nicho do micro (fundo escuro)
        mz0, mh = z0 + 1.34, 0.40
        box("micro_fundo", cx, -T / 2, mz0 + mh / 2, L - 0.03, T, mh, mats["eletro"])
        # portas de cima (fecha o topo aberto)
        if A - 1.76 > 0.1:
            box("tp_topo", cx, y_fr, z0 + 1.76 + (A - 1.76) / 2, L - 0.006, T, (A - 1.76) - 0.006, mats["porta"])
            _puxador_h(cx, y_fr, z0 + 1.76 + 0.03, L * 0.5, mats["pux"])
        return

    # gavetas (faixa embaixo) + portas (acima)
    zona_gav = min(A, gavetas * 0.16) if gavetas and portas else (A if gavetas else 0)
    if gavetas:
        gh = zona_gav / gavetas
        for i in range(gavetas):
            gz = z0 + i * gh + gh / 2
            box(f"gav{i}", cx, y_fr, gz, L - 0.006, T, gh - 0.006, mats["porta"])
            # puxador perfil horizontal na borda superior da gaveta
            _puxador_h(cx, y_fr, gz + gh / 2 - 0.02, min(L * 0.6, L - 0.08), mats["pux"])
    if portas:
        pz0, ph, pw = z0 + zona_gav, A - zona_gav, L / portas
        for d in range(portas):
            px = x0 + (d + 0.5) * pw
            box(f"porta{d}", px, y_fr, pz0 + ph / 2, pw - 0.006, T, ph - 0.006, mats["porta"])
            # aéreo: perfil na borda INFERIOR; base: na borda SUPERIOR (puxador cava/perfil)
            puxz = (pz0 + 0.03) if aereo else (pz0 + ph - 0.03)
            _puxador_h(px, y_fr, puxz, pw * 0.55, mats["pux"])


def _puxador_h(cx, y_fr, z, largura, mat):
    """Puxador perfil de alumínio: barra fina HORIZONTAL, rente à frente."""
    box("pux", cx, y_fr - T * 0.55, z, max(0.06, largura), 0.02, 0.014, mat, bevel=False)


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
    # tampo com OVERHANG frontal (~30mm) e saia aparente (engrosso) — granito
    ov = 0.03
    box("bancada", cx, -(P + ov) / 2, z_banc, (x1 - x0), P + ov, BANC_ESP, mats["banc"])
    box("banc_saia", cx, -(P + ov) + 0.008, z_banc - BANC_ESP / 2 - 0.014,
        (x1 - x0), 0.016, 0.03, mats["banc"], bevel=False)
    # frontão / backsplash entre a bancada e os aéreos
    z_bs0, z_bs1 = topo + BANC_ESP, PISO_AEREO
    if z_bs1 > z_bs0 + 0.05:
        box("backsplash", cx, 0.05, (z_bs0 + z_bs1) / 2, (x1 - x0), 0.02, z_bs1 - z_bs0, mats["backsplash"], bevel=False)
    # cooktop e cuba REAIS são inseridos em eletros_reais (BlenderKit)


def detalhes_promob(modulos, mats):
    """Toques que aproximam do Promob: rodapé preto CONTÍNUO recuado + LED
    quente sob os aéreos."""
    bases = [m for m in modulos if m.get("posicao_y_cm", 0) < 100]
    aereos = [m for m in modulos if m.get("posicao_y_cm", 0) >= 100]
    if bases:
        x0 = min(m["posicao_x_cm"] / 100.0 for m in bases)
        x1 = max(m["posicao_x_cm"] / 100.0 + m["largura_cm"] / 100.0 for m in bases)
        P = max(m["profundidade_cm"] / 100.0 for m in bases)
        box("rodape", (x0 + x1) / 2, -(P - 0.06), RODAPE / 2,
            x1 - x0, 0.02, RODAPE, mats["rodape"], bevel=False)
    if aereos:
        ax0 = min(m["posicao_x_cm"] / 100.0 for m in aereos)
        ax1 = max(m["posicao_x_cm"] / 100.0 + m["largura_cm"] / 100.0 for m in aereos)
        ap = max(m["profundidade_cm"] / 100.0 for m in aereos)
        led = bpy.data.materials.new("led"); led.use_nodes = True
        lb = led.node_tree.nodes.get("Principled BSDF")
        lb.inputs["Emission Color"].default_value = (1.0, 0.86, 0.62, 1)
        lb.inputs["Emission Strength"].default_value = 7.0
        box("led", (ax0 + ax1) / 2, -ap + 0.02, PISO_AEREO - 0.008,
            (ax1 - ax0) - 0.06, ap * 0.55, 0.006, led, bevel=False)


def _bbox(objs):
    from mathutils import Vector
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            wc = o.matrix_world @ Vector(c)
            for i in range(3):
                mn[i] = min(mn[i], wc[i]); mx[i] = max(mx[i], wc[i])
    return mn, mx


def _importar(caminho, rot=(0, 0, 0), ignorar=("boolean",)):
    if not os.path.exists(caminho):
        print(f"[asset] não achei {caminho}"); return None, []
    with bpy.data.libraries.load(caminho, link=False) as (src, dst):
        dst.objects = list(src.objects)
    # descarta cortadores/booleans que não são p/ renderizar (ex.: "Sink Boolean")
    objs = []
    for o in dst.objects:
        if o is None:
            continue
        if any(t in o.name.lower() for t in ignorar):
            bpy.data.objects.remove(o, do_unlink=True); continue
        objs.append(o)
    if not objs:
        return None, []
    root = bpy.data.objects.new("asset_root", None)
    bpy.context.collection.objects.link(root)
    for o in objs:
        bpy.context.collection.objects.link(o)
        if o.parent is None:
            o.parent = root
    root.rotation_euler = rot
    bpy.context.view_layer.update()
    return root, objs


def colocar_asset(caminho, cx, alvo, eixo="alt", rot=(0, 0, 0),
                  z_base=None, z_centro=None, y_fundo=None, y_frente=None, y_centro=None):
    """Importa, escala por um eixo (larg/prof/alt) e ancora nas referências dadas."""
    root, objs = _importar(caminho, rot)
    if not root:
        return None
    mn, mx = _bbox(objs)
    idx = {"larg": 0, "prof": 1, "alt": 2}[eixo]
    dim = (mx - mn)[idx]
    root.scale = [alvo / max(dim, 1e-4)] * 3
    bpy.context.view_layer.update()
    mn, mx = _bbox(objs)
    root.location.x += cx - (mn.x + mx.x) / 2
    if z_base is not None:
        root.location.z += z_base - mn.z
    if z_centro is not None:
        root.location.z += z_centro - (mn.z + mx.z) / 2
    if y_fundo is not None:
        root.location.y += y_fundo - mx.y
    if y_frente is not None:
        root.location.y += y_frente - mn.y
    if y_centro is not None:
        root.location.y += y_centro - (mn.y + mx.y) / 2
    bpy.context.view_layer.update()
    return root, objs


def eletros_reais(modulos, mats):
    """Encaixa eletros realistas (BlenderKit) + a TORRE DA GELADEIRA:
    geladeira, cooktop EMBUTIDO, coifa e micro-ondas embutido na torre."""
    bases = [m for m in modulos if m.get("posicao_y_cm", 0) < 100]
    if not bases:
        return None
    aereos = [m for m in modulos if m.get("posicao_y_cm", 0) >= 100]
    atop = PISO_AEREO + max((m["altura_cm"] / 100.0 for m in aereos), default=0.70)
    x1 = max(m["posicao_x_cm"] / 100.0 + m["largura_cm"] / 100.0 for m in bases)

    # GELADEIRA + TORRE DA GELADEIRA (laterais de acabamento + aéreo por cima)
    gx = x1 + 0.55
    groot, gobjs = colocar_asset(os.path.join(MODELS, "geladeira.blend"), cx=gx, alvo=1.85,
                                 eixo="alt", z_base=0.0, y_fundo=-0.02)
    borda_dir = gx + 0.40
    if gobjs:
        mn, mx = _bbox(gobjs)
        cxg = (mn.x + mx.x) / 2
        prof = mx.y - mn.y
        lat = 0.018
        for xx in (mn.x - lat / 2, mx.x + lat / 2):   # laterais chão->topo da torre
            box("torre_ger_lat", xx, (mn.y + mx.y) / 2, atop / 2, lat, prof, atop, mats["corpo"])
        az0 = mx.z + 0.04                              # aéreo sobre a geladeira
        if atop - az0 > 0.12:
            depA, largA = 0.35, (mx.x - mn.x) + 2 * lat
            box("torre_ger_base", cxg, -depA / 2, az0, largA, depA, T, mats["corpo"])
            box("torre_ger_teto", cxg, -depA / 2, atop - T / 2, largA, depA, T, mats["corpo"])
            box("torre_ger_porta", cxg, -depA - T / 2, (az0 + atop) / 2,
                largA - 0.006, T, (atop - az0) - T - 0.006, mats["porta"])
            _puxador_h(cxg, -depA - T / 2, az0 + 0.05, largA * 0.5, mats["pux"])
        borda_dir = mx.x + lat + 0.08

    # COOKTOP EMBUTIDO + COIFA — no módulo marcado com recorte de cooktop
    ck = next((m for m in bases if (m.get("configuracao", {}) or {}).get("tem_recorte_cooktop")), None)
    if ck:
        mx = ck["posicao_x_cm"] / 100.0 + ck["largura_cm"] / 200.0
        P = ck["profundidade_cm"] / 100.0
        A = ck["altura_cm"] / 100.0
        z_topo = RODAPE + A + BANC_ESP
        # embutido: rebaixa o corpo p/ dentro do tampo; só o vidro fica rente
        colocar_asset(os.path.join(MODELS, "cooktop.blend"), cx=mx, alvo=0.56, eixo="larg",
                      z_base=z_topo - 0.09, y_centro=-P * 0.55)
        # coifa: sobe o duto (gira 90° em X) e pendura acima do cooktop
        colocar_asset(os.path.join(MODELS, "coifa.blend"), cx=mx, alvo=0.60, eixo="larg",
                      rot=(1.5708, 0, 0), z_base=PISO_AEREO - 0.02, y_fundo=-0.05)

    # CUBA + TORNEIRA reais — embutida no tampo do módulo marcado
    cb = next((m for m in bases if (m.get("configuracao", {}) or {}).get("tem_recorte_cuba")), None)
    if cb:
        mxc = cb["posicao_x_cm"] / 100.0 + cb["largura_cm"] / 200.0
        Pc = cb["profundidade_cm"] / 100.0
        Ac = cb["altura_cm"] / 100.0
        z_topo = RODAPE + Ac + BANC_ESP
        # aro rente ao tampo, bojo p/ baixo, torneira p/ cima (alvo=0.70 → ~0.285 do fundo ao aro)
        colocar_asset(os.path.join(MODELS, "cuba.blend"), cx=mxc, alvo=0.70, eixo="larg",
                      z_base=z_topo - 0.285, y_centro=-Pc * 0.5)

    # MICRO — embutido na torre (recorte na frente do módulo tem_forno)
    torre = next((m for m in bases if (m.get("configuracao", {}) or {}).get("tem_forno")), None)
    if torre:
        tx = torre["posicao_x_cm"] / 100.0 + torre["largura_cm"] / 200.0
        tL = torre["largura_cm"] / 100.0
        tP = torre["profundidade_cm"] / 100.0
        colocar_asset(os.path.join(MODELS, "micro.blend"), cx=tx, alvo=tL - 0.12, eixo="larg",
                      z_centro=RODAPE + 1.53, y_frente=-tP + 0.02)

    return borda_dir


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
    alvo.location = (cx, -D * 0.28, max_z * 0.5)
    bpy.context.collection.objects.link(alvo)
    cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 35
    cam = bpy.data.objects.new("cam", cam_d)
    # Vista 3/4: câmera deslocada p/ o lado (perspectiva, como no Promob)
    dist = D + W * 0.30 + 0.45
    cam.location = (cx - W * 0.34, -dist * 0.92, max_z * 0.55 + 0.15)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target, trk.track_axis, trk.up_axis = alvo, "TRACK_NEGATIVE_Z", "UP_Y"
    # profundidade de campo suave (foco no móvel)
    try:
        cam_d.dof.use_dof = True
        cam_d.dof.focus_object = alvo
        cam_d.dof.aperture_fstop = 5.6
    except Exception:
        pass
    # Iluminação: softbox quente (key) + preenchimento frio; o HDRI dá o ambiente.
    key = bpy.data.lights.new("key", type="AREA"); key.energy = 500; key.size = 6
    key.color = (1.0, 0.93, 0.82)  # luz quente (2900K aprox.)
    ko = bpy.data.objects.new("key", key)
    ko.location = (cx - W * 0.2, -D * 0.5, H - 0.05); ko.rotation_euler = (0.5, 0, 0)
    bpy.context.collection.objects.link(ko)
    fill = bpy.data.lights.new("fill", type="AREA"); fill.energy = 150; fill.size = 9
    fill.color = (1.0, 0.97, 0.92)  # preenchimento neutro-quente (menos "CG frio")
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
        bg.inputs["Strength"].default_value = 0.85
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
    t_azu = tex_set("azulejo", "Tiles107")
    branco = hex_rgb(job.get("chapa_hex"))
    mats = {
        "corpo": mat_pbr("chapa", branco, 0.45, texset=t_mad, use_color=False, escala=1.2, nrm_forca=0.30),
        "porta": mat_pbr("porta", branco, 0.40, texset=t_mad, use_color=False, escala=1.2, nrm_forca=0.30),
        "banc": mat_pbr("bancada", hex_rgb(job.get("bancada_hex"), "2b2b2e"), 0.12, 0.0,
                        texset=t_ban, use_color=False, escala=0.5, nrm_forca=0.35),
        "pux": mat_pbr("puxador", (0.72, 0.73, 0.75, 1), 0.28, 0.9),
        "eletro": mat_pbr("eletro", (0.09, 0.09, 0.10, 1), 0.22, 0.6),
        "boca": mat_pbr("boca", (0.05, 0.05, 0.06, 1), 0.15, 0.3),
        "rodape": mat_pbr("rodape", (0.03, 0.03, 0.035, 1), 0.45),
        "backsplash": mat_pbr("backsplash", (1, 1, 1, 1), 0.2, texset=t_azu,
                              use_color=True, escala=1.6, nrm_forca=0.8),
        "parede": mat_pbr("parede", (0.90, 0.89, 0.86, 1), 0.9),
        "piso": mat_pbr("piso", (1, 1, 1, 1), 0.5, texset=t_pis, escala=0.45, nrm_forca=0.8),
    }

    for m in modulos:
        montar_modulo(m, mats)
    bancada_e_cooktops(modulos, mats)
    detalhes_promob(modulos, mats)
    x_dir_eletro = eletros_reais(modulos, mats)

    min_x = min(m.get("posicao_x_cm", 0) / 100.0 for m in modulos)
    max_x = max(m.get("posicao_x_cm", 0) / 100.0 + m["largura_cm"] / 100.0 for m in modulos)
    if x_dir_eletro:
        max_x = max(max_x, x_dir_eletro)
    max_z = max((PISO_AEREO if m.get("posicao_y_cm", 0) >= 100 else 0) + m["altura_cm"] / 100.0 for m in modulos)
    max_p = max(m["profundidade_cm"] / 100.0 for m in modulos)
    cx, W, D, H = montar_comodo(job, min_x, max_x, max_z, max_p, mats)
    camera_luz(cx, W, D, H, max_z)
    setup_render(a.out, a.engine)
    bpy.ops.render.render(write_still=True)
    print(f"[scene] {len(modulos)} módulos → {a.out}")


if __name__ == "__main__":
    main()
