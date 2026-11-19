// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


// src/server/http/agent.ts
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/server/require-user.ts
import { createClient } from "@supabase/supabase-js";
function header(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
function readAccessToken(req) {
  const raw = header(req, "authorization");
  if (raw) {
    const match = raw.match(/^Bearer\s+(\S+)/i);
    if (match?.[1]) return match[1].trim();
  }
  const body = req.body;
  const fromBody = body?.userToken ?? body?.user_token;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody.trim();
  return null;
}
async function requireUser(req, res) {
  const token = readAccessToken(req);
  if (!token) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Supabase n\xE3o configurado" });
    return null;
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  return { id: data.user.id, token };
}

// src/lib/base-conhecimento/dados/00-knowledge-base-consolidada.json
var knowledge_base_consolidada_default = {
  total_atomos: 112,
  atomos: [
    {
      id: "atom_01_triangulo_de_trabalho_e_fluxo_regra_do_triangulo_de_trabalho_nkba",
      entidade: "TRI\xC2NGULO DE TRABALHO E FLUXO",
      categoria: "Cozinhas",
      subcategoria: "TRI\xC2NGULO DE TRABALHO E FLUXO",
      titulo: "Regra do Tri\xE2ngulo de Trabalho (NKBA)",
      tipo: "regra_obrigatoria",
      descricao: "O tri\xE2ngulo de trabalho conecta os tr\xEAs centros prim\xE1rios de atividade da cozinha \u2014 refrigera\xE7\xE3o (geladeira), lavagem/preparo (pia) e coc\xE7\xE3o (fog\xE3o/cooktop). A soma dos tr\xEAs lados do tri\xE2ngulo deve ficar entre 4 m e 8 m (13 a 26 p\xE9s), e nenhum lado individual deve medir menos de 1,20 m nem mais de 2,70 m. [cf. No leg of the triangle should be less than 1.2 m (4 ft) or more than 2.7 m (9 ft), and the sum of all three sides should be between 4\u20138 m (13\u201326 ft)]",
      condicoes: {
        quando_aplicar: "Em qualquer layout com tr\xEAs centros de trabalho bem definidos (linear, L, U, ilha simples). Serve como ponto de partida do zoneamento antes de posicionar m\xF3dulos de marcenaria.",
        condicoes_adicionais: "Nenhum obst\xE1culo de piso a teto (torre, geladeira, despensa) pode separar dois centros de trabalho; nenhum corredor de circula\xE7\xE3o principal deve cruzar o tri\xE2ngulo; ilhas/pen\xEDnsulas n\xE3o podem interceptar um lado do tri\xE2ngulo em mais de 30 cm. [cf. Cabinets or other obstacles should not intersect any leg of the triangle by more than 30 cm (12 in), and a full-height obstacle should not come between any two points of the triangle]"
      },
      restricoes: {
        quando_nao_aplicar: 'Cozinhas com m\xFAltiplos cozinheiros, cozinhas abertas/integradas de grande metragem ou ilhas com centros de trabalho duplicados \u2014 nesses casos o conceito de "zonas de trabalho" (zone planning), recomendado pelas diretrizes mais recentes da NKBA, substitui o tri\xE2ngulo \xFAnico.',
        limitacoes: "\xC9 um modelo dos anos 1940 pensado para cozinhas de um \xFAnico cozinheiro; n\xE3o escala bem para cozinhas gourmet contempor\xE2neas com m\xFAltiplos usu\xE1rios simult\xE2neos."
      },
      acoes_recomendadas: `Modelo de "zonas de trabalho" (prep zone, cook zone, clean zone, cold zone) para cozinhas grandes ou com dois cozinheiros; nesse caso a largura do corredor de trabalho aumenta de 1,10 m para 1,20\u20131,35 m. [cf. To accommodate multiple cooks, modern guidelines expand the work triangle's parameters, recommending aisle widths of 48 to 54 inches to prevent congestion and allow simultaneous activity]`,
      motivo_tecnico: "O tri\xE2ngulo de trabalho conecta os tr\xEAs centros prim\xE1rios de atividade da cozinha \u2014 refrigera\xE7\xE3o (geladeira), lavagem/preparo (pia) e coc\xE7\xE3o (fog\xE3o/cooktop). A soma dos tr\xEAs lados do tri\xE2ngulo deve ficar entre 4 m e 8 m (13 a 26 p\xE9s), e nenhum lado individual deve medir menos de 1,20 m nem mais de 2,70 m. [cf. No leg of the triangle should be less than 1.2 m (4 ft) or more than 2.7 m (9 ft), and the sum of all three sides should be between 4\u20138 m (13\u201326 ft)]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: 'NKBA (National Kitchen & Bath Association) Kitchen Planning Guidelines; Wikipedia "Kitchen work triangle" (compila\xE7\xE3o de normas internacionais).',
      fabricante: "N/A (norma de associa\xE7\xE3o profissional, n\xE3o de fabricante).",
      observacoes: "Embora seja uma diretriz norte-americana, o conceito \xE9 usado como refer\xEAncia t\xE9cnica mundial, inclusive por escolas t\xE9cnicas e softwares de projeto no Brasil. ---",
      tags: [
        "cozinhas",
        "tri\xE2ngulo",
        "trabalho",
        "fluxo",
        "regra",
        "nkba"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_triangulo_de_trabalho_e_fluxo_larguras_minimas_de_corredor_aisle",
      entidade: "TRI\xC2NGULO DE TRABALHO E FLUXO",
      categoria: "Cozinhas",
      subcategoria: "TRI\xC2NGULO DE TRABALHO E FLUXO",
      titulo: "Larguras m\xEDnimas de corredor/aisle",
      tipo: "boa_pratica",
      descricao: "O corredor de trabalho \u2014 medido entre a face frontal de bancadas, arm\xE1rios altos e/ou eletrodom\xE9sticos \u2014 deve ter no m\xEDnimo 1,10 m para um \xFAnico cozinheiro e 1,20\u20131,35 m quando dois cozinheiros usam a cozinha simultaneamente. [cf. The width of a work aisle should be at least 42\u201D for one cook and at least 48\u201D for multiple cooks, measured between the counter frontage, tall cabinets and/or appliances]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de layout em L, U, corredor (galley) e ilha, antes de fechar as medidas de cada m\xF3dulo de marcenaria.",
        condicoes_adicionais: "Medir sempre face a face dos elementos fixos (n\xE3o de parede a parede); reserva de folga extra de 15\u201324 cm ao lado do cooktop e da pia para apoio de panelas e escorredor. [cf. Provide at least 15 inches next to or above the oven; landing areas beside cooking surfaces need clearance on both sides]"
      },
      restricoes: {
        quando_nao_aplicar: "Cozinhas americanas integradas com bancada de bar, onde parte da circula\xE7\xE3o \xE9 compartilhada com a \xE1rea social \u2014 nesse caso considerar folga adicional para cadeiras/banquetas.",
        limitacoes: "Em reformas de apartamentos pequenos, muitas vezes n\xE3o h\xE1 espa\xE7o f\xEDsico para atingir 1,10 m; nesse caso o projetista deve documentar a exce\xE7\xE3o e priorizar seguran\xE7a de circula\xE7\xE3o sobre a diretriz ideal."
      },
      acoes_recomendadas: "Redu\xE7\xE3o pontual do corredor para 90\u201395 cm em trechos curtos sem cruzamento de tr\xE1fego, nunca na frente de fog\xE3o/forno aberto.",
      motivo_tecnico: "O corredor de trabalho \u2014 medido entre a face frontal de bancadas, arm\xE1rios altos e/ou eletrodom\xE9sticos \u2014 deve ter no m\xEDnimo 1,10 m para um \xFAnico cozinheiro e 1,20\u20131,35 m quando dois cozinheiros usam a cozinha simultaneamente. [cf. The width of a work aisle should be at least 42\u201D for one cook and at least 48\u201D for multiple cooks, measured between the counter frontage, tall cabinets and/or appliances]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "NKBA Guidelines; Mod Cabinetry (compila\xE7\xE3o NKBA).",
      fabricante: "N/A.",
      observacoes: 'Regra deve ser tratada como restri\xE7\xE3o "hard" no motor de regras \u2014 viol\xE1-la gera recomenda\xE7\xE3o de revis\xE3o de layout, n\xE3o apenas alerta. ---',
      tags: [
        "cozinhas",
        "tri\xE2ngulo",
        "trabalho",
        "fluxo",
        "larguras",
        "m\xEDnimas",
        "corredor",
        "aisle"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_geladeira_folga_de_ventilacao_lateral_superior_e_traseira",
      entidade: "GELADEIRA",
      categoria: "Cozinhas",
      subcategoria: "GELADEIRA",
      titulo: "Folga de ventila\xE7\xE3o lateral, superior e traseira",
      tipo: "recomendacao",
      descricao: "Todo refrigerador \u2014 especialmente modelos embutidos em torre ou nicho de marcenaria \u2014 precisa de folga de ar para dissipar calor do compressor e do condensador. A pr\xE1tica geral indica de 2 a 5 cm nas laterais e no topo, e de 5 a 10 cm na parte traseira. [cf. A folga recomendada gira em torno de 2 a 5 cm nas laterais, no topo e no fundo, para o compressor dissipar o calor; sem essa ventila\xE7\xE3o, o aparelho trabalha for\xE7ado, consome mais energia e perde efici\xEAncia com o tempo]",
      condicoes: {
        quando_aplicar: "Sempre que a geladeira for encaixada entre dois m\xF3dulos de marcenaria ou sob um arm\xE1rio a\xE9reo/nicho fechado.",
        condicoes_adicionais: "Medir a largura do v\xE3o nas tr\xEAs alturas (base, meio, topo), pois paredes raramente s\xE3o perfeitamente retas; usar a menor medida encontrada como refer\xEAncia de projeto. [cf. Me\xE7a a largura em tr\xEAs alturas do v\xE3o (base, meio e topo); paredes raramente s\xE3o retas \u2014 anote o menor valor e some pelo menos 5 cm de folga de cada lado]"
      },
      restricoes: {
        quando_nao_aplicar: 'Modelos "built-in" (embutidos verdadeiros, sem grade lateral de ventila\xE7\xE3o, com dissipa\xE7\xE3o frontal) seguem especifica\xE7\xE3o pr\xF3pria do fabricante, que pode dispensar folga lateral \u2014 a regra gen\xE9rica n\xE3o deve ser aplicada a esses modelos sem checar o manual.',
        limitacoes: 'Reduz o aproveitamento linear da parede \u2014 cada geladeira "consome" cerca de 10\u201315 cm a mais de largura de projeto do que a medida nominal do produto.'
      },
      acoes_recomendadas: "Colunas de refrigera\xE7\xE3o profissionais (built-in de verdade) com sistema de ventila\xE7\xE3o frontal via grelha no rodap\xE9, que dispensam folga lateral mas custam significativamente mais.",
      motivo_tecnico: "Todo refrigerador \u2014 especialmente modelos embutidos em torre ou nicho de marcenaria \u2014 precisa de folga de ar para dissipar calor do compressor e do condensador. A pr\xE1tica geral indica de 2 a 5 cm nas laterais e no topo, e de 5 a 10 cm na parte traseira. [cf. A folga recomendada gira em torno de 2 a 5 cm nas laterais, no topo e no fundo, para o compressor dissipar o calor; sem essa ventila\xE7\xE3o, o aparelho trabalha for\xE7ado, consome mais energia e perde efici\xEAncia com o tempo]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Blog t\xE9cnico de eletrodom\xE9sticos (Casa dos Eletrodom\xE9sticos); manuais de fabricantes de refrigeradores.",
      fabricante: "Refer\xEAncia geral de mercado (Brastemp, Electrolux, Samsung \u2014 cada um com toler\xE2ncia pr\xF3pria no manual).",
      observacoes: 'O motor de regras do Planne deveria sempre solicitar o modelo exato da geladeira antes de fechar a medida do nicho \u2014 "regra de ouro" citada por m\xFAltiplas fontes do setor. ---',
      tags: [
        "cozinhas",
        "geladeira",
        "folga",
        "ventila\xE7\xE3o",
        "lateral",
        "superior",
        "traseira"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_geladeira_nao_posicionar_geladeira_ao_lado_do_fogao_forno",
      entidade: "GELADEIRA",
      categoria: "Cozinhas",
      subcategoria: "GELADEIRA",
      titulo: "N\xE3o posicionar geladeira ao lado do fog\xE3o/forno",
      tipo: "boa_pratica",
      descricao: "Posicionar a geladeira imediatamente ao lado de fontes de calor (fog\xE3o, forno, torre quente) faz o compressor trabalhar mais para compensar o ganho de calor externo, reduzindo a efici\xEAncia e a vida \xFAtil do equipamento. [cf. O importante desta t\xE9cnica \xE9 n\xE3o deixar a geladeira ao lado do fog\xE3o, pois o excesso de calor danifica o equipamento de refrigera\xE7\xE3o]",
      condicoes: {
        quando_aplicar: "Em qualquer defini\xE7\xE3o de layout onde geladeira e fog\xE3o/torre quente concorrem pela mesma parede.",
        condicoes_adicionais: "Preferir posicionar a geladeira em uma ponta do tri\xE2ngulo, com a pia como elemento central entre ela e o fog\xE3o. [cf. Os arquitetos costumam aplicar a regra do tri\xE2ngulo para definir o melhor posicionamento da geladeira: o ideal \xE9 que o refrigerador seja posicionado numa extremidade, a pia como objeto central e o fog\xE3o do outro lado]"
      },
      restricoes: {
        quando_nao_aplicar: "Quando h\xE1 uma barreira t\xE9rmica planejada entre os dois (ex.: uma torre de despensa ou painel isolante entre eles) \u2014 nesse caso a dist\xE2ncia f\xEDsica resolve o problema mesmo estando na mesma parede.",
        limitacoes: "Em cozinhas muito estreitas (corredor/galley) nem sempre h\xE1 op\xE7\xE3o de layout alternativa."
      },
      acoes_recomendadas: "Uso de painel termoisolante entre os dois m\xF3dulos, quando a dist\xE2ncia f\xEDsica n\xE3o pode ser garantida.",
      motivo_tecnico: "Posicionar a geladeira imediatamente ao lado de fontes de calor (fog\xE3o, forno, torre quente) faz o compressor trabalhar mais para compensar o ganho de calor externo, reduzindo a efici\xEAncia e a vida \xFAtil do equipamento. [cf. O importante desta t\xE9cnica \xE9 n\xE3o deixar a geladeira ao lado do fog\xE3o, pois o excesso de calor danifica o equipamento de refrigera\xE7\xE3o]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "m\xE9dio",
        estetico: "nenhum"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Casa e Festa (blog t\xE9cnico sobre eletrodom\xE9sticos).",
      fabricante: "N/A.",
      observacoes: 'Regra de bom senso amplamente repetida na literatura de arquitetura de interiores, mas raramente formalizada em normas \u2014 vale como "boa pr\xE1tica" e n\xE3o como norma dura. ---',
      tags: [
        "cozinhas",
        "geladeira",
        "posicionar",
        "lado",
        "fog\xE3o",
        "forno"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_cooktop_fogao_distancia_minima_da_pia_respingos",
      entidade: "COOKTOP / FOG\xC3O",
      categoria: "Cozinhas",
      subcategoria: "COOKTOP / FOG\xC3O",
      titulo: "Dist\xE2ncia m\xEDnima da pia (respingos)",
      tipo: "boa_pratica",
      descricao: "O cooktop ou fog\xE3o deve ficar a, no m\xEDnimo, 45 cm de dist\xE2ncia da cuba da pia, para evitar respingos de \xE1gua da torneira sobre a chama/resist\xEAncia. [cf. \xC9 essencial que o eletrodom\xE9stico seja instalado a uma dist\xE2ncia de, no m\xEDnimo, 45 cent\xEDmetros da pia para evitar respingos de \xE1gua da torneira]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de layout de bancada com pia e cooktop na mesma linha.",
        condicoes_adicionais: "Verificar tamb\xE9m a instala\xE7\xE3o do ponto de g\xE1s \u2014 normas de seguran\xE7a determinam que a abertura superior do ambiente com aparelhos a g\xE1s fique a no m\xEDnimo 1,50 m do piso, com abertura inferior a no m\xE1ximo 0,80 m. [cf. A norma t\xE9cnica ABNT NBR 13103 prev\xEA que a abertura superior do ambiente que cont\xE9m aparelhos a g\xE1s deve estar a uma altura m\xEDnima de 1,50 m em rela\xE7\xE3o ao piso acabado e a abertura inferior, no m\xE1ximo a 0,80 m deste piso]"
      },
      restricoes: {
        quando_nao_aplicar: "Ilhas com cooktop isolado da pia por um desn\xEDvel ou divisor f\xEDsico \u2014 a dist\xE2ncia pode ser reavaliada caso haja barreira f\xEDsica.",
        limitacoes: "Em cozinhas muito compactas, a dist\xE2ncia de 45 cm pode consumir espa\xE7o valioso de bancada \u2014 n\xE3o deve ser reduzida por quest\xF5es de seguran\xE7a contra respingo e vapor de \xE1gua na instala\xE7\xE3o el\xE9trica/g\xE1s."
      },
      acoes_recomendadas: "Uso de protetor/divisor de bancada (splash guard) quando a dist\xE2ncia m\xEDnima n\xE3o puder ser respeitada integralmente.",
      motivo_tecnico: "O cooktop ou fog\xE3o deve ficar a, no m\xEDnimo, 45 cm de dist\xE2ncia da cuba da pia, para evitar respingos de \xE1gua da torneira sobre a chama/resist\xEAncia. [cf. \xC9 essencial que o eletrodom\xE9stico seja instalado a uma dist\xE2ncia de, no m\xEDnimo, 45 cent\xEDmetros da pia para evitar respingos de \xE1gua da torneira]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 100,
        base: "norma_oficial"
      },
      fonte: "ABNT NBR 13103 (instala\xE7\xF5es de aparelhos a g\xE1s); FAQ t\xE9cnico Black Pilado.",
      fabricante: "Recomenda\xE7\xE3o geral v\xE1lida para cooktops Mueller, Brastemp, Fischer, entre outros.",
      observacoes: "Regra deve ser tratada como restri\xE7\xE3o de seguran\xE7a (hard constraint) no motor de regras, com refer\xEAncia direta \xE0 NBR 13103. ---",
      tags: [
        "cozinhas",
        "cooktop",
        "fog\xE3o",
        "dist\xE2ncia",
        "m\xEDnima",
        "respingos"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_cooktop_fogao_folga_lateral_do_cooktop_fogao",
      entidade: "COOKTOP / FOG\xC3O",
      categoria: "Cozinhas",
      subcategoria: "COOKTOP / FOG\xC3O",
      titulo: "Folga lateral do cooktop/fog\xE3o",
      tipo: "boa_pratica",
      descricao: "Deve haver ao menos 40 cm de bancada livre de um lado do cooktop e 30 cm do outro lado, para apoio de panelas quentes e manuseio seguro. [cf. A stove or cooktop should have a clear 40 cm (15 in) area on one side, and at least 30 cm (12 in) on the other side]",
      condicoes: {
        quando_aplicar: "Em qualquer defini\xE7\xE3o de m\xF3dulo de bancada que acomode cooktop/fog\xE3o de embutir.",
        condicoes_adicionais: "Preferencialmente, o lado com maior folga (40 cm) deve ficar do lado de maior uso do cozinheiro principal (destro ou canhoto)."
      },
      restricoes: {
        quando_nao_aplicar: "Ilhas de coc\xE7\xE3o com bancada cont\xEDnua de ambos os lados superior a essas medidas \u2014 a regra j\xE1 est\xE1 automaticamente satisfeita, n\xE3o sendo um limitador de projeto.",
        limitacoes: "Em kitchenettes e cozinhas americanas compactas, dificilmente as duas folgas cabem \u2014 priorizar o lado de maior tr\xE1fego de panelas quentes."
      },
      acoes_recomendadas: "Uso de apoio retr\xE1til (t\xE1bua deslizante) para compensar falta de bancada fixa lateral.",
      motivo_tecnico: "Deve haver ao menos 40 cm de bancada livre de um lado do cooktop e 30 cm do outro lado, para apoio de panelas quentes e manuseio seguro. [cf. A stove or cooktop should have a clear 40 cm (15 in) area on one side, and at least 30 cm (12 in) on the other side]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: 'NKBA Guidelines (via Wikipedia "Kitchen work triangle").',
      fabricante: "N/A.",
      observacoes: "Complementa a regra do tri\xE2ngulo de trabalho (item 1.1) e a regra da coifa (item 6). ---",
      tags: [
        "cozinhas",
        "cooktop",
        "fog\xE3o",
        "folga",
        "lateral"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_forno_de_embutir_ausencia_de_padrao_dimensional_entre_fabricantes",
      entidade: "FORNO DE EMBUTIR",
      categoria: "Cozinhas",
      subcategoria: "FORNO DE EMBUTIR",
      titulo: "Aus\xEAncia de padr\xE3o dimensional entre fabricantes",
      tipo: "regra_obrigatoria",
      descricao: "Diferente do que ocorre em outros mercados, n\xE3o existe padroniza\xE7\xE3o de medidas de nicho entre fabricantes de forno de embutir no Brasil \u2014 cada marca e modelo pode ter uma combina\xE7\xE3o diferente de largura, altura e profundidade de nicho. [cf. N\xE3o existe um padr\xE3o de medida para nichos de fog\xF5es de embutir. Isso dificulta muito o consumidor quando troca o fog\xE3o por um outro modelo]",
      condicoes: {
        quando_aplicar: 'Sempre \u2014 esta \xE9 uma regra de "alerta permanente" que deve disparar antes de qualquer execu\xE7\xE3o de nicho para forno.',
        condicoes_adicionais: "O nicho s\xF3 deve ser cortado ap\xF3s a confirma\xE7\xE3o do modelo exato do forno (ou de uma lista fechada de modelos compat\xEDveis) pelo cliente/projetista."
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 exce\xE7\xE3o; mesmo dentro da mesma marca, capacidades diferentes (litros) podem ter dimens\xF5es f\xEDsicas diferentes.",
        limitacoes: "Isso obriga o Planne a manter (ou integrar com) uma base de dados de modelos e dimens\xF5es de forno atualizada por fabricante \u2014 informa\xE7\xE3o sujeita a mudan\xE7a sem aviso pr\xE9vio. [cf. SEMPRE confirme as medidas no manual do fog\xE3o, pois os fabricantes podem alterar as medidas sem pr\xE9vio aviso]"
      },
      acoes_recomendadas: "Adotar como refer\xEAncia aproximada de mercado um nicho de 56\u201357 cm (L) x 58\u201360 cm (A) x 56\u201358 cm (P) para fornos de 60 cm, sempre como estimativa inicial a ser validada. [cf. Forno embutido 60 cm: nicho aproximado 56\u201357 x 58\u201360 x 56\u201358 cm (L x A x P) com respiro]",
      motivo_tecnico: "Diferente do que ocorre em outros mercados, n\xE3o existe padroniza\xE7\xE3o de medidas de nicho entre fabricantes de forno de embutir no Brasil \u2014 cada marca e modelo pode ter uma combina\xE7\xE3o diferente de largura, altura e profundidade de nicho. [cf. N\xE3o existe um padr\xE3o de medida para nichos de fog\xF5es de embutir. Isso dificulta muito o consumidor quando troca o fog\xE3o por um outro modelo]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Blog Eletrodom\xE9sticos (comparativo de nichos); m\xFAltiplos relatos de consumidores no mesmo artigo confirmando o problema.",
      fabricante: "Regra vale para todas as marcas (GE, Brastemp, Electrolux, Fischer, Tramontina, Mueller etc.) \u2014 cada uma com tabela pr\xF3pria.",
      observacoes: 'Esta \xE9 uma das regras mais valiosas para o "diferencial de intelig\xEAncia" do Planne: nenhum concorrente (Promob/Cabinet Vision) parece tratar isso como alerta ativo de compatibilidade futura. ---',
      tags: [
        "cozinhas",
        "forno",
        "embutir",
        "aus\xEAncia",
        "padr\xE3o",
        "dimensional",
        "fabricantes"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_forno_de_embutir_folga_de_ventilacao_e_ergonomia_de_altura_do_forno",
      entidade: "FORNO DE EMBUTIR",
      categoria: "Cozinhas",
      subcategoria: "FORNO DE EMBUTIR",
      titulo: "Folga de ventila\xE7\xE3o e ergonomia de altura do forno",
      tipo: "restricao",
      descricao: "O forno de embutir deve ter folga de 5 a 10 cm no fundo do nicho para ventila\xE7\xE3o, e ser posicionado de forma que a base fique entre 60 e 90 cm do piso (ou o centro do forno entre 90 e 110 cm), evitando que o usu\xE1rio precise se curvar excessivamente. [cf. Para evitar o superaquecimento, \xE9 recomendado deixar uma folga de 5 a 10 cent\xEDmetros no fundo e uma altura total de 90 cent\xEDmetros a partir do ch\xE3o] [cf. O centro do forno el\xE9trico deve estar posicionado a uma altura entre 90 cm e 110 cm do piso]",
      condicoes: {
        quando_aplicar: "Em qualquer torre quente ou m\xF3dulo isolado que acomode forno de embutir.",
        condicoes_adicionais: 'Nunca vedar completamente as frestas de ventila\xE7\xE3o do nicho, mesmo por motivos est\xE9ticos. [cf. Folgas m\xEDnimas evitam barulho, empeno e sobrecarga t\xE9rmica; portanto, n\xE3o reduza o nicho "no limite"]'
      },
      restricoes: {
        quando_nao_aplicar: "Fornos de piso (n\xE3o embutidos) seguem regra pr\xF3pria de instala\xE7\xE3o e n\xE3o usam nicho de marcenaria da mesma forma.",
        limitacoes: "Em torres muito baixas (cozinhas com p\xE9-direito reduzido), pode ser necess\xE1rio abrir m\xE3o do micro-ondas acima do forno para manter a ergonomia de altura."
      },
      acoes_recomendadas: "Posicionar o forno na parte inferior da torre quente e o micro-ondas acima, na altura dos olhos \u2014 composi\xE7\xE3o mais comum do mercado.",
      motivo_tecnico: "O forno de embutir deve ter folga de 5 a 10 cm no fundo do nicho para ventila\xE7\xE3o, e ser posicionado de forma que a base fique entre 60 e 90 cm do piso (ou o centro do forno entre 90 e 110 cm), evitando que o usu\xE1rio precise se curvar excessivamente. [cf. Para evitar o superaquecimento, \xE9 recomendado deixar uma folga de 5 a 10 cent\xEDmetros no fundo e uma altura total de 90 cent\xEDmetros a partir do ch\xE3o] [cf. O centro do forno el\xE9trico deve estar posicionado a uma altura entre 90 cm e 110 cm do piso]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "FAQ Black Pilado; O M\xF3vel (guia de torre quente 2025).",
      fabricante: "Refer\xEAncia geral (Fischer, Brastemp, Electrolux).",
      observacoes: "Complementa diretamente as regras da se\xE7\xE3o 5 (Torre Quente). ---",
      tags: [
        "cozinhas",
        "forno",
        "embutir",
        "folga",
        "ventila\xE7\xE3o",
        "ergonomia",
        "altura"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_micro_ondas_e_torre_quente_altura_ergonomica_do_micro_ondas_embutido",
      entidade: "MICRO-ONDAS E TORRE QUENTE",
      categoria: "Cozinhas",
      subcategoria: "MICRO-ONDAS E TORRE QUENTE",
      titulo: "Altura ergon\xF4mica do micro-ondas embutido",
      tipo: "recomendacao",
      descricao: "O micro-ondas embutido deve ficar posicionado de forma que o painel/linha de vis\xE3o fique pr\xF3xima \xE0 altura dos olhos do usu\xE1rio principal, evitando que ele precise se curvar (risco de queimadura ao retirar l\xEDquidos quentes) ou se esticar. Na pr\xE1tica, isso costuma corresponder a uma faixa de 120 a 150 cm do piso at\xE9 o centro do aparelho. [cf. A altura ideal para o forno costuma ficar entre 60 e 70 cm do ch\xE3o, enquanto o micro-ondas pode ir mais alto, entre 120 e 140 cm] [cf. A Electrolux recomenda instalar o microondas de embutir na altura dos olhos do usu\xE1rio, com a linha de vis\xE3o nivelada ao painel de controle; na pr\xE1tica, para uma pessoa de 1,65 m a 1,75 m de altura, isso significa que a base do nicho fica entre 1,20 m e 1,40 m do ch\xE3o]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de torre quente ou nicho isolado para micro-ondas de embutir.",
        condicoes_adicionais: "Se o micro-ondas dividir a mesma torre com o forno el\xE9trico, cada equipamento precisa de sa\xEDda de ar independente, para n\xE3o haver transfer\xEAncia de calor entre eles. [cf. Se o micro-ondas ficar no mesmo m\xF3vel do forno el\xE9trico, preveja duas sa\xEDdas de ar independentes \u2014 uma para cada nicho \u2014, evitando transfer\xEAncia de calor entre os eletros e poss\xEDveis preju\xEDzos ao desempenho]"
      },
      restricoes: {
        quando_nao_aplicar: "Micro-ondas de bancada (n\xE3o embutido) n\xE3o segue esta regra de nicho, mas ainda deve respeitar boa ergonomia de uso.",
        limitacoes: "Em fam\xEDlias com usu\xE1rios de estaturas muito diferentes (ex.: cadeira de rodas, crian\xE7as), a altura de refer\xEAncia deve ser reavaliada \u2014 considerar quem mais usa o aparelho como refer\xEAncia principal."
      },
      acoes_recomendadas: "Instala\xE7\xE3o em arm\xE1rio baixo com prateleira deslizante, quando n\xE3o h\xE1 espa\xE7o vertical para torre quente \u2014 solu\xE7\xE3o menos ergon\xF4mica, mas vi\xE1vel em reformas.",
      motivo_tecnico: "O micro-ondas embutido deve ficar posicionado de forma que o painel/linha de vis\xE3o fique pr\xF3xima \xE0 altura dos olhos do usu\xE1rio principal, evitando que ele precise se curvar (risco de queimadura ao retirar l\xEDquidos quentes) ou se esticar. Na pr\xE1tica, isso costuma corresponder a uma faixa de 120 a 150 cm do piso at\xE9 o centro do aparelho. [cf. A altura ideal para o forno costuma ficar entre 60 e 70 cm do ch\xE3o, enquanto o micro-ondas pode ir mais alto, entre 120 e 140 cm] [cf. A Electrolux recomenda instalar o microondas de embutir na altura dos olhos do usu\xE1rio, com a linha de vis\xE3o nivelada ao painel de controle; na pr\xE1tica, para uma pessoa de 1,65 m a 1,75 m de altura, isso significa que a base do nicho fica entre 1,20 m e 1,40 m do ch\xE3o]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Antonietta SP (guia t\xE9cnico); Montador Local (guia de nicho de micro-ondas); Fischer (blog institucional).",
      fabricante: "Electrolux (recomenda\xE7\xE3o expl\xEDcita de altura dos olhos), Fischer.",
      observacoes: "Nunca instalar micro-ondas diretamente sobre forno el\xE9trico convencional sem isolamento \u2014 o calor do forno pode danificar a base do micro-ondas. [cf. Nunca coloque o microondas sobre o forno el\xE9trico comum. O calor do forno derrete a parte de baixo do microondas] ---",
      tags: [
        "cozinhas",
        "micro",
        "ondas",
        "torre",
        "quente",
        "altura",
        "ergon\xF4mica",
        "embutido"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_micro_ondas_e_torre_quente_dimensoes_padrao_do_nicho_da_torre_quente",
      entidade: "MICRO-ONDAS E TORRE QUENTE",
      categoria: "Cozinhas",
      subcategoria: "MICRO-ONDAS E TORRE QUENTE",
      titulo: "Dimens\xF5es-padr\xE3o do nicho da torre quente",
      tipo: "recomendacao",
      descricao: "O mercado brasileiro convergiu para um nicho de largura padr\xE3o de 60 cm (com varia\xE7\xE3o para 76 cm em fornos de c\xE2mara maior), profundidade de 60 a 70 cm (60 cm sendo o m\xEDnimo absoluto, com 5 a 10 cm extras recomendados para ventila\xE7\xE3o e passagem de fia\xE7\xE3o) e altura total de coluna entre 2,10 m e 2,40 m. [cf. As medidas padr\xE3o de uma torre quente em cozinha planejada seguem as larguras de 60 cm e 76 cm para os equipamentos de embutir; m\xF3dulos de marcenaria padr\xE3o t\xEAm 60 cm de profundidade, mas a maioria dos fornos de embutir tem entre 55 cm e 58 cm de profundidade] [cf. O recomendado por 99% dos fabricantes de m\xF3veis e eletrodom\xE9sticos \xE9 trabalhar com uma profundidade de 65 cm a 70 cm; esses 5-10 cm extras s\xE3o o espa\xE7o para o respiro traseiro]",
      condicoes: {
        quando_aplicar: "Projeto de qualquer torre quente nova, com forno + micro-ondas (e opcionalmente gaveta aquecida).",
        condicoes_adicionais: "Confirmar profundidade real do forno escolhido antes de fechar o gabinete \u2014 modelos de mesma largura nominal podem ter profundidades diferentes entre marcas. [cf. Um forno de 60 cm de largura de uma marca pode ter profundidade diferente de outro da mesma largura de outra marca]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o aplic\xE1vel a cozinhas sem torre quente (forno de piso tradicional).",
        limitacoes: "A folga extra de profundidade (65\u201370 cm vs. 60 cm) consome espa\xE7o de circula\xE7\xE3o em cozinhas estreitas."
      },
      acoes_recomendadas: "Gaveta t\xE9rmica na base da torre, abaixo do forno, quando h\xE1 espa\xE7o vertical sobrando.",
      motivo_tecnico: "O mercado brasileiro convergiu para um nicho de largura padr\xE3o de 60 cm (com varia\xE7\xE3o para 76 cm em fornos de c\xE2mara maior), profundidade de 60 a 70 cm (60 cm sendo o m\xEDnimo absoluto, com 5 a 10 cm extras recomendados para ventila\xE7\xE3o e passagem de fia\xE7\xE3o) e altura total de coluna entre 2,10 m e 2,40 m. [cf. As medidas padr\xE3o de uma torre quente em cozinha planejada seguem as larguras de 60 cm e 76 cm para os equipamentos de embutir; m\xF3dulos de marcenaria padr\xE3o t\xEAm 60 cm de profundidade, mas a maioria dos fornos de embutir tem entre 55 cm e 58 cm de profundidade] [cf. O recomendado por 99% dos fabricantes de m\xF3veis e eletrodom\xE9sticos \xE9 trabalhar com uma profundidade de 65 cm a 70 cm; esses 5-10 cm extras s\xE3o o espa\xE7o para o respiro traseiro]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "O M\xF3vel (dois artigos t\xE9cnicos sobre torre quente); Arch Trends.",
      fabricante: "Refer\xEAncia de mercado geral (padr\xE3o brasileiro de 60 cm).",
      observacoes: "Esta regra deve ser vinculada, no motor de regras, \xE0 mesma tabela de compatibilidade de modelos citada no item 4.1. ---",
      tags: [
        "cozinhas",
        "micro",
        "ondas",
        "torre",
        "quente",
        "dimens\xF5es",
        "padr\xE3o",
        "nicho"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_coifa_exaustor_altura_da_coifa_sobre_o_cooktop_fogao",
      entidade: "COIFA / EXAUSTOR",
      categoria: "Cozinhas",
      subcategoria: "COIFA / EXAUSTOR",
      titulo: "Altura da coifa sobre o cooktop/fog\xE3o",
      tipo: "restricao",
      descricao: "A dist\xE2ncia entre a base da coifa e a boca do fog\xE3o/cooktop deve ficar entre 65 e 75 cm para combust\xE3o a g\xE1s, e entre 50 e 65 cm para cooktop el\xE9trico/indu\xE7\xE3o (sem chama viva). [cf. A dist\xE2ncia m\xEDnima entre a parte inferior da Coifa e os queimadores do fog\xE3o/cooktop deve ser de 65 cm para fog\xE3o/cooktop a g\xE1s e 50 cm para fog\xE3o/cooktop el\xE9trico \u2014 se o manual pedir uma dist\xE2ncia maior, siga as recomenda\xE7\xF5es do fabricante] [cf. Fog\xE3o ou cooktop a g\xE1s: 65\u201375 cm para coifa; cooktop el\xE9trico/indu\xE7\xE3o: 55\u201365 cm para coifa, visto que a chama n\xE3o existe]",
      condicoes: {
        quando_aplicar: "Instala\xE7\xE3o de qualquer coifa de parede ou de ilha sobre fog\xE3o/cooktop.",
        condicoes_adicionais: "Se o cooktop tiver tampa de vidro, medir a dist\xE2ncia com o vidro aberto, pois a altura efetiva de queima muda. [cf. Se o seu fog\xE3o/cooktop tiver tamp\xE3o de vidro, \xE9 recomend\xE1vel que se verifique a dist\xE2ncia entre a coifa e o fog\xE3o com o vidro do tamp\xE3o aberto, pois a altura de cada fog\xE3o/cooktop pode variar] Nunca ultrapassar 80 cm de dist\xE2ncia m\xE1xima \u2014 acima disso a efici\xEAncia de capta\xE7\xE3o cai drasticamente. [cf. Se voc\xEA estiver se perguntando qual \xE9 a dist\xE2ncia m\xE1xima permitida entre o fog\xE3o e a coifa, saiba que o recomendado \xE9 nunca ultrapassar 80 cm; isso ocorre porque, acima dessa dist\xE2ncia, a capacidade da coifa de captar fuma\xE7a e odores diminui drasticamente]"
      },
      restricoes: {
        quando_nao_aplicar: "Regra n\xE3o se aplica a depuradores em modo recircula\xE7\xE3o sem capta\xE7\xE3o direta de chama (nesse caso, reduzir a faixa em 3\u20135 cm \xE9 aceit\xE1vel), nem a coifas industriais de cozinha profissional, que seguem norma pr\xF3pria.",
        limitacoes: "A vaz\xE3o (m\xB3/h) da coifa tamb\xE9m influencia a dist\xE2ncia ideal \u2014 coifas de maior vaz\xE3o toleram dist\xE2ncias um pouco maiores. [cf. Quanto maior a vaz\xE3o (m\xB3/h), maior pode ser a dist\xE2ncia sem perder efici\xEAncia: coifa at\xE9 450 m\xB3/h: 65\u201368 cm; coifa 451\u2013650 m\xB3/h: 68\u201372 cm; coifa 651\u2013800 m\xB3/h: 70\u201375 cm; coifa acima de 800 m\xB3/h: 72\u201378 cm]"
      },
      acoes_recomendadas: "Para coifas de ilha (instala\xE7\xE3o no teto, sem parede de apoio), acrescentar 3\u20135 cm \xE0 faixa padr\xE3o por causa do ar cruzado do ambiente aberto. [cf. Para coifa de ilha, acrescente 3 a 5 cm, justamente por causa do ar cruzado]",
      motivo_tecnico: "A dist\xE2ncia entre a base da coifa e a boca do fog\xE3o/cooktop deve ficar entre 65 e 75 cm para combust\xE3o a g\xE1s, e entre 50 e 65 cm para cooktop el\xE9trico/indu\xE7\xE3o (sem chama viva). [cf. A dist\xE2ncia m\xEDnima entre a parte inferior da Coifa e os queimadores do fog\xE3o/cooktop deve ser de 65 cm para fog\xE3o/cooktop a g\xE1s e 50 cm para fog\xE3o/cooktop el\xE9trico \u2014 se o manual pedir uma dist\xE2ncia maior, siga as recomenda\xE7\xF5es do fabricante] [cf. Fog\xE3o ou cooktop a g\xE1s: 65\u201375 cm para coifa; cooktop el\xE9trico/indu\xE7\xE3o: 55\u201365 cm para coifa, visto que a chama n\xE3o existe]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Brastemp (FAQ oficial); Estrela M\xF3veis (blog t\xE9cnico); Melhores Coifas (comparativo de fabricantes, incluindo Tramontina e Fischer).",
      fabricante: "Tramontina (650\u2013750 mm), Fischer (65\u201380 cm) \u2014 cada fabricante com faixa pr\xF3pria no manual.",
      observacoes: "A largura da coifa deve ser igual ou maior que a largura do cooktop, nunca menor. [cf. A largura da coifa deve ser igual ou maior que o cooktop: 60 cm para at\xE9 4 bocas, 90 cm para 5 e 6 bocas] ---",
      tags: [
        "cozinhas",
        "coifa",
        "exaustor",
        "altura",
        "sobre",
        "cooktop",
        "fog\xE3o"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_lava_loucas_largura_padrao_de_nicho_60_cm_45_cm",
      entidade: "LAVA-LOU\xC7AS",
      categoria: "Cozinhas",
      subcategoria: "LAVA-LOU\xC7AS",
      titulo: "Largura padr\xE3o de nicho (60 cm / 45 cm)",
      tipo: "boa_pratica",
      descricao: "As lava-lou\xE7as de embutir do mercado seguem majoritariamente duas larguras de categoria: 60 cm (padr\xE3o europeu de capacidade plena, 12 a 16 servi\xE7os) e 45 cm (compacta, 8 a 10 servi\xE7os), mas n\xE3o existe uma medida universal \xFAnica \u2014 a ficha t\xE9cnica do modelo espec\xEDfico sempre prevalece. [cf. Lava lou\xE7as de embutir existem em duas larguras padr\xE3o \u2014 45cm e 60cm; modelos de 45cm s\xE3o mais compactos, indicados para cozinhas com espa\xE7o reduzido, enquanto modelos de 60cm seguem o padr\xE3o europeu de capacidade plena]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o do m\xF3dulo de bancada que vai acomodar a lava-lou\xE7as, geralmente ao lado da cuba.",
        condicoes_adicionais: 'O nicho de marcenaria deve ser projetado com a largura correta antes da execu\xE7\xE3o \u2014 a lava-lou\xE7as n\xE3o pode ser "adaptada depois" de a caixaria estar pronta. [cf. O nicho de marcenaria deve ser projetado com a largura correta antes da execu\xE7\xE3o \u2014 n\xE3o pode ser adaptado depois]'
      },
      restricoes: {
        quando_nao_aplicar: "Lava-lou\xE7as de piso (freestanding, n\xE3o embutida) n\xE3o exige nicho dedicado, apenas espa\xE7o com acesso a hidr\xE1ulica e el\xE9trica.",
        limitacoes: 'Modelos "de revestir" (que recebem painel igual \xE0 marcenaria) t\xEAm exig\xEAncias dimensionais adicionais para a espessura do painel frontal.'
      },
      acoes_recomendadas: 'Modelo "de embutir" convencional, com painel/acabamento pr\xF3prio (mais simples de especificar do que o modelo de revestir).',
      motivo_tecnico: "As lava-lou\xE7as de embutir do mercado seguem majoritariamente duas larguras de categoria: 60 cm (padr\xE3o europeu de capacidade plena, 12 a 16 servi\xE7os) e 45 cm (compacta, 8 a 10 servi\xE7os), mas n\xE3o existe uma medida universal \xFAnica \u2014 a ficha t\xE9cnica do modelo espec\xEDfico sempre prevalece. [cf. Lava lou\xE7as de embutir existem em duas larguras padr\xE3o \u2014 45cm e 60cm; modelos de 45cm s\xE3o mais compactos, indicados para cozinhas com espa\xE7o reduzido, enquanto modelos de 60cm seguem o padr\xE3o europeu de capacidade plena]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Casacomc\xEA (especifica\xE7\xF5es t\xE9cnicas); Lavadora Boa (guia de nicho); Melhor Lava-lou\xE7a (guia de escolha).",
      fabricante: 'Bertazzoni, Gorenje (linhas "de revestir" citadas como refer\xEAncia).',
      observacoes: 'Ventila\xE7\xE3o e respiro frontal s\xE3o obrigat\xF3rios mesmo em modelo embutido \u2014 nunca obstruir o rodap\xE9/base do m\xF3vel. [cf. Ventila\xE7\xE3o e respiro frontal: a m\xE1quina precisa "respirar". Deixe folga m\xEDnima indicada no manual e n\xE3o obstrua o rodap\xE9] ---',
      tags: [
        "cozinhas",
        "lava",
        "lou\xE7as",
        "largura",
        "padr\xE3o",
        "nicho"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_lava_loucas_folga_traseira_e_ponto_eletrico_dedicado",
      entidade: "LAVA-LOU\xC7AS",
      categoria: "Cozinhas",
      subcategoria: "LAVA-LOU\xC7AS",
      titulo: "Folga traseira e ponto el\xE9trico dedicado",
      tipo: "boa_pratica",
      descricao: "A dist\xE2ncia entre a parede e a parte traseira da lava-lou\xE7as deve ser de, no m\xEDnimo, 5 cm para ventila\xE7\xE3o adequada, com folga lateral entre m\xF3dulos de 0,5 a 0,8 cm. [cf. A dist\xE2ncia entre a parede e a parede traseira da m\xE1quina de lavar lou\xE7a deve ser de pelo menos 5 cm, o que garantir\xE1 uma ventila\xE7\xE3o normal; \xE9 necess\xE1rio deixar um pequeno espa\xE7o de 0,5 a 0,8 cm entre as paredes do conjunto de arm\xE1rios]",
      condicoes: {
        quando_aplicar: "Todo projeto de m\xF3dulo de bancada com lava-lou\xE7as embutida.",
        condicoes_adicionais: 'Prever ponto el\xE9trico exclusivo (voltagem compat\xEDvel, aterramento) e entrada de \xE1gua fria dedicada; verificar posi\xE7\xE3o do sif\xE3o para evitar dobras excessivas na tubula\xE7\xE3o de sa\xEDda. [cf. Voltagem (110/220 V) e ponto el\xE9trico dedicado, com aterramento; verifique a dist\xE2ncia at\xE9 o sif\xE3o e o retorno do esgoto (sem "joelhos" desnecess\xE1rios)]'
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 exce\xE7\xE3o conhecida \u2014 folga de ventila\xE7\xE3o traseira \xE9 universal para este tipo de equipamento.",
        limitacoes: "Instala\xE7\xE3o retroativa (depois da marcenaria pronta) \xE9 significativamente mais dif\xEDcil e cara do que planejar desde o in\xEDcio."
      },
      acoes_recomendadas: "N/A \u2014 infraestrutura hidr\xE1ulica/el\xE9trica \xE9 pr\xE9-requisito, n\xE3o alternativa.",
      motivo_tecnico: "A dist\xE2ncia entre a parede e a parte traseira da lava-lou\xE7as deve ser de, no m\xEDnimo, 5 cm para ventila\xE7\xE3o adequada, com folga lateral entre m\xF3dulos de 0,5 a 0,8 cm. [cf. A dist\xE2ncia entre a parede e a parede traseira da m\xE1quina de lavar lou\xE7a deve ser de pelo menos 5 cm, o que garantir\xE1 uma ventila\xE7\xE3o normal; \xE9 necess\xE1rio deixar um pequeno espa\xE7o de 0,5 a 0,8 cm entre as paredes do conjunto de arm\xE1rios]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "alto",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guide Washerhouse (comparativo t\xE9cnico internacional); Melhor Lava-lou\xE7a.",
      fabricante: "N/A (regra geral de instala\xE7\xE3o).",
      observacoes: 'Regra deve ser vinculada ao m\xF3dulo de "produ\xE7\xE3o" do Planne \u2014 infraestrutura el\xE9trica/hidr\xE1ulica precisa estar marcada na planta antes do plano de corte ser fechado. ---',
      tags: [
        "cozinhas",
        "lava",
        "lou\xE7as",
        "folga",
        "traseira",
        "ponto",
        "el\xE9trico",
        "dedicado"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_cubas_e_pia_compatibilidade_cuba_x_largura_de_bancada",
      entidade: "CUBAS E PIA",
      categoria: "Cozinhas",
      subcategoria: "CUBAS E PIA",
      titulo: "Compatibilidade cuba x largura de bancada",
      tipo: "recomendacao",
      descricao: "O tamanho da cuba deve ser proporcional \xE0 largura da bancada dispon\xEDvel: cubas compactas (40\xD734 cm) para pias de apoio ou espa\xE7os reduzidos; cuba padr\xE3o (50\xD740 cm) para bancadas residenciais comuns; cubas duplas (80\u2013110 cm de comprimento total) para bancadas maiores. [cf. Compactas (40\xD734 cm ou 44\xD744 cm): perfeitas para pias de apoio, \xE1reas gourmet reduzidas; padr\xE3o intermedi\xE1rio (50\xD740 cm): a medida de maior volume de comercializa\xE7\xE3o; as medidas padr\xE3o para cubas duplas costumam variar entre 80 cm e 110 cm de comprimento total]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o do recorte de bancada (pedra/granito/quartzo) em conjunto com o gabinete inferior que a sustenta.",
        condicoes_adicionais: "Cuba n\xBA1 recomendada para bancadas de 1,20\u20131,50 m de largura; para bancadas de 1,80\u20132,00 m, considerar cuba maior ou dupla. [cf. A cuba N\xBA 1 \xE9 recomendada para bancadas que t\xEAm de 1,20 a 1,50 m de largura]"
      },
      restricoes: {
        quando_nao_aplicar: 'Cubas integradas (moldadas na pr\xF3pria bancada) n\xE3o seguem esta l\xF3gica de "cuba avulsa cortada no tampo" \u2014 s\xE3o fabricadas sob medida junto com a pedra.',
        limitacoes: "Cubas muito grandes em bancadas pequenas reduzem a \xE1rea \xFAtil de trabalho e podem comprometer a integridade estrutural do tampo ao redor do recorte. [cf. O tamanho da cozinha limita a escolha da cuba de inox, uma vez que modelos excessivamente grandes em bancadas pequenas reduzem a \xE1rea \xFAtil de trabalho e podem comprometer a estrutura da pedra]"
      },
      acoes_recomendadas: "Cuba redonda como op\xE7\xE3o de apoio em espa\xE7os gourmet reduzidos. [cf. Para espa\xE7os gourmet ou \xE1reas pequenas, a cuba redonda \xE9 a mais indicada, j\xE1 que serve como apoio]",
      motivo_tecnico: "O tamanho da cuba deve ser proporcional \xE0 largura da bancada dispon\xEDvel: cubas compactas (40\xD734 cm) para pias de apoio ou espa\xE7os reduzidos; cuba padr\xE3o (50\xD740 cm) para bancadas residenciais comuns; cubas duplas (80\u2013110 cm de comprimento total) para bancadas maiores. [cf. Compactas (40\xD734 cm ou 44\xD744 cm): perfeitas para pias de apoio, \xE1reas gourmet reduzidas; padr\xE3o intermedi\xE1rio (50\xD740 cm): a medida de maior volume de comercializa\xE7\xE3o; as medidas padr\xE3o para cubas duplas costumam variar entre 80 cm e 110 cm de comprimento total]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "ABL Inox (dois artigos t\xE9cnicos); Leroy Merlin (guia de produto); Telhanorte (blog institucional).",
      fabricante: "Tramontina (linha Lav\xEDnia, citada como refer\xEAncia de mercado).",
      observacoes: "Sempre comprar a cuba antes de finalizar o recorte da pedra \u2014 o recorte deve ser feito com base nas medidas reais da cuba escolhida, n\xE3o o inverso. [cf. Caso voc\xEA ainda n\xE3o tenha a pedra da bancada da cozinha, o ideal \xE9 comprar a cuba antes e depois entreg\xE1-la para o profissional que far\xE1 o recorte] ---",
      tags: [
        "cozinhas",
        "cubas",
        "compatibilidade",
        "cuba",
        "largura",
        "bancada"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_cubas_e_pia_profundidade_da_cuba_x_ergonomia",
      entidade: "CUBAS E PIA",
      categoria: "Cozinhas",
      subcategoria: "CUBAS E PIA",
      titulo: "Profundidade da cuba x ergonomia",
      tipo: "boa_pratica",
      descricao: "A profundidade da cuba (n\xE3o confundir com profundidade da bancada) deve ficar entre 17 e 20 cm para equilibrar conforto ergon\xF4mico e redu\xE7\xE3o de respingos durante a lavagem. [cf. A profundidade entre 17 cm e 20 cm oferece o melhor equil\xEDbrio entre conforto ergon\xF4mico e a redu\xE7\xE3o de respingos durante a lavagem]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o da cuba em qualquer projeto de cozinha.",
        condicoes_adicionais: "Considerar tamb\xE9m a altura da bancada (item 9) em conjunto com a profundidade da cuba \u2014 bancada alta + cuba profunda pode dificultar o alcance ao fundo."
      },
      restricoes: {
        quando_nao_aplicar: 'Cubas "gourmet" ou industriais, voltadas a imers\xE3o de panelas grandes, podem justificar maior profundidade \u2014 nesse caso a ergonomia cede espa\xE7o \xE0 funcionalidade espec\xEDfica.',
        limitacoes: "Cubas muito profundas obrigam o usu\xE1rio a se curvar mais, gerando desconforto lombar em uso prolongado."
      },
      acoes_recomendadas: "Cuba mais rasa combinada com bancada ligeiramente mais baixa, quando o usu\xE1rio principal for de estatura menor.",
      motivo_tecnico: "A profundidade da cuba (n\xE3o confundir com profundidade da bancada) deve ficar entre 17 e 20 cm para equilibrar conforto ergon\xF4mico e redu\xE7\xE3o de respingos durante a lavagem. [cf. A profundidade entre 17 cm e 20 cm oferece o melhor equil\xEDbrio entre conforto ergon\xF4mico e a redu\xE7\xE3o de respingos durante a lavagem]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "m\xE9dio",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "ABL Inox.",
      fabricante: "N/A.",
      observacoes: "Regra pouco discutida na literatura de marcenaria, mas relevante para composi\xE7\xE3o do perfil ergon\xF4mico do usu\xE1rio principal, cruzando com os dados de estatura j\xE1 usados na regra de arm\xE1rios a\xE9reos (item 10). ---",
      tags: [
        "cozinhas",
        "cubas",
        "profundidade",
        "cuba",
        "ergonomia"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_bancadas_altura_ergonomica_altura_padrao_da_bancada_de_trabalho",
      entidade: "BANCADAS (altura ergon\xF4mica)",
      categoria: "Cozinhas",
      subcategoria: "BANCADAS (altura ergon\xF4mica)",
      titulo: "Altura padr\xE3o da bancada de trabalho",
      tipo: "regra_obrigatoria",
      descricao: "A altura padr\xE3o de bancada de cozinha no Brasil varia entre 85 e 95 cm do piso at\xE9 a superf\xEDcie da pedra (medida j\xE1 incluindo a espessura do tampo), calibrada para atender a m\xE9dia de altura da popula\xE7\xE3o. [cf. No Brasil, a altura padr\xE3o de bancada de cozinha varia entre 85 cm e 95 cm (do piso at\xE9 a superf\xEDcie da pedra); a medida j\xE1 inclui a espessura do tampo e foi definida para atender \xE0 m\xE9dia de altura da popula\xE7\xE3o] A refer\xEAncia mais precisa \xE9 calcular 10\u201315 cm abaixo da altura do cotovelo do usu\xE1rio principal. [cf. A medida mais ergon\xF4mica \xE9 cerca de 10 a 15 cm abaixo da altura do cotovelo do usu\xE1rio principal]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o da altura de qualquer m\xF3dulo de bancada de cozinha, sempre no in\xEDcio do projeto.",
        condicoes_adicionais: "Personalizar para usu\xE1rios mais altos (95\u2013100 cm) ou mais baixos (85\u201390 cm); considerar altura reduzida (76\u201380 cm) em trecho dedicado a sovar/abrir massas. [cf. Pessoas mais altas: bancadas entre 95 cm e 100 cm aumentam o conforto; para quem gosta de sovar massas ou abrir massas finas, recomenda-se uma altura em torno de 76\u201380 cm]"
      },
      restricoes: {
        quando_nao_aplicar: "Bancadas de bar/cozinha americana integrada, que seguem altura pr\xF3pria de ~110 cm para uso com banquetas altas. [cf. Em cozinhas integradas, a altura de bancada de cozinha americana costuma ser de 110 cm]",
        limitacoes: "Em cozinhas com m\xFAltiplos usu\xE1rios de estaturas muito diferentes, uma \xFAnica altura de bancada sempre representar\xE1 uma solu\xE7\xE3o de compromisso."
      },
      acoes_recomendadas: "Bancadas de duas alturas na mesma cozinha (ex.: 90 cm para coc\xE7\xE3o/lavagem + 80 cm para preparo de massas), quando o layout permitir.",
      motivo_tecnico: "A altura padr\xE3o de bancada de cozinha no Brasil varia entre 85 e 95 cm do piso at\xE9 a superf\xEDcie da pedra (medida j\xE1 incluindo a espessura do tampo), calibrada para atender a m\xE9dia de altura da popula\xE7\xE3o. [cf. No Brasil, a altura padr\xE3o de bancada de cozinha varia entre 85 cm e 95 cm (do piso at\xE9 a superf\xEDcie da pedra); a medida j\xE1 inclui a espessura do tampo e foi definida para atender \xE0 m\xE9dia de altura da popula\xE7\xE3o] A refer\xEAncia mais precisa \xE9 calcular 10\u201315 cm abaixo da altura do cotovelo do usu\xE1rio principal. [cf. A medida mais ergon\xF4mica \xE9 cerca de 10 a 15 cm abaixo da altura do cotovelo do usu\xE1rio principal]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 100,
        base: "norma_oficial"
      },
      fonte: "Planner 5D (guia de medidas); Clique Arquitetura (guia de ergonomia); MDBF (guia pr\xE1tico, citando ABNT NBR 9050 e estudo da UFSC).",
      fabricante: "N/A (medida de projeto, n\xE3o de fabricante espec\xEDfico).",
      observacoes: "Para acessibilidade universal (cadeirantes), a refer\xEAncia muda para os par\xE2metros da NBR 9050, com bancada mais baixa e v\xE3o livre inferior para aproxima\xE7\xE3o frontal. [cf. As medidas necess\xE1rias para a manobra de cadeira de rodas sem deslocamento s\xE3o: para rota\xE7\xE3o de 90\xB0 = 1,20 m x 1,20 m; para rota\xE7\xE3o de 180\xB0 = 1,50 m x 1,20 m] ---",
      tags: [
        "cozinhas",
        "bancadas",
        "altura",
        "ergon\xF4mica",
        "padr\xE3o",
        "bancada",
        "trabalho"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_bancadas_altura_ergonomica_altura_especifica_para_bancada_de_cooktop",
      entidade: "BANCADAS (altura ergon\xF4mica)",
      categoria: "Cozinhas",
      subcategoria: "BANCADAS (altura ergon\xF4mica)",
      titulo: "Altura espec\xEDfica para bancada de cooktop",
      tipo: "boa_pratica",
      descricao: "A altura ideal da bancada onde fica o cooktop situa-se entre 86 e 92 cm, considerando a estatura m\xE9dia dos usu\xE1rios \u2014 uma regra pr\xE1tica \xE9: altura do usu\xE1rio principal \xF7 2, aproximadamente. [cf. A altura ideal para bancada de cooktop \xE9 aquela que une ergonomia, seguran\xE7a e praticidade, normalmente situada entre 86 e 92 cm, considerando a estatura m\xE9dia dos moradores da casa]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o da altura do gabinete que sustenta o cooktop, em conjunto com a espessura do tampo escolhido.",
        condicoes_adicionais: "Descontar a espessura real da pedra escolhida (comumente 2 ou 3 cm) da altura de caixaria \u2014 ex.: usu\xE1rio de 1,70 m \u2192 bancada ideal ~89 cm \u2192 caixaria de marcenaria com 86 cm se a pedra tiver 3 cm. [cf. Imagine que o principal usu\xE1rio da cozinha tenha 1,70 m de altura; a altura ideal da bancada ser\xE1 em torno de 89 cm; se a pedra escolhida tem 3 cm de espessura, a marcenaria deve ser planejada com 86 cm de altura do piso at\xE9 a base do gabinete]"
      },
      restricoes: {
        quando_nao_aplicar: "Ilhas de coc\xE7\xE3o seguem por vezes altura ligeiramente diferente (90 cm \xE9 comum), por n\xE3o terem a limita\xE7\xE3o de alinhamento com arm\xE1rios a\xE9reos adjacentes.",
        limitacoes: "Ignorar a espessura do tampo no c\xE1lculo \xE9 um erro recorrente de projeto que resulta em bancada final mais alta que o planejado."
      },
      acoes_recomendadas: "N/A.",
      motivo_tecnico: "A altura ideal da bancada onde fica o cooktop situa-se entre 86 e 92 cm, considerando a estatura m\xE9dia dos usu\xE1rios \u2014 uma regra pr\xE1tica \xE9: altura do usu\xE1rio principal \xF7 2, aproximadamente. [cf. A altura ideal para bancada de cooktop \xE9 aquela que une ergonomia, seguran\xE7a e praticidade, normalmente situada entre 86 e 92 cm, considerando a estatura m\xE9dia dos moradores da casa]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Ecovet (guia t\xE9cnico de bancada de cooktop).",
      fabricante: "N/A.",
      observacoes: "Esta regra deve estar vinculada, no motor de regras do Planne, \xE0 espessura do material de bancada selecionado pelo usu\xE1rio (input din\xE2mico, n\xE3o fixo). ---",
      tags: [
        "cozinhas",
        "bancadas",
        "altura",
        "ergon\xF4mica",
        "espec\xEDfica",
        "bancada",
        "cooktop"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_armarios_aereos_vao_livre_entre_bancada_e_armario_aereo",
      entidade: "ARM\xC1RIOS A\xC9REOS",
      categoria: "Cozinhas",
      subcategoria: "ARM\xC1RIOS A\xC9REOS",
      titulo: "V\xE3o livre entre bancada e arm\xE1rio a\xE9reo",
      tipo: "boa_pratica",
      descricao: "O espa\xE7o livre entre o topo da bancada e a base do arm\xE1rio a\xE9reo deve ficar entre 50 e 60 cm sobre a \xE1rea de trabalho geral, e entre 65 e 75 cm sobre o fog\xE3o/cooktop (por causa da coifa e do calor). [cf. V\xE3o livre: 55 a 65 cm sobre a bancada da cozinha, 65 a 75 cm sobre o fog\xE3o]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o da altura de instala\xE7\xE3o de qualquer arm\xE1rio a\xE9reo, em conjunto com a altura da bancada (item 9).",
        condicoes_adicionais: "Ajustar o v\xE3o conforme a estatura do usu\xE1rio principal: at\xE9 1,60 m \u2192 v\xE3o de 50\u201353 cm; 1,61\u20131,75 m \u2192 54\u201357 cm; acima de 1,75 m \u2192 58\u201360 cm. [cf. At\xE9 1,60 m: v\xE3o de 50\u201353 cm favorece alcance; entre 1,61 e 1,75 m: 54\u201357 cm equilibra conforto e visual; acima de 1,75 m: 58\u201360 cm reduz inclina\xE7\xE3o do tronco]"
      },
      restricoes: {
        quando_nao_aplicar: "Sobre a geladeira, onde o v\xE3o costuma ser maior e mais vari\xE1vel (30\u201360 cm), dependendo da altura do modelo de geladeira escolhido. [cf. A abertura padr\xE3o para uma geladeira geralmente \xE9 de 90 cm de largura; as alturas variam de 30 cm a 60 cm, dependendo dos arm\xE1rios das paredes e de qu\xE3o grande \xE9 a geladeira]",
        limitacoes: 'Torneiras "gourmet" (bica alta) podem exigir v\xE3o maior (58\u201360 cm) para a porta do a\xE9reo n\xE3o bater na bica quando aberta. [cf. Torneira alta ou gourmet: escolha arejamento de 58\u201360 cm; por conseguinte, a porta n\xE3o encosta na bica]'
      },
      acoes_recomendadas: "Reduzir o v\xE3o para 50\u201353 cm em cozinhas de usu\xE1rios de estatura menor, priorizando alcance sobre volume de armazenamento.",
      motivo_tecnico: "O espa\xE7o livre entre o topo da bancada e a base do arm\xE1rio a\xE9reo deve ficar entre 50 e 60 cm sobre a \xE1rea de trabalho geral, e entre 65 e 75 cm sobre o fog\xE3o/cooktop (por causa da coifa e do calor). [cf. V\xE3o livre: 55 a 65 cm sobre a bancada da cozinha, 65 a 75 cm sobre o fog\xE3o]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Viva Decora; Estrela M\xF3veis; Blog Viiish.",
      fabricante: "N/A.",
      observacoes: "A altura padr\xE3o de instala\xE7\xE3o do a\xE9reo no Brasil (base do arm\xE1rio) costuma ficar pr\xF3xima de 1,50 m do piso, resultado da soma bancada (92 cm) + v\xE3o (58 cm). [cf. No Brasil, a altura padr\xE3o para instala\xE7\xE3o dos arm\xE1rios a\xE9reos \xE9 1,50 m do piso at\xE9 a base do arm\xE1rio] ---",
      tags: [
        "cozinhas",
        "arm\xE1rios",
        "a\xE9reos",
        "livre",
        "bancada",
        "arm\xE1rio",
        "a\xE9reo"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_armarios_aereos_profundidade_do_armario_aereo",
      entidade: "ARM\xC1RIOS A\xC9REOS",
      categoria: "Cozinhas",
      subcategoria: "ARM\xC1RIOS A\xC9REOS",
      titulo: "Profundidade do arm\xE1rio a\xE9reo",
      tipo: "restricao",
      descricao: "A profundidade padr\xE3o de um arm\xE1rio a\xE9reo de cozinha fica entre 30 e 35 cm; para gabinetes que acomodam micro-ondas, a profundidade sobe para 40\u201345 cm; sobre a geladeira, pode chegar a 60 cm. [cf. Os gabinetes a\xE9reos t\xEAm geralmente entre 30 cm a 35 cm de profundidade, exceto para gabinetes de microondas, que t\xEAm de 40 cm a 45 cm de profundidade para acomodar a maioria dos tamanhos de microondas padr\xE3o; os arm\xE1rios colocados acima de uma geladeira tamb\xE9m s\xE3o um pouco mais profundos, tipicamente medindo 60 cm de profundidade]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer m\xF3dulo de arm\xE1rio a\xE9reo, distinguindo uso geral de uso especial (micro-ondas, acima de geladeira).",
        condicoes_adicionais: "Nunca ultrapassar a profundidade da bancada abaixo \u2014 regra pr\xE1tica \xE9 o a\xE9reo n\xE3o avan\xE7ar al\xE9m da linha da bancada (geralmente 60 cm), para n\xE3o interferir na \xE1rea de trabalho. [cf. Uma dica na hora de analisar as medidas \xE9 garantir que o arm\xE1rio a\xE9reo de cozinha n\xE3o ultrapasse a profundidade da bancada (geralmente 60 cm)]"
      },
      restricoes: {
        quando_nao_aplicar: "A\xE9reos decorativos/vitrine (com portas de vidro) podem adotar profundidade menor (20\u201328 cm), priorizando est\xE9tica sobre capacidade de armazenamento.",
        limitacoes: "Profundidade maior que 35 cm em uso geral aumenta risco de o usu\xE1rio bater a cabe\xE7a ao se debru\xE7ar sobre a bancada."
      },
      acoes_recomendadas: "Nicho para micro-ondas separado do restante da fileira de a\xE9reos, com profundidade pr\xF3pria de 40\u201345 cm, evitando estender essa profundidade para os m\xF3dulos vizinhos.",
      motivo_tecnico: "A profundidade padr\xE3o de um arm\xE1rio a\xE9reo de cozinha fica entre 30 e 35 cm; para gabinetes que acomodam micro-ondas, a profundidade sobe para 40\u201345 cm; sobre a geladeira, pode chegar a 60 cm. [cf. Os gabinetes a\xE9reos t\xEAm geralmente entre 30 cm a 35 cm de profundidade, exceto para gabinetes de microondas, que t\xEAm de 40 cm a 45 cm de profundidade para acomodar a maioria dos tamanhos de microondas padr\xE3o; os arm\xE1rios colocados acima de uma geladeira tamb\xE9m s\xE3o um pouco mais profundos, tipicamente medindo 60 cm de profundidade]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "2Quartos (guia de medidas); Madesa (blog institucional).",
      fabricante: "N/A.",
      observacoes: "Regra deve ser vinculada ao item 5.1 (altura do micro-ondas) \u2014 profundidade e altura do nicho de micro-ondas devem ser tratadas como um \xFAnico conjunto de regras no motor do Planne. ---",
      tags: [
        "cozinhas",
        "arm\xE1rios",
        "a\xE9reos",
        "profundidade",
        "arm\xE1rio",
        "a\xE9reo"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_despenseiros_e_armarios_de_coluna_profundidade_e_alinhamento_com_torre_de_ele",
      entidade: "DESPENSEIROS E ARM\xC1RIOS DE COLUNA",
      categoria: "Cozinhas",
      subcategoria: "DESPENSEIROS E ARM\xC1RIOS DE COLUNA",
      titulo: "Profundidade e alinhamento com torre de eletros",
      tipo: "boa_pratica",
      descricao: "Arm\xE1rios de despensa (arm\xE1rios altos de coluna) seguem profundidade padr\xE3o de 60 cm, igual \xE0 da torre quente e dos gabinetes de base \u2014 isso permite que a porta do despenseiro fique nivelada com a porta dos eletros embutidos ao lado, mantendo a linha est\xE9tica cont\xEDnua da parede de arm\xE1rios altos. [cf. A profundidade padr\xE3o dos arm\xE1rios de despensa \xE9 de 60 cm, o que permite o encaixe do forno ou microondas ao lado da despensa, de modo que o revestimento dos aparelhos esteja nivelado nas portas dos arm\xE1rios]",
      condicoes: {
        quando_aplicar: "Sempre que um despenseiro for posicionado ao lado de uma torre quente ou coluna de refrigera\xE7\xE3o, na mesma parede.",
        condicoes_adicionais: "Verificar a profundidade real do forno/geladeira escolhidos \u2014 a diferen\xE7a entre a profundidade do equipamento e a profundidade nominal do gabinete de 60 cm deve ser absorvida pela caixaria (fundo falso), n\xE3o pela porta."
      },
      restricoes: {
        quando_nao_aplicar: "Despenseiros isolados, sem torre de eletros ao lado, podem adotar profundidade reduzida (45\u201355 cm) para economizar espa\xE7o, sem preju\xEDzo est\xE9tico.",
        limitacoes: 'Despenseiros muito profundos (60 cm) dificultam o acesso a itens no fundo das prateleiras \u2014 compensar com prateleiras deslizantes ou puxadores tipo "carrossel"/cesto extra\xEDvel.'
      },
      acoes_recomendadas: "Puxadores telesc\xF3picos e cestos aramados de extra\xE7\xE3o total, para compensar a perda de acessibilidade em m\xF3dulos profundos.",
      motivo_tecnico: "Arm\xE1rios de despensa (arm\xE1rios altos de coluna) seguem profundidade padr\xE3o de 60 cm, igual \xE0 da torre quente e dos gabinetes de base \u2014 isso permite que a porta do despenseiro fique nivelada com a porta dos eletros embutidos ao lado, mantendo a linha est\xE9tica cont\xEDnua da parede de arm\xE1rios altos. [cf. A profundidade padr\xE3o dos arm\xE1rios de despensa \xE9 de 60 cm, o que permite o encaixe do forno ou microondas ao lado da despensa, de modo que o revestimento dos aparelhos esteja nivelado nas portas dos arm\xE1rios]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "2Quartos (guia de medidas de arm\xE1rios de cozinha).",
      fabricante: "N/A (regra de composi\xE7\xE3o, aplic\xE1vel a qualquer fabricante de ferragem de extra\xE7\xE3o).",
      observacoes: 'Este item se conecta diretamente ao m\xF3dulo "Nichos" e "Prateleiras" do \xEDndice geral do projeto Planne \u2014 recomenda-se trat\xE1-los de forma cruzada no motor de regras. ---',
      tags: [
        "cozinhas",
        "despenseiros",
        "arm\xE1rios",
        "coluna",
        "profundidade",
        "alinhamento",
        "torre",
        "eletros"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_01_boas_praticas_gerais_de_projeto_de_cozinha_regra_de_ouro_escolher_os_eletrodo",
      entidade: "BOAS PR\xC1TICAS GERAIS DE PROJETO DE COZINHA",
      categoria: "Cozinhas",
      subcategoria: "BOAS PR\xC1TICAS GERAIS DE PROJETO DE COZINHA",
      titulo: "Regra de ouro: escolher os eletrodom\xE9sticos antes de fechar a marcenaria",
      tipo: "regra_obrigatoria",
      descricao: "A pr\xE1tica mais repetida entre marceneiros experientes e fabricantes de eletrodom\xE9sticos \xE9: nunca fechar as medidas finais da caixaria antes de o cliente confirmar os modelos exatos de geladeira, forno, cooktop, coifa e lava-lou\xE7as que ser\xE3o usados \u2014 j\xE1 que praticamente nenhum desses equipamentos tem medida verdadeiramente universal entre marcas. [cf. Se a sua cozinha \xE9 planejada e voc\xEA est\xE1 fazendo marcenaria sob medida, o planejamento do nicho \xE9 fundamental; a regra de ouro: escolha a geladeira antes de fechar o projeto do m\xF3vel]",
      condicoes: {
        quando_aplicar: "Em toda venda/projeto de cozinha planejada, como etapa formal antes da libera\xE7\xE3o do plano de corte.",
        condicoes_adicionais: "Documentar formalmente (contrato/ficha t\xE9cnica) os modelos escolhidos antes da produ\xE7\xE3o, com data de confirma\xE7\xE3o \u2014 protege tanto o marceneiro quanto o cliente de diverg\xEAncias futuras."
      },
      restricoes: {
        quando_nao_aplicar: 'N\xE3o h\xE1 exce\xE7\xE3o; mesmo clientes que "ainda n\xE3o decidiram a marca" devem receber ao menos uma faixa de toler\xE2ncia de nicho baseada em um conjunto de modelos pr\xE9-aprovados.',
        limitacoes: "Obriga o processo comercial a incluir uma etapa de especifica\xE7\xE3o t\xE9cnica de eletrodom\xE9sticos, que muitas marcenarias tradicionalmente pulam."
      },
      acoes_recomendadas: "Quando o cliente realmente n\xE3o pode decidir antes da produ\xE7\xE3o, usar a maior toler\xE2ncia de nicho encontrada no mercado para aquela categoria de equipamento, sempre como solu\xE7\xE3o de compromisso, nunca como padr\xE3o recomendado.",
      motivo_tecnico: "A pr\xE1tica mais repetida entre marceneiros experientes e fabricantes de eletrodom\xE9sticos \xE9: nunca fechar as medidas finais da caixaria antes de o cliente confirmar os modelos exatos de geladeira, forno, cooktop, coifa e lava-lou\xE7as que ser\xE3o usados \u2014 j\xE1 que praticamente nenhum desses equipamentos tem medida verdadeiramente universal entre marcas. [cf. Se a sua cozinha \xE9 planejada e voc\xEA est\xE1 fazendo marcenaria sob medida, o planejamento do nicho \xE9 fundamental; a regra de ouro: escolha a geladeira antes de fechar o projeto do m\xF3vel]",
      impacto: {
        estrutural: "alto",
        financeiro: "cr\xEDtico",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Blog institucional Brastemp; padr\xE3o recorrente em m\xFAltiplas fontes consultadas neste m\xF3dulo (fornos, lava-lou\xE7as, geladeiras).",
      fabricante: "N/A (pr\xE1tica de processo, n\xE3o de produto).",
      observacoes: 'Esta \xE9, possivelmente, a regra de maior valor estrat\xE9gico para o "motor de intelig\xEAncia" do Planne: transformar uma boa pr\xE1tica informal de marceneiros experientes em uma trava autom\xE1tica de fluxo de projeto (o sistema n\xE3o libera plano de corte de torre de eletros sem confirma\xE7\xE3o de modelo) seria um diferencial real frente a Promob e Cabinet Vision. --- ## PR\xD3XIMOS PASSOS SUGERIDOS Este m\xF3dulo cobriu **Cozinhas** em profundidade t\xE9cnica, com pesquisa real e formato estruturado completo. Para dar continuidade \xE0 "Wikipedia da Marcenaria" do Planne, sugiro seguirmos, categoria por categoria, na mesma profundidade: 1. **Ferragens** (dobradi\xE7as, corredi\xE7as, puxadores, minifix, cavilhas) \u2014 fabricantes Blum, H\xE4fele, Hettich, Rometal, Domus. 2. **Estrutura** (travamentos, engrossos, tampos, empenamento) \u2014 normas ABNT + boas pr\xE1ticas de fabrica\xE7\xE3o. 3. **Portas e Gavetas** (folgas, recuos, limites de peso e dimens\xE3o). 4. **Materiais** (MDF, MDP, compensado) \u2014 fabricantes Arauco, Duratex, Berneck, Guararapes, Greenplac. 5. **Closets, Banheiros, Escrit\xF3rios** \u2014 mesmo padr\xE3o de profundidade. 6. **Produ\xE7\xE3o, Transporte, Montagem, Economia** \u2014 conhecimento operacional da marcenaria. Cada m\xF3dulo seguir\xE1 o mesmo padr\xE3o: pesquisa real, formato estruturado completo, faixas num\xE9ricas (n\xE3o n\xFAmeros \xFAnicos artificiais), e identifica\xE7\xE3o clara de fonte/fabricante.',
      tags: [
        "cozinhas",
        "boas",
        "pr\xE1ticas",
        "gerais",
        "projeto",
        "cozinha",
        "regra",
        "ouro"
      ],
      modulo_origem: "01-Cozinhas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_regra_de_quantidade_p",
      entidade: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      categoria: "Ferragens",
      subcategoria: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      titulo: "Regra de quantidade por altura de porta",
      tipo: "regra_obrigatoria",
      descricao: "A quantidade m\xEDnima de dobradi\xE7as por porta escala com a altura da folha. Uma refer\xEAncia amplamente usada no setor \xE9: 2 dobradi\xE7as at\xE9 ~600 mm de altura, 3 dobradi\xE7as at\xE9 ~900\u20132000 mm, 4 dobradi\xE7as acima de 2000 mm, chegando a 5 em portas muito altas (~2400 mm). [cf. 2 dobradi\xE7as de gabinete para altura de porta de 600 mm; 3 dobradi\xE7as de gabinete para altura de porta de 900 mm; 4 dobradi\xE7as de gabinete para altura de porta de 2000 mm; 5 dobradi\xE7as de gabinete para altura de porta de 2400 mm] Uma regra pr\xE1tica complementar, comum em manuais de instala\xE7\xE3o, \xE9 usar 3 dobradi\xE7as como padr\xE3o geral (topo, meio, base), independentemente da altura, sempre que a porta tiver mola/fechamento autom\xE1tico. [cf. Em portas de madeira com dispositivos de fechos aut\xF3nomos (molas) devem ser aplicadas pelo menos 3 dobradi\xE7as, independentemente]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de ferragem em qualquer porta de arm\xE1rio, especialmente portas altas (roupeiro, torre, despensa).",
        condicoes_adicionais: 'A dobradi\xE7a central nunca deve ser posicionada apenas para "preencher espa\xE7o" \u2014 ela atua como estabilizadora estrutural, reduzindo o risco de empenamento em portas altas de MDF/MDP. [cf. A dobradi\xE7a central atua como estabilizadora, reduzindo o risco de empenamento em portas altas de MDF/MDP] Posicionamento t\xEDpico de recuo: primeira dobradi\xE7a a ~100 mm do topo, \xFAltima a ~100 mm da base (alguns fabricantes recomendam 150 mm no topo e 200 mm na base), com as intermedi\xE1rias distribu\xEDdas uniformemente. [cf. As dobradi\xE7as s\xE3o distribu\xEDdas com recuo padr\xE3o de ~100 mm das extremidades e espa\xE7amento uniforme entre as intermedi\xE1rias] [cf. Regra geral, aplicam-se 3 dobradi\xE7as: no topo, a 15 cm do topo da porta; em baixo, a 20 cm da base; a do meio \xE9 colocada entre ambas, com igual dist\xE2ncia]'
      },
      restricoes: {
        quando_nao_aplicar: "Portas muito pequenas e leves (nichos decorativos, portas de vidro fino sem peso relevante) podem funcionar com 2 dobradi\xE7as mesmo acima de 600 mm, desde que o peso da folha esteja dentro do limite de carga da dobradi\xE7a escolhida.",
        limitacoes: "Portas mais largas criam maior alavanca sobre as dobradi\xE7as (momento de for\xE7a maior), o que pode exigir uma dobradi\xE7a extra mesmo em alturas moderadas. [cf. Portas mais largas criam maior alavanca, exigindo dobradi\xE7as extras]"
      },
      acoes_recomendadas: "Quando a altura ultrapassa a capacidade padr\xE3o de uma linha de dobradi\xE7as, usar dobradi\xE7as de refor\xE7o espec\xEDficas para porta pesada, em vez de simplesmente aumentar a quantidade indefinidamente.",
      motivo_tecnico: "A quantidade m\xEDnima de dobradi\xE7as por porta escala com a altura da folha. Uma refer\xEAncia amplamente usada no setor \xE9: 2 dobradi\xE7as at\xE9 ~600 mm de altura, 3 dobradi\xE7as at\xE9 ~900\u20132000 mm, 4 dobradi\xE7as acima de 2000 mm, chegando a 5 em portas muito altas (~2400 mm). [cf. 2 dobradi\xE7as de gabinete para altura de porta de 600 mm; 3 dobradi\xE7as de gabinete para altura de porta de 900 mm; 4 dobradi\xE7as de gabinete para altura de porta de 2000 mm; 5 dobradi\xE7as de gabinete para altura de porta de 2400 mm] Uma regra pr\xE1tica complementar, comum em manuais de instala\xE7\xE3o, \xE9 usar 3 dobradi\xE7as como padr\xE3o geral (topo, meio, base), independentemente da altura, sempre que a porta tiver mola/fechamento autom\xE1tico. [cf. Em portas de madeira com dispositivos de fechos aut\xF3nomos (molas) devem ser aplicadas pelo menos 3 dobradi\xE7as, independentemente]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 100,
        base: "norma_oficial"
      },
      fonte: "Venace (guia t\xE9cnico); Modo Criativo/Ploys (calculadora baseada em cat\xE1logos Blum/Hettich); MaxMat (guia de instala\xE7\xE3o); handlie (norma EN 1935).",
      fabricante: "Blum, Hettich (refer\xEAncias de cat\xE1logo citadas pela calculadora Modo Criativo).",
      observacoes: 'A norma europeia EN 1935 (referenciada pela handlie) prev\xEA fatores de corre\xE7\xE3o de peso quando a raz\xE3o altura/largura da porta \xE9 baixa (porta larga e baixa) \u2014 para portas com fator altura/largura \u2265 2, nenhuma corre\xE7\xE3o \xE9 necess\xE1ria; abaixo disso, o peso "efetivo" considerado no dimensionamento da dobradi\xE7a deve ser corrigido para cima. [cf. Quando o factor resultante da divis\xE3o da altura pela largura for igual ou superior a 2 n\xE3o deve ser efectuada nenhuma correc\xE7\xE3o; para portas ou janelas largas, deve-se corrigir a massa a suportar pelas dobradi\xE7as] ---',
      tags: [
        "ferragens",
        "dobradi\xE7as",
        "quantidade",
        "espa\xE7amento",
        "capacidade",
        "carga",
        "regra",
        "altura"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_capacidade_de_carga_p",
      entidade: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      categoria: "Ferragens",
      subcategoria: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      titulo: "Capacidade de carga por peso de porta (tabela por fabricante)",
      tipo: "recomendacao",
      descricao: "Fabricantes de sistemas de eleva\xE7\xE3o/dobradi\xE7a especializados publicam tabelas espec\xEDficas de quantidade por peso de frente, n\xE3o apenas por altura. Um exemplo de cat\xE1logo t\xE9cnico (sistema de dobradi\xE7as para portas elevat\xF3rias) prev\xEA: at\xE9 22 kg de peso de frente \u2192 5 dobradi\xE7as; at\xE9 27 kg \u2192 6 dobradi\xE7as; at\xE9 32 kg \u2192 7 dobradi\xE7as, com aplica\xE7\xE3o testada em 80.000 ciclos de movimento. [cf. Quantidade de dobradi\xE7as / Peso frontal FG (kg): at\xE9 22 \u2192 5; at\xE9 27 \u2192 6; at\xE9 32 \u2192 7. Aplica\xE7\xE3o testada em 80.000 ciclos de movimento]",
      condicoes: {
        quando_aplicar: 'Portas de eleva\xE7\xE3o (sistemas tipo tip-up/lift), portas muito pesadas ou de grande dimens\xE3o, onde a regra gen\xE9rica de "3 dobradi\xE7as" n\xE3o \xE9 suficiente.',
        condicoes_adicionais: "Sempre validar o peso real da frente (incluindo puxador, revestimento e eventuais refor\xE7os) contra a tabela espec\xEDfica do sistema de dobradi\xE7a escolhido \u2014 tabelas de fabricantes diferentes n\xE3o s\xE3o intercambi\xE1veis."
      },
      restricoes: {
        quando_nao_aplicar: "Portas leves residenciais padr\xE3o (MDF de 15\u201318 mm, at\xE9 ~1,20 m de altura) normalmente n\xE3o chegam a esses patamares de peso \u2014 a tabela gen\xE9rica de altura (item 1.1) j\xE1 cobre a maioria dos casos.",
        limitacoes: "Dobradi\xE7as de mola (com sistema de auto-abertura/fechamento tipo CLIP top BLUMOTION) t\xEAm limite de recomenda\xE7\xE3o de teste de recobrimento em frentes muito estreitas (~300 mm de largura livre), n\xE3o sendo recomendada a combina\xE7\xE3o em larguras maiores sem verifica\xE7\xE3o. [cf. Na combina\xE7\xE3o de dobradi\xE7as com mola CLIP top BLUMOTION e CLIP top em frentes com pequena largura livre de aproximadamente 300 mm, recomenda-se um teste de recobrimento; em larguras frontais maiores n\xE3o se recomenda uma combina\xE7\xE3o]"
      },
      acoes_recomendadas: "Uso de pist\xF5es a g\xE1s complementares em portas de eleva\xE7\xE3o muito pesadas, para reduzir a carga efetiva sobre as dobradi\xE7as.",
      motivo_tecnico: "Fabricantes de sistemas de eleva\xE7\xE3o/dobradi\xE7a especializados publicam tabelas espec\xEDficas de quantidade por peso de frente, n\xE3o apenas por altura. Um exemplo de cat\xE1logo t\xE9cnico (sistema de dobradi\xE7as para portas elevat\xF3rias) prev\xEA: at\xE9 22 kg de peso de frente \u2192 5 dobradi\xE7as; at\xE9 27 kg \u2192 6 dobradi\xE7as; at\xE9 32 kg \u2192 7 dobradi\xE7as, com aplica\xE7\xE3o testada em 80.000 ciclos de movimento. [cf. Quantidade de dobradi\xE7as / Peso frontal FG (kg): at\xE9 22 \u2192 5; at\xE9 27 \u2192 6; at\xE9 32 \u2192 7. Aplica\xE7\xE3o testada em 80.000 ciclos de movimento]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Cat\xE1logo t\xE9cnico Blum 2024\u20132025 (publica\xE7\xE3o oficial).",
      fabricante: "Blum.",
      observacoes: "Este tipo de tabela por peso deveria ser tratado, no motor de regras do Planne, como uma tabela param\xE9trica por fabricante/linha de produto \u2014 cada fabricante tem sua pr\xF3pria curva peso \xD7 quantidade, e o sistema idealmente deveria permitir cadastro dessas tabelas por fornecedor. ---",
      tags: [
        "ferragens",
        "dobradi\xE7as",
        "quantidade",
        "espa\xE7amento",
        "capacidade",
        "carga",
        "peso",
        "porta"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_faixas_de_espessura_d",
      entidade: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      categoria: "Ferragens",
      subcategoria: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      titulo: "Faixas de espessura de porta compat\xEDveis",
      tipo: "boa_pratica",
      descricao: "Dobradi\xE7as de copo padr\xE3o (\xD835 mm) atendem uma faixa relativamente estreita de espessura de porta \u2014 exemplos de cat\xE1logo indicam compatibilidade entre 14 e 26 mm, com varia\xE7\xF5es entre 14\u201324 mm dependendo do modelo espec\xEDfico. [cf. Para portas com espessura de 14 a 26 mm. Possibilidade de afina\xE7\xE3o 3D (dobradi\xE7a + cal\xE7o): altura, largura, profundidade]",
      condicoes: {
        quando_aplicar: 'Especifica\xE7\xE3o de dobradi\xE7a para qualquer porta com espessura fora do padr\xE3o "MDF 15 mm" mais comum \u2014 vidro, alum\xEDnio, portas duplas (com friso), portas laminadas de maior espessura.',
        condicoes_adicionais: "Modelos especiais existem para portas finas, com fixa\xE7\xE3o especial (ex.: EXPANDO T), permitindo uso em frentes mais delgadas que o padr\xE3o. [cf. A dobradi\xE7a CLIP top BLUMOTION para portas finas com a fixa\xE7\xE3o especial EXPANDO T e a variante de cor preto-\xF4nix apoiam estas tend\xEAncias em qualidade comprovada]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa desta verifica\xE7\xE3o \u2014 espessura fora da faixa da dobradi\xE7a \xE9 incompatibilidade f\xEDsica direta, n\xE3o uma quest\xE3o de prefer\xEAncia.",
        limitacoes: "Portas de vidro, alum\xEDnio ou com moldura exigem linha de dobradi\xE7a espec\xEDfica \u2014 nem toda dobradi\xE7a de copo para madeira serve para esses materiais. [cf. Nosso programa de dobradi\xE7as oferece possibilidades para muitas aplica\xE7\xF5es diferentes, como portas de madeira, de vidro ou com moldura de alum\xEDnio, portas finas ou espessas]"
      },
      acoes_recomendadas: "Dobradi\xE7as de sistema de fura\xE7\xE3o rasa (11,5 mm de profundidade) para portas a partir de 15 mm quando o espa\xE7o de usinagem \xE9 limitado. [cf. Pouca profundidade de fura\xE7\xE3o (11.5 mm) para portas de m\xF3veis a partir de uma espessura de 15 mm]",
      motivo_tecnico: "Dobradi\xE7as de copo padr\xE3o (\xD835 mm) atendem uma faixa relativamente estreita de espessura de porta \u2014 exemplos de cat\xE1logo indicam compatibilidade entre 14 e 26 mm, com varia\xE7\xF5es entre 14\u201324 mm dependendo do modelo espec\xEDfico. [cf. Para portas com espessura de 14 a 26 mm. Possibilidade de afina\xE7\xE3o 3D (dobradi\xE7a + cal\xE7o): altura, largura, profundidade]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Cat\xE1logos t\xE9cnicos Blum (linhas CLIP top BLUMOTION, X91, M110); O Ferrolho (revenda com especifica\xE7\xF5es de produto).",
      fabricante: "Blum.",
      observacoes: "O motor de regras do Planne deveria validar automaticamente a espessura do material selecionado pelo usu\xE1rio contra a faixa de compatibilidade da dobradi\xE7a escolhida, bloqueando combina\xE7\xF5es incompat\xEDveis antes da gera\xE7\xE3o do plano de corte. ---",
      tags: [
        "ferragens",
        "dobradi\xE7as",
        "quantidade",
        "espa\xE7amento",
        "capacidade",
        "carga",
        "faixas",
        "espessura"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_dobradicas_tipos_e_recobrimento_reta_curva_e_super_curva_semi_sobreposta_embu",
      entidade: "DOBRADI\xC7AS \u2014 TIPOS E RECOBRIMENTO",
      categoria: "Ferragens",
      subcategoria: "DOBRADI\xC7AS \u2014 TIPOS E RECOBRIMENTO",
      titulo: "Reta, Curva e Super Curva (semi-sobreposta / embutida)",
      tipo: "boa_pratica",
      descricao: "O tipo de dobradi\xE7a (reta/sobreposta, curva/semi-sobreposta, super curva/embutida) \xE9 determinado pela posi\xE7\xE3o da porta em rela\xE7\xE3o \xE0 lateral do m\xF3vel: dobradi\xE7a reta para portas que cobrem totalmente a lateral (sobrepostas), curva para portas que dividem a lateral com outra porta (semi-sobreposta), e super curva para portas embutidas dentro do v\xE3o, alinhadas \xE0 lateral. [cf. Reta (sobreposta) \xE9 o padr\xE3o; Curva (semi-sobreposta) e Super Curva (embutida) conforme o projeto e o recobrimento desejado]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de ferragem de qualquer m\xF3dulo com duas ou mais portas na mesma lateral (caso mais comum: arm\xE1rios com portas duplas em um \xFAnico m\xF3dulo compartilhando uma lateral central).",
        condicoes_adicionais: "A escolha errada do tipo de dobradi\xE7a (reta em vez de curva, por exemplo) impede fisicamente a montagem correta ou faz a porta colidir com a porta vizinha ou com a lateral."
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3dulos de porta \xFAnica, onde a porta cobre toda a face frontal, usam exclusivamente dobradi\xE7a reta \u2014 n\xE3o h\xE1 necessidade de avaliar tipo curvo.",
        limitacoes: 'Alguns fabricantes tratam "super curva" como linha de produto separada, com disponibilidade limitada de modelos (menos variantes com amortecedor, cores, etc.) comparado \xE0 linha reta, que \xE9 a mais vendida e mais variada.'
      },
      acoes_recomendadas: "Uso de perfil de alum\xEDnio ou moldura para resolver visualmente o encontro de portas quando o tipo de dobradi\xE7a ideal n\xE3o est\xE1 dispon\xEDvel na cor/linha desejada.",
      motivo_tecnico: "O tipo de dobradi\xE7a (reta/sobreposta, curva/semi-sobreposta, super curva/embutida) \xE9 determinado pela posi\xE7\xE3o da porta em rela\xE7\xE3o \xE0 lateral do m\xF3vel: dobradi\xE7a reta para portas que cobrem totalmente a lateral (sobrepostas), curva para portas que dividem a lateral com outra porta (semi-sobreposta), e super curva para portas embutidas dentro do v\xE3o, alinhadas \xE0 lateral. [cf. Reta (sobreposta) \xE9 o padr\xE3o; Curva (semi-sobreposta) e Super Curva (embutida) conforme o projeto e o recobrimento desejado]",
      impacto: {
        estrutural: "alto",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Modo Criativo/Ploys (calculadora de dobradi\xE7as).",
      fabricante: "Blum, Hettich (nomenclatura similar entre fabricantes, com pequenas varia\xE7\xF5es de nome comercial).",
      observacoes: 'Regra deve ser vinculada, no motor de regras, \xE0 detec\xE7\xE3o autom\xE1tica de m\xF3dulos com portas compartilhando lateral \u2014 o sistema deveria sugerir automaticamente "curva" nesses casos, evitando erro humano recorrente em projetos manuais. ---',
      tags: [
        "ferragens",
        "dobradi\xE7as",
        "tipos",
        "recobrimento",
        "reta",
        "curva",
        "super",
        "semi"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_corredicas_capacidade_de_carga_e_tipos_de_extracao_capacidade_de_carga_por_co",
      entidade: "CORREDI\xC7AS \u2014 CAPACIDADE DE CARGA E TIPOS DE EXTRA\xC7\xC3O",
      categoria: "Ferragens",
      subcategoria: "CORREDI\xC7AS \u2014 CAPACIDADE DE CARGA E TIPOS DE EXTRA\xC7\xC3O",
      titulo: "Capacidade de carga por comprimento/linha de produto",
      tipo: "regra_obrigatoria",
      descricao: "A capacidade de carga de uma corredi\xE7a telesc\xF3pica varia conforme a linha/fabricante, n\xE3o existindo um valor \xFAnico de mercado \u2014 exemplos de cat\xE1logo: corredi\xE7a telesc\xF3pica larga de 250 mm com 30 kg por par; [cf. Capacidade de Carga: Suporta at\xE9 30 kg por par, sendo perfeita para gavetas de utens\xEDlios, escrit\xF3rios ou armazenamento de itens moderadamente pesados] trilho telesc\xF3pico de linha refor\xE7ada com 45 kg de capacidade; [cf. O Trilho Telesc\xF3pico KA 5632 proporciona resist\xEAncia elevada atrav\xE9s da sua estabilidade e maior aproveitamento de espa\xE7o; corredi\xE7a extra\xE7\xE3o total, capacidade de carga 45 kg] corredi\xE7a invis\xEDvel (oculta sob a gaveta) de 550 mm com 30 kg. [cf. A Corredi\xE7a Hettich Quadro V6 550mm Invis\xEDvel... suporta at\xE9 30 kg, garantindo robustez e durabilidade para diversas aplica\xE7\xF5es]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer gaveta, sempre cruzando peso estimado de uso (lou\xE7as, panelas, ferramentas) com a linha de corredi\xE7a escolhida.",
        condicoes_adicionais: 'A capacidade informada \xE9 sempre "por par" (as duas corredi\xE7as da gaveta juntas) \u2014 n\xE3o deve ser somada em dobro nem interpretada como capacidade unit\xE1ria.'
      },
      restricoes: {
        quando_nao_aplicar: 'N\xE3o h\xE1 dispensa \u2014 mesmo gavetas "leves" (roupas, papelaria) devem ter a corredi\xE7a validada contra o peso m\xE1ximo esperado de uso, incluindo o peso pr\xF3prio da caixa da gaveta.',
        limitacoes: "Linhas de corredi\xE7a com sistemas diferentes (vis\xEDvel/lateral vs. invis\xEDvel/oculta sob a gaveta) t\xEAm limites de carga tipicamente na mesma faixa (30 kg), mas a robustez lateral pode diferir \u2014 o sistema oculto tende a ser preferido em projetos de alto padr\xE3o pela est\xE9tica, mas a lateral vis\xEDvel costuma tolerar melhor gavetas muito largas."
      },
      acoes_recomendadas: "Linhas de gaveta com caixa met\xE1lica integrada (tipo Legrabox, Antaro da Blum, ou Innotech da Hettich) para cargas maiores \u2014 capacidade de at\xE9 65 kg em algumas linhas. [cf. Gaveta interna de cozinha Blum Antaro projetado para uma carga de at\xE9 65 kg de peso]",
      motivo_tecnico: "A capacidade de carga de uma corredi\xE7a telesc\xF3pica varia conforme a linha/fabricante, n\xE3o existindo um valor \xFAnico de mercado \u2014 exemplos de cat\xE1logo: corredi\xE7a telesc\xF3pica larga de 250 mm com 30 kg por par; [cf. Capacidade de Carga: Suporta at\xE9 30 kg por par, sendo perfeita para gavetas de utens\xEDlios, escrit\xF3rios ou armazenamento de itens moderadamente pesados] trilho telesc\xF3pico de linha refor\xE7ada com 45 kg de capacidade; [cf. O Trilho Telesc\xF3pico KA 5632 proporciona resist\xEAncia elevada atrav\xE9s da sua estabilidade e maior aproveitamento de espa\xE7o; corredi\xE7a extra\xE7\xE3o total, capacidade de carga 45 kg] corredi\xE7a invis\xEDvel (oculta sob a gaveta) de 550 mm com 30 kg. [cf. A Corredi\xE7a Hettich Quadro V6 550mm Invis\xEDvel... suporta at\xE9 30 kg, garantindo robustez e durabilidade para diversas aplica\xE7\xF5es]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Hettich Brasil (cat\xE1logo institucional); FGVTN (ficha t\xE9cnica de produto); H\xE4fele Brasil (p\xE1gina institucional de corredi\xE7as).",
      fabricante: "Hettich (KA 5632, Quadro V6), H\xE4fele (linha telesc\xF3pica 300\u2013700 mm), FGVTN (H42).",
      observacoes: "A linha H\xE4fele tem capacidade de carga vari\xE1vel conforme o comprimento e o sistema (extra\xE7\xE3o parcial ou total) escolhido \u2014 n\xE3o existe uma \xFAnica tabela peso \xD7 comprimento v\xE1lida para toda a linha, refor\xE7ando a necessidade de cadastro param\xE9trico por fabricante. [cf. A linha de corredi\xE7as telesc\xF3picas H\xE4fele est\xE1 dispon\xEDvel em medidas que v\xE3o de 300 a 700 mm, sendo sua capacidade de carga vari\xE1vel, dependendo do sistema e comprimento escolhido] ---",
      tags: [
        "ferragens",
        "corredi\xE7as",
        "capacidade",
        "carga",
        "tipos",
        "extra\xE7\xE3o",
        "comprimento",
        "linha"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_corredicas_capacidade_de_carga_e_tipos_de_extracao_extracao_total_vs_extracao",
      entidade: "CORREDI\xC7AS \u2014 CAPACIDADE DE CARGA E TIPOS DE EXTRA\xC7\xC3O",
      categoria: "Ferragens",
      subcategoria: "CORREDI\xC7AS \u2014 CAPACIDADE DE CARGA E TIPOS DE EXTRA\xC7\xC3O",
      titulo: "Extra\xE7\xE3o total vs. extra\xE7\xE3o parcial",
      tipo: "boa_pratica",
      descricao: "Corredi\xE7as de extra\xE7\xE3o total permitem acesso completo ao conte\xFAdo da gaveta (a gaveta sai inteiramente do v\xE3o); as de extra\xE7\xE3o parcial deixam parte da gaveta ainda dentro do m\xF3vel quando totalmente aberta. [cf. Gra\xE7as ao sistema de extra\xE7\xE3o total, ela garante acesso livre a todo o conte\xFAdo da gaveta]",
      condicoes: {
        quando_aplicar: "Extra\xE7\xE3o total \xE9 prefer\xEDvel sempre que o fundo da gaveta precisar ser plenamente acess\xEDvel (talheres, utens\xEDlios, itens pequenos que se perdem no fundo); extra\xE7\xE3o parcial \xE9 aceit\xE1vel em gavetas rasas de uso pouco frequente, ou quando o custo precisa ser reduzido.",
        condicoes_adicionais: "Verificar sempre a vida \xFAtil em ciclos declarada pelo fabricante \u2014 uma linha de mercado indica vida \xFAtil de mais de 50 mil ciclos, com certifica\xE7\xE3o europeia de teste (T\xDCV). [cf. Com vida \xFAtil de mais de 50 mil ciclos, esta linha de corredi\xE7a telesc\xF3pica possui certifica\xE7\xE3o europeia, tendo sua qualidade sido comprovada pelo renomado laborat\xF3rio de testes T\xDCV]"
      },
      restricoes: {
        quando_nao_aplicar: "Extra\xE7\xE3o total n\xE3o \xE9 necess\xE1ria em prateleiras deslizantes de uso ocasional (ex.: despensa alta), onde uma extra\xE7\xE3o parcial \xE9 suficiente e mais barata.",
        limitacoes: "Corredi\xE7as de extra\xE7\xE3o total tendem a custar mais e exigir folga lateral um pouco maior no v\xE3o do que as de extra\xE7\xE3o parcial equivalentes."
      },
      acoes_recomendadas: "Sistemas de trava de seguran\xE7a que impedem a queda acidental da gaveta ao ser aberta totalmente, com alavanca de engate r\xE1pido para remo\xE7\xE3o em limpeza \u2014 recurso presente em linhas de extra\xE7\xE3o total de qualidade. [cf. Trava de Seguran\xE7a: Possui sistema de travamento que impede a queda acidental da gaveta ao ser aberta totalmente, al\xE9m de uma alavanca de engate r\xE1pido que facilita a remo\xE7\xE3o da gaveta para limpeza]",
      motivo_tecnico: "Corredi\xE7as de extra\xE7\xE3o total permitem acesso completo ao conte\xFAdo da gaveta (a gaveta sai inteiramente do v\xE3o); as de extra\xE7\xE3o parcial deixam parte da gaveta ainda dentro do m\xF3vel quando totalmente aberta. [cf. Gra\xE7as ao sistema de extra\xE7\xE3o total, ela garante acesso livre a todo o conte\xFAdo da gaveta]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "m\xE9dio",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "FGVTN (ficha t\xE9cnica); H\xE4fele Brasil.",
      fabricante: "FGVTN, H\xE4fele.",
      observacoes: "Esferas de a\xE7o de alta precis\xE3o (rolamentos) s\xE3o o diferencial t\xE9cnico citado repetidamente entre fabricantes premium (Hettich, H\xE4fele) para garantir deslize est\xE1vel, silencioso e sem folgas ao longo da vida \xFAtil. [cf. Rolamentos de Esfera: Equipado com esferas de a\xE7o de alta precis\xE3o que garantem um deslize suave, sem travamentos ou ru\xEDdos met\xE1licos] ---",
      tags: [
        "ferragens",
        "corredi\xE7as",
        "capacidade",
        "carga",
        "tipos",
        "extra\xE7\xE3o",
        "total",
        "parcial"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_puxadores_posicionamento_ergonomico_altura_ideal_do_puxador_em_portas_vertica",
      entidade: "PUXADORES \u2014 POSICIONAMENTO ERGON\xD4MICO",
      categoria: "Ferragens",
      subcategoria: "PUXADORES \u2014 POSICIONAMENTO ERGON\xD4MICO",
      titulo: "Altura ideal do puxador em portas verticais",
      tipo: "recomendacao",
      descricao: "Para puxadores instalados em portas de altura consider\xE1vel (arm\xE1rios, roupeiros), a altura recomendada do centro do puxador fica entre 1,00 m e 1,10 m do piso, faixa que atende \xE0 maior parte dos usu\xE1rios adultos. [cf. Altura ideal do centro do puxador: entre 1,00 m e 1,10 m do piso] Quando o puxador \xE9 um perfil vertical longo (ex.: 60 cm), a pr\xE1tica comum \xE9 centraliz\xE1-lo na altura da pr\xF3pria folha da porta, priorizando o equil\xEDbrio est\xE9tico sobre a altura ergon\xF4mica fixa. [cf. Quando o puxador \xE9 vertical e longo (ex: de 60 cm), pode-se centraliz\xE1-lo na altura da folha da porta para est\xE9tica equilibrada]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de puxador em qualquer porta vertical de arm\xE1rio, roupeiro ou torre.",
        condicoes_adicionais: "Dist\xE2ncia lateral do puxador em rela\xE7\xE3o \xE0 borda da porta gira em torno de 5 cm, como refer\xEAncia de mercado. [cf. A dist\xE2ncia ideal do puxador da porta para sua instala\xE7\xE3o varia, mas geralmente \xE9 posicionado a cerca de 5cm das laterais da porta]"
      },
      restricoes: {
        quando_nao_aplicar: 'Em ambientes infantis, a altura deve ser reduzida para 70\u201385 cm do piso, facilitando o alcance por crian\xE7as. [cf. Em ambientes infantis, o ideal \xE9 instalar os puxadores mais baixos, entre 70 e 85 cm do piso, facilitando o alcance] Em m\xF3veis de quarto infantil, no entanto, h\xE1 uma corrente oposta de boas pr\xE1ticas que recomenda justamente EVITAR puxadores de f\xE1cil alcance, para reduzir o risco de a crian\xE7a usar o puxador como apoio para escalar o m\xF3vel \u2014 nesse caso, a decis\xE3o depende da pol\xEDtica de seguran\xE7a adotada no projeto (ver m\xF3dulo "Closets"/"Seguran\xE7a infantil", a detalhar em rodada futura).',
        limitacoes: "N\xE3o existe uma norma t\xE9cnica \xFAnica e universal (tipo ABNT) fixando essa altura para m\xF3veis residenciais \u2014 os valores citados s\xE3o consolida\xE7\xE3o de boas pr\xE1ticas de mercado, n\xE3o normas regulat\xF3rias obrigat\xF3rias."
      },
      acoes_recomendadas: "Puxadores ocultos/perfil (sistema J-pull ou friso usinado) em portas de correr de vidro, que dispensam totalmente a necessidade de altura de puxador convencional \u2014 vantajoso em espa\xE7os pequenos por n\xE3o exigir v\xE3o de abertura adicional. [cf. Puxadores ocultos em conjunto com portas de correr de vidro s\xE3o uma excelente op\xE7\xE3o, pois n\xE3o exigem espa\xE7o adicional para a abertura, sendo especialmente adequados para apartamentos pequenos]",
      motivo_tecnico: "Para puxadores instalados em portas de altura consider\xE1vel (arm\xE1rios, roupeiros), a altura recomendada do centro do puxador fica entre 1,00 m e 1,10 m do piso, faixa que atende \xE0 maior parte dos usu\xE1rios adultos. [cf. Altura ideal do centro do puxador: entre 1,00 m e 1,10 m do piso] Quando o puxador \xE9 um perfil vertical longo (ex.: 60 cm), a pr\xE1tica comum \xE9 centraliz\xE1-lo na altura da pr\xF3pria folha da porta, priorizando o equil\xEDbrio est\xE9tico sobre a altura ergon\xF4mica fixa. [cf. Quando o puxador \xE9 vertical e longo (ex: de 60 cm), pode-se centraliz\xE1-lo na altura da folha da porta para est\xE9tica equilibrada]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Casual Inox (guia t\xE9cnico); Meu M\xF3vel Planejado (blog institucional).",
      fabricante: "N/A (regra de composi\xE7\xE3o geral, v\xE1lida para qualquer fabricante de puxador em zamac, alum\xEDnio ou a\xE7o inox).",
      observacoes: "Puxadores em zamac (liga de zinco, alum\xEDnio, magn\xE9sio e cobre) s\xE3o citados como op\xE7\xE3o dur\xE1vel e resistente \xE0 corros\xE3o, sendo refer\xEAncia comum de material no mercado nacional de marcenaria planejada. [cf. O puxador zamac \xE9 fabricado a partir de uma liga de zinco, alum\xEDnio, magn\xE9sio e cobre, sendo dur\xE1vel, resistente \xE0 corros\xE3o e oferecendo diversas op\xE7\xF5es] ---",
      tags: [
        "ferragens",
        "puxadores",
        "posicionamento",
        "ergon\xF4mico",
        "altura",
        "ideal",
        "puxador",
        "portas"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_puxadores_posicionamento_ergonomico_posicionamento_de_puxador_em_gavetas",
      entidade: "PUXADORES \u2014 POSICIONAMENTO ERGON\xD4MICO",
      categoria: "Ferragens",
      subcategoria: "PUXADORES \u2014 POSICIONAMENTO ERGON\xD4MICO",
      titulo: "Posicionamento de puxador em gavetas",
      tipo: "boa_pratica",
      descricao: 'Em gavetas, o puxador \xE9 posicionado horizontalmente centralizado na largura da frente, sem uma "altura padr\xE3o" fixa (j\xE1 que a posi\xE7\xE3o vertical \xE9 determinada pela pr\xF3pria altura da frente da gaveta na composi\xE7\xE3o do m\xF3vel).',
      condicoes: {
        quando_aplicar: "Toda especifica\xE7\xE3o de frente de gaveta com puxador aparente (n\xE3o aplic\xE1vel a sistemas com abertura por press\xE3o/tip-on, que dispensam puxador).",
        condicoes_adicionais: "A dist\xE2ncia entre furos do puxador deve ser medida com precis\xE3o contra a especifica\xE7\xE3o do produto antes da compra/fura\xE7\xE3o, para garantir compatibilidade com o gabarito de fura\xE7\xE3o da f\xE1brica. [cf. Disponibilizamos as medidas dos nossos puxadores na descri\xE7\xE3o do produto, para comprar o ideal na sua casa \xE9 essencial que me\xE7a o entre furos da sua porta/gaveta da mesma forma descrita acima]"
      },
      restricoes: {
        quando_nao_aplicar: 'Gavetas com abertura por toque (push-to-open) n\xE3o seguem esta regra \u2014 nesse caso, a "pega" \xE9 feita por um friso ou reentr\xE2ncia usinada na pr\xF3pria frente, n\xE3o por um puxador de ferragem.',
        limitacoes: "Erros de medida na dist\xE2ncia entre furos s\xE3o causa comum de retrabalho (furos vis\xEDveis e n\xE3o aproveitados na frente da gaveta)."
      },
      acoes_recomendadas: 'Puxador tipo "cava" (usinado na pr\xF3pria porta/gaveta com fresa de 45\xB0), que dispensa ferragem de puxador \u2014 comum em projetos minimalistas. [cf. Saiba como fazer puxador cava na altura da porta com fresa de 45 graus e dicas para m\xF3veis sob medida]',
      motivo_tecnico: 'Em gavetas, o puxador \xE9 posicionado horizontalmente centralizado na largura da frente, sem uma "altura padr\xE3o" fixa (j\xE1 que a posi\xE7\xE3o vertical \xE9 determinada pela pr\xF3pria altura da frente da gaveta na composi\xE7\xE3o do m\xF3vel).',
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "m\xE9dio",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Conte\xFAdo institucional de fabricantes de puxador (TikTok/redes sociais de marcas do setor, usado aqui apenas como confirma\xE7\xE3o de pr\xE1tica de mercado, n\xE3o como norma t\xE9cnica formal).",
      fabricante: "N/A.",
      observacoes: "Este item deveria ser tratado no motor de regras como valida\xE7\xE3o cruzada entre o gabarito de fura\xE7\xE3o do puxador escolhido e a geometria da frente (largura m\xEDnima necess\xE1ria para acomodar a dist\xE2ncia entre furos sem comprometer as bordas). ---",
      tags: [
        "ferragens",
        "puxadores",
        "posicionamento",
        "ergon\xF4mico",
        "puxador",
        "gavetas"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_dispositivos_de_montagem_minifix_cavilha_vb_rafix_minifix_castanha_cavilha_fu",
      entidade: "DISPOSITIVOS DE MONTAGEM \u2014 MINIFIX, CAVILHA, VB/RAFIX",
      categoria: "Ferragens",
      subcategoria: "DISPOSITIVOS DE MONTAGEM \u2014 MINIFIX, CAVILHA, VB/RAFIX",
      titulo: "Minifix (castanha) + cavilha: fun\xE7\xE3o e regra de uso conjunto",
      tipo: "regra_obrigatoria",
      descricao: "O minifix (tamb\xE9m chamado de castanha, girofix, tamborfix, rastex ou tambor zamac, dependendo do fabricante) \xE9 um dispositivo de montagem desmont\xE1vel composto por um tambor (que recebe um parafuso de pesco\xE7o alongado) e um parafuso \u2014 permitindo montar e desmontar o m\xF3vel repetidamente sem danificar a madeira. [cf. \xC9 popularmente conhecido como castanha... esse dispositivo garante a fixa\xE7\xE3o de duas pe\xE7as de forma segura; com o minifix, voc\xEA pode montar e desmontar seu m\xF3vel sem danificar a madeira exatamente por ele ser eficiente e projetado com esse prop\xF3sito] Via de regra, o minifix deve ser usado em conjunto com uma ou mais cavilhas (tarugos), que absorvem esfor\xE7os de cisalhamento e impedem a rota\xE7\xE3o/abertura da junta. [cf. Minifix: Dispositivo de montagem utilizado para uni\xE3o de pe\xE7as com press\xE3o no lado esquerdo e direito, e sempre deve ser utilizado em conjunto com cavilhas (tarugos)]",
      condicoes: {
        quando_aplicar: 'Uni\xF5es estruturais desmont\xE1veis entre pain\xE9is de MDF/MDP/compensado \u2014 union de laterais com tampo, fundo, prateleiras fixas \u2014 especialmente em m\xF3veis modulados vendidos "para montar" ou que precisem ser desmontados para mudan\xE7a/transporte.',
        condicoes_adicionais: "A posi\xE7\xE3o do minifix e das cavilhas na pe\xE7a varia conforme a profundidade da pe\xE7a: em pe\xE7as com menos de 120 mm de profundidade, usa-se apenas um minifix a 25 mm da borda e uma cavilha a 25 mm da borda oposta; em pe\xE7as at\xE9 250 mm, um minifix centralizado com duas cavilhas a 40 mm das bordas; em pe\xE7as acima de 250 mm, o minifix a 50 mm das bordas e cavilhas a 100 mm de cada borda. [cf. Em pe\xE7as com menos de 120mm de profundidade \xE9 utilizado apenas um minifix \xE1 25mm da borda e uma cavilha tamb\xE9m a 25mm da borda oposta... em pe\xE7as menores que 250mm... um minifix centralizado e duas cavilhas cada uma a 40mm das bordas... em pe\xE7as maiores que 250mm de profundidade o minifix \xE9 posicionado a 50mm das bordas, e as cavilhas ficam afastadas 100mm de cada borda]"
      },
      restricoes: {
        quando_nao_aplicar: "Uni\xF5es permanentes (que nunca precisar\xE3o ser desmontadas) podem usar sistemas mais simples (cavilha + cola, ou parafuso direto), com custo de ferragem menor.",
        limitacoes: "Erros de alinhamento entre o furo da cavilha e o furo do parafuso/minifix (diverg\xEAncia de centro) s\xE3o um problema recorrente relatado por marceneiros, resultando em abertura vis\xEDvel na junta entre lateral e tampo."
      },
      acoes_recomendadas: "Dispositivo VB/Rafix, que n\xE3o necessita do uso de cavilhas complementares, funcionando como sistema aut\xF4nomo de fixa\xE7\xE3o. [cf. VB: Dispositivo de montagem que n\xE3o necessita o uso de cavilhas]",
      motivo_tecnico: "O minifix (tamb\xE9m chamado de castanha, girofix, tamborfix, rastex ou tambor zamac, dependendo do fabricante) \xE9 um dispositivo de montagem desmont\xE1vel composto por um tambor (que recebe um parafuso de pesco\xE7o alongado) e um parafuso \u2014 permitindo montar e desmontar o m\xF3vel repetidamente sem danificar a madeira. [cf. \xC9 popularmente conhecido como castanha... esse dispositivo garante a fixa\xE7\xE3o de duas pe\xE7as de forma segura; com o minifix, voc\xEA pode montar e desmontar seu m\xF3vel sem danificar a madeira exatamente por ele ser eficiente e projetado com esse prop\xF3sito] Via de regra, o minifix deve ser usado em conjunto com uma ou mais cavilhas (tarugos), que absorvem esfor\xE7os de cisalhamento e impedem a rota\xE7\xE3o/abertura da junta. [cf. Minifix: Dispositivo de montagem utilizado para uni\xE3o de pe\xE7as com press\xE3o no lado esquerdo e direito, e sempre deve ser utilizado em conjunto com cavilhas (tarugos)]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "baixo",
        estetico: "baixo"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Blog da Marcenaria (Marceneiro Expresso); Central de Ajuda Gabster (documenta\xE7\xE3o t\xE9cnica de software de marcenaria); Gas\xF4metro Madeiras (ficha de produto).",
      fabricante: "Refer\xEAncia geral de mercado \u2014 nomenclatura varia entre H\xE4fele (Minifix/Rastex), outros fabricantes usam Girofix/Tamborfix para produtos equivalentes.",
      observacoes: 'O nome "minifix" surgiu na Alemanha, associado \xE0 ascens\xE3o do MDF como material predominante na marcenaria modulada \u2014 \xE9 hoje tratado como padr\xE3o de fato da ind\xFAstria, mesmo com nomenclatura comercial vari\xE1vel entre fabricantes. [cf. Foi inserido no mundo da marcenaria na ascens\xE3o do MDF, na Alemanha, e hoje \xE9 um grande aliado na montagem de m\xF3veis modulados por sua precis\xE3o e praticidade] ---',
      tags: [
        "ferragens",
        "dispositivos",
        "montagem",
        "minifix",
        "cavilha",
        "rafix",
        "castanha",
        "fun\xE7\xE3o"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_02_dispositivos_de_montagem_minifix_cavilha_vb_rafix_vb_rafix_como_alternativa_a",
      entidade: "DISPOSITIVOS DE MONTAGEM \u2014 MINIFIX, CAVILHA, VB/RAFIX",
      categoria: "Ferragens",
      subcategoria: "DISPOSITIVOS DE MONTAGEM \u2014 MINIFIX, CAVILHA, VB/RAFIX",
      titulo: "VB/Rafix como alternativa ao minifix",
      tipo: "boa_pratica",
      descricao: "O VB (tamb\xE9m chamado Rafix, dependendo do fabricante) \xE9 um dispositivo de montagem de pain\xE9is muito usado na ind\xFAstria moveleira, funcionando com parafuso de uni\xE3o e bucha pl\xE1stica, sem exigir cavilhas complementares para estabilidade da junta. [cf. O dispositivo VB e Rafix s\xE3o muito utilizados na marcenaria e ind\xFAstria moveleira; os parafusos de uni\xE3o s\xE3o essenciais para garantir a fixa\xE7\xE3o segura e oferecer durabilidade na montagem dos mobili\xE1rios]",
      condicoes: {
        quando_aplicar: "Uni\xF5es estruturais onde se deseja reduzir o n\xFAmero de fura\xE7\xF5es/dispositivos por junta (menos pe\xE7as = montagem mais r\xE1pida), especialmente em produ\xE7\xE3o em escala industrial.",
        condicoes_adicionais: "Cada sistema (Minifix, Rafix, VB36) tem geometria de fura\xE7\xE3o pr\xF3pria e n\xE3o intercambi\xE1vel \u2014 \xE9 necess\xE1rio definir o sistema de montagem antes de gerar o plano de fura\xE7\xE3o, n\xE3o depois."
      },
      restricoes: {
        quando_nao_aplicar: "Em uni\xF5es onde a resist\xEAncia ao cisalhamento lateral \xE9 cr\xEDtica e n\xE3o h\xE1 geometria de encaixe adicional (como uma cava ou friso), pode ser prefer\xEDvel refor\xE7ar com cavilha mesmo assim, dependendo do peso previsto sobre a junta.",
        limitacoes: "Menor familiaridade de parte da m\xE3o de obra tradicional com sistemas VB/Rafix em compara\xE7\xE3o ao minifix, que \xE9 mais difundido no Brasil."
      },
      acoes_recomendadas: "Minifix + cavilha (item 5.1) quando a praticidade de desmontagem for prioridade sobre a velocidade de montagem inicial.",
      motivo_tecnico: "O VB (tamb\xE9m chamado Rafix, dependendo do fabricante) \xE9 um dispositivo de montagem de pain\xE9is muito usado na ind\xFAstria moveleira, funcionando com parafuso de uni\xE3o e bucha pl\xE1stica, sem exigir cavilhas complementares para estabilidade da junta. [cf. O dispositivo VB e Rafix s\xE3o muito utilizados na marcenaria e ind\xFAstria moveleira; os parafusos de uni\xE3o s\xE3o essenciais para garantir a fixa\xE7\xE3o segura e oferecer durabilidade na montagem dos mobili\xE1rios]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Gas\xF4metro Madeiras (ficha de produto); v\xEDdeo institucional comparativo Minifix/Rafix/VB36 (fabricantes do setor).",
      fabricante: "Refer\xEAncia geral \u2014 nomenclatura e geometria variam por fabricante (H\xE4fele, Rometal, Domus, entre outros, cada um com sua linha pr\xF3pria).",
      observacoes: 'Este \xE9 um ponto onde o Planne pode se diferenciar de concorrentes: tratar "sistema de montagem" como uma decis\xE3o de projeto tomada uma vez (por padr\xE3o de f\xE1brica ou por m\xF3dulo) e propagada automaticamente para todas as fura\xE7\xF5es do plano de corte, evitando mistura acidental de sistemas incompat\xEDveis dentro do mesmo m\xF3vel. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas** (piloto) e **Ferragens** (este documento). Sugest\xE3o de sequ\xEAncia para as pr\xF3ximas rodadas, mantendo a mesma profundidade e metodologia: 1. **Estrutura** \u2014 travamentos, engrossos, tampos, empenamento, refor\xE7os (normas ABNT de resist\xEAncia de pain\xE9is). 2. **Portas e Gavetas** \u2014 folgas, recuos, limites de peso/dimens\xE3o, tipos especiais (correr, camar\xE3o, basculante, pivotante). 3. **Materiais** \u2014 MDF, MDP, compensado (Arauco, Duratex, Berneck, Guararapes, Greenplac) \u2014 densidade, espessuras-padr\xE3o, resist\xEAncia \xE0 umidade. 4. **Closets** \u2014 cabideiros, maleiros, sapateiras, calceiros, joalheiros. 5. **Banheiros e Escrit\xF3rios**. 6. **Produ\xE7\xE3o, Transporte, Montagem, Economia** \u2014 conhecimento operacional. Quer que eu continue direto pelo m\xF3dulo **Estrutura** (travamentos/tampos/empenamento) ou prefere priorizar **Portas e Gavetas**, j\xE1 que s\xE3o complementares diretos deste m\xF3dulo de Ferragens?',
      tags: [
        "ferragens",
        "dispositivos",
        "montagem",
        "minifix",
        "cavilha",
        "rafix",
        "alternativa"
      ],
      modulo_origem: "02-Ferragens",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_espessuras_de_mdf_mdp_e_funcao_estrutural_de_cada_uma_tabela_geral_de_aplicac",
      entidade: "ESPESSURAS DE MDF/MDP E FUN\xC7\xC3O ESTRUTURAL DE CADA UMA",
      categoria: "Estrutura",
      subcategoria: "ESPESSURAS DE MDF/MDP E FUN\xC7\xC3O ESTRUTURAL DE CADA UMA",
      titulo: "Tabela geral de aplica\xE7\xE3o por espessura",
      tipo: "boa_pratica",
      descricao: "O mercado brasileiro de marcenaria trabalha essencialmente com quatro faixas de espessura de MDF, cada uma com aplica\xE7\xE3o estrutural preferencial: 15 mm (caixaria/estrutura interna de m\xF3veis sem carga excessiva, divis\xF3rias, fundos estruturados), 18 mm (padr\xE3o de excel\xEAncia para portas, tampos de m\xF3veis m\xE9dios, laterais estruturais e prateleiras de guarda-roupa \u2014 o mais usado em projetos residenciais de alto padr\xE3o), e 25 mm (tampos de mesa, prateleiras de v\xE3o longo, portas mais pesadas e colunas que recebem carga superior). [cf. O MDF de 15mm \xE9 o coringa para estruturas que n\xE3o recebem carga excessiva... MDF 18mm: sendo a espessura mais comum em m\xF3veis planejados residenciais de alto padr\xE3o, oferece o equil\xEDbrio perfeito entre custo, estabilidade estrutural e durabilidade... MDF 25mm: quando o projeto exige suporte de carga superior ou um design mais imponente, \xE9 a escolha t\xE9cnica correta]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o inicial de espessura de qualquer pe\xE7a do m\xF3vel, antes de calcular v\xE3os e cargas espec\xEDficas (itens 2 e seguintes deste m\xF3dulo).",
        condicoes_adicionais: "A escolha da espessura correta impacta diretamente o custo: como regra pr\xE1tica, cada 3 mm a mais de espessura pode representar 15\u201320% de aumento no custo do material. [cf. Como regra pr\xE1tica: cada 3mm a mais de espessura pode representar 15-20% de aumento no custo do material]"
      },
      restricoes: {
        quando_nao_aplicar: "Pe\xE7as de fundo (n\xE3o estrutural) costumam usar espessuras menores (3\u20139 mm), fora dessa tabela geral \u2014 ver item 3.",
        limitacoes: "Espessuras maiores (25 mm+) aumentam significativamente o peso do m\xF3vel montado, com impacto direto em transporte e fixa\xE7\xE3o na parede."
      },
      acoes_recomendadas: "Uso de engrosso (item 5) para simular uma espessura maior sem pagar o pre\xE7o de uma chapa inteira mais grossa.",
      motivo_tecnico: "O mercado brasileiro de marcenaria trabalha essencialmente com quatro faixas de espessura de MDF, cada uma com aplica\xE7\xE3o estrutural preferencial: 15 mm (caixaria/estrutura interna de m\xF3veis sem carga excessiva, divis\xF3rias, fundos estruturados), 18 mm (padr\xE3o de excel\xEAncia para portas, tampos de m\xF3veis m\xE9dios, laterais estruturais e prateleiras de guarda-roupa \u2014 o mais usado em projetos residenciais de alto padr\xE3o), e 25 mm (tampos de mesa, prateleiras de v\xE3o longo, portas mais pesadas e colunas que recebem carga superior). [cf. O MDF de 15mm \xE9 o coringa para estruturas que n\xE3o recebem carga excessiva... MDF 18mm: sendo a espessura mais comum em m\xF3veis planejados residenciais de alto padr\xE3o, oferece o equil\xEDbrio perfeito entre custo, estabilidade estrutural e durabilidade... MDF 25mm: quando o projeto exige suporte de carga superior ou um design mais imponente, \xE9 a escolha t\xE9cnica correta]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "cr\xEDtico",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Arauco Brasil (blog institucional do fabricante); M\xF3veis Goi\xE2nia (guia t\xE9cnico); Gas\xF4metro Madeiras.",
      fabricante: "Arauco, Duratex, Guararapes (citados como refer\xEAncia de cat\xE1logo de espessuras).",
      observacoes: "Chapas de 15 mm tamb\xE9m s\xE3o citadas como boa base para dobradi\xE7as em portas com espelho ou vidro, e chapas de 18 mm como as mais indicadas para acomodar puxadores, dobradi\xE7as e perfis de alum\xEDnio em portas grandes. [cf. Chapas com espessuras de 18mm e que n\xE3o estejam danificadas s\xE3o \xF3timas para acomodar puxadores, dobradi\xE7as e perfis de alum\xEDnio] ---",
      tags: [
        "estrutura",
        "espessuras",
        "fun\xE7\xE3o",
        "estrutural",
        "tabela",
        "geral",
        "aplica\xE7\xE3o",
        "espessura"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_espessuras_de_mdf_mdp_e_funcao_estrutural_de_cada_uma_frequencia_de_uso_como_",
      entidade: "ESPESSURAS DE MDF/MDP E FUN\xC7\xC3O ESTRUTURAL DE CADA UMA",
      categoria: "Estrutura",
      subcategoria: "ESPESSURAS DE MDF/MDP E FUN\xC7\xC3O ESTRUTURAL DE CADA UMA",
      titulo: "Frequ\xEAncia de uso como crit\xE9rio adicional de espessura",
      tipo: "recomendacao",
      descricao: "Al\xE9m do peso e do v\xE3o, a frequ\xEAncia de abertura/fechamento da pe\xE7a deve influenciar a escolha de espessura \u2014 um gaveteiro de uso di\xE1rio intenso precisa de mais resist\xEAncia estrutural do que um arm\xE1rio raramente aberto, mesmo que ambos armazenem cargas semelhantes. [cf. Um gaveteiro de uso di\xE1rio precisa de mais resist\xEAncia que um arm\xE1rio raramente aberto]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de espessura em m\xF3veis de uso intensivo (cozinha, \xE1rea de servi\xE7o) versus m\xF3veis de uso ocasional (arm\xE1rio de quarto de h\xF3spedes, despensa de acesso raro).",
        condicoes_adicionais: "Recomenda-se espessuras maiores nas partes mais solicitadas de m\xF3veis de cozinha, que s\xE3o abertos de maneira di\xE1ria e constante. [cf. Para m\xF3veis de cozinha, que s\xE3o abertos de maneira di\xE1ria e constante, recomenda-se espessuras maiores nas partes mais solicitadas]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o \xE9 um crit\xE9rio isolado \u2014 deve sempre ser combinado com peso de carga e v\xE3o, nunca usado sozinho para justificar redu\xE7\xE3o de espessura.",
        limitacoes: 'Dif\xEDcil de quantificar objetivamente ("uso intenso" n\xE3o tem defini\xE7\xE3o num\xE9rica padronizada no setor) \u2014 depende de julgamento do projetista.'
      },
      acoes_recomendadas: "Refor\xE7ar a ferragem (corredi\xE7as/dobradi\xE7as de linha superior) como alternativa a aumentar espessura, quando o custo de material for mais restritivo que o de ferragem.",
      motivo_tecnico: "Al\xE9m do peso e do v\xE3o, a frequ\xEAncia de abertura/fechamento da pe\xE7a deve influenciar a escolha de espessura \u2014 um gaveteiro de uso di\xE1rio intenso precisa de mais resist\xEAncia estrutural do que um arm\xE1rio raramente aberto, mesmo que ambos armazenem cargas semelhantes. [cf. Um gaveteiro de uso di\xE1rio precisa de mais resist\xEAncia que um arm\xE1rio raramente aberto]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "M\xF3veis Goi\xE2nia (guia t\xE9cnico).",
      fabricante: "N/A.",
      observacoes: 'Este crit\xE9rio deveria ser capturado no motor de regras do Planne como um input qualitativo do usu\xE1rio ("frequ\xEAncia de uso esperada"), afetando a recomenda\xE7\xE3o de espessura e de linha de ferragem em conjunto. ---',
      tags: [
        "estrutura",
        "espessuras",
        "fun\xE7\xE3o",
        "estrutural",
        "frequ\xEAncia",
        "crit\xE9rio",
        "adicional",
        "espessura"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_prateleiras_vao_maximo_e_capacidade_de_carga_relacao_entre_vao_espessura_e_fl",
      entidade: "PRATELEIRAS \u2014 V\xC3O M\xC1XIMO E CAPACIDADE DE CARGA",
      categoria: "Estrutura",
      subcategoria: "PRATELEIRAS \u2014 V\xC3O M\xC1XIMO E CAPACIDADE DE CARGA",
      titulo: "Rela\xE7\xE3o entre v\xE3o, espessura e flecha (deforma\xE7\xE3o)",
      tipo: "regra_obrigatoria",
      descricao: 'Estudos t\xE9cnicos sobre flex\xE3o est\xE1tica em pain\xE9is de MDF/MDP mostram que a deforma\xE7\xE3o (flecha) de uma prateleira depende da espessura da chapa, da dist\xE2ncia entre apoios (v\xE3o) e da carga aplicada \u2014 a rela\xE7\xE3o segue uma f\xF3rmula de engenharia de materiais onde a flecha (\u2206) \xE9 proporcional \xE0 carga (p) e ao cubo do v\xE3o (L\xB3), e inversamente proporcional ao m\xF3dulo de elasticidade (E), \xE0 largura (b) e ao cubo da espessura (S\xB3). [cf. Onde \u2206 \xE9 a flecha em mm, "p" a carga distribu\xEDda em kg, "L" a dist\xE2ncia entre apoios em mm, "S" a espessura da chapa em mm, "E" o m\xF3dulo de elasticidade em N/mm\xB2 e "b" a largura da prateleira em mm] Uma regra pr\xE1tica derivada de estudos de flex\xE3o est\xE1tica indica uma rela\xE7\xE3o ideal v\xE3o/espessura superior a 20 \u2014 ou seja, para uma prateleira de 18 mm, o v\xE3o m\xE1ximo recomendado seria de aproximadamente 360 mm para cargas normais. [cf. Estudos cient\xEDficos mostram que a rela\xE7\xE3o ideal entre v\xE3o (L) e espessura (h) em ensaios de flex\xE3o est\xE1tica chega a ser superior a vinte; isso significa que para uma prateleira de 18mm, o v\xE3o m\xE1ximo recomendado seria de 360mm para cargas normais]',
      condicoes: {
        quando_aplicar: "Dimensionamento de qualquer prateleira interna de arm\xE1rio, estante ou nicho, especialmente em v\xE3os longos (acima de 60 cm).",
        condicoes_adicionais: "Para cargas concentradas (n\xE3o distribu\xEDdas uniformemente \u2014 ex.: um \xFAnico objeto pesado no centro da prateleira), os valores de v\xE3o m\xE1ximo devem ser reduzidos em 30\u201340% em rela\xE7\xE3o aos calculados para carga distribu\xEDda. [cf. Para cargas concentradas (n\xE3o distribu\xEDdas), reduza esses valores em 30-40%]"
      },
      restricoes: {
        quando_nao_aplicar: "Prateleiras com apoio cont\xEDnuo (encaixadas em ranhura lateral a lateral, sem v\xE3o livre) n\xE3o seguem esta l\xF3gica de v\xE3o \u2014 o v\xE3o relevante nesse caso \xE9 zero ou m\xEDnimo.",
        limitacoes: "O tempo de perman\xEAncia da carga tamb\xE9m influencia a deforma\xE7\xE3o (flu\xEAncia/creep) \u2014 estudos t\xE9cnicos notam que muitas refer\xEAncias de mercado n\xE3o especificam claramente por quanto tempo a prateleira permaneceu sob carga durante os ensaios, o que introduz incerteza nas tabelas populares. [cf. As cargas foram uniformemente distribu\xEDdas, no entanto n\xE3o foi mencionado o procedimento de ensaios nem o tempo que as prateleiras permaneceram sob efeito de carga]"
      },
      acoes_recomendadas: "Refor\xE7o com cantoneira/perfil met\xE1lico sob a prateleira, ou suporte central adicional, quando o v\xE3o desejado excede o recomendado para a espessura dispon\xEDvel.",
      motivo_tecnico: 'Estudos t\xE9cnicos sobre flex\xE3o est\xE1tica em pain\xE9is de MDF/MDP mostram que a deforma\xE7\xE3o (flecha) de uma prateleira depende da espessura da chapa, da dist\xE2ncia entre apoios (v\xE3o) e da carga aplicada \u2014 a rela\xE7\xE3o segue uma f\xF3rmula de engenharia de materiais onde a flecha (\u2206) \xE9 proporcional \xE0 carga (p) e ao cubo do v\xE3o (L\xB3), e inversamente proporcional ao m\xF3dulo de elasticidade (E), \xE0 largura (b) e ao cubo da espessura (S\xB3). [cf. Onde \u2206 \xE9 a flecha em mm, "p" a carga distribu\xEDda em kg, "L" a dist\xE2ncia entre apoios em mm, "S" a espessura da chapa em mm, "E" o m\xF3dulo de elasticidade em N/mm\xB2 e "b" a largura da prateleira em mm] Uma regra pr\xE1tica derivada de estudos de flex\xE3o est\xE1tica indica uma rela\xE7\xE3o ideal v\xE3o/espessura superior a 20 \u2014 ou seja, para uma prateleira de 18 mm, o v\xE3o m\xE1ximo recomendado seria de aproximadamente 360 mm para cargas normais. [cf. Estudos cient\xEDficos mostram que a rela\xE7\xE3o ideal entre v\xE3o (L) e espessura (h) em ensaios de flex\xE3o est\xE1tica chega a ser superior a vinte; isso significa que para uma prateleira de 18mm, o v\xE3o m\xE1ximo recomendado seria de 360mm para cargas normais]',
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: 'Reposit\xF3rio UnB (estudo t\xE9cnico "Particleboard and MDF for Shelving", tese de mestrado); M\xF3veis Goi\xE2nia (guia aplicado).',
      fabricante: "Estudo cita dados testados em MDF e MDP gen\xE9ricos, n\xE3o uma marca espec\xEDfica.",
      observacoes: "Esta f\xF3rmula de engenharia (flex\xE3o est\xE1tica) \xE9 a base t\xE9cnica mais rigorosa encontrada na pesquisa e deveria ser o n\xFAcleo do motor de c\xE1lculo de v\xE3o m\xE1ximo do Planne, com a ressalva de aplicar fator de seguran\xE7a adicional por conta da incerteza sobre tempo de carga sustentada (flu\xEAncia). ---",
      tags: [
        "estrutura",
        "prateleiras",
        "m\xE1ximo",
        "capacidade",
        "carga",
        "rela\xE7\xE3o",
        "espessura",
        "flecha"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_prateleiras_vao_maximo_e_capacidade_de_carga_exemplos_praticos_de_capacidade_",
      entidade: "PRATELEIRAS \u2014 V\xC3O M\xC1XIMO E CAPACIDADE DE CARGA",
      categoria: "Estrutura",
      subcategoria: "PRATELEIRAS \u2014 V\xC3O M\xC1XIMO E CAPACIDADE DE CARGA",
      titulo: "Exemplos pr\xE1ticos de capacidade de carga por espessura",
      tipo: "boa_pratica",
      descricao: "Como refer\xEAncia pr\xE1tica (n\xE3o substituindo o c\xE1lculo de engenharia do item 2.1), o mercado usa exemplos como: uma prateleira de MDF de 15 mm pode suportar livros sem envergar em um v\xE3o de 40 cm, mas para um v\xE3o de 1 metro seria necess\xE1rio usar 18 mm ou 25 mm. [cf. Uma prateleira de espessura de 15mm em MDF pode aguentar livros sem envergar se tiver 40 cm por exemplo; se usar um metro de comprimento, teria que usar 18mm ou 25mm] Produtos comerciais de prateleira pronta (18 mm, sem suporte, 60 cm de largura) declaram suportar 10 kg distribu\xEDdos como refer\xEAncia de mercado. [cf. Suporta 10 kg distribu\xEDdos]",
      condicoes: {
        quando_aplicar: "Como valida\xE7\xE3o cruzada r\xE1pida de um c\xE1lculo de engenharia mais detalhado, ou quando n\xE3o h\xE1 tempo/dados suficientes para o c\xE1lculo completo do item 2.1.",
        condicoes_adicionais: "V\xE3o de suporte de parede (m\xE3o-francesa) a cada 40 cm no m\xEDnimo, com haste compat\xEDvel com a largura da prateleira. [cf. A cada 400mm pelo menos \xE9 necess\xE1rio que tenha um suporte invis\xEDvel instalado na parede e a haste que ficar\xE1 dentro da madeira seja compat\xEDvel com a largura]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o deve ser usado como \xFAnica fonte de verdade em projetos de carga elevada (biblioteca, despensa com muitos itens pesados) \u2014 nesses casos, o c\xE1lculo de flex\xE3o (item 2.1) \xE9 obrigat\xF3rio.",
        limitacoes: 'Valores de "peso suportado" divulgados comercialmente muitas vezes n\xE3o especificam se a carga \xE9 distribu\xEDda ou concentrada, nem o tempo de perman\xEAncia \u2014 usar com cautela e sempre com margem de seguran\xE7a.'
      },
      acoes_recomendadas: "Consultar tabela de refer\xEAncia espec\xEDfica do fabricante da prateleira/suporte antes de assumir um valor gen\xE9rico de mercado.",
      motivo_tecnico: "Como refer\xEAncia pr\xE1tica (n\xE3o substituindo o c\xE1lculo de engenharia do item 2.1), o mercado usa exemplos como: uma prateleira de MDF de 15 mm pode suportar livros sem envergar em um v\xE3o de 40 cm, mas para um v\xE3o de 1 metro seria necess\xE1rio usar 18 mm ou 25 mm. [cf. Uma prateleira de espessura de 15mm em MDF pode aguentar livros sem envergar se tiver 40 cm por exemplo; se usar um metro de comprimento, teria que usar 18mm ou 25mm] Produtos comerciais de prateleira pronta (18 mm, sem suporte, 60 cm de largura) declaram suportar 10 kg distribu\xEDdos como refer\xEAncia de mercado. [cf. Suporta 10 kg distribu\xEDdos]",
      impacto: {
        estrutural: "alto",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Habitissimo (f\xF3rum de perguntas t\xE9cnicas); Marcena (loja de m\xF3veis sob medida, tabela de refer\xEAncia pr\xF3pria).",
      fabricante: "N/A (refer\xEAncias de mercado gen\xE9ricas).",
      observacoes: "O motor de regras do Planne deveria, idealmente, oferecer as duas camadas: um c\xE1lculo de engenharia rigoroso (item 2.1) para o n\xFAcleo do sistema, e uma tabela de refer\xEAncia r\xE1pida (este item) para verifica\xE7\xE3o de bom senso e comunica\xE7\xE3o simplificada com o cliente final. ---",
      tags: [
        "estrutura",
        "prateleiras",
        "m\xE1ximo",
        "capacidade",
        "carga",
        "exemplos",
        "pr\xE1ticos",
        "espessura"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_fundo_do_movel_funcao_estrutural_travamento_traseiro_fundo_como_elemento_de_t",
      entidade: "FUNDO DO M\xD3VEL \u2014 FUN\xC7\xC3O ESTRUTURAL (TRAVAMENTO TRASEIRO)",
      categoria: "Estrutura",
      subcategoria: "FUNDO DO M\xD3VEL \u2014 FUN\xC7\xC3O ESTRUTURAL (TRAVAMENTO TRASEIRO)",
      titulo: "Fundo como elemento de travamento, n\xE3o apenas de veda\xE7\xE3o",
      tipo: "regra_obrigatoria",
      descricao: 'O fundo do m\xF3vel (a chapa traseira) n\xE3o deve ser tratado apenas como uma veda\xE7\xE3o est\xE9tica \u2014 ele cumpre fun\xE7\xE3o estrutural de travamento, mantendo o esquadro (\xE2ngulo de 90\xB0) do corpo do m\xF3vel e evitando que a caixa "abra" ou tor\xE7a com o uso. M\xF3veis com fundo fino simplesmente pregado, sem fun\xE7\xE3o de travamento real, tendem a perder o esquadro com o tempo, comprometendo o alinhamento de portas e gavetas. [cf. O m\xF3vel planejado bem executado tem estrutura de travamento mais firme, laterais dimensionadas para o v\xE3o exato e fundo mais resistente, n\xE3o apenas uma chapa fina pregada atr\xE1s; no modulado comum, a pe\xE7a depende de medidas padr\xE3o e costuma sofrer quando precisa ser adaptada na instala\xE7\xE3o]',
      condicoes: {
        quando_aplicar: "Todo projeto de m\xF3vel modulado com estrutura em caixa (arm\xE1rios, gaveteiros, estantes fechadas).",
        condicoes_adicionais: "Duas espessuras de fundo s\xE3o comuns no mercado: 3 mm, encaixado em ranhura (sistema mais barato e mais r\xE1pido de montar), ou 6 mm, parafusado (mais resistente, mais indicado quando o fundo tamb\xE9m precisa contribuir estruturalmente). [cf. O fundo pode ser de 3 mm (ranhura) ou 6 mm (parafusado)]"
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3dulos totalmente abertos (estantes sem fundo, pain\xE9is vazados) n\xE3o t\xEAm essa fun\xE7\xE3o de travamento pelo fundo \u2014 nesses casos, o travamento precisa vir de outro elemento (traseira parcial, cantoneiras, ou a pr\xF3pria fixa\xE7\xE3o na parede).",
        limitacoes: "Fundo de 3 mm em ranhura tem fun\xE7\xE3o de travamento mais limitada \u2014 indicado para m\xF3veis leves ou de uso pouco intenso; para m\xF3veis de cozinha e \xE1reas de uso pesado, o fundo de 6 mm parafusado \xE9 mais indicado."
      },
      acoes_recomendadas: "Uso de cantoneiras met\xE1licas em diagonal (ver item 6) como refor\xE7o complementar ao fundo, especialmente em m\xF3dulos fixados na parede que recebem carga lateral.",
      motivo_tecnico: 'O fundo do m\xF3vel (a chapa traseira) n\xE3o deve ser tratado apenas como uma veda\xE7\xE3o est\xE9tica \u2014 ele cumpre fun\xE7\xE3o estrutural de travamento, mantendo o esquadro (\xE2ngulo de 90\xB0) do corpo do m\xF3vel e evitando que a caixa "abra" ou tor\xE7a com o uso. M\xF3veis com fundo fino simplesmente pregado, sem fun\xE7\xE3o de travamento real, tendem a perder o esquadro com o tempo, comprometendo o alinhamento de portas e gavetas. [cf. O m\xF3vel planejado bem executado tem estrutura de travamento mais firme, laterais dimensionadas para o v\xE3o exato e fundo mais resistente, n\xE3o apenas uma chapa fina pregada atr\xE1s; no modulado comum, a pe\xE7a depende de medidas padr\xE3o e costuma sofrer quando precisa ser adaptada na instala\xE7\xE3o]',
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "baixo"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guia da Marcenaria (blog t\xE9cnico); Rio Marcenaria Fina (blog institucional de marcenaria local).",
      fabricante: "N/A.",
      observacoes: "\xC9 comum, segundo relatos do setor, que marcenarias de baixo custo usem MDP de baixa densidade com fundo fino e fita de borda mal colada, sem prote\xE7\xE3o contra vapor/umidade \u2014 o resultado citado \xE9 inchamento, perda de parafuso e empenamento generalizado, especialmente em cozinha e banheiro. [cf. Em muitos casos, usa MDP de baixa densidade, fundo fino, travamento simples e fita de borda colada com adesivo comum, sem prote\xE7\xE3o adequada contra vapor, calor e umidade... o resultado disso? Porta empenada, prateleira embarrigada, arm\xE1rio com cheiro ruim e cliente gastando duas vezes no mesmo ambiente] ---",
      tags: [
        "estrutura",
        "fundo",
        "m\xF3vel",
        "fun\xE7\xE3o",
        "estrutural",
        "travamento",
        "traseiro",
        "elemento"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_fundo_do_movel_funcao_estrutural_travamento_traseiro_montagem_sobre_superfici",
      entidade: "FUNDO DO M\xD3VEL \u2014 FUN\xC7\xC3O ESTRUTURAL (TRAVAMENTO TRASEIRO)",
      categoria: "Estrutura",
      subcategoria: "FUNDO DO M\xD3VEL \u2014 FUN\xC7\xC3O ESTRUTURAL (TRAVAMENTO TRASEIRO)",
      titulo: "Montagem sobre superf\xEDcie plana antes de fixar o fundo",
      tipo: "regra_obrigatoria",
      descricao: 'Na montagem de m\xF3veis (planejados ou modulados), o corpo do m\xF3vel deve ser estruturado sobre uma superf\xEDcie plana e forrada, com portas e gavetas alinhadas, antes de o fundo traseiro ser definitivamente fixado (pregado/parafusado) \u2014 porque \xE9 o fundo que "trava" o esquadro final da pe\xE7a. [cf. O montador precisa ter o cuidado de estruturar o m\xF3vel em uma superf\xEDcie plana e forrada para garantir o alinhamento de portas e gavetas antes de pregar o fundo traseiro]',
      condicoes: {
        quando_aplicar: "Todo processo de montagem de m\xF3vel em caixa, seja planejado sob medida ou modulado de f\xE1brica.",
        condicoes_adicionais: "Uso de esquadro para verificar o \xE2ngulo de 90\xB0 antes da fixa\xE7\xE3o do fundo \xE9 etapa obrigat\xF3ria de controle de qualidade. [cf. O esquadro \xE9 usado pra verificar e tra\xE7ar \xE2ngulos retos (90\xB0)... ele garante que as pe\xE7as estejam alinhadas e que cortes, encaixes e montagens saiam sim\xE9tricos]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 exce\xE7\xE3o \u2014 mesmo m\xF3dulos pequenos se beneficiam desta sequ\xEAncia de montagem.",
        limitacoes: "Erro nesta etapa \xE9 de dif\xEDcil corre\xE7\xE3o posterior \u2014 uma vez que o fundo \xE9 fixado fora de esquadro, a corre\xE7\xE3o exige desmontagem parcial do m\xF3vel."
      },
      acoes_recomendadas: "Uso de gabaritos de montagem e niveladores de m\xF3dulo para reduzir a depend\xEAncia da habilidade manual do montador nesta etapa cr\xEDtica.",
      motivo_tecnico: 'Na montagem de m\xF3veis (planejados ou modulados), o corpo do m\xF3vel deve ser estruturado sobre uma superf\xEDcie plana e forrada, com portas e gavetas alinhadas, antes de o fundo traseiro ser definitivamente fixado (pregado/parafusado) \u2014 porque \xE9 o fundo que "trava" o esquadro final da pe\xE7a. [cf. O montador precisa ter o cuidado de estruturar o m\xF3vel em uma superf\xEDcie plana e forrada para garantir o alinhamento de portas e gavetas antes de pregar o fundo traseiro]',
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "H\xE1bito Di\xE1rio Free (guia de montagem); Empoeirados (guia de uso do esquadro).",
      fabricante: "N/A (processo, n\xE3o produto).",
      observacoes: 'Esta \xE9 uma regra de processo (n\xE3o de especifica\xE7\xE3o de material/ferragem), mas de alt\xEDssimo valor para o m\xF3dulo "Montagem" do Planne (a ser detalhado em rodada futura) \u2014 vale registrar aqui a interse\xE7\xE3o direta com Estrutura. ---',
      tags: [
        "estrutura",
        "fundo",
        "m\xF3vel",
        "fun\xE7\xE3o",
        "estrutural",
        "travamento",
        "traseiro",
        "montagem"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_empenamento_causas_e_prevencao_causa_tecnica_raiz_diferenca_de_absorcao_de_um",
      entidade: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      categoria: "Estrutura",
      subcategoria: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      titulo: "Causa t\xE9cnica raiz: diferen\xE7a de absor\xE7\xE3o de umidade entre as faces",
      tipo: "alerta",
      descricao: "O empenamento de pain\xE9is de MDF ocorre principalmente quando h\xE1 diferen\xE7a na absor\xE7\xE3o/libera\xE7\xE3o de umidade entre as duas faces da chapa \u2014 por exemplo, uma face em contato com solo/ambiente \xFAmido absorve umidade e se expande, enquanto a face oposta, exposta a ar seco ou luz solar direta, se contrai, gerando tens\xE3o interna que resulta em deforma\xE7\xE3o. [cf. S\xE3o as mudan\xE7as de umidade entre as v\xE1rias partes do MDF, por exemplo, onde um lado da folha seca mais r\xE1pido do que o outro, que podem causar tens\xF5es que levam ao empenamento]",
      condicoes: {
        quando_aplicar: "An\xE1lise de causa raiz sempre que um empenamento for identificado, antes de aplicar qualquer corre\xE7\xE3o.",
        condicoes_adicionais: "Aplicar o mesmo acabamento (revestimento/laminado) nas duas faces da pe\xE7a \xE9 a preven\xE7\xE3o mais citada tecnicamente, pois equilibra a taxa de absor\xE7\xE3o/libera\xE7\xE3o de umidade entre as faces. [cf. Em casos onde uma das faces est\xE1 crua ou com acabamento simples, adicionar um revestimento na face oposta ajuda a reequilibrar as tens\xF5es da placa; exemplo: adicionar laminado melam\xEDnico na face interna da porta, espelhando a estrutura da face externa]"
      },
      restricoes: {
        quando_nao_aplicar: "Empenamento por armazenamento inadequado (cal\xE7os desalinhados, pilha mal apoiada) tem causa diferente \u2014 mec\xE2nica, n\xE3o de umidade \u2014 e deve ser tratado separadamente (ver item 4.3).",
        limitacoes: "O MDF \xE9 altamente higrosc\xF3pico (absorve prontamente \xE1gua tanto por contato direto quanto pela atmosfera em ambientes \xFAmidos), o que torna a exposi\xE7\xE3o em obras/canteiros um risco relevante antes mesmo da instala\xE7\xE3o final. [cf. O MDF tem uma alta capacidade de absor\xE7\xE3o e suga qualquer \xE1gua com a qual ele entra em contato, seja diretamente... ou da atmosfera, ao ser usado em condi\xE7\xF5es \xFAmidas]"
      },
      acoes_recomendadas: "Uso de laminado melam\xEDnico (n\xE3o poroso) como barreira de prote\xE7\xE3o \u2014 reduz significativamente o risco de incha\xE7o/empenamento por absor\xE7\xE3o direta de umidade pela superf\xEDcie, embora as bordas n\xE3o seladas continuem vulner\xE1veis. [cf. O laminado n\xE3o \xE9 poroso, o que significa que evita que a umidade penetre diretamente na superf\xEDcie da porta... no entanto, embora o laminado ofere\xE7a esta prote\xE7\xE3o, as bordas da porta, se n\xE3o forem vedadas, ainda poder\xE3o absorver umidade]",
      motivo_tecnico: "O empenamento de pain\xE9is de MDF ocorre principalmente quando h\xE1 diferen\xE7a na absor\xE7\xE3o/libera\xE7\xE3o de umidade entre as duas faces da chapa \u2014 por exemplo, uma face em contato com solo/ambiente \xFAmido absorve umidade e se expande, enquanto a face oposta, exposta a ar seco ou luz solar direta, se contrai, gerando tens\xE3o interna que resulta em deforma\xE7\xE3o. [cf. S\xE3o as mudan\xE7as de umidade entre as v\xE1rias partes do MDF, por exemplo, onde um lado da folha seca mais r\xE1pido do que o outro, que podem causar tens\xF5es que levam ao empenamento]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "cr\xEDtico"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Marcenaria de Hoje (blog t\xE9cnico); Portal Tudo Para M\xF3veis (guia para profissionais); Zhejiang Jingtang Door Industry (fabricante internacional, artigo t\xE9cnico sobre laminado melam\xEDnico).",
      fabricante: "N/A (regra de material, v\xE1lida para qualquer fabricante de MDF).",
      observacoes: "Diferente da madeira maci\xE7a (onde a dire\xE7\xE3o da fibra e a posi\xE7\xE3o de origem no tronco influenciam fortemente o risco de empenamento), o MDF combina fibras de diversas madeiras, o que reduz \u2014 mas n\xE3o elimina \u2014 essa fonte espec\xEDfica de instabilidade dimensional. [cf. Em madeiras naturais, h\xE1 muito mais coisas que podem influenciar o empenamento, por exemplo, a dire\xE7\xE3o da fibra da madeira... o MDF combina fibras de v\xE1rias madeiras duras e macias, eliminando essas fraquezas potenciais] ---",
      tags: [
        "estrutura",
        "empenamento",
        "causas",
        "preven\xE7\xE3o",
        "causa",
        "t\xE9cnica",
        "raiz",
        "diferen\xE7a"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_empenamento_causas_e_prevencao_limite_de_tolerancia_e_criterio_de_substituica",
      entidade: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      categoria: "Estrutura",
      subcategoria: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      titulo: "Limite de toler\xE2ncia e crit\xE9rio de substitui\xE7\xE3o",
      tipo: "recomendacao",
      descricao: "Existe um limiar pr\xE1tico de tor\xE7\xE3o acima do qual a corre\xE7\xE3o deixa de ser vi\xE1vel e a pe\xE7a deve ser substitu\xEDda: quando a tor\xE7\xE3o excede 5 mm ou interfere na abertura e no alinhamento da porta, a recomenda\xE7\xE3o t\xE9cnica \xE9 substituir a pe\xE7a, reaproveitando ferragens e revestimentos quando poss\xEDvel. [cf. Quando a tor\xE7\xE3o excede 5 mm ou interfere na abertura e no alinhamento, o mais indicado \xE9 substituir a porta; no entanto, \xE9 poss\xEDvel reaproveitar dobradi\xE7as, puxadores e at\xE9 mesmo revestimentos]",
      condicoes: {
        quando_aplicar: "Controle de qualidade em p\xF3s-venda/assist\xEAncia t\xE9cnica, para decidir entre corre\xE7\xE3o (item 4.3) e substitui\xE7\xE3o integral da pe\xE7a.",
        condicoes_adicionais: "Medir a tor\xE7\xE3o com r\xE9gua ou n\xEDvel, com a porta posicionada em superf\xEDcie plana, antes de decidir o caminho de corre\xE7\xE3o. [cf. Com a porta posicionada em uma superf\xEDcie plana, me\xE7a a tor\xE7\xE3o com uma r\xE9gua ou n\xEDvel]"
      },
      restricoes: {
        quando_nao_aplicar: "Empenamentos muito leves (dentro da toler\xE2ncia de regulagem 3D das dobradi\xE7as modernas, tipicamente \xB12\u20133 mm) podem ser corrigidos apenas com o ajuste fino da pr\xF3pria ferragem, sem necessidade de qualquer interven\xE7\xE3o na chapa.",
        limitacoes: "O crit\xE9rio de 5 mm \xE9 uma refer\xEAncia pr\xE1tica de mercado, n\xE3o uma norma t\xE9cnica formal \u2014 pode variar conforme a toler\xE2ncia aceit\xE1vel definida em contrato com o cliente."
      },
      acoes_recomendadas: 'Para empenamentos leves recentes (causados por varia\xE7\xE3o clim\xE1tica pontual), a t\xE9cnica de "reeducar" a madeira com peso e calor controlado por 24\u201348h \xE9 citada como alternativa vi\xE1vel antes de considerar substitui\xE7\xE3o. [cf. Posicione pesos... sobre a \xE1rea curvada e deixe agir por 24 a 48 horas. Isso pode ajudar a "reeducar" a madeira]',
      motivo_tecnico: "Existe um limiar pr\xE1tico de tor\xE7\xE3o acima do qual a corre\xE7\xE3o deixa de ser vi\xE1vel e a pe\xE7a deve ser substitu\xEDda: quando a tor\xE7\xE3o excede 5 mm ou interfere na abertura e no alinhamento da porta, a recomenda\xE7\xE3o t\xE9cnica \xE9 substituir a pe\xE7a, reaproveitando ferragens e revestimentos quando poss\xEDvel. [cf. Quando a tor\xE7\xE3o excede 5 mm ou interfere na abertura e no alinhamento, o mais indicado \xE9 substituir a porta; no entanto, \xE9 poss\xEDvel reaproveitar dobradi\xE7as, puxadores e at\xE9 mesmo revestimentos]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Portal Tudo Para M\xF3veis; Estado de Minas (mat\xE9ria de consumo, pr\xE1tica popular).",
      fabricante: "N/A.",
      observacoes: 'Este \xE9 um excelente candidato a virar uma regra automatizada de "diagn\xF3stico" no motor do Planne \u2014 o sistema poderia orientar tecnicamente a assist\xEAncia t\xE9cnica sobre quando vale a pena tentar reparo versus substitui\xE7\xE3o, com base na medida de tor\xE7\xE3o informada. ---',
      tags: [
        "estrutura",
        "empenamento",
        "causas",
        "preven\xE7\xE3o",
        "limite",
        "toler\xE2ncia",
        "crit\xE9rio",
        "substitui\xE7\xE3o"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_empenamento_causas_e_prevencao_prevencao_pelo_armazenamento_correto_do_mdf_an",
      entidade: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      categoria: "Estrutura",
      subcategoria: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      titulo: "Preven\xE7\xE3o pelo armazenamento correto do MDF (antes da fabrica\xE7\xE3o)",
      tipo: "boa_pratica",
      descricao: "Grande parte do empenamento tem origem antes mesmo da fabrica\xE7\xE3o do m\xF3vel \u2014 na estocagem incorreta ou prolongada das chapas de MDF, no uso de cal\xE7os desalinhados entre as chapas empilhadas, ou no armazenamento em locais \xFAmidos ou muito expostos a varia\xE7\xF5es clim\xE1ticas. [cf. A estocagem incorreta ou prolongada dos pain\xE9is de MDF, o uso de cal\xE7os desalinhados ou, ainda, o armazenamento em lugares \xFAmidos ou muito expostos \xE0s varia\xE7\xF5es clim\xE1ticas s\xE3o os principais vil\xF5es]",
      condicoes: {
        quando_aplicar: "Toda gest\xE3o de estoque de chapas em marcenaria/f\xE1brica, antes mesmo do corte das pe\xE7as.",
        condicoes_adicionais: "Pain\xE9is armazenados nas bordas ou no topo/base das pilhas t\xEAm maior propens\xE3o a empenar levemente durante a estocagem \u2014 esse efeito inicial costuma ser corrigido durante a pr\xF3pria produ\xE7\xE3o do m\xF3vel (uso dessas chapas em pe\xE7as menores ou de menor exig\xEAncia est\xE9tica), reservando os pain\xE9is do meio da pilha para tampos e portas maiores/mais vis\xEDveis. [cf. Os efeitos iniciais de empenamento podem ser corrigidos nessas \xE1reas durante a produ\xE7\xE3o do m\xF3vel... j\xE1 os pain\xE9is dispostos no meio das pilhas podem ser usados em tampos e portas]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 exce\xE7\xE3o \u2014 mesmo estoques de curta dura\xE7\xE3o (poucos dias) se beneficiam do armazenamento correto, especialmente em regi\xF5es de clima \xFAmido.",
        limitacoes: "Exige disciplina de estoque (local coberto, protegido de intemp\xE9ries, longe de fontes de umidade e calor intenso) que nem toda marcenaria pequena consegue manter estruturalmente. [cf. Armazene as chapas em local coberto, protegido das intemp\xE9ries clim\xE1ticas e longe de fontes de umidade e de calor intenso]"
      },
      acoes_recomendadas: "Uso de MDF de pinus (em vez de eucalipto) para maior estabilidade estrutural e resist\xEAncia a varia\xE7\xF5es de temperatura, segundo orienta\xE7\xE3o t\xE9cnica de fabricante nacional. [cf. O MDF de Pinus, diferente do Eucalipto, apresenta estrutura mais est\xE1vel e fibras mais longas; tamb\xE9m \xE9 mais resistente \xE0s varia\xE7\xF5es de temperatura]",
      motivo_tecnico: "Grande parte do empenamento tem origem antes mesmo da fabrica\xE7\xE3o do m\xF3vel \u2014 na estocagem incorreta ou prolongada das chapas de MDF, no uso de cal\xE7os desalinhados entre as chapas empilhadas, ou no armazenamento em locais \xFAmidos ou muito expostos a varia\xE7\xF5es clim\xE1ticas. [cf. A estocagem incorreta ou prolongada dos pain\xE9is de MDF, o uso de cal\xE7os desalinhados ou, ainda, o armazenamento em lugares \xFAmidos ou muito expostos \xE0s varia\xE7\xF5es clim\xE1ticas s\xE3o os principais vil\xF5es]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guararapes (blog institucional do fabricante, com declara\xE7\xE3o do gerente t\xE9cnico).",
      fabricante: "Guararapes (declara\xE7\xE3o expl\xEDcita citando diferen\xE7a entre MDF de pinus e de eucalipto).",
      observacoes: "Para portas grandes (dormit\xF3rios), o uso de desempenadores (acess\xF3rio met\xE1lico que ajuda no alinhamento e compensa o movimento natural do painel) \xE9 uma recomenda\xE7\xE3o t\xE9cnica adicional citada pelo fabricante. [cf. Para a fabrica\xE7\xE3o de grandes portas, como de dormit\xF3rios, tamb\xE9m \xE9 recomendado utilizar desempenadores; al\xE9m de ajudar no alinhamento da porta, esse acess\xF3rio serve para compensar o movimento natural do painel] ---",
      tags: [
        "estrutura",
        "empenamento",
        "causas",
        "preven\xE7\xE3o",
        "pelo",
        "armazenamento",
        "correto",
        "antes"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_engrosso_e_tamponamento_tecnicas_de_composicao_de_espessura_e_acabamento_engr",
      entidade: "ENGROSSO E TAMPONAMENTO \u2014 T\xC9CNICAS DE COMPOSI\xC7\xC3O DE ESPESSURA E ACABAMENTO",
      categoria: "Estrutura",
      subcategoria: "ENGROSSO E TAMPONAMENTO \u2014 T\xC9CNICAS DE COMPOSI\xC7\xC3O DE ESPESSURA E ACABAMENTO",
      titulo: "Engrosso: simula\xE7\xE3o de espessura maior por colagem de chapas",
      tipo: "boa_pratica",
      descricao: 'O "engrosso" \xE9 a t\xE9cnica de colar (ou parafusar) uma chapa fina adicional (tipicamente 6 a 9 mm) sobre uma pe\xE7a j\xE1 cortada, para alcan\xE7ar uma espessura final que o mercado n\xE3o disponibiliza pronta, ou para dar maior sustenta\xE7\xE3o e apar\xEAncia mais robusta \xE0 caixaria. Um exemplo citado no setor: uma caixaria de 15 mm engrossada com uma chapa de 6 mm resulta em 21 mm de espessura aparente. [cf. O MDF de 6 a 9mm \xE9 muito utilizado como engrossamento para alcan\xE7ar medidas de espessura que o mercado n\xE3o disp\xF5e, sendo combinados com outras chapas... esta t\xE9cnica usa chapas de 6mm para dar maior sustenta\xE7\xE3o e uma apar\xEAncia mais robusta \xE0 caixaria de 15mm, resultando em 21mm de espessura aparente]',
      condicoes: {
        quando_aplicar: "Quando se deseja o efeito visual/estrutural de uma chapa mais grossa (25 mm, por exemplo) sem pagar o custo total de uma chapa inteira nessa espessura \u2014 comum em tampos, laterais frontais e bordas de destaque.",
        condicoes_adicionais: "No processo de corte, \xE9 preciso manter a dire\xE7\xE3o do padr\xE3o/veio nas laterais e no tampo ao planejar o engrosso, colando pe\xE7as com veios cont\xEDnuos e refilando na esquadrejadeira para um resultado visualmente monol\xEDtico. [cf. Planeje o corte mantendo a dire\xE7\xE3o do padr\xE3o nas laterais e tampo; se necess\xE1rio, engrosse colando duas pe\xE7as com veios cont\xEDnuos e refilando na esquadrejadeira]"
      },
      restricoes: {
        quando_nao_aplicar: "Em pe\xE7as que exigem resist\xEAncia estrutural real e homog\xEAnea ao longo de toda a extens\xE3o (n\xE3o apenas nas bordas vis\xEDveis), o engrosso parcial n\xE3o substitui uma chapa inteiri\xE7a da espessura necess\xE1ria \u2014 o engrosso \xE9 primariamente uma t\xE9cnica de composi\xE7\xE3o visual/de borda, n\xE3o de refor\xE7o estrutural distribu\xEDdo.",
        limitacoes: "Desalinhamento entre as chapas coladas durante o engrosso \xE9 um erro recorrente de produ\xE7\xE3o \u2014 se grande demais, a corre\xE7\xE3o \xE9 trabalhosa e pode comprometer o acabamento final. [cf. O processo de adi\xE7\xE3o dos engrosso deve ser feito evitando desalinhamento entre as chapas; se houver algum erro grande demais, fazer as corre\xE7\xF5es se torna algo trabalhoso e nem sempre fica com o acabamento desejado]"
      },
      acoes_recomendadas: "Uso de cavilhas na usinagem do engrosso para garantir o alinhamento dos sarrafos/chapas \u2014 sugest\xE3o recorrente de marceneiros experientes em f\xF3runs t\xE9cnicos do setor, incluindo cuidado para que a profundidade do furo (ex.: 8 mm) n\xE3o ultrapasse a espessura combinada das chapas no caso de engrosso triplo. [cf. Adicionar a op\xE7\xE3o de utilizar cavilhas na usinagem para garantir o alinhamento dos sarrafos nos tampos, de forma que a profundidade do furo de 8mm n\xE3o ultrapasse o tampo superior e nem o tampo/sarrafo inferior no caso de engrosso triplo]",
      motivo_tecnico: 'O "engrosso" \xE9 a t\xE9cnica de colar (ou parafusar) uma chapa fina adicional (tipicamente 6 a 9 mm) sobre uma pe\xE7a j\xE1 cortada, para alcan\xE7ar uma espessura final que o mercado n\xE3o disponibiliza pronta, ou para dar maior sustenta\xE7\xE3o e apar\xEAncia mais robusta \xE0 caixaria. Um exemplo citado no setor: uma caixaria de 15 mm engrossada com uma chapa de 6 mm resulta em 21 mm de espessura aparente. [cf. O MDF de 6 a 9mm \xE9 muito utilizado como engrossamento para alcan\xE7ar medidas de espessura que o mercado n\xE3o disp\xF5e, sendo combinados com outras chapas... esta t\xE9cnica usa chapas de 6mm para dar maior sustenta\xE7\xE3o e uma apar\xEAncia mais robusta \xE0 caixaria de 15mm, resultando em 21mm de espessura aparente]',
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "Positivo \u2014 \xE9 uma t\xE9cnica de economia del",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "M\xF3veis Goi\xE2nia (guia completo de espessuras); Ploys/Modo Criativo (guia de tamponamento); comunidade Hellomob (discuss\xE3o t\xE9cnica entre marceneiros usu\xE1rios de software).",
      fabricante: "N/A (t\xE9cnica de processo, aplic\xE1vel a qualquer fabricante de MDF).",
      observacoes: 'Este item se conecta diretamente ao m\xF3dulo "Economia" do \xEDndice geral do projeto Planne (engrossos econ\xF4micos, melhor aproveitamento de chapas) \u2014 vale tratamento cruzado no motor de regras entre os m\xF3dulos Estrutura e Economia. ---',
      tags: [
        "estrutura",
        "engrosso",
        "tamponamento",
        "t\xE9cnicas",
        "composi\xE7\xE3o",
        "espessura",
        "acabamento",
        "simula\xE7\xE3o"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_engrosso_e_tamponamento_tecnicas_de_composicao_de_espessura_e_acabamento_tamp",
      entidade: "ENGROSSO E TAMPONAMENTO \u2014 T\xC9CNICAS DE COMPOSI\xC7\xC3O DE ESPESSURA E ACABAMENTO",
      categoria: "Estrutura",
      subcategoria: "ENGROSSO E TAMPONAMENTO \u2014 T\xC9CNICAS DE COMPOSI\xC7\xC3O DE ESPESSURA E ACABAMENTO",
      titulo: "Tamponamento: acabamento premium que tamb\xE9m refor\xE7a estrutura",
      tipo: "boa_pratica",
      descricao: 'Tamponamento \xE9 o revestimento externo \u2014 laterais, base, tampo e, por vezes, fundo aparente \u2014 que cobre a estrutura/caixaria do m\xF3vel com uma segunda camada de MDF (geralmente entre 15 e 18 mm), escondendo parafusos e fura\xE7\xF5es de montagem e criando um contorno visualmente cont\xEDnuo e "monol\xEDtico". [cf. Tamponamento \xE9 o envolt\xF3rio \u2014 laterais, base, tampo e, \xE0s vezes, fundo aparente \u2014 que reveste a estrutura (caixaria) do m\xF3vel; ele esconde os parafusos e as bordas da caixa, criando um contorno cont\xEDnuo e nobre]',
      condicoes: {
        quando_aplicar: 'M\xF3veis de padr\xE3o superior onde a est\xE9tica de "pe\xE7a \xFAnica" (sem fura\xE7\xE3o vis\xEDvel) \xE9 prioridade, e tamb\xE9m em m\xF3veis destinados a armazenar objetos pesados, onde a camada extra contribui para resist\xEAncia. [cf. Al\xE9m do fator apar\xEAncia, existe o fator resist\xEAncia, m\xF3veis com tamponamentos tendem a ficar mais resistentes; logo, se o seu m\xF3vel ser\xE1 usado para armazenar objetos pesados, pode ser uma alternativa acertada escolher fazer tamponamentos]',
        condicoes_adicionais: "Existe debate t\xE9cnico, est\xE9tico e ambiental sobre o uso indiscriminado do tamponamento \u2014 deve ser avaliado caso a caso, n\xE3o como padr\xE3o autom\xE1tico em todo projeto. [cf. A controv\xE9rsia sobre o tamponamento em m\xF3veis: existem alguns debates est\xE9ticos, t\xE9cnicos e ambientais]"
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3veis de entrada/econ\xF4micos, onde o custo adicional de material e m\xE3o de obra do tamponamento n\xE3o se justifica frente ao padr\xE3o de acabamento contratado.",
        limitacoes: "Aumenta o consumo de material (MDF extra) e o tempo de produ\xE7\xE3o, com impacto direto no custo final e na pegada ambiental do m\xF3vel (mais mat\xE9ria-prima consumida por unidade produzida)."
      },
      acoes_recomendadas: "Fita de borda de alta qualidade, sem tamponamento completo, quando o objetivo \xE9 apenas esconder a borda do miolo do MDF, sem a necessidade de cobrir fura\xE7\xF5es inteiras de montagem.",
      motivo_tecnico: 'Tamponamento \xE9 o revestimento externo \u2014 laterais, base, tampo e, por vezes, fundo aparente \u2014 que cobre a estrutura/caixaria do m\xF3vel com uma segunda camada de MDF (geralmente entre 15 e 18 mm), escondendo parafusos e fura\xE7\xF5es de montagem e criando um contorno visualmente cont\xEDnuo e "monol\xEDtico". [cf. Tamponamento \xE9 o envolt\xF3rio \u2014 laterais, base, tampo e, \xE0s vezes, fundo aparente \u2014 que reveste a estrutura (caixaria) do m\xF3vel; ele esconde os parafusos e as bordas da caixa, criando um contorno cont\xEDnuo e nobre]',
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "cr\xEDtico"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Meu M\xF3vel Planejado (guia passo a passo); Ploys/Modo Criativo (guia t\xE9cnico de tamponamento).",
      fabricante: "N/A.",
      observacoes: "A largura das r\xE9guas/sarrafos usados no tamponamento n\xE3o segue uma regra fixa \u2014 a pr\xE1tica de mercado varia, com alguns profissionais usando menos ou mais que 7 cm, dependendo do projeto. [cf. A largura para essas r\xE9guas n\xE3o \xE9 uma regra; alguns profissionais podem usar menos ou mais que 7 cm] ---",
      tags: [
        "estrutura",
        "engrosso",
        "tamponamento",
        "t\xE9cnicas",
        "composi\xE7\xE3o",
        "espessura",
        "acabamento",
        "premium"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_03_esquadro_e_travamento_diagonal_cantoneiras_em_diagonal_como_reforco_de_esquad",
      entidade: "ESQUADRO E TRAVAMENTO DIAGONAL",
      categoria: "Estrutura",
      subcategoria: "ESQUADRO E TRAVAMENTO DIAGONAL",
      titulo: "Cantoneiras em diagonal como refor\xE7o de esquadro",
      tipo: "boa_pratica",
      descricao: "Cantoneiras met\xE1licas de refor\xE7o, instaladas em cantos opostos de um m\xF3dulo (formando uma diagonal), distribuem a for\xE7a de forma equilibrada e ajudam a manter o esquadro do m\xF3vel \u2014 t\xE9cnica particularmente relevante em nichos e pequenos m\xF3dulos fixados na parede. [cf. Para m\xE1ximo resultado na instala\xE7\xE3o de nichos e pequenos m\xF3dulos na parede, use a Cantoneira de uni\xE3o em cantos opostos, formando uma diagonal; assim, o travamento distribui a for\xE7a igualmente e mant\xE9m o esquadro perfeito]",
      condicoes: {
        quando_aplicar: "Nichos, pequenos m\xF3dulos suspensos e refor\xE7o estrutural complementar em pe\xE7as que recebem carga lateral ou tor\xE7\xE3o (n\xE3o apenas peso vertical).",
        condicoes_adicionais: "Para chapas de MDF de 15 mm, usar parafusos de 4\xD714 mm para fixa\xE7\xE3o no m\xF3vel e parafuso de 4\xD740 mm com bucha de 6 mm para fixa\xE7\xE3o na parede. [cf. Para chapas de MDF de 15mm, utilize parafusos 4x14mm para fixa\xE7\xE3o firme no m\xF3vel, j\xE1 para a parede utilize parafuso 4x40mm e bucha 6mm]"
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3dulos grandes com fundo estrutural robusto (item 3.1) j\xE1 bem travado podem dispensar cantoneiras adicionais, exceto em pontos espec\xEDficos de maior solicita\xE7\xE3o.",
        limitacoes: "Cantoneiras aparentes (n\xE3o embutidas) podem comprometer a est\xE9tica em m\xF3veis de acabamento fino \u2014 nesses casos, preferir refor\xE7o interno (fundo espesso, sarrafos) em vez de cantoneira vis\xEDvel."
      },
      acoes_recomendadas: 'Refor\xE7o via fundo estrutural (item 3) como alternativa "invis\xEDvel" \xE0 cantoneira aparente.',
      motivo_tecnico: "Cantoneiras met\xE1licas de refor\xE7o, instaladas em cantos opostos de um m\xF3dulo (formando uma diagonal), distribuem a for\xE7a de forma equilibrada e ajudam a manter o esquadro do m\xF3vel \u2014 t\xE9cnica particularmente relevante em nichos e pequenos m\xF3dulos fixados na parede. [cf. Para m\xE1ximo resultado na instala\xE7\xE3o de nichos e pequenos m\xF3dulos na parede, use a Cantoneira de uni\xE3o em cantos opostos, formando uma diagonal; assim, o travamento distribui a for\xE7a igualmente e mant\xE9m o esquadro perfeito]",
      impacto: {
        estrutural: "alto",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Marvit (ficha t\xE9cnica de produto/ferragem).",
      fabricante: "Marvit (refer\xEAncia de produto, mas a t\xE9cnica \xE9 gen\xE9rica e aplic\xE1vel a qualquer cantoneira met\xE1lica equivalente).",
      observacoes: 'Esta regra se conecta diretamente ao m\xF3dulo "Nichos" do \xEDndice geral do Planne (fixa\xE7\xE3o, resist\xEAncia) \u2014 recomenda-se tratamento cruzado entre os m\xF3dulos Estrutura e Nichos/Pain\xE9is. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens** e **Estrutura** (este documento). Sugest\xE3o de sequ\xEAncia para as pr\xF3ximas rodadas: 1. **Portas e Gavetas** \u2014 folgas, recuos, limites de peso/dimens\xE3o, tipos especiais (correr, camar\xE3o, basculante, pivotante) \u2014 complementa diretamente os m\xF3dulos de Ferragens e Estrutura j\xE1 constru\xEDdos. 2. **Materiais** \u2014 MDF, MDP, compensado (Arauco, Duratex, Berneck, Guararapes, Greenplac) \u2014 densidade, espessuras-padr\xE3o, resist\xEAncia \xE0 umidade (aprofunda o que j\xE1 foi tocado neste m\xF3dulo de Estrutura). 3. **Closets** \u2014 cabideiros, maleiros, sapateiras, calceiros, joalheiros. 4. **Banheiros e Escrit\xF3rios**. 5. **Produ\xE7\xE3o, Transporte, Montagem, Economia** \u2014 conhecimento operacional. Seguimos agora para **Portas e Gavetas**?',
      tags: [
        "estrutura",
        "esquadro",
        "travamento",
        "diagonal",
        "cantoneiras",
        "refor\xE7o"
      ],
      modulo_origem: "03-Estrutura",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_folgas_e_recobrimento_de_portas_folgas_de_referencia_entre_portas_e_nas_later",
      entidade: "FOLGAS E RECOBRIMENTO DE PORTAS",
      categoria: "Portas e Gavetas",
      subcategoria: "FOLGAS E RECOBRIMENTO DE PORTAS",
      titulo: "Folgas de refer\xEAncia entre portas e nas laterais",
      tipo: "boa_pratica",
      descricao: 'Existem duas situa\xE7\xF5es distintas de folga: portas embutidas (dentro do v\xE3o do m\xF3vel) exigem folga de respiro nas laterais e entre folhas; portas sobrepostas (que cobrem a lateral do m\xF3vel) usam o recobrimento definido pela pr\xF3pria dobradi\xE7a, n\xE3o uma "folga" no sentido estrito. Uma refer\xEAncia de mercado usada por calculadoras t\xE9cnicas do setor indica cerca de 2 mm de folga nas laterais e 3 mm entre portas de batente (bater). [cf. Portas embutidas (dentro do v\xE3o) exigem folgas de respiro nas laterais e entre folhas. Portas sobrepostas (que cobrem a lateral) usam o recobrimento definido pela dobradi\xE7a. Refer\xEAncia de folgas: 2 mm nas laterais e 3 mm entre portas de bater]',
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer m\xF3dulo com duas ou mais portas, ou porta \xFAnica embutida no v\xE3o.",
        condicoes_adicionais: 'O software de projeto deve permitir configurar separadamente: espa\xE7amento entre portas, folga entre lateral do m\xF3dulo e a frente, e folga entre topo/base do m\xF3dulo e a frente \u2014 s\xE3o tr\xEAs par\xE2metros independentes, n\xE3o um \xFAnico valor de "folga geral". [cf. Espa\xE7amento entre portas: valor em mil\xEDmetros do espa\xE7amento entre as portas do m\xF3dulo. Folga frentes lateral: valor em mil\xEDmetros da folga entre a parte exterior da lateral do m\xF3dulo e a frente. Folga frente topo: valor em mil\xEDmetros da folga entre a parte superior do m\xF3dulo e a frente]'
      },
      restricoes: {
        quando_nao_aplicar: 'Portas com puxador "cava" ou com friso de abertura por press\xE3o (tip-on) podem ter toler\xE2ncias ligeiramente diferentes, dependendo da geometria do encaixe \u2014 verificar sempre com o fabricante da ferragem de abertura.',
        limitacoes: 'Folgas muito apertadas ("coladas no mil\xEDmetro") dificultam ajuste fino na instala\xE7\xE3o e complicam manuten\xE7\xE3o futura \u2014 regra geral do setor \xE9 sempre prever folga de respiro, mesmo quando a medida "no limite" pareceria tecnicamente suficiente. [cf. Folga ajuda a encaixar, nivelar e ventilar \u2014 al\xE9m de facilitar manuten\xE7\xE3o. Nicho "colado no mil\xEDmetro" \xE9 convite pra dor de cabe\xE7a, principalmente quando tem rodap\xE9, puxador e ajustes de porta]'
      },
      acoes_recomendadas: "Ajuste fino via regulagem 3D da dobradi\xE7a (lateral, altura, profundidade \u2014 ver m\xF3dulo Ferragens, item 1.3) para compensar pequenas varia\xE7\xF5es de execu\xE7\xE3o sem alterar a folga de projeto.",
      motivo_tecnico: 'Existem duas situa\xE7\xF5es distintas de folga: portas embutidas (dentro do v\xE3o do m\xF3vel) exigem folga de respiro nas laterais e entre folhas; portas sobrepostas (que cobrem a lateral do m\xF3vel) usam o recobrimento definido pela pr\xF3pria dobradi\xE7a, n\xE3o uma "folga" no sentido estrito. Uma refer\xEAncia de mercado usada por calculadoras t\xE9cnicas do setor indica cerca de 2 mm de folga nas laterais e 3 mm entre portas de batente (bater). [cf. Portas embutidas (dentro do v\xE3o) exigem folgas de respiro nas laterais e entre folhas. Portas sobrepostas (que cobrem a lateral) usam o recobrimento definido pela dobradi\xE7a. Refer\xEAncia de folgas: 2 mm nas laterais e 3 mm entre portas de bater]',
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "cr\xEDtico"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Central de Ajuda Hellomob (documenta\xE7\xE3o de software de marcenaria); Ploys/Modo Criativo (calculadora de portas).",
      fabricante: "N/A (par\xE2metro de projeto configur\xE1vel, n\xE3o espec\xEDfico de fabricante).",
      observacoes: 'O termo t\xE9cnico "recobrimento" (medido em mm) indica o quanto a porta cobre a lateral do m\xF3vel, e define se a abertura ser\xE1 total, parcial ou embutida \u2014 sendo o tipo de dobradi\xE7a (reta ou curva, ver m\xF3dulo Ferragens item 2.1) o fator que determina qual recobrimento \xE9 fisicamente poss\xEDvel. [cf. Medida (em mil\xEDmetros) do quanto a porta cobre a lateral do m\xF3vel. Define se a abertura ser\xE1 total, parcial ou embutida. O tipo de dobradi\xE7a (reta ou curva) \xE9 que vai determinar se o recobrimento ser\xE1 total ou parcial] ---',
      tags: [
        "portas",
        "gavetas",
        "folgas",
        "recobrimento",
        "refer\xEAncia",
        "laterais"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_largura_maxima_recomendada_por_folha_limite_pratico_de_largura_por_folha_em_m",
      entidade: "LARGURA M\xC1XIMA RECOMENDADA POR FOLHA",
      categoria: "Portas e Gavetas",
      subcategoria: "LARGURA M\xC1XIMA RECOMENDADA POR FOLHA",
      titulo: "Limite pr\xE1tico de largura por folha em MDF/MDP",
      tipo: "regra_obrigatoria",
      descricao: 'Recomenda-se n\xE3o ultrapassar aproximadamente 600 mm de largura por folha de porta em MDF/MDP \u2014 acima disso, a porta tende a "cair" (deformar sob o pr\xF3prio peso, sobrecarregando as dobradi\xE7as) ao longo do tempo, exigindo ferragens adicionais e maior manuten\xE7\xE3o. [cf. Evite ultrapassar ~600 mm por folha em MDF/MDP. Portas muito largas tendem a cair com o tempo e exigem ferragens adicionais. Dividir em mais folhas melhora a ergonomia e a durabilidade] Como refer\xEAncia complementar de mercado (n\xE3o uma regra fixa), a largura confort\xE1vel de uma porta de arm\xE1rio de cozinha ou guarda-roupa gira em torno de 40 a 50 cm. [cf. Para o arm\xE1rio de cozinha, a medida para uma porta gira em torno de 40 a 50cm. N\xE3o \xE9 uma regra, em casos espec\xEDficos essa medida pode ser maior ou at\xE9 menor]',
      condicoes: {
        quando_aplicar: "Divis\xE3o de qualquer v\xE3o em n\xFAmero de portas \u2014 decis\xE3o tomada antes de especificar a ferragem de dobradi\xE7a (que depende diretamente da largura final de cada folha, ver m\xF3dulo Ferragens item 1.1).",
        condicoes_adicionais: "V\xE3os muito largos (acima de 1,20 m) quase sempre devem ser divididos em duas ou mais folhas, tanto por ergonomia de uso (evitar arco de abertura excessivo) quanto por durabilidade da ferragem."
      },
      restricoes: {
        quando_nao_aplicar: "Portas de correr (item 3) e portas de vidro/alum\xEDnio com estrutura pr\xF3pria de moldura seguem limites de largura diferentes, geralmente maiores, por n\xE3o dependerem de dobradi\xE7a de copo convencional.",
        limitacoes: 'Dividir em mais folhas aumenta a quantidade de dobradi\xE7as e o n\xFAmero de "juntas" vis\xEDveis na composi\xE7\xE3o frontal \u2014 trade-off entre durabilidade estrutural e limpeza visual da fachada.'
      },
      acoes_recomendadas: "Uso de portas de correr ou camar\xE3o (itens 3 e 4) quando o v\xE3o \xE9 muito largo e a divis\xE3o em m\xFAltiplas portas de batente comprometeria a est\xE9tica ou a circula\xE7\xE3o do ambiente.",
      motivo_tecnico: 'Recomenda-se n\xE3o ultrapassar aproximadamente 600 mm de largura por folha de porta em MDF/MDP \u2014 acima disso, a porta tende a "cair" (deformar sob o pr\xF3prio peso, sobrecarregando as dobradi\xE7as) ao longo do tempo, exigindo ferragens adicionais e maior manuten\xE7\xE3o. [cf. Evite ultrapassar ~600 mm por folha em MDF/MDP. Portas muito largas tendem a cair com o tempo e exigem ferragens adicionais. Dividir em mais folhas melhora a ergonomia e a durabilidade] Como refer\xEAncia complementar de mercado (n\xE3o uma regra fixa), a largura confort\xE1vel de uma porta de arm\xE1rio de cozinha ou guarda-roupa gira em torno de 40 a 50 cm. [cf. Para o arm\xE1rio de cozinha, a medida para uma porta gira em torno de 40 a 50cm. N\xE3o \xE9 uma regra, em casos espec\xEDficos essa medida pode ser maior ou at\xE9 menor]',
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Modo Criativo/Ploys (calculadora de portas de arm\xE1rio); Meu M\xF3vel Planejado (guia de c\xE1lculo de medidas).",
      fabricante: "N/A.",
      observacoes: "Este limite de 600 mm deve ser tratado no motor de regras como valida\xE7\xE3o autom\xE1tica \u2014 o sistema deveria sugerir divis\xE3o em duas folhas sempre que o v\xE3o \xFAnico ultrapassar essa largura, cruzando com a tabela de quantidade de dobradi\xE7as por peso/altura do m\xF3dulo Ferragens. ---",
      tags: [
        "portas",
        "gavetas",
        "largura",
        "m\xE1xima",
        "recomendada",
        "folha",
        "limite",
        "pr\xE1tico"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_porta_de_correr_limites_dimensionais_por_sistema_fabricante",
      entidade: "PORTA DE CORRER",
      categoria: "Portas e Gavetas",
      subcategoria: "PORTA DE CORRER",
      titulo: "Limites dimensionais por sistema/fabricante",
      tipo: "regra_obrigatoria",
      descricao: "Sistemas de porta de correr t\xEAm limites dimensionais que variam conforme o fabricante e a linha de produto \u2014 exemplos de cat\xE1logo: uma linha com largura m\xEDnima de 500 mm e m\xE1xima de 1.100 mm, altura m\xEDnima de 1.000 mm e m\xE1xima de 2.600 mm; [cf. Portas de Correr: Largura M\xEDnima: 500mm Largura M\xE1xima: 1100mm Altura M\xEDnima: 1000mm Altura M\xE1xima: 2600mm] outra linha com largura m\xE1xima de 1.250 mm e altura m\xE1xima de 2.700 mm. [cf. Portas de Correr: Largura M\xEDnima: 750mm Largura M\xE1xima: 1250mm Altura M\xEDnima: 1000mm Altura M\xE1xima: 2700mm] Como refer\xEAncia pr\xE1tica independente de sistema espec\xEDfico, um profissional experiente recomenda largura m\xE1xima de 1,20 m por folha, com a altura limitada principalmente pelo tamanho m\xE1ximo de chapa de MDF dispon\xEDvel (2,75 m). [cf. A largura m\xE1xima que recomendo para porta de correr \xE9 1,20m. J\xE1 altura \xE9 limitado pelo tamanho da chapa de MDF: m\xE1ximo 2,75m]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer roupeiro, arm\xE1rio ou divis\xF3ria com porta de correr.",
        condicoes_adicionais: "Sempre verificar o limite espec\xEDfico do sistema/trilho escolhido (fabricante) antes de fechar a medida \u2014 os limites variam significativamente entre linhas, n\xE3o existindo um valor \xFAnico de mercado."
      },
      restricoes: {
        quando_nao_aplicar: "Portas de correr embutidas na parede (sistema de bols\xE3o) seguem par\xE2metros de v\xE3o de alvenaria, n\xE3o de marcenaria \u2014 fora do escopo deste item.",
        limitacoes: "Sistemas de correr com apoio (roldana) na parte inferior tendem a intensificar o empenamento da porta pelo pr\xF3prio peso, enquanto sistemas com apoio superior (porta pendurada) tamb\xE9m podem empenar, embora por mecanismo diferente. [cf. Os sistemas de correr com apoio na parte inferior intensificam o empenamento, mas tamb\xE9m ocorre empenamento nos sistemas de trilho com apoio superior (portas ficam penduradas)]"
      },
      acoes_recomendadas: "Priorizar sistema com sustenta\xE7\xE3o superior (porta pendurada por roldanas no topo, com apenas um pino-guia inferior no trilho) como boa pr\xE1tica recorrente entre marceneiros experientes, para reduzir o risco de empenamento por peso pr\xF3prio. [cf. Trabalhem na parte superior! Pois se usar um trilho com ferragem na parte inferior... a tend\xEAncia da porta \xE9 descansar assim empenando a porta... Portas devem ser presas por cima. Ter roldanas em cima. Em baixo, s\xF3 pino guia no trilho]",
      motivo_tecnico: "Sistemas de porta de correr t\xEAm limites dimensionais que variam conforme o fabricante e a linha de produto \u2014 exemplos de cat\xE1logo: uma linha com largura m\xEDnima de 500 mm e m\xE1xima de 1.100 mm, altura m\xEDnima de 1.000 mm e m\xE1xima de 2.600 mm; [cf. Portas de Correr: Largura M\xEDnima: 500mm Largura M\xE1xima: 1100mm Altura M\xEDnima: 1000mm Altura M\xE1xima: 2600mm] outra linha com largura m\xE1xima de 1.250 mm e altura m\xE1xima de 2.700 mm. [cf. Portas de Correr: Largura M\xEDnima: 750mm Largura M\xE1xima: 1250mm Altura M\xEDnima: 1000mm Altura M\xE1xima: 2700mm] Como refer\xEAncia pr\xE1tica independente de sistema espec\xEDfico, um profissional experiente recomenda largura m\xE1xima de 1,20 m por folha, com a altura limitada principalmente pelo tamanho m\xE1ximo de chapa de MDF dispon\xEDvel (2,75 m). [cf. A largura m\xE1xima que recomendo para porta de correr \xE9 1,20m. J\xE1 altura \xE9 limitado pelo tamanho da chapa de MDF: m\xE1ximo 2,75m]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Habitissimo (f\xF3rum t\xE9cnico com respostas de marceneiros profissionais); Dublin Complementos (ficha t\xE9cnica de linha de produto).",
      fabricante: "Dublin (linhas com limites espec\xEDficos citados); refer\xEAncia geral de mercado para a regra pr\xE1tica dos 1,20 m.",
      observacoes: "Para portas mais espessas ou pesadas, priorizar MDF de 18 mm ou 25 mm em vez de 15 mm, complementado por perfil de alum\xEDnio nas extremidades e, quando necess\xE1rio, desempenadores internos. [cf. MDFs de 15mm s\xE3o um pouco finos. Melhor 18mm ou 25mm. Portas devem ser presas por cima... Perfis de alum\xEDnio nas duas extremidades e desempenhos na parte de dentro da porta ajudam a n\xE3o empenar] ---",
      tags: [
        "portas",
        "gavetas",
        "porta",
        "correr",
        "limites",
        "dimensionais",
        "sistema",
        "fabricante"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_porta_de_correr_capacidade_de_carga_do_sistema_de_correr_por_linha_de_ferrage",
      entidade: "PORTA DE CORRER",
      categoria: "Portas e Gavetas",
      subcategoria: "PORTA DE CORRER",
      titulo: "Capacidade de carga do sistema de correr por linha de ferragem",
      tipo: "regra_obrigatoria",
      descricao: "Assim como em corredi\xE7as de gaveta, a capacidade de carga de um sistema de porta de correr varia por linha/fabricante \u2014 exemplos: sistema deslizante embutido suportando de 30 a 80 kg dependendo do material da porta; [cf. Capacidade de peso: suporta de 30 kg a 80 kg, dependendo do material da porta] linha espec\xEDfica com capacidade de at\xE9 50 kg; [cf. Peso suportado: at\xE9 50 kgs] e linha refor\xE7ada com capacidade de at\xE9 100 kg, indicada para portas de alum\xEDnio. [cf. CAPACIDADE DE PESO 100kg USO INDICADO Indicado para portas de alum\xEDnio de at\xE9 100kg]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer sistema de porta de correr, sempre cruzando o peso real da porta (material + revestimento + eventual vidro) com a capacidade da linha de ferragem escolhida.",
        condicoes_adicionais: "\xC9 necess\xE1rio conhecer peso m\xE1ximo, altura, largura e espessura da porta antes de escolher a corredi\xE7a/roldana correta; o comprimento de trilho necess\xE1rio depende tamb\xE9m de a porta ser embutida ou sobreposta. [cf. Para escolher a corredi\xE7a para as portas de correr corretas para a sua aplica\xE7\xE3o, \xE9 necess\xE1rio saber o peso m\xE1ximo da porta, altura, largura e espessura da porta. Calcular o comprimento da corredi\xE7a necess\xE1ria... depender\xE1 se a porta de correr \xE9 embutida ou sobreposta]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo portas aparentemente leves devem ter o peso validado contra a ferragem, especialmente em portas de vidro ou com molduras met\xE1licas, que costumam ser mais pesadas do que aparentam.",
        limitacoes: "Trilho e roldana devem sempre ser do mesmo modelo/fabricante em caso de substitui\xE7\xE3o ou manuten\xE7\xE3o, para garantir compatibilidade mec\xE2nica. [cf. Para substitui\xE7\xE3o ou manuten\xE7\xE3o \xE9 ideal que o trilho e a roldana da porta de correr seja nos mesmos modelos]"
      },
      acoes_recomendadas: "Sistemas com amortecimento (fechamento suave) para reduzir impacto no fim do curso, dispon\xEDveis em algumas linhas de maior capacidade (35\u201350 kg e acima). [cf. KIT AMORTECEDOR PARA PORTAS SUPERIOR CELSUS 35 A 50KG Fechamento suave = quando acionado, conduz a porta levemente pelo trilho evitando o impacto ao final do curso]",
      motivo_tecnico: "Assim como em corredi\xE7as de gaveta, a capacidade de carga de um sistema de porta de correr varia por linha/fabricante \u2014 exemplos: sistema deslizante embutido suportando de 30 a 80 kg dependendo do material da porta; [cf. Capacidade de peso: suporta de 30 kg a 80 kg, dependendo do material da porta] linha espec\xEDfica com capacidade de at\xE9 50 kg; [cf. Peso suportado: at\xE9 50 kgs] e linha refor\xE7ada com capacidade de at\xE9 100 kg, indicada para portas de alum\xEDnio. [cf. CAPACIDADE DE PESO 100kg USO INDICADO Indicado para portas de alum\xEDnio de at\xE9 100kg]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Gas\xF4metro Madeiras (cat\xE1logo institucional); JP Ferragens (loja especializada, fichas t\xE9cnicas Rometal); Reiman (blog t\xE9cnico internacional sobre movimento linear).",
      fabricante: "Rometal (modelos RO-64, MI-63, 7502V, RO-8102XT com capacidades entre 50 e 100 kg).",
      observacoes: 'Assim como no m\xF3dulo Ferragens (corredi\xE7as de gaveta), este \xE9 um caso claro para cadastro param\xE9trico por fabricante/linha no motor de regras do Planne, evitando o uso de um \xFAnico valor gen\xE9rico de "capacidade de porta de correr". ---',
      tags: [
        "portas",
        "gavetas",
        "porta",
        "correr",
        "capacidade",
        "carga",
        "sistema",
        "linha"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_porta_camarao_funcionamento_vantagens_e_limitacoes_acusticas_termicas",
      entidade: "PORTA CAMAR\xC3O",
      categoria: "Portas e Gavetas",
      subcategoria: "PORTA CAMAR\xC3O",
      titulo: "Funcionamento, vantagens e limita\xE7\xF5es ac\xFAsticas/t\xE9rmicas",
      tipo: "boa_pratica",
      descricao: "A porta camar\xE3o \xE9 um sistema articulado que, ao ser aberta, dobra as folhas umas sobre as outras, recolhendo-as nas laterais do v\xE3o \u2014 diferente da porta de correr convencional, que desliza inteira sem se dobrar. [cf. Ela possui o mesmo efeito que uma porta de correr, por\xE9m seu funcionamento \xE9 um pouco diferente quando o assunto \xE9 a disposi\xE7\xE3o das folhas. A porta quando aberta deixa as folhas dobradas uma sobre a outra, recolhidas nas laterais do v\xE3o] A principal vantagem \xE9 a otimiza\xE7\xE3o de espa\xE7o, sendo especialmente indicada como divis\xF3ria entre ambientes integrados (cozinha americana, home office, closet) sem a necessidade do arco de abertura de uma porta de batente tradicional. [cf. A principal vantagem da porta camar\xE3o articulada \xE9 a otimiza\xE7\xE3o do espa\xE7o que ela proporciona, sem necessidade de portas abrindo ou fechando de forma espa\xE7osa; sendo assim, \xE9 uma proposta de divis\xF3ria perfeita entre ambientes internos]",
      condicoes: {
        quando_aplicar: "Divis\xF3rias entre ambientes integrados, closets, home offices e \xE1reas de servi\xE7o em apartamentos pequenos, onde a economia de espa\xE7o de abertura \xE9 prioridade.",
        condicoes_adicionais: "Instala\xE7\xE3o t\xEDpica com tr\xEAs dobradi\xE7as por folha (uma central e duas a ~25 cm do topo e da base), seguindo l\xF3gica semelhante \xE0 regra geral de dobradi\xE7as em portas m\xE9dias/altas (ver m\xF3dulo Ferragens, item 1.1). [cf. Pegue uma das folhas e marque a posi\xE7\xE3o das tr\xEAs dobradi\xE7as, uma no centro e as outras duas a 25 cm do topo e da base]"
      },
      restricoes: {
        quando_nao_aplicar: "Ambientes que exigem isolamento ac\xFAstico ou t\xE9rmico relevante (quartos voltados para ru\xEDdo externo, \xE1reas com grande diferen\xE7a de temperatura entre ambientes) \u2014 a porta camar\xE3o n\xE3o veda completamente o v\xE3o quando fechada. [cf. O mecanismo da porta camar\xE3o n\xE3o sela completamente os espa\xE7o entre as madeiras quando est\xE1 fechada; sendo assim, pode ser frequente a entrada de vento, ru\xEDdos, mosquitos pelas pequenas passagens dispon\xEDveis das frestas]",
        limitacoes: "Menor durabilidade relativa em compara\xE7\xE3o a portas s\xF3lidas \u2014 as articula\xE7\xF5es e trilhos podem se desgastar mais rapidamente ao longo do tempo se n\xE3o bem cuidados; o pre\xE7o tamb\xE9m tende a ser mais alto que uma porta de batente equivalente. [cf. Elas podem ser menos dur\xE1veis em compara\xE7\xE3o com portas s\xF3lidas. Se n\xE3o forem bem cuidadas, as articula\xE7\xF5es e os trilhos podem se desgastar ao longo do tempo... o pre\xE7o desse tipo de porta pode variar dependendo do material, estilo e marca]"
      },
      acoes_recomendadas: "Instala\xE7\xE3o de batente espec\xEDfico para porta camar\xE3o, funcionando como moldura que ajuda a vedar parcialmente contra sujeira e insetos \u2014 mitiga\xE7\xE3o parcial da limita\xE7\xE3o ac\xFAstica/de veda\xE7\xE3o. [cf. Se deseja evitar esse tipo de problema, invista num batente para a porta camar\xE3o, que funciona como uma moldura da porta, que al\xE9m de prevenir sujeira e insetos, veda alguns v\xE3os]",
      motivo_tecnico: "A porta camar\xE3o \xE9 um sistema articulado que, ao ser aberta, dobra as folhas umas sobre as outras, recolhendo-as nas laterais do v\xE3o \u2014 diferente da porta de correr convencional, que desliza inteira sem se dobrar. [cf. Ela possui o mesmo efeito que uma porta de correr, por\xE9m seu funcionamento \xE9 um pouco diferente quando o assunto \xE9 a disposi\xE7\xE3o das folhas. A porta quando aberta deixa as folhas dobradas uma sobre a outra, recolhidas nas laterais do v\xE3o] A principal vantagem \xE9 a otimiza\xE7\xE3o de espa\xE7o, sendo especialmente indicada como divis\xF3ria entre ambientes integrados (cozinha americana, home office, closet) sem a necessidade do arco de abertura de uma porta de batente tradicional. [cf. A principal vantagem da porta camar\xE3o articulada \xE9 a otimiza\xE7\xE3o do espa\xE7o que ela proporciona, sem necessidade de portas abrindo ou fechando de forma espa\xE7osa; sendo assim, \xE9 uma proposta de divis\xF3ria perfeita entre ambientes internos]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "m\xE9dio",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Decor F\xE1cil (guia t\xE9cnico com passo a passo de instala\xE7\xE3o); Idea Brasil; Solid Systems (fabricante de sistemas de porta).",
      fabricante: "Solid Systems (linha com fixa\xE7\xE3o por trilho superior).",
      observacoes: "A instala\xE7\xE3o profissional \xE9 fortemente recomendada pelo pr\xF3prio setor, dado o risco de imperfei\xE7\xF5es e acidentes em instala\xE7\xE3o amadora \u2014 este \xE9 um dos poucos tipos de porta onde m\xFAltiplas fontes refor\xE7am a recomenda\xE7\xE3o de instala\xE7\xE3o especializada. [cf. Vale ressaltar que recomendamos que a instala\xE7\xE3o da porta camar\xE3o seja feita por algu\xE9m especializado neste servi\xE7o; dessa forma, voc\xEA garante a qualidade na instala\xE7\xE3o e manuten\xE7\xE3o da porta, reduzindo o risco de imperfei\xE7\xF5es e acidentes] ---",
      tags: [
        "portas",
        "gavetas",
        "porta",
        "camar\xE3o",
        "funcionamento",
        "vantagens",
        "limita\xE7\xF5es",
        "ac\xFAsticas"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_porta_basculante_e_pistao_a_gas_formula_de_dimensionamento_da_forca_do_pistao",
      entidade: "PORTA BASCULANTE E PIST\xC3O A G\xC1S",
      categoria: "Portas e Gavetas",
      subcategoria: "PORTA BASCULANTE E PIST\xC3O A G\xC1S",
      titulo: "F\xF3rmula de dimensionamento da for\xE7a do pist\xE3o",
      tipo: "boa_pratica",
      descricao: "A for\xE7a ideal do pist\xE3o a g\xE1s para uma porta basculante pode ser estimada por uma f\xF3rmula pr\xE1tica de mercado: for\xE7a (kg) = 6 \xD7 peso da porta (kg) \xD7 altura da porta (m) \xF7 1000 [nota: a f\xF3rmula publicada usa a altura em mm dividida por 1000, equivalente a metros]. Exemplo de cat\xE1logo: porta de MDF 15 mm, com 600 mm de altura e 2,6 kg de peso, resulta em for\xE7a ideal de aproximadamente 9,36 kg \u2014 arredondando para um pist\xE3o de 10 kg (10 N, na nomenclatura comercial simplificada). [cf. F\xF3rmula para calcular a for\xE7a ideal que ir\xE1 precisar para seu pist\xE3o: 6 x Peso x Altura / 1000. Exemplo uma porta de MDF 15mm, com altura de 600mm e peso de 2,6kg: 6 x 2,6 x 600/1000 = 9,36kg. Ou seja, neste caso o pist\xE3o ideal \xE9 o de 10kg]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de pist\xE3o a g\xE1s para qualquer porta basculante (arm\xE1rio a\xE9reo de cozinha, torre alta, arm\xE1rio de escrit\xF3rio).",
        condicoes_adicionais: "Sempre usar dois pist\xF5es por porta (um em cada lateral), para distribuir a for\xE7a igualmente e evitar tor\xE7\xE3o. [cf. Sempre usar 2 pist\xF5es (um em cada lateral) para distribuir a for\xE7a igualmente e evitar tor\xE7\xE3o na porta] A for\xE7a do pist\xE3o tamb\xE9m \xE9 frequentemente expressa em Newtons (N) por fabricantes, com correspond\xEAncia aproximada de mercado: 60 N \u2248 6 kg, 80 N \u2248 8 kg, 100 N \u2248 10 kg, 120 N \u2248 12 kg, 150 N \u2248 15 kg. [cf. For\xE7a 60N = Suporta at\xE9 6Kg; For\xE7a 80N = Suporta at\xE9 8 Kg; For\xE7a 100N = Suporta at\xE9 10Kg; For\xE7a 120N = Suporta at\xE9 12Kg; For\xE7a 150N = Suporta at\xE9 15Kg]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo portas pequenas devem ter o pist\xE3o calculado, j\xE1 que um pist\xE3o subdimensionado n\xE3o sustenta a porta aberta, e um superdimensionado pode dificultar o fechamento manual.",
        limitacoes: "A correspond\xEAncia N\u2194kg divulgada comercialmente \xE9 uma simplifica\xE7\xE3o de mercado, n\xE3o uma equival\xEAncia f\xEDsica exata (Newton \xE9 unidade de for\xE7a, n\xE3o de massa) \u2014 deve ser usada como refer\xEAncia pr\xE1tica de cat\xE1logo, e sempre confirmada com a ficha t\xE9cnica do fabricante espec\xEDfico."
      },
      acoes_recomendadas: "Pist\xE3o de for\xE7a inversa (a \xF3leo, n\xE3o a g\xE1s) para portas de abertura para baixo (tipo porta de forno), que seguem l\xF3gica de dimensionamento e instala\xE7\xE3o diferente da porta basculante convencional. [cf. Caso o cliente queira portas que abrem para baixo, o pist\xE3o a ser utilizado \xE9 o de for\xE7a inversa]",
      motivo_tecnico: "A for\xE7a ideal do pist\xE3o a g\xE1s para uma porta basculante pode ser estimada por uma f\xF3rmula pr\xE1tica de mercado: for\xE7a (kg) = 6 \xD7 peso da porta (kg) \xD7 altura da porta (m) \xF7 1000 [nota: a f\xF3rmula publicada usa a altura em mm dividida por 1000, equivalente a metros]. Exemplo de cat\xE1logo: porta de MDF 15 mm, com 600 mm de altura e 2,6 kg de peso, resulta em for\xE7a ideal de aproximadamente 9,36 kg \u2014 arredondando para um pist\xE3o de 10 kg (10 N, na nomenclatura comercial simplificada). [cf. F\xF3rmula para calcular a for\xE7a ideal que ir\xE1 precisar para seu pist\xE3o: 6 x Peso x Altura / 1000. Exemplo uma porta de MDF 15mm, com altura de 600mm e peso de 2,6kg: 6 x 2,6 x 600/1000 = 9,36kg. Ou seja, neste caso o pist\xE3o ideal \xE9 o de 10kg]",
      impacto: {
        estrutural: "alto",
        financeiro: "baixo",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Toque Final (ficha t\xE9cnica com f\xF3rmula); Ferragens Marcenaria (ficha t\xE9cnica de convers\xE3o N/kg); Soprano (fabricante, blog institucional).",
      fabricante: "FGVTN, Soprano (refer\xEAncias de linha de produto e \xE2ngulos de abertura 75\xB0/90\xB0/100\u2013110\xB0).",
      observacoes: "A altura padr\xE3o de instala\xE7\xE3o da base do pist\xE3o no corpo do m\xF3vel fica entre 8 e 10 cm do topo, segundo refer\xEAncia de mercado \u2014 par\xE2metro \xFAtil para automatizar a posi\xE7\xE3o de fura\xE7\xE3o no motor de regras do Planne. [cf. A altura padr\xE3o da base no corpo do m\xF3vel fica entre 8 e 10 cm do topo] ---",
      tags: [
        "portas",
        "gavetas",
        "porta",
        "basculante",
        "pist\xE3o",
        "f\xF3rmula",
        "dimensionamento",
        "for\xE7a"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_porta_basculante_e_pistao_a_gas_angulos_de_abertura_e_compatibilidade_com_o_u",
      entidade: "PORTA BASCULANTE E PIST\xC3O A G\xC1S",
      categoria: "Portas e Gavetas",
      subcategoria: "PORTA BASCULANTE E PIST\xC3O A G\xC1S",
      titulo: "\xC2ngulos de abertura e compatibilidade com o uso do ambiente",
      tipo: "recomendacao",
      descricao: "Pist\xF5es a g\xE1s para porta basculante permitem regulagem em \xE2ngulos t\xEDpicos de 75\xB0, 90\xB0 ou 100\u2013110\xB0, e essa escolha deve considerar o espa\xE7o livre acima do m\xF3vel (para n\xE3o haver colis\xE3o com o teto, lumin\xE1ria ou coifa) e o conforto de acesso ao conte\xFAdo do arm\xE1rio. [cf. Pode ser instalado em tr\xEAs \xE2ngulos diferentes, 75\xBA, 90\xBA e 100\xBA graus, conforme projeto ou necessidade do usu\xE1rio]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de arm\xE1rio a\xE9reo de cozinha com porta basculante, especialmente pr\xF3ximo \xE0 coifa ou a vigas/rebaixos de gesso.",
        condicoes_adicionais: "Considerar o peso total da porta, o estilo do m\xF3vel e a conveni\xEAncia de abertura suave (com ou sem amortecimento) na escolha do pist\xE3o espec\xEDfico. [cf. Dicas importantes para escolher o pist\xE3o ideal para seu m\xF3vel: conferir o \xE2ngulo de abertura e fechamento da porta ou tampa... peso total da porta... conveni\xEAncia, se ser\xE1 suave ao abrir e tamb\xE9m ao fechar]"
      },
      restricoes: {
        quando_nao_aplicar: "Em ambientes com p\xE9-direito muito baixo, \xE2ngulos maiores (100\u2013110\xB0) podem n\xE3o ser vi\xE1veis \u2014 verificar sempre o espa\xE7o livre vertical dispon\xEDvel antes de definir o \xE2ngulo.",
        limitacoes: 'Modelos "mini" (menores que o convencional) s\xE3o recomendados para espa\xE7os mais otimizados, mas t\xEAm capacidade de carga proporcionalmente menor. [cf. Os modelos mini, que s\xE3o menores do que os convencionais, s\xE3o recomendados para espa\xE7os mais otimizados]'
      },
      acoes_recomendadas: 'Uso de dobradi\xE7a de eleva\xE7\xE3o especial (ver m\xF3dulo Ferragens, item 1.2 \u2014 sistemas de dobradi\xE7a para portas de eleva\xE7\xE3o com tabela peso \xD7 quantidade) em vez de pist\xE3o a g\xE1s simples, quando o peso da porta \xE9 elevado e a est\xE9tica de "sem pist\xE3o aparente" \xE9 desejada.',
      motivo_tecnico: "Pist\xF5es a g\xE1s para porta basculante permitem regulagem em \xE2ngulos t\xEDpicos de 75\xB0, 90\xB0 ou 100\u2013110\xB0, e essa escolha deve considerar o espa\xE7o livre acima do m\xF3vel (para n\xE3o haver colis\xE3o com o teto, lumin\xE1ria ou coifa) e o conforto de acesso ao conte\xFAdo do arm\xE1rio. [cf. Pode ser instalado em tr\xEAs \xE2ngulos diferentes, 75\xBA, 90\xBA e 100\xBA graus, conforme projeto ou necessidade do usu\xE1rio]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guia da Marcenaria; Tudo na M\xE3o (loja especializada em ferragens).",
      fabricante: "N/A (regra geral, v\xE1lida para a maioria dos fabricantes de pist\xE3o a g\xE1s).",
      observacoes: "Nunca lubrificar o pist\xE3o a g\xE1s com \xF3leo ou produtos similares \u2014 isso danifica o mecanismo interno, segundo orienta\xE7\xE3o recorrente de m\xFAltiplos fabricantes consultados. [cf. N\xE3o utilize \xF3leo lubrificante ou similares, isso ir\xE1 danificar o pist\xE3o] ---",
      tags: [
        "portas",
        "gavetas",
        "porta",
        "basculante",
        "pist\xE3o",
        "\xE2ngulos",
        "abertura",
        "compatibilidade"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_gavetas_folgas_entre_frentes_e_composicao_vertical_folgas_entre_frentes_de_ga",
      entidade: "GAVETAS \u2014 FOLGAS ENTRE FRENTES E COMPOSI\xC7\xC3O VERTICAL",
      categoria: "Portas e Gavetas",
      subcategoria: "GAVETAS \u2014 FOLGAS ENTRE FRENTES E COMPOSI\xC7\xC3O VERTICAL",
      titulo: "Folgas entre frentes de gaveta e distribui\xE7\xE3o de altura",
      tipo: "recomendacao",
      descricao: "Recomenda-se deixar ao menos 2 cm de espa\xE7o entre cada frente de gaveta (considerando espessura do fundo e folgas de ajuste), com a altura total dispon\xEDvel do m\xF3dulo dividida considerando folgas superiores e inferiores adicionais de cerca de 1 cm. [cf. Recomenda-se deixar ao menos 2 cm de espa\xE7o entre cada gaveta (incluindo espessura do fundo e folgas); altura total dispon\xEDvel deve ser dividida considerando folgas superiores e inferiores de 1 cm]",
      condicoes: {
        quando_aplicar: "Composi\xE7\xE3o de qualquer gaveteiro ou torre com m\xFAltiplas gavetas sobrepostas.",
        condicoes_adicionais: 'O software de projeto deve permitir configurar separadamente a "folga entre frentes de gavetas" como par\xE2metro avan\xE7ado independente da folga entre portas, j\xE1 que a l\xF3gica de composi\xE7\xE3o vertical de gavetas \xE9 distinta da composi\xE7\xE3o horizontal de portas. [cf. Folga entre frentes de gavetas: permite definir em mil\xEDmetros o espa\xE7amento entre as frentes de gavetas]'
      },
      restricoes: {
        quando_nao_aplicar: "Gaveta \xFAnica em m\xF3dulo pequeno (sem composi\xE7\xE3o vertical com outras gavetas) n\xE3o precisa deste c\xE1lculo de distribui\xE7\xE3o, apenas da folga simples de topo/base do v\xE3o.",
        limitacoes: "Erros de distribui\xE7\xE3o de altura entre gavetas resultam em desalinhamento visual percept\xEDvel e podem prejudicar o funcionamento se a corredi\xE7a n\xE3o tiver folga suficiente de manobra. [cf. Altura das gavetas desproporcionais ao uso; corredi\xE7as com folga ou mal parafusadas; alinhamento visual prejudicado por falta de espa\xE7o entre frentes; frente torta ou puxador mal centralizado]"
      },
      acoes_recomendadas: "Uso de gabaritos e niveladores de m\xF3dulo durante a montagem, para reduzir erro humano na distribui\xE7\xE3o das alturas de gaveta.",
      motivo_tecnico: "Recomenda-se deixar ao menos 2 cm de espa\xE7o entre cada frente de gaveta (considerando espessura do fundo e folgas de ajuste), com a altura total dispon\xEDvel do m\xF3dulo dividida considerando folgas superiores e inferiores adicionais de cerca de 1 cm. [cf. Recomenda-se deixar ao menos 2 cm de espa\xE7o entre cada gaveta (incluindo espessura do fundo e folgas); altura total dispon\xEDvel deve ser dividida considerando folgas superiores e inferiores de 1 cm]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "cr\xEDtico"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guia da Marcenaria (blog t\xE9cnico); Central de Ajuda Hellomob (documenta\xE7\xE3o de software).",
      fabricante: "N/A.",
      observacoes: "A profundidade ideal da gaveta depende diretamente da linha de corredi\xE7a escolhida (ver m\xF3dulo Ferragens, item 3) \u2014 este item deve ser tratado em conjunto com a especifica\xE7\xE3o de ferragem, n\xE3o isoladamente. ---",
      tags: [
        "portas",
        "gavetas",
        "folgas",
        "frentes",
        "composi\xE7\xE3o",
        "vertical",
        "gaveta",
        "distribui\xE7\xE3o"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_04_gavetas_folgas_entre_frentes_e_composicao_vertical_sequencia_de_montagem_e_al",
      entidade: "GAVETAS \u2014 FOLGAS ENTRE FRENTES E COMPOSI\xC7\xC3O VERTICAL",
      categoria: "Portas e Gavetas",
      subcategoria: "GAVETAS \u2014 FOLGAS ENTRE FRENTES E COMPOSI\xC7\xC3O VERTICAL",
      titulo: "Sequ\xEAncia de montagem e alinhamento com esquadro",
      tipo: "regra_obrigatoria",
      descricao: "A caixa da gaveta deve ser montada garantindo \xE2ngulo de 90\xB0 em todos os cantos (verificado com esquadro), antes da instala\xE7\xE3o das corredi\xE7as \u2014 travamento incorreto na caixa da gaveta (encaixe em 45\xB0 ou cavilhas/parafusos malposicionados) compromete todo o funcionamento posterior, mesmo com uma corredi\xE7a de boa qualidade. [cf. Use MDF com encaixe em 45\xBA ou travamento com cavilhas/parafusos; o fundo pode ser de 3 mm (ranhura) ou 6 mm (parafusado)]",
      condicoes: {
        quando_aplicar: "Montagem de toda e qualquer gaveta, independentemente do tipo de corredi\xE7a ou do m\xF3vel de destino.",
        condicoes_adicionais: "Ap\xF3s a montagem, testar o alinhamento visual usando n\xEDvel e esquadro antes de liberar a pe\xE7a, centralizando o espa\xE7o entre frentes conforme a folga definida (item 6.1). [cf. Teste o alinhamento visual usando um n\xEDvel e esquadro. Centralize o espa\xE7o entre as frentes (deixe 2 mm entre cada uma)]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 exce\xE7\xE3o \u2014 o esquadro da caixa da gaveta \xE9 pr\xE9-requisito universal para funcionamento correto, qualquer que seja a linha de ferragem usada.",
        limitacoes: "Corredi\xE7a instalada torta (fora de n\xEDvel) compromete todo o funcionamento da gaveta, independentemente da qualidade da caixa \u2014 regra de ouro citada \xE9 nunca instalar corredi\xE7a torta. [cf. Nunca instale corredi\xE7a torta: compromete todo o funcionamento]"
      },
      acoes_recomendadas: "Uso de fita dupla-face para posicionar a corredi\xE7a antes da fixa\xE7\xE3o definitiva por parafuso, reduzindo erro de alinhamento durante a instala\xE7\xE3o. [cf. Use fita dupla face para posicionar e depois parafuse por dentro]",
      motivo_tecnico: "A caixa da gaveta deve ser montada garantindo \xE2ngulo de 90\xB0 em todos os cantos (verificado com esquadro), antes da instala\xE7\xE3o das corredi\xE7as \u2014 travamento incorreto na caixa da gaveta (encaixe em 45\xB0 ou cavilhas/parafusos malposicionados) compromete todo o funcionamento posterior, mesmo com uma corredi\xE7a de boa qualidade. [cf. Use MDF com encaixe em 45\xBA ou travamento com cavilhas/parafusos; o fundo pode ser de 3 mm (ranhura) ou 6 mm (parafusado)]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guia da Marcenaria (blog t\xE9cnico, guia passo a passo de instala\xE7\xE3o de gaveta).",
      fabricante: "N/A (processo, aplic\xE1vel a qualquer fabricante de corredi\xE7a).",
      observacoes: 'Esta regra se conecta diretamente ao item 3.2 do m\xF3dulo Estrutura (montagem sobre superf\xEDcie plana antes de fixar o fundo) \u2014 o mesmo princ\xEDpio de "esquadro antes de travar" se aplica tanto ao corpo do m\xF3vel quanto \xE0 caixa interna da gaveta. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura** e **Portas e Gavetas** (este documento). Sequ\xEAncia sugerida para continuidade: 1. **Materiais** \u2014 MDF, MDP, compensado (Arauco, Duratex, Berneck, Guararapes, Greenplac) \u2014 densidade, espessuras-padr\xE3o, resist\xEAncia \xE0 umidade. 2. **Closets** \u2014 cabideiros, maleiros, sapateiras, calceiros, joalheiros, espelhos, ilumina\xE7\xE3o. 3. **Banheiros e Escrit\xF3rios**. 4. **Produ\xE7\xE3o, Transporte, Montagem, Economia** \u2014 conhecimento operacional. Todos os arquivos produzidos at\xE9 agora ser\xE3o organizados em uma pasta \xFAnica de entrega.',
      tags: [
        "portas",
        "gavetas",
        "folgas",
        "frentes",
        "composi\xE7\xE3o",
        "vertical",
        "sequ\xEAncia",
        "montagem"
      ],
      modulo_origem: "04-Portas e Gavetas",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_mdf_vs_mdp_diferencas_estruturais_e_de_aplicacao_composicao_e_diferenca_estru",
      entidade: "MDF VS. MDP \u2014 DIFEREN\xC7AS ESTRUTURAIS E DE APLICA\xC7\xC3O",
      categoria: "Materiais",
      subcategoria: "MDF VS. MDP \u2014 DIFEREN\xC7AS ESTRUTURAIS E DE APLICA\xC7\xC3O",
      titulo: "Composi\xE7\xE3o e diferen\xE7a estrutural entre MDF e MDP",
      tipo: "boa_pratica",
      descricao: 'MDF (Medium Density Fiberboard) \xE9 feito de fibras de madeira prensadas e aglutinadas com resina sint\xE9tica, resultando em material homog\xEAneo em toda a espessura; MDP (Medium Density Particleboard) \xE9 feito de part\xEDculas de madeira prensadas, estruturado em tr\xEAs camadas \u2014 uma camada central mais espessa (miolo) e duas camadas finas nas superf\xEDcies \u2014 o que confere maior robustez e capacidade de suportar peso, apesar de ser mais leve que o MDF. [cf. "O MDP \xE9 feito de part\xEDculas ou peda\xE7os de madeira prensados. J\xE1 o MDF \xE9 feito de p\xF3 de madeira prensada, aglutinada com resina sint\xE9tica"] [cf. O MDP \xE9 estruturado em tr\xEAs camadas: uma camada central mais espessa e duas camadas finas nas superf\xEDcies. Essa constru\xE7\xE3o confere ao material uma maior robustez e capacidade de suportar mais peso do que o MDF, apesar de ser mais leve]',
      condicoes: {
        quando_aplicar: "Toda decis\xE3o de especifica\xE7\xE3o de material-base de qualquer pe\xE7a do m\xF3vel deve come\xE7ar por esta distin\xE7\xE3o fundamental.",
        condicoes_adicionais: "Para pe\xE7as retas e estruturais (corpo do m\xF3vel, prateleiras, divis\xF3rias), o MDP tende a ser mais indicado por resist\xEAncia e custo; para pe\xE7as com acabamento fino, cortes curvos, bordas arredondadas e pintura (portas, frentes, detalhes decorativos), o MDF \xE9 mais indicado pela superf\xEDcie lisa e homog\xEAnea. [cf. Para projetos de carpintaria e marcenaria que exijam maior resist\xEAncia a impactos e tra\xE7\xE3o, como prateleiras e estantes, o MDP pode ser a op\xE7\xE3o mais indicada. J\xE1 para projetos que demandem acabamento mais refinado e superf\xEDcies lisas, como portas e tampos de mesa, o MDF pode ser a escolha certa]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa desta an\xE1lise \u2014 \xE9 a decis\xE3o mais b\xE1sica de todo o projeto de marcenaria.",
        limitacoes: "O MDP tem dificuldade de usinagem para bordas arredondadas e pintura/laqueamento \u2014 por ser fabricado em camadas, quando cortado ou arredondado pode apresentar furinhos vis\xEDveis que dificultam o acabamento. [cf. Usar MDP para m\xF3vel que ser\xE1 laqueado n\xE3o funciona, porque o MDP \xE9 feito em camadas, ent\xE3o quando \xE9 cortado, ou tentamos arredondar, ficam uns furinhos, que d\xE3o muito trabalho para dar acabamento]"
      },
      acoes_recomendadas: "Combina\xE7\xE3o dos dois materiais no mesmo m\xF3vel \u2014 MDP para o corpo/caixaria e MDF para portas e detalhes \u2014 \xE9 citada como pr\xE1tica comum de mercado. [cf. Muitas empresas trabalham com MDP para fazer o corpo, e MDF para fazer as portas e alguns detalhes]",
      motivo_tecnico: 'MDF (Medium Density Fiberboard) \xE9 feito de fibras de madeira prensadas e aglutinadas com resina sint\xE9tica, resultando em material homog\xEAneo em toda a espessura; MDP (Medium Density Particleboard) \xE9 feito de part\xEDculas de madeira prensadas, estruturado em tr\xEAs camadas \u2014 uma camada central mais espessa (miolo) e duas camadas finas nas superf\xEDcies \u2014 o que confere maior robustez e capacidade de suportar peso, apesar de ser mais leve que o MDF. [cf. "O MDP \xE9 feito de part\xEDculas ou peda\xE7os de madeira prensados. J\xE1 o MDF \xE9 feito de p\xF3 de madeira prensada, aglutinada com resina sint\xE9tica"] [cf. O MDP \xE9 estruturado em tr\xEAs camadas: uma camada central mais espessa e duas camadas finas nas superf\xEDcies. Essa constru\xE7\xE3o confere ao material uma maior robustez e capacidade de suportar mais peso do que o MDF, apesar de ser mais leve]',
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Leroy Merlin (blog, com declara\xE7\xE3o de marceneira profissional); Ital\xEDnea (blog institucional); Anhanguera Ferramentas (blog t\xE9cnico).",
      fabricante: "Refer\xEAncia geral de mercado, v\xE1lida para qualquer fabricante nacional de MDF/MDP.",
      observacoes: 'Diferente da madeira maci\xE7a, o MDF n\xE3o se expande ou contrai por temperatura/umidade da mesma forma \u2014 \xE9 dimensionalmente mais consistente, mas ainda vulner\xE1vel \xE0 \xE1gua (ver item 2). [cf. Diferentemente da madeira maci\xE7a, que \xE9 "viva" e "trabalha" conforme a temperatura ambiente, o MDF n\xE3o se expande ou se contrai devido ao calor e umidade, como ocorre com a madeira maci\xE7a] ---',
      tags: [
        "materiais",
        "diferen\xE7as",
        "estruturais",
        "aplica\xE7\xE3o",
        "composi\xE7\xE3o",
        "diferen\xE7a",
        "estrutural"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_mdf_vs_mdp_diferencas_estruturais_e_de_aplicacao_resistencia_a_umidade_e_ao_e",
      entidade: "MDF VS. MDP \u2014 DIFEREN\xC7AS ESTRUTURAIS E DE APLICA\xC7\xC3O",
      categoria: "Materiais",
      subcategoria: "MDF VS. MDP \u2014 DIFEREN\xC7AS ESTRUTURAIS E DE APLICA\xC7\xC3O",
      titulo: "Resist\xEAncia \xE0 umidade e ao empenamento: MDP como vantagem estrutural",
      tipo: "boa_pratica",
      descricao: "Em termos de resist\xEAncia \xE0 umidade e ao empenamento, o MDP tende a levar vantagem sobre o MDF convencional \u2014 as part\xEDculas entrela\xE7adas em m\xFAltiplas camadas oferecem maior resist\xEAncia ao empenamento, enquanto o MDF, com fibras dispostas lado a lado, tem maior propens\xE3o a empenar. [cf. Empenamento: feitos de fibras que ficam lado a lado com maior possibilidade de empenamentos, j\xE1 no MDP as part\xEDculas se entrela\xE7am dando maior resist\xEAncia] Isso torna o MDP mais indicado para ambientes com umidade elevada, como cozinhas e banheiros, mesmo no formato convencional (n\xE3o hidr\xF3fugo). [cf. O MDP \xE9 mais resistente ao empenamento causado por umidade e calor, o que o torna ideal para ambientes sujeitos a essas condi\xE7\xF5es, como cozinhas e banheiros]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de material em ambientes de cozinha, banheiro, \xE1rea de servi\xE7o \u2014 mesmo antes de considerar linhas hidr\xF3fugas especiais (m\xF3dulo 2).",
        condicoes_adicionais: "Nenhum dos dois materiais (MDF ou MDP convencionais) \xE9 \xE0 prova d'\xE1gua \u2014 a resist\xEAncia superior do MDP \xE9 relativa, n\xE3o absoluta."
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o substitui totalmente uma linha hidr\xF3fuga dedicada em \xE1reas de contato direto e constante com \xE1gua \u2014 \xE9 uma vantagem relativa, n\xE3o uma resist\xEAncia \xE0 prova d'\xE1gua.",
        limitacoes: "Superf\xEDcie do MDP \xE9 mais \xE1spera/texturizada, o que pode dificultar acabamentos refinados mesmo quando a resist\xEAncia \xE0 umidade \xE9 priorizada. [cf. Possui superf\xEDcie \xE1spera e texturizada, o que pode dificultar o acabamento]"
      },
      acoes_recomendadas: "Linhas hidr\xF3fugas espec\xEDficas de MDF (ver m\xF3dulo 2) quando o acabamento fino \xE9 necess\xE1rio mas o ambiente \xE9 \xFAmido.",
      motivo_tecnico: "Em termos de resist\xEAncia \xE0 umidade e ao empenamento, o MDP tende a levar vantagem sobre o MDF convencional \u2014 as part\xEDculas entrela\xE7adas em m\xFAltiplas camadas oferecem maior resist\xEAncia ao empenamento, enquanto o MDF, com fibras dispostas lado a lado, tem maior propens\xE3o a empenar. [cf. Empenamento: feitos de fibras que ficam lado a lado com maior possibilidade de empenamentos, j\xE1 no MDP as part\xEDculas se entrela\xE7am dando maior resist\xEAncia] Isso torna o MDP mais indicado para ambientes com umidade elevada, como cozinhas e banheiros, mesmo no formato convencional (n\xE3o hidr\xF3fugo). [cf. O MDP \xE9 mais resistente ao empenamento causado por umidade e calor, o que o torna ideal para ambientes sujeitos a essas condi\xE7\xF5es, como cozinhas e banheiros]",
      impacto: {
        estrutural: "alto",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Raizen Machine (blog t\xE9cnico); Anhanguera Ferramentas.",
      fabricante: "N/A (compara\xE7\xE3o gen\xE9rica de material).",
      observacoes: "O MDP tamb\xE9m \xE9 fabricado a partir de madeira de reflorestamento (pinus, eucalipto), sendo citado como op\xE7\xE3o sustent\xE1vel equivalente ao MDF em termos de origem de mat\xE9ria-prima. [cf. \xC9 sustent\xE1vel, pois \xE9 fabricado a partir de madeira de reflorestamento, como pinus e eucalipto] ---",
      tags: [
        "materiais",
        "diferen\xE7as",
        "estruturais",
        "aplica\xE7\xE3o",
        "resist\xEAncia",
        "umidade",
        "empenamento",
        "vantagem"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_mdf_hidrofugo_ruc_ultra_linhas_resistentes_a_umidade_por_fabricante_linha_ruc",
      entidade: "MDF HIDR\xD3FUGO/RUC/ULTRA \u2014 LINHAS RESISTENTES \xC0 UMIDADE POR FABRICANTE",
      categoria: "Materiais",
      subcategoria: "MDF HIDR\xD3FUGO/RUC/ULTRA \u2014 LINHAS RESISTENTES \xC0 UMIDADE POR FABRICANTE",
      titulo: "Linha RUC da Guararapes",
      tipo: "recomendacao",
      descricao: "A linha RUC (Resistente \xE0 Umidade e Cupim) da Guararapes est\xE1 dispon\xEDvel em chapas cruas e revestidas (Maxi Branco, Branco TX), no formato padr\xE3o de 2.750 \xD7 1.850 mm, nas espessuras de 3, 6, 12, 15 e 18 mm (a vers\xE3o de 3 mm apenas crua, sem revestimento). [cf. O MDF RUC est\xE1 dispon\xEDvel em chapas cruas (MDF n\xE3o revestido) e nas vers\xF5es Maxi Branco e Branco TX, ambos em chapas de 2750 x 1850 mm, nas espessuras de 3, 6, 12 e 15 e 18 mm] A colora\xE7\xE3o esverdeada caracter\xEDstica \xE9 apenas um pigmento de identifica\xE7\xE3o internacional de produto hidr\xF3fugo, n\xE3o um indicador de composi\xE7\xE3o diferente. [cf. A colora\xE7\xE3o esverdeada do MDF RUC \xE9 decorrente de um pigmento que serve apenas como identifica\xE7\xE3o internacional de produto hidr\xF3fugo]",
      condicoes: {
        quando_aplicar: "M\xF3veis planejados para cozinha, banheiro, lavanderia e regi\xF5es litor\xE2neas/serranas com umidade relativa do ar elevada. [cf. MDF resistente a umidade e cupim. Ideal para locais \xFAmidos, como banheiros, cozinhas, lavabos e lavanderias, al\xE9m de projetos em \xE1reas litor\xE2neas e regi\xF5es serranas, onde a umidade relativa do ar \xE9 mais alta]",
        condicoes_adicionais: "A tecnologia RUC n\xE3o torna o MDF \xE0 prova d'\xE1gua \u2014 \xE9 sempre recomendado aplicar fita de borda em todos os lados do painel e verificar infiltra\xE7\xF5es antes da instala\xE7\xE3o. [cf. A tecnologia RUC da Guararapes n\xE3o torna o MDF \xE0 prova d'\xE1gua. Por isso, \xE9 sempre recomendado aplicar fita de borda em todos os lados do painel e verificar poss\xEDveis infiltra\xE7\xF5es antes da instala\xE7\xE3o do m\xF3vel] Tamb\xE9m \xE9 necess\xE1rio verificar presen\xE7a de cupins antes de qualquer instala\xE7\xE3o, j\xE1 que a linha \xE9 resistente mas n\xE3o imune a pragas em focos j\xE1 estabelecidos. [cf. Tamb\xE9m \xE9 necess\xE1rio verificar se h\xE1 prolifera\xE7\xE3o de cupins ou outras pragas antes de fazer qualquer instala\xE7\xE3o]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o deve ser especificado como solu\xE7\xE3o para contato direto e constante com \xE1gua (pias sem veda\xE7\xE3o, \xE1reas externas descobertas) \u2014 a linha reduz mas n\xE3o elimina a vulnerabilidade \xE0 umidade.",
        limitacoes: "Restrito \xE0s espessuras e formatos de fabrica\xE7\xE3o padr\xE3o da linha \u2014 n\xE3o substitui totalmente compensado naval em exposi\xE7\xE3o direta e constante \xE0 \xE1gua (ver item 3)."
      },
      acoes_recomendadas: 'Vers\xE3o "RUC Grafite" com tripla prote\xE7\xE3o (umidade, cupim e tecnologia NanoxClean\xAE antimicrobiana), para projetos que buscam prote\xE7\xE3o adicional contra v\xEDrus, fungos e bact\xE9rias na superf\xEDcie. [cf. Tripla prote\xE7\xE3o RUC: Umidade, Cupim e NanoxClean\xAE \u2014 MDF com resist\xEAncia a umidade e cupins. O RUC Grafite conta tamb\xE9m com a exclusiva nanotecnologia NanoxClean\xAE, que protege a superf\xEDcie do MDF contra v\xEDrus, fungos e bact\xE9rias]',
      motivo_tecnico: "A linha RUC (Resistente \xE0 Umidade e Cupim) da Guararapes est\xE1 dispon\xEDvel em chapas cruas e revestidas (Maxi Branco, Branco TX), no formato padr\xE3o de 2.750 \xD7 1.850 mm, nas espessuras de 3, 6, 12, 15 e 18 mm (a vers\xE3o de 3 mm apenas crua, sem revestimento). [cf. O MDF RUC est\xE1 dispon\xEDvel em chapas cruas (MDF n\xE3o revestido) e nas vers\xF5es Maxi Branco e Branco TX, ambos em chapas de 2750 x 1850 mm, nas espessuras de 3, 6, 12 e 15 e 18 mm] A colora\xE7\xE3o esverdeada caracter\xEDstica \xE9 apenas um pigmento de identifica\xE7\xE3o internacional de produto hidr\xF3fugo, n\xE3o um indicador de composi\xE7\xE3o diferente. [cf. A colora\xE7\xE3o esverdeada do MDF RUC \xE9 decorrente de um pigmento que serve apenas como identifica\xE7\xE3o internacional de produto hidr\xF3fugo]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guararapes (blog institucional e ficha de produto).",
      fabricante: "Guararapes (linha RUC).",
      observacoes: "Focos de cupim ou infiltra\xE7\xE3o devem ser eliminados antes da instala\xE7\xE3o \u2014 a linha protege contra novo ataque, mas n\xE3o trata uma infesta\xE7\xE3o pr\xE9-existente. [cf. Focos de cupins ou infiltra\xE7\xF5es devem ser eliminados antes da instala\xE7\xE3o do produto] ---",
      tags: [
        "materiais",
        "hidr\xF3fugo",
        "ultra",
        "linhas",
        "resistentes",
        "umidade",
        "fabricante",
        "linha"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_mdf_hidrofugo_ruc_ultra_linhas_resistentes_a_umidade_por_fabricante_linha_ult",
      entidade: "MDF HIDR\xD3FUGO/RUC/ULTRA \u2014 LINHAS RESISTENTES \xC0 UMIDADE POR FABRICANTE",
      categoria: "Materiais",
      subcategoria: "MDF HIDR\xD3FUGO/RUC/ULTRA \u2014 LINHAS RESISTENTES \xC0 UMIDADE POR FABRICANTE",
      titulo: "Linha Ultra Premium/Hidr\xF3fugo da Duratex e Arauco",
      tipo: "boa_pratica",
      descricao: "A Duratex oferece a linha MDF Ultra Premium, com resinas que conferem resist\xEAncia \xE0 umidade e colora\xE7\xE3o levemente esverdeada (padr\xE3o internacional de identifica\xE7\xE3o), indicada para cozinhas e banheiros, com tratamento fitossanit\xE1rio contra pragas e cupins. [cf. O MDF Ultra Premium Duratex \xE9 um painel de m\xE9dia densidade com resinas que conferem resist\xEAncia \xE0 umidade... possui uma leve colora\xE7\xE3o verde internacionalmente reconhecida... apresenta tratamento fitossanit\xE1rio contra pragas e cupins] A Arauco oferece linha equivalente (MDF Hidr\xF3fugo), com mix de resinas especiais que impedem o incha\xE7o do substrato. [cf. O MDF Hidr\xF3fugo tem, em sua composi\xE7\xE3o, um mix de resinas especiais que, em conjunto, impedem o incha\xE7o do substrato e, assim, torna os pain\xE9is resistentes \xE0 umidade]",
      condicoes: {
        quando_aplicar: "Mesmas aplica\xE7\xF5es da linha RUC (item 2.1) \u2014 cozinhas, banheiros, ambientes de umidade elevada.",
        condicoes_adicionais: "Ambientes com infesta\xE7\xE3o de cupim pr\xE9-existente devem ser tratados antes da instala\xE7\xE3o, independentemente da linha hidr\xF3fuga escolhida. [cf. Ambientes com cupins devem ser tratados antes da instala\xE7\xE3o]"
      },
      restricoes: {
        quando_nao_aplicar: "Recomenda-se uso em \xE1reas cobertas e sem contato direto com \xE1gua \u2014 n\xE3o indicado para exposi\xE7\xE3o direta e constante \xE0 chuva ou imers\xE3o. [cf. Recomenda-se o uso em \xE1reas cobertas e sem contato direto com \xE1gua]",
        limitacoes: "Nenhuma linha hidr\xF3fuga de MDF \xE9 totalmente \xE0 prova d'\xE1gua \u2014 mesmo com aditivos, exposi\xE7\xE3o prolongada ainda pode comprometer a estrutura ao longo do tempo. [cf. \xC9 fundamental destacar que, apesar de sua resist\xEAncia superior, o MDF Ultra n\xE3o \xE9 um material \xE0 prova d'\xE1gua. Exposi\xE7\xE3o prolongada ou imers\xE3o direta em \xE1gua ainda pode comprometer sua estrutura ao longo do tempo]"
      },
      acoes_recomendadas: "Compensado naval (item 3), quando a exposi\xE7\xE3o \xE0 \xE1gua \xE9 mais severa que o esperado para MDF hidr\xF3fugo/Ultra.",
      motivo_tecnico: "A Duratex oferece a linha MDF Ultra Premium, com resinas que conferem resist\xEAncia \xE0 umidade e colora\xE7\xE3o levemente esverdeada (padr\xE3o internacional de identifica\xE7\xE3o), indicada para cozinhas e banheiros, com tratamento fitossanit\xE1rio contra pragas e cupins. [cf. O MDF Ultra Premium Duratex \xE9 um painel de m\xE9dia densidade com resinas que conferem resist\xEAncia \xE0 umidade... possui uma leve colora\xE7\xE3o verde internacionalmente reconhecida... apresenta tratamento fitossanit\xE1rio contra pragas e cupins] A Arauco oferece linha equivalente (MDF Hidr\xF3fugo), com mix de resinas especiais que impedem o incha\xE7o do substrato. [cf. O MDF Hidr\xF3fugo tem, em sua composi\xE7\xE3o, um mix de resinas especiais que, em conjunto, impedem o incha\xE7o do substrato e, assim, torna os pain\xE9is resistentes \xE0 umidade]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Meu M\xF3vel Planejado (guia comparativo entre marcas); Arm\xE1rios Criar (blog t\xE9cnico comparativo com Compensado Naval); Arauco (ficha t\xE9cnica oficial).",
      fabricante: "Duratex (MDF Ultra Premium), Arauco (MDF Hidr\xF3fugo). Outras marcas com linhas equivalentes citadas: Berneck, Floraplac, Greenplac. [cf. As diferentes marcas, como Berneck, Guararapes, Floraplac, Duratex, Arauco e Greenplac, contribuem com suas inova\xE7\xF5es, oferecendo op\xE7\xF5es espec\xEDficas para diversas necessidades]",
      observacoes: 'A denomina\xE7\xE3o popular "MDF verde" vem justamente da colora\xE7\xE3o de identifica\xE7\xE3o usada por praticamente todos os fabricantes de linha hidr\xF3fuga \u2014 \xE9 \xFAtil como sinal visual r\xE1pido de reconhecimento em obra, mas n\xE3o deve ser usada como \xFAnico crit\xE9rio de especifica\xE7\xE3o t\xE9cnica (\xE9 necess\xE1rio confirmar a ficha t\xE9cnica do fabricante espec\xEDfico). ---',
      tags: [
        "materiais",
        "hidr\xF3fugo",
        "ultra",
        "linhas",
        "resistentes",
        "umidade",
        "fabricante",
        "linha"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_compensado_naval_quando_usar_em_vez_de_mdf_composicao_e_resistencia_tecnica_s",
      entidade: "COMPENSADO NAVAL \u2014 QUANDO USAR EM VEZ DE MDF",
      categoria: "Materiais",
      subcategoria: "COMPENSADO NAVAL \u2014 QUANDO USAR EM VEZ DE MDF",
      titulo: "Composi\xE7\xE3o e resist\xEAncia t\xE9cnica superior \xE0 umidade",
      tipo: "boa_pratica",
      descricao: "O compensado naval \xE9 formado por l\xE2minas de madeira sobrepostas em sentido alternado (n\xFAmero \xEDmpar de l\xE2minas, com capas no mesmo sentido), coladas com resina fen\xF3lica WBP (water boiled proof), que \xE9 significativamente mais resistente \xE0 \xE1gua do que colas convencionais. [cf. Compensado naval \xE9 formado por l\xE2minas de madeira selecionadas, sobrepostas em sentido alternado, uma a uma, em n\xFAmero \xEDmpar, com capas no mesmo sentido] [cf. Compensado naval \xE9 um material composto por l\xE2minas de madeiras postas uma sobre a outra e colada com resina fen\xF3lica WBP \u2013 um pol\xEDmero \xE0 prova d'\xE1gua que atua como uma cola, bastante resistente] Em testes documentados por marceneiros especializados, o compensado naval expande apenas cerca de 4% ap\xF3s 24 horas em contato com \xE1gua, contra cerca de 23% do MDF nas mesmas condi\xE7\xF5es. [cf. O compensado naval... expande apenas 4% ap\xF3s 24 horas em contato com \xE1gua, contra 23% do MDF nas mesmas condi\xE7\xF5es, segundo testes documentados por marceneiros especializados]",
      condicoes: {
        quando_aplicar: "Prateleiras de v\xE3o longo sem suporte intermedi\xE1rio, tampos de bancada gourmet, mobili\xE1rio de \xE1reas externas cobertas, embarca\xE7\xF5es, e qualquer ambiente com varia\xE7\xE3o de umidade mais severa que o esperado para MDF hidr\xF3fugo. [cf. Essa estabilidade faz dele a escolha certa para prateleiras largas sem suporte intermedi\xE1rio, tampos de bancada gourmet, mobili\xE1rio de \xE1reas externas cobertas e qualquer ambiente com varia\xE7\xE3o de umidade]",
        condicoes_adicionais: 'Exigir sempre compensado naval "verdadeiro", feito com virola ou madeira equivalente \u2014 compensado comum de pinus n\xE3o tem nem metade da resist\xEAncia e n\xE3o serve para as mesmas aplica\xE7\xF5es, mesmo sendo vendido informalmente como substituto mais barato. [cf. Pe\xE7a sempre o compensado naval verdadeiro, feito com virola ou madeira equivalente. O compensado comum de pinus n\xE3o tem nem metade da resist\xEAncia e n\xE3o serve para as mesmas aplica\xE7\xF5es]'
      },
      restricoes: {
        quando_nao_aplicar: "Para pe\xE7as que exigem acabamento fino, usinagem detalhada e pintura refinada, o MDF ainda entrega resultado superior \u2014 o compensado naval \xE9 mais indicado para robustez estrutural do que para acabamento est\xE9tico fino. [cf. Para acabamentos, usinagem e pintura, o MDF entrega resultado muito melhor. O ideal \xE9 usar os dois no mesmo projeto, cada um onde tem vantagem]",
        limitacoes: "Custo mais elevado que o MDF equivalente \u2014 refer\xEAncia de mercado (S\xE3o Paulo, 2024) na faixa de R$ 240 a R$ 310 por m\xB2, e exige ferramentas mais robustas para corte/usinagem em compara\xE7\xE3o ao MDF. [cf. O pre\xE7o acompanha a robustez (em torno de R$240 a R$310 por m\xB2 em S\xE3o Paulo, 2024), mas raramente decepciona em longevidade] [cf. O MDF \xE9 mais f\xE1cil de cortar e trabalhar, pois tem uma densidade uniforme. J\xE1 o compensado naval exige ferramentas um pouco mais robustas, mas oferece uma resist\xEAncia superior]"
      },
      acoes_recomendadas: "MDF Ultra/Hidr\xF3fugo (item 2) para ambientes de umidade moderada onde o acabamento fino \xE9 prioridade sobre a resist\xEAncia estrutural m\xE1xima.",
      motivo_tecnico: "O compensado naval \xE9 formado por l\xE2minas de madeira sobrepostas em sentido alternado (n\xFAmero \xEDmpar de l\xE2minas, com capas no mesmo sentido), coladas com resina fen\xF3lica WBP (water boiled proof), que \xE9 significativamente mais resistente \xE0 \xE1gua do que colas convencionais. [cf. Compensado naval \xE9 formado por l\xE2minas de madeira selecionadas, sobrepostas em sentido alternado, uma a uma, em n\xFAmero \xEDmpar, com capas no mesmo sentido] [cf. Compensado naval \xE9 um material composto por l\xE2minas de madeiras postas uma sobre a outra e colada com resina fen\xF3lica WBP \u2013 um pol\xEDmero \xE0 prova d'\xE1gua que atua como uma cola, bastante resistente] Em testes documentados por marceneiros especializados, o compensado naval expande apenas cerca de 4% ap\xF3s 24 horas em contato com \xE1gua, contra cerca de 23% do MDF nas mesmas condi\xE7\xF5es. [cf. O compensado naval... expande apenas 4% ap\xF3s 24 horas em contato com \xE1gua, contra 23% do MDF nas mesmas condi\xE7\xF5es, segundo testes documentados por marceneiros especializados]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Oca Maker (guia comparativo com dados de teste); Form\xF3bile Digital (canal t\xE9cnico do setor); Rei do Compensado (ficha t\xE9cnica); Compensados Brasil.",
      fabricante: "N/A (compensado naval \xE9 uma categoria de produto, n\xE3o uma linha de fabricante \xFAnico \u2014 presente no cat\xE1logo de diversas madeireiras especializadas).",
      observacoes: "\xC9 comum e tecnicamente recomendado usar os dois materiais no mesmo projeto, cada um em sua aplica\xE7\xE3o de vantagem \u2014 compensado naval para estrutura/robustez, MDF para acabamento/usinagem fina. [cf. O ideal \xE9 usar os dois no mesmo projeto, cada um onde tem vantagem] ---",
      tags: [
        "materiais",
        "compensado",
        "naval",
        "usar",
        "composi\xE7\xE3o",
        "resist\xEAncia",
        "t\xE9cnica",
        "superior"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_compensado_naval_quando_usar_em_vez_de_mdf_comparativo_de_custo_beneficio_com",
      entidade: "COMPENSADO NAVAL \u2014 QUANDO USAR EM VEZ DE MDF",
      categoria: "Materiais",
      subcategoria: "COMPENSADO NAVAL \u2014 QUANDO USAR EM VEZ DE MDF",
      titulo: "Comparativo de custo-benef\xEDcio: compensado naval vs. MDF hidrorrepelente",
      tipo: "boa_pratica",
      descricao: "O MDF hidrorrepelente \xE9 mais leve, o que facilita manuseio e transporte (especialmente relevante em montagens residenciais/DIY), mas \xE9 menos resistente que o compensado naval ao contato direto e constante com \xE1gua, e apresenta menor durabilidade sob impacto e uso constante. [cf. Ele tamb\xE9m tem a vantagem de ser mais leve, o que facilita o manuseio e transporte... no entanto, ele n\xE3o \xE9 t\xE3o resistente quanto o compensado naval quando o assunto \xE9 \xE1gua, ent\xE3o n\xE3o \xE9 ideal para \xE1reas externas ou locais onde vai ter contato direto com a chuva ou muita umidade]",
      condicoes: {
        quando_aplicar: "Compara\xE7\xE3o de custo-benef\xEDcio deve sempre considerar o ambiente de destino final (interno coberto vs. exposi\xE7\xE3o a chuva/\xE1gua direta) antes de decidir por economia de material.",
        condicoes_adicionais: "Or\xE7amento \xE9 fator relevante mas n\xE3o deve ser o \xFAnico crit\xE9rio \u2014 o compensado naval traz mais resist\xEAncia por um custo maior, sendo indicado quando a durabilidade em ambiente cr\xEDtico supera a economia inicial. [cf. Or\xE7amento: O MDF \xE9 mais econ\xF4mico, enquanto o Compensado Naval traz mais resist\xEAncia por um custo maior]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o aplicar MDF hidrorrepelente (mesmo linha premium) em situa\xE7\xF5es de contato direto e constante com \xE1gua \u2014 mesmo sendo mais barato, o retrabalho por falha anula a economia inicial.",
        limitacoes: "Compensado naval indicado para cozinhas, banheiros, m\xF3veis de alto padr\xE3o, embarca\xE7\xF5es e estruturas que necessitam resist\xEAncia \xE0 umidade \u2014 uso generalizado em todo o projeto (mesmo em \xE1reas secas) tende a ser custo desnecess\xE1rio. [cf. Compensado Naval: Indicado para cozinhas, banheiros, m\xF3veis de alto padr\xE3o, embarca\xE7\xF5es e estruturas que necessitam resist\xEAncia \xE0 umidade]"
      },
      acoes_recomendadas: "Uso misto por zona do projeto (compensado naval nas \xE1reas de maior exposi\xE7\xE3o a \xE1gua; MDF/MDP nas demais) como estrat\xE9gia de otimiza\xE7\xE3o de custo sem sacrificar durabilidade nos pontos cr\xEDticos.",
      motivo_tecnico: "O MDF hidrorrepelente \xE9 mais leve, o que facilita manuseio e transporte (especialmente relevante em montagens residenciais/DIY), mas \xE9 menos resistente que o compensado naval ao contato direto e constante com \xE1gua, e apresenta menor durabilidade sob impacto e uso constante. [cf. Ele tamb\xE9m tem a vantagem de ser mais leve, o que facilita o manuseio e transporte... no entanto, ele n\xE3o \xE9 t\xE3o resistente quanto o compensado naval quando o assunto \xE9 \xE1gua, ent\xE3o n\xE3o \xE9 ideal para \xE1reas externas ou locais onde vai ter contato direto com a chuva ou muita umidade]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Casavee (blog comparativo); Miraluz (blog institucional de madeireira).",
      fabricante: "N/A.",
      observacoes: 'Este item se conecta diretamente ao m\xF3dulo "Economia" do \xEDndice geral do Planne (a ser detalhado) \u2014 a decis\xE3o de onde usar compensado naval vs. MDF/MDP \xE9 uma das alavancas mais relevantes de otimiza\xE7\xE3o de custo por ambiente. ---',
      tags: [
        "materiais",
        "compensado",
        "naval",
        "usar",
        "comparativo",
        "custo",
        "benef\xEDcio",
        "hidrorrepelente"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_05_dimensoes_padrao_de_chapa_e_espessuras_disponiveis_formato_padrao_de_chapa_no",
      entidade: "DIMENS\xD5ES-PADR\xC3O DE CHAPA E ESPESSURAS DISPON\xCDVEIS",
      categoria: "Materiais",
      subcategoria: "DIMENS\xD5ES-PADR\xC3O DE CHAPA E ESPESSURAS DISPON\xCDVEIS",
      titulo: "Formato-padr\xE3o de chapa no mercado brasileiro",
      tipo: "regra_obrigatoria",
      descricao: "O formato de chapa mais comum praticado pelos grandes fabricantes brasileiros (referenciado tanto na linha RUC da Guararapes quanto em fichas de revenda de MDF Arauco) \xE9 de 2.750 \xD7 1.850 mm. [cf. O MDF RUC est\xE1 dispon\xEDvel em chapas cruas... ambos em chapas de 2750 x 1850 mm]",
      condicoes: {
        quando_aplicar: 'Todo c\xE1lculo de plano de corte e otimiza\xE7\xE3o de aproveitamento de chapa (m\xF3dulo "Produ\xE7\xE3o", a ser detalhado) deve partir deste formato como refer\xEAncia-padr\xE3o de mercado nacional, salvo especifica\xE7\xE3o contr\xE1ria do fabricante escolhido.',
        condicoes_adicionais: "As espessuras mais comumente dispon\xEDveis nesse formato-padr\xE3o s\xE3o 3, 6, 12, 15 e 18 mm (com a vers\xE3o de 3 mm frequentemente dispon\xEDvel apenas crua, sem revestimento)."
      },
      restricoes: {
        quando_nao_aplicar: "Fabricantes ou linhas espec\xEDficas podem oferecer formatos alternativos (chapas maiores ou menores) \u2014 sempre confirmar o formato real dispon\xEDvel antes de fechar o plano de corte definitivo.",
        limitacoes: "Nem toda espessura est\xE1 dispon\xEDvel em todo revestimento/padr\xE3o decorativo \u2014 a disponibilidade cruzada de espessura \xD7 padr\xE3o \xD7 revestimento deve ser validada por fabricante espec\xEDfico antes de fechar a especifica\xE7\xE3o."
      },
      acoes_recomendadas: "Uso de engrosso (ver m\xF3dulo Estrutura, item 5.1) para alcan\xE7ar espessuras intermedi\xE1rias n\xE3o dispon\xEDveis prontas no cat\xE1logo do fabricante escolhido.",
      motivo_tecnico: "O formato de chapa mais comum praticado pelos grandes fabricantes brasileiros (referenciado tanto na linha RUC da Guararapes quanto em fichas de revenda de MDF Arauco) \xE9 de 2.750 \xD7 1.850 mm. [cf. O MDF RUC est\xE1 dispon\xEDvel em chapas cruas... ambos em chapas de 2750 x 1850 mm]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "alto",
        estetico: "baixo"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guararapes (ficha t\xE9cnica RUC); Gas\xF4metro Madeiras (cat\xE1logo institucional, citado tamb\xE9m no m\xF3dulo Estrutura).",
      fabricante: "Guararapes, Arauco (refer\xEAncia de formato-padr\xE3o nacional).",
      observacoes: "Este item deveria ser tratado como par\xE2metro configur\xE1vel por fabricante no motor de regras do Planne \u2014 o sistema idealmente deveria manter uma tabela de formatos de chapa por fabricante/linha, n\xE3o assumir um \xFAnico formato universal fixo. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas** e **Materiais** (este documento). Sequ\xEAncia restante conforme combinado: 6. **Closets** \u2014 cabideiros, maleiros, sapateiras, calceiros, joalheiros, espelhos, ilumina\xE7\xE3o. 7. **Banheiros** \u2014 umidade, cubas, espelhos, ilumina\xE7\xE3o, rodabanca, ventila\xE7\xE3o. 8. **Escrit\xF3rios** \u2014 ergonomia, monitores, cabos, CPU, impressoras. 9. **Produ\xE7\xE3o** \u2014 plano de corte, otimiza\xE7\xE3o, etiquetas, sequ\xEAncia, usinagem, fura\xE7\xE3o, acabamento. 10. **Transporte** \u2014 peso, elevadores, portas, escadas, caminh\xF5es, divis\xE3o de pe\xE7as. 11. **Montagem** \u2014 sequ\xEAncia, ferramentas, tempo, n\xFAmero de montadores, espa\xE7o. 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando em sequ\xEAncia para o m\xF3dulo **Closets**.",
      tags: [
        "materiais",
        "dimens\xF5es",
        "padr\xE3o",
        "chapa",
        "espessuras",
        "dispon\xEDveis",
        "formato",
        "mercado"
      ],
      modulo_origem: "05-Materiais",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_cabideiros_profundidade_e_altura_por_tipo_de_peca_profundidade_do_cabideiro_p",
      entidade: "CABIDEIROS \u2014 PROFUNDIDADE E ALTURA POR TIPO DE PE\xC7A",
      categoria: "Closets",
      subcategoria: "CABIDEIROS \u2014 PROFUNDIDADE E ALTURA POR TIPO DE PE\xC7A",
      titulo: "Profundidade do cabideiro por tipo de porta",
      tipo: "recomendacao",
      descricao: "A profundidade recomendada do v\xE3o de cabideiro varia conforme o tipo de porta: com portas de abrir, 55\u201360 cm \xE9 considerado ideal; com portas de correr, a profundidade precisa aumentar para 65\u201370 cm, j\xE1 que o sistema de trilho e o espa\xE7o de manobra da porta consomem parte do v\xE3o \xFAtil. [cf. Quando a porta \xE9 de abrir, 55 cm s\xE3o ideais. Quando o modelo for de correr, as medidas variam entre 65 cm e 70 cm, dependendo do fabricante] [cf. Se o seu guarda-roupa possui portas de puxar, o ideal \xE9 que a profundidade do espa\xE7o para o cabideiro seja de 60 cent\xEDmetros. Quando a porta \xE9 de correr, as medidas desse espa\xE7o variam entre 65 e 70 cent\xEDmetros]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de profundidade de qualquer m\xF3dulo de cabideiro em closet ou guarda-roupa.",
        condicoes_adicionais: "A diferen\xE7a de profundidade entre porta de abrir e porta de correr deve ser tratada como regra autom\xE1tica \u2014 o motor de regras do Planne deveria recalcular a profundidade do m\xF3dulo automaticamente ao mudar o tipo de porta selecionado, sem exigir input manual duplicado do projetista."
      },
      restricoes: {
        quando_nao_aplicar: "Roupeiros abertos (sem porta, apenas com prateleiras/var\xE3o exposto) podem usar profundidade menor, de 45\u201350 cm, desde que caiba um travesseiro na prateleira como refer\xEAncia pr\xE1tica b\xE1sica. [cf. Seria um roupeiro, apenas com prateleiras, e que pode ter profundidade menor, de 45 a 50cm... O importante \xE9 que caiba um travesseiro nas prateleiras, essa \xE9 uma refer\xEAncia b\xE1sica em rela\xE7\xE3o \xE0 profundidade]",
        limitacoes: "Profundidades menores que o m\xEDnimo recomendado comprimem os ombros dos cabides, amassando as roupas e dificultando a retirada de pe\xE7as penduradas."
      },
      acoes_recomendadas: "Cabideiro perpendicular \xE0 parede (n\xE3o paralelo) em espa\xE7os muito estreitos, economizando profundidade \xE0s custas de largura.",
      motivo_tecnico: "A profundidade recomendada do v\xE3o de cabideiro varia conforme o tipo de porta: com portas de abrir, 55\u201360 cm \xE9 considerado ideal; com portas de correr, a profundidade precisa aumentar para 65\u201370 cm, j\xE1 que o sistema de trilho e o espa\xE7o de manobra da porta consomem parte do v\xE3o \xFAtil. [cf. Quando a porta \xE9 de abrir, 55 cm s\xE3o ideais. Quando o modelo for de correr, as medidas variam entre 65 cm e 70 cm, dependendo do fabricante] [cf. Se o seu guarda-roupa possui portas de puxar, o ideal \xE9 que a profundidade do espa\xE7o para o cabideiro seja de 60 cent\xEDmetros. Quando a porta \xE9 de correr, as medidas desse espa\xE7o variam entre 65 e 70 cent\xEDmetros]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Fox Lux (blog t\xE9cnico); Krona (blog institucional de fabricante de ferragem/acess\xF3rios); Dicas de Arquitetura (blog especializado).",
      fabricante: "N/A (medida de projeto geral, pode variar por fabricante de sistema de correr espec\xEDfico).",
      observacoes: "Esta regra se conecta diretamente ao m\xF3dulo Portas e Gavetas (item 3 \u2014 Porta de correr), j\xE1 que a profundidade final do cabideiro depende do sistema de trilho escolhido. ---",
      tags: [
        "closets",
        "cabideiros",
        "profundidade",
        "altura",
        "tipo",
        "pe\xE7a",
        "cabideiro",
        "porta"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_cabideiros_profundidade_e_altura_por_tipo_de_peca_altura_por_tipo_de_peca_pen",
      entidade: "CABIDEIROS \u2014 PROFUNDIDADE E ALTURA POR TIPO DE PE\xC7A",
      categoria: "Closets",
      subcategoria: "CABIDEIROS \u2014 PROFUNDIDADE E ALTURA POR TIPO DE PE\xC7A",
      titulo: "Altura por tipo de pe\xE7a pendurada",
      tipo: "boa_pratica",
      descricao: "A altura de v\xE3o necess\xE1ria para cada categoria de pe\xE7a pendurada varia significativamente: camisas e blazers precisam de 1,05\u20131,10 m livres; [cf. Para camisas e blazers deve-se deixar livre entre 1,05 m e 1,10 m] saias, cal\xE7as e blusas curtas precisam de 85\u201390 cm; [cf. Para saias, cal\xE7as e blusinhas, valem de 85 cm a 90 cm] vestidos e casacos longos precisam de 1,30\u20131,60 m. [cf. J\xE1 para vestidos e casacos longos, as medidas s\xE3o de 1,30 m a 1,50 m] [cf. Cabideiro para vestidos: Altura de 1,40 a 1,60m para vestidos longos e de 1,15 a 1,20m para vestidos curtos] A altura total entre piso e barra de cabideiro (para um \xFAnico cabideiro alto, sem duplo) costuma ser de refer\xEAncia 2 m, ajust\xE1vel conforme a estatura do usu\xE1rio principal (1,80\u20131,85 m para pessoas de estatura mais baixa). [cf. A altura entre piso e cabideiro pode ser de 2 m. Mas isso tamb\xE9m depende da altura da pessoa. Se a estatura for baixa, o ideal fica entre 1,80 m a 1,85 m]",
      condicoes: {
        quando_aplicar: "Composi\xE7\xE3o de qualquer m\xF3dulo de closet ou guarda-roupa com cabideiro, antes de definir se ser\xE1 cabideiro \xFAnico (alto) ou duplo (dois n\xEDveis sobrepostos).",
        condicoes_adicionais: "Cabideiro inferior (cal\xE7as penduradas na barra, dobradas ao meio) precisa de no m\xEDnimo 70 cm livres abaixo do v\xE3o. [cf. Cabideiro inferior, para colocar cal\xE7as: No m\xEDnimo 70cm livres abaixo do cabideiro] Cabideiro longo (para casacos e vestidos) em closets femininos costuma ter de 1,20 a 1,60 m, dependendo do tipo de cabide usado. [cf. O cabideiro longo \xE9 fundamental para os Closet femininos, abrigam casacos longos e vestidos, devem ter de 1,20 a 1,60 (dependendo da maneira que vai utilizar o cabide)]"
      },
      restricoes: {
        quando_nao_aplicar: "Em closets femininos com predomin\xE2ncia de pe\xE7as curtas, um cabideiro duplo (dois n\xEDveis) pode ser mais eficiente que um \xFAnico cabideiro alto \u2014 decis\xE3o depende do perfil de guarda-roupa do usu\xE1rio, n\xE3o de uma regra fixa.",
        limitacoes: "A altura \xFAtil realmente acess\xEDvel sem esfor\xE7o em roupeiros muito altos (2,60 m) fica limitada a cerca de 1,90 m \u2014 a parte superior a isso tende a virar espa\xE7o de maleiro (acesso ocasional), a menos que se use cabideiro extens\xEDvel/retr\xE1til. [cf. Normalmente s\xF3 conseguimos acessar os cabides que est\xE3o a uma altura \xFAtil de 1,90 m. Os roupeiros planejados chegam a 2,60 m de altura. A parte de cima acaba virando maleiro]"
      },
      acoes_recomendadas: "Cabideiro extens\xEDvel (mecanismo que desce o cabideiro at\xE9 a altura de alcance do usu\xE1rio) para aproveitar toda a altura do roupeiro sem sacrificar ergonomia de uso di\xE1rio. [cf. Voc\xEA sabe quando \xE9 interessante usar o cabideiro extens\xEDvel? Quer aproveitar toda a altura do roupeiro? Com o cabideiro extens\xEDvel fica f\xE1cil]",
      motivo_tecnico: "A altura de v\xE3o necess\xE1ria para cada categoria de pe\xE7a pendurada varia significativamente: camisas e blazers precisam de 1,05\u20131,10 m livres; [cf. Para camisas e blazers deve-se deixar livre entre 1,05 m e 1,10 m] saias, cal\xE7as e blusas curtas precisam de 85\u201390 cm; [cf. Para saias, cal\xE7as e blusinhas, valem de 85 cm a 90 cm] vestidos e casacos longos precisam de 1,30\u20131,60 m. [cf. J\xE1 para vestidos e casacos longos, as medidas s\xE3o de 1,30 m a 1,50 m] [cf. Cabideiro para vestidos: Altura de 1,40 a 1,60m para vestidos longos e de 1,15 a 1,20m para vestidos curtos] A altura total entre piso e barra de cabideiro (para um \xFAnico cabideiro alto, sem duplo) costuma ser de refer\xEAncia 2 m, ajust\xE1vel conforme a estatura do usu\xE1rio principal (1,80\u20131,85 m para pessoas de estatura mais baixa). [cf. A altura entre piso e cabideiro pode ser de 2 m. Mas isso tamb\xE9m depende da altura da pessoa. Se a estatura for baixa, o ideal fica entre 1,80 m a 1,85 m]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Fox Lux; Andrade & Mello Arquitetura; Dicas de Arquitetura (com v\xEDdeo de arquiteta especializada); Pinterest/redes profissionais (refer\xEAncia de mercado consolidada).",
      fabricante: "N/A.",
      observacoes: "\xC9 pr\xE1tica recomendada medir as pe\xE7as reais do cliente (altura, largura, profundidade dos itens que ser\xE3o guardados) antes de fechar as alturas de projeto, em vez de aplicar cegamente uma tabela padr\xE3o \u2014 a tabela serve como ponto de partida, n\xE3o substituto do levantamento real. [cf. N\xE3o desgrude da trena! Tire a medida das pe\xE7as e anote tudo (altura, largura e profundidade dos itens que o seu cliente vai guardar)] ---",
      tags: [
        "closets",
        "cabideiros",
        "profundidade",
        "altura",
        "tipo",
        "pe\xE7a",
        "pendurada"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_sapateiras_profundidade_e_altura_por_modelo_profundidade_por_tipo_de_sapateir",
      entidade: "SAPATEIRAS \u2014 PROFUNDIDADE E ALTURA POR MODELO",
      categoria: "Closets",
      subcategoria: "SAPATEIRAS \u2014 PROFUNDIDADE E ALTURA POR MODELO",
      titulo: "Profundidade por tipo de sapateira",
      tipo: "boa_pratica",
      descricao: "A profundidade de uma sapateira varia conforme o modelo: prateleiras simples (um par por vez, de frente) precisam de cerca de 35 cm livres; [cf. Qual \xE9 a profundidade ideal para sapateiras? 35 cm livres, no caso de prateleiras] gavetas com dois pares por profundidade (um atr\xE1s do outro) precisam de 60\u201365 cm de interior; [cf. Se o objetivo for colocar 2 pares \u2013 um atr\xE1s do outro \u2013 o ideal \xE9 60 cm a 65 cm de interior de gaveta] considerando o gabinete completo (interior de 35 cm) com portas de correr, a profundidade total do m\xF3vel fica entre 42\u201343 cm, e com portas de abrir, entre 38\u201340 cm. [cf. Considerando o interior, com 35 cm e portas de correr, a profundidade deve ficar entre 42 cm e 43 cm. Com portas de abrir, as medidas variam entre 38 cm e 40 cm]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de qualquer m\xF3dulo dedicado a sapateira, seja em closet ou embutido em guarda-roupa.",
        condicoes_adicionais: 'Diferenciar sempre profundidade "interior \xFAtil" (onde o sapato efetivamente fica) de "profundidade total do m\xF3vel" (que inclui espessura de porta, folga de trilho, etc.) \u2014 s\xE3o medidas diferentes e frequentemente confundidas em or\xE7amentos.'
      },
      restricoes: {
        quando_nao_aplicar: "Sapateiras deslizantes especializadas em cal\xE7ados baixos (rasteirinhas, sand\xE1lias, t\xEAnis) usam l\xF3gica de altura reduzida, n\xE3o de profundidade \u2014 ver item 2.2.",
        limitacoes: "Modelos de gaveta com 2 pares em profundidade dificultam o acesso ao par de tr\xE1s sem retirar o da frente primeiro \u2014 trade-off entre economia de espa\xE7o e praticidade de acesso."
      },
      acoes_recomendadas: 'Sapateiras girat\xF3rias ou com sistema "carrossel" para melhor visualiza\xE7\xE3o de m\xFAltiplos pares sem sacrificar acesso, em projetos de padr\xE3o superior.',
      motivo_tecnico: "A profundidade de uma sapateira varia conforme o modelo: prateleiras simples (um par por vez, de frente) precisam de cerca de 35 cm livres; [cf. Qual \xE9 a profundidade ideal para sapateiras? 35 cm livres, no caso de prateleiras] gavetas com dois pares por profundidade (um atr\xE1s do outro) precisam de 60\u201365 cm de interior; [cf. Se o objetivo for colocar 2 pares \u2013 um atr\xE1s do outro \u2013 o ideal \xE9 60 cm a 65 cm de interior de gaveta] considerando o gabinete completo (interior de 35 cm) com portas de correr, a profundidade total do m\xF3vel fica entre 42\u201343 cm, e com portas de abrir, entre 38\u201340 cm. [cf. Considerando o interior, com 35 cm e portas de correr, a profundidade deve ficar entre 42 cm e 43 cm. Com portas de abrir, as medidas variam entre 38 cm e 40 cm]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Fox Lux; Krona (refer\xEAncia complementar de profundidade de 50 cm para gavetas em geral).",
      fabricante: "N/A.",
      observacoes: "Refer\xEAncia complementar de mercado: prateleiras para sapatos com 35 cm de profundidade, com altura de 15\u201320 cm para sapatos baixos e 25\u201330 cm para cal\xE7ados de salto \u2014 ver item 2.2. [cf. Sapatos: Prateleiras com 35 cm de profundidade, altura de 15-20 cm para sapatos baixos e 25-30 cm para saltos] ---",
      tags: [
        "closets",
        "sapateiras",
        "profundidade",
        "altura",
        "modelo",
        "tipo",
        "sapateira"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_sapateiras_profundidade_e_altura_por_modelo_altura_de_prateleira_vao_por_tipo",
      entidade: "SAPATEIRAS \u2014 PROFUNDIDADE E ALTURA POR MODELO",
      categoria: "Closets",
      subcategoria: "SAPATEIRAS \u2014 PROFUNDIDADE E ALTURA POR MODELO",
      titulo: "Altura de prateleira/v\xE3o por tipo de cal\xE7ado",
      tipo: "recomendacao",
      descricao: "A altura de v\xE3o entre prateleiras de sapateira varia por tipo de cal\xE7ado: sapatos baixos (rasteirinha, sand\xE1lia, t\xEAnis baixo) precisam de 12\u201320 cm de altura livre; [cf. Altura de 15-20 cm para sapatos baixos] [cf. As sapateiras deslizantes com altura de 12 a 18cm, acomodam rasteirinhas, sand\xE1lias e t\xEAnis baixos] sapatos de salto alto precisam de 25\u201330 cm. [cf. 25-30 cm para saltos]",
      condicoes: {
        quando_aplicar: "Distribui\xE7\xE3o vertical de qualquer m\xF3dulo de sapateira com m\xFAltiplas prateleiras/v\xE3os.",
        condicoes_adicionais: "Para sapateiras do tipo retr\xE1til ou com gavetas (n\xE3o prateleira fixa aberta), a altura m\xE1xima recomendada do m\xF3dulo \xE9 de cerca de 1,60 m \u2014 acima disso, o alcance at\xE9 o sapato fica comprometido quando o compartimento est\xE1 aberto (o usu\xE1rio n\xE3o consegue ver/alcan\xE7ar bem o fundo do compartimento em posi\xE7\xE3o elevada). [cf. Se for retr\xE1til ou com gavetas, o alcance at\xE9 o sapato \xE9 comprometido j\xE1 com 1,60 m, quando os compartimentos estiverem abertos] [cf. Se o modelo da sua sapateira cont\xE9m prateleiras, \xE9 retr\xE1til ou com gavetas, a altura dela deve ser de 160 cent\xEDmetros]"
      },
      restricoes: {
        quando_nao_aplicar: 'Sapateiras "gen\xE9ricas" (sem distin\xE7\xE3o por tipo de cal\xE7ado, v\xE3o \xFAnico padronizado) sacrificam otimiza\xE7\xE3o de espa\xE7o em favor de simplicidade de projeto \u2014 aceit\xE1vel em projetos de entrada, mas n\xE3o recomendado em closets de padr\xE3o superior.',
        limitacoes: "Misturar tipos de cal\xE7ado (baixo e salto) na mesma prateleira de altura fixa obriga a usar sempre a altura do item mais alto, desperdi\xE7ando espa\xE7o vertical nas prateleiras destinadas a cal\xE7ados baixos."
      },
      acoes_recomendadas: "Prateleiras regul\xE1veis (altura ajust\xE1vel) para permitir reconfigura\xE7\xE3o conforme mudan\xE7a no perfil de cal\xE7ados do usu\xE1rio ao longo do tempo.",
      motivo_tecnico: "A altura de v\xE3o entre prateleiras de sapateira varia por tipo de cal\xE7ado: sapatos baixos (rasteirinha, sand\xE1lia, t\xEAnis baixo) precisam de 12\u201320 cm de altura livre; [cf. Altura de 15-20 cm para sapatos baixos] [cf. As sapateiras deslizantes com altura de 12 a 18cm, acomodam rasteirinhas, sand\xE1lias e t\xEAnis baixos] sapatos de salto alto precisam de 25\u201330 cm. [cf. 25-30 cm para saltos]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "refer\xEAncias consolidadas de blogs t\xE9cnicos de arquitetura (Viva Decora, Fox Lux) e Andrade & Mello Arquitetura.",
      fabricante: "N/A.",
      observacoes: 'Esta \xE9 uma boa candidata a regra parametriz\xE1vel por "perfil de guarda-roupa do cliente" no motor de regras do Planne \u2014 o sistema poderia perguntar a propor\xE7\xE3o estimada de cal\xE7ados baixos vs. salto e sugerir automaticamente a distribui\xE7\xE3o de alturas de prateleira. ---',
      tags: [
        "closets",
        "sapateiras",
        "profundidade",
        "altura",
        "modelo",
        "prateleira",
        "tipo",
        "cal\xE7ado"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_maleiros_e_nichos_superiores_altura_minima_e_funcao_do_maleiro",
      entidade: "MALEIROS E NICHOS SUPERIORES",
      categoria: "Closets",
      subcategoria: "MALEIROS E NICHOS SUPERIORES",
      titulo: "Altura m\xEDnima e fun\xE7\xE3o do maleiro",
      tipo: "recomendacao",
      descricao: "O maleiro \xE9 o compartimento superior do closet/guarda-roupa, de acesso mais dif\xEDcil (geralmente exigindo banquinho ou escada), destinado a itens de uso pouco frequente \u2014 malas, caixas, roupas de cama de reserva. A altura m\xEDnima recomendada varia conforme a fonte: 30 cm como m\xEDnimo absoluto, [cf. Os maleiros devem ter no m\xEDnimo 30 cm de altura e s\xE3o os compartimentos com maior dif\xEDcil acesso] ou 60 cm livres quando o objetivo \xE9 acomodar malas de viagem de tamanho grande. [cf. Maleiro: A altura m\xEDnima ideal \xE9 de 60cm livres, caso se queira colocar malas grandes]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o do compartimento superior de qualquer closet ou guarda-roupa com p\xE9-direito suficiente para essa divis\xE3o adicional.",
        condicoes_adicionais: "A decis\xE3o entre 30 cm (compartimento apenas para caixas/roupas de cama) e 60 cm (para malas grandes) deve ser tomada com base no perfil real de uso declarado pelo cliente, n\xE3o assumida por padr\xE3o."
      },
      restricoes: {
        quando_nao_aplicar: "Closets com p\xE9-direito baixo ou onde a prioridade \xE9 maximizar o cabideiro alto podem dispensar o maleiro dedicado, absorvendo essa fun\xE7\xE3o em prateleiras internas do pr\xF3prio cabideiro (ver item 1.2 sobre altura \xFAtil de 1,90 m).",
        limitacoes: "\xC9, por defini\xE7\xE3o, o compartimento de acesso mais dif\xEDcil do closet \u2014 n\xE3o deve ser dimensionado para itens de uso frequente."
      },
      acoes_recomendadas: "Cabideiro extens\xEDvel (item 1.2) como alternativa ao maleiro fixo, quando o cliente prefere maximizar capacidade de pendurar roupas em vez de reservar espa\xE7o para malas/caixas.",
      motivo_tecnico: "O maleiro \xE9 o compartimento superior do closet/guarda-roupa, de acesso mais dif\xEDcil (geralmente exigindo banquinho ou escada), destinado a itens de uso pouco frequente \u2014 malas, caixas, roupas de cama de reserva. A altura m\xEDnima recomendada varia conforme a fonte: 30 cm como m\xEDnimo absoluto, [cf. Os maleiros devem ter no m\xEDnimo 30 cm de altura e s\xE3o os compartimentos com maior dif\xEDcil acesso] ou 60 cm livres quando o objetivo \xE9 acomodar malas de viagem de tamanho grande. [cf. Maleiro: A altura m\xEDnima ideal \xE9 de 60cm livres, caso se queira colocar malas grandes]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "baixo"
      },
      prioridade: "m\xE9dio",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Andrade & Mello Arquitetura; Dicas de Arquitetura.",
      fabricante: "N/A.",
      observacoes: 'Este item se conecta ao m\xF3dulo "Nichos" do \xEDndice geral (limites, resist\xEAncia, profundidade, fixa\xE7\xE3o) \u2014 o maleiro \xE9, estruturalmente, um nicho horizontal de grande v\xE3o que deve seguir as regras de carga/v\xE3o m\xE1ximo j\xE1 descritas no m\xF3dulo Estrutura (item 2). ---',
      tags: [
        "closets",
        "maleiros",
        "nichos",
        "superiores",
        "altura",
        "m\xEDnima",
        "fun\xE7\xE3o",
        "maleiro"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_maleiros_e_nichos_superiores_nichos_internos_para_itens_dobrados",
      entidade: "MALEIROS E NICHOS SUPERIORES",
      categoria: "Closets",
      subcategoria: "MALEIROS E NICHOS SUPERIORES",
      titulo: "Nichos internos para itens dobrados",
      tipo: "alerta",
      descricao: "Nichos internos (compartimentos abertos, sem gaveta) s\xE3o indicados para camisetas, malhas, pe\xE7as de linha dobradas, bolsas e caixas de acess\xF3rios \u2014 a medida m\xEDnima mais adequada citada \xE9 de 30 \xD7 30 cm, podendo reduzir a altura (empilhando menos roupas) \xE0s custas de dificultar o acesso \xE0s pe\xE7as do fundo da pilha. [cf. Os nichos s\xE3o \xF3timos para camisetas, malhas ou pe\xE7as de linha. Tamb\xE9m acomodam as bolsas e caixas com len\xE7os ou acess\xF3rios. As medidas m\xEDnimas mais adequadas s\xE3o 30 por 30 cm. Se preferir empilhar menos roupas \xE9 poss\xEDvel diminuir na altura, mas, aten\xE7\xE3o, o acesso ficar\xE1 mais complicado]",
      condicoes: {
        quando_aplicar: "Distribui\xE7\xE3o de compartimentos internos de closet para pe\xE7as dobradas (n\xE3o penduradas, n\xE3o em gaveta).",
        condicoes_adicionais: "Pe\xE7as mais compridas dobradas (saia longa, cardig\xE3) precisam de altura de nicho maior, em torno de 1 metro. [cf. Quando falamos de pe\xE7as mais compridas, como uma saia longa ou um cardig\xE3, a altura sugerida \xE9 de um metro]"
      },
      restricoes: {
        quando_nao_aplicar: "Pe\xE7as finas empilhadas (camisetas, por exemplo) toleram altura reduzida (25\u201330 cm) melhor do que pe\xE7as mais volumosas. [cf. Para os empilhados (camisetas, por exemplo), 25cm a 30cm de altura \xE9 o ideal]",
        limitacoes: "Empilhamento muito alto em um \xFAnico nicho compromete a organiza\xE7\xE3o visual e dificulta a retirada de pe\xE7as do meio/fundo da pilha."
      },
      acoes_recomendadas: "Gavetas com divis\xF3rias internas para itens que se beneficiam de organiza\xE7\xE3o individual (em vez de empilhamento aberto).",
      motivo_tecnico: "Nichos internos (compartimentos abertos, sem gaveta) s\xE3o indicados para camisetas, malhas, pe\xE7as de linha dobradas, bolsas e caixas de acess\xF3rios \u2014 a medida m\xEDnima mais adequada citada \xE9 de 30 \xD7 30 cm, podendo reduzir a altura (empilhando menos roupas) \xE0s custas de dificultar o acesso \xE0s pe\xE7as do fundo da pilha. [cf. Os nichos s\xE3o \xF3timos para camisetas, malhas ou pe\xE7as de linha. Tamb\xE9m acomodam as bolsas e caixas com len\xE7os ou acess\xF3rios. As medidas m\xEDnimas mais adequadas s\xE3o 30 por 30 cm. Se preferir empilhar menos roupas \xE9 poss\xEDvel diminuir na altura, mas, aten\xE7\xE3o, o acesso ficar\xE1 mais complicado]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "m\xE9dio",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Andrade & Mello Arquitetura; Club ArqExpress.",
      fabricante: "N/A.",
      observacoes: "A altura de prateleira entre nichos de closet (30\u201350 cm) permite acomodar bastante conte\xFAdo sem formar pilha excessivamente alta, mantendo acesso razo\xE1vel \xE0s pe\xE7as do fundo. [cf. A altura entre uma prateleira e outra pode ser em torno de 50cm, pois nesse espa\xE7o cabe bastante coisa sem formar uma pilha t\xE3o grande que seja dif\xEDcil pegar as pe\xE7as de baixo] ---",
      tags: [
        "closets",
        "maleiros",
        "nichos",
        "superiores",
        "internos",
        "itens",
        "dobrados"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_gavetas_de_closet_profundidades_por_categoria_de_item_tabela_de_profundidade_",
      entidade: "GAVETAS DE CLOSET \u2014 PROFUNDIDADES POR CATEGORIA DE ITEM",
      categoria: "Closets",
      subcategoria: "GAVETAS DE CLOSET \u2014 PROFUNDIDADES POR CATEGORIA DE ITEM",
      titulo: "Tabela de profundidade de gaveta por tipo de pe\xE7a",
      tipo: "recomendacao",
      descricao: "A profundidade interna de gaveta de closet varia por categoria de item guardado: gavetas com visor para acess\xF3rios (rel\xF3gios, joias pequenas) usam 9\u201312 cm; pe\xE7as \xEDntimas usam profundidade m\xEDnima de 12 cm, variando at\xE9 15 cm; roupas de gin\xE1stica e camisas cabem em gavetas de 15\u201320 cm; gavet\xF5es mais profundos (20\u201340 cm) s\xE3o reservados para roupas de inverno, mais volumosas. [cf. Para as pe\xE7as \xEDntimas a profundidade m\xEDnima passa a ser 12 e varia at\xE9 15 cm. Roupas de gin\xE1stica e camisas podem ser armazenadas em gavetas que variam de 15 a 20 cm. Os gavet\xF5es mais profundos (20 a 40 cm) s\xE3o apropriados para roupas de inverno] [cf. Neste modelo utilizamos apenas nas gavetas para acess\xF3rios, elas devem ter entre 9 e 12 cm]",
      condicoes: {
        quando_aplicar: "Distribui\xE7\xE3o vertical de qualquer gaveteiro de closet, priorizando a categoria de item que o cliente mais guarda.",
        condicoes_adicionais: "Como refer\xEAncia geral de mercado (n\xE3o espec\xEDfica de closet, mas aplic\xE1vel), a altura m\xEDnima recomendada de frente externa de gaveta em guarda-roupa \xE9 de 20 cm, aumentando para roupas mais grossas. [cf. Gavetas: Pelo menos 20cm de altura final externa, devendo ser maior para roupas mais grossas]"
      },
      restricoes: {
        quando_nao_aplicar: 'N\xE3o h\xE1 dispensa \u2014 mesmo gaveteiros "gen\xE9ricos" se beneficiam de ao menos uma diferencia\xE7\xE3o b\xE1sica entre gavetas rasas (acess\xF3rios/roupa \xEDntima) e gavetas fundas (roupas de inverno/volumosas).',
        limitacoes: "Gavetas muito rasas (abaixo de 9 cm) tornam-se pouco pr\xE1ticas mesmo para itens pequenos, pela dificuldade de manuseio dentro do compartimento."
      },
      acoes_recomendadas: "Uso de organizadores internos (divis\xF3rias, bandejas) dentro de gavetas de profundidade padr\xE3o, em vez de multiplicar profundidades customizadas \u2014 reduz a complexidade de produ\xE7\xE3o sem sacrificar tanto a organiza\xE7\xE3o.",
      motivo_tecnico: "A profundidade interna de gaveta de closet varia por categoria de item guardado: gavetas com visor para acess\xF3rios (rel\xF3gios, joias pequenas) usam 9\u201312 cm; pe\xE7as \xEDntimas usam profundidade m\xEDnima de 12 cm, variando at\xE9 15 cm; roupas de gin\xE1stica e camisas cabem em gavetas de 15\u201320 cm; gavet\xF5es mais profundos (20\u201340 cm) s\xE3o reservados para roupas de inverno, mais volumosas. [cf. Para as pe\xE7as \xEDntimas a profundidade m\xEDnima passa a ser 12 e varia at\xE9 15 cm. Roupas de gin\xE1stica e camisas podem ser armazenadas em gavetas que variam de 15 a 20 cm. Os gavet\xF5es mais profundos (20 a 40 cm) s\xE3o apropriados para roupas de inverno] [cf. Neste modelo utilizamos apenas nas gavetas para acess\xF3rios, elas devem ter entre 9 e 12 cm]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Andrade & Mello Arquitetura; Fox Lux; Krona.",
      fabricante: "N/A.",
      observacoes: "Este item se conecta diretamente ao m\xF3dulo Ferragens (corredi\xE7as) \u2014 a profundidade final da gaveta deve sempre ser validada contra o comprimento de corredi\xE7a dispon\xEDvel na linha de ferragem escolhida. ---",
      tags: [
        "closets",
        "gavetas",
        "closet",
        "profundidades",
        "categoria",
        "item",
        "tabela",
        "profundidade"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_metragem_e_circulacao_do_ambiente_metragem_minima_recomendada_por_perfil_de_c",
      entidade: "METRAGEM E CIRCULA\xC7\xC3O DO AMBIENTE",
      categoria: "Closets",
      subcategoria: "METRAGEM E CIRCULA\xC7\xC3O DO AMBIENTE",
      titulo: "Metragem m\xEDnima recomendada por perfil de closet",
      tipo: "recomendacao",
      descricao: "O tamanho padr\xE3o de closet costuma variar entre 3 m\xB2 e 6 m\xB2; um closet individual pode funcionar em 3\u20134 m\xB2 com layout otimizado, enquanto um closet de casal recomenda-se a partir de 6 m\xB2 (permitindo arm\xE1rios dos dois lados, cabideiros com profundidade adequada, gavetas e prateleiras, al\xE9m de circula\xE7\xE3o confort\xE1vel). [cf. O tamanho padr\xE3o de closet costuma variar entre 3 m\xB2 e 6 m\xB2... um closet para uma pessoa pode ter \xE1reas entre 3 m\xB2 e 4 m\xB2, desde que o layout seja otimizado... O tamanho ideal de closet casal \xE9 a partir de 6 m\xB2] Closets com banheiro integrado (su\xEDte m\xE1ster) recomendam \xE1reas entre 6 e 9 m\xB2, para garantir acesso fluido e boa ventila\xE7\xE3o. [cf. Se o projeto incluir closet com banheiro, o ideal \xE9 trabalhar com \xE1reas entre 6 m\xB2 e 9 m\xB2, permitindo acesso fluido e boa ventila\xE7\xE3o]",
      condicoes: {
        quando_aplicar: "Fase de layout inicial do projeto de closet, antes de definir quantidade e disposi\xE7\xE3o de m\xF3dulos.",
        condicoes_adicionais: "A metragem m\xEDnima real depende diretamente da largura de v\xE3o necess\xE1ria para cada fun\xE7\xE3o \u2014 por exemplo, um v\xE3o de pelo menos 65 cm de largura \xE9 indicado quando se deseja acomodar um edredom grande ou travesseiros nas prateleiras. [cf. A largura de cada v\xE3o, ou pelo menos de alguns deles, pode ser de pelo menos 65cm, para caber um edredon grande, se preciso, ou travesseiros]"
      },
      restricoes: {
        quando_nao_aplicar: "Espa\xE7os muito compactos (1,40 \xD7 2,20 m) ainda podem funcionar como closet pequeno, desde que se priorizem arm\xE1rios de profundidade reduzida, portas de correr e armazenamento vertical. [cf. Um closet pequeno com medidas entre 1,40 m x 2,20 m pode funcionar... priorize arm\xE1rios de profundidade reduzida, portas de correr e armazenamento vertical]",
        limitacoes: 'Metragens abaixo do m\xEDnimo recomendado for\xE7am redu\xE7\xE3o de profundidade e/ou elimina\xE7\xE3o de m\xF3dulos completos (maleiro, sapateira dedicada), n\xE3o apenas "aperto" proporcional de todos os elementos.'
      },
      acoes_recomendadas: "Prioriza\xE7\xE3o de m\xF3dulos por perfil de uso do cliente quando a metragem dispon\xEDvel \xE9 insuficiente para incluir tudo do checklist ideal (cabideiro, sapateira, maleiro, gavetas, nichos).",
      motivo_tecnico: "O tamanho padr\xE3o de closet costuma variar entre 3 m\xB2 e 6 m\xB2; um closet individual pode funcionar em 3\u20134 m\xB2 com layout otimizado, enquanto um closet de casal recomenda-se a partir de 6 m\xB2 (permitindo arm\xE1rios dos dois lados, cabideiros com profundidade adequada, gavetas e prateleiras, al\xE9m de circula\xE7\xE3o confort\xE1vel). [cf. O tamanho padr\xE3o de closet costuma variar entre 3 m\xB2 e 6 m\xB2... um closet para uma pessoa pode ter \xE1reas entre 3 m\xB2 e 4 m\xB2, desde que o layout seja otimizado... O tamanho ideal de closet casal \xE9 a partir de 6 m\xB2] Closets com banheiro integrado (su\xEDte m\xE1ster) recomendam \xE1reas entre 6 e 9 m\xB2, para garantir acesso fluido e boa ventila\xE7\xE3o. [cf. Se o projeto incluir closet com banheiro, o ideal \xE9 trabalhar com \xE1reas entre 6 m\xB2 e 9 m\xB2, permitindo acesso fluido e boa ventila\xE7\xE3o]",
      impacto: {
        estrutural: "baixo",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Planner 5D (guia de dimensionamento).",
      fabricante: "N/A.",
      observacoes: "Esta regra deve ser cruzada, no motor do Planne, com o perfil declarado de uso do cliente (individual vs. casal, com/sem banheiro integrado) para sugerir automaticamente a metragem m\xEDnima recomendada antes mesmo de come\xE7ar a distribuir m\xF3dulos. ---",
      tags: [
        "closets",
        "metragem",
        "circula\xE7\xE3o",
        "ambiente",
        "m\xEDnima",
        "recomendada",
        "perfil",
        "closet"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_metragem_e_circulacao_do_ambiente_espaco_de_circulacao_em_frente_aos_modulos",
      entidade: "METRAGEM E CIRCULA\xC7\xC3O DO AMBIENTE",
      categoria: "Closets",
      subcategoria: "METRAGEM E CIRCULA\xC7\xC3O DO AMBIENTE",
      titulo: "Espa\xE7o de circula\xE7\xE3o em frente aos m\xF3dulos",
      tipo: "boa_pratica",
      descricao: "O espa\xE7o livre necess\xE1rio em frente aos arm\xE1rios depende do tipo de porta: em closets abertos (sem porta) ou com portas de correr, a circula\xE7\xE3o m\xEDnima pode ser de 70 cm; na frente de arm\xE1rios com portas de abrir, \xE9 necess\xE1rio espa\xE7o maior, proporcional ao tamanho da porta \u2014 para portas de 50 cm de largura, pode ser preciso deixar pelo menos 90 cm livres na passagem. [cf. Em closets abertos, sem portas, ou ent\xE3o com portas de correr, a circula\xE7\xE3o m\xEDnima pode ser de 70cm, enquanto na frente de arm\xE1rios com portas de abrir \xE9 necess\xE1rio um espa\xE7o maior, proporcional ao tamanho das portas. Para portas de 50cm de largura, pode ser preciso deixar pelo menos 90cm livres na passagem]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o de layout de closet com corredor central ou circula\xE7\xE3o entre m\xF3dulos opostos.",
        condicoes_adicionais: "Para guarda-roupas de quarto (n\xE3o closet dedicado), a dica pr\xE1tica \xE9 sempre fazer a medida da porta menor que a medida da circula\xE7\xE3o dispon\xEDvel, garantindo que a porta aberta n\xE3o bata na cama ou em outro mobili\xE1rio. [cf. Qual a medida m\xEDnima para que as portas do arm\xE1rio se abram sem encostarem na cama? Se a porta for de correr, a circula\xE7\xE3o n\xE3o ser\xE1 prejudicada. Se for de abrir, a dica \xE9 fazer em uma medida sempre menor que a da circula\xE7\xE3o]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa em closets fechados \u2014 a circula\xE7\xE3o m\xEDnima \xE9 sempre necess\xE1ria para o funcionamento b\xE1sico do ambiente.",
        limitacoes: "Portas de abrir em ambientes muito compactos podem inviabilizar completamente esse tipo de porta \u2014 nesses casos, porta de correr (ver m\xF3dulo Portas e Gavetas, item 3) \xE9 praticamente obrigat\xF3ria."
      },
      acoes_recomendadas: "Priorizar sistemas de correr ou camar\xE3o (m\xF3dulo Portas e Gavetas, itens 3 e 4) em qualquer closet com circula\xE7\xE3o abaixo de 1 metro livre.",
      motivo_tecnico: "O espa\xE7o livre necess\xE1rio em frente aos arm\xE1rios depende do tipo de porta: em closets abertos (sem porta) ou com portas de correr, a circula\xE7\xE3o m\xEDnima pode ser de 70 cm; na frente de arm\xE1rios com portas de abrir, \xE9 necess\xE1rio espa\xE7o maior, proporcional ao tamanho da porta \u2014 para portas de 50 cm de largura, pode ser preciso deixar pelo menos 90 cm livres na passagem. [cf. Em closets abertos, sem portas, ou ent\xE3o com portas de correr, a circula\xE7\xE3o m\xEDnima pode ser de 70cm, enquanto na frente de arm\xE1rios com portas de abrir \xE9 necess\xE1rio um espa\xE7o maior, proporcional ao tamanho das portas. Para portas de 50cm de largura, pode ser preciso deixar pelo menos 90cm livres na passagem]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Dicas de Arquitetura; Krona (recomenda\xE7\xE3o complementar de pelo menos 1 metro de \xE1rea livre para circula\xE7\xE3o confort\xE1vel em frente ao guarda-roupa). [cf. Voc\xEA vai precisar de pelo menos um metro de \xE1rea livre para se movimentar com conforto e sem esbarr\xF5es]",
      fabricante: "N/A.",
      observacoes: "Este item se conecta diretamente ao m\xF3dulo Portas e Gavetas (limite de largura por folha, tipos de porta) \u2014 a escolha de tipo de porta em closet deve sempre considerar a circula\xE7\xE3o dispon\xEDvel como restri\xE7\xE3o de entrada, n\xE3o apenas prefer\xEAncia est\xE9tica. ---",
      tags: [
        "closets",
        "metragem",
        "circula\xE7\xE3o",
        "ambiente",
        "espa\xE7o",
        "frente",
        "m\xF3dulos"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_iluminacao_e_espelhos_estrategia_de_iluminacao_por_zona_do_closet",
      entidade: "ILUMINA\xC7\xC3O E ESPELHOS",
      categoria: "Closets",
      subcategoria: "ILUMINA\xC7\xC3O E ESPELHOS",
      titulo: "Estrat\xE9gia de ilumina\xE7\xE3o por zona do closet",
      tipo: "recomendacao",
      descricao: "A ilumina\xE7\xE3o eficaz de closet combina ilumina\xE7\xE3o geral (ambiente) com ilumina\xE7\xE3o de destaque/zona (dentro de gavetas, sob prateleiras, ao longo de var\xF5es suspensos) \u2014 tiras de LED s\xE3o citadas como solu\xE7\xE3o flex\xEDvel para iluminar prateleiras, grades suspensas, gavetas e espelhos internos. [cf. A flexibilidade das tiras de LED permite que voc\xEA use tiras de LED de forma vers\xE1til. Voc\xEA pode coloc\xE1-los sob as prateleiras do seu arm\xE1rio, nas grades suspensas, ou iluminar a gaveta e os espelhos]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de projeto el\xE9trico complementar em qualquer closet fechado, especialmente arm\xE1rios grandes onde a ilumina\xE7\xE3o ambiente do c\xF4modo n\xE3o penetra bem no interior dos m\xF3dulos. [cf. Quando voc\xEA tem um arm\xE1rio grande, \xE9 dif\xEDcil iluminar toda a \xE1rea corretamente. Para este problema, a ilumina\xE7\xE3o vertical pode ajud\xE1-lo a ver todos os gabinetes com clareza]",
        condicoes_adicionais: "Para closets, a recomenda\xE7\xE3o t\xE9cnica de temperatura de cor \xE9 luz branca brilhante/fria, que favorece a percep\xE7\xE3o real das cores das roupas e itens guardados. [cf. Para arm\xE1rios, \xE9 melhor usar luz branca brilhante ou fria. Essas cores ajudam voc\xEA a ver suas roupas e itens]"
      },
      restricoes: {
        quando_nao_aplicar: "Closets pequenos com boa ilumina\xE7\xE3o natural/ambiente e m\xF3dulos rasos podem dispensar ilumina\xE7\xE3o interna dedicada, reduzindo custo de instala\xE7\xE3o el\xE9trica.",
        limitacoes: "Ilumina\xE7\xE3o muito quente (amarelada) distorce a percep\xE7\xE3o de cor das roupas, dificultando a escolha de combina\xE7\xF5es no pr\xF3prio closet."
      },
      acoes_recomendadas: "Ilumina\xE7\xE3o de sanca com fita de LED, holofotes pontuais e luzes de trilho para destacar zonas especiais (sapateira em vitrine, joalheiro) sem iluminar o ambiente inteiro de forma uniforme. [cf. Voc\xEA pode adicionar ilumina\xE7\xE3o suspensa, holofotes e luzes de trilho para destacar zonas especiais do seu arm\xE1rio]",
      motivo_tecnico: "A ilumina\xE7\xE3o eficaz de closet combina ilumina\xE7\xE3o geral (ambiente) com ilumina\xE7\xE3o de destaque/zona (dentro de gavetas, sob prateleiras, ao longo de var\xF5es suspensos) \u2014 tiras de LED s\xE3o citadas como solu\xE7\xE3o flex\xEDvel para iluminar prateleiras, grades suspensas, gavetas e espelhos internos. [cf. A flexibilidade das tiras de LED permite que voc\xEA use tiras de LED de forma vers\xE1til. Voc\xEA pode coloc\xE1-los sob as prateleiras do seu arm\xE1rio, nas grades suspensas, ou iluminar a gaveta e os espelhos]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "m\xE9dio",
        estetico: "cr\xEDtico"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "LEDYi Lighting (guia t\xE9cnico de ilumina\xE7\xE3o para arm\xE1rios/closets).",
      fabricante: "N/A (tecnologia gen\xE9rica de LED, n\xE3o espec\xEDfica de fabricante de marcenaria).",
      observacoes: "A instala\xE7\xE3o el\xE9trica para ilumina\xE7\xE3o interna de m\xF3dulos deve ser prevista na fase de projeto (antes da produ\xE7\xE3o da caixaria), j\xE1 que passagens de fia\xE7\xE3o e sensores de presen\xE7a/toque exigem fura\xE7\xE3o e canaletas planejadas com anteced\xEAncia. ---",
      tags: [
        "closets",
        "ilumina\xE7\xE3o",
        "espelhos",
        "estrat\xE9gia",
        "zona",
        "closet"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_06_iluminacao_e_espelhos_espelhos_e_joalheiros_como_elementos_funcionais",
      entidade: "ILUMINA\xC7\xC3O E ESPELHOS",
      categoria: "Closets",
      subcategoria: "ILUMINA\xC7\xC3O E ESPELHOS",
      titulo: "Espelhos e joalheiros como elementos funcionais",
      tipo: "boa_pratica",
      descricao: "Espelhos de corpo inteiro em closets frequentemente v\xEAm integrados a m\xF3veis organizadores de joias (joalheiros), combinando fun\xE7\xE3o de vestir-se com armazenamento de acess\xF3rios \u2014 modelos de mercado incluem espelho ajust\xE1vel em m\xFAltiplos \xE2ngulos, ilumina\xE7\xE3o LED integrada, gavetas e compartimentos especializados (ganchos para colar, furos para brincos, compartimentos para an\xE9is). [cf. O seu espelho ajusta-se em 3 \xE2ngulos para se adaptar \xE0s suas necessidades em qualquer altura] [cf. A \xE1rea para joias inclui 36 ganchos para colar, 108 furos para brincos e 91 compartimentos para an\xE9is para manter todas as suas joias organizadas]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de m\xF3dulo de joalheiro dedicado em closets de padr\xE3o m\xE9dio a alto, especialmente em closets femininos.",
        condicoes_adicionais: "M\xF3dulos de joalheiro/espelho de p\xE9 geralmente contam com sistema de trava/fechadura para seguran\xE7a dos itens guardados. [cf. Gabinete com trava para maior seguran\xE7a]"
      },
      restricoes: {
        quando_nao_aplicar: "Closets compactos ou de uso misto podem priorizar apenas um espelho de corpo inteiro simples, sem a fun\xE7\xE3o combinada de joalheiro, para economizar espa\xE7o e custo.",
        limitacoes: "Modelos de espelho de p\xE9 com joalheiro integrado ocupam \xE1rea de piso dedicada \u2014 n\xE3o substituem a necessidade de espelho de parede fixo se o objetivo \xE9 economizar espa\xE7o de circula\xE7\xE3o."
      },
      acoes_recomendadas: "Espelho de porta (fixado na pr\xF3pria porta de arm\xE1rio ou closet) combinado com organizador de joias em gaveta separada, quando o espa\xE7o n\xE3o permite um m\xF3dulo de p\xE9 dedicado.",
      motivo_tecnico: "Espelhos de corpo inteiro em closets frequentemente v\xEAm integrados a m\xF3veis organizadores de joias (joalheiros), combinando fun\xE7\xE3o de vestir-se com armazenamento de acess\xF3rios \u2014 modelos de mercado incluem espelho ajust\xE1vel em m\xFAltiplos \xE2ngulos, ilumina\xE7\xE3o LED integrada, gavetas e compartimentos especializados (ganchos para colar, furos para brincos, compartimentos para an\xE9is). [cf. O seu espelho ajusta-se em 3 \xE2ngulos para se adaptar \xE0s suas necessidades em qualquer altura] [cf. A \xE1rea para joias inclui 36 ganchos para colar, 108 furos para brincos e 91 compartimentos para an\xE9is para manter todas as suas joias organizadas]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "m\xE9dio",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Refer\xEAncias de cat\xE1logo de produtos de mercado (HOMCOM, VEVOR, Leroy Merlin) \u2014 usadas aqui apenas para confirmar tipologia e funcionalidade de mercado, n\xE3o como especifica\xE7\xE3o t\xE9cnica de marcenaria sob medida.",
      fabricante: "N/A (categoria de produto, presente em diversos fabricantes de m\xF3veis e acess\xF3rios).",
      observacoes: 'Vale registrar que a maior parte do material dispon\xEDvel sobre "joalheiro" no mercado \xE9 de produtos prontos (n\xE3o sob medida) \u2014 para a marcenaria planejada, a boa pr\xE1tica \xE9 tratar o joalheiro como um m\xF3dulo de gavetas especializado (profundidades de 9\u201315 cm, ver item 4.1) combinado com espelho, em vez de depender de um produto avulso. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais** e **Closets** (este documento). Sequ\xEAncia restante: 7. **Banheiros** \u2014 umidade, cubas, espelhos, ilumina\xE7\xE3o, rodabanca, ventila\xE7\xE3o. 8. **Escrit\xF3rios** \u2014 ergonomia, monitores, cabos, CPU, impressoras. 9. **Produ\xE7\xE3o** \u2014 plano de corte, otimiza\xE7\xE3o, etiquetas, sequ\xEAncia, usinagem, fura\xE7\xE3o, acabamento. 10. **Transporte** \u2014 peso, elevadores, portas, escadas, caminh\xF5es, divis\xE3o de pe\xE7as. 11. **Montagem** \u2014 sequ\xEAncia, ferramentas, tempo, n\xFAmero de montadores, espa\xE7o. 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando em sequ\xEAncia para o m\xF3dulo **Banheiros**.',
      tags: [
        "closets",
        "ilumina\xE7\xE3o",
        "espelhos",
        "joalheiros",
        "elementos",
        "funcionais"
      ],
      modulo_origem: "06-Closets",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_altura_de_bancada_e_pia_faixa_de_altura_recomendada",
      entidade: "ALTURA DE BANCADA E PIA",
      categoria: "Banheiros",
      subcategoria: "ALTURA DE BANCADA E PIA",
      titulo: "Faixa de altura recomendada",
      tipo: "regra_obrigatoria",
      descricao: "A faixa mais citada por m\xFAltiplas fontes t\xE9cnicas para altura de bancada/pia de banheiro \xE9 80\u201390 cm do piso, com algumas fontes reduzindo o intervalo para 80\u201385 cm. [cf. Bancadas de banheiro devem ser instaladas entre 80 e 90 cent\xEDmetros do ch\xE3o, altura que traz funcionalidade para a maioria das pessoas] [cf. De acordo com recomenda\xE7\xF5es de especialistas, a altura da bancada deve ficar entre 80 e 85 cm, podendo variar entre 80 a 90 cm] Uma fonte aponta faixa ligeiramente mais alta, 85\u201393 cm. [cf. A altura da pia do banheiro varia entre 85 cm e 93 cm. Essa medida \xE9 confort\xE1vel para a maioria das pessoas, permitindo o uso da pia sem necessidade de se inclinar demais]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o da altura do gabinete/bancada em qualquer banheiro social, su\xEDte ou lavabo residencial.",
        condicoes_adicionais: "Para usu\xE1rios com estatura acima de 1,80 m, a bancada pode chegar a 110 cm de altura \u2014 ajuste que deve ser sempre validado com o cliente antes de fechar a medida final. [cf. Em casos espec\xEDficos, como para pessoas com mais de 1,80 m, a pia pode chegar a 110 cm de altura] Uma refer\xEAncia de mercado situa o valor mais usado em 90 cm do piso at\xE9 a borda da bancada, variando conforme o tipo de cuba (embutida, apoio, esculpida). [cf. A altura mais usada \xE9 90 cm do piso at\xE9 a borda da bancada, mas varia conforme o tipo de cuba]"
      },
      restricoes: {
        quando_nao_aplicar: "Banheiros infantis ou de acessibilidade (cadeirante) exigem alturas reduzidas e espec\xEDficas, fora desta faixa padr\xE3o \u2014 tratamento \xE0 parte, fora do escopo deste item.",
        limitacoes: "Uma bancada muito baixa for\xE7a m\xE1 postura (inclina\xE7\xE3o excessiva do usu\xE1rio); uma bancada muito alta prejudica a funcionalidade e o alcance de crian\xE7as e usu\xE1rios de estatura menor. [cf. Uma pia muito baixa pode acabar em uma m\xE1 postura para o usu\xE1rio, enquanto uma bancada muito alta prejudica a funcionalidade]"
      },
      acoes_recomendadas: 'Adotar uma altura fora do padr\xE3o apenas com documenta\xE7\xE3o expl\xEDcita do impacto (desconforto, dificuldade de uso por crian\xE7as, risco de respingos, redu\xE7\xE3o de vida \xFAtil do gabinete por postura inadequada de uso) \u2014 nunca fora do padr\xE3o "por acaso". [cf. Se a escolha for muito fora do padr\xE3o, \xE9 importante explicar os impactos: desconforto di\xE1rio, dificuldade para crian\xE7as usarem, risco de respingos e at\xE9 redu\xE7\xE3o da vida \xFAtil do gabinete se a postura de uso for inadequada]',
      motivo_tecnico: "A faixa mais citada por m\xFAltiplas fontes t\xE9cnicas para altura de bancada/pia de banheiro \xE9 80\u201390 cm do piso, com algumas fontes reduzindo o intervalo para 80\u201385 cm. [cf. Bancadas de banheiro devem ser instaladas entre 80 e 90 cent\xEDmetros do ch\xE3o, altura que traz funcionalidade para a maioria das pessoas] [cf. De acordo com recomenda\xE7\xF5es de especialistas, a altura da bancada deve ficar entre 80 e 85 cm, podendo variar entre 80 a 90 cm] Uma fonte aponta faixa ligeiramente mais alta, 85\u201393 cm. [cf. A altura da pia do banheiro varia entre 85 cm e 93 cm. Essa medida \xE9 confort\xE1vel para a maioria das pessoas, permitindo o uso da pia sem necessidade de se inclinar demais]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Leroy Merlin (blog institucional); JC Materiais; QTMOV (blog institucional voltado a marcenaria); Hidrica; Guia da Marcenaria; Blog Obramax.",
      fabricante: "N/A (refer\xEAncia de projeto geral).",
      observacoes: "Ao decidir a altura final, cruzar sempre com o tipo de cuba escolhida (item 1.2) e com a espessura real do material de bancada, seguindo l\xF3gica an\xE1loga \xE0 j\xE1 descrita no m\xF3dulo Cozinhas (item 9.2 \u2014 altura de bancada de cooktop). ---",
      tags: [
        "banheiros",
        "altura",
        "bancada",
        "faixa",
        "recomendada"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_altura_de_bancada_e_pia_cuba_sobreposta_e_ajuste_de_altura_por_tipo_de_cuba",
      entidade: "ALTURA DE BANCADA E PIA",
      categoria: "Banheiros",
      subcategoria: "ALTURA DE BANCADA E PIA",
      titulo: "Cuba sobreposta e ajuste de altura por tipo de cuba",
      tipo: "recomendacao",
      descricao: "Cubas de sobrepor (que ficam acima da superf\xEDcie da bancada, n\xE3o embutidas) precisam seguir a mesma recomenda\xE7\xE3o geral de altura de instala\xE7\xE3o (80\u201390 cm), mas o topo efetivo de uso fica mais alto que o da bancada em si, j\xE1 que a cuba se soma \xE0 altura da bancada. [cf. As pias de banheiro com cuba sobreposta precisam seguir a mesma recomenda\xE7\xE3o de altura para instala\xE7\xE3o: entre 80 e 90 cm]",
      condicoes: {
        quando_aplicar: "Sempre que o projeto usar cuba de sobrepor (modelo decorativo comum em banheiros de padr\xE3o m\xE9dio/alto) em vez de cuba embutida ou esculpida na pr\xF3pria pedra.",
        condicoes_adicionais: "A altura da cuba de sobrepor em si (n\xE3o da bancada) varia por modelo \u2014 exemplos de mercado citam cubas de 13\u201315,5 cm de altura pr\xF3pria, que devem ser somadas \xE0 altura da bancada para chegar \xE0 altura de borda final de uso. [cf. Cuba de Apoio... tem 40,5 cm de largura e 15,5 cm de altura. Cuba de Sobrepor Redonda... Possui 31 cm de largura e 13 cm de altura]"
      },
      restricoes: {
        quando_nao_aplicar: "Cubas embutidas (onde o topo da cuba fica no mesmo plano ou abaixo da bancada) n\xE3o t\xEAm esse acr\xE9scimo de altura efetiva \u2014 a altura de refer\xEAncia da bancada j\xE1 \xE9 a altura de uso final.",
        limitacoes: "Se o projetista esquecer de descontar/somar a altura pr\xF3pria da cuba de sobrepor, o resultado final da altura de uso pode ficar fora da faixa ergon\xF4mica recomendada mesmo com a bancada em si corretamente especificada."
      },
      acoes_recomendadas: "Cuba embutida ou esculpida na pedra, quando o objetivo \xE9 simplificar o c\xE1lculo de altura final e reduzir o risco de erro de soma.",
      motivo_tecnico: "Cubas de sobrepor (que ficam acima da superf\xEDcie da bancada, n\xE3o embutidas) precisam seguir a mesma recomenda\xE7\xE3o geral de altura de instala\xE7\xE3o (80\u201390 cm), mas o topo efetivo de uso fica mais alto que o da bancada em si, j\xE1 que a cuba se soma \xE0 altura da bancada. [cf. As pias de banheiro com cuba sobreposta precisam seguir a mesma recomenda\xE7\xE3o de altura para instala\xE7\xE3o: entre 80 e 90 cm]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Blog Obramax (com exemplos reais de produto e medidas).",
      fabricante: "Deca, Mari Lou\xE7as (modelos citados como refer\xEAncia de mercado).",
      observacoes: "Esta regra deveria ser tratada no motor de regras do Planne como um c\xE1lculo autom\xE1tico: altura de bancada + altura pr\xF3pria da cuba (quando de sobrepor) = altura de borda final, validada contra a faixa ergon\xF4mica de 80\u201390 cm (ou 110 cm para usu\xE1rios muito altos). ---",
      tags: [
        "banheiros",
        "altura",
        "bancada",
        "cuba",
        "sobreposta",
        "ajuste",
        "tipo"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_gabinete_sob_a_pia_sifao_ventilacao_e_umidade_necessidade_do_gabinete_decisao",
      entidade: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      categoria: "Banheiros",
      subcategoria: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      titulo: "Necessidade do gabinete: decis\xE3o funcional, n\xE3o autom\xE1tica",
      tipo: "recomendacao",
      descricao: "A decis\xE3o de incluir ou n\xE3o um gabinete sob a bancada do banheiro \xE9 uma quest\xE3o de uso do ambiente, n\xE3o uma obriga\xE7\xE3o autom\xE1tica \u2014 se o banheiro/lavabo n\xE3o precisa armazenar ou esconder itens, o gabinete pode ser dispensado; quando inclu\xEDdo, tipo e dimens\xE3o variam conforme estilo e espa\xE7o dispon\xEDvel. [cf. A decis\xE3o sobre a inclus\xE3o ou n\xE3o de gabinete sob a bancada \xE9 uma quest\xE3o de uso do ambiente. Se um banheiro ou lavabo n\xE3o tem necessidade de armazenar ou esconder itens, n\xE3o justifica ter um gabinete. J\xE1 o tipo e a dimens\xE3o desse arm\xE1rio variam e est\xE3o diretamente ligados ao estilo e ao espa\xE7o]",
      condicoes: {
        quando_aplicar: "Fase de defini\xE7\xE3o de escopo do projeto de banheiro, antes de especificar dimens\xF5es do gabinete.",
        condicoes_adicionais: "Quando o gabinete n\xE3o \xE9 inclu\xEDdo, sif\xF5es est\xE9ticos (com acabamento decorativo, sem necessidade de oculta\xE7\xE3o) s\xE3o a escolha recomendada, j\xE1 que a pe\xE7a fica totalmente aparente. [cf. Esse tipo de sif\xE3o \xE9 indicado principalmente em banheiros que n\xE3o contam com gabinete... em que a pe\xE7a fica totalmente aparente]"
      },
      restricoes: {
        quando_nao_aplicar: "Lavabos pequenos de uso social eventual (sem necessidade real de armazenamento) muitas vezes prescindem de gabinete, priorizando cuba/coluna aparente por quest\xE3o est\xE9tica e de espa\xE7o.",
        limitacoes: "Espa\xE7o insuficiente para abertura de portas/gavetas do gabinete \xE9 uma limita\xE7\xE3o recorrente em banheiros pequenos, que deve ser avaliada antes de comprometer com o m\xF3dulo completo. [cf. O problema \xE9 que nem sempre o tamanho do ambiente permite, j\xE1 que as gavetas e portas precisam de espa\xE7o para a abertura]"
      },
      acoes_recomendadas: "Pia com coluna (menos usada atualmente, mas ainda dispon\xEDvel), como alternativa ao gabinete quando se deseja esconder o sif\xE3o sem o volume de armazenamento de um m\xF3vel completo. [cf. Pias com colunas s\xE3o boas op\xE7\xF5es para esconder o sif\xE3o da pia]",
      motivo_tecnico: "A decis\xE3o de incluir ou n\xE3o um gabinete sob a bancada do banheiro \xE9 uma quest\xE3o de uso do ambiente, n\xE3o uma obriga\xE7\xE3o autom\xE1tica \u2014 se o banheiro/lavabo n\xE3o precisa armazenar ou esconder itens, o gabinete pode ser dispensado; quando inclu\xEDdo, tipo e dimens\xE3o variam conforme estilo e espa\xE7o dispon\xEDvel. [cf. A decis\xE3o sobre a inclus\xE3o ou n\xE3o de gabinete sob a bancada \xE9 uma quest\xE3o de uso do ambiente. Se um banheiro ou lavabo n\xE3o tem necessidade de armazenar ou esconder itens, n\xE3o justifica ter um gabinete. J\xE1 o tipo e a dimens\xE3o desse arm\xE1rio variam e est\xE3o diretamente ligados ao estilo e ao espa\xE7o]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Imobili\xE1ria Fortes Guimar\xE3es (mat\xE9ria com declara\xE7\xE3o de arquiteta especializada); Viva Decora (guia de tipos de sif\xE3o).",
      fabricante: "N/A.",
      observacoes: "A arquiteta consultada na fonte recomenda materiais resistentes \xE0 umidade para o gabinete quando ele \xE9 inclu\xEDdo \u2014 madeira tratada, f\xF3rmica, MDF ou MDP \u2014 refor\xE7ando a conex\xE3o direta com o m\xF3dulo Materiais (item 2, MDF hidr\xF3fugo). [cf. A profissional indica materiais mais resistentes \xE0 umidade, como madeira tratada, f\xF3rmica, MDF ou MDP] ---",
      tags: [
        "banheiros",
        "gabinete",
        "sif\xE3o",
        "ventila\xE7\xE3o",
        "umidade",
        "necessidade",
        "decis\xE3o",
        "funcional"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_gabinete_sob_a_pia_sifao_ventilacao_e_umidade_prevencao_de_mofo_fundo_aberto_",
      entidade: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      categoria: "Banheiros",
      subcategoria: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      titulo: "Preven\xE7\xE3o de mofo: fundo aberto e v\xE3o central para o sif\xE3o",
      tipo: "recomendacao",
      descricao: "Recomenda-se manter o gabinete sob a pia sem fundo fechado contra a parede \u2014 assim, o risco de mofo por ac\xFAmulo de umidade \xE9 reduzido, e um eventual vazamento \xE9 percebido mais facilmente (em vez de ficar escondido atr\xE1s de um fundo fechado). [cf. Uma dica \xE9 manter o m\xF3vel sem fundo para a parede, assim n\xE3o corre o risco de mofar por umidade e um vazamento pode ser notado facilmente]",
      condicoes: {
        quando_aplicar: "Todo projeto de gabinete de banheiro que abriga tubula\xE7\xE3o e sif\xE3o em seu interior.",
        condicoes_adicionais: "O sif\xE3o da pia deve sempre ficar posicionado em um v\xE3o central do gabinete, para facilitar manuten\xE7\xE3o; em caso de prateleiras internas, \xE9 necess\xE1rio verificar a altura para n\xE3o comprometer o funcionamento do sif\xE3o, ou providenciar um recorte espec\xEDfico na prateleira para o encaixe da tubula\xE7\xE3o. [cf. O sif\xE3o da pia precisa sempre estar em um v\xE3o central, para f\xE1cil manuten\xE7\xE3o. Em caso de prateleiras internas, verificar a altura para n\xE3o comprometer o funcionamento do sif\xE3o, ou providenciar um recorte na prateleira para o encaixe dele]"
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3dulos de gabinete que n\xE3o t\xEAm qualquer tubula\xE7\xE3o passando por dentro (ex.: gabinete lateral independente, sem fun\xE7\xE3o de esconder sif\xE3o) podem manter fundo fechado normalmente, seguindo a regra geral do m\xF3dulo Estrutura (item 3).",
        limitacoes: "Esta \xE9 uma exce\xE7\xE3o deliberada \xE0 regra geral de fundo estrutural (m\xF3dulo Estrutura, item 3.1) \u2014 no gabinete de banheiro, a fun\xE7\xE3o de travamento do fundo cede prioridade \xE0 preven\xE7\xE3o de mofo e \xE0 facilidade de manuten\xE7\xE3o."
      },
      acoes_recomendadas: "Fundo com recorte de inspe\xE7\xE3o (n\xE3o removido por completo, mas com abertura pontual) quando se deseja manter alguma fun\xE7\xE3o de travamento estrutural sem sacrificar totalmente a ventila\xE7\xE3o/acesso.",
      motivo_tecnico: "Recomenda-se manter o gabinete sob a pia sem fundo fechado contra a parede \u2014 assim, o risco de mofo por ac\xFAmulo de umidade \xE9 reduzido, e um eventual vazamento \xE9 percebido mais facilmente (em vez de ficar escondido atr\xE1s de um fundo fechado). [cf. Uma dica \xE9 manter o m\xF3vel sem fundo para a parede, assim n\xE3o corre o risco de mofar por umidade e um vazamento pode ser notado facilmente]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "baixo",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Imobili\xE1ria Fortes Guimar\xE3es (declara\xE7\xE3o de arquiteta Thaisa Bohrer).",
      fabricante: "N/A.",
      observacoes: "O sif\xE3o acumula sujeira e precisa de limpeza regular (desenroscando por baixo) \u2014 o motor de regras do Planne deveria sinalizar automaticamente a necessidade de v\xE3o de acesso/inspe\xE7\xE3o ao especificar qualquer gabinete de banheiro com pia embutida. [cf. O sif\xE3o da pia acumula sujeira e precisa ser limpo regularmente, desenroscando por baixo] ---",
      tags: [
        "banheiros",
        "gabinete",
        "sif\xE3o",
        "ventila\xE7\xE3o",
        "umidade",
        "preven\xE7\xE3o",
        "mofo",
        "fundo"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_gabinete_sob_a_pia_sifao_ventilacao_e_umidade_gabinete_suspenso_vs_gabinete_c",
      entidade: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      categoria: "Banheiros",
      subcategoria: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      titulo: "Gabinete suspenso vs. gabinete com p\xE9s",
      tipo: "boa_pratica",
      descricao: "Gabinetes suspensos (fixados diretamente na parede, sem contato com o piso) facilitam a limpeza do piso do banheiro e conferem visual leve e contempor\xE2neo; gabinetes com p\xE9s (ou base apoiada no piso) seguem uma l\xF3gica construtiva mais tradicional. [cf. A escolha entre gabinetes suspensos e gabinetes com p\xE9s \xE9 uma das decis\xF5es mais importantes na hora de renovar o banheiro. Os suspensos s\xE3o fixados diretamente na parede, facilitam a limpeza do piso e conferem visual leve e contempor\xE2neo ao ambiente]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer gabinete de banheiro, avaliando o perfil de manuten\xE7\xE3o/limpeza desejado pelo cliente.",
        condicoes_adicionais: "Fixa\xE7\xE3o de gabinete suspenso exige verifica\xE7\xE3o da resist\xEAncia da parede (alvenaria, drywall com refor\xE7o interno) para suportar o peso do m\xF3vel e da cuba/pedra, an\xE1logo \xE0 regra de fixa\xE7\xE3o de coifa j\xE1 descrita no m\xF3dulo Cozinhas (item 6.1)."
      },
      restricoes: {
        quando_nao_aplicar: "Banheiros com hist\xF3rico de infiltra\xE7\xE3o no piso ou em reformas onde a parede n\xE3o suporta boa fixa\xE7\xE3o suspensa (alvenaria fr\xE1gil, drywall sem refor\xE7o) podem exigir gabinete apoiado no piso por raz\xE3o estrutural, n\xE3o apenas est\xE9tica.",
        limitacoes: "Modelos suspensos concentram toda a carga em pontos de fixa\xE7\xE3o na parede \u2014 uma parede fraca ou mal refor\xE7ada compromete a seguran\xE7a da instala\xE7\xE3o."
      },
      acoes_recomendadas: "Gabinete com p\xE9s, quando a parede n\xE3o oferece condi\xE7\xE3o segura de fixa\xE7\xE3o suspensa, ou quando o cliente prefere o visual mais tradicional.",
      motivo_tecnico: "Gabinetes suspensos (fixados diretamente na parede, sem contato com o piso) facilitam a limpeza do piso do banheiro e conferem visual leve e contempor\xE2neo; gabinetes com p\xE9s (ou base apoiada no piso) seguem uma l\xF3gica construtiva mais tradicional. [cf. A escolha entre gabinetes suspensos e gabinetes com p\xE9s \xE9 uma das decis\xF5es mais importantes na hora de renovar o banheiro. Os suspensos s\xE3o fixados diretamente na parede, facilitam a limpeza do piso e conferem visual leve e contempor\xE2neo ao ambiente]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Fabribam/Meu M\xF3vel de Banheiro (fabricante de gabinetes).",
      fabricante: "Fabribam.",
      observacoes: "Fabricantes especializados destacam o uso de materiais selecionados para suportar a umidade e o vapor caracter\xEDsticos do banheiro, refor\xE7ando novamente a conex\xE3o com o m\xF3dulo Materiais. [cf. Todos os gabinetes s\xE3o fabricados... com materiais selecionados para suportar a umidade e o vapor caracter\xEDsticos dos banheiros, garantindo durabilidade e apar\xEAncia preservada ao longo do tempo] ---",
      tags: [
        "banheiros",
        "gabinete",
        "sif\xE3o",
        "ventila\xE7\xE3o",
        "umidade",
        "suspenso"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_espelhos_altura_e_distancia_da_pia_distancia_entre_a_pia_e_a_base_do_espelho",
      entidade: "ESPELHOS \u2014 ALTURA E DIST\xC2NCIA DA PIA",
      categoria: "Banheiros",
      subcategoria: "ESPELHOS \u2014 ALTURA E DIST\xC2NCIA DA PIA",
      titulo: "Dist\xE2ncia entre a pia e a base do espelho",
      tipo: "recomendacao",
      descricao: "Recomenda-se um espa\xE7o de 20 a 30 cm entre a bancada/pia e a base do espelho \u2014 essa dist\xE2ncia garante posi\xE7\xE3o conveniente de uso di\xE1rio e ajuda a evitar respingos de \xE1gua diretamente sobre a base do espelho. [cf. Um espa\xE7o de 20 a 30 cm entre a pia e a base do espelho \xE9 ideal. Isso n\xE3o s\xF3 garante que o espelho esteja em uma posi\xE7\xE3o conveniente para o uso di\xE1rio, mas tamb\xE9m evita respingos de \xE1gua]",
      condicoes: {
        quando_aplicar: "Instala\xE7\xE3o de qualquer espelho de banheiro posicionado diretamente acima da bancada/pia.",
        condicoes_adicionais: "Uma boa regra pr\xE1tica \xE9 alinhar o centro do espelho aproximadamente na altura dos olhos das pessoas que mais utilizam o banheiro \u2014 para a maioria dos adultos, isso corresponde a 150\u2013170 cm do piso. [cf. Uma boa regra \xE9 alinhar o centro do espelho aproximadamente na altura dos olhos das pessoas que mais utilizam o banheiro. Para a maioria das pessoas, isso est\xE1 entre 150 e 170 cm do ch\xE3o]"
      },
      restricoes: {
        quando_nao_aplicar: "Espelhos que cobrem toda a parede (do balc\xE3o at\xE9 o teto) seguem l\xF3gica de centraliza\xE7\xE3o e propor\xE7\xE3o geral do ambiente, n\xE3o a dist\xE2ncia pontual da base. [cf. Se o espelho for muito grande ou vai do balc\xE3o at\xE9 o teto, certifique-se de que ele esteja bem centralizado e proporcionado em rela\xE7\xE3o ao restante do banheiro]",
        limitacoes: "Como a altura de olhos varia por usu\xE1rio, banheiros de uso compartilhado por pessoas de estaturas muito diferentes (adultos e crian\xE7as, por exemplo) enfrentam o mesmo trade-off de compromisso j\xE1 descrito no m\xF3dulo Cozinhas (item 9.1 \u2014 altura de bancada)."
      },
      acoes_recomendadas: "Espelho com ajuste de inclina\xE7\xE3o, ou espelho adicional em altura reduzida para crian\xE7as, quando o compromisso de altura \xFAnica n\xE3o atende bem a todos os usu\xE1rios.",
      motivo_tecnico: "Recomenda-se um espa\xE7o de 20 a 30 cm entre a bancada/pia e a base do espelho \u2014 essa dist\xE2ncia garante posi\xE7\xE3o conveniente de uso di\xE1rio e ajuda a evitar respingos de \xE1gua diretamente sobre a base do espelho. [cf. Um espa\xE7o de 20 a 30 cm entre a pia e a base do espelho \xE9 ideal. Isso n\xE3o s\xF3 garante que o espelho esteja em uma posi\xE7\xE3o conveniente para o uso di\xE1rio, mas tamb\xE9m evita respingos de \xE1gua]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Casavee (guia t\xE9cnico de instala\xE7\xE3o de espelho).",
      fabricante: "N/A.",
      observacoes: "O processo recomendado de instala\xE7\xE3o \xE9: medir a altura real da pia instalada, marcar a altura dos olhos do usu\xE1rio principal (pedindo para a pessoa se posicionar na frente da pia), decidir o espa\xE7o desejado acima da pia, e s\xF3 ent\xE3o instalar o espelho nivelado e centralizado. [cf. Me\xE7a a Altura da Pia... Marque a Altura dos Olhos... Determine o Espa\xE7o Acima da Pia... Instale o Espelho: Use essas medidas para instalar o espelho. Certifique-se de que est\xE1 nivelado e centralizado] ---",
      tags: [
        "banheiros",
        "espelhos",
        "altura",
        "dist\xE2ncia",
        "base",
        "espelho"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_rodabanca_frontao_e_testeira_definicoes_e_funcao_de_cada_elemento",
      entidade: "RODABANCA, FRONT\xC3O E TESTEIRA",
      categoria: "Banheiros",
      subcategoria: "RODABANCA, FRONT\xC3O E TESTEIRA",
      titulo: "Defini\xE7\xF5es e fun\xE7\xE3o de cada elemento",
      tipo: "restricao",
      descricao: "Tr\xEAs termos t\xE9cnicos frequentemente confundidos descrevem elementos de prote\xE7\xE3o da bancada contra umidade: front\xE3o/rodabanca/rodapia \u2014 pe\xE7a (geralmente do mesmo material da bancada) posicionada sobre a pia junto \xE0 parede, cuja fun\xE7\xE3o principal \xE9 prevenir vazamento e proteger a parede do contato direto com \xE1gua; [cf. Tamb\xE9m conhecido como rodabanca ou rodapia, o front\xE3o \xE9 um tipo de rodap\xE9 que fica sobre a pia, geralmente produzido com o mesmo material da bancada. Sua principal fun\xE7\xE3o \xE9 prevenir vazamentos, protegendo a parede do contato direto com a \xE1gua] testeira \u2014 a parte frontal da bancada, que d\xE1 acabamento e, quando n\xE3o h\xE1 arm\xE1rio embaixo, esconde o sif\xE3o/tubula\xE7\xE3o; [cf. Testeira de bancada: \xE9 a parte da frente da bancada respons\xE1vel por dar o acabamento e trazer requinte para a bancada e, quando n\xE3o h\xE1 arm\xE1rio embaixo da bancada esconder o sif\xE3o da torneira] rodabanca (em sentido mais espec\xEDfico, segundo outra fonte) \u2014 faixa de parede exposta entre o balc\xE3o e os arm\xE1rios superiores/espelho, que protege contra respingos e facilita a limpeza di\xE1ria. [cf. Diferente do front\xE3o, a rodabanca \xE9 instalada entre a bancada e a marcenaria a\xE9rea, ou seja, naquela faixa de parede que fica exposta entre o balc\xE3o e os arm\xE1rios superiores. Sua fun\xE7\xE3o principal \xE9 proteger essa \xE1rea de respingos e facilitar a limpeza di\xE1ria]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o completa de qualquer bancada de banheiro (ou cozinha) que tenha contato direto com respingos de \xE1gua.",
        condicoes_adicionais: "Sem o front\xE3o, a tend\xEAncia \xE9 que umidade e res\xEDduos se acumulem na fresta entre a pedra e a parede \u2014 problema recorrente tanto em banheiros quanto em cozinhas. [cf. Sem o front\xE3o, a tend\xEAncia \xE9 que umidade e res\xEDduos se acumulem nesse espa\xE7o, especialmente em bancadas de cozinha e pias de banheiro]"
      },
      restricoes: {
        quando_nao_aplicar: 'A terminologia varia por regi\xE3o/profissional (arquiteto, marceneiro e pedreiro podem usar termos diferentes para elementos parecidos) \u2014 o importante n\xE3o \xE9 a nomenclatura em si, mas garantir que a fun\xE7\xE3o de prote\xE7\xE3o contra umidade esteja coberta no projeto, seja qual for o termo usado. [cf. O arquiteto fala em "rodabanca", a marceneira menciona "front\xE3o" e o pedreiro pergunta se vai ter "pingadeira" na bancada]',
        limitacoes: 'Erros de compatibiliza\xE7\xE3o entre esses elementos e a marcenaria/instala\xE7\xE3o el\xE9trica na obra geram a maior parte dos "improvisos" corrigidos tardiamente \u2014 recomenda-se nunca deixar essa decis\xE3o para ser resolvida isoladamente pelo azulejista ou pelo pedreiro em obra. [cf. A compatibiliza\xE7\xE3o nessa etapa evita 80% dos improvisos de obra... n\xE3o deixe para o azulejista decidir sozinho na obra. Especifica\xE7\xE3o clara economiza retrabalho]'
      },
      acoes_recomendadas: "Rodabanca no mesmo material da bancada (cont\xEDnuo, visual monol\xEDtico) ou em revestimento cer\xE2mico/porcelanato \xE0 parte \u2014 ambas as op\xE7\xF5es s\xE3o v\xE1lidas, desde que o material escolhido seja imperme\xE1vel. [cf. A rodabanca pode ter o mesmo revestimento do restante da cozinha... Como a principal fun\xE7\xE3o da rodabanca \xE9 facilitar a limpeza e n\xE3o permitir que os l\xEDquidos e umidade infiltrem na parede, o revestimento escolhido precisa ser imperme\xE1vel]",
      motivo_tecnico: "Tr\xEAs termos t\xE9cnicos frequentemente confundidos descrevem elementos de prote\xE7\xE3o da bancada contra umidade: front\xE3o/rodabanca/rodapia \u2014 pe\xE7a (geralmente do mesmo material da bancada) posicionada sobre a pia junto \xE0 parede, cuja fun\xE7\xE3o principal \xE9 prevenir vazamento e proteger a parede do contato direto com \xE1gua; [cf. Tamb\xE9m conhecido como rodabanca ou rodapia, o front\xE3o \xE9 um tipo de rodap\xE9 que fica sobre a pia, geralmente produzido com o mesmo material da bancada. Sua principal fun\xE7\xE3o \xE9 prevenir vazamentos, protegendo a parede do contato direto com a \xE1gua] testeira \u2014 a parte frontal da bancada, que d\xE1 acabamento e, quando n\xE3o h\xE1 arm\xE1rio embaixo, esconde o sif\xE3o/tubula\xE7\xE3o; [cf. Testeira de bancada: \xE9 a parte da frente da bancada respons\xE1vel por dar o acabamento e trazer requinte para a bancada e, quando n\xE3o h\xE1 arm\xE1rio embaixo da bancada esconder o sif\xE3o da torneira] rodabanca (em sentido mais espec\xEDfico, segundo outra fonte) \u2014 faixa de parede exposta entre o balc\xE3o e os arm\xE1rios superiores/espelho, que protege contra respingos e facilita a limpeza di\xE1ria. [cf. Diferente do front\xE3o, a rodabanca \xE9 instalada entre a bancada e a marcenaria a\xE9rea, ou seja, naquela faixa de parede que fica exposta entre o balc\xE3o e os arm\xE1rios superiores. Sua fun\xE7\xE3o principal \xE9 proteger essa \xE1rea de respingos e facilitar a limpeza di\xE1ria]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Portal Insights (FAQ t\xE9cnico); Enfeite Decora (mat\xE9ria com declara\xE7\xE3o de arquiteta especializada); Pointer Revestimentos (blog institucional); P\xE2mela Decora\xE7\xE3o (blog profissional).",
      fabricante: "N/A (elemento de projeto, material vari\xE1vel).",
      observacoes: "Ao especificar rodabanca/front\xE3o/testeira, \xE9 fundamental compatibilizar a altura final da bancada (com rodapia/p\xE9s), a altura do arm\xE1rio a\xE9reo/espelho e a posi\xE7\xE3o de tomadas na mesma etapa \u2014 trat\xE1-los isoladamente \xE9 a causa mais citada de retrabalho em obra. [cf. Altura final da bancada (com rodapia/p\xE9s). Altura do arm\xE1rio a\xE9reo e profundidade. Posi\xE7\xE3o e quantidade de tomadas na faixa do backsplash. A compatibiliza\xE7\xE3o nessa etapa evita 80% dos improvisos de obra] ---",
      tags: [
        "banheiros",
        "rodabanca",
        "front\xE3o",
        "testeira",
        "defini\xE7\xF5es",
        "fun\xE7\xE3o",
        "elemento"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_07_materiais_e_resistencia_a_umidade_em_banheiro_especificacao_de_material_para_",
      entidade: "MATERIAIS E RESIST\xCANCIA \xC0 UMIDADE EM BANHEIRO",
      categoria: "Banheiros",
      subcategoria: "MATERIAIS E RESIST\xCANCIA \xC0 UMIDADE EM BANHEIRO",
      titulo: "Especifica\xE7\xE3o de material para gabinete de banheiro",
      tipo: "regra_obrigatoria",
      descricao: "Para o gabinete sob a pia (o elemento de marcenaria mais exposto \xE0 umidade em todo o banheiro), a recomenda\xE7\xE3o t\xE9cnica consolidada \xE9 usar materiais resistentes \xE0 umidade: madeira tratada, f\xF3rmica, MDF ou MDP \u2014 preferencialmente nas linhas hidr\xF3fugas espec\xEDficas j\xE1 descritas no m\xF3dulo Materiais (item 2). [cf. A profissional indica materiais mais resistentes \xE0 umidade, como madeira tratada, f\xF3rmica, MDF ou MDP]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de material de qualquer m\xF3dulo de marcenaria em banheiro \u2014 gabinete, prateleiras internas, pain\xE9is pr\xF3ximos ao box.",
        condicoes_adicionais: "Cruzar sempre a escolha de material com a regra de fundo aberto (item 2.2) e com a regra de rodabanca/front\xE3o (item 4) \u2014 a resist\xEAncia \xE0 umidade do material principal n\xE3o substitui as demais camadas de prote\xE7\xE3o contra \xE1gua do projeto."
      },
      restricoes: {
        quando_nao_aplicar: "Elementos de banheiro totalmente fora da zona de respingo (ex.: um arm\xE1rio de linho em corredor anexo, tecnicamente fora do banheiro) podem usar material convencional, sem necessidade da linha hidr\xF3fuga.",
        limitacoes: "Mesmo as linhas hidr\xF3fugas de MDF/MDP n\xE3o s\xE3o \xE0 prova d'\xE1gua \u2014 a resist\xEAncia \xE0 umidade reduz o risco, mas n\xE3o elimina a necessidade de boas pr\xE1ticas complementares (fita de borda bem aplicada, fundo aberto, rodabanca)."
      },
      acoes_recomendadas: "Compensado naval (m\xF3dulo Materiais, item 3) para banheiros de uso muito intenso ou de padr\xE3o muito alto, quando a exposi\xE7\xE3o \xE0 umidade \xE9 mais severa que a m\xE9dia residencial.",
      motivo_tecnico: "Para o gabinete sob a pia (o elemento de marcenaria mais exposto \xE0 umidade em todo o banheiro), a recomenda\xE7\xE3o t\xE9cnica consolidada \xE9 usar materiais resistentes \xE0 umidade: madeira tratada, f\xF3rmica, MDF ou MDP \u2014 preferencialmente nas linhas hidr\xF3fugas espec\xEDficas j\xE1 descritas no m\xF3dulo Materiais (item 2). [cf. A profissional indica materiais mais resistentes \xE0 umidade, como madeira tratada, f\xF3rmica, MDF ou MDP]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Imobili\xE1ria Fortes Guimar\xE3es (refer\xEAncia j\xE1 citada no item 2.1); conex\xE3o direta com o m\xF3dulo Materiais deste projeto.",
      fabricante: "N/A (ver m\xF3dulo Materiais para fabricantes espec\xEDficos de linha hidr\xF3fuga).",
      observacoes: 'Este item deve ser tratado no motor de regras como uma valida\xE7\xE3o autom\xE1tica \u2014 qualquer m\xF3dulo de marcenaria especificado dentro da categoria "Banheiro" deveria sugerir por padr\xE3o uma linha de material hidr\xF3fugo/resistente \xE0 umidade, exigindo confirma\xE7\xE3o expl\xEDcita do projetista para usar material convencional. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais**, **Closets** e **Banheiros** (este documento). Sequ\xEAncia restante: 8. **Escrit\xF3rios** \u2014 ergonomia, monitores, cabos, CPU, impressoras. 9. **Produ\xE7\xE3o** \u2014 plano de corte, otimiza\xE7\xE3o, etiquetas, sequ\xEAncia, usinagem, fura\xE7\xE3o, acabamento. 10. **Transporte** \u2014 peso, elevadores, portas, escadas, caminh\xF5es, divis\xE3o de pe\xE7as. 11. **Montagem** \u2014 sequ\xEAncia, ferramentas, tempo, n\xFAmero de montadores, espa\xE7o. 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando em sequ\xEAncia para o m\xF3dulo **Escrit\xF3rios**.',
      tags: [
        "banheiros",
        "materiais",
        "resist\xEAncia",
        "umidade",
        "banheiro",
        "especifica\xE7\xE3o",
        "material",
        "gabinete"
      ],
      modulo_origem: "07-Banheiros",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_08_altura_de_mesa_e_ergonomia_faixa_de_altura_recomendada_e_referencia_normativa",
      entidade: "ALTURA DE MESA E ERGONOMIA",
      categoria: "Escritorios",
      subcategoria: "ALTURA DE MESA E ERGONOMIA",
      titulo: "Faixa de altura recomendada e refer\xEAncia normativa (NR-17)",
      tipo: "regra_obrigatoria",
      descricao: "A altura de mesa de escrit\xF3rio mais citada como confort\xE1vel para estatura m\xE9dia (cerca de 1,70 m) fica na faixa de 70\u201378 cm, com uma refer\xEAncia mais espec\xEDfica de 73\u201375 cm. [cf. Em geral, entre 70 cm e 78 cm, com ajuste se poss\xEDvel] [cf. Geralmente, a altura ideal para uma mesa de trabalho entre 73 e 75 cm funciona bem para uma estatura de 1,70 m, sempre combinada com uma cadeira regul\xE1vel] No Brasil, a norma regulamentadora NR-17 (ergonomia e sa\xFAde ocupacional) \xE9 a refer\xEAncia legal para ambientes de trabalho corporativos, determinando que altura e caracter\xEDsticas da superf\xEDcie de trabalho devem ser compat\xEDveis com o tipo de atividade, a dist\xE2ncia dos olhos ao campo de trabalho e a altura do assento. [cf. A NR-17 esclarece que a mesa de escrit\xF3rio deve permitir ao trabalhador manter uma boa postura, al\xE9m de garantir o posicionamento e a movimenta\xE7\xE3o adequados do corpo... a altura e as caracter\xEDsticas da superf\xEDcie de trabalho devem ser compat\xEDveis com o tipo de atividade, com a dist\xE2ncia requerida dos olhos ao campo de trabalho e com a altura do assento]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer mesa/escrivaninha de home office ou escrit\xF3rio corporativo planejado.",
        condicoes_adicionais: "O objetivo ergon\xF4mico central \xE9 manter os bra\xE7os em \xE2ngulo de 90\xB0 em rela\xE7\xE3o aos cotovelos durante a digita\xE7\xE3o, com ombros relaxados e costas retas. [cf. O objetivo \xE9 manter seus bra\xE7os em um \xE2ngulo de 90 graus em rela\xE7\xE3o aos cotovelos ao digitar, com os ombros relaxados e as costas retas]"
      },
      restricoes: {
        quando_nao_aplicar: "Ambientes corporativos formais (n\xE3o residenciais) devem tratar a NR-17 como exig\xEAncia legal, n\xE3o apenas recomenda\xE7\xE3o \u2014 a distin\xE7\xE3o residencial/corporativo muda o n\xEDvel de obrigatoriedade da norma.",
        limitacoes: "Mesas fixas (n\xE3o regul\xE1veis) sempre representam uma solu\xE7\xE3o de compromisso para usu\xE1rios fora da faixa de estatura m\xE9dia \u2014 o mesmo problema j\xE1 descrito em outros m\xF3dulos (altura de bancada de cozinha, item 9.1, e de banheiro, item 1.1) se repete aqui."
      },
      acoes_recomendadas: "Mesa com ajuste de altura (el\xE9trico ou manual, incluindo op\xE7\xE3o sit-to-stand) para atender m\xFAltiplos usu\xE1rios ou reduzir fadiga em jornadas longas \u2014 citada como solu\xE7\xE3o para adaptar a mesa a diferentes usu\xE1rios. [cf. Uma mesa regul\xE1vel facilita adaptar a altura de uma mesa de escrit\xF3rio a diferentes utilizadores]",
      motivo_tecnico: "A altura de mesa de escrit\xF3rio mais citada como confort\xE1vel para estatura m\xE9dia (cerca de 1,70 m) fica na faixa de 70\u201378 cm, com uma refer\xEAncia mais espec\xEDfica de 73\u201375 cm. [cf. Em geral, entre 70 cm e 78 cm, com ajuste se poss\xEDvel] [cf. Geralmente, a altura ideal para uma mesa de trabalho entre 73 e 75 cm funciona bem para uma estatura de 1,70 m, sempre combinada com uma cadeira regul\xE1vel] No Brasil, a norma regulamentadora NR-17 (ergonomia e sa\xFAde ocupacional) \xE9 a refer\xEAncia legal para ambientes de trabalho corporativos, determinando que altura e caracter\xEDsticas da superf\xEDcie de trabalho devem ser compat\xEDveis com o tipo de atividade, a dist\xE2ncia dos olhos ao campo de trabalho e a altura do assento. [cf. A NR-17 esclarece que a mesa de escrit\xF3rio deve permitir ao trabalhador manter uma boa postura, al\xE9m de garantir o posicionamento e a movimenta\xE7\xE3o adequados do corpo... a altura e as caracter\xEDsticas da superf\xEDcie de trabalho devem ser compat\xEDveis com o tipo de atividade, com a dist\xE2ncia requerida dos olhos ao campo de trabalho e com a altura do assento]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 100,
        base: "norma_oficial"
      },
      fonte: "Cadeiraspro.pt; Funcional (blog institucional com refer\xEAncia \xE0 NR-17); Home Office Grupo; Escrimob; QualEaMelhor.",
      fabricante: "N/A (refer\xEAncia de norma e boas pr\xE1ticas ergon\xF4micas gerais).",
      observacoes: "Mesmo em projetos residenciais (n\xE3o sujeitos \xE0 obrigatoriedade legal da NR-17), a norma \xE9 uma refer\xEAncia t\xE9cnica de boa pr\xE1tica que deveria orientar o motor de regras do Planne para qualquer m\xF3dulo de escrit\xF3rio/home office. ---",
      tags: [
        "escritorios",
        "altura",
        "mesa",
        "ergonomia",
        "faixa",
        "recomendada",
        "refer\xEAncia",
        "normativa"
      ],
      modulo_origem: "08-Escritorios",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_08_posicionamento_de_monitor_altura_e_distancia_do_monitor_em_relacao_ao_usuario",
      entidade: "POSICIONAMENTO DE MONITOR",
      categoria: "Escritorios",
      subcategoria: "POSICIONAMENTO DE MONITOR",
      titulo: "Altura e dist\xE2ncia do monitor em rela\xE7\xE3o ao usu\xE1rio",
      tipo: "boa_pratica",
      descricao: "O monitor deve ficar posicionado abaixo do eixo visual horizontal do usu\xE1rio, a uma dist\xE2ncia m\xEDnima equivalente a um bra\xE7o estendido. [cf. Monitor: deve estar abaixo do eixo visual horizontal, h\xE1 uma dist\xE2ncia m\xEDnima de um bra\xE7o] A cabe\xE7a deve permanecer alinhada, com os olhos confort\xE1veis na altura do monitor, evitando dores no pesco\xE7o, nas costas e outros problemas associados \xE0 m\xE1 postura visual prolongada. [cf. A cabe\xE7a deve permanecer alinhada e os olhos devem estar confort\xE1veis na altura do monitor, o que evita dores no pesco\xE7o e nas costas, artrite no pesco\xE7o, enxaqueca ou dores de cabe\xE7a, entre outros problemas]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de suporte de monitor (fixo ou articulado) em qualquer mesa de escrit\xF3rio planejada.",
        condicoes_adicionais: "Teclado e mouse devem estar alinhados com os cotovelos do usu\xE1rio, complementando a regra de posicionamento do monitor \u2014 as tr\xEAs refer\xEAncias (monitor, teclado, mouse) devem ser tratadas como um conjunto ergon\xF4mico \xFAnico, n\xE3o isoladamente. [cf. Teclado e Mouse: precisam estar alinhados com os cotovelos]"
      },
      restricoes: {
        quando_nao_aplicar: "Uso ocasional de notebook sem monitor externo dedicado n\xE3o exige este n\xEDvel de especifica\xE7\xE3o de suporte, embora ainda se beneficie de suporte elevat\xF3rio (riser) para alinhar a tela \xE0 altura correta.",
        limitacoes: "Monitores fixos na mesa (sem suporte articulado) dificultam o ajuste fino de altura \u2014 depende inteiramente da altura da pr\xF3pria mesa e de acess\xF3rios complementares (base, riser)."
      },
      acoes_recomendadas: "Suporte de monitor articulado (integrado ao m\xF3vel ou complementar), que eleva a tela \xE0 altura ergon\xF4mica adequada e reduz tens\xE3o cervical, al\xE9m de liberar espa\xE7o de tampo. [cf. Modelos com suporte integrado para monitor elevam a tela \xE0 altura ergon\xF4mica adequada, reduzindo tens\xF5es no pesco\xE7o]",
      motivo_tecnico: "O monitor deve ficar posicionado abaixo do eixo visual horizontal do usu\xE1rio, a uma dist\xE2ncia m\xEDnima equivalente a um bra\xE7o estendido. [cf. Monitor: deve estar abaixo do eixo visual horizontal, h\xE1 uma dist\xE2ncia m\xEDnima de um bra\xE7o] A cabe\xE7a deve permanecer alinhada, com os olhos confort\xE1veis na altura do monitor, evitando dores no pesco\xE7o, nas costas e outros problemas associados \xE0 m\xE1 postura visual prolongada. [cf. A cabe\xE7a deve permanecer alinhada e os olhos devem estar confort\xE1veis na altura do monitor, o que evita dores no pesco\xE7o e nas costas, artrite no pesco\xE7o, enxaqueca ou dores de cabe\xE7a, entre outros problemas]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Escrimob (blog t\xE9cnico); Metsa.pt (guia de mesa de computador).",
      fabricante: "Refer\xEAncias de linha (Slikdesk, citado como fabricante de acess\xF3rios ergon\xF4micos \u2014 suportes de monitor, calhas de cabo).",
      observacoes: "Recomenda-se instalar o filtro/arco de monitor ou suporte articulado acima da mesa quando poss\xEDvel, especificamente para reduzir tens\xF5es na coluna cervical causadas por m\xE1 postura visual prolongada. [cf. Se poss\xEDvel, instale o filtro de arco do monitor acima da mesa para reduzir tens\xF5es na coluna cervical causadas por ru\xEDdos visuais] ---",
      tags: [
        "escritorios",
        "posicionamento",
        "monitor",
        "altura",
        "dist\xE2ncia",
        "rela\xE7\xE3o",
        "usu\xE1rio"
      ],
      modulo_origem: "08-Escritorios",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_08_compartimento_de_cpu_ventilacao_e_suporte_ventilacao_do_compartimento_de_cpu",
      entidade: "COMPARTIMENTO DE CPU \u2014 VENTILA\xC7\xC3O E SUPORTE",
      categoria: "Escritorios",
      subcategoria: "COMPARTIMENTO DE CPU \u2014 VENTILA\xC7\xC3O E SUPORTE",
      titulo: "Ventila\xE7\xE3o do compartimento de CPU",
      tipo: "boa_pratica",
      descricao: "O compartimento dedicado \xE0 CPU (torre do computador) deve prever ventila\xE7\xE3o adequada \u2014 solu\xE7\xF5es de mercado usam chapas perfuradas nas laterais e no fundo do compartimento, para evitar superaquecimento do equipamento durante uso intenso e prolongado. [cf. Compartimento para CPU com Ventila\xE7\xE3o. No lado direito, a mesa possui um compartimento exclusivo para acomodar a CPU, com chapas perfuradas nas laterais e no fundo, proporcionando ventila\xE7\xE3o ideal para equipamentos eletr\xF4nicos, garantindo que sua CPU se mantenha fresca durante horas de uso intenso]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer nicho ou gaveteiro com compartimento fechado dedicado a CPU de mesa (torre vertical ou horizontal).",
        condicoes_adicionais: "A mesma l\xF3gica de ventila\xE7\xE3o j\xE1 descrita no m\xF3dulo Cozinhas para geladeira (item 2.1 \u2014 folga de ventila\xE7\xE3o) e no m\xF3dulo Estrutura para empenamento por calor (item 4) se aplica aqui: espa\xE7o fechado sem ventila\xE7\xE3o favorece ac\xFAmulo de calor e, em ambientes muito \xFAmidos, tamb\xE9m de umidade."
      },
      restricoes: {
        quando_nao_aplicar: "Notebooks e mini-PCs (sem necessidade de compartimento fechado dedicado) n\xE3o exigem esta regra \u2014 a ventila\xE7\xE3o nesse caso \xE9 resolvida pelo pr\xF3prio equipamento sobre a mesa ou suporte aberto.",
        limitacoes: "Compartimentos de CPU totalmente fechados (sem perfura\xE7\xE3o) s\xE3o um erro recorrente de projeto que reduz a vida \xFAtil do equipamento por superaquecimento."
      },
      acoes_recomendadas: 'Suporte de CPU do tipo "pedestal" (aberto, sem compartimento fechado, geralmente com rod\xEDzios), que dispensa completamente a preocupa\xE7\xE3o com ventila\xE7\xE3o por n\xE3o confinar o equipamento. [cf. Suporte de CPU e Nobreak... Suporte para CPU e Estabilizador]',
      motivo_tecnico: "O compartimento dedicado \xE0 CPU (torre do computador) deve prever ventila\xE7\xE3o adequada \u2014 solu\xE7\xF5es de mercado usam chapas perfuradas nas laterais e no fundo do compartimento, para evitar superaquecimento do equipamento durante uso intenso e prolongado. [cf. Compartimento para CPU com Ventila\xE7\xE3o. No lado direito, a mesa possui um compartimento exclusivo para acomodar a CPU, com chapas perfuradas nas laterais e no fundo, proporcionando ventila\xE7\xE3o ideal para equipamentos eletr\xF4nicos, garantindo que sua CPU se mantenha fresca durante horas de uso intenso]",
      impacto: {
        estrutural: "baixo",
        financeiro: "baixo",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Loja do Caixote (ficha t\xE9cnica de produto); Shopping Escrit\xF3rio (linha de m\xF3veis corporativos com suporte de CPU/nobreak).",
      fabricante: "N/A (regra geral de ventila\xE7\xE3o de compartimento fechado).",
      observacoes: "Compartimentos que tamb\xE9m acomodam nobreak (equipamento que gera calor e \xE9 sens\xEDvel a superaquecimento) devem seguir a mesma l\xF3gica de ventila\xE7\xE3o, com aten\xE7\xE3o redobrada, j\xE1 que o nobreak frequentemente fica em uso cont\xEDnuo 24h. ---",
      tags: [
        "escritorios",
        "compartimento",
        "ventila\xE7\xE3o",
        "suporte"
      ],
      modulo_origem: "08-Escritorios",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_08_compartimento_de_cpu_ventilacao_e_suporte_suporte_de_cpu_tipo_pedestal_e_pass",
      entidade: "COMPARTIMENTO DE CPU \u2014 VENTILA\xC7\xC3O E SUPORTE",
      categoria: "Escritorios",
      subcategoria: "COMPARTIMENTO DE CPU \u2014 VENTILA\xC7\xC3O E SUPORTE",
      titulo: "Suporte de CPU tipo pedestal e passagem de fia\xE7\xE3o",
      tipo: "regra_obrigatoria",
      descricao: 'Suportes de CPU tipo "pedestal" (fixados sob o tampo, geralmente com rod\xEDzios ou trilho deslizante) permitem posicionar a torre do computador fora do piso e com folga de movimento para limpeza e manuten\xE7\xE3o, sendo comuns em linhas de m\xF3veis corporativos de escrit\xF3rio. [cf. Mesa Reta com gaveteiro de 4 gavetas estrutural tipo pedestal, suporte de CPU Pedestal e suporte para monitores com calha para embutir tomadas e cabeamentos el\xE9trico e rede]',
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de mesa corporativa ou home office de padr\xE3o m\xE9dio/alto, especialmente quando o piso precisa ficar livre para limpeza ou quando h\xE1 risco de umidade/poeira no n\xEDvel do piso.",
        condicoes_adicionais: "A calha de passagem de fia\xE7\xE3o deve ser prevista junto ao suporte de monitor e/ou ao gaveteiro, permitindo embutir tomadas e cabeamento el\xE9trico/rede na mesma estrutura da mesa. [cf. Suporte para monitores com calha para embutir tomadas e cabeamentos el\xE9trico e rede]"
      },
      restricoes: {
        quando_nao_aplicar: "Projetos residenciais mais simples podem prescindir do suporte tipo pedestal, usando apenas um nicho aberto (n\xE3o deslizante) sob a mesa \u2014 solu\xE7\xE3o mais barata, com perda de praticidade de manuten\xE7\xE3o.",
        limitacoes: "Suportes deslizantes/pedestal adicionam custo de ferragem ao projeto \u2014 vale o investimento principalmente em ambientes corporativos de uso intenso e manuten\xE7\xE3o frequente de equipamento."
      },
      acoes_recomendadas: "Nicho fixo aberto sem trilho, com dimens\xE3o generosa suficiente para acomodar CPU e servir tamb\xE9m como espa\xE7o para mochilas/bolsas em uso dom\xE9stico, conforme observado em produtos de mercado residencial. [cf. O m\xF3dulo com gaveteiro tem um nicho que pode servir tanto para colocar um CPU como para guardar mochilas e bolsas, al\xE9m de tr\xEAs gavetas]",
      motivo_tecnico: 'Suportes de CPU tipo "pedestal" (fixados sob o tampo, geralmente com rod\xEDzios ou trilho deslizante) permitem posicionar a torre do computador fora do piso e com folga de movimento para limpeza e manuten\xE7\xE3o, sendo comuns em linhas de m\xF3veis corporativos de escrit\xF3rio. [cf. Mesa Reta com gaveteiro de 4 gavetas estrutural tipo pedestal, suporte de CPU Pedestal e suporte para monitores com calha para embutir tomadas e cabeamentos el\xE9trico e rede]',
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Shopping Escrit\xF3rio (linha corporativa); Magazine Luiza (produto residencial).",
      fabricante: "N/A.",
      observacoes: "Suporte de monitor com calha embutida em produtos de linha corporativa segue especifica\xE7\xE3o t\xEDpica de profundidade 23 cm e altura 12 cm para a estrutura do tampo remov\xEDvel de suporte \u2014 refer\xEAncia \xFAtil para dimensionamento de nicho equivalente em projeto sob medida. [cf. Suporte para monitores com calha embutida, estrutura com tampo remov\xEDvel em MDP BP 18mm, na mesma largura do tampo, profundidade de 23cm e altura de 12cm] ---",
      tags: [
        "escritorios",
        "compartimento",
        "ventila\xE7\xE3o",
        "suporte",
        "tipo",
        "pedestal",
        "passagem",
        "fia\xE7\xE3o"
      ],
      modulo_origem: "08-Escritorios",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_08_gestao_de_cabos_e_infraestrutura_eletrica_estrategias_de_organizacao_de_cabos",
      entidade: "GEST\xC3O DE CABOS E INFRAESTRUTURA EL\xC9TRICA",
      categoria: "Escritorios",
      subcategoria: "GEST\xC3O DE CABOS E INFRAESTRUTURA EL\xC9TRICA",
      titulo: "Estrat\xE9gias de organiza\xE7\xE3o de cabos na mesa planejada",
      tipo: "recomendacao",
      descricao: "Uma gest\xE3o de cabos eficiente \xE9 essencial para manter a mesa funcional e visualmente organizada \u2014 as pr\xE1ticas recomendadas incluem uso de canaletas, bra\xE7adeiras reutiliz\xE1veis e organizadores de cabos para agrupar fios, posicionamento do carregador/fonte de alimenta\xE7\xE3o pr\xF3ximo \xE0 base da mesa (reduzindo o comprimento de cabo solto), e compartimentos ou perfis dedicados para esconder cabos atr\xE1s da estrutura. [cf. Use canaletas, bra\xE7adeiras reutiliz\xE1veis e organizadores de cabos para agrupar fios. Acomode o carregador e a fonte de alimenta\xE7\xE3o perto da base da mesa para reduzir o enrosco. Considere compartimentos ou perfis para esconder cabos atr\xE1s da estrutura]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer mesa de escrit\xF3rio/home office planejada, desde o in\xEDcio do projeto (n\xE3o como corre\xE7\xE3o posterior).",
        condicoes_adicionais: "Em ambientes corporativos, a calha interna de passagem de fia\xE7\xE3o costuma ser embutida na pr\xF3pria estrutura do m\xF3vel (arm\xE1rio/gaveteiro), com suporte adicional para tomadas de energia, dados de rede (RJ45) e telefonia, incluindo tampa basculante de acesso. [cf. Arm\xE1rio: Medindo... em MDP #18mm com acabamento em fita PVC 1 [mm] com calha interna em a\xE7o para passagem de fia\xE7\xE3o. Suporte para tomadas: com tampa basculante e fura\xE7\xF5es para tomadas de energia, dados RJ45 e telefonia]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa completa \u2014 mesmo mesas simples se beneficiam de ao menos uma canaleta b\xE1sica de passagem de cabo.",
        limitacoes: "Retrofitar gest\xE3o de cabos em uma mesa j\xE1 pronta (sem previs\xE3o de calha/canaleta) \xE9 significativamente mais trabalhoso do que prever desde o projeto \u2014 refor\xE7a a import\xE2ncia de tratar isso como decis\xE3o de especifica\xE7\xE3o inicial, n\xE3o acabamento posterior."
      },
      acoes_recomendadas: "Canaleta externa aplicada (n\xE3o embutida na estrutura), como alternativa mais barata em projetos que n\xE3o previram a infraestrutura desde o in\xEDcio.",
      motivo_tecnico: "Uma gest\xE3o de cabos eficiente \xE9 essencial para manter a mesa funcional e visualmente organizada \u2014 as pr\xE1ticas recomendadas incluem uso de canaletas, bra\xE7adeiras reutiliz\xE1veis e organizadores de cabos para agrupar fios, posicionamento do carregador/fonte de alimenta\xE7\xE3o pr\xF3ximo \xE0 base da mesa (reduzindo o comprimento de cabo solto), e compartimentos ou perfis dedicados para esconder cabos atr\xE1s da estrutura. [cf. Use canaletas, bra\xE7adeiras reutiliz\xE1veis e organizadores de cabos para agrupar fios. Acomode o carregador e a fonte de alimenta\xE7\xE3o perto da base da mesa para reduzir o enrosco. Considere compartimentos ou perfis para esconder cabos atr\xE1s da estrutura]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Metsa.pt (guia completo de mesa de computador); Lojas Globo (ficha t\xE9cnica de mesa corporativa).",
      fabricante: "N/A (regra geral de infraestrutura de m\xF3vel de escrit\xF3rio).",
      observacoes: "Este item se conecta ao m\xF3dulo Produ\xE7\xE3o (a ser detalhado) no que se refere \xE0 previs\xE3o de fura\xE7\xF5es e recortes para passagem de fia\xE7\xE3o no plano de corte \u2014 a infraestrutura el\xE9trica deve estar marcada na planta antes do plano de corte ser fechado, seguindo o mesmo princ\xEDpio j\xE1 estabelecido no m\xF3dulo Cozinhas para lava-lou\xE7as (item 7.2). ---",
      tags: [
        "escritorios",
        "gest\xE3o",
        "cabos",
        "infraestrutura",
        "el\xE9trica",
        "estrat\xE9gias",
        "organiza\xE7\xE3o",
        "mesa"
      ],
      modulo_origem: "08-Escritorios",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_08_gaveteiros_de_escritorio_estrutura_e_ferragem_especificacao_estrutural_de_gav",
      entidade: "GAVETEIROS DE ESCRIT\xD3RIO \u2014 ESTRUTURA E FERRAGEM",
      categoria: "Escritorios",
      subcategoria: "GAVETEIROS DE ESCRIT\xD3RIO \u2014 ESTRUTURA E FERRAGEM",
      titulo: "Especifica\xE7\xE3o estrutural de gaveteiro corporativo",
      tipo: "boa_pratica",
      descricao: "Gaveteiros estruturais de linha corporativa (fixados \xE0 mesa, n\xE3o volantes/com rod\xEDzio) costumam ser especificados com corredi\xE7as em a\xE7o de trilho telesc\xF3pico e esferas met\xE1licas, permitindo abertura total das gavetas, maior resist\xEAncia e durabilidade \u2014 alinhado \xE0 regra geral de corredi\xE7as j\xE1 descrita no m\xF3dulo Ferragens (item 3). [cf. Gaveteiro estrutural com 4 gavetas convencionais com corredi\xE7as em a\xE7o com trilho telesc\xF3pico e esferas met\xE1licas, permitindo a abertura total das gavetas, maior resist\xEAncia e durabilidade]",
      condicoes: {
        quando_aplicar: "Especifica\xE7\xE3o de qualquer gaveteiro fixo integrado \xE0 mesa de escrit\xF3rio planejada.",
        condicoes_adicionais: 'Puxadores do tipo "cava" (usinados diretamente na borda da gaveta, sem ferragem saliente) s\xE3o usados especificamente na borda inferior da primeira gaveta e nas bordas superiores das demais, para evitar acidentes com pontas de puxador em espa\xE7os de circula\xE7\xE3o apertados sob a mesa. [cf. Puxadores Tipo cava usinado diretamente na borda inferior da primeira gaveta e nas bordas superiores das demais gavetas, para evitar acidentes nas pontas dos puxadores]'
      },
      restricoes: {
        quando_nao_aplicar: "Gaveteiros volantes (com rod\xEDzios, n\xE3o fixados \xE0 estrutura da mesa) seguem l\xF3gica de mobilidade, priorizando a possibilidade de reposicionamento sobre a integra\xE7\xE3o estrutural fixa. [cf. Mobilidade: Rodas que permitem movimentar o gaveteiro com facilidade por todo o ambiente]",
        limitacoes: "Sistemas de fixa\xE7\xE3o por cavilhas, cantoneiras, parafusos e/ou minifix met\xE1lico (combina\xE7\xE3o de m\xFAltiplos dispositivos) s\xE3o citados como padr\xE3o de linha corporativa para garantir precis\xE3o e maior resist\xEAncia em montagens e desmontagens frequentes \u2014 alinhado ao m\xF3dulo Ferragens (item 5). [cf. Sistema de fixa\xE7\xE3o das estruturas por meio de cavilhas, cantoneiras, parafusos e/ou tambores minifix met\xE1licos, garantindo precis\xE3o e maior resist\xEAncia nas montagens e desmontagens]"
      },
      acoes_recomendadas: "Painel frontal de maior espessura (exemplo de linha corporativa: 42 mm, obtido pela combina\xE7\xE3o de dois pain\xE9is de 18 mm com painel intermedi\xE1rio de HDF 6 mm) para dar rigidez e design diferenciado ao m\xF3dulo, an\xE1logo \xE0 t\xE9cnica de engrosso j\xE1 descrita no m\xF3dulo Estrutura (item 5.1). [cf. Tampo e P\xE9s com espessura total de 42 mm, formados por 2 pain\xE9is em MDP e/ou MDF de espessura 18 mm, acoplados internamente por um painel em HDF 6 mm]",
      motivo_tecnico: "Gaveteiros estruturais de linha corporativa (fixados \xE0 mesa, n\xE3o volantes/com rod\xEDzio) costumam ser especificados com corredi\xE7as em a\xE7o de trilho telesc\xF3pico e esferas met\xE1licas, permitindo abertura total das gavetas, maior resist\xEAncia e durabilidade \u2014 alinhado \xE0 regra geral de corredi\xE7as j\xE1 descrita no m\xF3dulo Ferragens (item 3). [cf. Gaveteiro estrutural com 4 gavetas convencionais com corredi\xE7as em a\xE7o com trilho telesc\xF3pico e esferas met\xE1licas, permitindo a abertura total das gavetas, maior resist\xEAncia e durabilidade]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: 'Shopping Escrit\xF3rio (linha "Prime", ficha t\xE9cnica completa de mesa em L com gaveteiro estrutural).',
      fabricante: "N/A (linha gen\xE9rica de m\xF3veis corporativos, sem marca espec\xEDfica de fabricante de MDF/ferragem detalhada na fonte).",
      observacoes: 'Este item conecta diretamente tr\xEAs m\xF3dulos j\xE1 constru\xEDdos: Ferragens (corredi\xE7as e dispositivos de montagem), Estrutura (engrosso/espessura de tampo) e Portas e Gavetas (puxador "cava") \u2014 refor\xE7ando que o m\xF3dulo Escrit\xF3rios \xE9, em grande parte, uma aplica\xE7\xE3o combinada de regras j\xE1 estabelecidas em m\xF3dulos anteriores, adaptada ao contexto de uso corporativo intenso. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais**, **Closets**, **Banheiros** e **Escrit\xF3rios** (este documento). Sequ\xEAncia restante: 9. **Produ\xE7\xE3o** \u2014 plano de corte, otimiza\xE7\xE3o, etiquetas, sequ\xEAncia, usinagem, fura\xE7\xE3o, acabamento. 10. **Transporte** \u2014 peso, elevadores, portas, escadas, caminh\xF5es, divis\xE3o de pe\xE7as. 11. **Montagem** \u2014 sequ\xEAncia, ferramentas, tempo, n\xFAmero de montadores, espa\xE7o. 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando em sequ\xEAncia para o m\xF3dulo **Produ\xE7\xE3o**.',
      tags: [
        "escritorios",
        "gaveteiros",
        "escrit\xF3rio",
        "estrutura",
        "ferragem",
        "especifica\xE7\xE3o",
        "estrutural",
        "gaveteiro"
      ],
      modulo_origem: "08-Escritorios",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_plano_de_corte_e_nesting_otimizacao_de_aproveitamento_de_chapa_funcao_e_param",
      entidade: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      categoria: "Producao",
      subcategoria: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      titulo: "Fun\xE7\xE3o e par\xE2metros de entrada do plano de corte",
      tipo: "regra_obrigatoria",
      descricao: 'O plano de corte \xE9 o documento t\xE9cnico que detalha o melhor aproveitamento das chapas de MDF/MDP dispon\xEDveis, reduzindo desperd\xEDcio de material e otimizando o tempo de produ\xE7\xE3o. [cf. O plano de corte MDF \xE9 um documento t\xE9cnico essencial para a marcenaria, que detalha o melhor aproveitamento das chapas de MDF, reduzindo desperd\xEDcios e otimizando o tempo de produ\xE7\xE3o] O processo de "nesting" (denomina\xE7\xE3o t\xE9cnica do algoritmo de distribui\xE7\xE3o) considera par\xE2metros como dimens\xF5es das chapas dispon\xEDveis, medidas e formatos de cada pe\xE7a, espessura do corte da ferramenta (kerf), dire\xE7\xE3o de corte (quando o material exige), limites de rota\xE7\xE3o das pe\xE7as, e regras espec\xEDficas da m\xE1quina/processo produtivo. [cf. Dimens\xF5es das chapas dispon\xEDveis. Medidas e formatos das pe\xE7as. Espessura do corte da ferramenta. Dire\xE7\xE3o de corte, quando o material exige esse cuidado. Limites de rota\xE7\xE3o das pe\xE7as. Regras espec\xEDficas da m\xE1quina e do processo produtivo]',
      condicoes: {
        quando_aplicar: "Toda produ\xE7\xE3o de marcenaria planejada, antes de liberar qualquer corte f\xEDsico de chapa.",
        condicoes_adicionais: "O aproveitamento deve ser medido sobre a chapa inteira (a margem/refilo conta como sobra), porque \xE9 a chapa inteira que \xE9 efetivamente paga \u2014 uma pr\xE1tica de honestidade de c\xE1lculo citada por ferramentas especializadas do setor. [cf. O aproveitamento \xE9 medido sobre a chapa inteira (margem conta como sobra), porque \xE9 a chapa inteira que voc\xEA paga]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo produ\xE7\xF5es unit\xE1rias/artesanais se beneficiam de um plano de corte b\xE1sico, ainda que manual.",
        limitacoes: "Planos de corte mal dimensionados podem gerar pe\xE7as faltantes na produ\xE7\xE3o, exigindo corte emergencial de chapa adicional \u2014 erro caro tanto em tempo quanto em material. [cf. Planos mal dimensionados podem gerar pe\xE7as faltantes]"
      },
      acoes_recomendadas: "Algoritmos de nesting automatizado (MaxRects e variantes, com rota\xE7\xE3o de 90\xB0, multi-chapa) em vez de organiza\xE7\xE3o manual do layout \u2014 o software aplica algoritmos que simulam in\xFAmeras combina\xE7\xF5es de posicionamento em segundos, superando o potencial de economia do m\xE9todo manual em opera\xE7\xF5es mais complexas. [cf. No modelo tradicional, o programador organiza manualmente o layout das pe\xE7as, utilizando seu conhecimento e experi\xEAncia, j\xE1 em opera\xE7\xF5es mais complexas, esse m\xE9todo tende a limitar o potencial de economia. O software de nesting aplica algoritmos que simulam in\xFAmeras combina\xE7\xF5es de posicionamento em poucos segundos]",
      motivo_tecnico: 'O plano de corte \xE9 o documento t\xE9cnico que detalha o melhor aproveitamento das chapas de MDF/MDP dispon\xEDveis, reduzindo desperd\xEDcio de material e otimizando o tempo de produ\xE7\xE3o. [cf. O plano de corte MDF \xE9 um documento t\xE9cnico essencial para a marcenaria, que detalha o melhor aproveitamento das chapas de MDF, reduzindo desperd\xEDcios e otimizando o tempo de produ\xE7\xE3o] O processo de "nesting" (denomina\xE7\xE3o t\xE9cnica do algoritmo de distribui\xE7\xE3o) considera par\xE2metros como dimens\xF5es das chapas dispon\xEDveis, medidas e formatos de cada pe\xE7a, espessura do corte da ferramenta (kerf), dire\xE7\xE3o de corte (quando o material exige), limites de rota\xE7\xE3o das pe\xE7as, e regras espec\xEDficas da m\xE1quina/processo produtivo. [cf. Dimens\xF5es das chapas dispon\xEDveis. Medidas e formatos das pe\xE7as. Espessura do corte da ferramenta. Dire\xE7\xE3o de corte, quando o material exige esse cuidado. Limites de rota\xE7\xE3o das pe\xE7as. Regras espec\xEDficas da m\xE1quina e do processo produtivo]',
      impacto: {
        estrutural: "nenhum",
        financeiro: "cr\xEDtico",
        estetico: "m\xE9dio"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Guia da Marcenaria (blog t\xE9cnico); Elite Solda e Rob\xF3tica (blog especializado em CNC); Token Engenharia (ferramenta de nesting online).",
      fabricante: "N/A (categoria de processo/software, n\xE3o fabricante de material).",
      observacoes: "O conhecimento do profissional continua essencial mesmo com uso de algoritmos dedicados \u2014 o papel do software \xE9 potencializar a experi\xEAncia do time, n\xE3o substitu\xED-la. [cf. O conhecimento do profissional continua essencial, por\xE9m, o uso de algoritmos dedicados amplia a capacidade de an\xE1lise e padroniza resultados. O papel do software \xE9 potencializar a experi\xEAncia do time, e n\xE3o substitu\xED-la] ---",
      tags: [
        "producao",
        "plano",
        "corte",
        "nesting",
        "otimiza\xE7\xE3o",
        "aproveitamento",
        "chapa",
        "fun\xE7\xE3o"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_plano_de_corte_e_nesting_otimizacao_de_aproveitamento_de_chapa_indicadores_de",
      entidade: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      categoria: "Producao",
      subcategoria: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      titulo: "Indicadores de aproveitamento e retorno sobre investimento",
      tipo: "recomendacao",
      descricao: "Para avaliar o ganho de um software/processo de nesting, a pr\xE1tica recomendada \xE9 acompanhar o \xEDndice m\xE9dio de aproveitamento de chapa (exemplos de faixa citados: 75%, 80%, 85%) e comparar o consumo de chapas antes e depois da implanta\xE7\xE3o de um processo otimizado, traduzindo cada ponto percentual de ganho em quantidade de chapas que deixam de ser compradas. [cf. Comparar o consumo de chapas antes e depois da implanta\xE7\xE3o. Acompanhar o \xEDndice m\xE9dio de aproveitamento (por exemplo: 75%, 80%, 85%). Traduzir cada ponto percentual de ganho em quantidade de chapas que deixam de ser compradas]",
      condicoes: {
        quando_aplicar: "An\xE1lise de viabilidade de investimento em software de otimiza\xE7\xE3o de corte ou mudan\xE7a de processo produtivo.",
        condicoes_adicionais: "Um exemplo pr\xE1tico de c\xE1lculo (ferramenta gratuita de nesting) mostrou, para um lote de 30 pe\xE7as, necessidade de 2 chapas de 3.000\xD71.200 mm, com aproveitamento de 42,8% e sobra de 4,12 m\xB2 \u2014 ilustrando que aproveitamentos baixos (abaixo de 50%) s\xE3o plenamente poss\xEDveis em lotes pequenos ou com pe\xE7as de formato dif\xEDcil de encaixar. [cf. No lote-exemplo da p\xE1gina, 30 pe\xE7as pedem 2 chapas de 3000\xD71200 mm, com aproveitamento de 42,8% e sobra de 4,12 m\xB2]"
      },
      restricoes: {
        quando_nao_aplicar: "Produ\xE7\xF5es muito pequenas/espor\xE1dicas podem n\xE3o justificar o investimento em ferramentas avan\xE7adas \u2014 o c\xE1lculo de retorno deve considerar o volume de produ\xE7\xE3o real da marcenaria.",
        limitacoes: "O resultado do nesting orienta or\xE7amento e compra de material, mas o plano de produ\xE7\xE3o completo (contorno real da pe\xE7a, sequ\xEAncia de opera\xE7\xE3o da m\xE1quina, ordem de lamina\xE7\xE3o/aplica\xE7\xE3o de fita de borda) continua sendo uma etapa separada de engenharia de fabrica\xE7\xE3o \u2014 o nesting n\xE3o substitui o planejamento operacional completo. [cf. O resultado orienta or\xE7amento e compra de material; o plano de produ\xE7\xE3o (contorno real, sequ\xEAncia de tocha, lamina\xE7\xE3o) continua sendo etapa de engenharia de fabrica\xE7\xE3o]"
      },
      acoes_recomendadas: "Sistemas mais completos (ERP integrado com m\xF3dulo de nesting) para marcenarias de maior porte, versus ferramentas avulsas gratuitas/pagas para marcenarias menores ou de pedido individual.",
      motivo_tecnico: "Para avaliar o ganho de um software/processo de nesting, a pr\xE1tica recomendada \xE9 acompanhar o \xEDndice m\xE9dio de aproveitamento de chapa (exemplos de faixa citados: 75%, 80%, 85%) e comparar o consumo de chapas antes e depois da implanta\xE7\xE3o de um processo otimizado, traduzindo cada ponto percentual de ganho em quantidade de chapas que deixam de ser compradas. [cf. Comparar o consumo de chapas antes e depois da implanta\xE7\xE3o. Acompanhar o \xEDndice m\xE9dio de aproveitamento (por exemplo: 75%, 80%, 85%). Traduzir cada ponto percentual de ganho em quantidade de chapas que deixam de ser compradas]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "cr\xEDtico",
        estetico: "nenhum"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Elite Solda e Rob\xF3tica; Token Engenharia.",
      fabricante: "N/A.",
      observacoes: "Marcenarias que trabalham com pedido individual em lotes unit\xE1rios t\xEAm produtividade de nesting inerentemente diferente (e geralmente menor aproveitamento) do que f\xE1bricas que produzem em s\xE9rie com pe\xE7as repetidas \u2014 este \xE9 um fator de contexto importante para n\xE3o comparar aproveitamentos de forma descontextualizada. [cf. Sua produtividade \xE9 incompar\xE1vel dentro deste modelo de fabrica\xE7\xE3o, o lote m\xFAltiplo. N\xE3o se pode afirmar o mesmo para marcenarias que trabalham o pedido individual em lotes unit\xE1rios] ---",
      tags: [
        "producao",
        "plano",
        "corte",
        "nesting",
        "otimiza\xE7\xE3o",
        "aproveitamento",
        "chapa",
        "indicadores"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_plano_de_corte_e_nesting_otimizacao_de_aproveitamento_de_chapa_seccionadora_v",
      entidade: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      categoria: "Producao",
      subcategoria: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      titulo: "Seccionadora vs. CNC/nesting flex\xEDvel",
      tipo: "boa_pratica",
      descricao: 'A seccionadora trabalha com "altura de corte vari\xE1vel", permitindo processar simultaneamente diversas chapas empilhadas em um mesmo avan\xE7o de material \u2014 sua grande vantagem \xE9 a produtividade em lote m\xFAltiplo (pe\xE7as repetidas, produ\xE7\xE3o em s\xE9rie); j\xE1 centros CNC com nesting oferecem layout de corte mais flex\xEDvel, mais adequado a pe\xE7as de formato variado e produ\xE7\xE3o sob encomenda unit\xE1ria. [cf. O grande diferencial da seccionadora \xE9 que ela trabalha com uma "altura de corte vari\xE1vel", o que permite processar simultaneamente diversas chapas em um mesmo avan\xE7o do material... a grande caracter\xEDstica das seccionadoras \xE9 a quest\xE3o da produtividade do lote, ou seja, seguir um plano de corte que trate simultaneamente da gera\xE7\xE3o de pe\xE7as repetidas para produtos em s\xE9rie] [cf. O nesting tem um layout de corte mais flex\xEDvel]',
      condicoes: {
        quando_aplicar: "Decis\xE3o de investimento em equipamento de produ\xE7\xE3o \u2014 seccionadora para opera\xE7\xF5es de alto volume/s\xE9rie, CNC/nesting para opera\xE7\xF5es de projeto sob medida com grande variedade de pe\xE7as \xFAnicas.",
        condicoes_adicionais: "A escolha do equipamento deve ser cruzada com o perfil real de produ\xE7\xE3o da marcenaria (s\xE9rie vs. sob medida) antes de qualquer decis\xE3o de investimento."
      },
      restricoes: {
        quando_nao_aplicar: "Marcenarias de pequeno porte com baixo volume geral podem n\xE3o justificar nenhum dos dois investimentos de grande porte, mantendo processo manual ou semi-manual.",
        limitacoes: "Seccionadoras n\xE3o t\xEAm a mesma flexibilidade de formato/nesting de pe\xE7as variadas que uma CNC oferece \u2014 s\xE3o otimizadas para outro perfil de produ\xE7\xE3o."
      },
      acoes_recomendadas: "Combina\xE7\xE3o dos dois equipamentos na mesma planta industrial, cada um dedicado ao tipo de demanda que melhor atende (s\xE9rie na seccionadora, sob medida na CNC).",
      motivo_tecnico: 'A seccionadora trabalha com "altura de corte vari\xE1vel", permitindo processar simultaneamente diversas chapas empilhadas em um mesmo avan\xE7o de material \u2014 sua grande vantagem \xE9 a produtividade em lote m\xFAltiplo (pe\xE7as repetidas, produ\xE7\xE3o em s\xE9rie); j\xE1 centros CNC com nesting oferecem layout de corte mais flex\xEDvel, mais adequado a pe\xE7as de formato variado e produ\xE7\xE3o sob encomenda unit\xE1ria. [cf. O grande diferencial da seccionadora \xE9 que ela trabalha com uma "altura de corte vari\xE1vel", o que permite processar simultaneamente diversas chapas em um mesmo avan\xE7o do material... a grande caracter\xEDstica das seccionadoras \xE9 a quest\xE3o da produtividade do lote, ou seja, seguir um plano de corte que trate simultaneamente da gera\xE7\xE3o de pe\xE7as repetidas para produtos em s\xE9rie] [cf. O nesting tem um layout de corte mais flex\xEDvel]',
      impacto: {
        estrutural: "nenhum",
        financeiro: "cr\xEDtico",
        estetico: "nenhum"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: 'Claudio Perin Consultoria (blog especializado em marcenaria/ind\xFAstria moveleira, "Marcenaria 4.0").',
      fabricante: "N/A (categoria de equipamento, n\xE3o marca espec\xEDfica).",
      observacoes: 'Este item \xE9 mais relevante para o m\xF3dulo de "intelig\xEAncia de produ\xE7\xE3o" do Planne voltado a f\xE1bricas/marcenarias industriais do que para o projetista individual \u2014 mas \xE9 importante que o motor de regras reconhe\xE7a essa diferen\xE7a de contexto ao sugerir fluxos de trabalho. ---',
      tags: [
        "producao",
        "plano",
        "corte",
        "nesting",
        "otimiza\xE7\xE3o",
        "aproveitamento",
        "chapa",
        "seccionadora"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_sistema_32_padrao_de_furacao_sequencial_definicao_e_medidas_padrao_do_sistema",
      entidade: "SISTEMA 32 \u2014 PADR\xC3O DE FURA\xC7\xC3O SEQUENCIAL",
      categoria: "Producao",
      subcategoria: "SISTEMA 32 \u2014 PADR\xC3O DE FURA\xC7\xC3O SEQUENCIAL",
      titulo: "Defini\xE7\xE3o e medidas-padr\xE3o do Sistema 32",
      tipo: "regra_obrigatoria",
      descricao: "O Sistema 32 \xE9 uma t\xE9cnica de fura\xE7\xE3o amplamente difundida na Europa (no Brasil, praticada principalmente por grandes ind\xFAstrias, devido \xE0 necessidade de m\xE1quinas de fura\xE7\xE3o padronizadas), baseada em tr\xEAs medidas-padr\xE3o uniformes: (1) a dist\xE2ncia de um furo at\xE9 o outro \xE9 sempre 32 mm, tanto na horizontal quanto na vertical; (2) a fileira de furos nas laterais \xE9 posicionada a 37 mm da borda frontal do m\xF3vel; (3) as demais medidas de ferragem (dobradi\xE7as, corredi\xE7as) de diferentes fabricantes s\xE3o desenhadas para coincidir com essa grade de 32 mm. [cf. Sistema 32 \xE9 muito difundido em pa\xEDses da Europa, enquanto, no Brasil, apenas grandes ind\xFAstrias det\xEAm essa tecnologia, devido as m\xE1quinas de fura\xE7\xE3o serem padronizada m\xFAltiplas de 32 mm] [cf. 1\xBA A dist\xE2ncia de um furo at\xE9 outro furo \xE9 32 mm, tanto na horizontal como na vertical; 2\xBA A fileira de furos nas laterais \xE9 posicionada em 37 mm (na parte interior) da borda do m\xF3vel] [cf. Esta t\xE9cnica consiste na dist\xE2ncia de 32mm de um furo at\xE9 o outro, tanto na horizontal quanto na vertical, sendo amplamente recomendada para montagem de Dobradi\xE7as, Corredi\xE7as, Prateleiras, gavetas e todas as ferragens necess\xE1rias para a montagem de m\xF3veis]",
      condicoes: {
        quando_aplicar: "Todo projeto de fura\xE7\xE3o de lateral de m\xF3vel (para prateleiras ajust\xE1veis, dobradi\xE7as, corredi\xE7as), especialmente em produ\xE7\xE3o industrializada/seriada.",
        condicoes_adicionais: "A maior parte das ferragens de ind\xFAstria (dobradi\xE7as, corredi\xE7as de gaveta) j\xE1 \xE9 projetada e desenvolvida tendo em mente as medi\xE7\xF5es m\xE9tricas do Sistema 32 \u2014 ou seja, especificar ferragem compat\xEDvel com o sistema evita a necessidade de fura\xE7\xE3o customizada fora do padr\xE3o. [cf. A maior parte dos equipamentos da ind\xFAstria de m\xF3veis, tais como dobradi\xE7as, corredi\xE7as de gaveta, etc\u2026 j\xE1 s\xE3o projetados e desenvolvidos tendo em mente as medi\xE7\xF5es m\xE9tricas do Sistema 32]"
      },
      restricoes: {
        quando_nao_aplicar: "Marcenarias artesanais de pedido \xFAnico, sem m\xE1quina de fura\xE7\xE3o padronizada em m\xFAltiplos de 32 mm, podem n\xE3o conseguir aplicar o sistema com a mesma precis\xE3o \u2014 nesses casos, gabaritos espec\xEDficos (item 2.2) tornam-se ainda mais importantes.",
        limitacoes: 'Fabricantes de puxador, por exemplo, frequentemente usam dist\xE2ncias entre furos "quebradas" (96 mm, 128 mm, 160 mm etc.), que n\xE3o seguem exatamente a l\xF3gica do Sistema 32 \u2014 nem toda ferragia do m\xF3vel est\xE1 sob essa mesma grade padronizada. [cf. Voc\xEA j\xE1 percebeu quanto um puxador al\xE7a tem medidas t\xE3o estranhas? A dist\xE2ncia entre furos possui 128mm? 256mm? Por que n\xE3o fizeram medidas padr\xF5es e redondas]'
      },
      acoes_recomendadas: "Fura\xE7\xE3o customizada ponto a ponto (sem seguir grade padronizada) para projetos muito espec\xEDficos ou ferragens fora do padr\xE3o de mercado \u2014 solu\xE7\xE3o mais lenta e sujeita a mais erro humano.",
      motivo_tecnico: "O Sistema 32 \xE9 uma t\xE9cnica de fura\xE7\xE3o amplamente difundida na Europa (no Brasil, praticada principalmente por grandes ind\xFAstrias, devido \xE0 necessidade de m\xE1quinas de fura\xE7\xE3o padronizadas), baseada em tr\xEAs medidas-padr\xE3o uniformes: (1) a dist\xE2ncia de um furo at\xE9 o outro \xE9 sempre 32 mm, tanto na horizontal quanto na vertical; (2) a fileira de furos nas laterais \xE9 posicionada a 37 mm da borda frontal do m\xF3vel; (3) as demais medidas de ferragem (dobradi\xE7as, corredi\xE7as) de diferentes fabricantes s\xE3o desenhadas para coincidir com essa grade de 32 mm. [cf. Sistema 32 \xE9 muito difundido em pa\xEDses da Europa, enquanto, no Brasil, apenas grandes ind\xFAstrias det\xEAm essa tecnologia, devido as m\xE1quinas de fura\xE7\xE3o serem padronizada m\xFAltiplas de 32 mm] [cf. 1\xBA A dist\xE2ncia de um furo at\xE9 outro furo \xE9 32 mm, tanto na horizontal como na vertical; 2\xBA A fileira de furos nas laterais \xE9 posicionada em 37 mm (na parte interior) da borda do m\xF3vel] [cf. Esta t\xE9cnica consiste na dist\xE2ncia de 32mm de um furo at\xE9 o outro, tanto na horizontal quanto na vertical, sendo amplamente recomendada para montagem de Dobradi\xE7as, Corredi\xE7as, Prateleiras, gavetas e todas as ferragens necess\xE1rias para a montagem de m\xF3veis]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Blog t\xE9cnico do SENAI (Prof. Riverson Tobias do Vale, instrutor de marcenaria, SENAI S\xE3o Jos\xE9 dos Pinhais); Blog da Marcenaria (Marceneiro Expresso).",
      fabricante: "N/A (padr\xE3o de ind\xFAstria, n\xE3o espec\xEDfico de um fabricante \u2014 por\xE9m referenciado por praticamente todos os fabricantes de ferragem consultados nos m\xF3dulos anteriores).",
      observacoes: "Este \xE9 um dos itens mais estrat\xE9gicos de toda a base para o Planne: se o motor de regras adotar o Sistema 32 como grade nativa de fura\xE7\xE3o, toda a compatibilidade entre diferentes fabricantes de ferragem (Blum, H\xE4fele, Hettich \u2014 ver m\xF3dulo Ferragens) fica naturalmente resolvida, j\xE1 que todos operam sobre a mesma refer\xEAncia m\xE9trica internacional. ---",
      tags: [
        "producao",
        "sistema",
        "padr\xE3o",
        "fura\xE7\xE3o",
        "sequencial",
        "defini\xE7\xE3o",
        "medidas"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_sistema_32_padrao_de_furacao_sequencial_gabaritos_de_furacao_e_desafios_de_al",
      entidade: "SISTEMA 32 \u2014 PADR\xC3O DE FURA\xC7\xC3O SEQUENCIAL",
      categoria: "Producao",
      subcategoria: "SISTEMA 32 \u2014 PADR\xC3O DE FURA\xC7\xC3O SEQUENCIAL",
      titulo: "Gabaritos de fura\xE7\xE3o e desafios de alinhamento",
      tipo: "boa_pratica",
      descricao: "Gabaritos de fura\xE7\xE3o (shelf-pin jigs, gabaritos de cavilha) s\xE3o ferramentas f\xEDsicas que garantem o alinhamento correto dos furos de acordo com a grade do Sistema 32 ou com a posi\xE7\xE3o de dispositivos de montagem (minifix, cavilha) \u2014 mesmo pequenos desalinhamentos (poucos mil\xEDmetros) entre furos comprometem o encaixe final da pe\xE7a. [cf. Um mil\xEDmetro que seja, de desalinhamento entre os furos, j\xE1 acaba comprometendo o encaixe]",
      condicoes: {
        quando_aplicar: "Toda opera\xE7\xE3o de fura\xE7\xE3o manual (sem CNC/seccionadora automatizada), especialmente para cavilhas e dispositivos de montagem tipo Girofix/minifix.",
        condicoes_adicionais: 'Gabaritos de qualidade superior (com sistema de travas) reduzem o problema de "firmeza"/deslizamento do gabarito durante a fura\xE7\xE3o manual, evitando o desalinhamento citado como o maior desafio da t\xE9cnica. [cf. Por possuir travas, evita o problema da "firmeza" mencionado]'
      },
      restricoes: {
        quando_nao_aplicar: "Fura\xE7\xE3o automatizada por CNC (com programa digital de posicionamento) dispensa gabarito f\xEDsico, j\xE1 que a m\xE1quina executa a fura\xE7\xE3o com precis\xE3o programada.",
        limitacoes: 'Trabalhar com cavilha manualmente \xE9 considerado por marceneiros experientes uma tarefa "chatinha" (trabalhosa e sujeita a erro), sendo mais eficiente na ind\xFAstria, onde a fura\xE7\xE3o \xE9 feita em m\xE1quinas programadas. [cf. \xC9 muito eficiente na ind\xFAstria, onde a fura\xE7\xE3o \xE9 feita em m\xE1quinas. Fazer em casa, na m\xE3o, \xE9 dif\xEDcil]'
      },
      acoes_recomendadas: "Investimento em CNC com programa de fura\xE7\xE3o digital para marcenarias que produzem em volume suficiente para justificar o custo do equipamento, eliminando a depend\xEAncia de gabaritos manuais.",
      motivo_tecnico: "Gabaritos de fura\xE7\xE3o (shelf-pin jigs, gabaritos de cavilha) s\xE3o ferramentas f\xEDsicas que garantem o alinhamento correto dos furos de acordo com a grade do Sistema 32 ou com a posi\xE7\xE3o de dispositivos de montagem (minifix, cavilha) \u2014 mesmo pequenos desalinhamentos (poucos mil\xEDmetros) entre furos comprometem o encaixe final da pe\xE7a. [cf. Um mil\xEDmetro que seja, de desalinhamento entre os furos, j\xE1 acaba comprometendo o encaixe]",
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Marceneiros & Bricoleiros (f\xF3rum t\xE9cnico brasileiro); Zinni Gabaritos (fabricante de gabaritos, manual t\xE9cnico).",
      fabricante: "Zinni Gabaritos (linha de gabaritos para minifix, VB/Rafix, cavilhas, dobradi\xE7as caneco, suportes de prateleira).",
      observacoes: 'A profundidade de fura\xE7\xE3o para o "canal" do parafuso do sistema minifix \xE9 recomendada em 12 mm, segundo manual t\xE9cnico de fabricante de gabaritos \u2014 par\xE2metro \xFAtil de refer\xEAncia para valida\xE7\xE3o autom\xE1tica no motor de regras do Planne. [cf. Recomendamos 12mm profundidade... gabarito Cavilha para realizar a fura\xE7\xE3o do "canal" do parafuso do minifix (du)] ---',
      tags: [
        "producao",
        "sistema",
        "padr\xE3o",
        "fura\xE7\xE3o",
        "sequencial",
        "gabaritos",
        "desafios",
        "alinhamento"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_sequencia_de_usinagem_furo_rasgo_corte_ordem_de_operacoes_na_usinagem_cnc",
      entidade: "SEQU\xCANCIA DE USINAGEM (FURO \u2192 RASGO \u2192 CORTE)",
      categoria: "Producao",
      subcategoria: "SEQU\xCANCIA DE USINAGEM (FURO \u2192 RASGO \u2192 CORTE)",
      titulo: "Ordem de opera\xE7\xF5es na usinagem CNC",
      tipo: "boa_pratica",
      descricao: 'Softwares de plano de corte/nesting permitem configurar a sequ\xEAncia em que a m\xE1quina CNC executa as diferentes opera\xE7\xF5es sobre cada pe\xE7a \u2014 por exemplo, a ordem "FUROS \u2192 RASGO \u2192 CORTE" \xE9 citada como configura\xE7\xE3o poss\xEDvel, definindo que furos e rasgos (canais para dispositivos de montagem, cabos, etc.) sejam usinados antes do corte final de contorno da pe\xE7a. [cf. Escolha em qual sequ\xEAncia o nesting vai executar as opera\xE7\xF5es. Por exemplo: FUROS - RASGO - CORTE]',
      condicoes: {
        quando_aplicar: "Configura\xE7\xE3o de qualquer fluxo de produ\xE7\xE3o industrializado em CNC/seccionadora com m\xFAltiplas opera\xE7\xF5es por pe\xE7a.",
        condicoes_adicionais: "A defini\xE7\xE3o da origem da posi\xE7\xE3o dos eixos iniciais das fresas, o sentido de carregamento da chapa na m\xE1quina, e a configura\xE7\xE3o de refer\xEAncias de brocas para troca r\xE1pida s\xE3o par\xE2metros complementares que devem ser configurados junto com a sequ\xEAncia de opera\xE7\xF5es. [cf. Defina a origem da posi\xE7\xE3o dos eixos iniciais das fresas para executar as opera\xE7\xF5es... Determina o sentido do carregando da chapa na m\xE1quina para receber as opera\xE7\xF5es... Permite configurar refer\xEAncias de brocas para troca r\xE1pida]"
      },
      restricoes: {
        quando_nao_aplicar: "Produ\xE7\xE3o manual/artesanal sem m\xE1quina CNC segue l\xF3gica de sequ\xEAncia pr\xF3pria, geralmente definida pelo marceneiro conforme a ferramenta dispon\xEDvel (furadeira, tupia, serra), n\xE3o por configura\xE7\xE3o de software.",
        limitacoes: "A sequ\xEAncia incorreta de opera\xE7\xF5es pode comprometer a estabilidade da pe\xE7a durante a usinagem (por exemplo, cortar o contorno final antes de furar pode deixar a pe\xE7a sem apoio firme para as opera\xE7\xF5es subsequentes)."
      },
      acoes_recomendadas: "Sequ\xEAncia alternativa (corte parcial \u2192 furos \u2192 corte final) para pe\xE7as muito pequenas ou fr\xE1geis, quando a estabilidade durante a usinagem \xE9 uma preocupa\xE7\xE3o maior que a velocidade do processo.",
      motivo_tecnico: 'Softwares de plano de corte/nesting permitem configurar a sequ\xEAncia em que a m\xE1quina CNC executa as diferentes opera\xE7\xF5es sobre cada pe\xE7a \u2014 por exemplo, a ordem "FUROS \u2192 RASGO \u2192 CORTE" \xE9 citada como configura\xE7\xE3o poss\xEDvel, definindo que furos e rasgos (canais para dispositivos de montagem, cabos, etc.) sejam usinados antes do corte final de contorno da pe\xE7a. [cf. Escolha em qual sequ\xEAncia o nesting vai executar as opera\xE7\xF5es. Por exemplo: FUROS - RASGO - CORTE]',
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "DinaBox (documenta\xE7\xE3o de software de plano de corte com nesting).",
      fabricante: "N/A (configura\xE7\xE3o de software, aplic\xE1vel a diferentes marcas de CNC).",
      observacoes: "Este item deve ser tratado como par\xE2metro avan\xE7ado/t\xE9cnico no motor de regras do Planne \u2014 de maior relev\xE2ncia para marcenarias industrializadas com CNC pr\xF3pria do que para o projetista que apenas especifica o m\xF3vel. ---",
      tags: [
        "producao",
        "sequ\xEAncia",
        "usinagem",
        "furo",
        "rasgo",
        "corte",
        "ordem",
        "opera\xE7\xF5es"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_09_etiquetagem_e_rastreabilidade_de_pecas_funcao_das_etiquetas_de_identificacao_",
      entidade: "ETIQUETAGEM E RASTREABILIDADE DE PE\xC7AS",
      categoria: "Producao",
      subcategoria: "ETIQUETAGEM E RASTREABILIDADE DE PE\xC7AS",
      titulo: "Fun\xE7\xE3o das etiquetas de identifica\xE7\xE3o na produ\xE7\xE3o",
      tipo: "boa_pratica",
      descricao: "Etiquetas impressas (em impressoras especiais ou comuns) para identificar e rastrear pe\xE7as produzidas s\xE3o citadas como funcionalidade padr\xE3o de softwares de plano de corte, auxiliando diretamente as etapas de produ\xE7\xE3o e montagem \u2014 cada pe\xE7a cortada recebe uma identifica\xE7\xE3o que a associa ao projeto/m\xF3dulo/posi\xE7\xE3o final no m\xF3vel. [cf. Imprima etiquetas em impressoras especiais ou comuns para identificar e rastrear as pe\xE7as produzidas, auxiliando na produ\xE7\xE3o e montagem]",
      condicoes: {
        quando_aplicar: "Toda produ\xE7\xE3o com m\xFAltiplas pe\xE7as por projeto e/ou m\xFAltiplos projetos simult\xE2neos na mesma marcenaria \u2014 praticamente universal a partir de um volume m\xEDnimo de produ\xE7\xE3o.",
        condicoes_adicionais: "A gera\xE7\xE3o de etiquetas deve estar integrada ao pr\xF3prio plano de corte/nesting, para que a identifica\xE7\xE3o j\xE1 saia associada \xE0 posi\xE7\xE3o de corte de cada pe\xE7a na chapa, evitando etapa manual adicional de correspond\xEAncia. [cf. V\xE1rias op\xE7\xF5es de configura\xE7\xE3o para impress\xE3o de planos de cortes, com diversos m\xE9todos de otimiza\xE7\xE3o para melhor aproveitamento e f\xE1cil gera\xE7\xE3o de etiquetas de identifica\xE7\xE3o]"
      },
      restricoes: {
        quando_nao_aplicar: "Produ\xE7\xE3o unit\xE1ria muito simples (poucas pe\xE7as, um \xFAnico m\xF3dulo) pode dispensar etiquetagem formal, usando identifica\xE7\xE3o manual (marca\xE7\xE3o a l\xE1pis) sem grande risco de erro.",
        limitacoes: "Etiquetagem manual (sem integra\xE7\xE3o ao software de plano de corte) \xE9 mais sujeita a erro humano de transcri\xE7\xE3o/correspond\xEAncia entre pe\xE7a f\xEDsica e posi\xE7\xE3o de projeto."
      },
      acoes_recomendadas: "C\xF3digos de barra ou QR code na etiqueta, para leitura automatizada em etapas posteriores (separa\xE7\xE3o, embalagem, confer\xEAncia antes do transporte \u2014 ver m\xF3dulo Transporte, a ser detalhado).",
      motivo_tecnico: "Etiquetas impressas (em impressoras especiais ou comuns) para identificar e rastrear pe\xE7as produzidas s\xE3o citadas como funcionalidade padr\xE3o de softwares de plano de corte, auxiliando diretamente as etapas de produ\xE7\xE3o e montagem \u2014 cada pe\xE7a cortada recebe uma identifica\xE7\xE3o que a associa ao projeto/m\xF3dulo/posi\xE7\xE3o final no m\xF3vel. [cf. Imprima etiquetas em impressoras especiais ou comuns para identificar e rastrear as pe\xE7as produzidas, auxiliando na produ\xE7\xE3o e montagem]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "m\xE9dio",
        estetico: "nenhum"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Otimize Nesting (ficha de funcionalidades de software); DinaBox (documenta\xE7\xE3o de software).",
      fabricante: "N/A (funcionalidade padr\xE3o de diversos softwares do setor: Otimize Nesting, DinaBox, MaxCut, Cutlist Optimizer, entre outros citados nas fontes consultadas).",
      observacoes: 'Este item se conecta diretamente ao m\xF3dulo "Montagem" (a ser detalhado) \u2014 a etiquetagem correta na produ\xE7\xE3o \xE9 o que viabiliza uma sequ\xEAncia de montagem eficiente em obra, especialmente em projetos com muitos m\xF3dulos e pe\xE7as semelhantes entre si. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais**, **Closets**, **Banheiros**, **Escrit\xF3rios** e **Produ\xE7\xE3o** (este documento). Sequ\xEAncia restante: 10. **Transporte** \u2014 peso, elevadores, portas, escadas, caminh\xF5es, divis\xE3o de pe\xE7as. 11. **Montagem** \u2014 sequ\xEAncia, ferramentas, tempo, n\xFAmero de montadores, espa\xE7o. 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando em sequ\xEAncia para o m\xF3dulo **Transporte**.',
      tags: [
        "producao",
        "etiquetagem",
        "rastreabilidade",
        "pe\xE7as",
        "fun\xE7\xE3o",
        "etiquetas",
        "identifica\xE7\xE3o",
        "produ\xE7\xE3o"
      ],
      modulo_origem: "09-Producao",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_dimensoes_padrao_de_elevador_predial_e_porta_de_acesso_medidas_de_referencia_",
      entidade: "DIMENS\xD5ES-PADR\xC3O DE ELEVADOR PREDIAL E PORTA DE ACESSO",
      categoria: "Transporte",
      subcategoria: "DIMENS\xD5ES-PADR\xC3O DE ELEVADOR PREDIAL E PORTA DE ACESSO",
      titulo: "Medidas de refer\xEAncia de elevador convencional (pr\xE9dio) e residencial",
      tipo: "regra_obrigatoria",
      descricao: "Existem duas categorias distintas de elevador a considerar no planejamento de transporte de m\xF3veis: o elevador convencional de pr\xE9dio, com cabine de refer\xEAncia de 1,10 \xD7 1,40 m e porta a partir de 0,80 \xD7 2,00 m; [cf. O elevador convencional para um edif\xEDcio tem a medida da cabine de 1,10 x 1,40 m e a dimens\xE3o interna da caixa de corrida \xE9 de 1,80 x 1,80 m. As portas de um elevador predial tem a partir de 0,80 x 2,00 m] e o elevador residencial (unifamiliar, menor porte), com cabine padr\xE3o de cerca de 0,90 \xD7 1,20 m e porta de 0,80 \xD7 2,00 m. [cf. A medida da cabine de um elevador residencial padr\xE3o \xE9 de 0,90 x 1,20 m... As portas do elevador t\xEAm 0,80 x 2,00 m]",
      condicoes: {
        quando_aplicar: "Toda entrega de m\xF3veis planejados em edif\xEDcios (residenciais ou comerciais), antes de fechar o corte final das pe\xE7as maiores (tampos, portas de correr grandes, torres inteiri\xE7as).",
        condicoes_adicionais: "Elevadores residenciais menores/mais compactos podem chegar a cabines de apenas 0,90 \xD7 0,90 m (para 1\u20132 pessoas) ou at\xE9 1,10 \xD7 1,10 m em instala\xE7\xF5es muito compactas, dependendo do fabricante \u2014 sempre confirmar a medida real do elevador espec\xEDfico do edif\xEDcio de destino, nunca assumir por padr\xE3o de categoria. [cf. A medida m\xEDnima que alguns fornecedores ainda conseguem atender \xE9 de 1,10 x 1,10 m] [cf. Numa cabine de 0,90 x 0,90 metros cabem uma ou duas pessoas de forma confort\xE1vel]"
      },
      restricoes: {
        quando_nao_aplicar: "Entregas em resid\xEAncias t\xE9rreas ou com acesso direto por porta/garagem no n\xEDvel da rua n\xE3o precisam considerar limite de elevador, apenas de porta/v\xE3o de acesso (item 1.2).",
        limitacoes: "A largura da porta do elevador \xE9 frequentemente o fator mais restritivo (n\xE3o a \xE1rea da cabine) \u2014 uma pe\xE7a pode caber em \xE1rea, mas n\xE3o passar pela abertura da porta se a diagonal/maior dimens\xE3o da pe\xE7a exceder a largura de porta dispon\xEDvel."
      },
      acoes_recomendadas: "Uso de escada (com divis\xE3o de pe\xE7as, ver item 3) ou i\xE7amento externo (item 2) quando a pe\xE7a excede as dimens\xF5es do elevador dispon\xEDvel no pr\xE9dio.",
      motivo_tecnico: "Existem duas categorias distintas de elevador a considerar no planejamento de transporte de m\xF3veis: o elevador convencional de pr\xE9dio, com cabine de refer\xEAncia de 1,10 \xD7 1,40 m e porta a partir de 0,80 \xD7 2,00 m; [cf. O elevador convencional para um edif\xEDcio tem a medida da cabine de 1,10 x 1,40 m e a dimens\xE3o interna da caixa de corrida \xE9 de 1,80 x 1,80 m. As portas de um elevador predial tem a partir de 0,80 x 2,00 m] e o elevador residencial (unifamiliar, menor porte), com cabine padr\xE3o de cerca de 0,90 \xD7 1,20 m e porta de 0,80 \xD7 2,00 m. [cf. A medida da cabine de um elevador residencial padr\xE3o \xE9 de 0,90 x 1,20 m... As portas do elevador t\xEAm 0,80 x 2,00 m]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "baixo"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "MeuElevador.com (m\xFAltiplos artigos t\xE9cnicos); Vida Acess\xEDvel; RJB Home; Elevadores de Escadas.",
      fabricante: "N/A (medidas de refer\xEAncia de mercado \u2014 sempre variam por fabricante espec\xEDfico do elevador instalado).",
      observacoes: "Esta \xE9 uma das regras mais valiosas para o motor de intelig\xEAncia do Planne: o sistema deveria solicitar (ou permitir input) da medida real do elevador do pr\xE9dio de destino antes de liberar o plano de corte de qualquer pe\xE7a acima de determinado tamanho, cruzando automaticamente com a decis\xE3o de dividir a pe\xE7a (m\xF3dulo Estrutura/Pain\xE9is) quando necess\xE1rio. ---",
      tags: [
        "transporte",
        "dimens\xF5es",
        "padr\xE3o",
        "elevador",
        "predial",
        "porta",
        "acesso",
        "medidas"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_dimensoes_padrao_de_elevador_predial_e_porta_de_acesso_porta_de_acesso_e_vao_",
      entidade: "DIMENS\xD5ES-PADR\xC3O DE ELEVADOR PREDIAL E PORTA DE ACESSO",
      categoria: "Transporte",
      subcategoria: "DIMENS\xD5ES-PADR\xC3O DE ELEVADOR PREDIAL E PORTA DE ACESSO",
      titulo: "Porta de acesso e v\xE3o de passagem",
      tipo: "regra_obrigatoria",
      descricao: "Al\xE9m do elevador, a porta de entrada do apartamento/casa (e portas internas no caminho at\xE9 o c\xF4modo de instala\xE7\xE3o) \xE9 um segundo ponto de restri\xE7\xE3o dimensional \u2014 mesmo elevadores maiores de pr\xE9dios comerciais/panor\xE2micos t\xEAm abertura de porta na faixa de 0,90 m, [cf. Um elevador panor\xE2mico com capacidade de 1000kg, possui dimens\xF5es de 1,1m x 2,1m com abertura de portas de 0,9m] valor pr\xF3ximo ao de portas internas residenciais padr\xE3o.",
      condicoes: {
        quando_aplicar: "Levantamento de rota de transporte completa (n\xE3o apenas o elevador) antes de definir o tamanho m\xE1ximo de qualquer pe\xE7a \u2014 do caminh\xE3o at\xE9 o c\xF4modo final de instala\xE7\xE3o, passando por todas as portas intermedi\xE1rias.",
        condicoes_adicionais: 'O caminho relevante para o dimensionamento inclui: porta de entrada do pr\xE9dio/casa, elevador (se houver), corredores e curvas de acesso, e porta do c\xF4modo de destino \u2014 o "elo mais fraco" (menor v\xE3o) do caminho inteiro \xE9 que define o limite real de tamanho de pe\xE7a, n\xE3o apenas o elemento mais \xF3bvio (elevador).'
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo em transporte por escada (sem elevador), o v\xE3o de porta continua sendo restri\xE7\xE3o relevante.",
        limitacoes: "Corredores estreitos com curvas fechadas podem impedir a passagem de uma pe\xE7a mesmo que ela caiba em largura absoluta \u2014 a manobrabilidade real (n\xE3o apenas a medida linear) deve ser avaliada, idealmente com visita t\xE9cnica pr\xE9via ao local."
      },
      acoes_recomendadas: "I\xE7amento (item 2) quando a rota interna de elevador/escada/porta \xE9 fisicamente invi\xE1vel para a pe\xE7a na dimens\xE3o desejada pelo projeto.",
      motivo_tecnico: "Al\xE9m do elevador, a porta de entrada do apartamento/casa (e portas internas no caminho at\xE9 o c\xF4modo de instala\xE7\xE3o) \xE9 um segundo ponto de restri\xE7\xE3o dimensional \u2014 mesmo elevadores maiores de pr\xE9dios comerciais/panor\xE2micos t\xEAm abertura de porta na faixa de 0,90 m, [cf. Um elevador panor\xE2mico com capacidade de 1000kg, possui dimens\xF5es de 1,1m x 2,1m com abertura de portas de 0,9m] valor pr\xF3ximo ao de portas internas residenciais padr\xE3o.",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "MeuElevador.com; Bruno Moraes Arquitetura (blog especializado em obra/transporte de materiais).",
      fabricante: "N/A.",
      observacoes: 'Esta regra refor\xE7a a import\xE2ncia de uma "visita t\xE9cnica de viabilidade de transporte" como etapa formal do processo comercial de marcenaria planejada \u2014 visita que deveria alimentar diretamente as restri\xE7\xF5es dimensionais no motor de regras do Planne antes mesmo do in\xEDcio do detalhamento do projeto. ---',
      tags: [
        "transporte",
        "dimens\xF5es",
        "padr\xE3o",
        "elevador",
        "predial",
        "porta",
        "acesso",
        "passagem"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_icamento_vs_desmontagem_criterio_de_decisao_quando_optar_por_icamento_externo",
      entidade: "I\xC7AMENTO VS. DESMONTAGEM \u2014 CRIT\xC9RIO DE DECIS\xC3O",
      categoria: "Transporte",
      subcategoria: "I\xC7AMENTO VS. DESMONTAGEM \u2014 CRIT\xC9RIO DE DECIS\xC3O",
      titulo: "Quando optar por i\xE7amento externo",
      tipo: "regra_obrigatoria",
      descricao: "Diante de um material de grandes propor\xE7\xF5es que n\xE3o cabe pela rota interna (elevador/escada/porta), duas alternativas principais se apresentam: i\xE7amento (eleva\xE7\xE3o vertical externa por cabos de a\xE7o ou cordas) ou desmontagem/divis\xE3o do produto em partes menores, para transporte pela rota interna convencional. [cf. Entre os caminhos poss\xEDveis est\xE3o o i\xE7amento (que consiste em uma eleva\xE7\xE3o vertical geralmente feita por meio de cabos de a\xE7o ou cordas) ou, se poss\xEDvel, a desmontagem e divis\xE3o do produto em v\xE1rias partes, para que seja carregado atrav\xE9s das escadas ou elevadores]",
      condicoes: {
        quando_aplicar: "Pe\xE7as/tampos de grande dimens\xE3o que, por decis\xE3o est\xE9tica ou estrutural do projeto, n\xE3o podem ou n\xE3o devem ser divididos (ex.: tampo de pedra de bancada sem emenda).",
        condicoes_adicionais: "A decis\xE3o de dividir ou n\xE3o uma pe\xE7a (como um tampo de bancada de pedra) \xE9, em \xFAltima inst\xE2ncia, uma quest\xE3o de projeto \u2014 a pe\xE7a \xFAnica sem emenda frequentemente propicia uma est\xE9tica mais bonita, mas isso deve ser ponderado contra a viabilidade pr\xE1tica de transporte. [cf. Com rela\xE7\xE3o \xE0s bancadas de pedras, em algumas condi\xE7\xF5es tamb\xE9m \xE9 poss\xEDvel dividir o tampo da cozinha, eliminando a demanda do manuseio pelo lado externo. Por\xE9m, essa decis\xE3o depender\xE1 muito de uma quest\xE3o t\xE9cnica de projeto, pois a pe\xE7a \xFAnica, sem emenda, por vezes propicia uma est\xE9tica muito mais bonita]"
      },
      restricoes: {
        quando_nao_aplicar: "Quando a divis\xE3o da pe\xE7a \xE9 tecnicamente vi\xE1vel e n\xE3o compromete significativamente a est\xE9tica/estrutura final, a desmontagem \xE9 prefer\xEDvel ao i\xE7amento por ter custo mais baixo. [cf. Para quem prefere evitar o i\xE7amento, em raz\xE3o do custo mais alto, h\xE1 algumas alternativas para facilitar o trabalho de transporte]",
        limitacoes: "I\xE7amento tem custo significativamente mais alto que o transporte convencional (equipamento especializado, m\xE3o de obra t\xE9cnica, muitas vezes autoriza\xE7\xE3o condominial/municipal para uso de via p\xFAblica)."
      },
      acoes_recomendadas: "Priorizar, j\xE1 na fase de projeto, pe\xE7as desmont\xE1veis ou modulares quando h\xE1 sinal de que o transporte pela rota interna ser\xE1 um desafio \u2014 decis\xE3o que deveria ser antecipada, n\xE3o descoberta apenas no dia da entrega. [cf. Para quem ainda se encontra na etapa de escolher os m\xF3veis de casa, eu indico a aquisi\xE7\xE3o de sof\xE1s modulares ou pe\xE7as desmont\xE1veis, que s\xE3o mais simples de carregar pelo elevador ou escada]",
      motivo_tecnico: "Diante de um material de grandes propor\xE7\xF5es que n\xE3o cabe pela rota interna (elevador/escada/porta), duas alternativas principais se apresentam: i\xE7amento (eleva\xE7\xE3o vertical externa por cabos de a\xE7o ou cordas) ou desmontagem/divis\xE3o do produto em partes menores, para transporte pela rota interna convencional. [cf. Entre os caminhos poss\xEDveis est\xE3o o i\xE7amento (que consiste em uma eleva\xE7\xE3o vertical geralmente feita por meio de cabos de a\xE7o ou cordas) ou, se poss\xEDvel, a desmontagem e divis\xE3o do produto em v\xE1rias partes, para que seja carregado atrav\xE9s das escadas ou elevadores]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "cr\xEDtico",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Bruno Moraes Arquitetura (blog especializado, com exemplo real de caso de projeto).",
      fabricante: "N/A.",
      observacoes: "O motor de regras do Planne deveria sinalizar automaticamente, ainda na fase de projeto, quando uma pe\xE7a especificada excede as dimens\xF5es prov\xE1veis de transporte da rota informada pelo cliente \u2014 permitindo decidir entre i\xE7amento, divis\xE3o ou redesenho da pe\xE7a antes da produ\xE7\xE3o, n\xE3o apenas no momento da entrega. ---",
      tags: [
        "transporte",
        "i\xE7amento",
        "desmontagem",
        "crit\xE9rio",
        "decis\xE3o",
        "optar",
        "externo"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_icamento_vs_desmontagem_criterio_de_decisao_equipamentos_de_apoio_para_transp",
      entidade: "I\xC7AMENTO VS. DESMONTAGEM \u2014 CRIT\xC9RIO DE DECIS\xC3O",
      categoria: "Transporte",
      subcategoria: "I\xC7AMENTO VS. DESMONTAGEM \u2014 CRIT\xC9RIO DE DECIS\xC3O",
      titulo: "Equipamentos de apoio para transporte e eleva\xE7\xE3o de pe\xE7as",
      tipo: "boa_pratica",
      descricao: "Existem equipamentos especializados para o transporte e eleva\xE7\xE3o de m\xF3veis planejados em obra \u2014 carrinhos transportadores com sistema de eleva\xE7\xE3o permitem que um \xFAnico montador instale pe\xE7as elevadas (arm\xE1rios altos, torres) sem a necessidade de um ajudante para erguer e segurar, com exemplos de mercado citando capacidade de eleva\xE7\xE3o de at\xE9 1,90 m de altura, peso de pe\xE7a elevada de at\xE9 80 kg, e capacidade de transporte de carga de at\xE9 120 kg. [cf. Eleva at\xE9 1.90 metros com peso de at\xE9 80 Kg e transporta cargas de at\xE9 120 Kg]",
      condicoes: {
        quando_aplicar: "Instala\xE7\xE3o de qualquer m\xF3dulo elevado (arm\xE1rio a\xE9reo, torre alta) em obra, especialmente quando a equipe de montagem \xE9 reduzida (um \xFAnico montador).",
        condicoes_adicionais: "O uso desse tipo de equipamento reduz a necessidade de um ajudante extra especificamente para a etapa de erguer/segurar pe\xE7as pesadas durante a instala\xE7\xE3o, com impacto direto na composi\xE7\xE3o da equipe de montagem (ver m\xF3dulo Montagem, a ser detalhado). [cf. Com o Up Cargo a instala\xE7\xE3o de m\xF3veis elevados poder\xE3o ser realizadas facilmente com apenas 1 montador, dispensando um ajudante para erguer e segurar]"
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3dulos leves e de f\xE1cil manuseio manual (at\xE9 20\u201330 kg, por dois montadores) n\xE3o exigem necessariamente equipamento de eleva\xE7\xE3o especializado.",
        limitacoes: "Equipamentos de eleva\xE7\xE3o t\xEAm limite de peso e altura pr\xF3prios (no exemplo citado, 80 kg de pe\xE7a elevada e 1,90 m de altura) \u2014 pe\xE7as fora dessa faixa ainda exigem m\xE9todo convencional com equipe completa."
      },
      acoes_recomendadas: "Equipe de montagem tradicional (2+ pessoas) sem equipamento de eleva\xE7\xE3o especializado, para pe\xE7as fora da faixa de capacidade do equipamento ou em obras onde o investimento no equipamento n\xE3o se justifica pelo volume de trabalho.",
      motivo_tecnico: "Existem equipamentos especializados para o transporte e eleva\xE7\xE3o de m\xF3veis planejados em obra \u2014 carrinhos transportadores com sistema de eleva\xE7\xE3o permitem que um \xFAnico montador instale pe\xE7as elevadas (arm\xE1rios altos, torres) sem a necessidade de um ajudante para erguer e segurar, com exemplos de mercado citando capacidade de eleva\xE7\xE3o de at\xE9 1,90 m de altura, peso de pe\xE7a elevada de at\xE9 80 kg, e capacidade de transporte de carga de at\xE9 120 kg. [cf. Eleva at\xE9 1.90 metros com peso de at\xE9 80 Kg e transporta cargas de at\xE9 120 Kg]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "m\xE9dio",
        estetico: "baixo"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "UpCargo (fabricante de equipamento especializado para marcenaria); Gas\xF4metro Madeiras (revenda com ficha t\xE9cnica).",
      fabricante: "UpCargo.",
      observacoes: "Este item se conecta diretamente ao m\xF3dulo Montagem (a ser detalhado) \u2014 a disponibilidade ou n\xE3o de equipamento de eleva\xE7\xE3o afeta diretamente o dimensionamento da equipe m\xEDnima necess\xE1ria para uma instala\xE7\xE3o espec\xEDfica. ---",
      tags: [
        "transporte",
        "i\xE7amento",
        "desmontagem",
        "crit\xE9rio",
        "decis\xE3o",
        "equipamentos",
        "apoio",
        "eleva\xE7\xE3o"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_divisao_de_pecas_grandes_para_transporte_priorizacao_de_desmontagem_antes_do_",
      entidade: "DIVIS\xC3O DE PE\xC7AS GRANDES PARA TRANSPORTE",
      categoria: "Transporte",
      subcategoria: "DIVIS\xC3O DE PE\xC7AS GRANDES PARA TRANSPORTE",
      titulo: "Prioriza\xE7\xE3o de desmontagem antes do transporte",
      tipo: "recomendacao",
      descricao: "Sempre que poss\xEDvel, recomenda-se desmontar m\xF3veis e dividir pe\xE7as maiores antes do transporte, especialmente em objetos de vidro ou outros materiais delicados \u2014 essa pr\xE1tica oferece prote\xE7\xE3o adicional contra danos durante o manuseio e reduz o risco de avarias maiores. [cf. Sempre que poss\xEDvel, desmonte os m\xF3veis e pe\xE7as maiores para realizar o transporte, especialmente, nos casos de objetos de vidros e aqueles que s\xE3o mais delicados para carregar. Isso ajuda a oferecer uma prote\xE7\xE3o maior]",
      condicoes: {
        quando_aplicar: "Transporte de qualquer m\xF3vel planejado em fase de entrega \u2014 seja para instala\xE7\xE3o inicial, seja para eventual retirada/mudan\xE7a futura do cliente.",
        condicoes_adicionais: "Se n\xE3o for poss\xEDvel desmontar completamente, ao menos retirar prateleiras e gavetas antes do transporte, reduzindo peso e risco de dano interno por movimenta\xE7\xE3o de conte\xFAdo solto. [cf. Caso n\xE3o seja poss\xEDvel desmontar, retire prateleiras e gavetas]"
      },
      restricoes: {
        quando_nao_aplicar: "Pe\xE7as estruturalmente indivis\xEDveis por decis\xE3o de projeto (ver item 2.1) seguem a l\xF3gica de i\xE7amento em vez de divis\xE3o.",
        limitacoes: "Pe\xE7as previamente montadas na f\xE1brica/oficina sem previs\xE3o de desmontagem para transporte exigem trabalho adicional e risco de dano na hora de desmontar \u2014 refor\xE7a a import\xE2ncia de considerar o transporte j\xE1 na etapa de projeto/produ\xE7\xE3o, n\xE3o apenas na entrega."
      },
      acoes_recomendadas: "Produ\xE7\xE3o j\xE1 modular, com pe\xE7as pensadas para montagem final apenas no destino (nunca remontadas na f\xE1brica antes do transporte) \u2014 abordagem preventiva mais eficiente que desmontar algo j\xE1 pronto.",
      motivo_tecnico: "Sempre que poss\xEDvel, recomenda-se desmontar m\xF3veis e dividir pe\xE7as maiores antes do transporte, especialmente em objetos de vidro ou outros materiais delicados \u2014 essa pr\xE1tica oferece prote\xE7\xE3o adicional contra danos durante o manuseio e reduz o risco de avarias maiores. [cf. Sempre que poss\xEDvel, desmonte os m\xF3veis e pe\xE7as maiores para realizar o transporte, especialmente, nos casos de objetos de vidros e aqueles que s\xE3o mais delicados para carregar. Isso ajuda a oferecer uma prote\xE7\xE3o maior]",
      impacto: {
        estrutural: "m\xE9dio",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "BSoft (blog institucional com dicas de transporte de m\xF3veis).",
      fabricante: "N/A.",
      observacoes: "Parafusos e pe\xE7as pequenas retiradas na desmontagem devem ser guardados em sacos pl\xE1sticos identificados, para n\xE3o se perderem antes da remontagem no destino \u2014 boa pr\xE1tica simples mas frequentemente negligenciada. [cf. N\xE3o se esque\xE7a de guardar os parafusos e pe\xE7as menores em sacos pl\xE1sticos com identifica\xE7\xE3o e, dessa forma, n\xE3o os perder na hora de realizar a montagem] ---",
      tags: [
        "transporte",
        "divis\xE3o",
        "pe\xE7as",
        "grandes",
        "prioriza\xE7\xE3o",
        "desmontagem",
        "antes"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_divisao_de_pecas_grandes_para_transporte_reducao_de_manipulacao_como_principi",
      entidade: "DIVIS\xC3O DE PE\xC7AS GRANDES PARA TRANSPORTE",
      categoria: "Transporte",
      subcategoria: "DIVIS\xC3O DE PE\xC7AS GRANDES PARA TRANSPORTE",
      titulo: "Redu\xE7\xE3o de manipula\xE7\xE3o como princ\xEDpio de custo",
      tipo: "alerta",
      descricao: "Cada vez que uma pe\xE7a precisa ser i\xE7ada, deslocada e armazenada em uma opera\xE7\xE3o repetida, isso consome tempo de pessoal e recursos de equipamento \u2014 a redu\xE7\xE3o de custos de produ\xE7\xE3o e transporte est\xE1 diretamente ligada \xE0 redu\xE7\xE3o da quantidade de manipula\xE7\xF5es que cada pe\xE7a sofre entre a produ\xE7\xE3o e a instala\xE7\xE3o final. [cf. Constantemente a pe\xE7a \xE9 i\xE7ada, deslocada e armazenada em repetidas opera\xE7\xF5es. Isto requer tempo de pessoal e equipamentos, que demandam recursos financeiros. Para a redu\xE7\xE3o dos custos de produ\xE7\xE3o, quanto menos manipula\xE7\xE3o houver, melhor]",
      condicoes: {
        quando_aplicar: "Planejamento log\xEDstico de qualquer entrega de marcenaria planejada, especialmente projetos com m\xFAltiplos m\xF3dulos/pe\xE7as.",
        condicoes_adicionais: "Tamb\xE9m no canteiro de obras, enquanto uma equipe est\xE1 ocupada descarregando um caminh\xE3o, n\xE3o h\xE1 montagem simult\xE2nea de pe\xE7as na estrutura \u2014 essa atividade inevit\xE1vel de descarga deve ser prevista no or\xE7amento e no cronograma, n\xE3o tratada como imprevisto. [cf. Tamb\xE9m no canteiro de obras \xE9 assim: enquanto se mobiliza uma equipe para a descarga de uma carreta, n\xE3o haver\xE1 montagem de pe\xE7as na estrutura. Esta atividade inevit\xE1vel, deve ser prevista nos or\xE7amentos]"
      },
      restricoes: {
        quando_nao_aplicar: 'N\xE3o h\xE1 dispensa \u2014 o princ\xEDpio de "menos manipula\xE7\xE3o, menor custo e menor risco de dano" \xE9 universal em log\xEDstica de m\xF3veis.',
        limitacoes: "O maior risco evit\xE1vel nesse processo \xE9 o retrabalho \u2014 uma pe\xE7a montada no local errado, ou horas perdidas procurando uma pe\xE7a espec\xEDfica em uma pilha desorganizada de pe\xE7as semelhantes, geralmente causado por falta de planejamento de transporte/etiquetagem (ver m\xF3dulo Produ\xE7\xE3o, item 4). [cf. O que se deve evitar \xE9 o retrabalho, que durante a montagem pode ser uma pe\xE7a montada em local errado, mas tamb\xE9m pode significar horas perdidas em busca de uma determinada pe\xE7a em uma pilha ca\xF3tica de outras semelhantes. Esta desorganiza\xE7\xE3o pode ser causada pela falta de planejamento de transporte]"
      },
      acoes_recomendadas: "Sequenciamento de carregamento do caminh\xE3o na ordem inversa de uso na montagem (\xFAltima pe\xE7a carregada = primeira pe\xE7a usada), reduzindo a necessidade de reorganizar a carga no canteiro/obra.",
      motivo_tecnico: "Cada vez que uma pe\xE7a precisa ser i\xE7ada, deslocada e armazenada em uma opera\xE7\xE3o repetida, isso consome tempo de pessoal e recursos de equipamento \u2014 a redu\xE7\xE3o de custos de produ\xE7\xE3o e transporte est\xE1 diretamente ligada \xE0 redu\xE7\xE3o da quantidade de manipula\xE7\xF5es que cada pe\xE7a sofre entre a produ\xE7\xE3o e a instala\xE7\xE3o final. [cf. Constantemente a pe\xE7a \xE9 i\xE7ada, deslocada e armazenada em repetidas opera\xE7\xF5es. Isto requer tempo de pessoal e equipamentos, que demandam recursos financeiros. Para a redu\xE7\xE3o dos custos de produ\xE7\xE3o, quanto menos manipula\xE7\xE3o houver, melhor]",
      impacto: {
        estrutural: "baixo",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Manual t\xE9cnico de Transporte e Montagem (MK Estruturas Met\xE1licas) \u2014 embora a fonte original trate de estruturas met\xE1licas de grande porte, o princ\xEDpio de redu\xE7\xE3o de manipula\xE7\xE3o \xE9 diretamente aplic\xE1vel \xE0 log\xEDstica de marcenaria planejada.",
      fabricante: "N/A.",
      observacoes: "Este item se conecta diretamente ao m\xF3dulo Produ\xE7\xE3o (item 4 \u2014 etiquetagem) e ao m\xF3dulo Montagem (a ser detalhado) \u2014 a integra\xE7\xE3o entre etiquetagem correta na produ\xE7\xE3o, sequ\xEAncia de carregamento do transporte e sequ\xEAncia de montagem em obra \xE9 o que realmente reduz o retrabalho citado como o maior risco evit\xE1vel do processo. ---",
      tags: [
        "transporte",
        "divis\xE3o",
        "pe\xE7as",
        "grandes",
        "redu\xE7\xE3o",
        "manipula\xE7\xE3o",
        "princ\xEDpio",
        "custo"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_10_acondicionamento_e_organizacao_de_carga_distribuicao_de_peso_e_organizacao_po",
      entidade: "ACONDICIONAMENTO E ORGANIZA\xC7\xC3O DE CARGA",
      categoria: "Transporte",
      subcategoria: "ACONDICIONAMENTO E ORGANIZA\xC7\xC3O DE CARGA",
      titulo: "Distribui\xE7\xE3o de peso e organiza\xE7\xE3o por fragilidade",
      tipo: "recomendacao",
      descricao: "Na organiza\xE7\xE3o de carga para transporte, a pr\xE1tica recomendada \xE9 posicionar os itens mais pesados na parte de baixo e os mais leves na parte de cima, otimizando a estabilidade da carga e reduzindo risco de dano por esmagamento. [cf. A melhor forma de fazer essa atividade \xE9 colocar os itens mais pesados na parte de baixo das embalagens e os mais leves na parte de cima]",
      condicoes: {
        quando_aplicar: "Toda organiza\xE7\xE3o de carga de transporte de m\xF3veis planejados, incluindo acess\xF3rios e ferragens soltas transportadas junto com as pe\xE7as principais.",
        condicoes_adicionais: "Pe\xE7as e materiais fr\xE1geis devem ser embalados separadamente, minimizando riscos de contato direto com outras pe\xE7as durante o transporte. [cf. Elas devem ser embaladas de forma separada, minimizando os riscos]"
      },
      restricoes: {
        quando_nao_aplicar: "Pe\xE7as \xFAnicas de grande porte (sem empilhamento poss\xEDvel) seguem l\xF3gica diferente de fixa\xE7\xE3o/amarra\xE7\xE3o no ve\xEDculo, n\xE3o de organiza\xE7\xE3o por peso/fragilidade em camadas.",
        limitacoes: "Transporte sem a devida seguran\xE7a pode provocar desde danos menores (arranh\xF5es) at\xE9 avarias maiores (quebra) \u2014 o n\xEDvel de cuidado no acondicionamento deve ser proporcional \xE0 fragilidade e ao valor da pe\xE7a espec\xEDfica. [cf. Transportar m\xF3veis sem a devida seguran\xE7a pode provocar desde danos menores, por exemplo, arranh\xF5es, at\xE9 avarias maiores, como quebra]"
      },
      acoes_recomendadas: "Uso de material de embalagem espec\xEDfico (pl\xE1stico bolha, mantas, cantoneiras de prote\xE7\xE3o) conforme a fragilidade, tamanho e forma de acondicionamento de cada pe\xE7a.",
      motivo_tecnico: "Na organiza\xE7\xE3o de carga para transporte, a pr\xE1tica recomendada \xE9 posicionar os itens mais pesados na parte de baixo e os mais leves na parte de cima, otimizando a estabilidade da carga e reduzindo risco de dano por esmagamento. [cf. A melhor forma de fazer essa atividade \xE9 colocar os itens mais pesados na parte de baixo das embalagens e os mais leves na parte de cima]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "BSoft (blog institucional com dicas pr\xE1ticas de transporte).",
      fabricante: "N/A.",
      observacoes: "Este item, embora tratado na fonte original no contexto de mudan\xE7a residencial geral, aplica-se diretamente \xE0 log\xEDstica de entrega de marcenaria planejada \u2014 especialmente relevante para acess\xF3rios, ferragens soltas e pe\xE7as de vidro/espelho transportadas junto com a marcenaria principal. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais**, **Closets**, **Banheiros**, **Escrit\xF3rios**, **Produ\xE7\xE3o** e **Transporte** (este documento). Sequ\xEAncia restante: 11. **Montagem** \u2014 sequ\xEAncia, ferramentas, tempo, n\xFAmero de montadores, espa\xE7o. 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando em sequ\xEAncia para o m\xF3dulo **Montagem**.",
      tags: [
        "transporte",
        "acondicionamento",
        "organiza\xE7\xE3o",
        "carga",
        "distribui\xE7\xE3o",
        "peso",
        "fragilidade"
      ],
      modulo_origem: "10-Transporte",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_sequencia_completa_de_montagem_em_obra_fase_de_planejamento_e_inspecao_previa",
      entidade: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      categoria: "Montagem",
      subcategoria: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      titulo: "Fase de planejamento e inspe\xE7\xE3o pr\xE9via",
      tipo: "regra_obrigatoria",
      descricao: "Antes mesmo de abrir as caixas de pe\xE7as, a etapa de planejamento \xE9 crucial para evitar erros e otimizar o tempo de instala\xE7\xE3o: inspe\xE7\xE3o do ambiente (verifica\xE7\xE3o de medidas finais e condi\xE7\xF5es de piso/parede \u2014 nivelamento, esquadro \u2014 identificando ajustes necess\xE1rios na pe\xE7a), marca\xE7\xE3o precisa dos pontos de fixa\xE7\xE3o (respeitando localiza\xE7\xE3o de fia\xE7\xE3o el\xE9trica e tubula\xE7\xF5es), e organiza\xE7\xE3o/prote\xE7\xE3o do ambiente (isolamento, prote\xE7\xE3o do piso com lonas, organiza\xE7\xE3o das caixas para facilitar identifica\xE7\xE3o de m\xF3dulos e pe\xE7as). [cf. Inspe\xE7\xE3o do Ambiente: O montador verifica as medidas finais e as condi\xE7\xF5es do piso e das paredes (nivelamento, esquadro), identificando poss\xEDveis ajustes que ser\xE3o necess\xE1rios na pe\xE7a. Marca\xE7\xE3o de Pontos: Marca\xE7\xE3o precisa dos pontos de fixa\xE7\xE3o, principalmente para arm\xE1rios a\xE9reos e pain\xE9is, respeitando a localiza\xE7\xE3o de fia\xE7\xE3o el\xE9trica e tubula\xE7\xF5es, quando aplic\xE1vel. Organiza\xE7\xE3o e Prote\xE7\xE3o: O ambiente \xE9 isolado, e o piso \xE9 protegido com lonas ou cobertores. As caixas s\xE3o organizadas para facilitar a identifica\xE7\xE3o dos m\xF3dulos e pe\xE7as]",
      condicoes: {
        quando_aplicar: "Toda instala\xE7\xE3o de marcenaria planejada, independentemente do tamanho do projeto.",
        condicoes_adicionais: "A inspe\xE7\xE3o deve confirmar que as medidas finais em obra ainda correspondem \xE0s medidas de projeto originais \u2014 diverg\xEAncias (parede fora de esquadro, piso desnivelado) descobertas nesta etapa s\xE3o muito mais baratas de corrigir do que as descobertas apenas na fixa\xE7\xE3o final."
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa desta etapa \u2014 mesmo projetos pequenos se beneficiam de inspe\xE7\xE3o pr\xE9via m\xEDnima antes de iniciar a montagem f\xEDsica.",
        limitacoes: "Pular esta etapa (indo direto para a montagem) \xE9 a causa mais comum de erros de instala\xE7\xE3o em ambientes com pequenas diverg\xEAncias entre projeto e execu\xE7\xE3o civil."
      },
      acoes_recomendadas: "Visita t\xE9cnica formal antecipada (antes mesmo da produ\xE7\xE3o das pe\xE7as) para reduzir ainda mais o risco de diverg\xEAncia entre projeto e obra real \u2014 pr\xE1tica recomendada especialmente para projetos de maior complexidade.",
      motivo_tecnico: "Antes mesmo de abrir as caixas de pe\xE7as, a etapa de planejamento \xE9 crucial para evitar erros e otimizar o tempo de instala\xE7\xE3o: inspe\xE7\xE3o do ambiente (verifica\xE7\xE3o de medidas finais e condi\xE7\xF5es de piso/parede \u2014 nivelamento, esquadro \u2014 identificando ajustes necess\xE1rios na pe\xE7a), marca\xE7\xE3o precisa dos pontos de fixa\xE7\xE3o (respeitando localiza\xE7\xE3o de fia\xE7\xE3o el\xE9trica e tubula\xE7\xF5es), e organiza\xE7\xE3o/prote\xE7\xE3o do ambiente (isolamento, prote\xE7\xE3o do piso com lonas, organiza\xE7\xE3o das caixas para facilitar identifica\xE7\xE3o de m\xF3dulos e pe\xE7as). [cf. Inspe\xE7\xE3o do Ambiente: O montador verifica as medidas finais e as condi\xE7\xF5es do piso e das paredes (nivelamento, esquadro), identificando poss\xEDveis ajustes que ser\xE3o necess\xE1rios na pe\xE7a. Marca\xE7\xE3o de Pontos: Marca\xE7\xE3o precisa dos pontos de fixa\xE7\xE3o, principalmente para arm\xE1rios a\xE9reos e pain\xE9is, respeitando a localiza\xE7\xE3o de fia\xE7\xE3o el\xE9trica e tubula\xE7\xF5es, quando aplic\xE1vel. Organiza\xE7\xE3o e Prote\xE7\xE3o: O ambiente \xE9 isolado, e o piso \xE9 protegido com lonas ou cobertores. As caixas s\xE3o organizadas para facilitar a identifica\xE7\xE3o dos m\xF3dulos e pe\xE7as]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "MP Montagem de M\xF3veis (guia completo de processo de instala\xE7\xE3o).",
      fabricante: "N/A.",
      observacoes: 'Esta etapa se conecta diretamente ao m\xF3dulo Transporte (item 3.2) no que se refere \xE0 organiza\xE7\xE3o da carga descarregada \u2014 a etiquetagem correta do m\xF3dulo Produ\xE7\xE3o (item 4) \xE9 o que viabiliza a "organiza\xE7\xE3o das caixas para facilitar a identifica\xE7\xE3o" citada nesta etapa. ---',
      tags: [
        "montagem",
        "sequ\xEAncia",
        "completa",
        "obra",
        "fase",
        "planejamento",
        "inspe\xE7\xE3o",
        "pr\xE9via"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_sequencia_completa_de_montagem_em_obra_montagem_da_caixa_estrutura_interna_de",
      entidade: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      categoria: "Montagem",
      subcategoria: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      titulo: "Montagem da caixa/estrutura interna de cada m\xF3dulo",
      tipo: "regra_obrigatoria",
      descricao: 'A montagem propriamente dita come\xE7a pela estrutura interna de cada m\xF3dulo (a "caixa" de sustenta\xE7\xE3o do m\xF3vel) \u2014 laterais, fundos e prateleiras internas s\xE3o unidos, garantindo que o esquadro de cada m\xF3dulo esteja perfeito antes de qualquer etapa subsequente. [cf. A montagem come\xE7a pela estrutura interna de cada m\xF3dulo, que \xE9 a base de sustenta\xE7\xE3o do m\xF3vel: Montagem da Caixa: As laterais, fundos e prateleiras internas s\xE3o unidos, garantindo que o esquadro de cada m\xF3dulo esteja perfeito]',
      condicoes: {
        quando_aplicar: "Todo processo de montagem de m\xF3vel modulado ou planejado, sempre como primeira etapa f\xEDsica (ap\xF3s o planejamento/inspe\xE7\xE3o do item 1.1).",
        condicoes_adicionais: "Esta etapa deve seguir rigorosamente a regra j\xE1 estabelecida no m\xF3dulo Estrutura (item 3.2) \u2014 montar sobre superf\xEDcie plana e forrada, com verifica\xE7\xE3o de esquadro por ferramenta apropriada, antes de fixar definitivamente o fundo."
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 esta \xE9 a etapa fundacional que determina se as etapas seguintes (portas, gavetas, puxadores) ter\xE3o uma base correta para se apoiar.",
        limitacoes: "Erro de esquadro nesta etapa se propaga para todas as etapas seguintes (portas desalinhadas, gavetas emperradas) \u2014 \xE9 o ponto de maior efeito cascata de toda a sequ\xEAncia de montagem."
      },
      acoes_recomendadas: "Uso de gabaritos de nivelamento e esquadro espec\xEDficos para acelerar e tornar mais confi\xE1vel esta etapa em produ\xE7\xF5es de maior volume.",
      motivo_tecnico: 'A montagem propriamente dita come\xE7a pela estrutura interna de cada m\xF3dulo (a "caixa" de sustenta\xE7\xE3o do m\xF3vel) \u2014 laterais, fundos e prateleiras internas s\xE3o unidos, garantindo que o esquadro de cada m\xF3dulo esteja perfeito antes de qualquer etapa subsequente. [cf. A montagem come\xE7a pela estrutura interna de cada m\xF3dulo, que \xE9 a base de sustenta\xE7\xE3o do m\xF3vel: Montagem da Caixa: As laterais, fundos e prateleiras internas s\xE3o unidos, garantindo que o esquadro de cada m\xF3dulo esteja perfeito]',
      impacto: {
        estrutural: "cr\xEDtico",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "MP Montagem de M\xF3veis; conex\xE3o direta com m\xF3dulo Estrutura (item 3.2) e m\xF3dulo Portas e Gavetas (item 6.2) j\xE1 constru\xEDdos.",
      fabricante: "N/A.",
      observacoes: "Ferramentas de medida de \xE2ngulo tornam esta tarefa mais f\xE1cil e confi\xE1vel \u2014 recomenda-se sempre a checagem de esquadro em pelo menos dois pontos do m\xF3dulo (n\xE3o apenas um canto), especialmente em m\xF3dulos maiores. [cf. As ferramentas de medida de \xE2ngulos podem tornar essa tarefa mais f\xE1cil] ---",
      tags: [
        "montagem",
        "sequ\xEAncia",
        "completa",
        "obra",
        "caixa",
        "estrutura",
        "interna",
        "m\xF3dulo"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_sequencia_completa_de_montagem_em_obra_fixacao_reforco_de_juntas_e_instalacao",
      entidade: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      categoria: "Montagem",
      subcategoria: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      titulo: "Fixa\xE7\xE3o, refor\xE7o de juntas e instala\xE7\xE3o de prateleiras",
      tipo: "boa_pratica",
      descricao: "Ap\xF3s a montagem da caixa, o painel traseiro (fundo) \xE9 colado e fixado (com juntas de topo) para ficar rente \xE0 parede; em seguida, as jun\xE7\xF5es s\xE3o refor\xE7adas com refor\xE7os de canto, e as prateleiras s\xE3o instaladas \u2014 medindo, marcando e nivelando as posi\xE7\xF5es de pelo menos quatro suportes por prateleira (dois de cada lado), antes de deslizar a prateleira nos suportes. [cf. Prenda os pain\xE9is laterais. Em seguida, cole e prenda (com mais juntas de topo), o painel traseiro para que ele fique rente \xE0 parede... Reforce as juntas. Agora, fortale\xE7a todas as jun\xE7\xF5es com refor\xE7os de canto... Instale as prateleiras. Me\xE7a, marque e nivele as posi\xE7\xF5es de pelo menos quatro suportes de canto (dois de cada lado). Em seguida, deslize as prateleiras]",
      condicoes: {
        quando_aplicar: "Sequ\xEAncia padr\xE3o de montagem de qualquer arm\xE1rio/estante com prateleiras, entre a etapa da caixa (item 1.2) e o acabamento final (portas, quadros frontais).",
        condicoes_adicionais: "A espessura do painel traseiro deve ser validada conforme o m\xF3dulo Estrutura (item 3.1) \u2014 refer\xEAncia pr\xE1tica citada \xE9 uma placa de compensado de 1,5 cm de espessura, com espessura maior necess\xE1ria para arm\xE1rios de maior porte/carga. [cf. Me\xE7a e aparafuse uma placa de compensado de 1,5 cm de espessura no lugar. Uma mais grossa ser\xE1 necess\xE1rio para os arm\xE1rios]"
      },
      restricoes: {
        quando_nao_aplicar: "Prateleiras fixas embutidas em ranhura (n\xE3o remov\xEDveis/ajust\xE1veis) seguem l\xF3gica diferente, j\xE1 integrada \xE0 montagem da caixa em si.",
        limitacoes: "Suportes de prateleira mal nivelados (mesmo com pequena diferen\xE7a entre os dois lados) resultam em prateleira visivelmente inclinada \u2014 verifica\xE7\xE3o com n\xEDvel \xE9 etapa obrigat\xF3ria, n\xE3o opcional."
      },
      acoes_recomendadas: "Uso do Sistema 32 de fura\xE7\xE3o (m\xF3dulo Produ\xE7\xE3o, item 2) para garantir posicionamento padronizado e preciso dos suportes de prateleira, reduzindo depend\xEAncia de medi\xE7\xE3o manual repetida.",
      motivo_tecnico: "Ap\xF3s a montagem da caixa, o painel traseiro (fundo) \xE9 colado e fixado (com juntas de topo) para ficar rente \xE0 parede; em seguida, as jun\xE7\xF5es s\xE3o refor\xE7adas com refor\xE7os de canto, e as prateleiras s\xE3o instaladas \u2014 medindo, marcando e nivelando as posi\xE7\xF5es de pelo menos quatro suportes por prateleira (dois de cada lado), antes de deslizar a prateleira nos suportes. [cf. Prenda os pain\xE9is laterais. Em seguida, cole e prenda (com mais juntas de topo), o painel traseiro para que ele fique rente \xE0 parede... Reforce as juntas. Agora, fortale\xE7a todas as jun\xE7\xF5es com refor\xE7os de canto... Instale as prateleiras. Me\xE7a, marque e nivele as posi\xE7\xF5es de pelo menos quatro suportes de canto (dois de cada lado). Em seguida, deslize as prateleiras]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: 'Apostila t\xE9cnica Profec ("Montagem de M\xF3veis Planejados").',
      fabricante: "N/A.",
      observacoes: 'A etapa de "adicionar os quadros frontais" (mont\xE1-los como uma moldura \xFAnica, com juntas planas ou esquadrinhadas) \xE9 citada como etapa final de composi\xE7\xE3o est\xE9tica antes do acabamento \u2014 relevante especialmente em m\xF3veis com molduras/frisos decorativos na frente da caixaria. [cf. Adicione os quadros frontais. Monte-os em uma s\xF3 unidade, como se fizesse uma moldura. Voc\xEA pode usar juntas planas ou deix\xE1-las esquadrinhadas] ---',
      tags: [
        "montagem",
        "sequ\xEAncia",
        "completa",
        "obra",
        "fixa\xE7\xE3o",
        "refor\xE7o",
        "juntas",
        "instala\xE7\xE3o"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_sequencia_completa_de_montagem_em_obra_ajuste_fino_instalacao_de_acessorios_e",
      entidade: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      categoria: "Montagem",
      subcategoria: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      titulo: "Ajuste fino, instala\xE7\xE3o de acess\xF3rios e limpeza final",
      tipo: "regra_obrigatoria",
      descricao: "A etapa final de montagem inclui: ajuste fino/regulagem (dobradi\xE7as ajustadas para alinhamento vertical/horizontal perfeito, testando sistemas de amortecimento), instala\xE7\xE3o de puxadores e acess\xF3rios (nichos decorativos, calceiros, porta-gravatas e demais itens internos), e limpeza final (remo\xE7\xE3o de res\xEDduos de montagem, limpeza do m\xF3vel e do local, entrega do ambiente pronto para uso). [cf. Ajuste Fino (Regulagem): O montador faz a regulagem de portas e gavetas, ajustando as dobradi\xE7as para garantir o alinhamento vertical e horizontal perfeito, e testando os sistemas de amortecimento. Instala\xE7\xE3o de Puxadores e Acess\xF3rios: Puxadores, nichos decorativos, e quaisquer acess\xF3rios internos (calceiros, porta-gravatas) s\xE3o instalados. Limpeza Final: O profissional retira os res\xEDduos de montagem, faz a limpeza final do m\xF3vel e do local, entregando o ambiente pronto para uso]",
      condicoes: {
        quando_aplicar: "Etapa final de toda instala\xE7\xE3o de marcenaria planejada, sempre ap\xF3s a estrutura e o acabamento estarem fisicamente completos.",
        condicoes_adicionais: "O ajuste fino de dobradi\xE7as deve usar a regulagem tridimensional j\xE1 descrita no m\xF3dulo Ferragens (item 1.3) \u2014 lateral, altura e profundidade \u2014 para corrigir pequenas varia\xE7\xF5es de execu\xE7\xE3o sem comprometer o alinhamento visual final."
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo sob press\xE3o de prazo, pular a etapa de ajuste fino compromete diretamente a percep\xE7\xE3o de qualidade do cliente na entrega.",
        limitacoes: "Testar os sistemas de amortecimento (soft-close) \xE9 frequentemente negligenciado, mas \xE9 o que garante que o cliente perceba a qualidade da ferragem no primeiro uso \u2014 falha nesse teste na entrega gera reclama\xE7\xE3o imediata."
      },
      acoes_recomendadas: "Checklist formal de entrega (com item espec\xEDfico para cada porta/gaveta testada) para reduzir a chance de item esquecido nesta etapa final.",
      motivo_tecnico: "A etapa final de montagem inclui: ajuste fino/regulagem (dobradi\xE7as ajustadas para alinhamento vertical/horizontal perfeito, testando sistemas de amortecimento), instala\xE7\xE3o de puxadores e acess\xF3rios (nichos decorativos, calceiros, porta-gravatas e demais itens internos), e limpeza final (remo\xE7\xE3o de res\xEDduos de montagem, limpeza do m\xF3vel e do local, entrega do ambiente pronto para uso). [cf. Ajuste Fino (Regulagem): O montador faz a regulagem de portas e gavetas, ajustando as dobradi\xE7as para garantir o alinhamento vertical e horizontal perfeito, e testando os sistemas de amortecimento. Instala\xE7\xE3o de Puxadores e Acess\xF3rios: Puxadores, nichos decorativos, e quaisquer acess\xF3rios internos (calceiros, porta-gravatas) s\xE3o instalados. Limpeza Final: O profissional retira os res\xEDduos de montagem, faz a limpeza final do m\xF3vel e do local, entregando o ambiente pronto para uso]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "cr\xEDtico"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "MP Montagem de M\xF3veis.",
      fabricante: "N/A.",
      observacoes: "Esta sequ\xEAncia completa (planejamento \u2192 caixa \u2192 fixa\xE7\xE3o/prateleiras \u2192 ajuste fino/acabamento) deveria ser tratada no motor de regras do Planne como um checklist estruturado de entrega, gerando uma lista de verifica\xE7\xE3o autom\xE1tica por m\xF3dulo/projeto. ---",
      tags: [
        "montagem",
        "sequ\xEAncia",
        "completa",
        "obra",
        "ajuste",
        "fino",
        "instala\xE7\xE3o",
        "acess\xF3rios"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_ferramentas_necessarias_por_tipo_de_montagem_ferramentas_basicas_vs_ferrament",
      entidade: "FERRAMENTAS NECESS\xC1RIAS POR TIPO DE MONTAGEM",
      categoria: "Montagem",
      subcategoria: "FERRAMENTAS NECESS\xC1RIAS POR TIPO DE MONTAGEM",
      titulo: "Ferramentas b\xE1sicas vs. ferramentas para puxador embutido",
      tipo: "boa_pratica",
      descricao: "Para m\xF3veis simples sem arremates/fechamentos especiais, ferramentas b\xE1sicas de furadeira e parafusadeira j\xE1 s\xE3o suficientes; quando o projeto inclui puxadores embutidos (cava usinada), \xE9 necess\xE1ria adicionalmente uma tupia manual; a serra tico-tico \xE9 frequentemente necess\xE1ria para ajustes finos, cortes de recorte para tomadas e outros cortes que s\xF3 podem ser definidos no momento da montagem em obra (n\xE3o previstos com precis\xE3o total na produ\xE7\xE3o da f\xE1brica). [cf. Geralmente m\xF3veis soltos onde n\xE3o v\xE3o ser usados arremates ou fechamentos usamos apenas furadeira e parafusadeira mesmo. Em m\xF3veis que ser\xE3o utilizados puxadores embutidos precisamos usar uma tupia manual, al\xE9m das ferramentas j\xE1 citadas acima] [cf. Serra tico tico: Sempre \xE9 necess\xE1rio para ajustes, cortes de tomadas e diversos cortes fundamentais que s\xF3 podem ser feitos na hora da montagem]",
      condicoes: {
        quando_aplicar: "Defini\xE7\xE3o do kit de ferramentas necess\xE1rio para a equipe de montagem, com base no tipo de acabamento especificado no projeto (puxador convencional vs. embutido/cava).",
        condicoes_adicionais: "A presen\xE7a de recortes para tomadas el\xE9tricas, pontos de g\xE1s ou hidr\xE1ulica no local de instala\xE7\xE3o exige ferramenta de corte de ajuste (serra tico-tico) dispon\xEDvel na equipe, mesmo quando o projeto foi bem especificado \u2014 imprevistos de obra civil s\xE3o praticamente inevit\xE1veis."
      },
      restricoes: {
        quando_nao_aplicar: "M\xF3veis totalmente pr\xE9-furados e com ferragem 100% padronizada (linha de produ\xE7\xE3o em s\xE9rie) podem dispensar tupia manual se n\xE3o houver recorte in loco necess\xE1rio.",
        limitacoes: "Equipe sem a ferramenta correta dispon\xEDvel no dia da montagem gera atraso ou, pior, improviso com ferramenta inadequada, comprometendo o acabamento."
      },
      acoes_recomendadas: "Padroniza\xE7\xE3o de recortes j\xE1 na f\xE1brica (baseada em medi\xE7\xE3o precisa em visita t\xE9cnica pr\xE9via), reduzindo a necessidade de ajuste de corte no local \u2014 mas nunca eliminando totalmente essa necessidade, dado o risco de pequenas diverg\xEAncias de execu\xE7\xE3o civil.",
      motivo_tecnico: "Para m\xF3veis simples sem arremates/fechamentos especiais, ferramentas b\xE1sicas de furadeira e parafusadeira j\xE1 s\xE3o suficientes; quando o projeto inclui puxadores embutidos (cava usinada), \xE9 necess\xE1ria adicionalmente uma tupia manual; a serra tico-tico \xE9 frequentemente necess\xE1ria para ajustes finos, cortes de recorte para tomadas e outros cortes que s\xF3 podem ser definidos no momento da montagem em obra (n\xE3o previstos com precis\xE3o total na produ\xE7\xE3o da f\xE1brica). [cf. Geralmente m\xF3veis soltos onde n\xE3o v\xE3o ser usados arremates ou fechamentos usamos apenas furadeira e parafusadeira mesmo. Em m\xF3veis que ser\xE3o utilizados puxadores embutidos precisamos usar uma tupia manual, al\xE9m das ferramentas j\xE1 citadas acima] [cf. Serra tico tico: Sempre \xE9 necess\xE1rio para ajustes, cortes de tomadas e diversos cortes fundamentais que s\xF3 podem ser feitos na hora da montagem]",
      impacto: {
        estrutural: "baixo",
        financeiro: "m\xE9dio",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Marcenaria de Hoje (blog t\xE9cnico com lista de ferramentas por tipo de montagem).",
      fabricante: "N/A.",
      observacoes: 'Este item se conecta diretamente ao m\xF3dulo Portas e Gavetas (item 6.1, sobre puxador "cava") \u2014 a decis\xE3o de projeto de usar puxador embutido tem impacto direto e previs\xEDvel no kit de ferramentas necess\xE1rio em obra, permitindo que o motor de regras do Planne gere automaticamente uma "lista de ferramentas requeridas" por projeto. ---',
      tags: [
        "montagem",
        "ferramentas",
        "necess\xE1rias",
        "tipo",
        "b\xE1sicas",
        "puxador",
        "embutido"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_ferramentas_necessarias_por_tipo_de_montagem_componentes_e_verificacao_pre_mo",
      entidade: "FERRAMENTAS NECESS\xC1RIAS POR TIPO DE MONTAGEM",
      categoria: "Montagem",
      subcategoria: "FERRAMENTAS NECESS\xC1RIAS POR TIPO DE MONTAGEM",
      titulo: "Componentes e verifica\xE7\xE3o pr\xE9-montagem",
      tipo: "boa_pratica",
      descricao: "As diretrizes de montagem geralmente incluem informa\xE7\xF5es sobre os componentes necess\xE1rios (parafusos, dobradi\xE7as, suportes) e as ferramentas apropriadas (chaves de fenda, furadeiras, n\xEDveis) \u2014 ter tudo isso organizado e \xE0 m\xE3o antes de iniciar evita interrup\xE7\xF5es durante o processo. [cf. As diretrizes de montagem geralmente incluem informa\xE7\xF5es sobre os componentes necess\xE1rios, como parafusos, dobradi\xE7as e suportes. Tamb\xE9m podem conter orienta\xE7\xF5es sobre as ferramentas apropriadas para a montagem, como chaves de fenda, furadeiras e n\xEDveis. Esses detalhes s\xE3o fundamentais para que o montador tenha tudo o que precisa \xE0 m\xE3o, facilitando o processo e evitando interrup\xE7\xF5es]",
      condicoes: {
        quando_aplicar: "Antes do in\xEDcio de qualquer montagem, como parte da checklist de verifica\xE7\xE3o pr\xE9-execu\xE7\xE3o.",
        condicoes_adicionais: "Verificar se todos os componentes necess\xE1rios (ferragens, parafusos, pregos, puxadores) est\xE3o presentes e em boas condi\xE7\xF5es, e se o manual de instru\xE7\xF5es da montagem acompanha os m\xF3veis, antes de iniciar fisicamente. [cf. Componentes e Ferramentas: Certifique-se de que todos os componentes necess\xE1rios para a montagem, como ferragens, parafusos, pregos e puxadores, estejam presentes e em boas condi\xE7\xF5es. Manual de Instru\xE7\xF5es: Verifique se o manual de instru\xE7\xF5es da montagem acompanha os m\xF3veis]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo montagens pequenas se beneficiam de checagem de componentes antes de come\xE7ar.",
        limitacoes: "Faltar um componente no meio do processo (descoberto apenas durante a montagem) gera atraso significativo, especialmente se a pe\xE7a faltante precisar ser comprada/produzida \xE0s pressas."
      },
      acoes_recomendadas: "Kit de reposi\xE7\xE3o r\xE1pida (parafusos, buchas, cavilhas extras de tipos comuns) sempre dispon\xEDvel na equipe de montagem, para resolver pequenas faltas sem precisar interromper o trabalho.",
      motivo_tecnico: "As diretrizes de montagem geralmente incluem informa\xE7\xF5es sobre os componentes necess\xE1rios (parafusos, dobradi\xE7as, suportes) e as ferramentas apropriadas (chaves de fenda, furadeiras, n\xEDveis) \u2014 ter tudo isso organizado e \xE0 m\xE3o antes de iniciar evita interrup\xE7\xF5es durante o processo. [cf. As diretrizes de montagem geralmente incluem informa\xE7\xF5es sobre os componentes necess\xE1rios, como parafusos, dobradi\xE7as e suportes. Tamb\xE9m podem conter orienta\xE7\xF5es sobre as ferramentas apropriadas para a montagem, como chaves de fenda, furadeiras e n\xEDveis. Esses detalhes s\xE3o fundamentais para que o montador tenha tudo o que precisa \xE0 m\xE3o, facilitando o processo e evitando interrup\xE7\xF5es]",
      impacto: {
        estrutural: "alto",
        financeiro: "m\xE9dio",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "SOS Planejados (gloss\xE1rio t\xE9cnico); JS Studio (blog de marcenaria).",
      fabricante: "N/A.",
      observacoes: "O tempo de montagem varia de acordo com a complexidade do projeto, o tamanho dos m\xF3veis e a quantidade de pe\xE7as \u2014 n\xE3o deve ser tratado como um valor fixo \xFAnico, mas estimado proporcionalmente \xE0 complexidade real de cada projeto. [cf. Tempo de Montagem: O tempo de montagem varia de acordo com a complexidade do projeto, tamanho dos m\xF3veis e quantidade de pe\xE7as] ---",
      tags: [
        "montagem",
        "ferramentas",
        "necess\xE1rias",
        "tipo",
        "componentes",
        "verifica\xE7\xE3o"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_ajuste_fino_e_regulagem_de_ferragens_regulagem_tridimensional_como_etapa_nao_",
      entidade: "AJUSTE FINO E REGULAGEM DE FERRAGENS",
      categoria: "Montagem",
      subcategoria: "AJUSTE FINO E REGULAGEM DE FERRAGENS",
      titulo: "Regulagem tridimensional como etapa n\xE3o-opcional",
      tipo: "alerta",
      descricao: "Montar m\xF3veis planejados exige equipamentos que garantam cortes precisos, nivelamento correto e ajustes finos \u2014 quando o profissional depende de improvisos em vez de ferramentas adequadas, o risco de comprometer o acabamento aumenta significativamente. [cf. Montar m\xF3veis planejados exige equipamentos que garantam cortes precisos, nivelamento correto e ajustes finos. Quando o profissional depende de improvisos, o risco de comprometer o acabamento aumenta]",
      condicoes: {
        quando_aplicar: "Etapa final de toda montagem, aplicando a regulagem tridimensional de dobradi\xE7as (m\xF3dulo Ferragens, item 1.3) e o nivelamento geral do m\xF3dulo instalado.",
        condicoes_adicionais: "A montagem de m\xF3veis planejados \xE9 uma etapa altamente t\xE9cnica, diferente de m\xF3veis prontos com medidas padronizadas \u2014 cada painel, dobradi\xE7a, corredi\xE7a ou puxador foi pensado especificamente para aquele espa\xE7o, e qualquer erro pode comprometer todo o projeto. [cf. A montagem de m\xF3veis planejados \xE9 uma etapa altamente t\xE9cnica. Ao contr\xE1rio de m\xF3veis prontos, que seguem medidas padronizadas e geralmente possuem instru\xE7\xF5es gen\xE9ricas, os m\xF3veis planejados s\xE3o fabricados sob medida. Isso significa que cada painel, dobradi\xE7a, corredi\xE7a ou puxador foi pensado especificamente para aquele espa\xE7o, e qualquer erro pode comprometer todo o projeto]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo dobradi\xE7as de linha b\xE1sica (sem sistema premium de regulagem) precisam de checagem final antes da entrega.",
        limitacoes: "O profissional respons\xE1vel precisa interpretar o projeto t\xE9cnico e identificar a sequ\xEAncia correta de instala\xE7\xE3o \u2014 um montador sem essa capacita\xE7\xE3o espec\xEDfica para marcenaria planejada (mesmo que experiente em m\xF3veis prontos) pode cometer erros por desconhecimento do car\xE1ter sob medida do projeto. [cf. O profissional respons\xE1vel pela montagem precisa interpretar o projeto t\xE9cnico, identificar a sequ\xEAncia correta de instala\xE7\xE3o e ajustar os componentes de forma que o conjunto final esteja perfeitamente nivelado, alinhado e funcional]"
      },
      acoes_recomendadas: "Capacita\xE7\xE3o espec\xEDfica ou contrata\xE7\xE3o de montador com hist\xF3rico comprovado em marcenaria planejada sob medida, n\xE3o apenas em montagem de m\xF3veis modulados de linha.",
      motivo_tecnico: "Montar m\xF3veis planejados exige equipamentos que garantam cortes precisos, nivelamento correto e ajustes finos \u2014 quando o profissional depende de improvisos em vez de ferramentas adequadas, o risco de comprometer o acabamento aumenta significativamente. [cf. Montar m\xF3veis planejados exige equipamentos que garantam cortes precisos, nivelamento correto e ajustes finos. Quando o profissional depende de improvisos, o risco de comprometer o acabamento aumenta]",
      impacto: {
        estrutural: "alto",
        financeiro: "alto",
        estetico: "cr\xEDtico"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Forte Montadores (blog especializado em contrata\xE7\xE3o de montadores).",
      fabricante: "N/A.",
      observacoes: "Este item refor\xE7a a import\xE2ncia de o Planne (enquanto software) gerar documenta\xE7\xE3o t\xE9cnica clara e espec\xEDfica do projeto \u2014 n\xE3o gen\xE9rica \u2014 para orientar corretamente o montador respons\xE1vel pela execu\xE7\xE3o em campo. ---",
      tags: [
        "montagem",
        "ajuste",
        "fino",
        "regulagem",
        "ferragens",
        "tridimensional",
        "etapa",
        "opcional"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_11_boas_praticas_de_contratacao_e_garantia_criterios_de_avaliacao_de_montador_pr",
      entidade: "BOAS PR\xC1TICAS DE CONTRATA\xC7\xC3O E GARANTIA",
      categoria: "Montagem",
      subcategoria: "BOAS PR\xC1TICAS DE CONTRATA\xC7\xC3O E GARANTIA",
      titulo: "Crit\xE9rios de avalia\xE7\xE3o de montador profissional",
      tipo: "recomendacao",
      descricao: "Ao contratar um servi\xE7o de montagem de m\xF3veis planejados, recomenda-se verificar: se o profissional entende as especificidades da marcenaria sob medida (n\xE3o apenas de m\xF3veis de linha), se trabalha com ferramentas adequadas, os prazos e forma de trabalho (rotina de montagem, se ser\xE1 feito em um \xFAnico dia ou com intervalos), e a garantia de servi\xE7o oferecida. [cf. Tamb\xE9m vale a pena conversar sobre prazos e formas de trabalho. Pergunte como ser\xE1 a rotina da montagem: se o servi\xE7o ser\xE1 feito em um \xFAnico dia e se haver\xE1 intervalos... Outro detalhe que muita gente esquece \xE9 a garantia do servi\xE7o]",
      condicoes: {
        quando_aplicar: "Fase de contrata\xE7\xE3o de servi\xE7o de montagem, seja pela pr\xF3pria marcenaria/f\xE1brica, seja por terceirizado independente.",
        condicoes_adicionais: "Um montador s\xE9rio costuma oferecer um prazo de garantia para retorno caso algum problema apare\xE7a logo ap\xF3s a instala\xE7\xE3o, como portas desalinhadas ou corredi\xE7as que n\xE3o funcionem corretamente. [cf. Um montador s\xE9rio costuma oferecer um prazo para retorno caso algum problema apare\xE7a logo ap\xF3s a instala\xE7\xE3o, como portas desalinhadas ou corredi\xE7as que n\xE3o funcionem como deveriam]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa desta avalia\xE7\xE3o \u2014 mesmo marcenarias com equipe pr\xF3pria de montagem se beneficiam de aplicar esses crit\xE9rios internamente como padr\xE3o de qualidade.",
        limitacoes: "A aus\xEAncia de garantia formal de servi\xE7o de montagem deixa o cliente (e a marcenaria contratante) desamparado diante de problemas p\xF3s-instala\xE7\xE3o \u2014 risco reputacional relevante."
      },
      acoes_recomendadas: "Contrato formal de presta\xE7\xE3o de servi\xE7o de montagem com cl\xE1usula expl\xEDcita de garantia e prazo de retorno, mesmo para prestadores aut\xF4nomos/terceirizados.",
      motivo_tecnico: "Ao contratar um servi\xE7o de montagem de m\xF3veis planejados, recomenda-se verificar: se o profissional entende as especificidades da marcenaria sob medida (n\xE3o apenas de m\xF3veis de linha), se trabalha com ferramentas adequadas, os prazos e forma de trabalho (rotina de montagem, se ser\xE1 feito em um \xFAnico dia ou com intervalos), e a garantia de servi\xE7o oferecida. [cf. Tamb\xE9m vale a pena conversar sobre prazos e formas de trabalho. Pergunte como ser\xE1 a rotina da montagem: se o servi\xE7o ser\xE1 feito em um \xFAnico dia e se haver\xE1 intervalos... Outro detalhe que muita gente esquece \xE9 a garantia do servi\xE7o]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "alto"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Forte Montadores.",
      fabricante: "N/A.",
      observacoes: 'Este item complementa o m\xF3dulo "Economia" (a ser detalhado) no que se refere \xE0 gest\xE3o de custos de p\xF3s-venda/assist\xEAncia t\xE9cnica \u2014 formalizar a garantia de montagem desde a contrata\xE7\xE3o \xE9 uma pr\xE1tica preventiva que reduz custo de conflito futuro. --- ## PR\xD3XIMOS PASSOS SUGERIDOS M\xF3dulos conclu\xEDdos at\xE9 aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais**, **Closets**, **Banheiros**, **Escrit\xF3rios**, **Produ\xE7\xE3o**, **Transporte** e **Montagem** (este documento). Falta apenas: 12. **Economia** \u2014 redu\xE7\xE3o de desperd\xEDcio, engrossos econ\xF4micos, padroniza\xE7\xE3o, melhor aproveitamento de chapas. Continuando para o \xFAltimo m\xF3dulo planejado: **Economia**.',
      tags: [
        "montagem",
        "boas",
        "pr\xE1ticas",
        "contrata\xE7\xE3o",
        "garantia",
        "crit\xE9rios",
        "avalia\xE7\xE3o",
        "montador"
      ],
      modulo_origem: "11-Montagem",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_12_reducao_de_desperdicio_via_plano_de_corte_onde_a_marcenaria_perde_dinheiro_o_",
      entidade: "REDU\xC7\xC3O DE DESPERD\xCDCIO VIA PLANO DE CORTE",
      categoria: "Economia",
      subcategoria: "REDU\xC7\xC3O DE DESPERD\xCDCIO VIA PLANO DE CORTE",
      titulo: "Onde a marcenaria perde dinheiro: o retalho descartado",
      tipo: "boa_pratica",
      descricao: "Um dos pontos mais cr\xEDticos de perda financeira na gest\xE3o de produ\xE7\xE3o de marcenaria \xE9 o retalho que vai para o lixo \u2014 fazer o plano de corte manualmente ou de forma intuitiva \xE9 apontado como o caminho mais r\xE1pido para o desperd\xEDcio de material, j\xE1 que o planejamento t\xE9cnico aliado \xE0 tecnologia permite prever exatamente como cada chapa ser\xE1 fatiada, reduzindo as sobras ao m\xEDnimo tecnicamente poss\xEDvel. [cf. Um dos pontos cr\xEDticos da gest\xE3o de produ\xE7\xE3o na marcenaria \xE9 o plano de corte. Fazer isso manualmente ou de forma intuitiva \xE9 o caminho mais r\xE1pido para o desperd\xEDcio de material. O planejamento t\xE9cnico, quando aliado \xE0 tecnologia, permite prever exatamente como cada chapa ser\xE1 fatiada, reduzindo as sobras ao m\xEDnimo t\xE9cnico poss\xEDvel. Onde a maioria das marcenarias perde dinheiro? No retalho que vai para o lixo]",
      condicoes: {
        quando_aplicar: "Toda gest\xE3o de produ\xE7\xE3o de marcenaria que trabalha com volume relevante de chapas cortadas, desde pequenas marcenarias at\xE9 opera\xE7\xF5es industriais.",
        condicoes_adicionais: "Cortes improvisados (sem plano de corte formal) levam a desperd\xEDcio de mat\xE9ria-prima, retalhos sem utilidade, e em casos mais graves, \xE0 necessidade de adquirir mais chapas do que o necess\xE1rio para o mesmo projeto. [cf. Cortes improvisados levam a desperd\xEDcio de mat\xE9ria-prima, retalhos sem utilidade e, em casos mais graves, \xE0 necessidade de adquirir mais chapas do que o necess\xE1rio para um projeto]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa completa \u2014 mesmo produ\xE7\xF5es muito pequenas se beneficiam de, ao menos, um plano de corte b\xE1sico manual bem pensado, mesmo sem software dedicado.",
        limitacoes: "M\xE9todos manuais (desenho em papel, planilhas complexas) tornam a visualiza\xE7\xE3o da otimiza\xE7\xE3o um desafio, e a capacidade de testar diferentes arranjos para encontrar o mais eficiente \xE9 praticamente nula \u2014 o tempo gasto em tentativa e erro \xE9, em si, um custo oculto que afeta a produtividade. [cf. Esse cen\xE1rio \xE9 comum em marcenarias que ainda dependem de m\xE9todos manuais, como o desenho em papel ou o uso de planilhas complexas. A visualiza\xE7\xE3o da otimiza\xE7\xE3o torna-se um desafio, e a capacidade de testar diferentes arranjos para encontrar o mais eficiente \xE9 praticamente nula. O tempo gasto na tentativa e erro tamb\xE9m \xE9 um custo oculto que afeta a produtividade]"
      },
      acoes_recomendadas: "Softwares de plano de corte/nesting (j\xE1 descritos no m\xF3dulo Produ\xE7\xE3o, item 1) que armazenam retalhos para uso futuro, considerando sentido de textura, agrupando pe\xE7as por cor e gerando relat\xF3rios estat\xEDsticos detalhados (peso, pre\xE7o, aproveitamento, volume, per\xEDmetro). [cf. O programa armazena retalhos para uso futuro, permitindo que voc\xEA aproveite at\xE9 as menores sobras. Ele considera o sentido da textura, agrupa pe\xE7as iguais por cor e gera relat\xF3rios estat\xEDsticos detalhados com peso, pre\xE7os, aproveitamento, volume e per\xEDmetro]",
      motivo_tecnico: "Um dos pontos mais cr\xEDticos de perda financeira na gest\xE3o de produ\xE7\xE3o de marcenaria \xE9 o retalho que vai para o lixo \u2014 fazer o plano de corte manualmente ou de forma intuitiva \xE9 apontado como o caminho mais r\xE1pido para o desperd\xEDcio de material, j\xE1 que o planejamento t\xE9cnico aliado \xE0 tecnologia permite prever exatamente como cada chapa ser\xE1 fatiada, reduzindo as sobras ao m\xEDnimo tecnicamente poss\xEDvel. [cf. Um dos pontos cr\xEDticos da gest\xE3o de produ\xE7\xE3o na marcenaria \xE9 o plano de corte. Fazer isso manualmente ou de forma intuitiva \xE9 o caminho mais r\xE1pido para o desperd\xEDcio de material. O planejamento t\xE9cnico, quando aliado \xE0 tecnologia, permite prever exatamente como cada chapa ser\xE1 fatiada, reduzindo as sobras ao m\xEDnimo t\xE9cnico poss\xEDvel. Onde a maioria das marcenarias perde dinheiro? No retalho que vai para o lixo]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "cr\xEDtico",
        estetico: "nenhum"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Corte Certo (blog especializado em software de otimiza\xE7\xE3o de corte); Guia da Marcenaria (blog t\xE9cnico).",
      fabricante: "N/A (categoria de software/processo).",
      observacoes: "Vale a distin\xE7\xE3o terminol\xF3gica citada por uma das fontes: retalho \xE9 uma sobra de tamanho aproveit\xE1vel; perda \xE9 o material que n\xE3o tem mais utilidade pr\xE1tica nenhuma \u2014 o objetivo da boa gest\xE3o de corte \xE9 maximizar retalhos aproveit\xE1veis e minimizar perdas reais. [cf. Lembre-se, retalho \xE9 uma sobra de tamanho aproveit\xE1vel; a perda \xE9 o que n\xE3o] ---",
      tags: [
        "economia",
        "redu\xE7\xE3o",
        "desperd\xEDcio",
        "plano",
        "corte",
        "marcenaria",
        "perde",
        "dinheiro"
      ],
      modulo_origem: "12-Economia",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_12_reducao_de_desperdicio_via_plano_de_corte_boas_praticas_de_planejamento_de_co",
      entidade: "REDU\xC7\xC3O DE DESPERD\xCDCIO VIA PLANO DE CORTE",
      categoria: "Economia",
      subcategoria: "REDU\xC7\xC3O DE DESPERD\xCDCIO VIA PLANO DE CORTE",
      titulo: "Boas pr\xE1ticas de planejamento de corte",
      tipo: "recomendacao",
      descricao: "Entre as boas pr\xE1ticas recomendadas para todo marceneiro na elabora\xE7\xE3o de um plano de corte est\xE3o: priorizar o planejamento detalhado do corte (evitando ajustes desnecess\xE1rios), definir a sequ\xEAncia de cortes com base na facilidade de execu\xE7\xE3o e na estabilidade da chapa, revisar o alinhamento das pe\xE7as antes de iniciar o corte, simular o processo com um aplicativo antes de cortar fisicamente, e salvar diferentes vers\xF5es do plano para eventuais altera\xE7\xF5es de \xFAltima hora. [cf. Priorizar o planejamento detalhado do corte, evitando ajustes desnecess\xE1rios. Definir a sequ\xEAncia de cortes com base na facilidade de execu\xE7\xE3o e na estabilidade da chapa. Revisar o alinhamento das pe\xE7as antes de iniciar o corte para evitar erros de encaixe. Simular o processo com um aplicativo desenhar m\xF3veis antes de cortar o MDF. Salvar diferentes vers\xF5es do plano para eventuais altera\xE7\xF5es de \xFAltima hora]",
      condicoes: {
        quando_aplicar: "Toda elabora\xE7\xE3o de plano de corte, seja manual ou assistida por software, antes de qualquer corte f\xEDsico de chapa.",
        condicoes_adicionais: "Ao enviar o plano de corte para terceiros ou para uma central de corte (servi\xE7o terceirizado de corte de chapa), a revis\xE3o cuidadosa ajuda a evitar erros de comunica\xE7\xE3o/interpreta\xE7\xE3o entre quem projeta e quem efetivamente executa o corte. [cf. Essa revis\xE3o ajuda a evitar erros, inclusive, quando o plano de corte ser\xE1 enviado para terceiros ou para uma central de corte]"
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa \u2014 mesmo com software avan\xE7ado, a revis\xE3o humana do plano antes da execu\xE7\xE3o continua sendo recomendada.",
        limitacoes: "Simula\xE7\xE3o em software n\xE3o substitui a verifica\xE7\xE3o final humana antes do corte f\xEDsico \u2014 erros de input (medida errada digitada) podem passar despercebidos mesmo em um software correto."
      },
      acoes_recomendadas: "Dupla checagem (revis\xE3o cruzada por segunda pessoa) do plano de corte antes da libera\xE7\xE3o para produ\xE7\xE3o, especialmente em projetos de alto valor ou pe\xE7as caras (compensado naval, chapas grandes).",
      motivo_tecnico: "Entre as boas pr\xE1ticas recomendadas para todo marceneiro na elabora\xE7\xE3o de um plano de corte est\xE3o: priorizar o planejamento detalhado do corte (evitando ajustes desnecess\xE1rios), definir a sequ\xEAncia de cortes com base na facilidade de execu\xE7\xE3o e na estabilidade da chapa, revisar o alinhamento das pe\xE7as antes de iniciar o corte, simular o processo com um aplicativo antes de cortar fisicamente, e salvar diferentes vers\xF5es do plano para eventuais altera\xE7\xF5es de \xFAltima hora. [cf. Priorizar o planejamento detalhado do corte, evitando ajustes desnecess\xE1rios. Definir a sequ\xEAncia de cortes com base na facilidade de execu\xE7\xE3o e na estabilidade da chapa. Revisar o alinhamento das pe\xE7as antes de iniciar o corte para evitar erros de encaixe. Simular o processo com um aplicativo desenhar m\xF3veis antes de cortar o MDF. Salvar diferentes vers\xF5es do plano para eventuais altera\xE7\xF5es de \xFAltima hora]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Calcme (blog t\xE9cnico); Duratex (blog institucional do fabricante).",
      fabricante: "Duratex (fonte institucional, refor\xE7ando que fabricantes de mat\xE9ria-prima tamb\xE9m investem em orientar boas pr\xE1ticas de corte para reduzir desperd\xEDcio de seu pr\xF3prio material).",
      observacoes: "O gerador de plano de corte deve ser capaz de considerar medidas exatas e espessuras espec\xEDficas de cada projeto para evitar erros \u2014 um sistema gen\xE9rico que ignore varia\xE7\xF5es reais de espessura entre fabricantes (ver m\xF3dulo Materiais) pode gerar planos tecnicamente incorretos. [cf. Precis\xE3o: considera medidas exatas e espessuras para evitar erros] ---",
      tags: [
        "economia",
        "redu\xE7\xE3o",
        "desperd\xEDcio",
        "plano",
        "corte",
        "boas",
        "pr\xE1ticas",
        "planejamento"
      ],
      modulo_origem: "12-Economia",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_12_reaproveitamento_de_retalhos_e_sobras_transformando_sobras_de_mdf_em_oportuni",
      entidade: "REAPROVEITAMENTO DE RETALHOS E SOBRAS",
      categoria: "Economia",
      subcategoria: "REAPROVEITAMENTO DE RETALHOS E SOBRAS",
      titulo: "Transformando sobras de MDF em oportunidade de lucro",
      tipo: "boa_pratica",
      descricao: "O desperd\xEDcio de retalhos de madeira \xE9 um problema recorrente na marcenaria, mas pode ser transformado em fonte adicional de lucro quando bem gerenciado \u2014 retalhos grandes e bem-acabados t\xEAm maior potencial para pe\xE7as mais elaboradas, enquanto pe\xE7as finas (sobras de 3 a 6 mm) s\xE3o adequadas para itens pequenos. [cf. O desperd\xEDcio de retalhos de madeira \xE9 um problema recorrente na marcenaria, mas voc\xEA sabia que ele pode ser a chave para aumentar seus lucros? Para garantir a rentabilidade, considere reaproveitar: Retalhos grandes e bem acabados, com maior potencial para pe\xE7as mais elaboradas; Pe\xE7as finas: sobras de 3mm a 6mm s\xE3o perfeitas para itens pequenos]",
      condicoes: {
        quando_aplicar: "Gest\xE3o de estoque de sobras em qualquer marcenaria que produz em volume relevante, como estrat\xE9gia deliberada de redu\xE7\xE3o de custo (e n\xE3o apenas descarte autom\xE1tico).",
        condicoes_adicionais: "A previsibilidade das sobras \u2014 o sistema de nesting calculando automaticamente os retalhos que sobrar\xE3o antes mesmo de cortar a chapa \u2014 permite planejar o que fazer com essas sobras j\xE1 na fase de projeto, n\xE3o apenas depois do corte f\xEDsico. [cf. Previsibilidade das sobras: o sistema calcula automaticamente os retalhos que sobram para que voc\xEA possa planejar o que fazer com essas sobras antes mesmo de cortar a chapa]"
      },
      restricoes: {
        quando_nao_aplicar: "Retalhos muito pequenos ou danificados (sem tamanho aproveit\xE1vel para qualquer aplica\xE7\xE3o pr\xE1tica) devem ser corretamente classificados como perda, n\xE3o retalho \u2014 for\xE7ar o reaproveitamento de material sem valor real gera mais custo de gest\xE3o do que economia.",
        limitacoes: 'Gest\xE3o de estoque de retalhos exige organiza\xE7\xE3o f\xEDsica (espa\xE7o dedicado, cataloga\xE7\xE3o por tamanho/cor/espessura) \u2014 sem essa organiza\xE7\xE3o, o "estoque de sobras" rapidamente se torna uma pilha desorganizada sem valor pr\xE1tico real.'
      },
      acoes_recomendadas: "Uso direto de retalhos de 6\u20139 mm como material de engrosso (ver m\xF3dulo Estrutura, item 5.1) \u2014 conectando diretamente a pr\xE1tica de reaproveitamento de sobra com uma t\xE9cnica estrutural j\xE1 estabelecida na base.",
      motivo_tecnico: "O desperd\xEDcio de retalhos de madeira \xE9 um problema recorrente na marcenaria, mas pode ser transformado em fonte adicional de lucro quando bem gerenciado \u2014 retalhos grandes e bem-acabados t\xEAm maior potencial para pe\xE7as mais elaboradas, enquanto pe\xE7as finas (sobras de 3 a 6 mm) s\xE3o adequadas para itens pequenos. [cf. O desperd\xEDcio de retalhos de madeira \xE9 um problema recorrente na marcenaria, mas voc\xEA sabia que ele pode ser a chave para aumentar seus lucros? Para garantir a rentabilidade, considere reaproveitar: Retalhos grandes e bem acabados, com maior potencial para pe\xE7as mais elaboradas; Pe\xE7as finas: sobras de 3mm a 6mm s\xE3o perfeitas para itens pequenos]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Promob (blog institucional de software de marcenaria).",
      fabricante: "N/A.",
      observacoes: 'Este item conecta diretamente com o m\xF3dulo Estrutura (item 5.1 \u2014 engrosso) e refor\xE7a um padr\xE3o que j\xE1 apareceu em m\xFAltiplos m\xF3dulos desta base: retalhos e sobras n\xE3o s\xE3o apenas "desperd\xEDcio a minimizar" mas um recurso ativo a ser gerenciado e reaproveitado deliberadamente. ---',
      tags: [
        "economia",
        "reaproveitamento",
        "retalhos",
        "sobras",
        "transformando",
        "oportunidade",
        "lucro"
      ],
      modulo_origem: "12-Economia",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_12_reaproveitamento_de_retalhos_e_sobras_reducao_de_erro_humano_como_beneficio_c",
      entidade: "REAPROVEITAMENTO DE RETALHOS E SOBRAS",
      categoria: "Economia",
      subcategoria: "REAPROVEITAMENTO DE RETALHOS E SOBRAS",
      titulo: "Redu\xE7\xE3o de erro humano como benef\xEDcio colateral da tecnologia",
      tipo: "alerta",
      descricao: "Al\xE9m da economia direta de material, o uso de softwares especializados de planejamento de corte reduz erros humanos, j\xE1 que os c\xE1lculos autom\xE1ticos orientam o operador sobre a forma mais eficiente de cortar as chapas, com flexibilidade de ajuste r\xE1pido quando necess\xE1rio. [cf. Redu\xE7\xE3o de erros humanos: as chances de errar diminuem, j\xE1 que os c\xE1lculos s\xE3o autom\xE1ticos e o programa orienta como cortar as chapas com mais efici\xEAncia; Facilidade de ajuste: muitas plataformas]",
      condicoes: {
        quando_aplicar: "Avalia\xE7\xE3o de investimento em tecnologia de plano de corte para qualquer marcenaria, considerando o benef\xEDcio combinado (economia de material + redu\xE7\xE3o de retrabalho por erro).",
        condicoes_adicionais: "O sistema sinaliza pe\xE7as muito pequenas ou a \xFAltima pe\xE7a de um mesmo tamanho, aumentando a efici\xEAncia do processo de corte e reduzindo a chance de esquecer uma pe\xE7a na produ\xE7\xE3o. [cf. O software informa diferentes formas de descri\xE7\xE3o e sinaliza pe\xE7as muito pequenas ou a \xFAltima pe\xE7a do mesmo tamanho, aumentando a efici\xEAncia do processo]"
      },
      restricoes: {
        quando_nao_aplicar: "Marcenarias de volume muito baixo (poucas pe\xE7as por m\xEAs) podem n\xE3o justificar o investimento completo em software, embora ainda se beneficiem de ferramentas gratuitas/simplificadas.",
        limitacoes: "O software elimina c\xE1lculos manuais, mas n\xE3o substitui completamente a verifica\xE7\xE3o humana final (ver item 1.2) \u2014 a tecnologia reduz, mas n\xE3o elimina totalmente o risco de erro."
      },
      acoes_recomendadas: "Ferramentas gratuitas/simplificadas (Cutlist Optimizer, MaxCut, entre outras j\xE1 citadas no m\xF3dulo Produ\xE7\xE3o) para marcenarias de menor porte que n\xE3o justificam o investimento em software completo de gest\xE3o.",
      motivo_tecnico: "Al\xE9m da economia direta de material, o uso de softwares especializados de planejamento de corte reduz erros humanos, j\xE1 que os c\xE1lculos autom\xE1ticos orientam o operador sobre a forma mais eficiente de cortar as chapas, com flexibilidade de ajuste r\xE1pido quando necess\xE1rio. [cf. Redu\xE7\xE3o de erros humanos: as chances de errar diminuem, j\xE1 que os c\xE1lculos s\xE3o autom\xE1ticos e o programa orienta como cortar as chapas com mais efici\xEAncia; Facilidade de ajuste: muitas plataformas]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "m\xE9dio"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Promob; Corte Certo (blog de software especializado).",
      fabricante: "Promob (citado aqui apenas como fonte de conte\xFAdo t\xE9cnico do blog institucional, n\xE3o como recomenda\xE7\xE3o de produto espec\xEDfico).",
      observacoes: "Este item refor\xE7a diretamente o valor estrat\xE9gico do pr\xF3prio Planne como plataforma \u2014 a redu\xE7\xE3o de erro humano via automa\xE7\xE3o de regras \xE9 exatamente o tipo de benef\xEDcio que o motor de intelig\xEAncia do sistema deveria entregar de forma nativa, n\xE3o apenas no plano de corte, mas em toda a cadeia de decis\xE3o de projeto coberta pelos m\xF3dulos anteriores desta base. ---",
      tags: [
        "economia",
        "reaproveitamento",
        "retalhos",
        "sobras",
        "redu\xE7\xE3o",
        "erro",
        "humano",
        "benef\xEDcio"
      ],
      modulo_origem: "12-Economia",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_12_padronizacao_de_processo_5s_e_melhoria_continua_metodologia_5s_aplicada_a_mar",
      entidade: "PADRONIZA\xC7\xC3O DE PROCESSO \u2014 5S E MELHORIA CONT\xCDNUA",
      categoria: "Economia",
      subcategoria: "PADRONIZA\xC7\xC3O DE PROCESSO \u2014 5S E MELHORIA CONT\xCDNUA",
      titulo: "Metodologia 5S aplicada \xE0 marcenaria",
      tipo: "boa_pratica",
      descricao: "A metodologia 5S \u2014 Organiza\xE7\xE3o (Seiri), Arruma\xE7\xE3o (Seiton), Limpeza (Seiso), Padroniza\xE7\xE3o (Seiketsu) e Disciplina (Shitsuke) \u2014 \xE9 citada como estrutura de gest\xE3o de produ\xE7\xE3o aplic\xE1vel \xE0 marcenaria, complementada pelo conceito de melhoria cont\xEDnua (Kaizen): pequenas mudan\xE7as di\xE1rias nos processos de corte e montagem que, somadas ao longo de um ano, geram impacto massivo na produtividade. [cf. Metodologia 5S: Organiza\xE7\xE3o (Seiri), Arruma\xE7\xE3o (Seiton), Limpeza (Seiso), Padroniza\xE7\xE3o (Seiketsu) e Disciplina (Shitsuke). Melhoria cont\xEDnua (Kaizen): Pequenas mudan\xE7as di\xE1rias nos processos de corte e montagem que, somadas ao longo de um ano, geram um impacto massivo na produtividade]",
      condicoes: {
        quando_aplicar: "Gest\xE3o de qualquer marcenaria com volume de produ\xE7\xE3o relevante, especialmente aquelas com m\xFAltiplos colaboradores/etapas de produ\xE7\xE3o.",
        condicoes_adicionais: "A padroniza\xE7\xE3o (Seiketsu) de medidas e processos \u2014 por exemplo, adotar um formato-padr\xE3o de chapa (m\xF3dulo Materiais, item 4.1) e um padr\xE3o de fura\xE7\xE3o (Sistema 32, m\xF3dulo Produ\xE7\xE3o, item 2) \u2014 reduz variabilidade e retrabalho de forma sistem\xE1tica, n\xE3o pontual."
      },
      restricoes: {
        quando_nao_aplicar: "Marcenarias unipessoais/artesanais de escala muito pequena podem aplicar uma vers\xE3o simplificada dos princ\xEDpios (organiza\xE7\xE3o e padroniza\xE7\xE3o b\xE1sicas), sem necessariamente formalizar o programa 5S completo.",
        limitacoes: "Implementar 5S exige disciplina cont\xEDnua da equipe \u2014 programas que come\xE7am bem mas n\xE3o s\xE3o mantidos ao longo do tempo perdem o benef\xEDcio de melhoria cont\xEDnua citado como diferencial da metodologia."
      },
      acoes_recomendadas: "Ado\xE7\xE3o parcial dos princ\xEDpios (por exemplo, apenas organiza\xE7\xE3o e padroniza\xE7\xE3o, sem o programa formal completo) para marcenarias que n\xE3o t\xEAm estrutura de gest\xE3o para implementar o 5S por completo.",
      motivo_tecnico: "A metodologia 5S \u2014 Organiza\xE7\xE3o (Seiri), Arruma\xE7\xE3o (Seiton), Limpeza (Seiso), Padroniza\xE7\xE3o (Seiketsu) e Disciplina (Shitsuke) \u2014 \xE9 citada como estrutura de gest\xE3o de produ\xE7\xE3o aplic\xE1vel \xE0 marcenaria, complementada pelo conceito de melhoria cont\xEDnua (Kaizen): pequenas mudan\xE7as di\xE1rias nos processos de corte e montagem que, somadas ao longo de um ano, geram impacto massivo na produtividade. [cf. Metodologia 5S: Organiza\xE7\xE3o (Seiri), Arruma\xE7\xE3o (Seiton), Limpeza (Seiso), Padroniza\xE7\xE3o (Seiketsu) e Disciplina (Shitsuke). Melhoria cont\xEDnua (Kaizen): Pequenas mudan\xE7as di\xE1rias nos processos de corte e montagem que, somadas ao longo de um ano, geram um impacto massivo na produtividade]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "alto",
        estetico: "nenhum"
      },
      prioridade: "alto",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Corte Certo (guia de gest\xE3o de produ\xE7\xE3o em marcenarias).",
      fabricante: "N/A (metodologia de gest\xE3o industrial gen\xE9rica, adaptada ao contexto de marcenaria).",
      observacoes: "Este item conecta a base de conhecimento t\xE9cnico (m\xF3dulos 1\u201311) com uma camada de gest\xE3o organizacional \u2014 o Planne, como plataforma, poderia oferecer suporte tanto ao aspecto t\xE9cnico (regras de projeto) quanto ao aspecto de gest\xE3o de processo (aplica\xE7\xE3o pr\xE1tica do 5S/Kaizen na rotina da marcenaria). ---",
      tags: [
        "economia",
        "padroniza\xE7\xE3o",
        "processo",
        "melhoria",
        "cont\xEDnua",
        "metodologia",
        "aplicada",
        "marcenaria"
      ],
      modulo_origem: "12-Economia",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    },
    {
      id: "atom_12_indicadores_de_aproveitamento_e_gestao_por_dados_kpis_de_aproveitamento_de_ch",
      entidade: "INDICADORES DE APROVEITAMENTO E GEST\xC3O POR DADOS",
      categoria: "Economia",
      subcategoria: "INDICADORES DE APROVEITAMENTO E GEST\xC3O POR DADOS",
      titulo: "KPIs de aproveitamento de chapa",
      tipo: "regra_obrigatoria",
      descricao: "O uso de indicadores de desempenho (KPIs), como o \xEDndice de aproveitamento de chapa por projeto, permite que o gestor da marcenaria tome decis\xF5es baseadas em dados reais, em vez de percep\xE7\xE3o subjetiva \u2014 a mesma l\xF3gica de acompanhamento de \xEDndice m\xE9dio de aproveitamento (75%, 80%, 85%, conforme j\xE1 citado no m\xF3dulo Produ\xE7\xE3o, item 1.2) se aplica aqui como ferramenta central de gest\xE3o econ\xF4mica. [cf. O uso de indicadores de desempenho (KPIs), como o \xEDndice de aproveitamento de chapa por projeto, permite que o gestor tome decis\xF5es baseadas em dados]",
      condicoes: {
        quando_aplicar: "Gest\xE3o financeira e operacional cont\xEDnua de qualquer marcenaria, cruzando dados de aproveitamento de material com custo real de produ\xE7\xE3o por projeto.",
        condicoes_adicionais: "Comparar o consumo de chapas antes e depois da implanta\xE7\xE3o de qualquer melhoria de processo (novo software, novo m\xE9todo de organiza\xE7\xE3o) \xE9 a forma mais direta de validar se a mudan\xE7a realmente trouxe o benef\xEDcio esperado \u2014 sem essa compara\xE7\xE3o, decis\xF5es de investimento em processo/tecnologia ficam sem valida\xE7\xE3o objetiva."
      },
      restricoes: {
        quando_nao_aplicar: "N\xE3o h\xE1 dispensa completa \u2014 mesmo marcenarias pequenas se beneficiam de acompanhar ao menos um indicador b\xE1sico de aproveitamento de material ao longo do tempo.",
        limitacoes: "Indicadores isolados (apenas aproveitamento de chapa, por exemplo) n\xE3o capturam toda a complexidade financeira da opera\xE7\xE3o \u2014 devem ser complementados por indicadores de tempo de produ\xE7\xE3o, retrabalho e satisfa\xE7\xE3o do cliente para uma vis\xE3o de gest\xE3o completa."
      },
      acoes_recomendadas: "Dashboard integrado (cruzando m\xFAltiplos m\xF3dulos desta base \u2014 Produ\xE7\xE3o, Transporte, Montagem, Economia) para uma vis\xE3o de gest\xE3o unificada, em vez de indicadores isolados por \xE1rea.",
      motivo_tecnico: "O uso de indicadores de desempenho (KPIs), como o \xEDndice de aproveitamento de chapa por projeto, permite que o gestor da marcenaria tome decis\xF5es baseadas em dados reais, em vez de percep\xE7\xE3o subjetiva \u2014 a mesma l\xF3gica de acompanhamento de \xEDndice m\xE9dio de aproveitamento (75%, 80%, 85%, conforme j\xE1 citado no m\xF3dulo Produ\xE7\xE3o, item 1.2) se aplica aqui como ferramenta central de gest\xE3o econ\xF4mica. [cf. O uso de indicadores de desempenho (KPIs), como o \xEDndice de aproveitamento de chapa por projeto, permite que o gestor tome decis\xF5es baseadas em dados]",
      impacto: {
        estrutural: "nenhum",
        financeiro: "cr\xEDtico",
        estetico: "nenhum"
      },
      prioridade: "cr\xEDtico",
      confianca: {
        score: 92,
        base: "fabricante_oficial"
      },
      fonte: "Corte Certo (guia de gest\xE3o de produ\xE7\xE3o em marcenarias).",
      fabricante: "N/A.",
      observacoes: 'Este \xE9 o item de fechamento natural de toda a base de conhecimento constru\xEDda at\xE9 aqui: o motor de regras do Planne \u2014 que ao longo dos 12 m\xF3dulos incorporou regras de projeto, materiais, ferragens, produ\xE7\xE3o, transporte e montagem \u2014 deveria tamb\xE9m alimentar e ser alimentado por indicadores reais de aproveitamento e desempenho, fechando o ciclo entre conhecimento t\xE9cnico (o que fazer) e gest\xE3o por dados (o que est\xE1 realmente funcionando na pr\xE1tica). --- ## FECHAMENTO DO CICLO INICIAL DE 12 M\xD3DULOS Com este m\xF3dulo, encerra-se o conjunto inicial de 12 categorias definidas no escopo original do projeto: 1. Cozinhas 2. Ferragens 3. Estrutura 4. Portas e Gavetas 5. Materiais 6. Closets 7. Banheiros 8. Escrit\xF3rios 9. Produ\xE7\xE3o 10. Transporte 11. Montagem 12. Economia Cada m\xF3dulo foi pesquisado com fontes t\xE9cnicas reais (fabricantes, associa\xE7\xF5es profissionais, blogs especializados, normas quando aplic\xE1vel), reescrito em linguagem pr\xF3pria e estruturado no formato completo solicitado (t\xEDtulo, categoria, descri\xE7\xE3o, quando aplicar/n\xE3o aplicar, condi\xE7\xF5es, limita\xE7\xF5es, alternativas, impactos, fonte, fabricante, observa\xE7\xF5es). **Poss\xEDveis extens\xF5es futuras** (fora do escopo original de 12 categorias, mas mencionadas na solicita\xE7\xE3o inicial): aprofundamento por pa\xEDs (normas alem\xE3s, italianas, americanas, australianas e canadenses espec\xEDficas), aprofundamento de subcategorias ainda tratadas de forma resumida (ex.: pain\xE9is de TV/ripados, nichos de forma isolada, ilumina\xE7\xE3o t\xE9cnica), e conte\xFAdo de escolas t\xE9cnicas (SENAI) de forma mais extensa. Esses s\xE3o bons candidatos a uma "segunda rodada" de aprofundamento, se e quando fizer sentido para o Planne.',
      tags: [
        "economia",
        "indicadores",
        "aproveitamento",
        "gest\xE3o",
        "dados",
        "kpis",
        "chapa"
      ],
      modulo_origem: "12-Economia",
      versao: {
        numero: 1,
        origem: "migracao_v1_markdown"
      }
    }
  ]
};

// src/lib/base-conhecimento/dados/entidades.json
var entidades_default = {
  total_entidades: 65,
  entidades: {
    "TRI\xC2NGULO DE TRABALHO E FLUXO": {
      nome: "TRI\xC2NGULO DE TRABALHO E FLUXO",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_triangulo_de_trabalho_e_fluxo_regra_do_triangulo_de_trabalho_nkba",
        "atom_01_triangulo_de_trabalho_e_fluxo_larguras_minimas_de_corredor_aisle"
      ]
    },
    GELADEIRA: {
      nome: "GELADEIRA",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_geladeira_folga_de_ventilacao_lateral_superior_e_traseira",
        "atom_01_geladeira_nao_posicionar_geladeira_ao_lado_do_fogao_forno"
      ]
    },
    "COOKTOP / FOG\xC3O": {
      nome: "COOKTOP / FOG\xC3O",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_cooktop_fogao_distancia_minima_da_pia_respingos",
        "atom_01_cooktop_fogao_folga_lateral_do_cooktop_fogao"
      ]
    },
    "FORNO DE EMBUTIR": {
      nome: "FORNO DE EMBUTIR",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_forno_de_embutir_ausencia_de_padrao_dimensional_entre_fabricantes",
        "atom_01_forno_de_embutir_folga_de_ventilacao_e_ergonomia_de_altura_do_forno"
      ]
    },
    "MICRO-ONDAS E TORRE QUENTE": {
      nome: "MICRO-ONDAS E TORRE QUENTE",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_micro_ondas_e_torre_quente_altura_ergonomica_do_micro_ondas_embutido",
        "atom_01_micro_ondas_e_torre_quente_dimensoes_padrao_do_nicho_da_torre_quente"
      ]
    },
    "COIFA / EXAUSTOR": {
      nome: "COIFA / EXAUSTOR",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_coifa_exaustor_altura_da_coifa_sobre_o_cooktop_fogao"
      ]
    },
    "LAVA-LOU\xC7AS": {
      nome: "LAVA-LOU\xC7AS",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_lava_loucas_largura_padrao_de_nicho_60_cm_45_cm",
        "atom_01_lava_loucas_folga_traseira_e_ponto_eletrico_dedicado"
      ]
    },
    "CUBAS E PIA": {
      nome: "CUBAS E PIA",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_cubas_e_pia_compatibilidade_cuba_x_largura_de_bancada",
        "atom_01_cubas_e_pia_profundidade_da_cuba_x_ergonomia"
      ]
    },
    "BANCADAS (altura ergon\xF4mica)": {
      nome: "BANCADAS (altura ergon\xF4mica)",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_bancadas_altura_ergonomica_altura_padrao_da_bancada_de_trabalho",
        "atom_01_bancadas_altura_ergonomica_altura_especifica_para_bancada_de_cooktop"
      ]
    },
    "ARM\xC1RIOS A\xC9REOS": {
      nome: "ARM\xC1RIOS A\xC9REOS",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_armarios_aereos_vao_livre_entre_bancada_e_armario_aereo",
        "atom_01_armarios_aereos_profundidade_do_armario_aereo"
      ]
    },
    "DESPENSEIROS E ARM\xC1RIOS DE COLUNA": {
      nome: "DESPENSEIROS E ARM\xC1RIOS DE COLUNA",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_despenseiros_e_armarios_de_coluna_profundidade_e_alinhamento_com_torre_de_ele"
      ]
    },
    "BOAS PR\xC1TICAS GERAIS DE PROJETO DE COZINHA": {
      nome: "BOAS PR\xC1TICAS GERAIS DE PROJETO DE COZINHA",
      categoria: "Cozinhas",
      atomos: [
        "atom_01_boas_praticas_gerais_de_projeto_de_cozinha_regra_de_ouro_escolher_os_eletrodo"
      ]
    },
    "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA": {
      nome: "DOBRADI\xC7AS \u2014 QUANTIDADE, ESPA\xC7AMENTO E CAPACIDADE DE CARGA",
      categoria: "Ferragens",
      atomos: [
        "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_regra_de_quantidade_p",
        "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_capacidade_de_carga_p",
        "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_faixas_de_espessura_d"
      ]
    },
    "DOBRADI\xC7AS \u2014 TIPOS E RECOBRIMENTO": {
      nome: "DOBRADI\xC7AS \u2014 TIPOS E RECOBRIMENTO",
      categoria: "Ferragens",
      atomos: [
        "atom_02_dobradicas_tipos_e_recobrimento_reta_curva_e_super_curva_semi_sobreposta_embu"
      ]
    },
    "CORREDI\xC7AS \u2014 CAPACIDADE DE CARGA E TIPOS DE EXTRA\xC7\xC3O": {
      nome: "CORREDI\xC7AS \u2014 CAPACIDADE DE CARGA E TIPOS DE EXTRA\xC7\xC3O",
      categoria: "Ferragens",
      atomos: [
        "atom_02_corredicas_capacidade_de_carga_e_tipos_de_extracao_capacidade_de_carga_por_co",
        "atom_02_corredicas_capacidade_de_carga_e_tipos_de_extracao_extracao_total_vs_extracao"
      ]
    },
    "PUXADORES \u2014 POSICIONAMENTO ERGON\xD4MICO": {
      nome: "PUXADORES \u2014 POSICIONAMENTO ERGON\xD4MICO",
      categoria: "Ferragens",
      atomos: [
        "atom_02_puxadores_posicionamento_ergonomico_altura_ideal_do_puxador_em_portas_vertica",
        "atom_02_puxadores_posicionamento_ergonomico_posicionamento_de_puxador_em_gavetas"
      ]
    },
    "DISPOSITIVOS DE MONTAGEM \u2014 MINIFIX, CAVILHA, VB/RAFIX": {
      nome: "DISPOSITIVOS DE MONTAGEM \u2014 MINIFIX, CAVILHA, VB/RAFIX",
      categoria: "Ferragens",
      atomos: [
        "atom_02_dispositivos_de_montagem_minifix_cavilha_vb_rafix_minifix_castanha_cavilha_fu",
        "atom_02_dispositivos_de_montagem_minifix_cavilha_vb_rafix_vb_rafix_como_alternativa_a"
      ]
    },
    "ESPESSURAS DE MDF/MDP E FUN\xC7\xC3O ESTRUTURAL DE CADA UMA": {
      nome: "ESPESSURAS DE MDF/MDP E FUN\xC7\xC3O ESTRUTURAL DE CADA UMA",
      categoria: "Estrutura",
      atomos: [
        "atom_03_espessuras_de_mdf_mdp_e_funcao_estrutural_de_cada_uma_tabela_geral_de_aplicac",
        "atom_03_espessuras_de_mdf_mdp_e_funcao_estrutural_de_cada_uma_frequencia_de_uso_como_"
      ]
    },
    "PRATELEIRAS \u2014 V\xC3O M\xC1XIMO E CAPACIDADE DE CARGA": {
      nome: "PRATELEIRAS \u2014 V\xC3O M\xC1XIMO E CAPACIDADE DE CARGA",
      categoria: "Estrutura",
      atomos: [
        "atom_03_prateleiras_vao_maximo_e_capacidade_de_carga_relacao_entre_vao_espessura_e_fl",
        "atom_03_prateleiras_vao_maximo_e_capacidade_de_carga_exemplos_praticos_de_capacidade_"
      ]
    },
    "FUNDO DO M\xD3VEL \u2014 FUN\xC7\xC3O ESTRUTURAL (TRAVAMENTO TRASEIRO)": {
      nome: "FUNDO DO M\xD3VEL \u2014 FUN\xC7\xC3O ESTRUTURAL (TRAVAMENTO TRASEIRO)",
      categoria: "Estrutura",
      atomos: [
        "atom_03_fundo_do_movel_funcao_estrutural_travamento_traseiro_fundo_como_elemento_de_t",
        "atom_03_fundo_do_movel_funcao_estrutural_travamento_traseiro_montagem_sobre_superfici"
      ]
    },
    "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O": {
      nome: "EMPENAMENTO \u2014 CAUSAS E PREVEN\xC7\xC3O",
      categoria: "Estrutura",
      atomos: [
        "atom_03_empenamento_causas_e_prevencao_causa_tecnica_raiz_diferenca_de_absorcao_de_um",
        "atom_03_empenamento_causas_e_prevencao_limite_de_tolerancia_e_criterio_de_substituica",
        "atom_03_empenamento_causas_e_prevencao_prevencao_pelo_armazenamento_correto_do_mdf_an"
      ]
    },
    "ENGROSSO E TAMPONAMENTO \u2014 T\xC9CNICAS DE COMPOSI\xC7\xC3O DE ESPESSURA E ACABAMENTO": {
      nome: "ENGROSSO E TAMPONAMENTO \u2014 T\xC9CNICAS DE COMPOSI\xC7\xC3O DE ESPESSURA E ACABAMENTO",
      categoria: "Estrutura",
      atomos: [
        "atom_03_engrosso_e_tamponamento_tecnicas_de_composicao_de_espessura_e_acabamento_engr",
        "atom_03_engrosso_e_tamponamento_tecnicas_de_composicao_de_espessura_e_acabamento_tamp"
      ]
    },
    "ESQUADRO E TRAVAMENTO DIAGONAL": {
      nome: "ESQUADRO E TRAVAMENTO DIAGONAL",
      categoria: "Estrutura",
      atomos: [
        "atom_03_esquadro_e_travamento_diagonal_cantoneiras_em_diagonal_como_reforco_de_esquad"
      ]
    },
    "FOLGAS E RECOBRIMENTO DE PORTAS": {
      nome: "FOLGAS E RECOBRIMENTO DE PORTAS",
      categoria: "Portas e Gavetas",
      atomos: [
        "atom_04_folgas_e_recobrimento_de_portas_folgas_de_referencia_entre_portas_e_nas_later"
      ]
    },
    "LARGURA M\xC1XIMA RECOMENDADA POR FOLHA": {
      nome: "LARGURA M\xC1XIMA RECOMENDADA POR FOLHA",
      categoria: "Portas e Gavetas",
      atomos: [
        "atom_04_largura_maxima_recomendada_por_folha_limite_pratico_de_largura_por_folha_em_m"
      ]
    },
    "PORTA DE CORRER": {
      nome: "PORTA DE CORRER",
      categoria: "Portas e Gavetas",
      atomos: [
        "atom_04_porta_de_correr_limites_dimensionais_por_sistema_fabricante",
        "atom_04_porta_de_correr_capacidade_de_carga_do_sistema_de_correr_por_linha_de_ferrage"
      ]
    },
    "PORTA CAMAR\xC3O": {
      nome: "PORTA CAMAR\xC3O",
      categoria: "Portas e Gavetas",
      atomos: [
        "atom_04_porta_camarao_funcionamento_vantagens_e_limitacoes_acusticas_termicas"
      ]
    },
    "PORTA BASCULANTE E PIST\xC3O A G\xC1S": {
      nome: "PORTA BASCULANTE E PIST\xC3O A G\xC1S",
      categoria: "Portas e Gavetas",
      atomos: [
        "atom_04_porta_basculante_e_pistao_a_gas_formula_de_dimensionamento_da_forca_do_pistao",
        "atom_04_porta_basculante_e_pistao_a_gas_angulos_de_abertura_e_compatibilidade_com_o_u"
      ]
    },
    "GAVETAS \u2014 FOLGAS ENTRE FRENTES E COMPOSI\xC7\xC3O VERTICAL": {
      nome: "GAVETAS \u2014 FOLGAS ENTRE FRENTES E COMPOSI\xC7\xC3O VERTICAL",
      categoria: "Portas e Gavetas",
      atomos: [
        "atom_04_gavetas_folgas_entre_frentes_e_composicao_vertical_folgas_entre_frentes_de_ga",
        "atom_04_gavetas_folgas_entre_frentes_e_composicao_vertical_sequencia_de_montagem_e_al"
      ]
    },
    "MDF VS. MDP \u2014 DIFEREN\xC7AS ESTRUTURAIS E DE APLICA\xC7\xC3O": {
      nome: "MDF VS. MDP \u2014 DIFEREN\xC7AS ESTRUTURAIS E DE APLICA\xC7\xC3O",
      categoria: "Materiais",
      atomos: [
        "atom_05_mdf_vs_mdp_diferencas_estruturais_e_de_aplicacao_composicao_e_diferenca_estru",
        "atom_05_mdf_vs_mdp_diferencas_estruturais_e_de_aplicacao_resistencia_a_umidade_e_ao_e"
      ]
    },
    "MDF HIDR\xD3FUGO/RUC/ULTRA \u2014 LINHAS RESISTENTES \xC0 UMIDADE POR FABRICANTE": {
      nome: "MDF HIDR\xD3FUGO/RUC/ULTRA \u2014 LINHAS RESISTENTES \xC0 UMIDADE POR FABRICANTE",
      categoria: "Materiais",
      atomos: [
        "atom_05_mdf_hidrofugo_ruc_ultra_linhas_resistentes_a_umidade_por_fabricante_linha_ruc",
        "atom_05_mdf_hidrofugo_ruc_ultra_linhas_resistentes_a_umidade_por_fabricante_linha_ult"
      ]
    },
    "COMPENSADO NAVAL \u2014 QUANDO USAR EM VEZ DE MDF": {
      nome: "COMPENSADO NAVAL \u2014 QUANDO USAR EM VEZ DE MDF",
      categoria: "Materiais",
      atomos: [
        "atom_05_compensado_naval_quando_usar_em_vez_de_mdf_composicao_e_resistencia_tecnica_s",
        "atom_05_compensado_naval_quando_usar_em_vez_de_mdf_comparativo_de_custo_beneficio_com"
      ]
    },
    "DIMENS\xD5ES-PADR\xC3O DE CHAPA E ESPESSURAS DISPON\xCDVEIS": {
      nome: "DIMENS\xD5ES-PADR\xC3O DE CHAPA E ESPESSURAS DISPON\xCDVEIS",
      categoria: "Materiais",
      atomos: [
        "atom_05_dimensoes_padrao_de_chapa_e_espessuras_disponiveis_formato_padrao_de_chapa_no"
      ]
    },
    "CABIDEIROS \u2014 PROFUNDIDADE E ALTURA POR TIPO DE PE\xC7A": {
      nome: "CABIDEIROS \u2014 PROFUNDIDADE E ALTURA POR TIPO DE PE\xC7A",
      categoria: "Closets",
      atomos: [
        "atom_06_cabideiros_profundidade_e_altura_por_tipo_de_peca_profundidade_do_cabideiro_p",
        "atom_06_cabideiros_profundidade_e_altura_por_tipo_de_peca_altura_por_tipo_de_peca_pen"
      ]
    },
    "SAPATEIRAS \u2014 PROFUNDIDADE E ALTURA POR MODELO": {
      nome: "SAPATEIRAS \u2014 PROFUNDIDADE E ALTURA POR MODELO",
      categoria: "Closets",
      atomos: [
        "atom_06_sapateiras_profundidade_e_altura_por_modelo_profundidade_por_tipo_de_sapateir",
        "atom_06_sapateiras_profundidade_e_altura_por_modelo_altura_de_prateleira_vao_por_tipo"
      ]
    },
    "MALEIROS E NICHOS SUPERIORES": {
      nome: "MALEIROS E NICHOS SUPERIORES",
      categoria: "Closets",
      atomos: [
        "atom_06_maleiros_e_nichos_superiores_altura_minima_e_funcao_do_maleiro",
        "atom_06_maleiros_e_nichos_superiores_nichos_internos_para_itens_dobrados"
      ]
    },
    "GAVETAS DE CLOSET \u2014 PROFUNDIDADES POR CATEGORIA DE ITEM": {
      nome: "GAVETAS DE CLOSET \u2014 PROFUNDIDADES POR CATEGORIA DE ITEM",
      categoria: "Closets",
      atomos: [
        "atom_06_gavetas_de_closet_profundidades_por_categoria_de_item_tabela_de_profundidade_"
      ]
    },
    "METRAGEM E CIRCULA\xC7\xC3O DO AMBIENTE": {
      nome: "METRAGEM E CIRCULA\xC7\xC3O DO AMBIENTE",
      categoria: "Closets",
      atomos: [
        "atom_06_metragem_e_circulacao_do_ambiente_metragem_minima_recomendada_por_perfil_de_c",
        "atom_06_metragem_e_circulacao_do_ambiente_espaco_de_circulacao_em_frente_aos_modulos"
      ]
    },
    "ILUMINA\xC7\xC3O E ESPELHOS": {
      nome: "ILUMINA\xC7\xC3O E ESPELHOS",
      categoria: "Closets",
      atomos: [
        "atom_06_iluminacao_e_espelhos_estrategia_de_iluminacao_por_zona_do_closet",
        "atom_06_iluminacao_e_espelhos_espelhos_e_joalheiros_como_elementos_funcionais"
      ]
    },
    "ALTURA DE BANCADA E PIA": {
      nome: "ALTURA DE BANCADA E PIA",
      categoria: "Banheiros",
      atomos: [
        "atom_07_altura_de_bancada_e_pia_faixa_de_altura_recomendada",
        "atom_07_altura_de_bancada_e_pia_cuba_sobreposta_e_ajuste_de_altura_por_tipo_de_cuba"
      ]
    },
    "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE": {
      nome: "GABINETE SOB A PIA \u2014 SIF\xC3O, VENTILA\xC7\xC3O E UMIDADE",
      categoria: "Banheiros",
      atomos: [
        "atom_07_gabinete_sob_a_pia_sifao_ventilacao_e_umidade_necessidade_do_gabinete_decisao",
        "atom_07_gabinete_sob_a_pia_sifao_ventilacao_e_umidade_prevencao_de_mofo_fundo_aberto_",
        "atom_07_gabinete_sob_a_pia_sifao_ventilacao_e_umidade_gabinete_suspenso_vs_gabinete_c"
      ]
    },
    "ESPELHOS \u2014 ALTURA E DIST\xC2NCIA DA PIA": {
      nome: "ESPELHOS \u2014 ALTURA E DIST\xC2NCIA DA PIA",
      categoria: "Banheiros",
      atomos: [
        "atom_07_espelhos_altura_e_distancia_da_pia_distancia_entre_a_pia_e_a_base_do_espelho"
      ]
    },
    "RODABANCA, FRONT\xC3O E TESTEIRA": {
      nome: "RODABANCA, FRONT\xC3O E TESTEIRA",
      categoria: "Banheiros",
      atomos: [
        "atom_07_rodabanca_frontao_e_testeira_definicoes_e_funcao_de_cada_elemento"
      ]
    },
    "MATERIAIS E RESIST\xCANCIA \xC0 UMIDADE EM BANHEIRO": {
      nome: "MATERIAIS E RESIST\xCANCIA \xC0 UMIDADE EM BANHEIRO",
      categoria: "Banheiros",
      atomos: [
        "atom_07_materiais_e_resistencia_a_umidade_em_banheiro_especificacao_de_material_para_"
      ]
    },
    "ALTURA DE MESA E ERGONOMIA": {
      nome: "ALTURA DE MESA E ERGONOMIA",
      categoria: "Escritorios",
      atomos: [
        "atom_08_altura_de_mesa_e_ergonomia_faixa_de_altura_recomendada_e_referencia_normativa"
      ]
    },
    "POSICIONAMENTO DE MONITOR": {
      nome: "POSICIONAMENTO DE MONITOR",
      categoria: "Escritorios",
      atomos: [
        "atom_08_posicionamento_de_monitor_altura_e_distancia_do_monitor_em_relacao_ao_usuario"
      ]
    },
    "COMPARTIMENTO DE CPU \u2014 VENTILA\xC7\xC3O E SUPORTE": {
      nome: "COMPARTIMENTO DE CPU \u2014 VENTILA\xC7\xC3O E SUPORTE",
      categoria: "Escritorios",
      atomos: [
        "atom_08_compartimento_de_cpu_ventilacao_e_suporte_ventilacao_do_compartimento_de_cpu",
        "atom_08_compartimento_de_cpu_ventilacao_e_suporte_suporte_de_cpu_tipo_pedestal_e_pass"
      ]
    },
    "GEST\xC3O DE CABOS E INFRAESTRUTURA EL\xC9TRICA": {
      nome: "GEST\xC3O DE CABOS E INFRAESTRUTURA EL\xC9TRICA",
      categoria: "Escritorios",
      atomos: [
        "atom_08_gestao_de_cabos_e_infraestrutura_eletrica_estrategias_de_organizacao_de_cabos"
      ]
    },
    "GAVETEIROS DE ESCRIT\xD3RIO \u2014 ESTRUTURA E FERRAGEM": {
      nome: "GAVETEIROS DE ESCRIT\xD3RIO \u2014 ESTRUTURA E FERRAGEM",
      categoria: "Escritorios",
      atomos: [
        "atom_08_gaveteiros_de_escritorio_estrutura_e_ferragem_especificacao_estrutural_de_gav"
      ]
    },
    "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA": {
      nome: "PLANO DE CORTE E NESTING \u2014 OTIMIZA\xC7\xC3O DE APROVEITAMENTO DE CHAPA",
      categoria: "Producao",
      atomos: [
        "atom_09_plano_de_corte_e_nesting_otimizacao_de_aproveitamento_de_chapa_funcao_e_param",
        "atom_09_plano_de_corte_e_nesting_otimizacao_de_aproveitamento_de_chapa_indicadores_de",
        "atom_09_plano_de_corte_e_nesting_otimizacao_de_aproveitamento_de_chapa_seccionadora_v"
      ]
    },
    "SISTEMA 32 \u2014 PADR\xC3O DE FURA\xC7\xC3O SEQUENCIAL": {
      nome: "SISTEMA 32 \u2014 PADR\xC3O DE FURA\xC7\xC3O SEQUENCIAL",
      categoria: "Producao",
      atomos: [
        "atom_09_sistema_32_padrao_de_furacao_sequencial_definicao_e_medidas_padrao_do_sistema",
        "atom_09_sistema_32_padrao_de_furacao_sequencial_gabaritos_de_furacao_e_desafios_de_al"
      ]
    },
    "SEQU\xCANCIA DE USINAGEM (FURO \u2192 RASGO \u2192 CORTE)": {
      nome: "SEQU\xCANCIA DE USINAGEM (FURO \u2192 RASGO \u2192 CORTE)",
      categoria: "Producao",
      atomos: [
        "atom_09_sequencia_de_usinagem_furo_rasgo_corte_ordem_de_operacoes_na_usinagem_cnc"
      ]
    },
    "ETIQUETAGEM E RASTREABILIDADE DE PE\xC7AS": {
      nome: "ETIQUETAGEM E RASTREABILIDADE DE PE\xC7AS",
      categoria: "Producao",
      atomos: [
        "atom_09_etiquetagem_e_rastreabilidade_de_pecas_funcao_das_etiquetas_de_identificacao_"
      ]
    },
    "DIMENS\xD5ES-PADR\xC3O DE ELEVADOR PREDIAL E PORTA DE ACESSO": {
      nome: "DIMENS\xD5ES-PADR\xC3O DE ELEVADOR PREDIAL E PORTA DE ACESSO",
      categoria: "Transporte",
      atomos: [
        "atom_10_dimensoes_padrao_de_elevador_predial_e_porta_de_acesso_medidas_de_referencia_",
        "atom_10_dimensoes_padrao_de_elevador_predial_e_porta_de_acesso_porta_de_acesso_e_vao_"
      ]
    },
    "I\xC7AMENTO VS. DESMONTAGEM \u2014 CRIT\xC9RIO DE DECIS\xC3O": {
      nome: "I\xC7AMENTO VS. DESMONTAGEM \u2014 CRIT\xC9RIO DE DECIS\xC3O",
      categoria: "Transporte",
      atomos: [
        "atom_10_icamento_vs_desmontagem_criterio_de_decisao_quando_optar_por_icamento_externo",
        "atom_10_icamento_vs_desmontagem_criterio_de_decisao_equipamentos_de_apoio_para_transp"
      ]
    },
    "DIVIS\xC3O DE PE\xC7AS GRANDES PARA TRANSPORTE": {
      nome: "DIVIS\xC3O DE PE\xC7AS GRANDES PARA TRANSPORTE",
      categoria: "Transporte",
      atomos: [
        "atom_10_divisao_de_pecas_grandes_para_transporte_priorizacao_de_desmontagem_antes_do_",
        "atom_10_divisao_de_pecas_grandes_para_transporte_reducao_de_manipulacao_como_principi"
      ]
    },
    "ACONDICIONAMENTO E ORGANIZA\xC7\xC3O DE CARGA": {
      nome: "ACONDICIONAMENTO E ORGANIZA\xC7\xC3O DE CARGA",
      categoria: "Transporte",
      atomos: [
        "atom_10_acondicionamento_e_organizacao_de_carga_distribuicao_de_peso_e_organizacao_po"
      ]
    },
    "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA": {
      nome: "SEQU\xCANCIA COMPLETA DE MONTAGEM EM OBRA",
      categoria: "Montagem",
      atomos: [
        "atom_11_sequencia_completa_de_montagem_em_obra_fase_de_planejamento_e_inspecao_previa",
        "atom_11_sequencia_completa_de_montagem_em_obra_montagem_da_caixa_estrutura_interna_de",
        "atom_11_sequencia_completa_de_montagem_em_obra_fixacao_reforco_de_juntas_e_instalacao",
        "atom_11_sequencia_completa_de_montagem_em_obra_ajuste_fino_instalacao_de_acessorios_e"
      ]
    },
    "FERRAMENTAS NECESS\xC1RIAS POR TIPO DE MONTAGEM": {
      nome: "FERRAMENTAS NECESS\xC1RIAS POR TIPO DE MONTAGEM",
      categoria: "Montagem",
      atomos: [
        "atom_11_ferramentas_necessarias_por_tipo_de_montagem_ferramentas_basicas_vs_ferrament",
        "atom_11_ferramentas_necessarias_por_tipo_de_montagem_componentes_e_verificacao_pre_mo"
      ]
    },
    "AJUSTE FINO E REGULAGEM DE FERRAGENS": {
      nome: "AJUSTE FINO E REGULAGEM DE FERRAGENS",
      categoria: "Montagem",
      atomos: [
        "atom_11_ajuste_fino_e_regulagem_de_ferragens_regulagem_tridimensional_como_etapa_nao_"
      ]
    },
    "BOAS PR\xC1TICAS DE CONTRATA\xC7\xC3O E GARANTIA": {
      nome: "BOAS PR\xC1TICAS DE CONTRATA\xC7\xC3O E GARANTIA",
      categoria: "Montagem",
      atomos: [
        "atom_11_boas_praticas_de_contratacao_e_garantia_criterios_de_avaliacao_de_montador_pr"
      ]
    },
    "REDU\xC7\xC3O DE DESPERD\xCDCIO VIA PLANO DE CORTE": {
      nome: "REDU\xC7\xC3O DE DESPERD\xCDCIO VIA PLANO DE CORTE",
      categoria: "Economia",
      atomos: [
        "atom_12_reducao_de_desperdicio_via_plano_de_corte_onde_a_marcenaria_perde_dinheiro_o_",
        "atom_12_reducao_de_desperdicio_via_plano_de_corte_boas_praticas_de_planejamento_de_co"
      ]
    },
    "REAPROVEITAMENTO DE RETALHOS E SOBRAS": {
      nome: "REAPROVEITAMENTO DE RETALHOS E SOBRAS",
      categoria: "Economia",
      atomos: [
        "atom_12_reaproveitamento_de_retalhos_e_sobras_transformando_sobras_de_mdf_em_oportuni",
        "atom_12_reaproveitamento_de_retalhos_e_sobras_reducao_de_erro_humano_como_beneficio_c"
      ]
    },
    "PADRONIZA\xC7\xC3O DE PROCESSO \u2014 5S E MELHORIA CONT\xCDNUA": {
      nome: "PADRONIZA\xC7\xC3O DE PROCESSO \u2014 5S E MELHORIA CONT\xCDNUA",
      categoria: "Economia",
      atomos: [
        "atom_12_padronizacao_de_processo_5s_e_melhoria_continua_metodologia_5s_aplicada_a_mar"
      ]
    },
    "INDICADORES DE APROVEITAMENTO E GEST\xC3O POR DADOS": {
      nome: "INDICADORES DE APROVEITAMENTO E GEST\xC3O POR DADOS",
      categoria: "Economia",
      atomos: [
        "atom_12_indicadores_de_aproveitamento_e_gestao_por_dados_kpis_de_aproveitamento_de_ch"
      ]
    }
  }
};

// src/lib/base-conhecimento/index.ts
var ATOMOS = knowledge_base_consolidada_default.atomos;
var ENTIDADES = entidades_default.entidades;
var TOTAL_ATOMOS = ATOMOS.length;
function buscarAtomos(filtro = {}) {
  const texto = filtro.texto?.toLowerCase().trim();
  const tags = filtro.tags?.map((t) => t.toLowerCase());
  const cats = (filtro.categorias ?? (filtro.categoria ? [filtro.categoria] : [])).map((c) => c.toLowerCase());
  const res = ATOMOS.filter((a) => {
    if (cats.length && !cats.includes(a.categoria.toLowerCase())) return false;
    if (filtro.entidade && !a.entidade.toLowerCase().includes(filtro.entidade.toLowerCase())) return false;
    if (filtro.tipo && a.tipo !== filtro.tipo) return false;
    if (typeof filtro.confiancaMin === "number" && a.confianca.score < filtro.confiancaMin) return false;
    if (tags?.length) {
      const atags = a.tags.map((t) => t.toLowerCase());
      if (!tags.some((t) => atags.includes(t))) return false;
    }
    if (texto) {
      const hay = `${a.titulo} ${a.descricao} ${a.entidade} ${a.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(texto)) return false;
    }
    return true;
  });
  const pesoPrioridade = { "cr\xEDtico": 4, "alto": 3, "m\xE9dio": 2, "baixo": 1, "nenhum": 0 };
  return res.sort((a, b) => b.confianca.score - a.confianca.score || (pesoPrioridade[b.prioridade] ?? 0) - (pesoPrioridade[a.prioridade] ?? 0));
}
function resumirParaPrompt(atomos, max = 20) {
  return atomos.slice(0, max).map((a) => {
    const partes = [
      `\u2022 [${a.id}] ${a.titulo} (${a.tipo}, conf ${a.confianca.score})`,
      `  ${a.descricao.replace(/\s*\[cf\.[^\]]*\]/g, "").trim()}`
    ];
    if (a.condicoes.quando_aplicar) partes.push(`  Quando: ${a.condicoes.quando_aplicar}`);
    if (a.restricoes.quando_nao_aplicar) partes.push(`  N\xE3o aplicar: ${a.restricoes.quando_nao_aplicar}`);
    return partes.join("\n");
  }).join("\n\n");
}

// src/server/http/agent.ts
var config = { maxDuration: 60 };
var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
var tools = [
  {
    type: "function",
    function: {
      name: "buscar_clientes",
      description: "Busca clientes/leads pelo nome, email, telefone ou cidade. Use antes de assumir que um cliente existe ou n\xE3o.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Texto para buscar (nome, email, telefone ou cidade)" }
        },
        required: ["q"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listar_orcamentos",
      description: "Lista or\xE7amentos/contratos da empresa. Pode filtrar por status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["rascunho", "analise", "aprovado", "recusado"],
            description: "Filtrar por status (opcional)"
          },
          cliente_id: { type: "string", description: "ID do cliente para filtrar (opcional)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resumo_financeiro",
      description: "Retorna o resumo financeiro do m\xEAs atual: receitas, despesas e saldo.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "listar_projetos",
      description: "Lista projetos da empresa.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status: planejamento, em_andamento, concluido, cancelado" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_cliente",
      description: "Cria um novo cliente/lead. IMPORTANTE: s\xF3 use quando tiver pelo menos o nome confirmado pelo usu\xE1rio.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome completo ou raz\xE3o social" },
          email: { type: "string", description: "Email" },
          telefone: { type: "string", description: "Telefone ou WhatsApp" },
          cidade: { type: "string", description: "Cidade" },
          origem: { type: "string", description: "Canal de origem: Indica\xE7\xE3o, Instagram, Google, Facebook, Direto, Arquiteto parceiro, Outro" },
          observacoes: { type: "string", description: "Observa\xE7\xF5es adicionais" }
        },
        required: ["nome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_orcamento",
      description: "Cria um or\xE7amento b\xE1sico para um cliente com lista de m\xF3veis. Use quando o usu\xE1rio pedir para criar um or\xE7amento e fornecer os dados necess\xE1rios.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente (ser\xE1 buscado pelo nome)" },
          descricao: { type: "string", description: "Descri\xE7\xE3o do projeto" },
          ambiente: { type: "string", description: "Ambiente principal: Cozinha, Sala, Quarto, Escrit\xF3rio, etc." },
          moveis_lista: { type: "array", items: { type: "string" }, description: "Lista de m\xF3veis solicitados, ex: ['Roupeiro 2m', 'Guarda-roupa com espelho']" }
        },
        required: ["cliente_nome", "moveis_lista"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "atualizar_status_orcamento",
      description: "Atualiza o status de um or\xE7amento existente. Use para mover de rascunho \u2192 an\xE1lise \u2192 aprovado, ou para recusar.",
      parameters: {
        type: "object",
        properties: {
          orcamento_id: { type: "string", description: "ID do or\xE7amento (obtenha via listar_orcamentos)" },
          novo_status: { type: "string", enum: ["rascunho", "analise", "aprovado", "recusado"], description: "Novo status do or\xE7amento" }
        },
        required: ["orcamento_id", "novo_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_orcamento_detalhes",
      description: "Busca os detalhes completos de um or\xE7amento espec\xEDfico, incluindo itens, valores e cliente.",
      parameters: {
        type: "object",
        properties: {
          orcamento_id: { type: "string", description: "ID do or\xE7amento" }
        },
        required: ["orcamento_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_conhecimento",
      description: 'Busca na base de conhecimento t\xE9cnico de marcenaria (normas, regras de fabrica\xE7\xE3o, dicas de produ\xE7\xE3o \u2014 ex.: "qual broca usar no Minifix", "dist\xE2ncia m\xEDnima de dobradi\xE7a"). Use quando o usu\xE1rio fizer uma pergunta t\xE9cnica sobre marcenaria, n\xE3o sobre dados do sistema (clientes/or\xE7amentos).',
      parameters: {
        type: "object",
        properties: {
          pergunta: { type: "string", description: "A pergunta t\xE9cnica do usu\xE1rio, em texto livre" },
          categoria: { type: "string", description: "Categoria pra restringir a busca (opcional): Cozinhas, Ferragens, Estrutura, Portas e Gavetas, Materiais, Closets, Banheiros, Escrit\xF3rios, Produ\xE7\xE3o, Transporte, Montagem, Economia" }
        },
        required: ["pergunta"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_projeto",
      description: "Cria um novo projeto de marcenaria vinculado a um cliente. Use quando o usu\xE1rio pedir para criar um projeto.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do projeto" },
          cliente_nome: { type: "string", description: "Nome do cliente (ser\xE1 buscado)" },
          descricao: { type: "string", description: "Descri\xE7\xE3o do projeto" },
          status: { type: "string", enum: ["briefing", "projeto", "aprovacao", "producao"], description: "Status inicial (padr\xE3o: briefing)" }
        },
        required: ["nome"]
      }
    }
  }
];
async function estimarPrecos(moveis, contexto, groqKey, catalogoRef) {
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Voc\xEA \xE9 especialista em precifica\xE7\xE3o de marcenaria planejada no Brasil (2025). Responda APENAS com JSON v\xE1lido, sem texto fora do JSON."
          },
          {
            role: "user",
            content: `Estime o pre\xE7o de custo e pre\xE7o de venda ao cliente de cada item abaixo. Contexto: ${contexto || "projeto de marcenaria planejada"}.

Itens:
${moveis.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Responda exatamente neste formato JSON (array, sem texto extra):
[{"descricao":"nome do item","preco_custo":0,"preco_venda":0}]

${catalogoRef ? `Use o cat\xE1logo de pre\xE7os REAL desta marcenaria como base (pre\xE7os em R$):
${catalogoRef}` : "Refer\xEAncia de mercado 2025: MDF R$85/chapa, m\xE3o de obra 40% do MDF, margem t\xEDpica 2.5x a 3x o custo."}`
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      })
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const content = data.choices[0]?.message?.content ?? "[]";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}
var STOPWORDS_BUSCA = /* @__PURE__ */ new Set([
  "qual",
  "quais",
  "quando",
  "onde",
  "como",
  "porque",
  "por",
  "que",
  "para",
  "pela",
  "pelo",
  "pelos",
  "pelas",
  "esse",
  "essa",
  "isso",
  "este",
  "esta",
  "isto",
  "aquele",
  "aquela",
  "aquilo",
  "sobre",
  "ent\xE3o"
]);
function buscarConhecimentoTool(pergunta, categoria) {
  let atomos = buscarAtomos({ texto: pergunta, categoria });
  if (atomos.length === 0 && categoria) atomos = buscarAtomos({ categoria });
  if (atomos.length === 0) {
    const palavras = pergunta.toLowerCase().split(/\s+/).filter((p) => p.length > 3 && !STOPWORDS_BUSCA.has(p)).sort((a, b) => b.length - a.length);
    for (const p of palavras) {
      atomos = buscarAtomos({ texto: p });
      if (atomos.length > 0) break;
    }
  }
  if (atomos.length === 0) {
    return { encontrado: false, mensagem: "Nada encontrado na base de conhecimento pra essa pergunta." };
  }
  return {
    encontrado: true,
    total: atomos.length,
    resumo: resumirParaPrompt(atomos, 8)
  };
}
async function executeTool(name, args, supabase, empresaId, groqKey) {
  switch (name) {
    case "buscar_clientes": {
      const q = String(args.q ?? "").toLowerCase();
      const { data, error } = await supabase.from("clientes").select("id,nome,email,telefone,cidade,origem,created_at").eq("empresa_id", empresaId).or(`nome.ilike.%${q}%,email.ilike.%${q}%,telefone.ilike.%${q}%,cidade.ilike.%${q}%`).order("nome").limit(10);
      if (error) return { erro: error.message };
      return { clientes: data ?? [], total: (data ?? []).length };
    }
    case "listar_orcamentos": {
      let query = supabase.from("orcamentos").select("id,numero,status,total,created_at,clientes(nome)").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(15);
      if (args.status) query = query.eq("status", args.status);
      if (args.cliente_id) query = query.eq("cliente_id", args.cliente_id);
      const { data, error } = await query;
      if (error) return { erro: error.message };
      return { orcamentos: data ?? [], total: (data ?? []).length };
    }
    case "resumo_financeiro": {
      const hoje = /* @__PURE__ */ new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const { data, error } = await supabase.from("financeiro").select("tipo,valor,status,descricao").eq("empresa_id", empresaId).gte("created_at", inicioMes);
      if (error) return { erro: error.message };
      const rows = data ?? [];
      const receitas = rows.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
      const despesas = rows.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
      return {
        mes: hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        receitas,
        despesas,
        saldo: receitas - despesas,
        total_lancamentos: rows.length
      };
    }
    case "listar_projetos": {
      let query = supabase.from("projetos").select("id,nome,status,created_at,clientes(nome)").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(15);
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query;
      if (error) return { erro: error.message };
      return { projetos: data ?? [], total: (data ?? []).length };
    }
    case "criar_cliente": {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("clientes").insert({
        empresa_id: empresaId,
        created_by: userData?.user?.id,
        nome: args.nome,
        email: args.email ?? null,
        telefone: args.telefone ?? null,
        cidade: args.cidade ?? null,
        origem: args.origem ?? null,
        observacoes: args.observacoes ?? null
      }).select("id,nome,email,telefone,cidade").single();
      if (error) return { erro: error.message };
      return { sucesso: true, cliente: data };
    }
    case "criar_orcamento": {
      const { data: clientes } = await supabase.from("clientes").select("id,nome").eq("empresa_id", empresaId).ilike("nome", `%${String(args.cliente_nome ?? "")}%`).limit(1);
      const cliente = clientes?.[0];
      if (!cliente) return { erro: `Cliente "${args.cliente_nome}" n\xE3o encontrado. Crie o cliente primeiro com criar_cliente.` };
      const numero = `ORC-${Date.now().toString().slice(-6)}`;
      const moveis = args.moveis_lista;
      const contexto = [args.ambiente, args.descricao].filter(Boolean).join(" \u2014 ");
      const { data: materiaisEmpresa } = await supabase.from("materiais").select("nome, preco_custo, preco_venda, categoria").eq("empresa_id", empresaId);
      const catalogoRef = (materiaisEmpresa ?? []).slice(0, 40).map((m) => `${m.nome}: custo R$${m.preco_custo}, venda R$${m.preco_venda}`).join("\n") || void 0;
      const precos = await estimarPrecos(moveis, contexto, groqKey, catalogoRef);
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
          total: vendaPecaCalc
        };
      });
      const totalVenda = itensComPreco.reduce((s, i) => s + i.total, 0);
      const { data: orc, error: orcErr } = await supabase.from("orcamentos").insert({
        empresa_id: empresaId,
        cliente_id: cliente.id,
        numero,
        status: "rascunho",
        total: totalVenda,
        subtotal,
        // BUG 7: margem_pct é MULTIPLICADOR (venda/custo × 100). Os preços da IA
        // já são absolutos, então grava-se a margem REAL, não 300 fixo.
        margem_pct: Math.round(totalVenda / Math.max(1, subtotal) * 100),
        observacoes: args.descricao ? String(args.descricao) : `Projeto: ${moveis.join(", ")}`
      }).select("id,numero").single();
      if (orcErr) return { erro: orcErr.message };
      await supabase.from("orcamento_itens").insert(
        itensComPreco.map((i) => ({ ...i, orcamento_id: orc.id }))
      );
      return {
        sucesso: true,
        numero: orc.numero,
        cliente: cliente.nome,
        ambiente: args.ambiente ?? "N\xE3o especificado",
        moveis: moveis.length,
        total: itensComPreco.reduce((s, i) => s + i.total, 0),
        mensagem: `Or\xE7amento ${orc.numero} criado para ${cliente.nome} com ${moveis.length} item(ns) e valores estimados pela IA. Total: R$ ${itensComPreco.reduce((s, i) => s + i.total, 0).toLocaleString("pt-BR")}. Acesse Or\xE7amentos para revisar e ajustar.`
      };
    }
    case "atualizar_status_orcamento": {
      const { error } = await supabase.from("orcamentos").update({ status: String(args.novo_status) }).eq("id", String(args.orcamento_id)).eq("empresa_id", empresaId);
      if (error) return { erro: error.message };
      return { sucesso: true, mensagem: `Status do or\xE7amento atualizado para "${args.novo_status}".` };
    }
    case "buscar_orcamento_detalhes": {
      const { data: orc, error } = await supabase.from("orcamentos").select("id,numero,status,total,subtotal,margem_pct,observacoes,created_at,clientes(nome,email,telefone),orcamento_itens(descricao,quantidade,preco_custo,preco_unitario,total)").eq("id", String(args.orcamento_id)).eq("empresa_id", empresaId).single();
      if (error) return { erro: error.message };
      if (!orc) return { erro: "Or\xE7amento n\xE3o encontrado." };
      return orc;
    }
    case "buscar_conhecimento":
      return buscarConhecimentoTool(String(args.pergunta ?? ""), args.categoria ? String(args.categoria) : void 0);
    case "criar_projeto": {
      let clienteId = null;
      if (args.cliente_nome) {
        const { data: cls } = await supabase.from("clientes").select("id,nome").eq("empresa_id", empresaId).ilike("nome", `%${String(args.cliente_nome)}%`).limit(1);
        clienteId = cls?.[0]?.id ?? null;
        if (!clienteId) return { erro: `Cliente "${args.cliente_nome}" n\xE3o encontrado. Crie o cliente primeiro.` };
      }
      const { data: projeto, error } = await supabase.from("projetos").insert({
        empresa_id: empresaId,
        nome: args.nome,
        descricao: args.descricao ?? null,
        status: args.status ?? "briefing",
        cliente_id: clienteId
      }).select("id,nome,status").single();
      if (error) return { erro: error.message };
      return { sucesso: true, projeto, mensagem: `Projeto "${args.nome}" criado com status "${args.status ?? "briefing"}".` };
    }
    default:
      return { erro: `Ferramenta desconhecida: ${name}` };
  }
}
var SYSTEM = `Voc\xEA \xE9 o Grat, assistente IA do Planne \u2014 sistema de gest\xE3o para marcenarias planejadas.
Voc\xEA tem acesso a ferramentas para consultar e manipular dados reais do sistema.

REGRAS IMPORTANTES:
- NUNCA execute a\xE7\xF5es (criar, modificar) sem ter as informa\xE7\xF5es necess\xE1rias confirmadas pelo usu\xE1rio.
- Se faltar informa\xE7\xE3o essencial, pergunte PRIMEIRO antes de usar qualquer ferramenta de cria\xE7\xE3o.
- Ao mencionar um cliente, sempre use buscar_clientes primeiro para verificar se existe.
- Seja conciso e direto. Use bullet points ao listar itens.
- Responda sempre em portugu\xEAs brasileiro.
- Ao criar registros, confirme o que foi criado com um resumo claro.
- Para a\xE7\xF5es destrutivas (excluir), pe\xE7a confirma\xE7\xE3o expl\xEDcita.

O QUE VOC\xCA PODE FAZER:
- Buscar e criar clientes/leads
- Listar, consultar detalhes e atualizar status de or\xE7amentos
- Ver resumo financeiro
- Listar e criar projetos
- CRIAR or\xE7amentos com valores estimados automaticamente: use criar_orcamento com o nome do cliente e a lista de m\xF3veis \u2014 a IA estimar\xE1 pre\xE7os de custo e venda para cada item.
- ATUALIZAR status de or\xE7amento: use atualizar_status_orcamento (rascunho \u2192 analise \u2192 aprovado \u2192 recusado).
- CRIAR projetos: use criar_projeto com nome, cliente e status inicial.
- RESPONDER perguntas t\xE9cnicas de marcenaria (normas, regras de fabrica\xE7\xE3o, dicas de produ\xE7\xE3o): use buscar_conhecimento. Sempre que citar algo vindo dela, mencione que \xE9 uma refer\xEAncia t\xE9cnica da base (n\xE3o invente n\xFAmeros que n\xE3o vieram do resultado da ferramenta).

O QUE VOC\xCA N\xC3O FAZ (redirecione para o sistema):
- CRIAR ordens de produ\xE7\xE3o: diga "Acesse **Produ\xE7\xE3o** no menu lateral."
- Calcular quantidades detalhadas de chapas/pe\xE7as \u2014 isso requer o m\xF3dulo IA de projetos.`;
var PRECO_GROQ_INPUT_POR_1M = 0.59;
var PRECO_GROQ_OUTPUT_POR_1M = 0.79;
async function registrarUsoIA(supabase, empresaId, tokensInput, tokensOutput) {
  if (tokensInput === 0 && tokensOutput === 0) return;
  const custo_usd = tokensInput / 1e6 * PRECO_GROQ_INPUT_POR_1M + tokensOutput / 1e6 * PRECO_GROQ_OUTPUT_POR_1M;
  try {
    await supabase.from("ai_usage").insert({
      empresa_id: empresaId,
      tipo: "chat",
      modelo: "llama-3.3-70b-versatile",
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      custo_usd,
      referencia_tipo: "agent_chat"
    });
  } catch {
  }
}
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { messages } = req.body ?? {};
  const userToken = auth.token;
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY n\xE3o configurada" });
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return res.status(500).json({ error: "Supabase n\xE3o configurado no servidor" });
  const supabase = createClient2(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${userToken}` } }
  });
  const { data: membroData, error: membroError } = await supabase.from("empresa_membros").select("empresa_id").maybeSingle();
  if (membroError) {
    return res.status(500).json({ error: "Erro ao buscar empresa do usu\xE1rio" });
  }
  if (!membroData?.empresa_id) {
    return res.status(400).json({
      error: "Usu\xE1rio n\xE3o vinculado a nenhuma empresa. Solicite um convite ao administrador."
    });
  }
  const empresaId = membroData.empresa_id;
  const history = [{ role: "system", content: SYSTEM }, ...messages];
  const toolCallsSummary = [];
  let tokensInputTotal = 0;
  let tokensOutputTotal = 0;
  for (let iter = 0; iter < 6; iter++) {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: history,
        tools,
        tool_choice: "auto",
        max_tokens: 1200,
        temperature: 0.2
      })
    });
    if (!response.ok) {
      const err = await response.text();
      await registrarUsoIA(supabase, empresaId, tokensInputTotal, tokensOutputTotal);
      return res.status(500).json({ error: `Groq: ${err}` });
    }
    const data = await response.json();
    tokensInputTotal += data.usage?.prompt_tokens ?? 0;
    tokensOutputTotal += data.usage?.completion_tokens ?? 0;
    const msg = data.choices[0].message;
    history.push(msg);
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      await registrarUsoIA(supabase, empresaId, tokensInputTotal, tokensOutputTotal);
      return res.json({
        text: msg.content ?? "",
        toolCalls: toolCallsSummary,
        provider: "groq"
      });
    }
    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments);
      const result = await executeTool(tc.function.name, args, supabase, empresaId, groqKey);
      toolCallsSummary.push({ name: tc.function.name, result });
      history.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result)
      });
    }
  }
  await registrarUsoIA(supabase, empresaId, tokensInputTotal, tokensOutputTotal);
  return res.status(500).json({ error: "Agente n\xE3o convergiu em 6 itera\xE7\xF5es" });
}
export {
  buscarConhecimentoTool,
  config,
  handler as default
};
