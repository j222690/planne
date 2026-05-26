-- ============================================================
-- Planne ERP — Catálogo de Materiais (Seed Limpo)
-- Chapecó/SC · 2025
-- ============================================================

-- 1. Desativar todos os materiais globais antigos (bagunçados)
UPDATE public.materiais SET ativo = false WHERE global = true;

-- 2. Inserir catálogo curado
-- Campos: nome, codigo, unidade, preco_custo, preco_venda, cor (hex), espessura_mm,
--         largura_mm, comprimento_mm, global, ativo, categoria_id

INSERT INTO public.materiais
  (nome, codigo, unidade, preco_custo, preco_venda, cor, espessura_mm, largura_mm, comprimento_mm, global, ativo)
VALUES

-- ──────────────────────────────────────────────
-- MDF 18mm (chapas padrão 2750×1830mm)
-- ──────────────────────────────────────────────
('MDF 18mm — Branco TX',       'MDF18-BRTX',  'chapa', 88.00, 138.00, '#F2EDE8', 18, 1830, 2750, true, true),
('MDF 18mm — Branco Polar',    'MDF18-BRPO',  'chapa', 92.00, 144.00, '#FAFAFA', 18, 1830, 2750, true, true),
('MDF 18mm — Preto TX',        'MDF18-PRTX',  'chapa',105.00, 164.00, '#2C2C2C', 18, 1830, 2750, true, true),
('MDF 18mm — Cinza Platina',   'MDF18-CZPL',  'chapa',105.00, 164.00, '#C4C0BB', 18, 1830, 2750, true, true),
('MDF 18mm — Cinza Concreto',  'MDF18-CZCN',  'chapa',105.00, 164.00, '#8A8780', 18, 1830, 2750, true, true),
('MDF 18mm — Palha TX',        'MDF18-PATX',  'chapa',105.00, 164.00, '#E8D4A8', 18, 1830, 2750, true, true),
('MDF 18mm — Creme',           'MDF18-CREM',  'chapa', 92.00, 144.00, '#F0E6D0', 18, 1830, 2750, true, true),
('MDF 18mm — Capuccino',       'MDF18-CAPU',  'chapa',108.00, 168.00, '#A07858', 18, 1830, 2750, true, true),
('MDF 18mm — Camurça',         'MDF18-CAMR',  'chapa',108.00, 168.00, '#C8A880', 18, 1830, 2750, true, true),
('MDF 18mm — Amendoa',         'MDF18-AMEN',  'chapa',108.00, 168.00, '#D4B896', 18, 1830, 2750, true, true),
('MDF 18mm — Freijó Natural',  'MDF18-FRNL',  'chapa',108.00, 168.00, '#C4A06A', 18, 1830, 2750, true, true),
('MDF 18mm — Freijó Grápia',   'MDF18-FRGR',  'chapa',108.00, 168.00, '#A07840', 18, 1830, 2750, true, true),
('MDF 18mm — Carvalho Mônaco', 'MDF18-CVMO',  'chapa',112.00, 174.00, '#8B6B3D', 18, 1830, 2750, true, true),
('MDF 18mm — Carvalho Nevada', 'MDF18-CVNE',  'chapa',112.00, 174.00, '#C4A882', 18, 1830, 2750, true, true),
('MDF 18mm — Nogal Thermian',  'MDF18-NOGT',  'chapa',112.00, 174.00, '#6B4A2A', 18, 1830, 2750, true, true),
('MDF 18mm — Wengué',          'MDF18-WENG',  'chapa',115.00, 178.00, '#3D2B1F', 18, 1830, 2750, true, true),
('MDF 18mm — Teca Natural',    'MDF18-TECN',  'chapa',112.00, 174.00, '#C09060', 18, 1830, 2750, true, true),
('MDF 18mm — Pinho Natural',   'MDF18-PINH',  'chapa', 96.00, 150.00, '#E0C890', 18, 1830, 2750, true, true),
('MDF 18mm — Cedro Natural',   'MDF18-CEDR',  'chapa',108.00, 168.00, '#C06840', 18, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- MDF 15mm
-- ──────────────────────────────────────────────
('MDF 15mm — Branco TX',       'MDF15-BRTX',  'chapa', 76.00, 120.00, '#F2EDE8', 15, 1830, 2750, true, true),
('MDF 15mm — Preto TX',        'MDF15-PRTX',  'chapa', 90.00, 142.00, '#2C2C2C', 15, 1830, 2750, true, true),
('MDF 15mm — Carvalho Mônaco', 'MDF15-CVMO',  'chapa', 96.00, 152.00, '#8B6B3D', 15, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- MDF 6mm (fundos e painéis traseiros)
-- ──────────────────────────────────────────────
('MDF 6mm — Branco TX (fundo)',  'MDF06-BRTX',  'chapa', 38.00,  60.00, '#F2EDE8',  6, 1830, 2750, true, true),
('MDF 6mm — Preto TX (fundo)',   'MDF06-PRTX',  'chapa', 44.00,  70.00, '#2C2C2C',  6, 1830, 2750, true, true),
('MDF 6mm — Natural (fundo)',    'MDF06-NATR',  'chapa', 36.00,  56.00, '#D4B896',  6, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- MDP 15mm (económico)
-- ──────────────────────────────────────────────
('MDP 15mm — Branco TX',       'MDP15-BRTX',  'chapa', 62.00,  97.00, '#F2EDE8', 15, 1830, 2750, true, true),
('MDP 15mm — Preto TX',        'MDP15-PRTX',  'chapa', 72.00, 112.00, '#2C2C2C', 15, 1830, 2750, true, true),
('MDP 15mm — Carvalho Mônaco', 'MDP15-CVMO',  'chapa', 78.00, 122.00, '#8B6B3D', 15, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- Dobradiças
-- ──────────────────────────────────────────────
('Dobradiça Caneco 35mm c/ amortecedor (Grass)',  'DOB-35-GRASS',  'par',  18.00,  32.00, '#C0C0C0', NULL, NULL, NULL, true, true),
('Dobradiça Caneco 35mm s/ amortecedor',          'DOB-35-SIMP',   'par',   8.00,  14.00, '#C0C0C0', NULL, NULL, NULL, true, true),
('Dobradiça Caneco 26mm p/ porta estreita',       'DOB-26-ETR',    'par',  10.00,  18.00, '#C0C0C0', NULL, NULL, NULL, true, true),
('Dobradiça Caneco 35mm p/ canto',                'DOB-35-CANT',   'par',  22.00,  38.00, '#C0C0C0', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Corrediças
-- ──────────────────────────────────────────────
('Corrediça Blum Tandem 400mm',  'CORR-BL-400', 'par',  52.00,  88.00, '#A0A0A0', NULL, NULL, NULL, true, true),
('Corrediça Blum Tandem 450mm',  'CORR-BL-450', 'par',  55.00,  92.00, '#A0A0A0', NULL, NULL, NULL, true, true),
('Corrediça Blum Tandem 500mm',  'CORR-BL-500', 'par',  58.00,  96.00, '#A0A0A0', NULL, NULL, NULL, true, true),
('Corrediça Blum Tandem 550mm',  'CORR-BL-550', 'par',  62.00, 102.00, '#A0A0A0', NULL, NULL, NULL, true, true),
('Corrediça Telescópica 350mm (simples)',  'CORR-TEL-350', 'par',  12.00,  20.00, '#A0A0A0', NULL, NULL, NULL, true, true),
('Corrediça Telescópica 450mm (simples)',  'CORR-TEL-450', 'par',  14.00,  22.00, '#A0A0A0', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores
-- ──────────────────────────────────────────────
('Puxador Perfil Alumínio 96mm — Prata',      'PUX-PERF-96-PT',  'peça',  5.50,   9.00, '#C8C8C8', NULL, NULL, NULL, true, true),
('Puxador Perfil Alumínio 128mm — Prata',     'PUX-PERF-128-PT', 'peça',  6.50,  10.50, '#C8C8C8', NULL, NULL, NULL, true, true),
('Puxador Perfil Alumínio 160mm — Prata',     'PUX-PERF-160-PT', 'peça',  7.50,  12.00, '#C8C8C8', NULL, NULL, NULL, true, true),
('Puxador Perfil Alumínio 320mm — Prata',     'PUX-PERF-320-PT', 'peça', 12.00,  19.00, '#C8C8C8', NULL, NULL, NULL, true, true),
('Puxador Barra Inox 128mm',                  'PUX-BARR-128-IX', 'peça',  8.00,  14.00, '#A8A8A8', NULL, NULL, NULL, true, true),
('Puxador Barra Inox 160mm',                  'PUX-BARR-160-IX', 'peça',  9.50,  16.00, '#A8A8A8', NULL, NULL, NULL, true, true),
('Puxador Concha Embutida — Branca',          'PUX-CONCH-BR',    'peça',  4.50,   7.50, '#FAFAFA', NULL, NULL, NULL, true, true),
('Puxador Zamak Moderno 128mm — Preto',       'PUX-ZAM-128-PT',  'peça',  9.00,  15.00, '#2C2C2C', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Fita de Borda
-- ──────────────────────────────────────────────
('Fita de Borda 22mm — Branco TX',      'FITA-22-BRTX', 'm',  0.18,   0.32, '#F2EDE8', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Preto TX',       'FITA-22-PRTX', 'm',  0.22,   0.38, '#2C2C2C', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Carvalho Mônaco','FITA-22-CVMO', 'm',  0.24,   0.42, '#8B6B3D', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Cinza Platina',  'FITA-22-CZPL', 'm',  0.22,   0.38, '#C4C0BB', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Freijó Natural', 'FITA-22-FRNL', 'm',  0.22,   0.38, '#C4A06A', NULL, NULL, NULL, true, true),
('Fita de Borda 35mm — Branco TX',      'FITA-35-BRTX', 'm',  0.28,   0.48, '#F2EDE8', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Acessórios / Fixação
-- ──────────────────────────────────────────────
('Parafuso Confirmat 7×70mm',       'PARAF-CNF-770',  'peça',  0.12,   0.22, '#8C8C8C', NULL, NULL, NULL, true, true),
('Parafuso Confirmat 7×50mm',       'PARAF-CNF-750',  'peça',  0.10,   0.18, '#8C8C8C', NULL, NULL, NULL, true, true),
('Minifix Cavilha 15mm (par)',       'MFIX-15',        'par',   0.45,   0.80, '#C8B060', NULL, NULL, NULL, true, true),
('Cavilha Madeira 8×30mm',          'CAVIL-830',      'peça',  0.08,   0.15, '#D4B896', NULL, NULL, NULL, true, true),
('Cola Branca PVA 1kg',             'COLA-PVA-1KG',   'kg',   12.00,  20.00, '#F5F5F0', NULL, NULL, NULL, true, true),
('Fundo Nitrô Spray 400ml',         'FUND-NITR-400',  'peça',  18.00,  30.00, '#E8E8E0', NULL, NULL, NULL, true, true),
('Perfil de Alumínio p/ LED 2m',    'PERF-LED-2M',    'peça',  22.00,  36.00, '#C8C8C8', NULL, NULL, NULL, true, true),
('Fita LED 5050 RGB 5m',            'FITA-LED-5050',  'rolo',  45.00,  75.00, '#FFD700', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Mão de Obra / Serviços
-- ──────────────────────────────────────────────
('Mão de obra — Montagem',          'MO-MONT',   'hr',  45.00,  75.00, '#6366f1', NULL, NULL, NULL, true, true),
('Mão de obra — Instalação',        'MO-INST',   'hr',  50.00,  82.00, '#6366f1', NULL, NULL, NULL, true, true),
('Mão de obra — Acabamento/Lixagem','MO-ACAB',   'hr',  40.00,  66.00, '#6366f1', NULL, NULL, NULL, true, true),
('Projeto técnico / Desenho 2D',    'SERV-PROJ', 'hr',  80.00, 130.00, '#8b5cf6', NULL, NULL, NULL, true, true),
('Frete / Transporte local',        'SERV-FRET', 'vb',   120.00, 200.00, '#f59e0b', NULL, NULL, NULL, true, true);
