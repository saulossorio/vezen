// Análise de uma empresa: o que estimar, receita líquida (tipo, ano, estimativa, receita global e câmbio), cartão do resultado, resumo para copiar, prompt, CNPJ (filial e busca só pela lupa),
// resultado detalhado, barra lateral recolhida, cartão preso embaixo na área estreita, altura dos campos e dados de versões anteriores.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), os = require('os');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = (rot, c, extra = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (extra ? '  [' + extra + ']' : '')); if (!c) process.exitCode = 1; };
const cnpjCom = base12 => { const d = base12.split('').map(Number); const dv = n => { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += d[i] * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; }; d.push(dv(12)); d.push(dv(13)); return d.join(''); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  let pedidosCambio = [];
  let pedidosCnpj = 0;
  await p.route('**/brasilapi.com.br/api/cnpj/**', r => { pedidosCnpj++; r.abort(); });
  await p.route('**/brasilapi.com.br/api/cambio/**', r => { pedidosCambio.push(r.request().url()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ cotacoes: [{ cotacao_compra: 3.3074, cotacao_venda: 3.308, data_hora_cotacao: '2017-12-29 13:11:00', tipo_boletim: 'FECHAMENTO PTAX' }], moeda: 'USD', data: '2017-12-31' }) }); });
  await p.goto(URL);
  const ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(250); };
  // origem do dado: o botão embaixo do campo abre o menu com os quatro tipos
  const orig = async (c, o) => { await p.click(`[data-acao=origem][data-alvo="campo:${c}"]`); await p.click(`#pop [data-o=${o}]`); };
  const motor = expr => p.evaluate(expr);
  const txt = async s => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
  // salvar: se o verificador listar campos sem resposta, segue com “Salvar assim mesmo”
  const salvarOk = async (espera = 200) => { await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(150); if (await p.locator('#dlg[open]').count()) await p.click('#dlg button:has-text("Salvar assim mesmo")'); await p.waitForTimeout(espera); };

  // 1. receita bruta antiga, oficial: conversão, ano e comparação (caso E da Metodologia)
  await p.click('#app [data-acao=nova]'); await p.waitForTimeout(200);
  ok('Nova análise pede primeiro o que estimar', await p.locator('#sec-objetivo.pede').count() === 1 && await p.locator('#sec-objetivo input[data-objetivo]').count() === 2 && (await motor(() => UI.atual.dados.fatEstimar)) === null);
  ok('Foco na escolha do que estimar', await p.evaluate(() => document.activeElement && document.activeElement.matches('input[data-objetivo]')));
  ok('Sem a caixa antiga de estimar a receita', await p.locator('[data-chk=fatEstimar]').count() === 0);
  ok('Alturas iguais: campos, listas e seletores com 40px', await p.evaluate(() => [...document.querySelectorAll('#form input[type=text], #form select, #form .seg')].filter(e => e.offsetParent).every(e => Math.round(e.getBoundingClientRect().height) === 40)));
  ok('Ano da receita vem preenchido com o último ano fechado', (await p.inputValue('#f-fatAno')) === String(new Date().getFullYear() - 1));
  await p.fill('#f-nome', 'Varejo Teste'); await p.selectOption('#f-natureza', 'privada'); await p.selectOption('#f-setor', 'varejo'); await p.selectOption('#f-uf', 'RS');
  ok('Origem só aparece quando o campo tem valor', await p.locator('[data-alvo="campo:faturamento"]').isHidden());
  await p.fill('#f-faturamento', '500.000.000');
  ok('Campo com valor e sem origem pede a marcação', (await txt('[data-alvo="campo:faturamento"]')).includes('Marcar origem'));
  await orig('faturamento', 'oficial');
  ok('Origem marcada aparece no botão', (await txt('[data-alvo="campo:faturamento"]')).includes('Oficial') && (await motor(() => UI.atual.dados.faturamento.o)) === 'oficial');
  ok('Seletor líquida/bruta aparece', await p.locator('.seg input[name=fatTipo]').count() === 2);
  await p.fill('#f-fatAno', String(new Date().getFullYear())); await p.waitForTimeout(100);
  ok('Ano atual no valor da receita avisa que pode ser parcial', (await p.textContent('#dica-rec')).includes('ainda não fechou'));
  await p.click('.seg-op:has(input[value=bruta])'); await p.fill('#f-fatAno', '2024');
  await p.fill('#f-funcionarios', '2.000'); await orig('funcionarios', 'agregador'); await p.waitForTimeout(150);
  const dica = await p.textContent('#dica-rec');
  ok('Dica explica a conversão e o ano', dica.includes('tirando 18%') && dica.includes('Valor de 2024 levado a 2026'), dica);
  ok('Receita usada = 469,41 mi', (await motor(() => calc(UI.atual.dados).receita.usada.v)).toFixed(0) === '469409000');
  ok('Campo mostra a receita líquida usada e a origem', (await txt('#rec-usada')).includes('R$ 469,41 mi') && (await txt('#rec-usada')).includes('Oficial'));
  ok('Só investimento em TI: o cartão não mostra a receita', await p.locator('#painel #cr-receita').count() === 0);
  await p.check('input[data-objetivo][value=ti-receita]'); await p.waitForTimeout(250);
  ok('Escolha feita: seção sem destaque', await p.locator('#sec-objetivo.pede').count() === 0 && (await motor(() => UI.atual.dados.fatEstimar)) === true);
  ok('Receita e TI: o cartão mostra a receita líquida usada', (await txt('#cr-receita')) === await p.evaluate(() => fmtRS(calc(UI.atual.dados).receita.usada.v)) && (await txt('#painel .cr-topo')).includes('Valor informado'));
  ok('Campo da receita diz que é opcional', (await txt('label[for=f-faturamento]')).includes('(se tiver)'));
  const caixa = await p.textContent('#rec-est');
  ok('Estimar com receita oficial: só comparação', caixa.includes('só para comparação') && caixa.includes('Receita líquida estimada'), caixa.slice(0, 120));
  ok('Aviso: oficial fora da faixa estimada', caixa.includes('fora da faixa'));
  ok('Valor oficial continua no cálculo', (await motor(() => calc(UI.atual.dados).receita.modo)) === 'informada');
  ok('Cartão: geral e conservadora', await p.locator('#painel .cr-dois > div').count() === 2 && (await txt('#painel .cr-dois')).includes('Conservadora'));
  const z = await motor(() => calc(UI.atual.dados).resumo);
  ok('Cartão: conservadora = motor', (await txt('#painel .cr-dois div:nth-child(2) b')) === await p.evaluate(v => fmtRS(v), z.conservadora));
  await p.waitForTimeout(700); // o valor do cartão anima até o novo
  ok('Cartão: valor central = motor', (await txt('#cr-valor')).startsWith(await p.evaluate(() => fmtRS(calc(UI.atual.dados).F))));
  ok('Sem salários = 64% do geral', Math.abs(z.geralSem / z.geral - 0.64) < 1e-9);
  ok('Cartão: tipo de estimativa com o valor de cada opção', await p.locator('#painel .modo-op').count() === 3 && /R\$/.test(await txt('#painel .modo-op:has(input[value=padrao]) .mo-val')));
  ok('Cartão: o que falta para a confiança, num acordeão fechado', await p.locator('#painel details.cr-dicas:not([open]) .pmd button').count() >= 1);
  await p.click('#painel details.cr-dicas > summary'); await p.fill('#f-funcionarios', '2.001'); await p.waitForTimeout(150);
  ok('Acordeão continua aberto quando o cartão se redesenha', await p.locator('#painel details.cr-dicas[open]').count() === 1);
  await p.click('#painel details.cr-dicas > summary'); await p.fill('#f-funcionarios', '2.000'); await p.waitForTimeout(150);
  ok('Desktop: cartão preso no topo ao rolar', await p.evaluate(() => getComputedStyle(document.querySelector('.resumo-lado')).position === 'sticky' && getComputedStyle(document.querySelector('.cr-abrir')).display === 'none'));
  // resumo para copiar
  await p.click('#painel [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  const res = await p.inputValue('#txt-resumo');
  for (const t of ['1. Receita líquida no Brasil (2026, BRL): R$ 469,41 mi (calculada a partir de dado oficial)', 'faturamento bruto de 2024', 'tirando 18%', '2. Estimativa Conservadora – investimento em TI:', '3. Estimativa Geral – investimento em TI:', '4. Fontes, cálculos e observações', 'com os salários da equipe de TI', 'estão incluídos', 'Faturamento global: não utilizado', 'Conversão de moeda: nenhuma', 'Metodologia:', 'Benchmarks: FGV-EAESP', 'Limitações:'])
    ok('Resumo tem: ' + t, res.includes(t));
  fs.writeFileSync(path.join(os.tmpdir(), 'vezen-resumo-E.txt'), res);
  await p.click('#dlg button:has-text("Copiar resumo")'); await p.waitForTimeout(150);
  ok('Resumo copiado para a área de transferência', (await p.evaluate(() => navigator.clipboard.readText())).startsWith('Varejo Teste'));
  // com ou sem salários de TI: a escolha é feita no resumo ou no resultado e fica salva na análise
  ok('Padrão: com salários de TI', (await motor(() => UI.atual.dados.salariosTI)) === 'com' && (await txt('#painel')).includes('com salários da equipe de TI'));
  await p.click('#dlg .seg-sal .seg-op:has(input[value=sem])'); await p.waitForTimeout(100);
  ok('Resumo segue a escolha (sem)', (await p.inputValue('#txt-resumo')).includes('sem os salários da equipe de TI') && (await p.inputValue('#txt-resumo')).includes('estão excluídos'));
  await p.click('#dlg button:has-text("Fechar")'); await p.waitForTimeout(200);
  const z2 = await motor(() => calc(UI.atual.dados).resumo);
  ok('Sem salários: escolha salva na análise', (await motor(() => UI.atual.dados.salariosTI)) === 'sem' && z2.comSalarios === false);
  ok('Sem salários: cartão mostra a geral sem a equipe', (await txt('#painel .cr-dois div:nth-child(1) b')) === await p.evaluate(v => fmtRS(v), z2.geralSem));
  await p.click('#painel [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  await p.click('#dlg .seg-sal .seg-op:has(input[value=com])'); await p.waitForTimeout(100);
  ok('Trocar no resumo atualiza o texto', (await p.inputValue('#txt-resumo')).includes('com os salários da equipe de TI'));
  await p.click('#dlg button:has-text("Fechar")'); await p.waitForTimeout(200);
  ok('Fechar o resumo atualiza o cartão', (await txt('#painel .cr-dois div:nth-child(1) b')) === await p.evaluate(v => fmtRS(v), z.geral));

  // 2. subsidiária com receita estimada pela receita global (caso D)
  await p.click('[data-acao=menu-analise]'); await p.click('#pop [data-acao=nova]'); await p.waitForTimeout(150);
  if (await p.locator('#dlg[open]').count()) await p.click('#dlg button:has-text("Descartar")');
  await p.waitForTimeout(150);
  await p.fill('#f-nome', 'Subsidiária Teste'); await p.selectOption('#f-natureza', 'subsidiaria'); await p.selectOption('#f-setor', 'industria'); await p.selectOption('#f-uf', 'SP');
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(200);
  ok('Salvar sem escolher o que estimar: pede a escolha', (await txt('#toast')).includes('Escolha o que esta análise vai estimar') && !(await txt('#ws-meta')).includes('Salva em') && await p.evaluate(() => document.activeElement && document.activeElement.matches('input[data-objetivo]')));
  ok('Rótulo da receita para subsidiária', (await p.textContent('label[for=f-faturamento]')).includes('Receita anual no Brasil'));
  await p.fill('#f-funcionarios', '1.200'); await orig('funcionarios', 'terceiros');
  await p.check('input[data-objetivo][value=ti-receita]'); await p.waitForTimeout(250);
  ok('Bloco da receita global aparece', await p.locator('.rec-global').count() === 1);
  ok('Só funcionários com o cálculo por usuários ativo: a receita fica de fora', (await p.textContent('#rec-est')).includes('não entra no cálculo pela receita') && !(await motor(() => calc(UI.atual.dados).ests.some(e => e.cod === 'E1'))));
  await p.fill('#f-globalRec', '5.000.000.000'); await orig('globalRec', 'oficial');
  await p.fill('#f-globalAno', '2025'); await p.fill('#f-globalFunc', '40.000'); await orig('globalFunc', 'oficial'); await p.waitForTimeout(150);
  ok('Dica do câmbio mostra a PTAX da tabela', (await p.textContent('#dica-taxa')).includes('31/12/2025') && (await p.textContent('#dica-taxa')).includes('5,5024'), await p.textContent('#dica-taxa'));
  await p.fill('#f-fatAno', '2026');
  const rD = await motor(() => { const r = calc(UI.atual.dados); return { rec: r.receita.usada.v, F: r.F }; });
  ok('Receita estimada = caso D (912,67 mi)', Math.abs(rD.rec / 912.67e6 - 1) < 0.001, rD.rec);
  ok('F = caso D sem equipe de TI (55,55 mi)', Math.abs(rD.F / 55.55e6 - 1) < 0.001, rD.F);
  ok('Caixa mostra os dois caminhos', (await p.textContent('#rec-est')).includes('Pelos funcionários') && (await p.textContent('#rec-est')).includes('Pela receita global do grupo'));
  // câmbio de ano fora da tabela: busca na API
  await p.fill('#f-globalAno', '2017'); await p.waitForTimeout(100);
  ok('Ano sem PTAX na tabela pede busca', (await p.textContent('#dica-taxa')).includes('não tem a PTAX'));
  await p.click('[data-acao=buscar-ptax]'); await p.waitForTimeout(400);
  ok('Buscar PTAX consulta 31/12 do ano', pedidosCambio.length === 1 && pedidosCambio[0].endsWith('/USD/2017-12-31'), pedidosCambio[0]);
  ok('Taxa buscada preenchida (3,308)', (await motor(() => UI.atual.dados.globalTaxa)) === 3.308, await p.inputValue('#f-globalTaxa'));
  ok('Fonte da taxa registrada', (await p.textContent('#dica-taxa')).includes('PTAX de 29/12/2017'), await p.textContent('#dica-taxa'));
  // taxa manual e participação informada
  await p.fill('#f-globalTaxa', '5,1'); await p.fill('#f-globalPart', '4'); await orig('globalPart', 'oficial'); await p.waitForTimeout(150);
  ok('Taxa digitada vira manual', (await motor(() => UI.atual.dados.globalTaxaFonte)) === 'manual' && (await p.textContent('#dica-taxa')).includes('digitada'));
  ok('Participação informada é usada', (await motor(() => calc(UI.atual.dados).receita.global.shareFonte)) === 'informada');
  await p.selectOption('#f-globalMoeda', 'BRL'); await p.waitForTimeout(200);
  ok('Moeda real esconde o câmbio', await p.locator('#f-globalTaxa').count() === 0);
  await p.selectOption('#f-globalMoeda', 'USD'); await p.waitForTimeout(150); await p.fill('#f-globalTaxa', ''); await p.fill('#f-globalAno', '2025'); await p.locator('#f-globalAno').blur(); await p.waitForTimeout(150);

  // 3. resultado detalhado
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(400);
  ok('Resultado: endereço próprio', (await p.evaluate(() => location.hash)).endsWith('/resultado'));
  ok('Resultado: índice com as seções', await p.locator('.indice-lado button').count() >= 9);
  ok('Resultado: estimativas para o resumo', await p.locator('#res-resumo .est-b.sem').count() === 2);
  await p.click('#res-resumo .seg-sal .seg-op:has(input[value=sem])'); await p.waitForTimeout(300);
  ok('Resultado: sem salários marca a parte da equipe como fora', await p.locator('#res-resumo .est-b.eq.fora').count() === 2 && (await motor(() => UI.atual.dados.salariosTI)) === 'sem');
  await p.click('#res-resumo .seg-sal .seg-op:has(input[value=com])'); await p.waitForTimeout(300);
  ok('Resultado: volta para com salários', await p.locator('#res-resumo .est-b.eq.fora').count() === 0);
  ok('Resultado: caminhos em lista, com a conta ao abrir', await p.locator('#res-caminhos details.cam-item').count() === (await motor(() => calc(UI.atual.dados).ests.length)));
  await p.click('#res-caminhos details.cam-item >> nth=0 >> summary'); await p.waitForTimeout(100);
  ok('Resultado: conta do caminho aberto', await p.locator('#res-caminhos details.cam-item[open] .eq .termo.res').count() === 1);
  ok('Resultado: receita com 2 caminhos', await p.locator('#res-receita .cp-pt').count() === 2);
  ok('Resultado: contas dos caminhos da receita', await p.locator('#res-receita .rec-cams .eq').count() === 2);
  ok('Resultado: nota do câmbio', (await p.textContent('#res-receita')).includes('PTAX de 31/12/2025'));
  ok('Resultado: parte da receita no topo', (await txt('#res-estimativa .numeros')).includes('receita de R$'));
  ok('Resultado: receita líquida no topo quando a análise estima a receita', (await txt('#res-receita-num')).startsWith(await p.evaluate(() => fmtRS(calc(UI.atual.dados).receita.usada.v))));
  await p.click('#res-resumo [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  const res2 = await p.inputValue('#txt-resumo'); fs.writeFileSync(path.join(os.tmpdir(), 'vezen-resumo-D.txt'), res2);
  ok('Resumo D: receita estimada marcada como não oficial', res2.includes('ESTIMADA pela ferramenta, não é dado oficial'));
  ok('Resumo D: faturamento global utilizado com câmbio', res2.includes('Faturamento global: utilizado') && res2.includes('PTAX de 31/12/2025'));
  ok('Resumo D: conversão com moeda e valor original', res2.includes('moeda original USD') && res2.includes('USD 5,00 bi'));
  await p.click('#dlg button:has-text("Fechar")');
  // como aumentar a confiança: o botão leva ao campo, na aba de dados
  await p.click('#res-faixa .mel button >> nth=0'); await p.waitForTimeout(300);
  ok('Resultado: dado que falta leva ao campo', !(await p.evaluate(() => location.hash)).endsWith('/resultado') && (await p.evaluate(() => document.activeElement && document.activeElement.closest('#form') !== null)));

  // 4. CNPJ de filial
  await p.fill('#f-cnpj', cnpjCom('112223330002')); await p.waitForTimeout(100);
  await p.locator('#f-cnpj').evaluate(e => e.dispatchEvent(new Event('input', { bubbles: true })));
  await p.fill('#f-funcionarios', '1.201'); await p.waitForTimeout(150);
  ok('Aviso de CNPJ de filial', (await p.textContent('#v-cnpj')).includes('filial'), await p.textContent('#v-cnpj'));
  await p.fill('#f-cnpj', cnpjCom('112223330001')); await p.fill('#f-funcionarios', '1.200'); await p.waitForTimeout(150);
  ok('Matriz sem aviso', !(await p.textContent('#v-cnpj')).includes('filial'));
  ok('CNPJ completo não busca sozinho', pedidosCnpj === 0, String(pedidosCnpj));
  ok('Lupa dentro do campo do CNPJ', await p.locator('.entrada.com-acao #f-cnpj + [data-acao=buscar-cnpj]').count() === 1);
  await p.click('[data-acao=buscar-cnpj]'); await p.waitForTimeout(400);
  ok('A lupa busca na Receita', pedidosCnpj === 1 && (await txt('#v-cnpj')).includes('Não foi possível consultar agora'), await txt('#v-cnpj'));
  await p.focus('#f-cnpj'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok('Enter no campo também busca', pedidosCnpj === 2, String(pedidosCnpj));

  // 5. prompt da IA com as regras do time
  await p.click('[data-acao=prompt-ia]'); await p.locator('#dlg[open]').waitFor();
  const pr = await p.inputValue('#txt-prompt');
  for (const t of ['Pesquise primeiro as fontes oficiais', 'Nunca invente valores, fontes ou documentos', 'Não confunda com outras empresas do mesmo grupo', 'receita líquida ou faturamento bruto', 'sem converter', 'Receita global do grupo (valor, moeda e ano)', 'Valor 1000'])
    ok('Prompt tem: ' + t, pr.includes(t));
  await p.click('#dlg button:has-text("Fechar")');

  // 6. salvar, metodologia, parâmetros, testes, CSV
  await salvarOk(150);
  ok('Salvar: cabeçalho mostra salva', (await txt('#ws-meta')).includes('Salva em') && await p.locator('#ws-acoes [data-acao=salvar]').isDisabled());
  ok('Salvar: empresa na barra lateral', (await txt('#nav')).includes('Subsidiária Teste'));
  await ir('#/metodologia');
  ok('Metodologia: seção da receita', (await p.textContent('#met-receita')).includes('Qual receita entra no cálculo'));
  ok('Metodologia: seção das estimativas', (await p.textContent('#met-estimativas')).includes('percentil 25'));
  ok('Metodologia: testes 134 de 134', (await p.textContent('#met-testes')).includes('134 de 134'));
  await ir('#/parametros');
  ok('Parâmetros: seção da receita com 12 setores', await p.locator('#par-receita [data-pcampo$=".rpe"]').count() === 12);
  ok('Parâmetros: percentil da conservadora', await p.locator('[data-pcampo="estimativas.conservadora"]').count() === 1);
  await ir('#/empresas');
  await p.click('[data-acao=menu-empresas]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#pop [data-acao=exp-csv]')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  ok('CSV com receita e estimativas', csv.includes('Receita líquida usada (R$)') && csv.includes('Estimativa conservadora (R$)') && csv.includes('Estimada pela ferramenta'));
  await ir('#/testes');
  ok('Tela de testes: 6 casos passaram', await p.locator('.teste-cab .ok').count() === 6);

  // barra lateral recolhida: só ícones, com o nome ao passar o mouse; fica recolhida ao recarregar
  await p.click('[data-acao=recolher]'); await p.waitForTimeout(250);
  ok('Barra lateral recolhida', await p.evaluate(() => document.documentElement.dataset.lateral === 'recolhida' && document.querySelector('.lateral').getBoundingClientRect().width <= 64));
  ok('Recolhida: itens com o nome na dica e para leitores de tela', await p.evaluate(() => [...document.querySelectorAll('#nav .lat-item')].every(a => a.dataset.tip && a.textContent.trim())));
  await p.reload(); await p.waitForTimeout(300);
  ok('Recolhida continua ao recarregar', await p.evaluate(() => document.documentElement.dataset.lateral === 'recolhida'));
  await p.click('[data-acao=recolher]'); await p.waitForTimeout(250);
  ok('Expandir de novo', await p.evaluate(() => !document.documentElement.dataset.lateral && document.querySelector('.lateral').getBoundingClientRect().width > 200 && localStorage.getItem('vezen.lateral') === 'aberta'));
  // área estreita: o cartão fica preso embaixo da tela, com os valores à vista sem rolar
  await ir('#/analise/' + await p.evaluate(() => S.empresas[0].id));
  await p.setViewportSize({ width: 1000, height: 760 }); await p.waitForTimeout(250);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
  const caixaCartao = await p.evaluate(() => { const r = document.querySelector('#painel').getBoundingClientRect(); return { topo: r.top, base: r.bottom, h: innerHeight }; });
  ok('Área estreita: cartão visível embaixo sem rolar', caixaCartao.base <= caixaCartao.h + 1 && caixaCartao.topo < caixaCartao.h && caixaCartao.topo > caixaCartao.h / 2, JSON.stringify(caixaCartao));
  ok('Área estreita: só os valores, detalhes recolhidos', await p.locator('#painel .cr-resto').isHidden() && await p.locator('#painel #cr-valor').isVisible() && await p.locator('#painel #cr-receita').isVisible());
  await p.click('[data-acao=cartao-abrir]'); await p.waitForTimeout(150);
  ok('Área estreita: Detalhes abre o resto', await p.locator('#painel .cr-resto').isVisible() && (await p.getAttribute('[data-acao=cartao-abrir]', 'aria-expanded')) === 'true');
  await p.click('[data-acao=cartao-abrir]'); await p.waitForTimeout(100);
  await p.setViewportSize({ width: 1360, height: 900 }); await p.waitForTimeout(200);

  // 7. dados salvos numa versão anterior (sem os campos novos) continuam funcionando
  await p.evaluate(() => {
    const velho = JSON.parse(localStorage.getItem('estimador-ti.v1'));
    for (const k in velho.parametros.setores) { delete velho.parametros.setores[k].rpe; delete velho.parametros.setores[k].ded; }
    velho.parametros.porte.forEach(x => delete x.fr); delete velho.parametros.receita; delete velho.parametros.estimativas; delete velho.listas;
    velho.empresas.forEach(e => { for (const k of ['fatTipo', 'fatEstimar', 'globalRec', 'globalMoeda', 'globalAno', 'globalTaxa', 'globalTaxaFonte', 'globalFunc', 'globalPart']) delete e.dados[k]; e.dados.fatAno = ''; });
    localStorage.setItem('estimador-ti.v1', JSON.stringify(velho));
  });
  await p.goto(URL + '#/empresas'); await p.reload(); await p.waitForTimeout(300);
  ok('Versão anterior: parâmetros completados', await p.evaluate(() => S.parametros.setores.industria.rpe === 703000 && S.parametros.porte[2].fr === 1.133 && S.parametros.receita.g === 0.07 && Array.isArray(S.listas)));
  ok('Versão anterior: lista abre', await p.locator('.lista-emp tbody tr').count() >= 1);
  await p.click('.lista-emp .emp-nome >> nth=0'); await p.waitForTimeout(300);
  ok('Versão anterior: análise abre sem erro', await p.locator('#painel #cr-valor').count() === 1);
  ok('Versão anterior: fica só com o investimento em TI, sem pedir a escolha', (await motor(() => UI.atual.dados.fatEstimar)) === false && await p.locator('#sec-objetivo.pede').count() === 0);
  ok('Recarregar com a análise no endereço reabre a empresa', await (async () => { const h = await p.evaluate(() => location.hash); await p.reload(); await p.waitForTimeout(300); return (await p.evaluate(() => location.hash)) === h && await p.locator('#tit-emp').count() === 1; })());

  // empresa modelo: o Banco do Brasil com dados oficiais, confiança alta e as fontes à vista
  await ir('#/empresas');
  await p.click('[data-acao=menu-empresas]'); await p.click('#pop [data-acao=modelo]'); await p.waitForTimeout(500);
  const mod = await motor(() => { const r = calc(UI.atual.dados); return { nome: UI.atual.dados.nome, ic: r.ic, alerta: r.alerta, avisos: r.avisos.length, sujo: UI.sujo, salva: !!empresaSalva() }; });
  ok('Empresa modelo abre como análise nova, sem alterações pendentes', mod.nome === 'Banco do Brasil' && !mod.salva && !mod.sujo, JSON.stringify(mod));
  ok('Empresa modelo: confiança de 80 ou mais, sem alertas nem avisos', mod.ic >= 80 && !mod.alerta && mod.avisos === 0 && await p.locator('#painel .alerta').count() === 0, String(mod.ic));
  ok('Empresa modelo: aviso com as fontes oficiais', await p.locator('.nota-modelo a[href*="api.mziq.com"]').count() === 2 && (await txt('#ws-meta')).includes('Empresa modelo'));
  ok('Receita de banco pede o último ano fechado, e o Porte não traz texto explicativo', (await txt('label[for=f-faturamento]')).includes('último ano fechado') && await p.locator('#sec-porte .sf-desc').count() === 0, await txt('label[for=f-faturamento]'));
  ok('Empresa modelo: o que estimar já escolhido e dados com origem oficial', await p.locator('#sec-objetivo.pede').count() === 0 && (await motor(() => [UI.atual.dados.funcionarios, ...UI.atual.dados.gastosReais].every(x => x.o === 'oficial'))));
  await salvarOk(300);
  const idModelo = await p.evaluate(() => UI.atual.id);
  await ir('#/empresas'); await p.click('[data-acao=menu-empresas]'); await p.click('#pop [data-acao=modelo]'); await p.waitForTimeout(400);
  ok('Empresa modelo salva: abrir de novo leva à mesma análise, sem duplicar', (await p.evaluate(() => location.hash)) === '#/analise/' + idModelo && (await p.evaluate(() => S.empresas.filter(e => e.dados.modelo).length)) === 1);

  // campo sem valor: o motivo explícito no lugar do branco
  const pend = () => motor(() => pendentes(UI.atual.dados));
  ok('Empresa modelo: só receita e agências pendentes, o resto com motivo', (await motor(() => { const d = UI.atual.dados; return pendentes(d).join() + '|' + Object.keys(d.semDado).sort().join(); })) === 'faturamento,unidades|contratos,gastoDeclarado,profTI,usuarios');
  await ir('#/empresas'); await p.click('#app [data-acao=nova] >> nth=0'); await p.waitForTimeout(200);
  await p.check('input[data-objetivo][value=ti]'); await p.fill('#f-nome', 'Teste Sem Dado'); await p.selectOption('#f-natureza', 'privada'); await p.selectOption('#f-setor', 'industria'); await p.fill('#f-funcionarios', '500'); await p.waitForTimeout(300);
  const vis = async c => await p.locator(`.sem-dado[data-campo=${c}]`).count() === 1 && await p.locator(`.sem-dado[data-campo=${c}]`).isVisible();
  ok('Botão “Sem dado?” nos campos vazios que entram na conta', (await Promise.all(['faturamento', 'usuarios', 'unidades', 'profTI', 'crescFunc', 'gastosReais', 'gastoDeclarado'].map(vis))).every(Boolean));
  ok('Campo com valor mostra a origem, não o motivo', !(await vis('funcionarios')) && await p.locator('.origem[data-alvo="campo:funcionarios"]').isVisible());
  ok('Salário só pede motivo quando há equipe de TI; adições e contratos só em listada e público', !(await vis('salarioTI')) && await p.locator('.sem-dado[data-campo=adicoes], .sem-dado[data-campo=contratos]').count() === 0);
  ok('Registro, tecnologias e grupo ficam sem o botão', await p.locator('.sem-dado[data-campo=vagasTI], .sem-dado[data-campo=digital], .sem-dado[data-campo=grupo]').count() === 0);
  await p.click('.sem-dado[data-campo=usuarios]'); await p.waitForTimeout(100);
  ok('Menu de usuários: não encontrei e não divulga', await p.locator('#pop [data-s]').count() === 2 && await p.locator('#pop [data-s=nao-se-aplica]').count() === 0);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.click('.sem-dado[data-campo=unidades]'); await p.waitForTimeout(100);
  ok('Menu de unidades traz também “Não se aplica”', await p.locator('#pop [data-s]').count() === 3 && await p.locator('#pop [data-s=nao-se-aplica]').count() === 1);
  await p.click('#pop [data-s=nao-se-aplica]'); await p.waitForTimeout(150);
  ok('Motivo escolhido fica no botão e nos dados', (await txt('.sem-dado[data-campo=unidades]')) === 'Não se aplica' && (await motor(() => UI.atual.dados.semDado.unidades)) === 'nao-se-aplica' && await p.evaluate(() => document.activeElement.dataset.campo === 'unidades'));
  const antes = await p.locator('#painel .pmd button[data-campo=faturamento]').count();
  await p.click('.sem-dado[data-campo=faturamento]'); await p.click('#pop [data-s=nao-divulga]'); await p.waitForTimeout(200);
  ok('O cartão deixa de sugerir o que a pessoa já explicou', antes === 1 && await p.locator('#painel .pmd button[data-campo=faturamento]').count() === 0, String(antes));
  await p.click('.sem-dado[data-campo=profTI]'); await p.click('#pop [data-s=nao-se-aplica]'); await p.waitForTimeout(150);
  await p.fill('#f-profTI', '12'); await p.waitForTimeout(200);
  ok('Digitar um valor tira o motivo e mostra a origem', (await motor(() => UI.atual.dados.semDado.profTI)) === undefined && await p.locator('.origem[data-alvo="campo:profTI"]').isVisible() && !(await vis('profTI')));
  ok('Com equipe de TI, o salário passa a pedir o motivo', await vis('salarioTI'));
  await p.fill('#f-profTI', ''); await p.waitForTimeout(200);
  ok('Apagar o valor volta a pedir o motivo, sem o antigo', (await txt('.sem-dado[data-campo=profTI]')) === 'Sem dado?' && !(await vis('salarioTI')));
  // verificador ao salvar
  const faltam = await pend();
  await p.click('#ws-acoes [data-acao=salvar]'); await p.locator('#dlg[open]').waitFor();
  ok('Salvar com campos sem resposta abre o verificador, com a lista', (await txt('#dlg h2')) === 'Faltam ' + faltam.length + ' campos' && await p.locator('#dlg li').count() === faltam.length, await txt('#dlg h2'));
  await p.click('#dlg button:has-text("Revisar")'); await p.waitForTimeout(400);
  ok('Revisar não salva, destaca o que falta e leva ao primeiro campo', !(await motor(() => !!empresaSalva())) && await p.locator('.sem-dado.revisar:not([hidden])').count() === faltam.length && await p.evaluate(() => document.activeElement.classList.contains('sem-dado')));
  for (const c of faltam) { await p.click(`.sem-dado[data-campo=${c}]`); await p.click('#pop [data-s]:first-of-type'); await p.waitForTimeout(100); }
  ok('Tudo explicado: nada pendente', (await pend()).length === 0 && await p.locator('.sem-dado.revisar:not([hidden])').count() === 0);
  const cores = await p.evaluate(() => ['nao-achei', 'nao-divulga', 'nao-se-aplica'].map(k => { const b = document.querySelector('.sem-dado.sdc-' + k + ':not([hidden])'); return b ? getComputedStyle(b).color : null; }));
  ok('Motivos com cores próprias e visíveis, como os botões de origem', cores.every(Boolean) && new Set(cores).size === 3 && !cores.includes(await p.evaluate(() => getComputedStyle(document.body).color)), cores.join(' | '));
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);
  ok('Sem pendências, salva direto', await p.locator('#dlg[open]').count() === 0 && (await txt('#ws-meta')).includes('Salva em'));
  ok('Os motivos ficam salvos com a empresa', await p.evaluate(() => { const e = JSON.parse(localStorage.getItem('estimador-ti.v1')).empresas.find(x => x.dados.nome === 'Teste Sem Dado'); return e.dados.semDado.faturamento === 'nao-divulga' && e.dados.semDado.unidades === 'nao-se-aplica'; }));
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(500);
  ok('Resultado: dados usados dizem por que faltam, com a cor do motivo', /não divulga/i.test(await txt('#res-dados')) && /não se aplica/i.test(await txt('#res-dados')) && await p.locator('#res-dados .o-chip.sdc-nao-divulga').count() >= 1);
  await p.click('#res-resumo [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  ok('Resumo: linha com os dados sem informação', /Dados sem informação: .*Receita anual \(não divulga\)/.test(await p.inputValue('#txt-resumo')));
  await p.click('#dlg button:has-text("Fechar")');

  // tecnologias: busca com lista de seleção múltipla, no lugar da grade de marcações abertas
  await p.click('.abas a:nth-child(1)'); await p.waitForTimeout(400);
  const nTec = await motor(() => TECNOLOGIAS.reduce((n, g) => n + g.itens.length, 0));
  if (!(await p.evaluate(() => document.querySelector('#sec-mais').open))) await p.click('#sec-mais summary');
  ok('Tecnologias: sem a grade de marcações abertas, só a busca', await p.locator('#sec-mais .chip').count() === 0 && await p.locator('#tec-lista').isHidden() && (await p.locator('#tec-combo').evaluate(e => e.getBoundingClientRect().height)) < 60);
  await p.click('#tec-busca'); await p.waitForTimeout(150);
  ok('Tecnologias: clicar na busca abre a lista com todas as opções', await p.locator('#tec-lista').isVisible() && await p.locator('#tec-lista .tec-op').count() === nTec && (await p.getAttribute('#tec-busca', 'aria-expanded')) === 'true', String(nTec));
  await p.fill('#tec-busca', 'sap'); await p.waitForTimeout(100);
  ok('Tecnologias: a busca vale também para os exemplos', await p.locator('#tec-lista .tec-op:not([hidden])').count() === 1 && (await txt('#tec-lista .tec-op:not([hidden])')).includes('ERP de grande porte') && await p.locator('#tec-lista .tec-grupo:not([hidden])').count() === 1);
  await p.fill('#tec-busca', 'xyzxyz'); await p.waitForTimeout(100);
  ok('Tecnologias: busca sem resultado avisa', await p.locator('#tec-lista .tec-vazio').isVisible());
  await p.fill('#tec-busca', 'sistemas internos'); await p.waitForTimeout(100);
  await p.click('#tec-lista .tec-op:not([hidden]) >> nth=0'); await p.waitForTimeout(150);
  ok('Tecnologias: marcar guarda, mostra a marca e conta, e a lista continua aberta', (await motor(() => UI.atual.dados.tecnologias.join())) === 'dev-interno' && await p.locator('#tec-tags .tag-tec').count() === 1 && (await txt('#tec-n')) === '1 tecnologia marcada' && await p.locator('#tec-lista').isVisible());
  ok('Tecnologias: sistemas próprios sem equipe de TI mostram a dica de sempre', (await txt('#tec-dicas')).includes('equipe de TI'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('Tecnologias: Esc fecha a lista, limpa a busca e volta ao campo', await p.locator('#tec-lista').isHidden() && (await p.inputValue('#tec-busca')) === '' && await p.evaluate(() => document.activeElement.id === 'tec-busca'));
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
  ok('Tecnologias: seta para baixo abre a lista e vai à primeira opção', await p.locator('#tec-lista').isVisible() && await p.evaluate(() => document.activeElement.dataset.tec === 'erp'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  ok('Tecnologias: Enter marca a opção em foco', (await motor(() => UI.atual.dados.tecnologias.sort().join())) === 'dev-interno,erp' && (await txt('#tec-n')) === '2 tecnologias marcadas');
  await p.mouse.click(5, 300); await p.waitForTimeout(100);
  ok('Tecnologias: clicar fora fecha a lista', await p.locator('#tec-lista').isHidden());
  await p.click('#tec-tags .tag-tec[data-id=erp]'); await p.click('#tec-tags .tag-tec[data-id=dev-interno]'); await p.waitForTimeout(150);
  ok('Tecnologias: clicar na marca remove, sem abrir a lista', (await motor(() => UI.atual.dados.tecnologias.length)) === 0 && await p.locator('#tec-tags .tag-tec').count() === 0 && await p.locator('#tec-lista').isHidden() && (await txt('#tec-n')) === 'só registro');
  await salvarOk(200);

  // 8. celular
  await p.setViewportSize({ width: 375, height: 800 });
  const id = await p.evaluate(() => UI.atual && UI.atual.id);
  for (const [rot, h] of [['análise', `#/analise/${id}`], ['resultado', `#/analise/${id}/resultado`], ['empresas', '#/empresas'], ['metodologia', '#/metodologia'], ['parâmetros', '#/parametros']]) {
    await ir(h); await p.waitForTimeout(150);
    ok('Celular sem rolagem lateral: ' + rot, await p.evaluate(() => document.documentElement.scrollWidth) <= 375, String(await p.evaluate(() => document.documentElement.scrollWidth)));
  }
  await ir(`#/analise/${id}`); await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(150);
  ok('Celular: estimativa à vista embaixo e baixa', await p.evaluate(() => { const r = document.querySelector('#painel').getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.height < 160; }), String(await p.evaluate(() => document.querySelector('#painel').getBoundingClientRect().height)));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  await b.close();
})();
