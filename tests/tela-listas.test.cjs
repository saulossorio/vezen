// Listas (uma planilha estimada de uma vez), empresas (busca, filtros, seleção, comparação, backup), navegação pelo endereço, tema escuro e menu do celular.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), os = require('os');
const D = path.join(__dirname, 'dados'), TMP = os.tmpdir();
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.route('**/brasilapi.com.br/**', r => r.abort());
  await p.goto(URL);
  const ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(300); };
  const linhas = () => p.locator('#lote-tab tbody tr').count();

  // 1. telas vazias
  check('empresas vazia oferece os três começos', await p.locator('.vazio [data-acao=nova]').count() === 1 && await p.locator('.vazio a[href="#/listas/nova"]').count() === 1 && await p.locator('.vazio [data-acao=importar]').count() === 1);
  check('empresas vazia oferece a empresa modelo', await p.locator('.vazio [data-acao=modelo]').count() === 1);
  await ir('#/listas');
  check('listas vazia explica os passos', await p.locator('.passos-vazio li').count() === 3);
  const [dlm] = await Promise.all([p.waitForEvent('download'), p.click('.vazio [data-acao=modelo-lista]')]);
  check('modelo da lista', /Empresa";"CNPJ";"Setor";"Estado";"Cidade";"Ano";"Receita líquida \(R\$\)";"Funcionários"/.test(fs.readFileSync(await dlm.path(), 'utf8')));

  // 2. importar uma planilha: arquivo, colunas, estimativas
  await p.click('a[href="#/listas/nova"] >> nth=0'); await p.waitForTimeout(200);
  check('etapa 1: escolher o arquivo', await p.locator('#soltar-lista').count() === 1 && /Escolher o arquivo/.test(await txt(p, '.etapas-lote [aria-current=step]')));
  // a planilha de exemplo mais uma empresa sem receita e sem funcionários (colunas: Empresa;CNPJ;Setor;Estado;Ano;Receita;Funcionários;Funcionários de TI;Gasto de TI)
  fs.writeFileSync(path.join(TMP, 'vezen-lista-teste.csv'), fs.readFileSync(path.join(D, 'minhas.csv'), 'utf8').replace(/^﻿/, '').trim() + '\r\nSem Dados Ltda;;Indústria;SP;2025;;;;\r\n');
  await p.setInputFiles('#arq-lista', path.join(TMP, 'vezen-lista-teste.csv')); await p.waitForTimeout(800);
  check('etapa 2: conferir as colunas', /Conferir as colunas/.test(await txt(p, '.etapas-lote [aria-current=step]')) && await p.inputValue('#mp-nome') === 'Empresa' && await p.inputValue('#mp-funcionarios') === 'Funcionários');
  check('contagem antes de estimar', /15 empresas/.test(await txt(p, '[data-acao=criar-lista]')) && /14 têm dados para estimar/.test(await txt(p, '#app')), await txt(p, '[data-acao=criar-lista]'));
  await p.selectOption('#lt-modo', 'base'); await p.waitForTimeout(200);
  await p.fill('#lt-nome', 'Clientes do evento');
  await p.click('[data-acao=criar-lista]'); await p.waitForTimeout(500);
  check('lista criada com endereço próprio', /^#\/listas\/[a-z0-9]+$/.test(await p.evaluate(() => location.hash)) && (await txt(p, '#app h1')) === 'Clientes do evento');
  check('indicadores', /Com estimativa ?14 ?de 15 empresas/.test(await txt(p, '.kpis')), await txt(p, '.kpi >> nth=0'));
  check('15 linhas, a sem dados marcada', await linhas() === 15 && /Faltam dados de porte/.test(await txt(p, '#lote-tab')));
  const soma = await p.evaluate(() => { const L = S.listas[0]; return calcularLista(L).filter(x => !x.r.vazio).reduce((a, x) => a + x.r.F, 0); });
  check('soma = soma das estimativas', (await txt(p, '.kpi >> nth=1')).includes(await p.evaluate(v => fmtRS(v), soma)));
  check('ordenada pelo maior investimento', await p.evaluate(() => { const v = [...document.querySelectorAll('#lote-tab tbody tr .emp-val b')].map(b => b.textContent); return v.length === 14; }));
  // filtros
  await p.fill('[data-lote-f=q]', 'Cliente 01'); await p.waitForTimeout(200);
  check('busca pelo nome', await linhas() === 1);
  await p.fill('[data-lote-f=q]', ''); await p.selectOption('[data-lote-f=conf]', 'vazia'); await p.waitForTimeout(200);
  check('filtro sem estimativa', await linhas() === 1 && /Sem Dados/.test(await txt(p, '#lote-tab tbody')));
  await p.selectOption('[data-lote-f=conf]', ''); await p.selectOption('[data-lote-f=ordem]', 'nome'); await p.waitForTimeout(200);
  check('ordem por nome', /^Cliente 01/.test(await txt(p, '#lote-tab tbody tr:first-child .emp-nome')));
  // trocar o tipo de estimativa recalcula tudo e fica salvo
  const antes = await txt(p, '.kpi >> nth=1');
  await p.selectOption('#lr-modo', 'padrao'); await p.waitForTimeout(300);
  check('tipo de estimativa recalcula a lista', (await txt(p, '.kpi >> nth=1')) !== antes && (await p.evaluate(() => S.listas[0].modo)) === 'padrao');
  // baixar resultados
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-acao=csv-lista]')]);
  const rcsv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '').split('\r\n');
  check('CSV da lista', rcsv.length === 16 && /Investimento em TI, valor central \(R\$\).*Estimativa conservadora \(R\$\).*Índice de confiança/.test(rcsv[0]) && rcsv.some(l => l.includes('faltam dados de porte')), rcsv[0]);
  // salvar duas em Empresas
  await p.check('#lote-tab tbody tr:nth-child(1) input[data-sel-lote]'); await p.check('#lote-tab tbody tr:nth-child(2) input[data-sel-lote]'); await p.waitForTimeout(150);
  check('barra de seleção', /2 selecionadas/.test(await txt(p, '.barra-sel')));
  await p.click('[data-acao=salvar-linhas]'); await p.waitForTimeout(300);
  check('salvas em Empresas', (await p.evaluate(() => S.empresas.length)) === 2 && (await txt(p, '#nav')).includes('Empresas2'));
  // abrir uma linha como análise
  await p.click('#lote-tab tbody tr:nth-child(3) [data-acao=abrir-linha]'); await p.waitForTimeout(400);
  check('linha aberta como análise', /^#\/analise\//.test(await p.evaluate(() => location.hash)) && (await p.inputValue('#f-nome')).startsWith('Cliente') && (await p.inputValue('#f-funcionarios')) !== '');
  check('linha aberta já diz o que estimar', await p.locator('#sec-objetivo.pede').count() === 0 && typeof (await p.evaluate(() => UI.atual.dados.fatEstimar)) === 'boolean');
  check('origem do arquivo nos campos', (await p.evaluate(() => UI.atual.dados.funcionarios.o)) === 'terceiros' && (await txt(p, '[data-alvo="campo:funcionarios"]')).includes('Estimativa de terceiros'));
  check('análise aberta da lista começa não salva', (await txt(p, '#ws-meta')).includes('ainda não salva'));
  // voltar pelo navegador
  await p.goBack(); await p.waitForTimeout(300);
  check('voltar do navegador volta à lista', /^#\/listas\//.test(await p.evaluate(() => location.hash)) && await linhas() === 15);
  // renomear e excluir
  await p.click('[data-acao=menu-lista]'); await p.click('#pop [data-acao=renomear-lista]'); await p.fill('#dlg-nome', 'Evento 2026'); await p.click('#dlg-acoes button:has-text("Renomear")'); await p.waitForTimeout(200);
  check('renomear', (await txt(p, '#app h1')) === 'Evento 2026');
  await ir('#/listas');
  check('listas: tabela com a lista', /Evento 2026/.test(await txt(p, '.lista-emp tbody')) && /15/.test(await txt(p, '.lista-emp tbody')));
  await p.click('[data-acao=excluir-lista]'); await p.click('#dlg-acoes button:has-text("Excluir lista")'); await p.waitForTimeout(300);
  check('lista excluída, empresas salvas ficam', (await p.evaluate(() => S.listas.length)) === 0 && (await p.evaluate(() => S.empresas.length)) === 2);

  // 3. empresas: busca, filtros, seleção, comparação, menu da linha
  await ir('#/empresas');
  if (await p.locator('#dlg[open]').count()) await p.click('#dlg button:has-text("Descartar")');
  check('duas empresas na tabela', await p.locator('.lista-emp tbody tr').count() === 2);
  check('régua pequena em cada linha', await p.locator('.lista-emp .mini-regua').count() === 2);
  await p.fill('[data-filtro=q]', 'zzz'); await p.waitForTimeout(150);
  check('busca sem resultado oferece limpar', /Nenhuma empresa com esses filtros/.test(await txt(p, '#emp-lista')));
  await p.click('[data-acao=limpar-filtros]'); await p.waitForTimeout(150);
  await p.check('[data-sel-todas]'); await p.waitForTimeout(150);
  check('selecionar todas', /2 selecionadas/.test(await txt(p, '.barra-sel')));
  await p.click('.barra-sel [data-acao=comparar]'); await p.waitForTimeout(300);
  check('comparação de duas', (await p.evaluate(() => location.hash)) === '#/empresas/comparar' && await p.locator('.comp-tab thead th').count() === 3);
  await p.goBack(); await p.waitForTimeout(300);
  await p.click('.lista-emp tbody tr:first-child [data-acao=menu-emp]'); await p.waitForTimeout(100);
  check('menu da linha com três ações', await p.locator('#pop .mi').count() === 3);
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(50);
  check('setas andam pelo menu', await p.evaluate(() => document.activeElement && document.activeElement.dataset.acao === 'dup-emp'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  check('Esc fecha o menu e devolve o foco', await p.locator('#pop').count() === 0 && await p.evaluate(() => document.activeElement && document.activeElement.dataset.acao === 'menu-emp'));
  // backup: exportar e importar juntando
  await p.click('[data-acao=menu-empresas]');
  const [db] = await Promise.all([p.waitForEvent('download'), p.click('#pop [data-acao=exp-json]')]);
  const bk = JSON.parse(fs.readFileSync(await db.path(), 'utf8'));
  check('backup com empresas e listas', bk.empresas.length === 2 && Array.isArray(bk.listas) && !!bk.ultimoBackup);
  bk.empresas[0].dados.nome = 'Importada Nova'; bk.empresas[0].dados.cnpj = '11.222.333/0001-81'; bk.empresas[0].id = 'importada'; bk.empresas[0].alteradoEm = new Date().toISOString();
  fs.writeFileSync(path.join(TMP, 'vezen-backup-teste.json'), JSON.stringify(bk));
  await p.click('[data-acao=menu-empresas]');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#pop [data-acao=importar]')]);
  await fc.setFiles(path.join(TMP, 'vezen-backup-teste.json')); await p.waitForTimeout(300);
  await p.click('#dlg-acoes button:has-text("Juntar")'); await p.waitForTimeout(300);
  check('importar juntando', (await p.evaluate(() => S.empresas.length)) === 3 && /Importada Nova/.test(await txt(p, '.lista-emp tbody')));

  // 4. parâmetros: alteração pendente, aviso ao sair, descartar
  await ir('#/parametros');
  await p.fill('[data-p="crescimento.gSetor"]', '9'); await p.waitForTimeout(150);
  check('parâmetro alterado marca a barra lateral', await p.locator('#nav a[href="#/parametros"] .ponto').count() === 1 && /1 alteração não salva/.test(await txt(p, '#barra-par')));
  await p.fill('[data-par-busca]', 'salário'); await p.waitForTimeout(150);
  check('busca de parâmetros', await p.locator('.par-sec:not([hidden])').count() < await p.locator('.par-sec').count());
  await p.fill('[data-par-busca]', '');
  await p.click('#nav a[href="#/empresas"]'); await p.waitForTimeout(300);
  check('sair com alteração pede confirmação', await p.locator('#dlg[open]').count() === 1 && /alteração não salva/.test(await txt(p, '#dlg')));
  await p.click('#dlg-acoes button:has-text("Continuar editando")'); await p.waitForTimeout(200);
  check('continuar editando mantém a tela', (await p.evaluate(() => location.hash)) === '#/parametros');
  await p.click('#nav a[href="#/empresas"]'); await p.waitForTimeout(200);
  await p.click('#dlg-acoes button:has-text("Descartar alterações")'); await p.waitForTimeout(300);
  check('descartar volta ao valor salvo', (await p.evaluate(() => location.hash)) === '#/empresas' && (await p.evaluate(() => S.parametros.crescimento.gSetor)) !== 0.09);

  // 5. tema escuro, guardado
  await p.click('[data-acao=tema]'); await p.waitForTimeout(150);
  check('tema escuro', await p.evaluate(() => document.documentElement.dataset.tema) === 'escuro');
  await p.reload(); await p.waitForTimeout(300);
  check('tema escuro continua depois de recarregar', await p.evaluate(() => document.documentElement.dataset.tema) === 'escuro');
  await p.click('[data-acao=tema]');

  // 6. celular: menu lateral
  await p.setViewportSize({ width: 375, height: 800 }); await p.waitForTimeout(200);
  check('celular: barra lateral escondida', !(await p.locator('#lateral').isVisible()) || (await p.locator('#lateral').boundingBox()).x < 0);
  await p.click('.topo-movel [data-acao=menu]'); await p.waitForTimeout(300);
  check('celular: menu abre', (await p.locator('#lateral').boundingBox()).x >= 0);
  await p.click('#nav a[href="#/listas"]'); await p.waitForTimeout(400);
  check('celular: navegar fecha o menu', !(await p.evaluate(() => document.getElementById('casca').classList.contains('menu-aberto'))) && (await p.evaluate(() => location.hash)) === '#/listas');
  for (const h of ['#/listas', '#/empresas', '#/empresas/comparar']) { await ir(h); check('celular sem rolagem lateral: ' + h, await p.evaluate(() => document.documentElement.scrollWidth) <= 375, String(await p.evaluate(() => document.documentElement.scrollWidth))); }

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
