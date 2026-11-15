// Testes de tela do ajuste por cidade: campo Município com a lista do IBGE, Método Personalizado com cidades (planilha e formulário), valores, detalhe, resumo,
// a versão provisória do CR1 sem cidades e a consulta de CNPJ.
const { chromium } = require('playwright-core');
const path = require('path'), os = require('os');
const D = path.join(__dirname, 'dados'), TMP = os.tmpdir();
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
// campo vazio sem motivo bloqueia salvar e copiar o resumo: nos testes que não são do marcador, todos os pendentes recebem um motivo
const explicar = p => p.evaluate(() => { const d = UI.atual.dados; d.semDado = d.semDado || {}; for (const c of pendentes(d)) d.semDado[c] = CAMPOS_SEM_DADO[c].ops[0]; atualizarSemDado(); atualizarCabecalho(); });
const salvarAnalise = async (p, espera = 300) => { await explicar(p); await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(espera); };
const mi = s => { const m = /R\$ ([\d.,]+) mi/.exec(s); return m ? +m[1].replace(/\./g, '').replace(',', '.') : NaN; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  // consulta de CNPJ respondida com o município em caixa alta e sem acento, como vem da Receita
  await p.route('**/brasilapi.com.br/api/cnpj/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ cnpj: '11222333000181', razao_social: 'EMPRESA TESTE LTDA', uf: 'SP', municipio: 'SAO JOSE DOS CAMPOS', porte: 'DEMAIS', cnae_fiscal_descricao: 'Desenvolvimento de programas de computador sob encomenda', qsa: [] }) }));
  await p.goto(URL);
  const ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(300); };

  // 1. Método Personalizado com cidades: a planilha fictícia tem empresas de São Paulo e de Campinas
  await ir('#/metodos');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-acao=minha-importar]')]);
  await fc.setFiles(path.join(D, 'cidades.csv')); await p.waitForTimeout(800);
  check('coluna Cidade reconhecida', await p.locator('#mp-cidade').inputValue() === 'Cidade', await p.locator('#mp-cidade').inputValue());
  await p.click('[data-acao=usar-base]'); await p.waitForTimeout(600);
  check('importadas com o nome oficial', await p.locator('.tab-minhas tbody tr:has-text("São Paulo/SP")').count() === 6 && await p.locator('.tab-minhas tbody tr:has-text("Campinas/SP")').count() === 6);
  const cm = await p.evaluate(() => { const c = calMinha(); return { r: c.receita && c.receita.local, t: c.ti && c.ti.local, N: c.ti && c.ti.N, uso: usavel(c) }; });
  check('Personalizado com ajuste por cidade na receita e no gasto de TI', cm.uso && cm.N >= 5 && cm.r.cidades['SP:sao paulo'] && cm.r.cidades['SP:campinas'] && cm.t.cidades['SP:sao paulo'] && cm.t.cidades['SP:campinas'], JSON.stringify(cm.t && cm.t.cidades));
  const pers = await txt(p, '#pers-dados');
  check('tela: resumo dos ajustes por cidade', (pers.match(/Ajuste por cidade: 2 cidades com valor próprio/g) || []).length === 2, (pers.match(/Ajuste por cidade[^.]*/g) || []).join(' | '));
  check('tabela por cidade fechada, com as contagens', await p.locator('#pers-dados details.cal-local').count() === 1 && !(await p.locator('#pers-dados details.cal-local').evaluate(e => e.open)) && await p.locator('#pers-dados .cal-local th:text-is("Empresas")').count() >= 2);
  await p.click('#pers-dados details.cal-local summary'); await p.waitForTimeout(150);
  const linhas = await p.locator('#pers-dados .cal-local table >> nth=0 >> tbody tr').evaluateAll(trs => trs.map(tr => [...tr.cells].map(c => c.textContent.trim()).join('|')));
  check('linhas de Campinas e São Paulo com fator e número de empresas', linhas.some(l => /^Campinas\/SP\|× [\d,]+\|\d+\|× [\d,]+\|6$/.test(l)) && linhas.some(l => /^São Paulo\/SP\|× [\d,]+\|\d+\|× [\d,]+\|6$/.test(l)), linhas.join(' ; '));
  check('setor dentro da cidade', await p.locator('#pers-dados .cal-local table >> nth=1 >> tbody tr').count() === 2 && /em Campinas\/SP/.test(await txt(p, '#pers-dados .cal-local table >> nth=1')));

  // 2. análise em São Paulo com o Personalizado
  await ir('#/empresas'); await p.click('#app [data-acao=nova] >> nth=0'); await p.waitForTimeout(200);
  await p.fill('#f-nome', 'Teste Cidade'); await p.selectOption('#f-natureza', 'privada'); await p.selectOption('#f-setor', 'industria'); await p.selectOption('#f-uf', 'SP');
  await p.fill('#f-faturamento', '300.000.000'); await p.click('[data-acao=origem][data-alvo="campo:faturamento"]'); await p.click('#pop [data-o=oficial]');
  await p.fill('#f-funcionarios', '600');
  await p.click('#painel label.modo-op:has(input[data-modo][value=propria])'); await p.waitForTimeout(1500);
  const v1 = await txt(p, '#cr-valor');
  check('lista de municípios de SP no campo', await p.locator('#dl-municipios option').count() === 645, String(await p.locator('#dl-municipios option').count()));
  await p.fill('#f-municipio', 'sao paulo'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(1500);
  check('nome vira o oficial', await p.inputValue('#f-municipio') === 'São Paulo', await p.inputValue('#f-municipio'));
  check('sem aviso com nome da lista', (await txt(p, '#v-municipio')) === '');
  const v2 = await txt(p, '#cr-valor'), loc1 = await p.evaluate(() => calc(UI.atual.dados).modelo.local);
  const fEsperado = cm.t.cidades['SP:sao paulo'].f * ((cm.t.celulas['industria|SP:sao paulo'] || {}).f || 1);
  check('valor muda pelo fator de São Paulo no gasto de TI (cidade × setor na cidade)', loc1 && Math.abs(mi(v2) / mi(v1) / loc1.f - 1) < 0.004 && Math.abs(loc1.f - fEsperado) < 1e-6 && loc1.partes.length === 2, `${v1} → ${v2}, fator ${loc1 && loc1.f} (esperado ${fEsperado})`);
  await p.fill('#f-municipio', 'Sao Paolo'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(1500);
  check('nome fora da lista avisa', /Não está na lista de municípios de SP do IBGE/.test(await txt(p, '#v-municipio')), await txt(p, '#v-municipio'));
  check('nome fora da lista fica sem ajuste', (await txt(p, '#cr-valor')) === v1, await txt(p, '#cr-valor'));
  await p.selectOption('#f-uf', 'RJ'); await p.waitForTimeout(200);
  check('trocar a UF troca a lista', await p.locator('#dl-municipios option').count() === 92, String(await p.locator('#dl-municipios option').count()));
  await p.selectOption('#f-uf', 'SP'); await p.fill('#f-municipio', 'Bauru'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(1500);
  check('cidade que não está na base fica sem ajuste (sem “demais cidades” quando todas têm valor próprio)', (await p.evaluate(() => calc(UI.atual.dados).modelo.local)) === null && (await txt(p, '#cr-valor')) === v1, await txt(p, '#cr-valor'));
  await p.fill('#f-municipio', 'São Paulo'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(600);
  // sem receita informada, a receita é estimada pelos funcionários das suas empresas, com o ajuste local
  check('receita estimada com ajuste local quando falta a receita', await p.evaluate(() => { const d = JSON.parse(JSON.stringify(UI.atual.dados)); d.faturamento = { v: '', o: '' }; const r = calc(d), rf = r.receita.caminhos.find(c => c.cod === 'RF'); return r.receita.modo === 'estimada' && !!r.receita.local && rf.partes.some(x => /^Ajuste local da base: São Paulo × /.test(x.rot)) && r.ests.map(e => e.cod).join() === 'EP'; }));
  await salvarAnalise(p);
  const idAnalise = await p.evaluate(() => UI.atual.id);

  // 3. resultado e resumo
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(800);
  const det = await txt(p, '#app');
  check('cabeçalho com a cidade', /São Paulo\/SP/.test(await txt(p, '#ws-meta')), await txt(p, '#ws-meta'));
  check('caminho do percentual com o ajuste por lugar', /Ajuste por lugar: São Paulo × [\d,]+; mesmo setor em São Paulo × [\d,]+/.test(det), (det.match(/Ajuste por lugar.{0,120}/) || [''])[0]);
  await explicar(p); await p.click('#res-resumo [data-acao=resumo]'); await p.waitForTimeout(300);
  const res = await p.inputValue('#txt-resumo');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  check('resumo: cidade no título', /Ind[uú]stria[^\n]*, São Paulo\/SP\. Vezen,/.test(res), res.split('\n')[1]);
  check('resumo: método, percentual e ajuste local', /Método: Método Personalizado, com as empresas informadas por você \(\d+ importadas\): receita por funcionário medida de \d+ empresas; percentual de TI sobre a receita medido de \d+ empresas: [\d,]+% neste setor, com ajuste local × [\d,]+ \(São Paulo × [\d,]+; mesmo setor em São Paulo × [\d,]+\)/.test(res), (res.match(/Método:.{0,400}/) || [''])[0]);

  // 4. a versão provisória do CR1 não tem estado nem cidade: sem ajuste por lugar, e a documentação diz a regra
  await ir('#/metodos');
  check('CR1 provisório sem ajuste por cidade', /nenhuma cidade com 5 empresas ou mais/.test(await txt(p, '#cr1-parametros')) && /provisórios/.test(await txt(p, '#cr1-metodo')));
  check('documentação: mínimo de 5 empresas por grupo e por lugar', /valor próprio com pelo menos 5 empresas/.test(await txt(p, '#cr1-metodo')) && /mínimo de 5 por grupo, lugares só com 5 empresas/.test(await txt(p, '#pers-metodo')));
  check('análise no CR1 fica sem ajuste por lugar', await p.evaluate(id => { const e = S.empresas.find(x => x.id === id), d = JSON.parse(JSON.stringify(e.dados)); d.modo = 'padrao'; const r = calc(d); return r.modoCalc === 'padrao' && r.modelo.local === null && r.ests.map(x => x.cod).join() === 'EP'; }, idAnalise));

  // 5. formulário de empresa com cidade
  await p.click('[data-acao=minha-nova]'); await p.waitForTimeout(200);
  check('campo cidade sem UF: lista vazia', await p.locator('#dl-fm-cidade option').count() === 0);
  await p.selectOption('#fm-uf', 'SP'); await p.waitForTimeout(150);
  check('campo cidade com a lista de SP', await p.locator('#dl-fm-cidade option').count() === 645);
  await p.fill('#fm-nome', 'Omega'); await p.selectOption('#fm-setor', 'industria'); await p.fill('#fm-ano', '2025'); await p.fill('#fm-receita', '100 mi'); await p.fill('#fm-func', '200');
  await p.fill('#fm-cidade', 'Cidade Inventada'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(200);
  check('cidade fora da lista: erro', /Não está na lista de municípios de SP/.test(await txt(p, '#fm-err-cidade')), await txt(p, '#fm-err-cidade'));
  await p.fill('#fm-cidade', 'campinas'); await p.selectOption('#fm-uf', ''); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(200);
  check('cidade sem estado: erro', /Escolha o estado da cidade/.test(await txt(p, '#fm-err-cidade')), await txt(p, '#fm-err-cidade'));
  await p.selectOption('#fm-uf', 'SP'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(300);
  check('cidade salva com o nome oficial', /Omega.*Campinas\/SP/.test(await txt(p, '.tab-minhas tbody tr:first-child')), await txt(p, '.tab-minhas tbody tr:first-child'));
  await p.click('.tab-minhas tbody tr:first-child [data-minha-edit]'); await p.waitForTimeout(200);
  check('editar traz a cidade', await p.inputValue('#fm-cidade') === 'Campinas');
  await p.click('[data-acao=minha-cancelar]'); await p.waitForTimeout(150);

  // 6. CNPJ: a busca só pela lupa, e o município vem com o nome oficial
  await ir('#/empresas'); await p.click('#app [data-acao=nova] >> nth=0'); await p.waitForTimeout(200);
  await p.fill('#f-cnpj', '11.222.333/0001-81'); await p.press('#f-cnpj', 'Tab'); await p.waitForTimeout(400);
  check('CNPJ: sair do campo não busca', await p.inputValue('#f-municipio') === '' && await p.locator('[data-acao=buscar-cnpj] use[href="#i-busca"]').count() === 1);
  await p.click('[data-acao=buscar-cnpj]'); await p.waitForTimeout(1200);
  check('CNPJ: depois da busca, a lupa vira atualizar', await p.locator('[data-acao=buscar-cnpj] use[href="#i-atualizar"]').count() === 1 && /Atualizar/.test(await p.getAttribute('[data-acao=buscar-cnpj]', 'aria-label')));
  check('CNPJ: município oficial', await p.inputValue('#f-municipio') === 'São José dos Campos' && await p.inputValue('#f-uf') === 'SP', await p.inputValue('#f-municipio'));

  // 7. celular
  await p.setViewportSize({ width: 375, height: 800 }); await p.waitForTimeout(200);
  check('celular sem rolagem lateral (análise)', await p.evaluate(() => document.documentElement.scrollWidth) <= 375);
  await p.click('[data-acao=menu-analise]'); await p.click('#pop [data-acao=descartar]'); await p.waitForTimeout(150); if (await p.locator('#dlg[open]').count()) { await p.click('#dlg button:has-text("Descartar")'); await p.waitForTimeout(400); }
  await ir('#/metodos');
  await p.click('#pers-dados details.cal-local summary'); await p.waitForTimeout(150);
  check('celular sem rolagem lateral (métodos)', await p.evaluate(() => document.documentElement.scrollWidth) <= 375, String(await p.evaluate(() => document.documentElement.scrollWidth)));
  await p.locator('#pers-dados .cal-local').screenshot({ path: path.join(TMP, 'vezen-cidades-cel.png') });

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
