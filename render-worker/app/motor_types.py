"""
Fronteira de REUSO com o motor do app.

Estes tipos ESPELHAM o que o motor paramétrico (TypeScript) já produz e coloca
em `render3d_job.payload`. O worker NÃO recalcula geometria — ele só lê estes
dados (medidas, divisórias, chapa, puxador) e monta a cena 3D por cima.

Mantém só os campos que o render 3D precisa (não é o ModuloInstanciado inteiro).
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Peca:
    regra_nome: str          # 'lateral', 'divisoria', 'teto', 'base', 'fundo', 'porta_dobradica', ...
    largura_mm: float
    comprimento_mm: float
    espessura_mm: float
    quantidade: int = 1
    etiqueta: str = ""


@dataclass
class Modulo:
    """Espelho reduzido de ModuloInstanciado (o motor já dimensionou tudo)."""
    id: str
    modulo_template_codigo: str   # casa com modulo_asset_map.modulo_template_codigo
    nome_display: str
    largura_cm: float
    altura_cm: float
    profundidade_cm: float
    parede: str
    posicao_x_cm: float
    posicao_y_cm: float
    num_portas: int = 0
    num_gavetas: int = 0
    tipo_porta: str = "dobradica"
    pecas: list[Peca] = field(default_factory=list)

    @staticmethod
    def from_dict(d: dict[str, Any]) -> "Modulo":
        cfg = d.get("configuracao", {}) or {}
        return Modulo(
            id=d.get("id", ""),
            modulo_template_codigo=d.get("modulo_template_codigo", ""),
            nome_display=d.get("nome_display", ""),
            largura_cm=float(d.get("largura_cm", 0)),
            altura_cm=float(d.get("altura_cm", 0)),
            profundidade_cm=float(d.get("profundidade_cm", 0)),
            parede=d.get("parede", "top"),
            posicao_x_cm=float(d.get("posicao_x_cm", 0)),
            posicao_y_cm=float(d.get("posicao_y_cm", 0)),
            num_portas=int(cfg.get("num_portas", 0)),
            num_gavetas=int(cfg.get("num_gavetas", 0)),
            tipo_porta=cfg.get("tipo_porta", "dobradica"),
            pecas=[
                Peca(
                    regra_nome=p.get("regra_nome", ""),
                    largura_mm=float(p.get("largura_mm", 0)),
                    comprimento_mm=float(p.get("comprimento_mm", 0)),
                    espessura_mm=float(p.get("espessura_mm", 15)),
                    quantidade=int(p.get("quantidade", 1)),
                    etiqueta=p.get("etiqueta_producao", ""),
                )
                for p in d.get("pecas", []) or []
            ],
        )


@dataclass
class RenderPayload:
    modulos: list[Modulo]
    chapa_codigo: str = ""
    puxador_codigo: str = ""
    ambiente: str = "Cozinha"
    medidas: dict[str, float] = field(default_factory=dict)  # largura/profundidade/altura (m)
    camera: str = "geral"

    @staticmethod
    def from_dict(d: dict[str, Any]) -> "RenderPayload":
        return RenderPayload(
            modulos=[Modulo.from_dict(m) for m in d.get("modulos", []) or []],
            chapa_codigo=d.get("chapa_codigo", ""),
            puxador_codigo=d.get("puxador_codigo", ""),
            ambiente=d.get("ambiente", "Cozinha"),
            medidas=d.get("medidas", {}) or {},
            camera=d.get("camera", "geral"),
        )
