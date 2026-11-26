// Tour guiado: abre sozinho na primeira visita, faz o exercício inteiro como a pessoa faria, sem perder nem tapar nenhum alvo (computador e celular),
// segura cliques fora do recorte, espera Próximo depois de cada ação feita, pode ser pulado e reaberto pela barra lateral.
const { chromium } = require('playwright-core');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const erros = [];
  for (const [nomeTela, viewport] of [['computador', { width: 1360, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport });
    // o tour automático não abre para navegadores automatizados; aqui ele precisa abrir como numa primeira visita de verdade
    await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    const p = await ctx.newPage();
    p.on('pageerror', e => erros.push(nomeTela + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(nomeTela + ': ' + m.text()); });
    // a Receita responde como para o Banco do Brasil; a receita vem da CVM ou do IF.data quando eles carregam, senão a pessoa digita
    await p.route('**/brasilapi.com.br/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ razao_social: 'BANCO DO BRASIL SA', uf: 'DF', municipio: 'BRASILIA', porte: 'DEMAIS', codigo_natureza_juridica: 2038, cnae_fiscal: 6422100 }) }));
    await p.goto(URL); await p.waitForTimeout(1000);
    const tit = () => p.textContent('#tour-title').catch(() => '');
    const esperaTit = async t => { for (let i = 0; i < 60; i++) { if ((await tit()) === t) return true; await p.waitForTimeout(100); } return false; };
    const titulos = await p.evaluate(() => TOUR.map(x => x.titulo)), clique = await p.evaluate(() => TOUR.map(x => !!x.clique));
    check(`${nomeTela}: primeira visita abre o tour`, await p.locator('.tour.show').count() === 1 && await esperaTit(titulos[0]));
    check(`${nomeTela}: o primeiro passo oferece Começar e Agora não`, (await p.textContent('[data-tour="next"]')) === 'Começar o tour' && (await p.textContent('[data-tour="skip"]')) === 'Agora não');
    await p.mouse.click(5, viewport.height - 5); await p.waitForTimeout(250);
    check(`${nomeTela}: clique fora do cartão é segurado e explicado`, await p.locator('.tour-msg.show').count() === 1 && await p.evaluate(() => location.hash) === '#/empresas');
    // o que a pessoa faz em cada passo de clique ou de tarefa, sempre com clique de verdade (o véu não pode tapar)
    const FAZER = {
      'Método': async () => p.click('#app .comeco[data-v="base"]'),
      'CNPJ': async () => p.fill('#f-cnpj', '00000000000191'),
      'Buscar pelo CNPJ': async () => { await p.click('#app [data-acao="buscar-cnpj"]');
        for (let k = 0; k < 50 && !(await p.evaluate(() => buscaCnpjTerminou())); k++) await p.waitForTimeout(100);
        check(`${nomeTela}: o CNPJ preenche o nome`, (await p.inputValue('#f-nome')) === 'BANCO DO BRASIL SA'); },
      'Natureza e setor': async () => p.click('#app [data-acao="usar-sug"]'),
      'Receita': async () => { if (await p.evaluate(() => +((UI.atual.dados.faturamento || {}).v) > 0)) return;
        await p.fill('#f-faturamento', '73,9 bi'); await p.press('#f-faturamento', 'Tab');
        check(`${nomeTela}: valor abreviado vira o número inteiro`, (await p.inputValue('#f-faturamento')) === '73.900.000.000'); },
      'Funcionários': async () => { await p.fill('#f-funcionarios', '85206'); await p.press('#f-funcionarios', 'Tab'); },
      'Origem do dado': async () => { await p.click('#app .origem[data-alvo="campo:funcionarios"]'); await p.click('#pop [data-o="oficial"]'); },
      'Dado não encontrado': async () => { await p.click('#app .sem-dado[data-campo="profTI"]'); await p.click('#pop [data-s="nao-encontrado"]'); },
      'Gasto de TI real': async () => { await p.fill('#app [data-real="0"][data-parte="v"]', '6.800.000.000'); await p.press('#app [data-real="0"][data-parte="v"]', 'Tab'); }
    };
    const tarefa = await p.evaluate(() => TOUR.map(x => !!x.tarefa));
    for (let i = 1; i < titulos.length; i++) {
      const atual = titulos[i - 1];
      if (tarefa[i - 1] && atual === 'Método') {
        await p.click('[data-tour="next"]'); await p.waitForTimeout(300);
        check(`${nomeTela}: Próximo espera a tarefa ser feita`, (await tit()) === atual && await p.locator('.tour-msg.show').count() === 1);
      }
      const age = FAZER[atual] || (clique[i - 1] && (async () => { const r = await p.evaluate(() => { const b = T.target().getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }); await p.mouse.click(r[0], r[1]); }));
      const jaFeito = await p.evaluate(k => !!(TOUR[k].tarefa && TOUR[k].tarefa()), i - 1); // a busca pelo CNPJ pode já ter feito a tarefa
      if (age && !jaFeito) { // feita a ação, o cartão fica no passo, diz que está feito e espera Próximo
        await age();
        let feito = false; for (let k = 0; k < 30 && !feito; k++) { await p.waitForTimeout(100); feito = /^Feito\./.test(await p.textContent('.tour-msg.ok.show').catch(() => '')); }
        check(`${nomeTela}: ${atual} feito, o tour espera Próximo`, feito && (await tit()) === atual);
      }
      await p.click('[data-tour="next"]');
      const chegou = await esperaTit(titulos[i]);
      await p.waitForTimeout(450);
      const est = await p.evaluate(() => { const l = document.querySelector('.tour-spot').getBoundingClientRect(), c = document.querySelector('.tour-card').getBoundingClientRect();
        return { erro: !document.querySelector('[data-tour="retry"]').hidden, luz: l.width > 0 && l.height > 0, dentro: c.left >= 0 && c.top >= 0 && c.right <= innerWidth + 1 && c.bottom <= innerHeight + 1, alvo: !!(T && T.target()) }; });
      check(`${nomeTela}: passo ${i}, ${titulos[i]}`, chegou && !est.erro && est.luz && est.alvo && est.dentro, JSON.stringify(est));
    }
    check(`${nomeTela}: último passo conclui`, (await p.textContent('[data-tour="next"]')) === 'Concluir');
    await p.click('[data-tour="next"]'); await p.waitForTimeout(400);
    check(`${nomeTela}: concluir fecha o tour e lembra que foi visto`, await p.locator('.tour').count() === 0 && await p.evaluate(() => localStorage.getItem('vezen.tour')) === 'visto');
    check(`${nomeTela}: o tour não salva o exercício`, await p.evaluate(() => S.empresas.length) === 0);
    await p.reload(); await p.waitForTimeout(1000);
    check(`${nomeTela}: depois de visto, não abre sozinho`, await p.locator('.tour').count() === 0);
    if (nomeTela === 'celular') { await p.click('.sidebar-menu-button'); await p.waitForTimeout(500); }
    await p.click('#lat-pe [data-acao="tour"]'); await p.waitForTimeout(400);
    check(`${nomeTela}: a barra lateral reabre o tour`, await p.locator('.tour.show').count() === 1 && await esperaTit(titulos[0]));
    await p.click('[data-tour="next"]'); await esperaTit(titulos[1]); await p.waitForTimeout(400);
    await p.click('[data-tour="prev"]');
    check(`${nomeTela}: Voltar volta um passo`, await esperaTit(titulos[0]));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    check(`${nomeTela}: Esc fecha o tour`, await p.locator('.tour').count() === 0);
    await ctx.close();
  }
  // primeira visita sem nada salvo: a tela vazia mostra a empresa modelo; o tour fica na barra lateral
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }), p = await ctx.newPage();
  await p.goto(URL); await p.waitForTimeout(500);
  check('sem tour automático para navegador automatizado', await p.locator('.tour').count() === 0);
  check('a tela vazia de Empresas não repete o tour ao lado da empresa modelo', await p.locator('.escolha-metodo [data-acao="tour"]').count() === 0 && await p.locator('.escolha-metodo [data-acao="modelo"]').count() === 1);
  await p.click('#lat-pe [data-acao="tour"]'); await p.waitForTimeout(400);
  check('o tour abre pela barra lateral', await p.locator('.tour.show').count() === 1);
  await ctx.close();

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length || erros.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
