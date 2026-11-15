// Transições curtas das janelinhas, dos diálogos e das trocas de tela, e o movimento desligado para quem pede menos animação.
const { chromium } = require('playwright-core');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const erros = [];
  const abrir = async reducedMotion => {
    const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion });
    const p = await ctx.newPage();
    p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await p.route('**/brasilapi.com.br/**', r => r.abort());
    await p.goto(URL);
    p.ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(400); };
    return p;
  };
  // janelinha: abre, fecha pelo Esc (dentro da página, para medir na hora) e some do DOM depois da saída
  const ciclo = p => p.evaluate(async () => {
    const abertas = () => document.querySelectorAll('.menu-pop').length, ids = () => document.querySelectorAll('#pop').length;
    const a = document.querySelector('#app .gl-link[data-gl="fgv"]'); a.scrollIntoView({ block: 'center' }); a.click();
    await new Promise(r => setTimeout(r, 300));
    const el = document.querySelector('#pop'), dentro = { visivel: el.classList.contains('visivel'), opacidade: getComputedStyle(el).opacity, duracao: parseFloat(getComputedStyle(el).transitionDuration) };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const logo = { ids: ids(), noDom: abertas(), inerte: el.inert, visivel: el.classList.contains('visivel') };
    await new Promise(r => setTimeout(r, 300));
    return { dentro, logo, depois: abertas() };
  });
  // diálogo: abre pela função da base, o botão fecha com transição e a promessa só resolve depois
  const dialogo = async p => {
    await p.evaluate(() => { window.__saiu = false; window.__resp = undefined; const d = document.getElementById('dlg'); new MutationObserver(() => { if (d.classList.contains('saindo')) window.__saiu = true; }).observe(d, { attributes: true, attributeFilter: ['class'] }); perguntar('<h2>Teste</h2><p>Diálogo de teste.</p>', [['Fechar', 'ok', 'prim']]).then(v => { window.__resp = v; }); });
    await p.waitForTimeout(350);
    const abriu = await p.evaluate(() => document.getElementById('dlg').open);
    await p.click('#dlg-acoes button:has-text("Fechar")'); await p.waitForTimeout(350);
    return { abriu, saiu: await p.evaluate(() => window.__saiu), fechou: await p.evaluate(() => !document.getElementById('dlg').open && !document.getElementById('dlg').classList.contains('saindo')), resp: await p.evaluate(() => window.__resp) };
  };

  // 1. movimento normal
  let p = await abrir('no-preference');
  await p.ir('#/metodos');
  const n = await ciclo(p);
  check('Janelinha entra com transição: classe visivel, opacidade 1 e duração maior que zero', n.dentro.visivel && n.dentro.opacidade === '1' && n.dentro.duracao > 0.05, JSON.stringify(n.dentro));
  check('Janelinha sai com transição: sem o id, inerte e ainda no DOM por um instante', n.logo.ids === 0 && n.logo.noDom === 1 && n.logo.inerte && !n.logo.visivel, JSON.stringify(n.logo));
  check('Depois da saída, a janelinha sai do DOM', n.depois === 0);
  const dup = await p.evaluate(async () => {
    const [a, c] = document.querySelectorAll('#app .gl-link[data-gl="fgv"], #app .gl-link[data-gl="brasscom"]');
    a.scrollIntoView({ block: 'center' }); a.click(); c.click();
    const ids = document.querySelectorAll('#pop').length; await new Promise(r => setTimeout(r, 300));
    return { ids, restantes: document.querySelectorAll('.menu-pop').length };
  });
  check('Abrir uma janelinha logo depois de outra nunca deixa dois ids iguais, e fica só a nova', dup.ids === 1 && dup.restantes === 1, JSON.stringify(dup));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const d = await dialogo(p);
  check('Diálogo abre, sai com a classe de transição, fecha e só então responde', d.abriu && d.saiu && d.fechou && d.resp === 'ok', JSON.stringify(d));
  await p.ir('#/glossario');
  check('Trocar de tela entra com uma transição curta', await p.evaluate(() => document.getElementById('app').classList.contains('entra') && getComputedStyle(document.getElementById('app')).animationName === 'surgir'));
  check('Campos mudam de cor aos poucos, não de repente', await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#gl-busca')).transitionDuration.split(',')[0]) > 0));
  await p.context().close();

  // 2. quem pede menos animação: tudo imediato
  p = await abrir('reduce');
  await p.ir('#/metodos');
  const r = await ciclo(p);
  check('Menos animação: a janelinha entra e sai sem transição, e some do DOM na hora', r.dentro.duracao < 0.01 && r.logo.noDom === 0 && r.logo.ids === 0, JSON.stringify(r));
  await p.ir('#/glossario');
  check('Menos animação: trocar de tela não anima', await p.evaluate(() => !document.getElementById('app').classList.contains('entra')));
  const dr = await dialogo(p);
  check('Menos animação: o diálogo fecha na hora, sem a classe de saída', dr.abriu && !dr.saiu && dr.fechou, JSON.stringify(dr));
  await p.context().close();

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length || erros.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
