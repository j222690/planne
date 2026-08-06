-- ============================================================
-- Planne — Estoque automatizado: movimentação + pedidos de compra
-- ============================================================
-- Histórico de movimentação de estoque (entrada/saída), auditável, e
-- pedidos de compra pro fornecedor (rascunho → enviado → recebido).
-- Receber um pedido atualiza materiais.estoque_atual + registra a
-- movimentação automaticamente (RPC atômica, evita estoque dessincronizado
-- se o client falhar no meio do fluxo).

-- 1. movimentacao_estoque ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movimentacao_estoque (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid        NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  material_id      uuid        NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo             text        NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade       numeric     NOT NULL CHECK (quantidade > 0),
  motivo           text,
  -- referencia_tipo: 'pedido_compra' | 'ordem_producao' | 'ajuste_manual'
  referencia_tipo  text,
  referencia_id    uuid,
  criado_por       uuid        REFERENCES auth.users(id),
  criado_em        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_movimentacao_estoque_material ON public.movimentacao_estoque(material_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacao_estoque_empresa ON public.movimentacao_estoque(empresa_id);

ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'movimentacao_estoque' AND policyname = 'sel_mov_estoque') THEN
    CREATE POLICY sel_mov_estoque ON public.movimentacao_estoque FOR SELECT USING (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'movimentacao_estoque' AND policyname = 'ins_mov_estoque') THEN
    CREATE POLICY ins_mov_estoque ON public.movimentacao_estoque FOR INSERT WITH CHECK (is_member(empresa_id));
  END IF;
END $$;

GRANT SELECT, INSERT ON public.movimentacao_estoque TO authenticated;

-- 2. pedido_compra -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedido_compra (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid        NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  fornecedor_id uuid        REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  numero        text,
  status        text        NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'recebido', 'cancelado')),
  observacoes   text,
  criado_por    uuid        REFERENCES auth.users(id),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  enviado_em    timestamptz,
  recebido_em   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_pedido_compra_empresa ON public.pedido_compra(empresa_id, status);

ALTER TABLE public.pedido_compra ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra' AND policyname = 'sel_pedido_compra') THEN
    CREATE POLICY sel_pedido_compra ON public.pedido_compra FOR SELECT USING (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra' AND policyname = 'ins_pedido_compra') THEN
    CREATE POLICY ins_pedido_compra ON public.pedido_compra FOR INSERT WITH CHECK (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra' AND policyname = 'upd_pedido_compra') THEN
    CREATE POLICY upd_pedido_compra ON public.pedido_compra FOR UPDATE USING (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra' AND policyname = 'del_pedido_compra') THEN
    CREATE POLICY del_pedido_compra ON public.pedido_compra FOR DELETE USING (is_member(empresa_id));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_compra TO authenticated;

-- 3. pedido_compra_item -------------------------------------------------------
-- Sem empresa_id direto (só via pedido_compra_id) — a policy verifica
-- membership pela empresa do pedido pai.
CREATE TABLE IF NOT EXISTS public.pedido_compra_item (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_compra_id      uuid    NOT NULL REFERENCES public.pedido_compra(id) ON DELETE CASCADE,
  material_id           uuid    NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  quantidade            numeric NOT NULL CHECK (quantidade > 0),
  preco_custo_unitario  numeric,
  recebido              boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_pedido_compra_item_pedido ON public.pedido_compra_item(pedido_compra_id);

ALTER TABLE public.pedido_compra_item ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra_item' AND policyname = 'sel_pedido_compra_item') THEN
    CREATE POLICY sel_pedido_compra_item ON public.pedido_compra_item FOR SELECT
      USING (is_member((SELECT empresa_id FROM public.pedido_compra WHERE id = pedido_compra_id)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra_item' AND policyname = 'ins_pedido_compra_item') THEN
    CREATE POLICY ins_pedido_compra_item ON public.pedido_compra_item FOR INSERT
      WITH CHECK (is_member((SELECT empresa_id FROM public.pedido_compra WHERE id = pedido_compra_id)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra_item' AND policyname = 'upd_pedido_compra_item') THEN
    CREATE POLICY upd_pedido_compra_item ON public.pedido_compra_item FOR UPDATE
      USING (is_member((SELECT empresa_id FROM public.pedido_compra WHERE id = pedido_compra_id)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pedido_compra_item' AND policyname = 'del_pedido_compra_item') THEN
    CREATE POLICY del_pedido_compra_item ON public.pedido_compra_item FOR DELETE
      USING (is_member((SELECT empresa_id FROM public.pedido_compra WHERE id = pedido_compra_id)));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_compra_item TO authenticated;

-- 4. RPC: registrar movimentação manual (ajuste avulso) ----------------------
-- Atômica: atualiza materiais.estoque_atual E insere o log numa transação só.
-- SECURITY DEFINER pra poder fazer os dois updates, mas com is_member()
-- checado explicitamente dentro da função (RLS não se aplica a SECURITY
-- DEFINER — sem esse check, qualquer autenticado poderia mexer em estoque
-- de outra empresa passando um material_id alheio).
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_estoque(
  p_material_id     uuid,
  p_tipo            text,
  p_quantidade      numeric,
  p_motivo          text DEFAULT NULL,
  p_referencia_tipo text DEFAULT NULL,
  p_referencia_id   uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM public.materiais WHERE id = p_material_id;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Material não encontrado';
  END IF;
  IF NOT is_member(v_empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para este material';
  END IF;
  IF p_tipo NOT IN ('entrada', 'saida') THEN
    RAISE EXCEPTION 'Tipo inválido: %', p_tipo;
  END IF;
  IF p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser positiva';
  END IF;

  UPDATE public.materiais
  SET estoque_atual = COALESCE(estoque_atual, 0) + (CASE WHEN p_tipo = 'entrada' THEN p_quantidade ELSE -p_quantidade END)
  WHERE id = p_material_id;

  INSERT INTO public.movimentacao_estoque
    (empresa_id, material_id, tipo, quantidade, motivo, referencia_tipo, referencia_id, criado_por)
  VALUES
    (v_empresa_id, p_material_id, p_tipo, p_quantidade, p_motivo, p_referencia_tipo, p_referencia_id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_estoque(uuid, text, numeric, text, text, uuid) TO authenticated;

-- 5. RPC: receber pedido de compra --------------------------------------------
-- Marca os itens ainda não recebidos como recebidos, soma a quantidade no
-- estoque de cada material, registra a movimentação (entrada) e fecha o
-- pedido — tudo numa transação (se algo falhar no meio, nada fica meio-feito).
CREATE OR REPLACE FUNCTION public.receber_pedido_compra(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM public.pedido_compra WHERE id = p_pedido_id;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Pedido de compra não encontrado';
  END IF;
  IF NOT is_member(v_empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para este pedido';
  END IF;

  UPDATE public.materiais m
  SET estoque_atual = COALESCE(m.estoque_atual, 0) + pci.quantidade
  FROM public.pedido_compra_item pci
  WHERE pci.pedido_compra_id = p_pedido_id
    AND pci.material_id = m.id
    AND pci.recebido = false;

  INSERT INTO public.movimentacao_estoque
    (empresa_id, material_id, tipo, quantidade, motivo, referencia_tipo, referencia_id, criado_por)
  SELECT v_empresa_id, pci.material_id, 'entrada', pci.quantidade,
         'Recebimento de pedido de compra', 'pedido_compra', p_pedido_id, auth.uid()
  FROM public.pedido_compra_item pci
  WHERE pci.pedido_compra_id = p_pedido_id AND pci.recebido = false;

  UPDATE public.pedido_compra_item SET recebido = true
  WHERE pedido_compra_id = p_pedido_id AND recebido = false;

  UPDATE public.pedido_compra SET status = 'recebido', recebido_em = now()
  WHERE id = p_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.receber_pedido_compra(uuid) TO authenticated;
