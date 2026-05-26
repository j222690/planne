-- ============================================================
-- Planne ERP — Expansão do Catálogo de Materiais (v2)
-- Preços referência Chapecó/SC · 2025
-- ============================================================

INSERT INTO public.materiais
  (nome, codigo, unidade, preco_custo, preco_venda, cor, espessura_mm, largura_mm, comprimento_mm, global, ativo)
VALUES

-- ──────────────────────────────────────────────
-- MDF 18mm — cores faltando (chapa 2750×1830mm)
-- ──────────────────────────────────────────────
('MDF 18mm — Branco Neve',          'MDF18-BRNV',  'chapa',  92.00, 145.00, '#F5F5F2', 18, 1830, 2750, true, true),
('MDF 18mm — Off White',            'MDF18-OFWH',  'chapa',  92.00, 145.00, '#F0EBE0', 18, 1830, 2750, true, true),
('MDF 18mm — Cinza Fossil',         'MDF18-CZFS',  'chapa', 105.00, 165.00, '#9B9792', 18, 1830, 2750, true, true),
('MDF 18mm — Cinza Urban',          'MDF18-CZUR',  'chapa', 108.00, 168.00, '#72706B', 18, 1830, 2750, true, true),
('MDF 18mm — Cinza Quartzo',        'MDF18-CZQU',  'chapa', 105.00, 165.00, '#B8B4AF', 18, 1830, 2750, true, true),
('MDF 18mm — Champagne',            'MDF18-CHAM',  'chapa', 105.00, 165.00, '#E8D8B8', 18, 1830, 2750, true, true),
('MDF 18mm — Carvalho Naturalle',   'MDF18-CVNA',  'chapa', 112.00, 175.00, '#C8A870', 18, 1830, 2750, true, true),
('MDF 18mm — Laricato Branco',      'MDF18-LRBR',  'chapa', 135.00, 210.00, '#E4DDD4', 18, 1830, 2750, true, true),
('MDF 18mm — Laricato Natural',     'MDF18-LRNA',  'chapa', 135.00, 210.00, '#C4A870', 18, 1830, 2750, true, true),
('MDF 18mm — Eucalipto',            'MDF18-EUCL',  'chapa', 110.00, 172.00, '#B8A080', 18, 1830, 2750, true, true),
('MDF 18mm — Jatoba',               'MDF18-JATO',  'chapa', 112.00, 175.00, '#8B4A2A', 18, 1830, 2750, true, true),
('MDF 18mm — Imbuia Natural',       'MDF18-IMBU',  'chapa', 112.00, 175.00, '#7A5A3A', 18, 1830, 2750, true, true),
('MDF 18mm — Siena',                'MDF18-SIEN',  'chapa', 108.00, 168.00, '#9B6A4A', 18, 1830, 2750, true, true),
('MDF 18mm — Rosa Milano',          'MDF18-ROSG',  'chapa', 115.00, 180.00, '#E8C0B0', 18, 1830, 2750, true, true),
('MDF 18mm — Verde Musgo',          'MDF18-VERD',  'chapa', 115.00, 180.00, '#5A6A4A', 18, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- MDF 15mm — completar paleta
-- ──────────────────────────────────────────────
('MDF 15mm — Branco Polar',         'MDF15-BRPO',  'chapa',  80.00, 126.00, '#FAFAFA', 15, 1830, 2750, true, true),
('MDF 15mm — Cinza Platina',        'MDF15-CZPL',  'chapa',  90.00, 142.00, '#C4C0BB', 15, 1830, 2750, true, true),
('MDF 15mm — Freijo Natural',       'MDF15-FRNL',  'chapa',  92.00, 146.00, '#C4A06A', 15, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- MDF 6mm (fundos) — completar
-- ──────────────────────────────────────────────
('MDF 6mm — Carvalho Monaco (fundo)', 'MDF06-CVMO', 'chapa', 42.00,  66.00, '#8B6B3D',  6, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- MDP 15mm — completar
-- ──────────────────────────────────────────────
('MDP 15mm — Branco Polar',         'MDP15-BRPO',  'chapa',  65.00, 102.00, '#FAFAFA', 15, 1830, 2750, true, true),
('MDP 15mm — Cinza Platina',        'MDP15-CZPL',  'chapa',  72.00, 112.00, '#C4C0BB', 15, 1830, 2750, true, true),

-- ──────────────────────────────────────────────
-- Fita de Borda 22mm — cores faltando
-- ──────────────────────────────────────────────
('Fita de Borda 22mm — Branco Polar',      'FITA-22-BRPO', 'm',  0.20,  0.36, '#FAFAFA', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Cinza Concreto',    'FITA-22-CZCN', 'm',  0.22,  0.38, '#8A8780', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Palha TX',          'FITA-22-PATX', 'm',  0.22,  0.38, '#E8D4A8', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Creme',             'FITA-22-CREM', 'm',  0.20,  0.36, '#F0E6D0', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Capuccino',         'FITA-22-CAPU', 'm',  0.24,  0.42, '#A07858', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Camurca',           'FITA-22-CAMR', 'm',  0.24,  0.42, '#C8A880', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Amendoa',           'FITA-22-AMEN', 'm',  0.24,  0.42, '#D4B896', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Wengue',            'FITA-22-WENG', 'm',  0.26,  0.46, '#3D2B1F', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Nogal Thermian',    'FITA-22-NOGT', 'm',  0.26,  0.46, '#6B4A2A', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Carvalho Nevada',   'FITA-22-CVNE', 'm',  0.24,  0.42, '#C4A882', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Teca Natural',      'FITA-22-TECN', 'm',  0.24,  0.42, '#C09060', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Pinho Natural',     'FITA-22-PINH', 'm',  0.22,  0.38, '#E0C890', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Cedro Natural',     'FITA-22-CEDR', 'm',  0.24,  0.42, '#C06840', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Laricato Natural',  'FITA-22-LRNA', 'm',  0.28,  0.50, '#C4A870', NULL, NULL, NULL, true, true),
('Fita de Borda 22mm — Carvalho Naturalle','FITA-22-CVNA', 'm',  0.24,  0.42, '#C8A870', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Fita de Borda 35mm — completar
-- ──────────────────────────────────────────────
('Fita de Borda 35mm — Preto TX',          'FITA-35-PRTX', 'm',  0.32,  0.56, '#2C2C2C', NULL, NULL, NULL, true, true),
('Fita de Borda 35mm — Carvalho Monaco',   'FITA-35-CVMO', 'm',  0.34,  0.60, '#8B6B3D', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores — linha preta matte (alta demanda)
-- ──────────────────────────────────────────────
('Puxador Perfil Aluminio 96mm — Preto Fosco',   'PUX-PERF-96-PR',  'peça',  6.50,  11.00, '#1A1A1A', NULL, NULL, NULL, true, true),
('Puxador Perfil Aluminio 128mm — Preto Fosco',  'PUX-PERF-128-PR', 'peça',  7.50,  12.50, '#1A1A1A', NULL, NULL, NULL, true, true),
('Puxador Perfil Aluminio 160mm — Preto Fosco',  'PUX-PERF-160-PR', 'peça',  9.00,  15.00, '#1A1A1A', NULL, NULL, NULL, true, true),
('Puxador Perfil Aluminio 320mm — Preto Fosco',  'PUX-PERF-320-PR', 'peça', 15.00,  25.00, '#1A1A1A', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores — linha champagne/dourado
-- ──────────────────────────────────────────────
('Puxador Perfil Aluminio 96mm — Champagne',     'PUX-PERF-96-CH',  'peça',  7.00,  11.50, '#D4B070', NULL, NULL, NULL, true, true),
('Puxador Perfil Aluminio 128mm — Champagne',    'PUX-PERF-128-CH', 'peça',  8.50,  14.00, '#D4B070', NULL, NULL, NULL, true, true),
('Puxador Perfil Aluminio 160mm — Champagne',    'PUX-PERF-160-CH', 'peça', 10.00,  16.50, '#D4B070', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores — barra inox tamanhos maiores
-- ──────────────────────────────────────────────
('Puxador Barra Inox 192mm',    'PUX-BARR-192-IX', 'peça', 12.00,  20.00, '#A8A8A8', NULL, NULL, NULL, true, true),
('Puxador Barra Inox 256mm',    'PUX-BARR-256-IX', 'peça', 15.00,  25.00, '#A8A8A8', NULL, NULL, NULL, true, true),
('Puxador Barra Inox 320mm',    'PUX-BARR-320-IX', 'peça', 18.00,  30.00, '#A8A8A8', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores — barra preta fosca
-- ──────────────────────────────────────────────
('Puxador Barra Fosca 128mm — Preto',  'PUX-BARR-128-PR', 'peça', 10.50,  17.50, '#1A1A1A', NULL, NULL, NULL, true, true),
('Puxador Barra Fosca 160mm — Preto',  'PUX-BARR-160-PR', 'peça', 13.00,  21.00, '#1A1A1A', NULL, NULL, NULL, true, true),
('Puxador Barra Fosca 192mm — Preto',  'PUX-BARR-192-PR', 'peça', 15.50,  25.00, '#1A1A1A', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores — concha embutida
-- ──────────────────────────────────────────────
('Puxador Concha Embutida — Preta',    'PUX-CONCH-PR',  'peça',  5.50,   9.00, '#1A1A1A', NULL, NULL, NULL, true, true),
('Puxador Concha Embutida — Inox',     'PUX-CONCH-IX',  'peça',  6.00,  10.00, '#A8A8A8', NULL, NULL, NULL, true, true),

-- ──────────────────────────────────────────────
-- Puxadores — zamak
-- ──────────────────────────────────────────────
('Puxador Zamak Cromado 128mm',          'PUX-ZAM-128-CR',  'peça', 10.00,  17.00, '#D0D0D0', NULL, NULL, NULL, true, true),
('Puxador Zamak Moderno 96mm — Preto',   'PUX-ZAM-96-PT',   'peça',  8.50,  14.00, '#2C2C2C', NULL, NULL, NULL, true, true),
('Puxador Zamak Moderno 160mm — Preto',  'PUX-ZAM-160-PT',  'peça', 12.00,  20.00, '#2C2C2C', NULL, NULL, NULL, true, true);
