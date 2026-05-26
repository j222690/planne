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
];

type SupabaseClient = ReturnType<typeof createClient>;

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  empresaId: string,
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
- Listar e consultar orçamentos existentes
- Ver resumo financeiro
- Listar projetos

O QUE VOCÊ NÃO FAZ (redirecione para o sistema):
- CRIAR orçamentos: diga "Para criar um orçamento, clique em **Orçamentos** no menu lateral e depois em **Novo orçamento**. Você pode usar IA ou importar PDF para preencher os itens automaticamente."
- CRIAR projetos: diga "Para criar um projeto, acesse **Projetos** no menu lateral."
- CRIAR ordens de produção: diga "Acesse **Produção** no menu lateral."
- Qualquer criação que envolva itens, quantidades e valores detalhados — isso é feito pelos formulários do sistema, não pelo chat.`;

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

  const { data: membroData } = await supabase
    .from("empresa_membros")
    .select("empresa_id")
    .single();

  if (!membroData) return res.status(400).json({ error: "Empresa não encontrada" });
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
      const result = await executeTool(tc.function.name, args, supabase, empresaId);
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
