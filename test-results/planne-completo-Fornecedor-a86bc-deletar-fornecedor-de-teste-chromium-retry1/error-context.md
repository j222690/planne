# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planne-completo.spec.ts >> Fornecedores >> Criar e deletar fornecedor de teste
- Location: tests\planne-completo.spec.ts:381:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('PW_1779829535316_Forn').first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText('PW_1779829535316_Forn').first()

```

```yaml
- complementary:
  - text: Planne
  - button "P Planne Plano Pro"
  - navigation:
    - text: Visão geral
    - list:
      - listitem:
        - link "Dashboard":
          - /url: /app
    - text: Comercial
    - list:
      - listitem:
        - link "Orçamentos":
          - /url: /app/orcamentos
      - listitem:
        - link "Clientes":
          - /url: /app/clientes
      - listitem:
        - link "Projetos":
          - /url: /app/projetos
      - listitem:
        - link "Pipeline":
          - /url: /app/pipeline
      - listitem:
        - link "Calendário":
          - /url: /app/calendario
    - text: Operação
    - list:
      - listitem:
        - link "Central de materiais":
          - /url: /app/materiais
      - listitem:
        - link "Fornecedores":
          - /url: /app/fornecedores
      - listitem:
        - link "Produção":
          - /url: /app/producao
      - listitem:
        - link "Histórico de preços":
          - /url: /app/historico-precos
    - text: Inteligência
    - list:
      - listitem:
        - link "IA Projetos":
          - /url: /app/ia-projetos
      - listitem:
        - link "Grat — Assistente":
          - /url: /app/ia
      - listitem:
        - link "Dashboard IA":
          - /url: /app/dashboard-ia
      - listitem:
        - link "Financeiro":
          - /url: /app/financeiro
  - link "Configurações":
    - /url: /app/configuracoes
  - button "Sair da conta"
- main:
  - textbox "Buscar projetos, clientes, orçamentos…"
  - text: K
  - button "Mudar para escuro"
  - button "Notificações": "6"
  - text: S Operação
  - heading "Fornecedores" [level=1]
  - paragraph: Gerencie catálogos e sincronize preços de chapas, ferragens e acessórios.
  - button "Adicionar"
  - text: Nenhum fornecedor cadastrado Importe os fornecedores padrão ou adicione manualmente.
  - button "Adicionar fornecedor"
- region "Notifications alt+T"
```

# Test source

```ts
  303 |       await search.fill("MDF");
  304 |       await page.waitForTimeout(800);
  305 |       const body = await page.content();
  306 |       expect(body).toContain("MDF");
  307 |     }
  308 |   });
  309 | 
  310 |   test("Modal Novo Material abre com campos obrigatórios", async ({ page }) => {
  311 |     await openModal(page, /novo material|adicionar/i);
  312 |     const nomeField = page.locator('input[placeholder*="MDF"], input').first();
  313 |     await expect(nomeField).toBeVisible({ timeout: 5_000 });
  314 |   });
  315 | 
  316 |   test("Criar material — validação (nome vazio)", async ({ page }) => {
  317 |     await openModal(page, /novo material|adicionar/i);
  318 |     await page.click('button[type="submit"]');
  319 |     await page.waitForTimeout(500);
  320 |     const err = page.locator("text=/obrigatório|required/i").first();
  321 |     await expect(err).toBeVisible({ timeout: 5_000 });
  322 |   });
  323 | 
  324 |   test("Criar material completo e verificar na lista", async ({ page }) => {
  325 |     const nomeMat = `PW_${Date.now()}_MDF`;
  326 |     await openModal(page, /novo material|adicionar/i);
  327 |     await page.waitForTimeout(500);
  328 |     // input de nome tem placeholder exato "MDF 15mm Branco TX"
  329 |     await page.locator('input[placeholder="MDF 15mm Branco TX"]').fill(nomeMat);
  330 |     await page.locator('button[type="submit"]').last().click();
  331 |     await page.waitForTimeout(3000);
  332 | 
  333 |     await goTo(page, "/app/materiais");
  334 |     await page.waitForTimeout(2000);
  335 |     // busca o material criado
  336 |     const search = page.locator('input[placeholder*="código"], input[placeholder*="nome, código"]').first();
  337 |     if (await search.count() > 0) await search.fill(nomeMat.slice(0, 10));
  338 |     await page.waitForTimeout(800);
  339 |     const matCard = page.getByText(nomeMat, { exact: false }).first();
  340 |     await expect(matCard).toBeVisible({ timeout: 8_000 });
  341 |   });
  342 | 
  343 |   test("Color swatch de material é clicável (muda cor)", async ({ page }) => {
  344 |     await page.waitForTimeout(2000);
  345 |     const swatch = page.locator("[class*='swatch'], [class*='cor'], [class*='color'], [style*='background']").first();
  346 |     if (await swatch.count() > 0) {
  347 |       await expect(swatch).toBeVisible();
  348 |     }
  349 |   });
  350 | });
  351 | 
  352 | // ─── 6. FORNECEDORES ──────────────────────────────────────────────────────
  353 | 
  354 | test.describe("Fornecedores", () => {
  355 |   test.beforeEach(async ({ page }) => { await login(page); await goTo(page, "/app/fornecedores"); });
  356 | 
  357 |   test("Lista de fornecedores carrega", async ({ page }) => {
  358 |     await page.waitForTimeout(2000);
  359 |     const body = await page.content();
  360 |     // deve ter pelo menos os fornecedores padrão
  361 |     const hasForn = body.includes("Arauco") || body.includes("Berneck") || body.includes("fornecedor") || body.includes("Fornecedor");
  362 |     expect(hasForn).toBeTruthy();
  363 |   });
  364 | 
  365 |   test("Botão Novo Fornecedor abre modal", async ({ page }) => {
  366 |     await openModal(page, /novo fornecedor|adicionar/i);
  367 |     const nomeField = page.locator('input').first();
  368 |     await expect(nomeField).toBeVisible({ timeout: 5_000 });
  369 |   });
  370 | 
  371 |   test("Criar fornecedor — validação nome < 2 chars", async ({ page }) => {
  372 |     await openModal(page, /novo fornecedor|adicionar/i);
  373 |     const inputs = page.locator('input');
  374 |     await inputs.first().fill("A");
  375 |     await page.click('button[type="submit"]');
  376 |     await page.waitForTimeout(500);
  377 |     const err = page.locator("text=/obrigatório|mínimo/i").first();
  378 |     await expect(err).toBeVisible({ timeout: 5_000 });
  379 |   });
  380 | 
  381 |   test("Criar e deletar fornecedor de teste", async ({ page }) => {
  382 |     const logs: string[] = [];
  383 |     page.on('console', msg => { if (msg.text().includes('[PLANNE-TEST]')) logs.push(msg.text()); });
  384 | 
  385 |     const nomeForn = `PW_${Date.now()}_Forn`;
  386 |     await openModal(page, /novo fornecedor|adicionar/i);
  387 |     await page.locator('input[placeholder*="Arauco"]').fill(nomeForn);
  388 |     // clica via click() nativo do DOM (contorna limitações de pointer events)
  389 |     await page.evaluate(() => {
  390 |       const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  391 |       if (btn) btn.click();
  392 |     });
  393 |     // aguarda toast de sucesso — confirma que o INSERT no banco funcionou
  394 |     await page.waitForTimeout(3000);
  395 |     console.log('FORNECEDOR LOGS:', logs.join('\n') || '(nenhum)');
  396 |     await expect(
  397 |       page.locator('[data-sonner-toast]').first()
  398 |     ).toBeVisible({ timeout: 8_000 });
  399 | 
  400 |     await goTo(page, "/app/fornecedores");
  401 |     await page.waitForTimeout(1500);
  402 |     const row = page.getByText(nomeForn, { exact: false }).first();
> 403 |     await expect(row).toBeVisible({ timeout: 8_000 });
      |                       ^ Error: expect(locator).toBeVisible() failed
  404 |   });
  405 | 
  406 |   test("Modo de sync aparece como badge se houver fornecedores", async ({ page }) => {
  407 |     await page.waitForTimeout(1500);
  408 |     const rows = await page.locator("tbody tr, [class*='card']").count();
  409 |     if (rows > 0) {
  410 |       const body = await page.content();
  411 |       const hasSync = body.includes("Manual") || body.includes("Planilha") || body.includes("API") || body.includes("PDF");
  412 |       expect(hasSync).toBeTruthy();
  413 |     }
  414 |   });
  415 | });
  416 | 
  417 | // ─── 7. FINANCEIRO ────────────────────────────────────────────────────────
  418 | 
  419 | test.describe("Financeiro — CRUD", () => {
  420 |   test.beforeEach(async ({ page }) => { await login(page); await goTo(page, "/app/financeiro"); });
  421 | 
  422 |   test("Gráfico de área carrega (SVG presente)", async ({ page }) => {
  423 |     await page.waitForTimeout(2500);
  424 |     const svgCount = await page.locator("svg").count();
  425 |     expect(svgCount).toBeGreaterThan(0);
  426 |   });
  427 | 
  428 |   test("Totais de entrada e saída aparecem", async ({ page }) => {
  429 |     await page.waitForTimeout(2000);
  430 |     const body = await page.content();
  431 |     const hasTotais = body.includes("Entradas") || body.includes("Saídas") || body.includes("R$");
  432 |     expect(hasTotais).toBeTruthy();
  433 |   });
  434 | 
  435 |   test("Modal Novo Lançamento abre com tipo entrada/saída", async ({ page }) => {
  436 |     await openModal(page, /lançamento/i);
  437 |     const body = await page.content();
  438 |     const hasTypes = body.includes("Entrada") || body.includes("entrada") || body.includes("Saída") || body.includes("saída");
  439 |     expect(hasTypes).toBeTruthy();
  440 |   });
  441 | 
  442 |   test("Validação: valor zero ou negativo deve falhar", async ({ page }) => {
  443 |     await openModal(page, /lançamento/i);
  444 |     const descInput = page.locator('input[placeholder*="descrição"], input[placeholder*="descricao"], input').first();
  445 |     await descInput.fill(`${T}_Teste`);
  446 |     const valorInput = page.locator('input[type="number"], input[placeholder*="valor"], input').nth(1);
  447 |     await valorInput.fill("0");
  448 |     await page.click('button[type="submit"]');
  449 |     await page.waitForTimeout(500);
  450 |     // deve mostrar erro de validação
  451 |     const err = page.locator("text=/positivo|obrigatório|maior que zero|required/i").first();
  452 |     if (await err.count() > 0) await expect(err).toBeVisible({ timeout: 5_000 });
  453 |   });
  454 | 
  455 |   test("Criar lançamento de entrada e verificar na lista", async ({ page }) => {
  456 |     const descLanc = `PW_${Date.now()}_Lanc`;
  457 |     await openModal(page, /lançamento/i);
  458 |     await page.waitForTimeout(500);
  459 | 
  460 |     // descrição é o primeiro input do modal de financeiro
  461 |     await page.locator('input').first().fill(descLanc);
  462 |     // valor
  463 |     await page.locator('input[type="number"]').first().fill("1500");
  464 | 
  465 |     await page.locator('button[type="submit"]').last().click();
  466 |     await page.waitForTimeout(3000);
  467 | 
  468 |     await goTo(page, "/app/financeiro");
  469 |     await page.waitForTimeout(2000);
  470 |     const lancamento = page.getByText(descLanc, { exact: false }).first();
  471 |     if (await lancamento.count() > 0) {
  472 |       await expect(lancamento).toBeVisible({ timeout: 5_000 });
  473 |     }
  474 |   });
  475 | 
  476 |   test("Gráfico com dados dos últimos 6 meses existe", async ({ page }) => {
  477 |     await page.waitForTimeout(1500);
  478 |     const body = await page.content();
  479 |     const hasPeriod = body.includes("meses") || body.includes("jan") || body.includes("fev") || body.includes("mai") || body.includes("R$");
  480 |     expect(hasPeriod).toBeTruthy();
  481 |   });
  482 | });
  483 | 
  484 | // ─── 8. PIPELINE ──────────────────────────────────────────────────────────
  485 | 
  486 | test.describe("Pipeline — Kanban", () => {
  487 |   test.beforeEach(async ({ page }) => { await login(page); await goTo(page, "/app/pipeline"); });
  488 | 
  489 |   test("Colunas do Kanban renderizam (Prospecção, Contato, etc.)", async ({ page }) => {
  490 |     await page.waitForTimeout(2000);
  491 |     const body = await page.content();
  492 |     const hasCols = body.includes("Prospecção") || body.includes("Prospeccao") || body.includes("contato") || body.includes("Proposta");
  493 |     expect(hasCols).toBeTruthy();
  494 |   });
  495 | 
  496 |   test("Ticket médio e total aparece no topo", async ({ page }) => {
  497 |     await page.waitForTimeout(2000);
  498 |     const body = await page.content();
  499 |     const hasStats = body.includes("ticket") || body.includes("Ticket") || body.includes("Total") || body.includes("R$");
  500 |     expect(hasStats).toBeTruthy();
  501 |   });
  502 | 
  503 |   test("Modal Nova Oportunidade abre com campo título", async ({ page }) => {
```