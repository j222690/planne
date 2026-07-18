# Checklist de Deploy — Planne

Antes de entregar o sistema para uma marcenaria, configure estas variáveis de
ambiente no **Vercel → Project Settings → Environment Variables** (ambiente
Production). Sem elas, algumas funções ficam inoperantes.

## 1. Obrigatórias — o app não funciona sem

| Variável | Onde obter | O que quebra sem ela |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | Todo o app (login, dados) |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Todo o app (login, dados) |

## 2. Geração de imagem (Projeto IA / Render)

Configure **pelo menos uma**. Flux é o provider primário (melhor qualidade de
render arquitetônico); Gemini é o fallback acessível.

| Variável | Onde obter | Observação |
|---|---|---|
| `FLUX_API_KEY` | fluxapi.ai | **Opcional/primário.** Render arquitetônico de alta fidelidade. 1 crédito por conjunto de 4 vistas. Deixe vazio para usar só o Gemini. |
| `GEMINI_API_KEY` | aistudio.google.com/apikey | **Provider de imagem em uso.** Usa a geração nativa do Gemini (`gemini-3.1-flash-image` no modo pro, `gemini-2.5-flash-image` no preview), saída 16:9. Retorna a imagem como data URI. |

> DALL-E e Imagen (:predict) foram removidos — os modelos Imagen foram
> descontinuados para contas novas. Se nenhuma chave (Flux/Gemini) estiver
> configurada, o render retorna erro claro "Nenhuma API de render configurada".

## 3. Assistente IA e orçamento automático

| Variável | Onde obter | O que quebra sem ela |
|---|---|---|
| `GROQ_API_KEY` | console.groq.com | Assistente IA (function calling) |
| `OPENAI_API_KEY` | platform.openai.com | Análise de planta baixa (GPT-4o Vision) e cálculo de orçamento por IA |

## 4. Pagamentos e convites de membros

| Variável | Onde obter | O que quebra sem ela |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (⚠️ secreta) | Webhook de pagamento Asaas não confirma planos; convite de membro por email retorna 501 |
| `SITE_URL` | URL de produção (ex: `https://app.suamarcenaria.com`) | Link do convite aponta para `planne.vercel.app` (default) |
| `ASAAS_TOKEN` | Asaas → Integrações → API | Cobrança / assinatura |

## 5. Verificações no banco (Supabase SQL Editor)

Rode estas migrations se ainda não aplicadas (idempotentes):

- [ ] `supabase_migration_v5.sql` — corrige constraints de projetos/fornecedores
- [ ] `supabase_migration_v8.sql` — colunas `estoque_atual` / `estoque_minimo` em materiais
- [ ] Confirmar que a função RPC **`consume_credito`** existe (usada pelo render premium e projeto IA). Se não existir, todo render premium falha.

Para checar a RPC:
```sql
SELECT proname FROM pg_proc WHERE proname = 'consume_credito';
```

## 6. Teste rápido pós-deploy

1. Login → Dashboard carrega ✅
2. Materiais → cadastrar material com estoque → alerta de estoque baixo aparece ✅
3. Configurações → cadastrar chapa MDF (largura/comprimento/custo) ✅
4. IA Projetos → gerar layout do motor → orçamento usa a chapa real ✅
5. IA Projetos → gerar render → imagem aparece ✅
6. Orçamentos → criar orçamento manual → validação de cliente funciona ✅
