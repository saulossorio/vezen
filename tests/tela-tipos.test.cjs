// Testes de tela dos três métodos: a tela Métodos (documentação, parâmetros do CR1 e os dados do Personalizado), a escolha do método na análise,
// empresas digitadas, importadas e percentuais diretos no Personalizado, rotas antigas e a migração de dados antigos.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path'), os = require('os');
const D = path.join(__dirname, 'dados'), TMP = os.tmpdir();
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
// campo vazio sem motivo fica em vermelho: nos testes que não são do marcador, todos os pendentes recebem um motivo
const explicar = p => p.evaluate(() => { const d = UI.atual.dados; d.semDado = d.semDado || {}; for (const c of pendentes(d)) d.semDado[c] = CAMPOS_SEM_DADO[c].ops[0]; atualizarSemDado(); atualizarCabecalho(); });
const salvarAnalise = async (p, espera = 300) => { await explicar(p); await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(espera); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.route('**/brasilapi.com.br/**', r => r.abort());
  await p.goto(URL);
  const ir = async (pg, h) => { await pg.evaluate(x => { location.hash = x; }, h); await pg.waitForTimeout(300); };
  const cartao = (pg, m) => txt(pg, `.tipo:has(h3:text-is("${m}"))`);

  // 1. a tela Métodos: um item só no menu, documentação por método e a área de entrada do Personalizado
  check('menu: Métodos no lugar de Calibração, Parâmetros e Metodologia', /Métodos/.test(await txt(p, '#nav')) && !/Calibração|Parâmetros|Metodologia/.test(await txt(p, '#nav')) && await p.locator('#nav a[href="#/metodos"]').count() === 1);
  await ir(p, '#/metodos');
  check('21 seções em 4 grupos, com uma só de entrada de dados', await p.locator('section.met-sec').count() === 21 && (await p.$$eval('.doc-ind .ind-grupo', g => g.map(x => x.textContent).join('|'))) === 'Visão geral|Método Vezen|Método CR1|Método Personalizado' && await p.locator('section.met-entrada').count() === 1 && (await txt(p, '#pers-dados-t')).includes('entrada de dados'));
  check('cartões dos três métodos', /Disponível|análise/.test(await cartao(p, 'Método Vezen')) && /Disponível/.test(await cartao(p, 'Método CR1')) && /Sem dados ainda/.test(await cartao(p, 'Método Personalizado')), await cartao(p, 'Método Personalizado'));
  const cr1 = await txt(p, '#cr1-parametros');
  check('CR1: versão, data, segmentos e a tabela por estado', /Versão CR1, de \d\d\/\d\d\/\d{4}: 14 segmentos, % de investimento em TI \(CAPEX\)/.test(cr1) && await p.locator('#cr1-parametros table.tab-cr1 tbody tr').count() === 14 && await p.locator('#cr1-parametros th:text-is("CE")').count() === 1, cr1.slice(0, 160));
  check('CR1: documentação com a fórmula, a autora, o CAPEX e as versões', /Carol Rocha/.test(await txt(p, '#cr1-metodo')) && /F\s*=\s*R · p\s*seg,UF/.test((await txt(p, '#cr1-metodo')).replace(/\s+/g, ' ')) && /CAPEX/.test(await txt(p, '#cr1-metodo')) && /gerar-calibracao/.test(await txt(p, '#cr1-versoes')));
  check('Vezen: origem das fórmulas, Índice G e CAPU da FGV', /Índice G/.test(await txt(p, '#met-caminhos')) && /FGVcia/.test(await txt(p, '#met-caminhos')) && /CAPEX \+ OPEX/.test(await txt(p, '#met-caminhos')));
  check('Vezen: fontes em tabela e parâmetros fixos', /parâmetros do Método Vezen são fixos/.test(await txt(p, '#met-fontes')) && await p.locator('#met-fontes tbody tr').count() >= 30 && /Brasscom/.test(await txt(p, '#met-fontes')));
  check('Personalizado: os quatro caminhos de entrada', (await p.$$eval('#pers-dados .acoes button', bs => bs.map(x => x.textContent.trim()).join('|'))) === 'Importar planilha|Baixar modelo|Adicionar empresa|Informar percentuais');
  check('testes 134 de 134', /134 de 134/.test(await txt(p, '#met-testes')), (await txt(p, '#met-testes')).match(/\d+ de \d+/)[0]);

  // 2. análise nova: começa no Método Vezen; o Personalizado fica desabilitado sem dados
  await ir(p, '#/empresas'); await p.click('#app [data-acao=nova] >> nth=0'); await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(200);
  check('nova análise no Método Vezen', await p.evaluate(() => document.querySelector('#painel input[data-modo]:checked').value) === 'base');
  const dis = await p.evaluate(() => [...document.querySelectorAll('#painel input[data-modo]')].map(i => i.value + ':' + i.disabled).join(','));
  check('Personalizado desabilitado sem dados', dis === 'base:false,padrao:false,propria:true', dis);
  await p.fill('#f-nome', 'Teste Serviços'); await p.selectOption('#f-setor', 'servicos'); await p.selectOption('#f-uf', 'SP');
  await p.fill('#f-faturamento', '300.000.000'); await p.fill('#f-funcionarios', '600'); await p.waitForTimeout(700);
  const v0 = await txt(p, '#cr-valor');
  check('cartão no Vezen mostra quanto daria o CR1', /R\$/.test(await txt(p, '#painel .modo-op:has(input[value=padrao]) .mo-val')), await txt(p, '#painel .modo-op:has(input[value=padrao])'));
  check('nomes e descrições dos métodos no cartão', (await txt(p, '#painel .modo-op:has(input[value=base]) b')) === 'Método Vezen' && /^Só investimento \(CAPEX\), por segmento e estado/.test(await txt(p, '#painel .modo-op:has(input[value=padrao]) small')) && /Métodos$/.test(await txt(p, '#painel .modo-op:has(input[value=propria]) small')));
  await p.click('#painel label.modo-op:has(input[data-modo][value=padrao])'); await p.waitForTimeout(900);
  const v1 = await txt(p, '#cr-valor');
  // só os campos que entram na conta: nos métodos por percentual somem usuários, unidades e a seção da equipe; com gasto de TI do ano, também no Vezen
  const campos = () => p.evaluate(() => ['f-funcionarios', 'f-usuarios', 'sec-ti', 'f-gastoDeclarado'].filter(id => document.getElementById(id)).join());
  check('CR1: formulário com segmento, estado, receita e funcionários', await campos() === 'f-funcionarios' && await p.locator('#f-segCR').count() === 1 && await p.locator('#f-setor, #f-municipio').count() === 0 && await p.inputValue('#f-segCR') === 'servicos' && await p.evaluate(() => !pendentes(UI.atual.dados).some(c => SO_VEZEN.includes(c))), await campos());
  check('Vezen: todos os campos, e eles somem com gasto de TI do ano', await p.evaluate(() => { const d = JSON.parse(JSON.stringify(UI.atual.dados)); d.modo = 'base'; const antes = SO_VEZEN.filter(c => entraNaConta(d, c)).length; d.gastoDeclarado = { v: 1e6, o: 'oficial' }; return antes === SO_VEZEN.length && !SO_VEZEN.some(c => entraNaConta(d, c)) && entraNaConta(d, 'funcionarios'); }));
  check('CR1 muda o valor e usa só o caminho do percentual', v0 !== v1 && await p.evaluate(() => document.querySelector('#painel input[data-modo]:checked').value === 'padrao' && calc(UI.atual.dados).ests.map(e => e.cod).join() === 'EP'), `${v0} → ${v1}`);
  check('CR1: receita informada × percentual do segmento no estado, rótulo CAPEX', await p.evaluate(() => { const r = calc(UI.atual.dados); return Math.abs(r.F / (r.receita.usada.v * 0.03) - 1) < 1e-9 && r.receita.modo === 'informada'; }) && /Investimento em TI \(CAPEX\)/.test(await txt(p, '#painel .cr-rot >> nth=1')));
  check('confiança do CR1: percentuais do estudo', /Aproximada: percentuais do estudo/.test(await txt(p, '#painel .cr-conf')), await txt(p, '#painel .cr-conf'));
  await p.selectOption('#f-segCR', 'ti'); await p.waitForTimeout(500);
  check('CR1: o segmento escolhido muda o percentual (Tecnologia da informação, SP 3%)', await p.evaluate(() => UI.atual.dados.segCR === 'ti' && calc(UI.atual.dados).segCR === 'ti'));
  await p.selectOption('#f-segCR', 'servicos'); await p.waitForTimeout(300);
  check('CR1: órgão público informa a despesa empenhada total', await p.evaluate(() => rotulos({ natureza: 'publico', modo: 'padrao' }).fat === 'Despesa empenhada total' && rotulos({ natureza: 'publico', modo: 'base' }).fat === 'Orçamento total'));
  // Método Vezen: gasto total ou só investimento (CAPEX)
  check('o seletor de CAPEX só aparece no Método Vezen', await p.locator('#f-escopo').count() === 0);
  await p.click('#painel label.modo-op:has(input[data-modo][value=base])'); await p.waitForTimeout(700);
  await p.selectOption('#f-escopo', 'capex'); await p.waitForTimeout(700);
  check('Vezen só CAPEX: gasto total × 32% e rótulo CAPEX', await p.evaluate(() => { const d = UI.atual.dados, r = calc(d), t = calc(Object.assign({}, d, { escopo: '' })); return d.escopo === 'capex' && r.capex && Math.abs(r.F / t.F - 0.32) < 1e-9 && Math.abs(r.p90 / t.p90 - 0.32) < 1e-9 && r.ests.every(e => /CAPEX/.test(e.partes[e.partes.length - 1].rot)); }) && /Investimento em TI \(CAPEX\)/.test(await txt(p, '#painel .cr-rot >> nth=1')));
  await p.selectOption('#f-escopo', ''); await p.waitForTimeout(500);
  check('Vezen volta ao gasto total', await p.evaluate(() => !calc(UI.atual.dados).capex) && !/CAPEX/.test(await txt(p, '#painel .cr-rot >> nth=1')));
  await p.click('#painel label.modo-op:has(input[data-modo][value=padrao])'); await p.waitForTimeout(700);
  // gasto real de 2024 (antes do ano de referência) para a análise entrar no Personalizado depois
  await p.click('[data-acao=add-real]'); await p.waitForTimeout(200);
  await p.fill('[data-real="0"][data-parte="ano"]', '2024'); await p.fill('[data-real="0"][data-parte="v"]', '4.000.000'); await p.press('[data-real="0"][data-parte="v"]', 'Tab'); await p.waitForTimeout(300);
  check('a análise só entra no Personalizado quando a pessoa marca', !(await p.isChecked('#f-usarCalib')) && await p.evaluate(() => UI.atual.foraCalibracao === true));
  await p.check('#f-usarCalib'); await p.waitForTimeout(100);
  await salvarAnalise(p, 400);

  // 3. Personalizado: empresas digitadas
  await ir(p, '#/metodos');
  check('análise salva aparece no Personalizado', /Análises salvas com gasto real \(1\)/.test(await txt(p, '#pers-dados')));
  await p.click('[data-acao=minha-nova]'); await p.waitForTimeout(200);
  await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(200);
  const errs = await p.evaluate(() => ['setor', 'receita', 'func'].map(k => document.querySelector('#fm-err-' + k).textContent));
  check('validação do formulário', !!(errs[0] && errs[1]), JSON.stringify(errs));
  const emps = [['Alfa', 'industria', 'SP', '2025', '250 mi', '400', '12', '3,1 mi'], ['Beta', 'industria', 'SP', '2025', '1,2 bi', '2.100', '45', '14 mi'],
    ['Gama', 'varejo', 'SP', '2025', '480.000.000', '1500', '', '5.200.000'], ['Delta', 'servicos', 'RJ', '2024', '90 mi', '350', '9', ''], ['Épsilon', 'logistica', 'SP', '2025', '610 mi', '1800', '20', '6 mi']];
  for (const e of emps) {
    if (!await p.locator('.cal-form').count()) { await p.click('[data-acao=minha-nova]'); await p.waitForTimeout(150); }
    await p.fill('#fm-nome', e[0]); await p.selectOption('#fm-setor', e[1]); await p.selectOption('#fm-uf', e[2]); await p.fill('#fm-ano', e[3]);
    await p.fill('#fm-receita', e[4]); await p.fill('#fm-func', e[5]); await p.fill('#fm-functi', e[6]); await p.fill('#fm-gasto', e[7]);
    await p.press('#fm-receita', 'Enter'); await p.waitForTimeout(250);
  }
  check('5 empresas digitadas', await p.locator('.tab-minhas tbody tr').count() === 5, String(await p.locator('.tab-minhas tbody tr').count()));
  const lin = await txt(p, '.tab-minhas tbody tr:last-child');
  check('"250 mi" e "3,1 mi" lidos, com o percentual da receita na linha', /Alfa.*R\$ 250,00 mi.*2025.*400.*12.*R\$ 3,10 mi.*1,24%/.test(lin), lin);
  const uso = await txt(p, '#pers-dados .cal-uso');
  check('em uso com 6 empresas', /^Em uso: 6 empresas \(5 digitadas, 1 análise salva com gasto real\) de 2 estados\.$/.test(uso), uso);
  check('receita: só o nível', /Nível geral: × [\d,]+ sobre o Método Vezen/.test(await txt(p, '#pers-dados')));
  check('gasto de TI: percentual com 5 empresas', /5 empresas com gasto de TI real e receita do mesmo ano/.test(await txt(p, '#pers-dados')) && /Percentual geral: [\d,]+%/.test(await txt(p, '#pers-dados')), (await txt(p, '#pers-dados')).match(/\d+ empresas com gasto[^.]*/)?.[0]);
  await p.click('.tab-minhas tbody tr:last-child [data-minha-edit]'); await p.waitForTimeout(200);
  check('editar abre com os valores', await p.inputValue('#fm-nome') === 'Alfa' && await p.inputValue('#fm-receita') === '250.000.000', await p.inputValue('#fm-receita'));
  await p.fill('#fm-receita', '260 mi'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(250);
  check('edição salva', /R\$ 260,00 mi/.test(await txt(p, '.tab-minhas tbody tr:last-child')) && await p.locator('.tab-minhas tbody tr').count() === 5);

  // 4. importar planilha
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-acao=minha-importar]')]);
  await fc.setFiles(path.join(D, 'minhas.csv')); await p.waitForTimeout(1200);
  check('tela de importação', (await txt(p, '#app h1')) === 'Importar para o Método Personalizado' && /minhas\.csv/.test(await txt(p, '#app .cab .sub')), await txt(p, '#app h1'));
  check('botão adicionar 14', /Adicionar 14 empresas/.test(await txt(p, '[data-acao=usar-base]')), await txt(p, '[data-acao=usar-base]'));
  check('gasto de TI mapeado', await p.inputValue('#mp-gastoTI') === 'Gasto de TI real (R$)' && await p.inputValue('#mp-funcTI') === 'Funcionários de TI', await p.inputValue('#mp-gastoTI'));
  check('prévia com o percentual', /Percentual geral: [\d,]+%/.test(await txt(p, '#app')));
  await p.click('[data-acao=usar-base]'); await p.waitForTimeout(500);
  check('19 empresas na lista', await p.locator('.tab-minhas tbody tr').count() === 19, String(await p.locator('.tab-minhas tbody tr').count()));
  const uso2 = await txt(p, '#pers-dados .cal-uso');
  check('em uso com digitadas, importadas e salva', /20 empresas \(5 digitadas, 14 importadas, 1 análise salva com gasto real\)/.test(uso2), uso2);
  check('arquivo listado', /minhas\.csv: 14 empresas remover/.test(await txt(p, '.cal-arqs')), await txt(p, '.cal-arqs'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-acao=minha-baixar]')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '').split('\r\n');
  check('CSV da lista', csv.length === 20 && /Receita líquida 2024 \(R\$\).*Receita líquida 2025 \(R\$\).*Gasto de TI real 2025 \(R\$\)/.test(csv[0]), csv[0] + ' | ' + csv.length);
  fs.writeFileSync(path.join(TMP, 'vezen-lista-baixada.csv'), csv.join('\r\n'));

  // 5. análise com o Personalizado
  await ir(p, '#/empresas');
  await p.click('.lista-emp .emp-nome >> nth=0'); await p.waitForTimeout(500);
  const dis2 = await p.evaluate(() => [...document.querySelectorAll('#painel input[data-modo]')].map(i => i.value + ':' + i.disabled).join(','));
  check('Personalizado habilitado', dis2 === 'base:false,padrao:false,propria:false', dis2);
  await p.click('#painel label.modo-op:has(input[data-modo][value=propria])'); await p.waitForTimeout(500);
  const vals = await p.evaluate(() => [...document.querySelectorAll('#painel .modo-op .mo-val')].map(e => e.textContent));
  check('cartão com o valor dos três métodos', vals.length === 3 && vals.every(v => /R\$/.test(v)), vals.join(' | '));
  check('opção do Personalizado diz as empresas', /20 empresas suas/.test(await txt(p, '#painel .modo-op:has(input[value=propria]) small')));
  await explicar(p); await p.click('#painel [data-acao=resumo]'); await p.waitForTimeout(300);
  const res = await p.inputValue('#txt-resumo');
  check('resumo: título com o método', /\(Método Personalizado\)/.test(res));
  check('resumo: método, percentual e outros métodos', /Método: Método Personalizado, com as empresas informadas por você \(.*\): .*percentual de TI sobre a receita medido de \d+ empresas: [\d,]+% neste setor.*Pelos outros métodos: Método Vezen, Geral R\$ .*Método CR1, Geral R\$/.test(res), (res.match(/- Método.*/) || [''])[0].slice(0, 300));
  check('resumo: limitações', /Método Personalizado feito com 20 empresas informadas por você/.test(res));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await salvarAnalise(p);
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(500);
  check('resultado: chip e seletor', await p.locator('#res-estimativa .chip-modo.minha').count() === 1 && await p.locator('#res-estimativa input[data-modo]').count() === 3);
  const etapas = (await p.evaluate(() => [...document.querySelectorAll('.etapas')].map(e => e.textContent).join(' '))).replace(/\s+/g, ' ');
  check('resultado: etapa do percentual, sem correção k', /Estimativa pela receita e o percentual da base/.test(etapas) && !/Correção da calibração/.test(etapas), etapas.slice(0, 200));
  check('resultado: o caminho EP com as partes', /Pela receita e o percentual da base/.test(await txt(p, '#res-caminhos')) && /% da receita gasto com TI nas empresas da base/.test(await txt(p, '#res-caminhos')));
  await ir(p, '#/empresas');
  check('lista mostra o método', /Método Personalizado/.test(await txt(p, '#app table tbody')));

  // 6. remover o arquivo e depois tudo
  await ir(p, '#/metodos');
  await p.click('[data-minha-arq="minhas.csv"]'); await p.waitForTimeout(200);
  check('diálogo de remoção', /Remover 14 empresas\?/.test(await txt(p, '#dlg')));
  await p.click('#dlg-acoes button:has-text("Remover")'); await p.waitForTimeout(300);
  check('sobram as digitadas', await p.locator('.tab-minhas tbody tr').count() === 5);
  const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-acao=minha-importar]')]);
  await fc2.setFiles(path.join(TMP, 'vezen-lista-baixada.csv')); await p.waitForTimeout(1200);
  check('reimportar: 19 linhas', /Adicionar 19 empresas/.test(await txt(p, '[data-acao=usar-base]')), await txt(p, '[data-acao=usar-base]'));
  await p.click('[data-acao=usar-base]'); await p.waitForTimeout(400);
  check('reimportar: sem duplicar', await p.locator('.tab-minhas tbody tr').count() === 19, String(await p.locator('.tab-minhas tbody tr').count()));
  await p.click('[data-acao=minha-limpar]'); await p.waitForTimeout(200);
  await p.click('#dlg-acoes button:has-text("Remover")'); await p.waitForTimeout(300);
  check('lista vazia mostra modelo', await p.locator('[data-acao=minha-modelo]').count() === 1 && await p.locator('.tab-minhas').count() === 0);
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('[data-acao=minha-modelo]')]);
  const mod = fs.readFileSync(await dl2.path(), 'utf8');
  check('modelo', /Empresa";"CNPJ";"Setor";"Estado";"Cidade";"Ano";"Receita líquida \(R\$\)";"Funcionários";"Funcionários de TI";"Gasto de TI real \(R\$\)"/.test(mod), mod.slice(0, 160));
  // a análise salva pediu o Personalizado, que agora está incompleto: volta ao Vezen com aviso
  await ir(p, '#/empresas');
  check('lista: volta ao Método Vezen', /Método Vezen/.test(await txt(p, '#app table tbody')));
  await p.click('.lista-emp .emp-nome >> nth=0'); await p.waitForTimeout(500);
  check('aviso de Personalizado incompleto', /O Método Personalizado ainda não tem dados suficientes/.test(await txt(p, '#painel')));

  // 7. percentuais diretos, sem empresas
  await ir(p, '#/metodos');
  await p.click('[data-acao=dir-abrir]'); await p.waitForTimeout(200);
  await p.click('[data-acao=dir-salvar]'); await p.waitForTimeout(200);
  check('percentual geral obrigatório', /entre 0 e 100/.test(await txt(p, '.cal-form .valid')));
  await p.fill('#dir-geral', '2'); await p.fill('#dir-industria', '1,5'); await p.fill('#dir-comercio', 'abc'); await p.click('[data-acao=dir-salvar]'); await p.waitForTimeout(200);
  check('percentual inválido avisa no setor', /Entre 0 e 100/.test(await txt(p, '.campo:has(#dir-comercio) .valid')) && !(await p.evaluate(() => !!(S.calibracao.direta && S.calibracao.direta.ativa))));
  await p.fill('#dir-comercio', ''); await p.press('#dir-geral', 'Enter'); await p.waitForTimeout(300);
  check('percentuais salvos e em uso', await p.evaluate(() => JSON.stringify(S.calibracao.direta)) === '{"ativa":true,"pg":0.02,"ps":{"industria":0.015},"s":0.5}' && /Em uso: percentuais informados por você/.test(await txt(p, '#pers-dados .cal-uso')) && /Percentuais informados por você/.test(await txt(p, '#pers-dados')));
  check('tabela dos percentuais sem coluna de empresas', await p.locator('#pers-dados .cal-bloco:nth-child(1) th:text-is("Empresas")').count() === 0 && /1,50%/.test(await txt(p, '#pers-dados .cal-bloco:nth-child(1)')));
  await ir(p, '#/empresas'); await p.click('.lista-emp .emp-nome >> nth=0'); await p.waitForTimeout(500);
  check('análise: Personalizado com o percentual geral digitado (serviços sem valor próprio)', await p.evaluate(() => { UI.atual.dados.modo = 'propria'; const r = calc(UI.atual.dados); return r.modoCalc === 'propria' && r.ests.some(e => e.cod === 'EP') && Math.abs(r.modelo.p - 0.02) < 1e-12; }) && /Percentuais informados por você/.test(await txt(p, '#painel .modo-op:has(input[value=propria]) small')));
  check('confiança com percentuais digitados: aproximada', /Aproximada: percentuais informados por você/.test(await (async () => { await p.click('#painel label.modo-op:has(input[data-modo][value=propria])'); await p.waitForTimeout(400); return txt(p, '#painel .cr-conf'); })()));
  await ir(p, '#/metodos'); await p.click('[data-acao=dir-abrir]'); await p.waitForTimeout(150); await p.click('[data-acao=dir-desligar]'); await p.waitForTimeout(300);
  check('voltar às empresas desliga os percentuais', await p.evaluate(() => S.calibracao.direta === null) && /Ainda sem efeito: 1 empresa \(1 análise salva com gasto real\)/.test(await txt(p, '#pers-dados .cal-uso')), await txt(p, '#pers-dados .cal-uso'));

  // 8. rotas antigas e celular
  for (const [h, id] of [['#/calibracao', 'pers-dados'], ['#/parametros', 'met-fontes'], ['#/metodologia/met-ajustes', 'met-ajustes'], ['#/metodologia', null]]) {
    await ir(p, h); await p.waitForTimeout(1600);
    const r = await p.evaluate(() => UI.rota.tela + '|' + UI.rota.id);
    const pos = id ? await p.locator('#' + id).evaluate(e => { const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, alt: innerHeight }; }) : null;
    check('rota antiga ' + h + ' cai em Métodos' + (id ? ', na seção à vista' : ''), r === 'metodos|' + id && (!id || pos.top < 140 || (pos.top >= 0 && pos.bottom <= pos.alt)), r + ' ' + JSON.stringify(pos));
  }
  await p.setViewportSize({ width: 375, height: 800 });
  const id = await p.evaluate(() => UI.atual.id);
  for (const [t, h] of [['metodos', '#/metodos'], ['analise', `#/analise/${id}`], ['resultado', `#/analise/${id}/resultado`]]) {
    await ir(p, h); await p.waitForTimeout(200);
    if (t === 'metodos') { await p.click('[data-acao=minha-nova]'); await p.waitForTimeout(200); }
    const w = await p.evaluate(() => document.documentElement.scrollWidth);
    check('celular sem rolagem lateral: ' + t, w <= 375, String(w));
  }
  await p.setViewportSize({ width: 1360, height: 900 });

  // 9. dados antigos: “Calibrada” vira CR1; a correção aplicada antiga é deixada de lado
  const ctx2 = await b.newContext({ viewport: { width: 1360, height: 900 } }), p2 = await ctx2.newPage();
  p2.on('pageerror', e => erros.push('p2: ' + e.message));
  await p2.goto(URL);
  await p2.evaluate(() => {
    const d = { nome: 'Antiga', cnpj: '', uf: 'SP', natureza: 'privada', setor: 'industria', faturamento: { v: 500000000, o: 'oficial' }, fatAno: '2025', funcionarios: { v: 1200, o: 'terceiros' }, modo: 'calibrada' };
    localStorage.setItem('estimador-ti.v1', JSON.stringify({ versao: 3, empresas: [{ id: 'x1', criadoEm: '2026-11-10T10:00:00Z', alteradoEm: '2026-11-10T10:00:00Z', dados: d }],
      calibracao: { aplicada: { data: '2026-11-10', N: 12, kg: 0.5, ks: {}, lambda: 1.2, acerto: 9, base: 'base-2026-11-10' }, historico: [null], base: null, semBase: false, mapaUlt: null } }));
  });
  await p2.reload(); await p2.waitForTimeout(400);
  check('migração: calibrada → CR1', /Método CR1/.test(await txt(p2, '#app table tbody')), await txt(p2, '#app table tbody'));
  await ir(p2, '#/metodos');
  check('migração: Personalizado vazio', /Nenhum dado ainda/.test(await txt(p2, '#pers-dados')));

  // campos por natureza: cada um só aparece quando muda o resultado
  const entra = (dados, cs) => p2.evaluate(([x, c]) => { const d = Object.assign(dadosVazios(), x); return c.filter(k => entraNaConta(d, k)).join(); }, [dados, cs]);
  const todos = ['setor', 'uf', 'municipio', 'faturamento', 'funcionarios', 'usuarios', 'profTI', 'salarioTI', 'digital', 'contratos'];
  check('órgão público no Vezen: despesa de TI e servidores de TI', await entra({ natureza: 'publico' }, todos) === 'uf,profTI,salarioTI,contratos', await entra({ natureza: 'publico' }, todos));
  check('estatal segue o formulário de empresa', await entra({ natureza: 'publico', tipoPublico: 'estatal' }, todos) === 'setor,uf,faturamento,funcionarios,usuarios,profTI,salarioTI,digital,contratos');
  check('pequena e terceiro setor sem usuários; terceiro setor sem setor', await entra({ natureza: 'pequena' }, ['usuarios', 'setor']) === 'setor' && await entra({ natureza: 'terceiro' }, ['usuarios', 'setor']) === '');
  check('município só nos métodos por percentual', await entra({ natureza: 'privada' }, ['municipio']) === '');
  check('rótulos do órgão público', await p2.evaluate(() => rotContratos({ natureza: 'publico' }) === 'Despesa de TI do ano' && rotProfTI({ natureza: 'publico' }) === 'Servidores de TI' && rotContratos({ natureza: 'publico', tipoPublico: 'estatal' }) === 'Contratos de TI do ano'));

  check('etapa da despesa: liquidada por padrão; dotação e empenho baixam a confiança, sem mudar o valor', await p2.evaluate(() => {
    const d = Object.assign(dadosVazios(), { modo: 'base', natureza: 'publico', uf: 'SP', contratos: { v: 5e7, o: 'oficial' } }), r = e => { d.contratosEtapa = e; return calc(d); };
    const L = r('liquidado'), E = r('empenhado'), D = r('dotacao');
    return etapaDespesa(dadosVazios()) === 'liquidado' && Math.abs(L.F - D.F) / L.F < 0.01 && L.ic > E.ic && E.ic > D.ic;
  }));
  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
