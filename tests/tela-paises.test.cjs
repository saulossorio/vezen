// Testes de tela de outros países: o campo País na análise, o México com RFC, estados, pesos e só o Método Vezen,
// a lista de empresas e a exportação com a moeda de cada empresa, e a seção México em Métodos.
const { chromium } = require('playwright-core');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  for (const largura of [1360, 375]) {
    const ctx = await b.newContext({ viewport: { width: largura, height: 900 } });
    const p = await ctx.newPage(), erros = [], suf = largura < 500 ? ' (celular)' : '';
    p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await p.route('**/brasilapi.com.br/**', r => r.abort());
    await p.goto(URL);
    const ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(350); };
    // tela inicial: cartões com o país e o filtro por país
    await ir('#/empresas');
    const chips = await p.$$eval('.comecos-met .comeco', cs => cs.map(c => c.dataset.v + ':' + (c.querySelector('.pais-chip') || {}).textContent).join());
    check('cartões dos métodos com o país' + suf, chips === 'base:Brasil,padrao:Brasil,fgv:Brasil,propria:Brasil,mx:México', chips);
    const ops = await p.$$eval('#f-filtro-pais option', os => os.map(o => o.textContent + (o.disabled ? '*' : '')).join('|'));
    check('filtro por país: Brasil e México; os outros em breve e desabilitados' + suf, ops === 'Todos os países|Brasil|México|Argentina (em breve)*|Chile (em breve)*|Colômbia (em breve)*|Estados Unidos (em breve)*|Peru (em breve)*', ops);
    await p.selectOption('#f-filtro-pais', 'MX'); await p.waitForTimeout(300);
    check('filtro México mostra só o Método Vezen México' + suf, (await p.$$eval('.comecos-met .comeco', cs => cs.map(c => c.dataset.v).join())) === 'mx' && (await txt(p, '.comecos-met .comeco b')) === 'Método Vezen');
    await p.selectOption('#f-filtro-pais', 'BR'); await p.waitForTimeout(300);
    check('filtro Brasil mostra os quatro métodos do Brasil' + suf, (await p.$$eval('.comecos-met .comeco', cs => cs.map(c => c.dataset.v).join())) === 'base,padrao,fgv,propria');
    await p.selectOption('#f-filtro-pais', ''); await p.waitForTimeout(300);
    // análise nova no Método Vezen México
    await p.evaluate(() => novaAnalise()); await p.waitForTimeout(300);
    await p.click('[data-acao=escolher-modo][data-v=mx]'); await p.waitForTimeout(400);
    check('sem campo País: o país vem do método' + suf, await p.locator('#f-pais').count() === 0 && await p.evaluate(() => UI.atual.dados.pais === 'MX' && modoDe(UI.atual.dados) === 'mx'));
    check('México: campo RFC no lugar do CNPJ, sem lupa' + suf, await p.locator('label[for=f-cnpj]').innerText() === 'RFC' && await p.locator('[data-acao=buscar-cnpj]').count() === 0);
    check('México: estados mexicanos pelo nome' + suf, (await p.$$eval('#f-uf option', os => os.map(o => o.textContent))).includes('Jalisco'));
    await p.selectOption('#f-natureza', 'pequena'); await p.waitForTimeout(300);
    check('México: sem enquadramento brasileiro' + suf, await p.locator('#f-enquadramento').count() === 0);
    await p.selectOption('#f-natureza', 'privada'); await p.waitForTimeout(300);
    check('México: receita em MX$' + suf, (await txt(p, '.campo-rec .input-addon')) === 'MX$');
    await p.fill('#f-cnpj', 'ABC0102'); await p.locator('#f-cnpj').blur(); await p.waitForTimeout(150);
    check('RFC incompleto avisa' + suf, /Formato de RFC/.test(await txt(p, '#v-cnpj')));
    await p.fill('#f-cnpj', 'abc010203xy1'); await p.locator('#f-cnpj').blur(); await p.waitForTimeout(150);
    check('RFC válido em maiúsculas, sem aviso' + suf, await p.inputValue('#f-cnpj') === 'ABC010203XY1' && (await txt(p, '#v-cnpj')) === '');
    await p.fill('#f-nome', 'Indústria Teste MX'); await p.selectOption('#f-setor', 'industria'); await p.selectOption('#f-uf', 'NL'); await p.waitForTimeout(250);
    await p.fill('#f-funcionarios', '1000'); await p.locator('#f-funcionarios').blur(); await p.waitForTimeout(400);
    const cartao = await txt(p, '#app');
    check('cartão em MX$' + suf, /MX\$ [\d.,]+ (mi|bi)/.test(cartao) && !/R\$ [\d.,]+ (mi|bi)/.test(cartao));
    check('no México, só o Método Vezen México no cartão, sem só CAPEX' + suf, await p.evaluate(() => modoDe(UI.atual.dados)) === 'mx' && (await p.$$eval('#painel input[data-modo]', is => is.map(i => i.value).join())) === 'mx' && await p.locator('#f-escopo').count() === 0);
    check('termos do México: segmento, estado de resultados, sem faturamento bruto' + suf, (await txt(p, 'label[for=f-setor]')) === 'Segmento' && await p.locator('input[name=fatTipo]').count() === 0 && await p.evaluate(() => rotOrigem('oficial', true) === 'Estado de resultados'));
    const prompt = await p.evaluate(() => textoPromptIA(UI.atual.dados));
    check('pedido à IA do México: RFC, estado de resultados, pesos, segmentos da lista' + suf, /RFC/.test(prompt) && /estado de resultados/.test(prompt) && /pesos/.test(prompt) && /Agronegócio/.test(prompt) && !/CNPJ|CVM|DRE|Brasil|reais/.test(prompt), (prompt.match(/CNPJ|CVM|DRE|Brasil|reais/g) || []).join());
    await p.evaluate(() => { const d = UI.atual.dados; d.semDado = d.semDado || {}; for (const c of pendentes(d)) d.semDado[c] = CAMPOS_SEM_DADO[c].ops[0]; });
    await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(400);
    // uma empresa brasileira ao lado
    await p.evaluate(() => { const e = novaEmpresa(); Object.assign(e.dados, { nome: 'Empresa BR', setor: 'industria', uf: 'SP', funcionarios: { v: 1000, o: 'oficial' } }); S.empresas.push(e); salvar(); });
    await ir('#/empresas');
    const lista = await txt(p, '#emp-lista');
    check('lista: cada empresa na sua moeda' + suf, /MX\$/.test(lista) && /R\$/.test(lista) && /RFC ABC010203XY1/.test(lista) && /México/.test(lista));
    const tab = await p.evaluate(() => tabelaEmpresas(null));
    const iMoeda = tab.colunas.findIndex(c => c.t === 'Moeda');
    check('exportação com País e Moeda, sem o formato de reais' + suf, iMoeda > 0 && tab.linhas.some(l => l[iMoeda] === 'MXN') && tab.linhas.some(l => l[iMoeda] === 'BRL') && !tab.colunas.some(c => c.tipo === 'rs'));
    // o resumo do México não fala do Brasil
    await p.evaluate(() => navegar('#/analise/' + S.empresas[0].id)); await p.waitForTimeout(400);
    const res = await p.evaluate(() => { const d = UI.atual.dados; return textoResumo(d, calc(d)); });
    check('resumo do México em pesos, sem termos do Brasil' + suf, /MX\$/.test(res) && /MXN/.test(res) && !/CNPJ|DRE|R\$|BRL|Brasscom|FGV/.test(res), (res.match(/CNPJ|DRE|R\$|BRL|Brasscom|FGV/g) || []).join());
    // Métodos, México
    await ir('#/metodos/mx-visao'); await p.waitForTimeout(800);
    const ids = await p.$$eval('section.met-sec[id^=mx-]', ss => ss.map(x => x.id).join());
    check('Métodos: grupo Método Vezen México com sete seções' + suf, ids === 'mx-visao,mx-receita,mx-caminhos,mx-ajustes,mx-incerteza,mx-setores,mx-fontes', ids);
    const mxd = (await p.$$eval('section.met-sec[id^=mx-]', ss => ss.map(x => x.innerText).join(' '))).replace(/\s+/g, ' ');
    check('Métodos México: explica receita, caminhos, porte, nível, câmbio e limites, em pesos' + suf, /estado de resultados/.test(mxd) && /Censo Económico/.test(mxd) && /0,50/.test(mxd) && /4,7%/.test(mxd) && /20,7862/.test(mxd) && /Devengada/.test(mxd) && /251 ou mais/.test(mxd) && !/R\$/.test(mxd), (mxd.match(/R\$.{0,20}/g) || []).join(' | '));
    const lado = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check('sem rolagem lateral em Métodos' + suf, lado <= 1, String(lado));
    check('sem erros de JavaScript' + suf, !erros.length, erros.join(' | '));
    await ctx.close();
  }
  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  process.exitCode = falhas.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
