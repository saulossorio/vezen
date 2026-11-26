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
    // análise nova no Método Vezen, depois México
    await p.evaluate(() => novaAnalise()); await p.waitForTimeout(300);
    await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(300);
    check('campo País começa no Brasil' + suf, await p.inputValue('#f-pais') === 'BR');
    await p.selectOption('#f-pais', 'MX'); await p.waitForTimeout(400);
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
    check('só o Método Vezen no México' + suf, await p.evaluate(() => modoDe(UI.atual.dados)) === 'base' && await p.locator('input[data-modo]').count() <= 1);
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
    // voltar para o Brasil apaga o que é do México
    await p.evaluate(() => navegar('#/analise/' + S.empresas[0].id)); await p.waitForTimeout(400);
    await p.selectOption('#f-pais', 'BR'); await p.waitForTimeout(400);
    check('de volta ao Brasil: CNPJ com lupa, UF e R$' + suf, await p.locator('[data-acao=buscar-cnpj]').count() === 1 && await p.inputValue('#f-cnpj') === '' && (await txt(p, '.campo-rec .input-addon')) === 'R$');
    // Métodos, México
    await ir('#/metodos/met-mexico'); await p.waitForTimeout(800);
    const mx = await txt(p, '#met-mexico');
    check('Métodos: seção México com nível, setores, câmbio e o que não existe' + suf, /0,50/.test(mx) && /4,7%/.test(mx) && /Censos Económicos 2024/.test(mx) && /20,7862/.test(mx) && /O que não existe no México/.test(mx));
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
