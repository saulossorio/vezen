// Testes de tela do ajuste por cidade: campo Município com a lista do IBGE, valores, detalhe, resumo, calibração, minha calibração e CNPJ.
const { chromium } = require('playwright-core');
const path = require('path'), os = require('os');
const D = path.join(__dirname, 'dados'), TMP = os.tmpdir();
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
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

  // 1. análise em São Paulo com a calibração padrão
  await p.click('#app [data-acao=nova] >> nth=0');
  await p.fill('#f-nome', 'Teste Cidade'); await p.selectOption('#f-setor', 'servicos'); await p.selectOption('#f-uf', 'SP');
  await p.fill('#f-faturamento', '300.000.000'); await p.fill('#f-funcionarios', '600');
  await p.click('#painel label.modo-op:has(input[data-modo][value=padrao])'); await p.waitForTimeout(1500);
  const v1 = await txt(p, '#cr-valor');
  check('lista de municípios de SP no campo', await p.locator('#dl-municipios option').count() === 645, String(await p.locator('#dl-municipios option').count()));
  await p.fill('#f-municipio', 'sao paulo'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(1500);
  check('nome vira o oficial', await p.inputValue('#f-municipio') === 'São Paulo', await p.inputValue('#f-municipio'));
  check('sem aviso com nome da lista', (await txt(p, '#v-municipio')) === '');
  const v2 = await txt(p, '#cr-valor'), fTI = await p.evaluate(() => calc(UI.atual.dados).modelo.local.f);
  check('valor muda pelo fator de São Paulo no gasto de TI', Math.abs(mi(v2) / mi(v1) / fTI - 1) < 0.004 && Math.abs(fTI - 1.0884) < 1e-4, `${v1} → ${v2}, fator ${fTI}`);
  await p.fill('#f-municipio', 'Sao Paolo'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(1500);
  check('nome fora da lista avisa', /Não está na lista de municípios de SP do IBGE/.test(await txt(p, '#v-municipio')), await txt(p, '#v-municipio'));
  check('nome fora da lista fica sem ajuste', (await txt(p, '#cr-valor')) === v1, await txt(p, '#cr-valor'));
  await p.selectOption('#f-uf', 'RJ'); await p.waitForTimeout(200);
  check('trocar a UF troca a lista', await p.locator('#dl-municipios option').count() === 92, String(await p.locator('#dl-municipios option').count()));
  await p.selectOption('#f-uf', 'SP'); await p.fill('#f-municipio', 'Bauru'); await p.press('#f-municipio', 'Tab'); await p.waitForTimeout(1500);
  const loc = await p.evaluate(() => calc(UI.atual.dados).modelo.local);
  check('cidade sem valor próprio usa demais cidades', loc && loc.partes.length === 1 && loc.partes[0].rot === 'demais cidades de SP' && Math.abs(loc.f - 0.6739) < 1e-4, JSON.stringify(loc));
  await p.fill('#f-municipio', 'São Paulo'); await p.press('#f-municipio', 'Tab');
  await p.check('input[data-objetivo][value=ti-receita]'); await p.waitForTimeout(1200);
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);

  // 2. resultado e resumo
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(800);
  const det = await txt(p, '#app');
  check('cabeçalho com a cidade', /São Paulo\/SP/.test(await txt(p, '#ws-meta')), await txt(p, '#ws-meta'));
  check('correção do gasto de TI com a cidade', /Setor × 0,31; São Paulo × 1,09\./.test(det), (det.match(/Correção da calibração.{0,220}/) || [''])[0]);
  check('receita estimada com ajuste local', /Ajuste local da base: São Paulo × 1,12; mesmo setor em São Paulo × 0,88/.test(det), (det.match(/Ajuste local.{0,80}/) || [''])[0]);
  await p.click('#res-resumo [data-acao=resumo]'); await p.waitForTimeout(300);
  const res = await p.inputValue('#txt-resumo');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  check('resumo: cidade no título', /Serviços[^.\n]*, São Paulo\/SP\. Vezen,/.test(res), res.split('\n')[1]);
  check('resumo: base sem tamanho, nome nem origem', /com a calibração que vem com a ferramenta \(10\/11\/2026\)/.test(res) && !/\w\.xlsx?\b|\d+ empresas|empresas d[eo] [A-Z]{2}\b/.test((res.match(/Tipo de estimativa.*/) || [''])[0]), (res.match(/Tipo de estimativa.{0,200}/) || [''])[0]);
  check('resumo: ajustes locais', /receita por funcionário calibrada, com ajuste local × 0,99 \(São Paulo × 1,12; mesmo setor em São Paulo × 0,88\)/.test(res) && /com correção × 0,31 neste setor e ajuste local × 1,09 \(São Paulo × 1,09\)/.test(res),
    (res.match(/Tipo de estimativa.{0,400}/) || [''])[0]);

  // 3. tela de calibração
  await ir('#/calibracao');
  const pad = await txt(p, '#cal-padrao');
  check('resumo dos ajustes por cidade (receita)', /Ajuste por cidade: 18 cidades com valor próprio, as demais cidades do estado juntas e 17 setores dentro de cidades\./.test(pad));
  check('resumo dos ajustes por cidade (TI)', /Ajuste por cidade: 6 cidades com valor próprio, as demais cidades do estado juntas e 7 setores dentro de cidades\./.test(pad));
  check('seguros e outros com a correção geral', /Seguros e serviços financeiros ?× 0,46 geral/.test(pad) && /Outros ou não sei ?× 0,46 geral/.test(pad), (pad.match(/Gasto de TI.{0,700}/) || [''])[0].slice(0, 700));
  check('tabela por cidade fechada', await p.locator('#cal-padrao details.cal-local').count() === 1 && !(await p.locator('#cal-padrao details.cal-local').evaluate(e => e.open)));
  await p.click('#cal-padrao details.cal-local summary'); await p.waitForTimeout(150);
  const celulas = tr => [...tr.cells].map(c => c.textContent.trim()).join('|');
  // calibração pública: sem as colunas de empresas e com as cidades em ordem alfabética
  const linhas = await p.locator('#cal-padrao .cal-local table >> nth=0 >> tbody tr').evaluateAll((trs, f) => trs.map(tr => [...tr.cells].map(c => c.textContent.trim()).join('|')));
  check('primeira linha em ordem alfabética', linhas[0] === 'Barueri/SP|× 0,90|× 1,20', linhas[0]);
  check('linha de São Paulo', linhas.includes('São Paulo/SP|× 1,12|× 1,09'), linhas.find(l => l.startsWith('São Paulo/')));
  check('linha das demais cidades', linhas[linhas.length - 1] === 'Demais cidades de SP|× 0,70|× 0,67', linhas[linhas.length - 1]);
  check('tabela por cidade sem colunas de empresas', await p.locator('#cal-padrao .cal-local th:text-is("Empresas")').count() === 0);
  check('18 cidades + demais na tabela', await p.locator('#cal-padrao .cal-local table >> nth=0 >> tbody tr').count() === 19);
  check('tabela de setor na cidade', await p.locator('#cal-padrao .cal-local table >> nth=1 >> tbody tr').count() === 17 && /em São Paulo\/SP/.test(await txt(p, '#cal-padrao .cal-local table >> nth=1')), String(await p.locator('#cal-padrao .cal-local table >> nth=1 >> tbody tr').count()));
  await p.screenshot({ path: path.join(TMP, 'vezen-cidades.png'), fullPage: false, clip: await p.locator('#cal-padrao .cal-local').boundingBox() });

  // 4. minha calibração: cidade no formulário
  await p.click('[data-acao=minha-nova]'); await p.waitForTimeout(200);
  check('campo cidade sem UF: lista vazia', await p.locator('#dl-fm-cidade option').count() === 0);
  await p.selectOption('#fm-uf', 'SP'); await p.waitForTimeout(100);
  check('campo cidade com a lista de SP', await p.locator('#dl-fm-cidade option').count() === 645);
  await p.fill('#fm-nome', 'Omega'); await p.selectOption('#fm-setor', 'industria'); await p.fill('#fm-ano', '2025'); await p.fill('#fm-receita', '200 mi'); await p.fill('#fm-func', '500');
  await p.fill('#fm-cidade', 'Cidade Inventada'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(200);
  check('cidade fora da lista: erro', /Não está na lista de municípios de SP/.test(await txt(p, '#fm-err-cidade')), await txt(p, '#fm-err-cidade'));
  await p.selectOption('#fm-uf', ''); await p.fill('#fm-cidade', 'Campinas'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(200);
  check('cidade sem estado: erro', /Escolha o estado da cidade/.test(await txt(p, '#fm-err-cidade')), await txt(p, '#fm-err-cidade'));
  await p.selectOption('#fm-uf', 'SP'); await p.fill('#fm-cidade', 'campinas'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(300);
  check('cidade salva com o nome oficial', /Omega.*Campinas\/SP/.test(await txt(p, '.tab-minhas tbody tr:first-child')), await txt(p, '.tab-minhas tbody tr:first-child'));
  await p.click('[data-minha-edit]'); await p.waitForTimeout(200);
  check('editar traz a cidade', await p.inputValue('#fm-cidade') === 'Campinas');
  await p.click('[data-acao=minha-cancelar]'); await p.waitForTimeout(150);

  // 5. importar planilha com a coluna Cidade
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-acao=minha-importar]')]);
  await fc.setFiles(path.join(D, 'cidades.csv')); await p.waitForTimeout(800);
  check('coluna Cidade reconhecida', await p.locator('#mp-cidade').inputValue() === 'Cidade', await p.locator('#mp-cidade').inputValue());
  await p.click('[data-acao=usar-base]'); await p.waitForTimeout(600);
  check('importadas com o nome oficial', await p.locator('.tab-minhas tbody tr:has-text("São Paulo/SP")').count() === 6 && await p.locator('.tab-minhas tbody tr:has-text("Campinas/SP")').count() === 7);
  const cm = await p.evaluate(() => { const c = calMinha(); return { r: c.receita && c.receita.local, t: c.ti && c.ti.local }; });
  check('minha calibração com ajuste por cidade', cm.r && cm.r.cidades['SP:sao paulo'] && cm.r.cidades['SP:campinas'] && cm.r.cidades['SP:sao paulo'].f > cm.r.cidades['SP:campinas'].f, JSON.stringify(cm.r && cm.r.cidades));
  check('na tela da minha calibração', await p.locator('#cal-minha details.cal-local').count() === 1);

  // 6. parâmetros e metodologia
  await ir('#/parametros');
  check('parâmetro do mínimo por grupo', /Mínimo de empresas para um valor próprio/.test(await txt(p, '#app')));
  await ir('#/metodologia');
  const met = await txt(p, '#app');
  check('metodologia: ajustes por cidade', /Ajustes por cidade.*Só tem valor próprio o lugar com pelo menos 5 empresas/.test(met) && await p.locator('.met-sec').count() === 16);
  check('metodologia: tabela das calibrações', /Cidades com valor próprio: receita e gasto de TI ?18 e 6 ?2 e 2/.test(met), (met.match(/Cidades com valor próprio.{0,60}/) || [''])[0]);

  // 7. CNPJ preenche o município com o nome oficial
  await ir('#/empresas'); await p.click('#app [data-acao=nova] >> nth=0'); await p.waitForTimeout(200);
  await p.fill('#f-cnpj', '11.222.333/0001-81'); await p.press('#f-cnpj', 'Tab'); await p.waitForTimeout(600);
  check('CNPJ: sair do campo não busca', await p.inputValue('#f-municipio') === '' && await p.locator('[data-acao=buscar-cnpj] use[href="#i-busca"]').count() === 1);
  await p.click('[data-acao=buscar-cnpj]'); await p.waitForTimeout(1200);
  check('CNPJ: depois da busca, a lupa vira atualizar', await p.locator('[data-acao=buscar-cnpj] use[href="#i-atualizar"]').count() === 1 && /Atualizar/.test(await p.getAttribute('[data-acao=buscar-cnpj]', 'aria-label')));
  check('CNPJ: município oficial', await p.inputValue('#f-municipio') === 'São José dos Campos' && await p.inputValue('#f-uf') === 'SP', await p.inputValue('#f-municipio'));

  // 8. celular
  await p.setViewportSize({ width: 375, height: 800 }); await p.waitForTimeout(200);
  check('celular sem rolagem lateral (análise)', await p.evaluate(() => document.documentElement.scrollWidth) <= 375);
  await p.click('[data-acao=menu-analise]'); await p.click('#pop [data-acao=descartar]'); await p.waitForTimeout(150); if (await p.locator('#dlg[open]').count()) await p.click('#dlg button:has-text("Descartar")');
  await ir('#/calibracao');
  await p.click('#cal-padrao details.cal-local summary'); await p.waitForTimeout(150);
  check('celular sem rolagem lateral (calibração)', await p.evaluate(() => document.documentElement.scrollWidth) <= 375, String(await p.evaluate(() => document.documentElement.scrollWidth)));
  await p.locator('#cal-padrao .cal-local').screenshot({ path: path.join(TMP, 'vezen-cidades-cel.png') });

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
