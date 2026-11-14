// Glossário: a tela (lista, busca, categoria, destaque), as siglas do texto que abrem a definição, a janelinha com a mesma definição da lista,
// o que fica sem link (campos, botões, título, o que a pessoa digitou) e a conferência de que as siglas das telas estão no glossário.
const { chromium } = require('playwright-core');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ok = [], falhas = [];
const check = (nome, cond, info = '') => { (cond ? ok : falhas).push(nome + (info ? ' — ' + info : '')); };
const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
// siglas que podem aparecer nas telas sem verbete: estados, nomes de produtos e empresas, variáveis das fórmulas
const PERMITIDAS = new Set([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
  'SAP', 'AWS', 'TOTVS', 'VTEX', 'ADP', 'MV', 'EUA', 'USD', 'HTML', 'ID', 'OK', 'TV',
  'N0', 'IUF', 'TIUF'
]);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.route('**/brasilapi.com.br/**', r => r.abort());
  await p.goto(URL);
  const ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(400); };
  const motor = f => p.evaluate(f);

  // 1. os dados do glossário
  const dados = await motor(() => ({
    n: GLOSSARIO.length, ids: new Set(GLOSSARIO.map(g => g.id)).size, cats: GL_CATS.map(c => c[0]),
    ruins: GLOSSARIO.filter(g => !g.id || !g.t || !g.d || !GL_CATS.some(c => c[0] === g.c) || (g.s && !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(g.s)) || (g.m && !SEC_MET.some(s => s[0] === g.m)) || /\s—\s|–/.test(g.d + (g.u || ''))).map(g => g.id),
    semDefinicaoCurta: GLOSSARIO.filter(g => g.d.length > 260).map(g => g.id)
  }));
  check('Glossário: ids únicos, categoria válida, definição, site com https e seção da Metodologia existente', dados.n >= 100 && dados.n === dados.ids && dados.ruins.length === 0, dados.ruins.join());
  check('Glossário: definições curtas', dados.semDefinicaoCurta.length === 0, dados.semDefinicaoCurta.join());
  check('Glossário: tem instituições com site oficial (FGV, Brasscom, FEBRABAN)', await motor(() => ['fgv', 'brasscom', 'febraban'].every(i => /^https:\/\//.test(GL_POR_ID.get(i).s))));

  // 2. menu e tela
  check('Barra lateral: item Glossário', await p.locator('#nav a[href="#/glossario"]').count() === 1);
  await p.click('#nav a[href="#/glossario"]'); await p.waitForTimeout(500);
  check('Glossário: abre pelo menu e marca o item atual', (await p.evaluate(() => location.hash)) === '#/glossario' && (await p.getAttribute('#nav a[href="#/glossario"]', 'aria-current')) === 'page' && (await txt(p, 'h1')) === 'Glossário');
  check('Glossário: um verbete por termo, com o contador', await p.locator('.gl-item').count() === dados.n && (await txt(p, '#gl-conta')) === `${dados.n} termos`);
  const letras = await p.$$eval('.gl-letra', hs => hs.map(h => h.textContent.trim()));
  check('Glossário: em ordem alfabética, por letra', letras.length > 10 && letras.join() === [...letras].sort((a, c) => a.localeCompare(c, 'pt-BR')).join(), letras.join(''));
  check('Verbete: nome, categoria, significado, utilidade e site oficial', await p.evaluate(() => { const e = document.getElementById('gl-fgv'); return !!e && e.querySelector('h3').textContent === 'FGV' && /Fundação Getulio Vargas/.test(e.querySelector('.gl-nome').textContent) && e.querySelector('.gl-cat').textContent.length > 3 && e.querySelector('.gl-def').textContent.length > 20 && /Utilidade/.test(e.textContent) && /Site oficial/.test(e.textContent) && e.querySelector('a[href^="https://"][target=_blank]').rel.includes('noopener'); }));
  check('Verbete sem site oficial não mostra a linha', await p.evaluate(() => !/Site oficial/.test(document.getElementById('gl-caminho').textContent)));
  check('Verbete de lei traz “Texto da lei” no lugar de site', await p.evaluate(() => /Texto da lei/.test(document.getElementById('gl-clt').textContent)));
  await p.fill('#gl-busca', 'fundacao getulio'); await p.waitForTimeout(150);
  check('Busca sem acento acha pelo nome por extenso', (await txt(p, '#gl-conta')).startsWith('1 de ') && await p.locator('.gl-item:not([hidden]) h3').evaluate(e => e.textContent) === 'FGV');
  await p.fill('#gl-busca', 'balanço'); await p.waitForTimeout(150);
  check('Busca vale também para o significado e a utilidade', await p.locator('.gl-item:not([hidden])').count() >= 4 && await p.locator('#gl-balanco:not([hidden])').count() === 1);
  await p.fill('#gl-busca', 'xyzxyz'); await p.waitForTimeout(150);
  check('Busca sem resultado avisa e some com as letras', await p.locator('#gl-vazio').isVisible() && await p.locator('.gl-grupo:not([hidden])').count() === 0);
  await p.fill('#gl-busca', ''); await p.selectOption('#gl-cat', 'ti'); await p.waitForTimeout(150);
  check('Categoria filtra os termos', await p.locator('.gl-item:not([hidden])').count() === await motor(() => GLOSSARIO.filter(g => g.c === 'ti').length) && await p.locator('.gl-item:not([hidden])[data-cat="ti"]').count() > 20);
  await p.selectOption('#gl-cat', ''); await p.waitForTimeout(100);

  // 3. chegar por um termo: rola até ele, destaca e dá foco
  await ir('#/glossario/cnpj'); await p.waitForTimeout(1200);
  check('Endereço com o termo: rola até ele e dá foco', await p.evaluate(() => { const r = document.getElementById('gl-cnpj').getBoundingClientRect(); return document.activeElement.id === 'gl-cnpj' && r.top >= 0 && r.bottom <= innerHeight; }));
  await ir('#/glossario'); await p.fill('#gl-busca', 'xyzxyz'); await ir('#/glossario/mei'); await p.waitForTimeout(1000);
  check('Endereço com o termo desfaz a busca que o escondia', await p.locator('#gl-mei:not([hidden])').count() === 1 && (await p.inputValue('#gl-busca')) === '');

  // 4. siglas do texto: Metodologia
  await ir('#/metodologia'); await p.waitForTimeout(300);
  const fgv = p.locator('#app .gl-link[data-gl="fgv"]').first();
  check('Metodologia: as siglas do texto viram link', await p.locator('#app .gl-link').count() > 40 && await fgv.count() === 1);
  check('Só o primeiro de cada termo em cada seção', await p.evaluate(() => [...document.querySelectorAll('#app section')].every(s => { const ids = [...s.querySelectorAll('.gl-link')].filter(l => l.closest('section') === s).map(l => l.dataset.gl); return new Set(ids).size === ids.length; })));
  check('“TI” tem um link só por tela', await p.locator('#app .gl-link[data-gl="ti"]').count() === 1);
  check('Sem link em campo, botão, link, rótulo, título de seção, fórmula e leitor de tela', await p.evaluate(() => document.querySelectorAll('#app :is(input, textarea, select, button, a, label, summary, h1, h2, .fx, .sr) .gl-link').length === 0));
  check('O link é um botão em forma de texto, com foco por teclado e sem mudar o texto', await p.evaluate(() => { const l = document.querySelector('#app .gl-link'); return l.getAttribute('role') === 'button' && l.tabIndex === 0 && l.getAttribute('aria-haspopup') === 'dialog' && l.textContent.length > 1; }));
  await fgv.scrollIntoViewIfNeeded(); await fgv.click(); await p.waitForTimeout(250);
  const defPop = await p.evaluate(() => document.querySelector('#pop .pop-def').textContent);
  check('Clicar abre a janelinha com o termo, o nome e a definição', (await txt(p, '#pop h4')).startsWith('FGV Fundação Getulio Vargas') && defPop.length > 20 && await p.evaluate(() => document.querySelector('#pop').getAttribute('role') === 'dialog') && (await fgv.getAttribute('aria-expanded')) === 'true');
  check('A janelinha só tem a definição e o atalho para o glossário', await p.locator('#pop p').count() === 2 && await p.locator('#pop a[href="#/glossario/fgv"]').count() === 1 && !/Utilidade|Site oficial/.test(await txt(p, '#pop')));
  await p.click('#pop a[href="#/glossario/fgv"]'); await p.waitForTimeout(1200);
  const defLista = await p.evaluate(() => document.querySelector('#gl-fgv .gl-def').textContent);
  check('Ver no glossário leva ao verbete, com a mesma definição da janelinha', (await p.evaluate(() => location.hash)) === '#/glossario/fgv' && defLista === defPop && await p.locator('#pop').count() === 0);
  await ir('#/metodologia'); await p.waitForTimeout(300);
  await p.focus('#app .gl-link[data-gl="fgv"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  check('Enter no termo abre a definição', await p.locator('#pop .pop-def').count() === 1);
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  check('Esc fecha e devolve o foco ao termo', await p.locator('#pop').count() === 0 && await p.evaluate(() => document.activeElement.classList.contains('gl-link') && document.activeElement.dataset.gl === 'fgv'));
  await p.click('#app .gl-link[data-gl="fgv"]'); await p.waitForTimeout(200);
  const aninhado = p.locator('#pop .gl-link').first();
  check('Dentro da janelinha, termos da definição também abrem a deles, sem repetir o próprio termo', await p.locator('#pop .gl-link').count() >= 1 && await p.locator('#pop .gl-link[data-gl="fgv"]').count() === 0);
  const idAninhado = await aninhado.getAttribute('data-gl'); await aninhado.click(); await p.waitForTimeout(300);
  check('O termo aninhado troca a janelinha, sem deixar duas', await p.locator('#pop').count() === 1 && (await txt(p, '#pop h4')).length > 1 && (await p.evaluate(i => document.querySelector('#pop .pop-def').textContent === GL_POR_ID.get(i).d, idAninhado)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);

  // 5. mesma definição na janelinha e na lista, para todos os termos
  await ir('#/glossario');
  const dif = await motor(() => GLOSSARIO.filter(g => {
    const a = document.createElement('span'); a.className = 'gl-link'; a.dataset.gl = g.id; document.getElementById('app').appendChild(a);
    abrirTermo(a); const pop = document.querySelector('#pop'), t = pop && pop.querySelector('.pop-def') ? pop.querySelector('.pop-def').textContent : null;
    const lista = document.querySelector(`#gl-${g.id} .gl-def`).textContent; fecharPop(); a.remove();
    return t !== lista || t !== g.d;
  }).map(g => g.id));
  check('Janelinha e lista têm a mesma definição em todos os termos', dif.length === 0, dif.join());

  // 6. janelinhas de ajuda também ganham os links
  await p.evaluate(() => { location.hash = '#/empresas'; }); await p.waitForTimeout(300);
  await p.click('#app [data-acao=nova] >> nth=0'); await p.waitForTimeout(300);
  await p.check('input[data-objetivo][value=ti]'); await p.click('button.ajuda[data-chave=natureza]'); await p.waitForTimeout(250);
  check('Ajuda do campo: empresa listada, subsidiária e terceiro setor viram link', await p.locator('#pop .gl-link').count() >= 3 && await p.locator('#pop .gl-link[data-gl="subsidiaria"]').count() === 1 && await p.locator('#pop .gl-link[data-gl="terceiro-setor"]').count() === 1);
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);

  // 7. o que a pessoa digitou fica sem link
  await p.fill('#f-nome', 'FGV ME CNPJ Teste'); await p.waitForTimeout(250);
  check('Nome da empresa digitado não vira link: título e barra lateral', await p.locator('#tit-emp .gl-link').count() === 0 && await p.locator('#nav .gl-link').count() === 0);
  await p.evaluate(() => { const d = UI.atual.dados; for (const c of pendentes(d)) { d.semDado = d.semDado || {}; d.semDado[c] = CAMPOS_SEM_DADO[c].ops[0]; } atualizarSemDado(); });
  await p.click('#ws-acoes [data-acao=salvar]'); await p.waitForTimeout(300);
  await ir('#/empresas');
  check('Nome da empresa na lista de empresas fica sem link', await p.locator('.lista-emp .emp-nome').count() === 1 && await p.locator('.lista-emp tbody .gl-link').count() === 0 && /FGV ME CNPJ Teste/.test(await txt(p, '.lista-emp .emp-nome')));

  // 8. as siglas das telas estão no glossário (ou na lista de permitidas)
  await p.evaluate(() => { location.hash = '#/empresas'; }); await p.waitForTimeout(300);
  await p.click('[data-acao=menu-empresas]'); await p.click('#pop [data-acao=modelo]'); await p.waitForTimeout(500);
  const idModelo = await p.evaluate(() => UI.atual.id);
  const rotas = ['#/empresas', `#/analise/${idModelo}`, `#/analise/${idModelo}/resultado`, '#/listas', '#/listas/nova', '#/calibracao', '#/parametros', '#/metodologia', '#/testes', '#/glossario'];
  let corpo = '';
  for (const r of rotas) {
    await ir(r); await p.waitForTimeout(250);
    // texto de todos os trechos da tela, separados, para uma sigla não grudar na vizinha; os links já inseridos não mudam o texto
    corpo += '\n' + await p.evaluate(() => { const w = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT), s = []; for (let n = w.nextNode(); n; n = w.nextNode()) s.push(n.nodeValue); return s.join(' | '); });
  }
  corpo += '\n' + await motor(() => [...Object.keys(AJUDA).map(k => textoAjuda(k, dadosVazios())), ...ORIGENS.map(o => o[1] + ' ' + o[2]), ...TECNOLOGIAS.flatMap(g => [g.g, ...g.itens.map(i => i[1] + ' ' + (i[2] || ''))]), ...PAIS.parametros.links.map(l => l.nome), ...SEC_MET.map(s => s[2])].join('\n'));
  const sobra = await p.evaluate(txt => {
    const formas = GLOSSARIO.flatMap(g => [g.t, ...(g.a || [])]).sort((a, c) => c.length - a.length);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const t = txt.replace(new RegExp(`(?<![\\p{L}\\p{N}_])(?:${formas.map(esc).join('|')})s?(?![\\p{L}\\p{N}_])`, 'giu'), ' ');
    const achados = new Map();
    for (const m of t.matchAll(/(?<![\p{L}\p{N}_])[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9]+(?![\p{L}\p{N}_])/gu)) achados.set(m[0], (achados.get(m[0]) || 0) + 1);
    return [...achados.keys()];
  }, corpo);
  const faltam = sobra.filter(s => !PERMITIDAS.has(s));
  check('Siglas das telas, das ajudas, das origens, das tecnologias e das fontes estão no glossário ou na lista de permitidas', faltam.length === 0, faltam.join(' '));
  const primeiraPessoa = (corpo.match(/(?<![\p{L}\p{N}])(chegamos|somamos|dividimos|estimamos|calculamos|usamos|levamos|aplicamos|transformamos|buscamos|achei|encontrei|n[aã]o sei|nosso|nossa)(?![\p{L}\p{N}])/giu) || []);
  check('Textos das telas, das ajudas e das fontes sem primeira pessoa', primeiraPessoa.length === 0, primeiraPessoa.join(' '));
  const jaVerbete = await p.evaluate(ps => ps.filter(s => GLOSSARIO.some(g => [g.t, ...(g.a || [])].includes(s))), [...PERMITIDAS]);
  check('A lista de permitidas não guarda sigla que já virou verbete', jaVerbete.length === 0, jaVerbete.join(' '));

  console.log('OK (' + ok.length + '):\n  ' + ok.join('\n  '));
  console.log('FALHAS (' + falhas.length + '):\n  ' + falhas.join('\n  '));
  console.log('Erros JS:', erros.length ? erros : 'nenhum');
  process.exitCode = falhas.length || erros.length ? 1 : 0;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
