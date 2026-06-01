import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_clientes",
      description: "Busca clientes/leads pelo nome, email, telefone ou cidade. Use antes de assumir que um cliente existe ou não.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Texto para buscar (nome, email, telefone ou cidade)" },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_orcamentos",
      description: "Lista orçamentos/contratos da empresa. Pode filtrar por status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["rascunho", "analise", "aprovado", "recusado"],
            description: "Filtrar por status (opcional)",
          },
          cliente_id: { type: "string", description: "ID do cliente para filtrar (opcional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resumo_financeiro",
      description: "Retorna o resumo financeiro do mês atual: receitas, despesas e saldo.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_projetos",
      description: "Lista projetos da empresa.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status: planejamento, em_andamento, concluido, cancelado" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_cliente",
      description: "Cria um novo cliente/lead. IMPORTANTE: só use quando tiver pelo menos o nome confirmado pelo usuário.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome completo ou razão social" },
          email: { type: "string", description: "Email" },
          telefone: { type: "string", description: "Telefone ou WhatsApp" },
          cidade: { type: "string", description: "Cidade" },
          origem: { type: "string", description: "Canal de origem: Indicação, Instagram, Google, Facebook, Direto, Arquiteto parceiro, Outro" },
          observacoes: { type: "string", description: "Observações adicionais" },
        },
        required: ["nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_orcamento",
      description: "Cria um orçamento básico para um cliente com lista de móveis. Use quando o usuário pedir para criar um orçamento e fornecer os dados necessários.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente (será buscado pelo nome)" },
          descricao: { type: "string", description: "Descrição do projeto" },
          ambiente: { type: "string", description: "Ambiente principal: Cozinha, Sala, Quarto, Escritório, etc." },
          moveis_lista: { type: "array", items: { type: "string" }, description: "Lista de móveis solicitados, ex: ['Roupeiro 2m', 'Guarda-roupa com espelho']" },
        },
        required: ["cliente_nome", "moveis_lista"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "atualizar_status_orcamento",
      description: "Atualiza o status de um orçamento existente. Use para mover de rascunho → análise → aprovado, ou para recusar.",
      parameters: {
        type: "object",
        properties: {
          orcamento_id: { type: "string", description: "ID do orçamento (obtenha via listar_orcamentos)" },
          novo_status: { type: "string", enum: ["rascunho", "analise", "aprovado", "recusado"], description: "Novo status do orçamento" },
        },
        required: ["orcamento_id", "novo_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_orcamento_detalhes",
      description: "Busca os detalhes completos de um orçamento específico, incluindo itens, valores e cliente.",
      parameters: {
        type: "object",
        properties: {
          orcamento_id: { type: "string", description: "ID do orçamento" },
        },
        required: ["orcamento_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_projeto",
      description: "Cria um novo projeto de marcenaria vinculado a um cliente. Use quando o usuário pedir para criar um projeto.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do projeto" },
          cliente_nome: { type: "string", description: "Nome do cliente (será buscado)" },
          descricao: { type: "string", description: "Descrição do projeto" },
          status: { type: "string", enum: ["briefing", "projeto", "aprovacao", "producao"], description: "Status inicial (padrão: briefing)" },
        },
        required: ["nome"],
      },
    },
  },
];

type SupabaseClient = ReturnType<typeof createClient>;

async function estimarPrecos(
  moveis: string[],
  contexto: string,
  groqKey: string,
): Promise<{ descricao: string; preco_custo: number; preco_venda: number }[]> {
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Você é especialista em precificação de marcenaria planejada no Brasil (2025). Responda APENAS com JSON válido, sem texto fora do JSON.",
          },
          {
            role: "user",
            content: `Estime o preço de custo e preço de venda ao cliente de cada item abaixo. Contexto: ${contexto || "projeto de marcenaria planejada"}.

Itens:
${moveis.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Responda exatamente neste formato JSON (array, sem texto extra):
[{"descricao":"nome do item","preco_custo":0,"preco_venda":0}]

Referência de mercado 2025: MDF R$85/chapa, mão de obra 40% do MDF, margem típica 2.5x a 3x o custo.`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      }),
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content ?? "[]";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as { descricao: string; preco_custo: number; preco_venda: number }[];
  } catch {
    return [];
  }
}

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  empresaId: string,
  groqKey: string,
): Promise<unknown> {
  switch (name) {
    case "buscar_clientes": {
      const q = String(args.q ?? "").toLowerCase();
      const { data, error } = await supabase
        .from("clientes")
        .select("id,nome,email,telefone,cidade,origem,created_at")
        .eq("empresa_id", empresaId)
        .or(`nome.ilike.%${q}%,email.ilike.%${q}%,telefone.ilike.%${q}%,cidade.ilike.%${q}%`)
        .order("nome")
        .limit(10);
      if (error) return { erro: error.message };
      return { clientes: data ?? [], total: (data ?? []).length };
    }
    case "listar_orcamentos": {
      let query = supabase
        .from("orcamentos")
        .select("id,numero,status,total,created_at,clientes(nome)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (args.status) query = query.eq("status", args.status as string);
      if (args.cliente_id) query = query.eq("cliente_id", args.cliente_id as string);
      const { data, error } = await query;
      if (error) return { erro: error.message };
      return { orcamentos: data ?? [], total: (data ?? []).length };
    }
    case "resumo_financeiro": {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from("financeiro")
        .select("tipo,valor,status,descricao")
        .eq("empresa_id", empresaId)
        .gte("created_at", inicioMes);
      if (error) return { erro: error.message };
      const rows = data ?? [];
      const receitas = rows.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
      const despesas = rows.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
      return {
        mes: hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        receitas,
        despesas,
        saldo: receitas - despesas,
        total_lancamentos: rows.length,
      };
    }
    case "listar_projetos": {
      let query = supabase
        .from("projetos")
        .select("id,nome,status,created_at,clientes(nome)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (args.status) query = query.eq("status", args.status as string);
      const { data, error } = await query;
      if (error) return { erro: error.message };
      return { projetos: data ?? [], total: (data ?? []).length };
    }
    case "criar_cliente": {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          empresa_id: empresaId,
          created_by: userData?.user?.id,
          nome: args.nome,
          email: args.email ?? null,
          telefone: args.telefone ?? null,
          cidade: args.cidade ?? null,
          origem: args.origem ?? null,
          observacoes: args.observacoes ?? null,
        })
        .select("id,nome,email,telefone,cidade")
        .single();
      if (error) return { erro: error.message };
      return { sucesso: true, cliente: data };
    }
    case "criar_orcamento": {
      const { data: clientes } = await supabase
        .from("clientes")
        .select("id,nome")
        .eq("empresa_id", empresaId)
        .ilike("nome", `%${String(args.cliente_nome ?? "")}%`)
        .limit(1);
      const cliente = clientes?.[0];
      if (!cliente) return { erro: `Cliente "${args.cliente_nome}" não encontrado. Crie o cliente primeiro com criar_cliente.` };

      const { count } = await supabase.from("orcamentos").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId);
      const numero = `ORC-${String((count ?? 0) + 1).padStart(4, "0")}`;

      // Estimar preços com IA antes de criar os itens
      const moveis = args.moveis_lista as string[];
      const contexto = [args.ambiente, args.descricao].filter(Boolean).join(" — ");
      const precos = await estimarPrecos(moveis, contexto, groqKey);

      let subtotal = 0;
      const itensComPreco = moveis.map((m, i) => {
        const p = precos.find((r) => r.descricao?.toLowerCase().includes(m.toLowerCase().slice(0, 10))) ?? precos[i];
        const custoPecaCalc = p?.preco_custo ?? 0;
        const vendaPecaCalc = p?.preco_venda ?? 0;
        subtotal += custoPecaCalc;
        return {
          descricao: m,
          quantidade: 1,
          unidade: "un",
          preco_custo: custoPecaCalc,
          preco_unitario: vendaPecaCalc,
          total: vendaPecaCalc,
        };
      });

      const { data: orc, error: orcErr } = await supabase
        .from("orcamentos")
        .insert({
          empresa_id: empresaId,
          cliente_id: cliente.id,
          numero,
          status: "rascunho",
          total: itensComPreco.reduce((s, i) => s + i.total, 0),
          subtotal,
          margem_pct: 300,
          observacoes: args.descricao ? String(args.descricao) : `Projeto: ${moveis.join(", ")}`,
        })
        .select("id,numero")
        .single();
      if (orcErr) return { erro: orcErr.message };

      await supabase.from("orcamento_itens").insert(
        itensComPreco.map((i) => ({ ...i, orcamento_id: orc.id }))
      );

      return {
        sucesso: true,
        numero: orc.numero,
        cliente: cliente.nome,
        ambiente: args.ambiente ?? "Não especificado",
        moveis: moveis.length,
        total: itensComPreco.reduce((s, i) => s + i.total, 0),
        mensagem: `Orçamento ${orc.numero} criado para ${cliente.nome} com ${moveis.length} item(ns) e valores estimados pela IA. Total: R$ ${itensComPreco.reduce((s, i) => s + i.total, 0).toLocaleString("pt-BR")}. Acesse Orçamentos para revisar e ajustar.`,
      };
    }
    case "atualizar_status_orcamento": {
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: String(args.novo_status) })
        .eq("id", String(args.orcamento_id))
        .eq("empresa_id", empresaId);
      if (error) return { erro: error.message };
      return { sucesso: true, mensagem: `Status do orçamento atualizado para "${args.novo_status}".` };
    }
    case "buscar_orcamento_detalhes": {
      const { data: orc, error } = await supabase
        .from("orcamentos")
        .select("id,numero,status,total,subtotal,margem_pct,observacoes,created_at,clientes(nome,email,telefone),orcamento_itens(descricao,quantidade,preco_custo,preco_unitario,total)")
        .eq("id", String(args.orcamento_id))
        .eq("empresa_id", empresaId)
        .single();
      if (error) return { erro: error.message };
      if (!orc) return { erro: "Orçamento não encontrado." };
      return orc;
    }
    case "criar_projeto": {
      let clienteId: string | null = null;
      if (args.cliente_nome) {
        const { data: cls } = await supabase
          .from("clientes")
          .select("id,nome")
          .eq("empresa_id", empresaId)
          .ilike("nome", `%${String(args.cliente_nome)}%`)
          .limit(1);
        clienteId = cls?.[0]?.id ?? null;
        if (!clienteId) return { erro: `Cliente "${args.cliente_nome}" não encontrado. Crie o cliente primeiro.` };
      }
      const { data: projeto, error } = await supabase
        .from("projetos")
        .insert({
          empresa_id: empresaId,
          nome: args.nome,
          descricao: args.descricao ?? null,
          status: args.status ?? "briefing",
          cliente_id: clienteId,
        })
        .select("id,nome,status")
        .single();
      if (error) return { erro: error.message };
      return { sucesso: true, projeto, mensagem: `Projeto "${args.nome}" criado com status "${args.status ?? "briefing"}".` };
    }
    default:
      return { erro: `Ferramenta desconhecida: ${name}` };
  }
}

const SYSTEM = `Você é o Grat, assistente IA do Planne — sistema de gestão para marcenarias planejadas.
Você tem acesso a ferramentas para consultar e manipular dados reais do sistema.

REGRAS IMPORTANTES:
- NUNCA execute ações (criar, modificar) sem ter as informações necessárias confirmadas pelo usuário.
- Se faltar informação essencial, pergunte PRIMEIRO antes de usar qualquer ferramenta de criação.
- Ao mencionar um cliente, sempre use buscar_clientes primeiro para verificar se existe.
- Seja conciso e direto. Use bullet points ao listar itens.
- Responda sempre em português brasileiro.
- Ao criar registros, confirme o que foi criado com um resumo claro.
- Para ações destrutivas (excluir), peça confirmação explícita.

O QUE VOCÊ PODE FAZER:
- Buscar e criar clientes/leads
- Listar, consultar detalhes e atualizar status de orçamentos
- Ver resumo financeiro
- Listar e criar projetos
- CRIAR orçamentos com valores estimados automaticamente: use criar_orcamento com o nome do cliente e a lista de móveis — a IA estimará preços de custo e venda para cada item.
- ATUALIZAR status de orçamento: use atualizar_status_orcamento (rascunho → analise → aprovado → recusado).
- CRIAR projetos: use criar_projeto com nome, cliente e status inicial.

O QUE VOCÊ NÃO FAZ (redirecione para o sistema):
- CRIAR ordens de produção: diga "Acesse **Produção** no menu lateral."
- Calcular quantidades detalhadas de chapas/peças — isso requer o módulo IA de projetos.`;

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface GroqMessage {
  role: string;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, userToken } = req.body as {
    messages: { role: string; content: string }[];
    userToken: string;
  };

  if (!userToken) return res.status(401).json({ error: "Token não fornecido" });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY não configurada" });

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return res.status(500).json({ error: "Supabase não configurado no servidor" });

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });

  const { data: membroData, error: membroError } = await supabase
    .from("empresa_membros")
    .select("empresa_id")
    .maybeSingle();

  if (membroError) {
    return res.status(500).json({ error: "Erro ao buscar empresa do usuário" });
  }
  if (!membroData?.empresa_id) {
    return res.status(400).json({
      error: "Usuário não vinculado a nenhuma empresa. Solicite um convite ao administrador.",
    });
  }
  const empresaId = membroData.empresa_id as string;

  const history: GroqMessage[] = [{ role: "system", content: SYSTEM }, ...messages];
  const toolCallsSummary: { name: string; result: unknown }[] = [];

  for (let iter = 0; iter < 6; iter++) {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: history,
        tools,
        tool_choice: "auto",
        max_tokens: 1200,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Groq: ${err}` });
    }

    const data = (await response.json()) as {
      choices: { message: GroqMessage; finish_reason: string }[];
    };

    const msg = data.choices[0].message;
    history.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return res.json({
        text: msg.content ?? "",
        toolCalls: toolCallsSummary,
        provider: "groq",
      });
    }

    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const result = await executeTool(tc.function.name, args, supabase, empresaId, groqKey);
      toolCallsSummary.push({ name: tc.function.name, result });
      history.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }

  return res.status(500).json({ error: "Agente não convergiu em 6 iterações" });
}
