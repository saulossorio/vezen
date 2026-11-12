// Testes de tela dos três tipos de estimativa e da minha calibração.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path'), os = require('os');
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
  const ir = async (pg, h) => { await pg.evaluate(x => { location.hash = x; }, h); await pg.waitForTimeout(300); };
  const cartao = (pg, m) => txt(pg, `.tipo:has(h2:text-is("${m}"))`);
  await ir(p, '#/calibracao');
  check('cartões iniciais', /Guarda só parâmetros agregados/.test(await cartao(p, 'Calibração padrão')) && /Vazia/.test(await cartao(p, 'Minha calibração')), await cartao(p, 'Calibração padrão'));
  // a calibração que vem com a ferramenta é pública: nada sobre o tamanho, o nome ou a origem da base
  // padrões genéricos: o teste é público e não pode repetir o que a calibração esconde
  const telaCal = await txt(p, '#app'), padrao = await txt(p, '#cal-padrao') + ' ' + await cartao(p, 'Calibração padrão');
  check('calibração padrão sem tamanho, nome nem origem da base', !/\d{2,}[\d.]* empresas|\w\.xlsx?\b|empresas d[eo] [A-Z]{2}\b|Coluna “|segmentos da base|Fora da conta/.test(padrao) && /sem dados de nenhuma empresa nem o tamanho da base/.test(await txt(p, '#cal-padrao .cal-uso')), await txt(p, '#cal-padrao .cal-uso'));
  check('tabelas da padrão sem colunas de empresas', await p.locator('#cal-padrao th:text-is("Empresas")').count() === 0 && await p.locator('#cal-padrao td small:text-is("geral")').count() === 2);
  check('acerto da padrão em porcentagem', /Dentro da faixa de 80%: \d+% das empresas antes e \d+% depois/.test(telaCal), (telaCal.match(/Dentro da faixa[^.]*/) || [''])[0]);

  // análise nova: começa em fórmulas base; minha calibração desabilitada sem empresas
  await ir(p, '#/empresas'); await p.click('#app [data-acao=nova] >> nth=0'); await p.waitForTimeout(200);
  await p.check('input[data-objetivo][value=ti]'); await p.waitForTimeout(150);
  check('nova análise em fórmulas base', await p.evaluate(() => document.querySelector('#painel input[data-modo]:checked').value) === 'base');
  const dis = await p.evaluate(() => [...document.querySelectorAll('#painel input[data-modo]')].map(i => i.value + ':' + i.disabled).join(','));
  check('minha desabilitada sem empresas', dis === 'base:false,padrao:false,propria:true', dis);
  await p.fill('#f-nome', 'Teste Serviços'); await p.selectOption('#f-setor', 'servicos'); await p.selectOption('#f-uf', 'SP');
  await p.fill('#f-faturamento', '300.000.000'); await p.fill('#f-funcionarios', '600'); await p.waitForTimeout(700);
  const v0 = await txt(p, '#cr-valor');
  check('cartão em fórmulas base mostra quanto daria a padrão', /R\$/.test(await txt(p, '#painel .modo-op:has(input[value=padrao]) .mo-val')), await txt(p, '#painel .modo-op:has(input[value=padrao])'));
  await p.click('#painel label.modo-op:has(input[data-modo][value=padrao])'); await p.waitForTimeout(900);
  const v1 = await txt(p, '#cr-valor');
  check('calibração padrão muda o valor', v0 !== v1 && await p.evaluate(() => document.querySelector('#painel input[data-modo]:checked').value) === 'padrao', `${v0} → ${v1}`);
  check('opção da padrão sem o tamanho da base', /^Médias corrigidas com empresas reais$/.test(await txt(p, '#painel .modo-op:has(input[value=padrao]) small')));
  check('confiança da padrão em porcentagem', /Acerto medido na calibração: \d+% das empresas dentro da faixa/.test(await txt(p, '#painel .cr-conf')), await txt(p, '#painel .cr-conf'));
  // gasto real de 2025 para a análise entrar na minha calibração depois
  await p.click('[data-acao=add-real]'); await p.waitForTimeout(200);
  await p.fill('[data-real="0"][data-parte="ano"]', '2025'); await p.fill('[data-real="0"][data-parte="v"]', '4.000.000'); await p.waitForTimeout(300);
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(400);

  // tela de calibração
  await ir(p, '#/calibracao');
  check('duas seções', await p.locator('#cal-padrao').count() === 1 && await p.locator('#cal-minha').count() === 1);
  check('análise salva aparece na minha', /Análises salvas com gasto real \(1\)/.test(await txt(p, '#cal-minha')));
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
  check('"250 mi" e "3,1 mi" lidos', /Alfa.*R\$ 250,00 mi.*2025.*400.*12.*R\$ 3,10 mi/.test(lin), lin);
  check('cartão com a minha', /6 empresas suas/.test(await cartao(p, 'Minha calibração')), await cartao(p, 'Minha calibração'));
  const uso = await txt(p, '#cal-minha .cal-uso');
  check('minha em uso só com a receita', /^Em uso: 6 empresas \(5 digitadas, 1 análise salva com gasto real\) de 2 estados\.$/.test(uso), uso);
  check('receita: só o nível', /Nível geral: × [\d,]+ sobre as fórmulas base/.test(await txt(p, '#cal-minha')));
  check('gasto de TI: poucas empresas', /Só 5 empresas têm gasto de TI real utilizável; são precisas 10/.test(await txt(p, '#cal-minha')));
  // editar uma digitada
  await p.click('.tab-minhas tbody tr:last-child [data-minha-edit]'); await p.waitForTimeout(200);
  check('editar abre com os valores', await p.inputValue('#fm-nome') === 'Alfa' && await p.inputValue('#fm-receita') === '250.000.000', await p.inputValue('#fm-receita'));
  await p.fill('#fm-receita', '260 mi'); await p.click('[data-acao=minha-salvar]'); await p.waitForTimeout(250);
  check('edição salva', /R\$ 260,00 mi/.test(await txt(p, '.tab-minhas tbody tr:last-child')) && await p.locator('.tab-minhas tbody tr').count() === 5);

  // importar planilha para a minha calibração
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-acao=minha-importar]')]);
  await fc.setFiles(path.join(D, 'minhas.csv')); await p.waitForTimeout(1200);
  check('tela de importação', (await txt(p, '#app h1')) === 'Importar para a minha calibração' && /minhas\.csv/.test(await txt(p, '#app .cab .sub')), await txt(p, '#app h1'));
  check('botão adicionar 14', /Adicionar 14 empresas/.test(await txt(p, '[data-acao=usar-base]')), await txt(p, '[data-acao=usar-base]'));
  check('gasto de TI mapeado', await p.inputValue('#mp-gastoTI') === 'Gasto de TI real (R$)' && await p.inputValue('#mp-funcTI') === 'Funcionários de TI', await p.inputValue('#mp-gastoTI'));
  check('prévia corrige o gasto de TI', /Correção geral: × [\d,]+/.test(await txt(p, '#app')));
  await p.click('[data-acao=usar-base]'); await p.waitForTimeout(500);
  check('19 empresas na lista', await p.locator('.tab-minhas tbody tr').count() === 19, String(await p.locator('.tab-minhas tbody tr').count()));
  const uso2 = await txt(p, '#cal-minha .cal-uso');
  check('em uso com digitadas, importadas e salva', /20 empresas \(5 digitadas, 14 importadas, 1 análise salva com gasto real\)/.test(uso2), uso2);
  check('correção do gasto de TI ativa', /Correção geral: × [\d,]+\. Na mediana/.test(await txt(p, '#cal-minha')));
  check('arquivo listado', /minhas\.csv: 14 empresas remover/.test(await txt(p, '.cal-arqs')), await txt(p, '.cal-arqs'));
  // baixar lista
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-acao=minha-baixar]')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '').split('\r\n');
  check('CSV da lista', csv.length === 20 && /Receita líquida 2024 \(R\$\).*Receita líquida 2025 \(R\$\).*Gasto de TI real 2025 \(R\$\)/.test(csv[0]), csv[0] + ' | ' + csv.length);
  fs.writeFileSync(path.join(TMP, 'vezen-lista-baixada.csv'), csv.join('\r\n'));

  // análise com a minha calibração
  await ir(p, '#/empresas');
  await p.click('.lista-emp .emp-nome >> nth=0'); await p.waitForTimeout(500);
  const dis2 = await p.evaluate(() => [...document.querySelectorAll('#painel input[data-modo]')].map(i => i.value + ':' + i.disabled).join(','));
  check('minha habilitada', dis2 === 'base:false,padrao:false,propria:false', dis2);
  await p.click('#painel label.modo-op:has(input[data-modo][value=propria])'); await p.waitForTimeout(500);
  const vals = await p.evaluate(() => [...document.querySelectorAll('#painel .modo-op .mo-val')].map(e => e.textContent));
  check('cartão com o valor dos três tipos', vals.length === 3 && vals.every(v => /R\$/.test(v)), vals.join(' | '));
  check('opção da minha diz as empresas', /20 empresas suas/.test(await txt(p, '#painel .modo-op:has(input[value=propria]) small')));
  await p.click('#painel [data-acao=resumo]'); await p.waitForTimeout(300);
  const res = await p.inputValue('#txt-resumo');
  check('resumo: título', /\(minha calibração\)/.test(res));
  check('resumo: tipo e outros tipos', /Tipo de estimativa: minha calibração, com as empresas informadas por você \(.*\).*Pelos outros tipos: fórmulas base, Geral R\$ .* calibração padrão, Geral R\$/.test(res), (res.match(/- Tipo de estimativa.*/) || [''])[0].slice(0, 300));
  check('resumo: limitações', /minha calibração feita com 20 empresas informadas por você/.test(res));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(500);
  check('resultado: chip e seletor', await p.locator('#res-estimativa .chip-modo.minha').count() === 1 && await p.locator('#res-estimativa input[data-modo]').count() === 3);
  const etapas = (await p.evaluate(() => [...document.querySelectorAll('.etapas')].map(e => e.textContent).join(' '))).replace(/\s+/g, ' ');
  check('resultado: correção da minha', /Correção da calibração ?Aprendida com \d+ das suas empresas com gasto de TI real/.test(etapas), etapas.slice(0, 300));
  await ir(p, '#/empresas');
  check('lista mostra o tipo', /minha calibração/i.test(await txt(p, '#app table tbody')));

  // remover o arquivo e depois tudo
  await ir(p, '#/calibracao');
  await p.click('[data-minha-arq="minhas.csv"]'); await p.waitForTimeout(200);
  check('diálogo de remoção', /Remover 14 empresas\?/.test(await txt(p, '#dlg')));
  await p.click('#dlg-acoes button:has-text("Remover")'); await p.waitForTimeout(300);
  check('sobram as digitadas', await p.locator('.tab-minhas tbody tr').count() === 5);
  // importar de novo a lista baixada: as digitadas são atualizadas pelo nome, as do arquivo voltam
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
  // a análise salva pediu a minha, que agora está incompleta: volta para fórmulas base com aviso
  await ir(p, '#/empresas');
  check('lista: volta para fórmulas base', /fórmulas base/i.test(await txt(p, '#app table tbody')));
  await p.click('.lista-emp .emp-nome >> nth=0'); await p.waitForTimeout(500);
  check('aviso de minha incompleta', /A minha calibração ainda não tem empresas suficientes/.test(await txt(p, '#painel')));

  // trocar a base padrão e voltar
  await ir(p, '#/calibracao');
  const [fc3] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-acao=enviar-base]')]);
  await fc3.setFiles(path.join(D, 'minhas.csv')); await p.waitForTimeout(1200);
  check('nova base padrão', (await txt(p, '#app h1')) === 'Nova base padrão' && /Usar como base padrão/.test(await txt(p, '[data-acao=usar-base]')));
  await p.click('[data-acao=usar-base]'); await p.waitForTimeout(400);
  check('padrão trocada', /Em uso: minhas\.csv, enviada em/.test(await txt(p, '#cal-padrao .cal-uso')) && /14 empresas/.test(await cartao(p, 'Calibração padrão')), await cartao(p, 'Calibração padrão'));
  await p.click('[data-acao=base-embutida]'); await p.waitForTimeout(300);
  check('de volta à embutida', /Guarda só parâmetros agregados/.test(await cartao(p, 'Calibração padrão')));

  // metodologia, testes e celular
  await ir(p, '#/metodologia');
  check('metodologia: 16 seções', await p.locator('.met-sec').count() === 16);
  check('metodologia: títulos', (await txt(p, '#met-base-t')) === 'Tipos de estimativa e calibração' && (await txt(p, '#met-calibracao-t')) === 'Correção do gasto de TI');
  check('testes 134 de 134', /134 de 134/.test(await txt(p, '#met-testes')), (await txt(p, '#met-testes')).match(/\d+ de \d+/)[0]);
  await p.setViewportSize({ width: 375, height: 800 });
  const id = await p.evaluate(() => UI.atual.id);
  for (const [t, h] of [['calibracao', '#/calibracao'], ['analise', `#/analise/${id}`], ['resultado', `#/analise/${id}/resultado`], ['metodologia', '#/metodologia']]) {
    await ir(p, h); await p.waitForTimeout(200);
    if (t === 'calibracao') { await p.click('[data-acao=minha-nova]'); await p.waitForTimeout(200); }
    const w = await p.evaluate(() => document.documentElement.scrollWidth);
    check('celular sem rolagem lateral: ' + t, w <= 375, String(w));
    await p.screenshot({ path: path.join(TMP, `vezen-cel-${t}.png`), fullPage: false });
  }
  await p.setViewportSize({ width: 1360, height: 900 });

  // dados antigos: “Calibrada” vira calibração padrão; a correção aplicada antiga é deixada de lado
  const ctx2 = await b.newContext({ viewport: { width: 1360, height: 900 } }), p2 = await ctx2.newPage();
  p2.on('pageerror', e => erros.push('p2: ' + e.message));
  await p2.goto(URL);
  await p2.evaluate(() => {
    const d = { nome: 'Antiga', cnpj: '', uf: 'SP', natureza: 'privada', setor: 'industria', faturamento: { v: 500000000, o: 'oficial' }, fatAno: '2025', funcionarios: { v: 1200, o: 'terceiros' }, modo: 'calibrada' };
    localStorage.setItem('estimador-ti.v1', JSON.stringify({ versao: 3, empresas: [{ id: 'x1', criadoEm: '2026-11-10T10:00:00Z', alteradoEm: '2026-11-10T10:00:00Z', dados: d }],
      calibracao: { aplicada: { data: '2026-11-10', N: 12, kg: 0.5, ks: {}, lambda: 1.2, acerto: 9, base: 'base-2026-11-10' }, historico: [null], base: null, semBase: false, mapaUlt: null } }));
  });
  await p2.reload(); await p2.waitForTimeout(400);
  check('migração: calibrada → padrão', /calibração padrão/i.test(await txt(p2, '#app table tbody')), await txt(p2, '#app table tbody'));
  await ir(p2, '#/calibracao');
  check('migração: minha vazia', /Vazia/.test(await cartao(p2, 'Minha calibração')), await cartao(p2, 'Minha calibração'));

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
