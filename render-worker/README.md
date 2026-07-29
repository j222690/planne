# Planne — Render Worker 3D (Blender/Eevee)

Motor de **render 3D paramétrico** (estilo Promob) que substitui a imagem por IA
generativa por uma cena montada a partir dos dados reais do projeto.

## Princípio: reusa o cérebro, adiciona o corpo

- **Cérebro (não duplicar):** o motor paramétrico do app (`src/lib/motor-parametrico`)
  já decide medidas, nº de portas/gavetas, divisórias, chapa e puxador, e gera
  `ModuloInstanciado[]`. O worker **consome** isso — não recalcula nada.
- **Corpo (o que é novo aqui):** o **catálogo de ativos 3D** (geometria-base,
  puxadores, texturas de chapa) + o **mapeamento** `tipo de módulo → ativos`, e o
  pipeline Blender que monta e renderiza a cena.

## Fluxo (com poll, sem webhook por enquanto)

```
App (Vercel)                         Worker (este serviço, ex.: Fly.io/Railway)
------------                         ------------------------------------------
1. cria render3d_job                 2. poll: pega job 'pending'
   payload = ModuloInstanciado[]        - monta a cena (motor → ativos)
   + chapa_codigo + puxador_codigo      - renderiza (Eevee, CPU)
   status = 'pending'                   - sobe PNG no Supabase Storage
3. app faz poll do job                  - status='completed', image_path=...
   até status='completed' → mostra
```

## MVP (fase 1)

- Só **cozinha**. Só 3 peças-base: **caixa**, **porta lisa**, **puxador**.
- Eevee em **CPU** (rápido pra validar). Cycles/GPU e mais peças vêm depois.
- Móvel fora do padrão → job marcado `error` com motivo → "revisão manual".

## Estrutura

```
render-worker/
  README.md              este arquivo
  schema.sql             tabelas do catálogo + fila (aplicar no Supabase)
  requirements.txt       deps Python (bpy vem com o Blender)
  app/
    config.py            env (Supabase, bucket, caminho do Blender)
    motor_types.py       espelho do ModuloInstanciado (fronteira de reuso)
    worker.py            loop da fila: poll → render → upload → completed
  blender/
    box_demo.py          ✅ ENTREGA 3: caixa parametrizada renderizada (validação)
  scripts/
    render_box.sh        atalho: blender --background --python box_demo.py
  assets/
    chapas/              texturas (.jpg/.png) — adicionar sem modelar nada
    puxadores/           modelos (.blend) — catálogo inicial 30-40
```

## Como validar a caixa AGORA (entrega 3)

Precisa do Blender instalado (4.x). Com o Blender no PATH:

```bash
blender --background --python blender/box_demo.py -- \
  --largura 800 --altura 720 --profundidade 550 --espessura 15 \
  --cor "#EDE7DA" --out ./caixa.png
```

Sai um `caixa.png` com um gabinete parametrizado nas medidas passadas. É a prova
de conceito antes de expandir pro catálogo inteiro.

## Deploy (fase seguinte)

Serviço separado (não é da Vercel). Um container com Blender headless + Python,
rodando `python -m app.worker` num loop. Variáveis em `.env` (ver `config.py`).
