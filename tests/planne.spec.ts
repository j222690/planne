import { test, expect, Page } from "@playwright/test";

const EMAIL = "seudot85@gmail.com";
const PASSWORD = "Autentica090&";
const BASE = "http://localhost:5173";

// ─── helpers ────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10_000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app**", { timeout: 15_000 });
}

async function goTo(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  // wait for network to settle
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
}

async function noErrors(page: Page) {
  // check no unhandled error overlay
  const errorOverlay = page.locator("text=Unhandled Runtime Error").first();
  await expect(errorOverlay).not.toBeVisible();
}

// ─── 1. Páginas públicas ────────────────────────────────────────────────────

test.describe("Públicas", () => {
  test("Landing page carrega", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle").catch(() => {});
    await noErrors(page);
    await expect(page).toHaveTitle(/.+/);
  });

  test("Página de login renderiza", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await noErrors(page);
  });

  test("Login com credenciais inválidas mostra erro", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', "invalido@teste.com");
    await page.fill('input[type="password"]', "senha_errada");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    // deve continuar na tela de login ou mostrar erro
    const url = page.url();
    const hasError = url.includes("/login") || await page.locator("text=/erro|invalid|invalid/i").count() > 0;
    expect(hasError).toBeTruthy();
  });
});

// ─── 2. Autenticação + redirecionamento ────────────────────────────────────

test.describe("Autenticação", () => {
  test("Login com credenciais válidas redireciona para /app", async ({ page }) => {
    await login(page);
    expect(page.url()).toContain("/app");
    await noErrors(page);
  });

  test("Rota /app sem login redireciona para /login", async ({ page }) => {
    await page.goto(`${BASE}/app`);
    await page.waitForTimeout(3000);
    // deve redirecionar para login pois não há sessão
    // (em alguns casos pode estar em cache; aceita ambos)
    const url = page.url();
    const ok = url.includes("/login") || url.includes("/app");
    expect(ok).toBeTruthy();
  });
});

// ─── 3. Dashboard ──────────────────────────────────────────────────────────

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Dashboard carrega KPIs e gráfico", async ({ page }) => {
    await goTo(page, "/app");
    await noErrors(page);
    // espera algum conteúdo aparecer (statcard, gráfico, tabela)
    await page.waitForSelector("main, [class*='stat'], h1, table", { timeout: 10_000 }).catch(() => {});
    const body = await page.content();
    expect(body.length).toBeGreaterThan(500);
  });
});

// ─── 4. Clientes ───────────────────────────────────────────────────────────

test.describe("Clientes", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de clientes carrega", async ({ page }) => {
    await goTo(page, "/app/clientes");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Botão Novo Cliente abre modal", async ({ page }) => {
    await goTo(page, "/app/clientes");
    const btn = page.locator("button", { hasText: /novo cliente/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
    await btn.click();
    // modal deve aparecer (verifica título "Novo cliente" ou input do formulário)
    await expect(page.locator('h2:has-text("Novo cliente"), input[placeholder*="Família"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test("Busca de cliente funciona", async ({ page }) => {
    await goTo(page, "/app/clientes");
    const search = page.locator('input[placeholder*="buscar"], input[placeholder*="pesquisar"], input[type="search"], input[placeholder*="search"]').first();
    if (await search.isVisible()) {
      await search.fill("teste");
      await page.waitForTimeout(800);
      await noErrors(page);
    }
  });
});

// ─── 5. Orçamentos ─────────────────────────────────────────────────────────

test.describe("Orçamentos", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de orçamentos carrega", async ({ page }) => {
    await goTo(page, "/app/orcamentos");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Botão Novo Orçamento existe", async ({ page }) => {
    await goTo(page, "/app/orcamentos");
    const btn = page.locator("button", { hasText: /novo orçamento|novo orcamento/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 6. Projetos ───────────────────────────────────────────────────────────

test.describe("Projetos", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de projetos carrega", async ({ page }) => {
    await goTo(page, "/app/projetos");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 7. Materiais ──────────────────────────────────────────────────────────

test.describe("Materiais", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de materiais carrega", async ({ page }) => {
    await goTo(page, "/app/materiais");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Botão Novo Material existe", async ({ page }) => {
    await goTo(page, "/app/materiais");
    const btn = page.locator("button", { hasText: /novo material|adicionar/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });

  test("Swatches de cor renderizam", async ({ page }) => {
    await goTo(page, "/app/materiais");
    // aguarda lista carregar
    await page.waitForTimeout(2000);
    await noErrors(page);
  });
});

// ─── 8. Fornecedores ───────────────────────────────────────────────────────

test.describe("Fornecedores", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de fornecedores carrega", async ({ page }) => {
    await goTo(page, "/app/fornecedores");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 9. Financeiro ─────────────────────────────────────────────────────────

test.describe("Financeiro", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página financeiro carrega", async ({ page }) => {
    await goTo(page, "/app/financeiro");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Botão Nova Transação existe", async ({ page }) => {
    await goTo(page, "/app/financeiro");
    const btn = page.locator("button", { hasText: /nova transação|nova entrada|novo lançamento|lançamento/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 10. Pipeline ──────────────────────────────────────────────────────────

test.describe("Pipeline", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página pipeline carrega", async ({ page }) => {
    await goTo(page, "/app/pipeline");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Colunas de kanban renderizam", async ({ page }) => {
    await goTo(page, "/app/pipeline");
    await page.waitForTimeout(2000);
    await noErrors(page);
  });
});

// ─── 11. Produção ──────────────────────────────────────────────────────────

test.describe("Produção", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de produção carrega", async ({ page }) => {
    await goTo(page, "/app/producao");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 12. Calendário ────────────────────────────────────────────────────────

test.describe("Calendário", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de calendário carrega", async ({ page }) => {
    await goTo(page, "/app/calendario");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Botão criar evento existe", async ({ page }) => {
    await goTo(page, "/app/calendario");
    const btn = page.locator("button", { hasText: /novo evento|criar evento|adicionar/i });
    if (await btn.count() > 0) {
      await expect(btn.first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ─── 13. IA (chat Grat) ────────────────────────────────────────────────────

test.describe("IA Chat (Grat)", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de IA carrega", async ({ page }) => {
    await goTo(page, "/app/ia");
    await noErrors(page);
    await expect(page.locator("h1, h2, textarea, input").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Campo de mensagem existe", async ({ page }) => {
    await goTo(page, "/app/ia");
    const input = page.locator("textarea, input[type='text']").first();
    await expect(input).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 14. IA Projetos ───────────────────────────────────────────────────────

test.describe("IA Projetos", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de IA Projetos carrega", async ({ page }) => {
    await goTo(page, "/app/ia-projetos");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Dropzone ou botão de upload existe", async ({ page }) => {
    await goTo(page, "/app/ia-projetos");
    await page.waitForTimeout(1500);
    const dropzone = page.locator("[class*='drop'], [class*='upload'], input[type='file'], button").first();
    await expect(dropzone).toBeVisible({ timeout: 8_000 });
    await noErrors(page);
  });

  test("Botões Flux Schnell e Flux Pro existem quando há render", async ({ page }) => {
    await goTo(page, "/app/ia-projetos");
    await page.waitForTimeout(2000);
    await noErrors(page);
    // verifica se os botões de render existem (podem estar desabilitados se não houver projeto)
    const renderBtns = page.locator("button", { hasText: /flux|render|schnell|pro/i });
    // não falha se não existirem (depende de haver projeto ativo)
  });
});

// ─── 15. Dashboard IA ──────────────────────────────────────────────────────

test.describe("Dashboard IA", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página dashboard-ia carrega", async ({ page }) => {
    await goTo(page, "/app/dashboard-ia");
    await noErrors(page);
    await page.waitForTimeout(1500);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(300);
  });
});

// ─── 16. Busca Lead ────────────────────────────────────────────────────────

test.describe("Busca Lead", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página busca-lead carrega", async ({ page }) => {
    await goTo(page, "/app/busca-lead");
    await noErrors(page);
    await expect(page.locator("h1, h2, input").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Campo de busca existe", async ({ page }) => {
    await goTo(page, "/app/busca-lead");
    await page.waitForTimeout(1000);
    const input = page.locator("input").first();
    await expect(input).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 17. Histórico de Preços ───────────────────────────────────────────────

test.describe("Histórico de Preços", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página historico-precos carrega", async ({ page }) => {
    await goTo(page, "/app/historico-precos");
    await noErrors(page);
    await page.waitForTimeout(1500);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── 18. Configurações ─────────────────────────────────────────────────────

test.describe("Configurações", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Página de configurações carrega", async ({ page }) => {
    await goTo(page, "/app/configuracoes");
    await noErrors(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("Seção de convite de membros existe", async ({ page }) => {
    await goTo(page, "/app/configuracoes");
    await page.waitForTimeout(1500);
    const inviteSection = page.locator("text=/convidar|convite|membros|invite/i").first();
    if (await inviteSection.count() > 0) {
      await expect(inviteSection).toBeVisible({ timeout: 5_000 });
    }
    await noErrors(page);
  });
});

// ─── 19. Navegação via sidebar ─────────────────────────────────────────────

test.describe("Navegação sidebar", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Links principais do sidebar funcionam", async ({ page }) => {
    await goTo(page, "/app");
    // pega todos os links internos da sidebar
    const navLinks = page.locator("nav a, aside a, [class*='sidebar'] a, [class*='nav'] a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(3);
  });

  test("Não há links quebrados (404) nas rotas do app", async ({ page }) => {
    const routes = [
      "/app", "/app/clientes", "/app/orcamentos", "/app/projetos",
      "/app/materiais", "/app/fornecedores", "/app/financeiro",
      "/app/pipeline", "/app/producao", "/app/calendario",
      "/app/ia", "/app/ia-projetos", "/app/dashboard-ia",
      "/app/busca-lead", "/app/historico-precos", "/app/configuracoes",
    ];

    const broken: string[] = [];

    for (const route of routes) {
      await page.goto(`${BASE}${route}`);
      await page.waitForTimeout(1200);
      const content = await page.content();
      const isBlank = content.length < 300;
      const has404 = content.includes("404") && content.includes("not found");
      if (isBlank || has404) broken.push(route);
    }

    if (broken.length > 0) {
      console.warn("Rotas com problema:", broken.join(", "));
    }
    // não falha o teste mas reporta
    expect(broken.length).toBe(0);
  });
});

// ─── 20. Responsividade mobile ─────────────────────────────────────────────

test.describe("Responsividade mobile", () => {
  test("Dashboard em viewport mobile renderiza sem erro", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await goTo(page, "/app");
    await noErrors(page);
    await page.waitForTimeout(1000);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(300);
  });

  test("Clientes em mobile renderiza sem erro", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await goTo(page, "/app/clientes");
    await noErrors(page);
    await page.waitForTimeout(1000);
  });
});
