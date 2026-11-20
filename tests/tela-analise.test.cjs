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
  // campo vazio sem motivo fica em vermelho: nos testes que não são do marcador, todos os pendentes recebem um motivo
  const explicar = () => p.evaluate(() => { const d = UI.atual.dados; d.semDado = d.semDado || {}; for (const c of pendentes(d)) d.semDado[c] = CAMPOS_SEM_DADO[c].ops[0]; atualizarSemDado(); atualizarCabecalho(); });
  const salvarOk = async (espera = 200) => { await explicar(); await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(espera); };

  // 1. receita bruta antiga, oficial: conversão, ano e comparação (caso E da Metodologia)
  await p.click('#nav .lat-nova'); await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(200);
  ok('Nova análise abre direto no formulário, com os dois resultados no cartão', await p.locator('#sec-objetivo').count() === 0 && await p.locator('#painel .cr-saida').count() === 2 && (await motor(() => UI.atual.dados.fatEstimar)) === true);
  ok('Foco no nome da empresa', await p.evaluate(() => document.activeElement && document.activeElement.id === 'f-nome'));
  ok('Sem a caixa antiga de estimar a receita', await p.locator('[data-chk=fatEstimar]').count() === 0);
  ok('Alturas iguais: campos, listas e seletores com 40px', await p.evaluate(() => [...document.querySelectorAll('#form input[type=text], #form select, #form .seg')].filter(e => e.offsetParent).every(e => Math.round(e.getBoundingClientRect().height) === 40)));
  ok('Ano da receita vem preenchido com o último ano fechado', (await p.inputValue('#f-fatAno')) === String(new Date().getFullYear() - 1));
  ok('Nova análise fica fora do Método Personalizado até a pessoa marcar', await p.locator('#f-usarCalib').count() === 0 && (await motor(() => UI.atual.foraCalibracao)) === true);
  await p.fill('#f-nome', 'Varejo Teste'); await p.selectOption('#f-natureza', 'privada'); await p.selectOption('#f-setor', 'varejo'); await p.selectOption('#f-uf', 'RS');
  ok('Origem só aparece quando o campo tem valor', await p.locator('[data-alvo="campo:faturamento"]').isHidden());
  await p.fill('#f-faturamento', '500.000.000');
  ok('Campo com valor e sem origem pede a marcação', (await txt('[data-alvo="campo:faturamento"]')).includes('Marcar origem'));
  await orig('faturamento', 'oficial');
  ok('Origem marcada aparece no botão', (await txt('[data-alvo="campo:faturamento"]')).includes('DRE') && (await motor(() => UI.atual.dados.faturamento.o)) === 'oficial');
  ok('Seletor líquida/bruta aparece', await p.locator('.seg input[name=fatTipo]').count() === 2);
  await p.fill('#f-fatAno', String(new Date().getFullYear())); await p.waitForTimeout(100);
  ok('Ano atual no valor da receita avisa que pode ser parcial', (await p.textContent('#dica-rec')).includes('ainda não fechou'));
  await p.click('.seg-op:has(input[value=bruta])'); await p.fill('#f-fatAno', '2024');
  await p.fill('#f-funcionarios', '2.000'); await orig('funcionarios', 'oficial'); await p.waitForTimeout(150);
  const dica = await p.textContent('#dica-rec'), REF = new Date().getFullYear() - 1, REC = 500e6 * 0.82 * Math.pow(1.07, REF - 2024), recUsada = () => motor(() => calc(UI.atual.dados).receita.usada.v), igual = (a, b) => Math.abs(a / b - 1) < 1e-9;
  ok('Dica explica a conversão e o ano', dica.includes('menos 18%') && dica.includes(`Receita de 2024 levada a ${REF}`), dica);
  ok('Receita usada: bruta menos 18%, levada ao ano de referência', igual(await recUsada(), REC), String(await recUsada()));
  ok('Campo mostra a receita líquida usada e a origem', (await txt('#rec-usada')).includes(await p.evaluate(v => fmtRS(v), REC)) && (await txt('#rec-usada')).includes('DRE') && (await txt('#rec-usada')).includes(`de ${REF}`));
  // período do valor: balanço trimestral ou semestral entra levado a 12 meses
  ok('Período do valor: seletor com 12 meses como padrão', (await p.inputValue('#f-fatMeses')) === '12' && await p.locator('#f-fatMeses option').count() === 4 && (await txt('#f-fatMeses option:checked')) === '12 meses');
  await p.selectOption('#f-fatMeses', '6'); await p.waitForTimeout(250);
  const dicaP = await p.textContent('#dica-rec');
  ok('6 meses: a dica diz que o valor vai a 12 meses e depois ao ano de referência', dicaP.includes('6 meses levados a 12 (× 2,00)') && dicaP.includes(`levada a ${REF}`), dicaP);
  ok('6 meses: a receita usada dobra e o período fica salvo', igual(await recUsada(), 2 * REC) && (await txt('#rec-usada')).includes(await p.evaluate(v => fmtRS(v), 2 * REC)) && (await motor(() => UI.atual.dados.fatMeses)) === '6');
  ok('6 meses: a Metodologia e o resumo contam a conversão', await motor(() => { const r = calc(UI.atual.dados), h = blocoReceitaDet(r), s = textoResumo(UI.atual.dados, r); return /Levado a 12 meses/.test(h) && /× 2,00/.test(h) && /ajustada pela ferramenta/.test(s) && /receita de 6 meses levada a 12 meses/.test(s); }));
  await p.selectOption('#f-fatMeses', '12'); await p.waitForTimeout(250);
  ok('Voltar a 12 meses volta a receita, sem aviso de conversão', igual(await recUsada(), REC) && !(await p.textContent('#dica-rec')).includes('12 (×'));
  // receita de outros anos: uma linha por ano, como o gasto real
  await p.click('[data-acao=add-rec]'); await p.waitForTimeout(200);
  ok('Adicionar ano cria uma linha da receita, do ano antes do mais antigo', (await p.inputValue('[data-rec="0"][data-parte="ano"]')) === '2023' && await p.locator('.campo-rec .rec-linha').count() === 2 && await p.locator('[data-rec="0"][data-parte="meses"]').count() === 1);
  await p.fill('[data-rec="0"][data-parte="v"]', '400.000.000'); await p.waitForTimeout(250);
  ok('A linha nova pede a origem do dado', await p.locator('.origem[data-alvo="rec:0"]').isVisible() && (await txt('.origem[data-alvo="rec:0"]')).includes('Marcar origem'));
  ok('Com dois anos fechados, a receita vai ao ano de referência pelo crescimento da própria empresa', igual(await recUsada(), 500e6 * 0.82 * Math.pow(1.25, REF - 2024)) && (await p.textContent('#dica-rec')).includes('crescimento da própria receita'), await p.textContent('#dica-rec'));
  await p.click('[data-acao=del-rec]'); await p.waitForTimeout(250);
  ok('Remover o ano volta à receita de antes', await p.locator('.campo-rec .rec-linha').count() === 1 && igual(await recUsada(), REC) && (await motor(() => UI.atual.dados.receitasAnos.length)) === 0);
  // ano de referência: os dois resultados são dele; trocar refaz a conta
  ok('Cartão: receita e investimento do ano de referência, o último ano fechado', (await txt('#painel .cr-topo')).includes(`Receita líquida, ${REF}`) && (await txt('#painel .cr-topo')).includes(`Investimento em TI, ${REF}`) && (await p.inputValue('#f-anoRef')) === String(REF));
  ok('Gasto de TI real: a primeira linha sugere o ano de referência, com valor e período', (await p.inputValue('[data-real="0"][data-parte="ano"]')) === String(REF) && await p.locator('[data-real="0"][data-parte="meses"]').count() === 1 && await p.locator('#f-gastoDeclarado').count() === 0);
  await p.selectOption('#f-anoRef', String(REF - 1)); await p.waitForTimeout(300);
  ok('Trocar o ano de referência refaz a conta e os rótulos', (await motor(() => UI.atual.dados.anoRef)) === String(REF - 1) && igual(await recUsada(), 500e6 * 0.82 * Math.pow(1.07, REF - 1 - 2024)) && (await txt('#painel .cr-topo')).includes(`Investimento em TI, ${REF - 1}`) && (await p.inputValue('[data-real="0"][data-parte="ano"]')) === String(REF - 1));
  await p.selectOption('#f-anoRef', String(REF)); await p.waitForTimeout(300);
  ok('O cartão mostra a receita informada, com a origem', (await txt('#cr-receita')) === await p.evaluate(() => fmtRS(calc(UI.atual.dados).receita.usada.v)) && (await txt('#painel .cr-topo')).includes('Valor informado') && (await txt('#painel .cr-topo')).includes('DRE'));
  ok('Receita e TI: o cartão mostra a receita líquida usada', (await txt('#cr-receita')) === await p.evaluate(() => fmtRS(calc(UI.atual.dados).receita.usada.v)) && (await txt('#painel .cr-topo')).includes('Valor informado'));
  const caixa = await p.textContent('#rec-est');
  ok('Estimar com receita oficial: só comparação', /só para comparação/i.test(caixa) && caixa.includes('Receita líquida estimada'), caixa.slice(0, 120));
  ok('Aviso: oficial fora da faixa estimada', caixa.includes('fora da faixa'));
  ok('Valor oficial continua no cálculo', (await motor(() => calc(UI.atual.dados).receita.modo)) === 'informada');
  ok('Cartão: geral e conservadora', await p.locator('#painel .cr-dois > div').count() === 2 && (await txt('#painel .cr-dois')).includes('Conservadora'));
  const z = await motor(() => calc(UI.atual.dados).resumo);
  ok('Cartão: conservadora = motor', (await txt('#painel .cr-dois div:nth-child(2) b')) === await p.evaluate(v => fmtRS(v), z.conservadora));
  await p.waitForTimeout(700); // o valor do cartão anima até o novo
  ok('Cartão: valor central = motor', (await txt('#cr-valor')).startsWith(await p.evaluate(() => fmtRS(calc(UI.atual.dados).F))));
  ok('Sem salários = 64% do geral', Math.abs(z.geralSem / z.geral - 0.64) < 1e-9);
  ok('Cartão: tipo de estimativa com o valor de cada opção', await p.locator('#painel .modo-op').count() === 4 && /R\$/.test(await txt('#painel .modo-op:has(input[value=padrao]) .mo-val')));
  ok('Cartão: o que falta para a confiança, num acordeão fechado', await p.locator('#painel details.cr-dicas:not([open]) .pmd button').count() >= 1);
  await p.click('#painel details.cr-dicas > summary'); await p.fill('#f-funcionarios', '2.001'); await p.waitForTimeout(150);
  ok('Acordeão continua aberto quando o cartão se redesenha', await p.locator('#painel details.cr-dicas[open]').count() === 1);
  await p.click('#painel details.cr-dicas > summary'); await p.fill('#f-funcionarios', '2.000'); await p.waitForTimeout(150);
  ok('Desktop: cartão preso no topo ao rolar', await p.evaluate(() => getComputedStyle(document.querySelector('.resumo-lado')).position === 'sticky' && getComputedStyle(document.querySelector('.cr-abrir')).display === 'none'));
  // resumo para copiar
  await explicar();
  await p.click('#painel [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  const res = await p.inputValue('#txt-resumo'), recTxt = await p.evaluate(v => fmtRS(v), REC);
  for (const t of [`1. Receita líquida no Brasil (${REF}, BRL): ${recTxt} (DRE, ajustada pela ferramenta)`, 'faturamento bruto de 2024', 'tirando 18%', '2. Estimativa Conservadora – investimento em TI:', '3. Estimativa Geral – investimento em TI:', '4. Fontes, cálculos e observações', 'com os salários da equipe de TI', 'estão incluídos', 'Faturamento global: não utilizado', 'Conversão de moeda: nenhuma', 'Metodologia:', 'Benchmarks: o setor', 'Limitações:'])
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
  await explicar();
  await p.click('#painel [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  await p.click('#dlg .seg-sal .seg-op:has(input[value=com])'); await p.waitForTimeout(100);
  ok('Trocar no resumo atualiza o texto', (await p.inputValue('#txt-resumo')).includes('com os salários da equipe de TI'));
  await p.click('#dlg button:has-text("Fechar")'); await p.waitForTimeout(200);
  ok('Fechar o resumo atualiza o cartão', (await txt('#painel .cr-dois div:nth-child(1) b')) === await p.evaluate(v => fmtRS(v), z.geral));

  // 2. subsidiária com receita estimada pela receita global (caso D)
  await p.click('[data-acao=menu-analise]'); await p.click('#pop [data-acao=nova]'); await p.waitForTimeout(150);
  if (await p.locator('#dlg[open]').count()) await p.click('#dlg button:has-text("Descartar")');
  await p.waitForTimeout(150);
  ok('Nova análise começa pela escolha do método, sem termos técnicos', await p.locator('.comecos-met .comeco').count() === 4 && await p.locator('.comecos-met [data-acao=pers-abrir]').count() === 1 && await p.locator('#form').count() === 0 && !/CAPEX|Gasto total/.test(await txt('.comecos-met')));
  await p.click('[data-acao=escolher-modo][data-v=fgv]'); await p.waitForTimeout(150);
  ok('Análise nova tem Voltar, que leva de volta à escolha do método', await p.locator('#ws-acoes [data-acao=voltar-metodo]').count() === 1);
  await p.click('#ws-acoes [data-acao=voltar-metodo]'); await p.waitForTimeout(150);
  ok('Voltar mostra os métodos de novo', await p.locator('.comecos-met').count() === 1 && await p.locator('#form').count() === 0 && await p.locator('.ws-cab a[href="#/empresas"]').count() === 1);
  await p.click('[data-acao=pers-abrir]'); await p.waitForTimeout(150);
  ok('Personalizado sem dados abre ali mesmo: empresas, planilha e percentuais', await p.locator('.pers-inline [data-acao=minha-importar]').count() === 1 && await p.locator('.pers-inline [data-acao=minha-nova]').count() === 1 && await p.locator('.pers-inline [data-acao=dir-abrir]').count() === 1);
  await p.click('.pers-inline [data-acao=dir-abrir]'); await p.waitForTimeout(150);
  await p.fill('[data-dirl="0"][data-parte="p"]', '2,5'); await p.press('[data-dirl="0"][data-parte="p"]', 'Enter'); await p.waitForTimeout(250);
  ok('Percentuais salvos ali mesmo abrem a análise no Personalizado, com o percentual à vista', await p.locator('#form').count() === 1 && await motor(() => UI.atual.dados.modo === 'propria' && S.calibracao.direta.pg === 0.025) && /2,50%/.test(await txt('#painel .modo-op:has(input[value=propria]) small')));
  await p.click('#painel [data-acao=pers-editar]'); await p.waitForTimeout(200);
  ok('Na análise, o Personalizado tem onde editar o percentual', await p.locator('#sec-pers[open] [data-dirl="0"][data-parte="p"]').count() === 1 && (await p.inputValue('#sec-pers [data-dirl="0"][data-parte="p"]')) === '2,50');
  await p.fill('#sec-pers [data-dirl="0"][data-parte="p"]', '3'); await p.press('#sec-pers [data-dirl="0"][data-parte="p"]', 'Enter'); await p.waitForTimeout(250);
  ok('O percentual editado na análise vale na hora', await motor(() => S.calibracao.direta.pg === 0.03) && /3,00%/.test(await txt('#painel .modo-op:has(input[value=propria]) small')) && await p.locator('#sec-pers[open]').count() === 1);
  await motor(() => { S.calibracao.direta = null; salvar(); UI.atual.dados.modo = ''; renderAqui(); }); await p.waitForTimeout(150);
  await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(150);
  await p.fill('#f-nome', 'Subsidiária Teste'); await p.selectOption('#f-natureza', 'subsidiaria'); await p.selectOption('#f-setor', 'industria'); await p.selectOption('#f-uf', 'SP');
  ok('Rótulo da receita para subsidiária', (await p.textContent('label[for=f-faturamento]')).includes('Receita no Brasil'));
  await p.fill('#f-funcionarios', '1.200'); await orig('funcionarios', 'terceiros');
  ok('Bloco da receita global aparece', await p.locator('.rec-global').count() === 1);
  ok('Só funcionários com o cálculo por usuários ativo: a receita fica de fora', (await p.textContent('#rec-est')).includes('não entra no cálculo pela receita') && !(await motor(() => calc(UI.atual.dados).ests.some(e => e.cod === 'E1'))));
  await p.fill('#f-globalRec', '5.000.000.000'); await orig('globalRec', 'oficial');
  await p.fill('#f-globalAno', '2025'); await p.fill('#f-globalFunc', '40.000'); await orig('globalFunc', 'oficial'); await p.waitForTimeout(150);
  ok('Dica do câmbio mostra a PTAX da tabela', (await p.textContent('#dica-taxa')).includes('31/12/2025') && (await p.textContent('#dica-taxa')).includes('5,5024'), await p.textContent('#dica-taxa'));
  await p.fill('#f-fatAno', '2026'); await p.selectOption('#f-anoRef', '2026'); await p.waitForTimeout(300); // o caso D da aceitação é de 2026
  const rD = await motor(() => { const r = calc(UI.atual.dados); return { rec: r.receita.usada.v, F: r.F }; });
  ok('Receita estimada = caso D (912,67 mi)', Math.abs(rD.rec / 912.67e6 - 1) < 0.001, rD.rec);
  ok('F = caso D sem equipe de TI (15,12 mi)', Math.abs(rD.F / 15.12e6 - 1) < 0.001, rD.F);
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
  await explicar();
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
  await p.click('[data-acao=buscar-cnpj]'); await p.waitForFunction(() => /Não foi possível/.test(document.querySelector('#v-cnpj').textContent), null, { timeout: 8000 }).catch(() => {});
  ok('A lupa busca na Receita', pedidosCnpj === 1 && (await txt('#v-cnpj')).includes('Não foi possível consultar agora'), await txt('#v-cnpj'));
  await p.focus('#f-cnpj'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok('Enter no campo também busca', pedidosCnpj === 2, String(pedidosCnpj));

  // 5. prompt da IA com as regras do time
  await p.click('[data-acao=prompt-ia]'); await p.locator('#dlg[open]').waitFor();
  const pr = await p.inputValue('#txt-prompt');
  for (const t of ['a fonte é a DRE', 'Nunca invente valores, fontes ou links', 'Não use outras empresas do grupo', '"líquida" ou "bruta"', 'sem converter', 'Receita global do grupo', 'Valor 1000', 'Dado | Valor | Ano | Fonte | Tipo', 'R$ 1.250.000.000', 'Não encontrado:'])
    ok('Prompt tem: ' + t, pr.includes(t));
  ok('Prompt de subsidiária não pede dados de órgão público nem de pequena', !pr.includes('empenhada') && !pr.includes('Enquadramento'));
  await p.click('#dlg button:has-text("Fechar")');

  // 6. salvar, métodos, testes, CSV
  await salvarOk(150);
  ok('Salvar: cabeçalho mostra salva', (await txt('#ws-meta')).includes('Salva em') && await p.locator('#ws-acoes [data-acao=salvar]').isDisabled());
  ok('Salvar: empresa na barra lateral', (await txt('#nav')).includes('Subsidiária Teste'));
  await ir('#/metodos');
  ok('Metodologia: seção da receita', (await p.textContent('#met-receita')).includes('Estimativa, quando falta o valor') && (await p.textContent('#met-receita')).includes('usado como está'));
  ok('Metodologia: seção das estimativas', (await p.textContent('#met-estimativas')).includes('percentil 25'));
  ok('Metodologia: testes 134 de 134', (await p.textContent('#met-testes')).includes('134 de 134'));
  ok('Métodos: parâmetros por setor em tabela de só leitura, sem campos de edição', await p.locator('#met-setores tbody tr').count() >= 10 && await p.locator('#met-setores input, #met-fontes input').count() === 0);
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
  // nova análise pela barra lateral, de qualquer tela; recolhida, vira só o ícone
  await p.click('#nav .lat-nova'); await p.waitForTimeout(300); await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(150);
  ok('Barra lateral: Nova análise abre uma análise nova a partir de qualquer tela', (await p.evaluate(() => location.hash)).startsWith('#/analise/') && await p.evaluate(() => document.activeElement && document.activeElement.id === 'f-nome') && await p.locator('#nav .lat-nova').isVisible());
  await p.click('[data-acao=recolher]'); await p.waitForTimeout(250);
  ok('Recolhida: Nova análise vira só o ícone, com o nome na dica e para leitores de tela', await p.evaluate(() => { const b = document.querySelector('#nav .lat-nova'); return b.dataset.tip === 'Nova análise' && b.textContent.trim() === 'Nova análise' && b.getBoundingClientRect().width <= 48; }));
  await p.click('[data-acao=recolher]'); await p.waitForTimeout(250);
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
  ok('Versão anterior: abre com os dois resultados, sem passo de escolha', (await motor(() => UI.atual.dados.fatEstimar)) === true && await p.locator('#sec-objetivo').count() === 0 && await p.locator('#painel .cr-saida').count() === 2);
  ok('Recarregar com a análise no endereço reabre a empresa', await (async () => { const h = await p.evaluate(() => location.hash); await p.reload(); await p.waitForTimeout(300); return (await p.evaluate(() => location.hash)) === h && await p.locator('#tit-emp').count() === 1; })());

  // empresa modelo: o Banco do Brasil com dados oficiais, confiança alta e as fontes à vista
  await ir('#/empresas');
  await p.click('[data-acao=menu-empresas]'); await p.click('#pop [data-acao=modelo]'); await p.waitForTimeout(500);
  const mod = await motor(() => { const r = calc(UI.atual.dados); return { nome: UI.atual.dados.nome, ic: r.ic, alerta: r.alerta, avisos: r.avisos.length, sujo: UI.sujo, salva: !!empresaSalva() }; });
  ok('Empresa modelo abre como análise nova, sem alterações pendentes', mod.nome === 'Banco do Brasil' && !mod.salva && !mod.sujo, JSON.stringify(mod));
  ok('Empresa modelo: confiança de 80 ou mais, sem aviso nem alerta de divergência sobre os dados', mod.ic >= 80 && mod.avisos === 0 && !mod.alerta, String(mod.ic));
  ok('Empresa modelo: aviso com as fontes oficiais, só os dois documentos', await p.locator('.nota-modelo a[href*="api.mziq.com"]').count() === 2 && await p.locator('.nota-modelo li').count() === 2 && (await txt('#ws-meta')).includes('Empresa modelo'));
  ok('Receita de banco pede a linha do IF.data sem falar em ano fechado, e o Porte não traz texto explicativo', (await txt('label[for=f-faturamento]')) === 'Receita (IF.data)' && await p.locator('#sec-porte .sf-desc').count() === 0, await txt('label[for=f-faturamento]'));
  ok('Empresa modelo: dados com origem oficial', (await motor(() => [UI.atual.dados.funcionarios, ...UI.atual.dados.gastosReais].every(x => x.o === 'oficial'))));
  await salvarOk(300);
  const idModelo = await p.evaluate(() => UI.atual.id);
  await ir('#/empresas'); await p.click('[data-acao=menu-empresas]'); await p.click('#pop [data-acao=modelo]'); await p.waitForTimeout(400);
  ok('Empresa modelo salva: abrir de novo leva à mesma análise, sem duplicar', (await p.evaluate(() => location.hash)) === '#/analise/' + idModelo && (await p.evaluate(() => S.empresas.filter(e => e.dados.modelo).length)) === 1);

  // campo sem valor: ou tem valor, ou tem um motivo explícito; senão falta informar, e o campo fica em vermelho
  const pend = () => motor(() => pendentes(UI.atual.dados));
  const tok = t => p.evaluate(t => { const e = document.createElement('i'); e.style.color = `var(${t})`; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; }, t);
  ok('Empresa modelo completa: nada faltando, motivo só no que os documentos não trazem', (await motor(() => { const d = UI.atual.dados; return pendentes(d).join() + '|' + Object.keys(d.semDado).sort().join(); })) === '|contratos,profTI,usuarios' && await p.locator('.chip-falta').count() === 0);
  // sem nome e sem nenhum dado, salvar também funciona: o nome fica vermelho e o aviso conta o que falta
  await ir('#/empresas'); await p.click('#nav .lat-nova >> nth=0'); await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(200);
  ok('Nome vazio fica vermelho no próprio campo', await p.locator('#f-nome').evaluate(e => getComputedStyle(e).borderTopColor) === await tok('--crit'));
  const nAntes = await motor(() => S.empresas.length);
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);
  ok('Salvar sem nome e sem dados salva, e o aviso diz quantos campos faltam', (await motor(() => S.empresas.length)) === nAntes + 1 && /^Empresa salva\. Faltam \d+ campos$/.test(await txt('#toast')), await txt('#toast'));
  await ir('#/empresas');
  ok('Na lista, a empresa sem nome aparece como “(sem nome)”', (await txt('.lista-emp')).includes('(sem nome)'));
  await p.evaluate(() => { S.empresas = S.empresas.filter(e => e.dados.nome); salvar(); });
  await ir('#/empresas'); await p.click('#nav .lat-nova >> nth=0'); await p.click('[data-acao=escolher-modo][data-v=base]'); await p.waitForTimeout(200);
  await p.fill('#f-nome', 'Teste Sem Dado'); await p.selectOption('#f-natureza', 'privada'); await p.selectOption('#f-setor', 'industria'); await p.fill('#f-funcionarios', '500'); await p.waitForTimeout(300);
  const vis = async c => await p.locator(`.sem-dado[data-campo=${c}]`).count() === 1 && await p.locator(`.sem-dado[data-campo=${c}]`).isVisible();
  const campoCor = (c, prop) => p.locator(`#f-${c}`).evaluate((e, k) => getComputedStyle(e)[k], prop);
  ok('Campos vazios que entram na conta têm o botão “Sem dado?” desde o início', (await Promise.all(['faturamento', 'usuarios', 'profTI', 'gastosReais'].map(vis))).every(Boolean) && (await txt('.sem-dado[data-campo=usuarios]')) === 'Sem dado?');
  ok('O próprio campo que falta muda de cor (fundo e borda vermelhos) e o botão fica neutro', await campoCor('usuarios', 'borderTopColor') === await tok('--crit') && await campoCor('usuarios', 'backgroundColor') === await tok('--crit-f') && await p.locator('.sem-dado[data-campo=usuarios]').evaluate(e => getComputedStyle(e).color) === await tok('--cinza'));
  ok('Campo com valor segue com a cor normal', await campoCor('funcionarios', 'borderTopColor') !== await tok('--crit') && await campoCor('funcionarios', 'backgroundColor') !== await tok('--crit-f'));
  const faltam0 = await pend();
  ok('O topo da análise diz quantos campos faltam', (await txt('.chip-falta')) === 'Faltam ' + faltam0.length + ' campos', await txt('#ws-meta'));
  ok('Campo com valor mostra a origem, não o motivo', !(await vis('funcionarios')) && await p.locator('.origem[data-alvo="campo:funcionarios"]').isVisible());
  ok('Salário só pede motivo quando há equipe de TI; adições e contratos só em listada e público', !(await vis('salarioTI')) && await p.locator('.sem-dado[data-campo=adicoes], .sem-dado[data-campo=contratos]').count() === 0);
  ok('Registro, tecnologias e grupo ficam sem o botão', await p.locator('.sem-dado[data-campo=vagasTI], .sem-dado[data-campo=digital], .sem-dado[data-campo=grupo]').count() === 0);
  await p.click('.sem-dado[data-campo=usuarios]'); await p.waitForTimeout(100);
  ok('Menu de usuários: não encontrado e não divulga', await p.locator('#pop [data-s]').count() === 2 && await p.locator('#pop [data-s=nao-se-aplica]').count() === 0);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.click('.sem-dado[data-campo=profTI]'); await p.waitForTimeout(100);
  ok('Menu da equipe de TI traz também “Não se aplica”', await p.locator('#pop [data-s]').count() === 3 && await p.locator('#pop [data-s=nao-se-aplica]').count() === 1);
  await p.click('#pop [data-s=nao-se-aplica]'); await p.waitForTimeout(150);
  ok('Motivo escolhido fica no botão e nos dados', (await txt('.sem-dado[data-campo=profTI]')) === 'Não se aplica' && (await motor(() => UI.atual.dados.semDado.profTI)) === 'nao-se-aplica' && await p.evaluate(() => document.activeElement.dataset.campo === 'profTI'));
  const antes = await p.locator('#painel .pmd button[data-campo=faturamento]').count();
  await p.click('.sem-dado[data-campo=faturamento]'); await p.click('#pop [data-s=nao-divulga]'); await p.waitForTimeout(200);
  ok('O cartão deixa de sugerir o que a pessoa já explicou', antes === 1 && await p.locator('#painel .pmd button[data-campo=faturamento]').count() === 0, String(antes));
  await p.click('.sem-dado[data-campo=usuarios]'); await p.click('#pop [data-s=nao-encontrado]'); await p.waitForTimeout(450); // as cores mudam aos poucos
  const cor = c => p.locator(`.sem-dado[data-campo=${c}]`).evaluate(e => getComputedStyle(e).color);
  ok('As cores seguem o sentido: âmbar para o que falta e foi explicado, verde para o que não se aplica', (await cor('usuarios')) === await tok('--aviso') && (await cor('faturamento')) === await tok('--aviso') && (await cor('profTI')) === await tok('--ok'));
  await p.click('.sem-dado[data-campo=profTI]'); await p.click('#pop [data-s=nao-se-aplica]'); await p.waitForTimeout(150);
  await p.fill('#f-profTI', '12'); await p.waitForTimeout(200);
  ok('Digitar um valor tira o motivo e mostra a origem', (await motor(() => UI.atual.dados.semDado.profTI)) === undefined && await p.locator('.origem[data-alvo="campo:profTI"]').isVisible() && !(await vis('profTI')));
  ok('Com equipe de TI, o salário passa a pedir o motivo', await vis('salarioTI'));
  await p.fill('#f-profTI', ''); await p.waitForTimeout(200);
  ok('Apagar o valor volta a faltar informar, sem o motivo antigo, e o campo volta a ficar vermelho', (await txt('.sem-dado[data-campo=profTI]')) === 'Sem dado?' && await campoCor('profTI', 'borderTopColor') === await tok('--crit') && !(await vis('salarioTI')));
  // salvar e copiar o resumo nunca são bloqueados: o campo que falta continua vermelho, o aviso diz quantos faltam e o resumo os lista
  const faltam = await pend();
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);
  ok('Salvar com campo faltando salva, e o aviso diz quantos faltam', (await motor(() => !!empresaSalva())) && (await txt('#toast')).includes(`Empresa salva. Faltam ${faltam.length} campos`) && await p.locator('#dlg[open]').count() === 0, await txt('#toast'));
  ok('Depois de salvar, os campos que faltam continuam em vermelho', await p.locator('.campo:has(.sem-dado[data-estado="pendente"])').count() === faltam.length);
  const focoNoPendente = () => p.evaluate(() => { const a = document.activeElement; return a.tagName === 'INPUT' && !!a.closest('.campo').querySelector('.sem-dado[data-estado="pendente"]'); });
  await p.click('#painel [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  ok('Copiar o resumo com campo faltando abre e lista o que falta', /Dados ainda não informados: /.test(await p.inputValue('#txt-resumo')));
  await p.click('#dlg button:has-text("Fechar")');
  await p.click('.chip-falta'); await p.waitForTimeout(300);
  ok('O aviso no topo leva ao primeiro campo que falta, que já está em vermelho', await focoNoPendente() && await p.evaluate(() => getComputedStyle(document.activeElement).borderTopColor) === await tok('--crit'));
  for (const c of faltam) { await p.click(`.sem-dado[data-campo=${c}]`); await p.click(c === 'profTI' ? '#pop [data-s=nao-se-aplica]' : '#pop [data-s]:first-of-type'); await p.waitForTimeout(100); }
  ok('Tudo explicado: nada falta, nenhum campo em vermelho e o aviso do topo some', (await pend()).length === 0 && await p.locator('.chip-falta').count() === 0 && await p.locator('.sem-dado[data-estado="pendente"]').count() === 0 && await p.locator('.campo:has(.sem-dado[data-estado="pendente"])').count() === 0);
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);
  ok('Sem nada faltando, salva direto', await p.locator('#dlg[open]').count() === 0 && (await txt('#ws-meta')).includes('Salva em'));
  ok('Os motivos ficam salvos com a empresa', await p.evaluate(() => { const e = JSON.parse(localStorage.getItem('estimador-ti.v1')).empresas.find(x => x.dados.nome === 'Teste Sem Dado'); return e.dados.semDado.faturamento === 'nao-divulga'; }));
  await p.click('#painel [data-acao=resumo]'); await p.locator('#dlg[open]').waitFor();
  ok('Sem nada faltando, o resumo abre, com a linha dos dados sem informação', /Dados sem informação: .*Receita \(não divulga\)/.test(await p.inputValue('#txt-resumo')));
  await p.click('#dlg button:has-text("Fechar")');
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(500);
  ok('Resultado: dados usados dizem por que faltam, com a cor do motivo', /não divulga/i.test(await txt('#res-dados')) && /não se aplica/i.test(await txt('#res-dados')) && await p.locator('#res-dados .o-chip.sdc-nao-divulga').count() >= 1);

  // ajuda dos campos: diz o que o campo é; como entra na conta fica na Metodologia
  await p.click('.abas a:nth-child(1)'); await p.waitForTimeout(400);
  const ajudas = await motor(() => Object.keys(AJUDA).map(k => [k, textoAjuda(k, dadosVazios())]));
  ok('Ajudas sem fórmula nem multiplicadores, curtas', ajudas.every(([k, t]) => t && !/[×÷]|multiplic/i.test(t) && t.length < 260), ajudas.filter(([k, t]) => /[×÷]|multiplic/i.test(t) || t.length >= 260).map(x => x[0]).join());
  await p.click('button.ajuda[data-chave=digital]'); await p.waitForTimeout(150);
  ok('Ajuda da intensidade digital começa dizendo o que é, sem os multiplicadores', (await txt('#pop')).includes('Quanto o negócio depende de tecnologia') && !(await txt('#pop')).includes('0,8') && await p.locator('#pop a[href="#/metodos/met-ajustes"]').count() === 1);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await ir('#/metodos/met-ajustes'); await p.waitForTimeout(1600);
  ok('A Metodologia abre na seção da ajuda e traz os multiplicadores', Math.abs(await p.locator('#met-ajustes').evaluate(e => e.getBoundingClientRect().top)) < 140 && (await txt('#met-ajustes')).includes('Intensidade digital') && (await p.evaluate(() => { const tr = [...document.querySelectorAll('#met-ajustes tbody tr')].find(t => t.cells[0].textContent.trim() === 'Intensidade digital baixa'); return tr ? tr.querySelector('td.n').textContent : ''; })) === '0,80');
  ok('A Metodologia explica o mínimo de usuários e o salário de referência', /50 usuários/.test(await txt('#met-caminhos')) && /média nacional/.test(await txt('#met-caminhos')));
  ok('Metodologia: a Fórmula completa traz a conta em 5 passos, cada um com legenda e link para a seção', await p.evaluate(() => { const v = document.querySelector('#met-visao .passos'); if (!v) return false; const ls = [...v.querySelectorAll('.fx-e')].map(e => e.innerText.replace(/\s+/g, '') + '=' + e.nextElementSibling.nextElementSibling.innerText.replace(/\s+/g, ' ')); return v.querySelectorAll(':scope > li').length === 5 && ls.length >= 15 && ls.some(t => /^E1=.*M$/.test(t)) && ls.some(t => /^R=.*12 ÷ m/.test(t)) && v.querySelectorAll('[data-acao=rolar]').length === 5 && v.querySelectorAll('dl.letras').length === 5; }));
  ok('Metodologia: a tabela dos caminhos traz E1 e E2 sem ajuste especial de bancos, e a receita vem antes dos caminhos', await p.evaluate(() => { const lin = [...document.querySelectorAll('#met-caminhos .tab-doc tbody tr')].map(tr => tr.innerText.replace(/\s+/g, ' ')), ids = [...document.querySelectorAll('section.met-sec')].map(s => s.id); return /^E1 · Receita /.test(lin[0]) && !/fb/.test(lin[0]) && /^E2 · Usuários /.test(lin[1]) && !/fb/.test(lin[1]) && ids.indexOf('met-receita') < ids.indexOf('met-caminhos') && ids.indexOf('met-pmd') > ids.indexOf('met-categorias') && ids.length === 23; }));
  ok('Metodologia: nenhuma fórmula dentro de frase: os blocos de texto não têm sinal de igual', await p.evaluate(() => [...document.querySelectorAll('#app .met-sec p, #app .met-sec .notas li')].every(e => !/\s=\s/.test(e.innerText))));
  ok('Metodologia: expoentes com o sinal de menos tipográfico', !/e-\d/.test(await p.evaluate(() => [...document.querySelectorAll('#app .fx')].map(f => f.innerText).join(' '))));
  await ir('#/empresas'); await p.click('.lista-emp .emp-nome >> nth=-1'); await p.waitForTimeout(500);
  await p.click('.abas a:nth-child(2)'); await p.waitForTimeout(200); await p.click('.abas a:nth-child(1)'); await p.waitForTimeout(300);

  // tecnologias: busca em camadas (categoria, depois tecnologias; digitando, todas de uma vez) com seleção múltipla
  await p.click('.abas a:nth-child(1)'); await p.waitForTimeout(400);
  if (!(await p.evaluate(() => document.querySelector('#sec-mais').open))) await p.click('#sec-mais summary');
  ok('Tecnologias: sem a grade de marcações abertas, só a busca', await p.locator('#sec-mais .chip').count() === 0 && await p.locator('#tec-lista').isHidden() && (await p.locator('#tec-combo').evaluate(e => e.getBoundingClientRect().height)) < 60);
  const nCat = await motor(() => TECNOLOGIAS.length), nCat0 = await motor(() => TECNOLOGIAS[0].itens.length), nome0 = await motor(() => TECNOLOGIAS[0].g);
  const visTec = s => p.locator(`#tec-lista ${s}:visible`).count();
  await p.click('#tec-busca'); await p.waitForTimeout(150);
  ok('Tecnologias: clicar na busca abre a lista, que começa pelas categorias', await p.locator('#tec-lista').isVisible() && (await visTec('.tec-cat')) === nCat && (await visTec('.tec-op')) === 0 && (await p.getAttribute('#tec-busca', 'aria-expanded')) === 'true', String(nCat));
  await p.click('#tec-lista .tec-cat[data-i="0"]'); await p.waitForTimeout(150);
  ok('Tecnologias: entrar numa categoria mostra só as tecnologias dela, com o botão de voltar', (await visTec('.tec-cat')) === 0 && (await visTec('.tec-op')) === nCat0 && (await txt('#tec-lista .tec-voltar')) === nome0 && await p.locator('#tec-lista .tec-voltar').isVisible());
  await p.click('#tec-lista .tec-voltar'); await p.waitForTimeout(150);
  ok('Tecnologias: voltar mostra as categorias de novo, e o foco volta à categoria', (await visTec('.tec-cat')) === nCat && (await visTec('.tec-op')) === 0 && await p.evaluate(() => document.activeElement.classList.contains('tec-cat') && document.activeElement.dataset.i === '0'));
  await p.fill('#tec-busca', 'sap'); await p.waitForTimeout(100);
  ok('Tecnologias: digitar busca em todas as categorias de uma vez, com a categoria ao lado de cada resultado e sem subtítulos', (await visTec('.tec-op')) === 1 && (await txt('#tec-lista .tec-op:visible')).includes('ERP de grande porte') && (await txt('#tec-lista .tec-op:visible em')) === nome0 && (await visTec('.tec-cat')) === 0 && await p.locator('#tec-lista .tec-grupo').count() === 0 && await p.locator('#tec-lista .tec-voltar').isHidden());
  await p.fill('#tec-busca', 'xyzxyz'); await p.waitForTimeout(100);
  ok('Tecnologias: busca sem resultado avisa', await p.locator('#tec-lista .tec-vazio').isVisible());
  await p.fill('#tec-busca', 'sistemas internos'); await p.waitForTimeout(100);
  await p.click('#tec-lista .tec-op:visible >> nth=0'); await p.waitForTimeout(150);
  ok('Tecnologias: marcar guarda, mostra a marca e conta, e a lista continua aberta', (await motor(() => UI.atual.dados.tecnologias.join())) === 'dev-interno' && await p.locator('#tec-tags .tag-tec').count() === 1 && (await txt('#tec-n')) === '1 tecnologia marcada' && await p.locator('#tec-lista').isVisible());
  ok('Tecnologias: sistemas próprios sem equipe de TI mostram a dica de sempre', (await txt('#tec-dicas')).includes('equipe de TI'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  ok('Tecnologias: Esc fecha a lista, limpa a busca e volta ao campo', await p.locator('#tec-lista').isHidden() && (await p.inputValue('#tec-busca')) === '' && await p.evaluate(() => document.activeElement.id === 'tec-busca'));
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
  ok('Tecnologias: seta para baixo abre a lista e vai à primeira categoria', await p.locator('#tec-lista').isVisible() && await p.evaluate(() => document.activeElement.classList.contains('tec-cat') && document.activeElement.dataset.i === '0'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ok('Tecnologias: Enter na categoria entra nela e vai à primeira tecnologia', (await visTec('.tec-cat')) === 0 && await p.evaluate(() => document.activeElement.dataset.tec === 'erp'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  ok('Tecnologias: Enter marca a tecnologia em foco', (await motor(() => UI.atual.dados.tecnologias.sort().join())) === 'dev-interno,erp' && (await txt('#tec-n')) === '2 tecnologias marcadas');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('Tecnologias: Esc dentro de uma categoria sobe uma camada, e a categoria mostra quantas estão marcadas', await p.locator('#tec-lista').isVisible() && (await visTec('.tec-cat')) === nCat && (await txt('#tec-lista .tec-cat[data-i="0"] .tec-n')) === '1');
  await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  ok('Tecnologias: Esc nas categorias fecha a lista', await p.locator('#tec-lista').isHidden());
  await p.click('#tec-busca'); await p.waitForTimeout(100);
  await p.mouse.click(5, 300); await p.waitForTimeout(350);
  ok('Tecnologias: clicar fora fecha a lista', await p.locator('#tec-lista').isHidden());
  await p.click('#tec-tags .tag-tec[data-id=erp]'); await p.click('#tec-tags .tag-tec[data-id=dev-interno]'); await p.waitForTimeout(350);
  ok('Tecnologias: clicar na marca remove, sem abrir a lista', (await motor(() => UI.atual.dados.tecnologias.length)) === 0 && await p.locator('#tec-tags .tag-tec').count() === 0 && await p.locator('#tec-lista').isHidden() && (await txt('#tec-n')) === 'só registro');
  await salvarOk(200);

  // 8. celular
  await p.setViewportSize({ width: 375, height: 800 });
  const id = await p.evaluate(() => UI.atual && UI.atual.id);
  for (const [rot, h] of [['análise', `#/analise/${id}`], ['resultado', `#/analise/${id}/resultado`], ['empresas', '#/empresas'], ['métodos', '#/metodos'], ['glossário', '#/glossario']]) {
    await ir(h); await p.waitForTimeout(150);
    ok('Celular sem rolagem lateral: ' + rot, await p.evaluate(() => document.documentElement.scrollWidth) <= 375, String(await p.evaluate(() => document.documentElement.scrollWidth)));
  }
  await ir(`#/analise/${id}`); await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(150);
  ok('Celular: estimativa à vista embaixo e baixa', await p.evaluate(() => { const r = document.querySelector('#painel').getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.height < 160; }), String(await p.evaluate(() => document.querySelector('#painel').getBoundingClientRect().height)));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  await b.close();
})();
