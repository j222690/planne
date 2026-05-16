# Planne — Guia de instalação completo

## 1. Extrair e instalar

```bash
unzip planne-premium-furniture-design-fixed.zip
cd planne-fixed
bun install   # ou: npm install
```

## 2. Variáveis de ambiente

Crie o arquivo `.env` na raiz:

```env
# IA — Groq (primário, grátis)
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# IA — OpenAI GPT-4o mini (fallback)
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

| Chave | Onde obter | Custo |
|---|---|---|
| `VITE_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys | **Grátis** |
| `VITE_OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Pago (baixo) |

> O Supabase já está configurado em `src/lib/supabase.ts`.

---

## 3. Configurar o Supabase (OBRIGATÓRIO)

1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. Vá em **SQL Editor** → **New query**
3. Cole TODO o conteúdo do arquivo `supabase_schema.sql`
4. Clique **Run** (ou Ctrl+Enter)

✅ Isso cria todas as tabelas, RLS e o trigger de cadastro automático.

---

## 4. Rodar em desenvolvimento

```bash
bun dev   # ou: npm run dev
```

Acesse: **http://localhost:5173**

---

## 5. Primeiro acesso

1. Vá para `/login`
2. Clique em **Criar conta**
3. Preencha: nome da empresa, e-mail, senha (mín. 8 caracteres)
4. O sistema cria automaticamente sua empresa no banco
5. Você entra direto no dashboard

---

## O que está pronto

| Módulo | Status |
|---|---|
| Autenticação + multi-empresa | ✅ Funcionando |
| Dashboard com dados reais | ✅ Conectado ao Supabase |
| Orçamentos — lista, filtros, criação | ✅ Formulário completo |
| Orçamentos — geração de itens com IA | ✅ Groq + GPT-4o mini |
| Clientes — lista, busca, cadastro | ✅ Modal funcional |
| Projetos — kanban, criar, mover etapa | ✅ Drag de status |
| Central de materiais | ✅ Conectado ao banco |
| Fornecedores — cadastro, import padrão | ✅ Botão de importação |
| Produção — ordens, avançar etapa | ✅ Fluxo de status |
| Financeiro — gráfico 6 meses real | ✅ Dados do banco |
| Tema escuro / claro | ✅ Toggle no topbar |
| Notificações toast | ✅ Sonner ativado |
| Sidebar responsiva (mobile) | ✅ Drawer |
| Configurações com save real | ✅ Salva no Supabase |

---

## Fluxo de IA

O Assistente e os orçamentos usam:
- **Groq · Llama 3.3 70b** — primário (rápido, grátis)
- **GPT-4o mini** — fallback automático

