// Tour guiado: abre sozinho na primeira visita, percorre todos os passos sem perder nenhum alvo (computador e celular),
// segura cliques fora do recorte, avança pelo clique no alvo, pode ser pulado e reaberto pela barra lateral.
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
    await p.route('**/brasilapi.com.br/**', r => r.abort());
    await p.goto(URL); await p.waitForTimeout(1000);
    const tit = () => p.textContent('#tour-tit').catch(() => '');
    const esperaTit = async t => { for (let i = 0; i < 60; i++) { if ((await tit()) === t) return true; await p.waitForTimeout(100); } return false; };
    const titulos = await p.evaluate(() => TOUR.map(x => x.titulo)), clique = await p.evaluate(() => TOUR.map(x => !!x.clique));
    check(`${nomeTela}: primeira visita abre o tour`, await p.locator('#tour.visivel').count() === 1 && await esperaTit(titulos[0]));
    check(`${nomeTela}: o primeiro passo oferece Começar e Agora não`, (await p.textContent('[data-t="proximo"]')) === 'Começar' && (await p.textContent('[data-t="pular"]')) === 'Agora não');
    await p.mouse.click(5, viewport.height - 5); await p.waitForTimeout(250);
    check(`${nomeTela}: clique fora do cartão é segurado e explicado`, await p.locator('.tour-msg.visivel').count() === 1 && await p.evaluate(() => location.hash) === '#/empresas');
    for (let i = 1; i < titulos.length; i++) {
      // nos passos de clique, no computador o clique é no próprio alvo; no celular, pelo botão Próximo
      if (clique[i - 1] && nomeTela === 'computador') await p.evaluate(() => { const el = TOUR[T.i] && T.el; el.click(); });
      else await p.click('[data-t="proximo"]');
      const chegou = await esperaTit(titulos[i]);
      await p.waitForTimeout(450);
      const est = await p.evaluate(() => { const l = document.querySelector('.tour-luz').getBoundingClientRect(), c = document.querySelector('.tour-cartao').getBoundingClientRect();
        return { erro: !document.querySelector('[data-t="repetir"]').hidden, luz: l.width > 0 && l.height > 0, dentro: c.left >= 0 && c.top >= 0 && c.right <= innerWidth + 1 && c.bottom <= innerHeight + 1, alvo: !!(T && T.el) }; });
      check(`${nomeTela}: passo ${i}, ${titulos[i]}`, chegou && !est.erro && est.luz && est.alvo && est.dentro, JSON.stringify(est));
    }
    check(`${nomeTela}: último passo conclui`, (await p.textContent('[data-t="proximo"]')) === 'Concluir');
    await p.click('[data-t="proximo"]'); await p.waitForTimeout(400);
    check(`${nomeTela}: concluir fecha o tour e lembra que foi visto`, await p.locator('#tour').count() === 0 && await p.evaluate(() => localStorage.getItem('vezen.tour')) === 'visto');
    check(`${nomeTela}: o tour não salva a empresa modelo`, await p.evaluate(() => S.empresas.length) === 0);
    await p.reload(); await p.waitForTimeout(1000);
    check(`${nomeTela}: depois de visto, não abre sozinho`, await p.locator('#tour').count() === 0);
    if (nomeTela === 'celular') { await p.click('[data-acao="menu"]'); await p.waitForTimeout(300); }
    await p.click('#lat-pe [data-acao="tour"]'); await p.waitForTimeout(400);
    check(`${nomeTela}: a barra lateral reabre o tour`, await p.locator('#tour.visivel').count() === 1 && await esperaTit(titulos[0]));
    await p.click('[data-t="proximo"]'); await esperaTit(titulos[1]); await p.waitForTimeout(400);
    await p.click('[data-t="voltar"]');
    check(`${nomeTela}: Voltar volta um passo`, await esperaTit(titulos[0]));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    check(`${nomeTela}: Esc fecha o tour`, await p.locator('#tour').count() === 0);
    await ctx.close();
  }
  // primeira visita sem nada salvo: a tela vazia também leva ao tour
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }), p = await ctx.newPage();
  await p.goto(URL); await p.waitForTimeout(500);
  check('sem tour automático para navegador automatizado', await p.locator('#tour').count() === 0);
  await p.click('.vazio [data-acao="tour"]'); await p.waitForTimeout(400);
  check('a tela vazia de Empresas abre o tour', await p.locator('#tour.visivel').count() === 1);
  await ctx.close();

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length || erros.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
