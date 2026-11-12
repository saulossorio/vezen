// Ajustes por cidade: nomes do IBGE, regra do mínimo, aplicação na receita e no gasto de TI, e a calibração embutida na versão pública.
const fs = require('fs'), path = require('path'), arq = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports, P = JSON.parse(JSON.stringify(M.PAIS.parametros)), C = P.calibracao;
let falhas = 0;
const ok = (rot, c, info = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (info !== '' ? '  [' + info + ']' : '')); if (!c) falhas++; };
const perto = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;

// 1. nomes
ok('Lista do IBGE: 27 UFs e 5.571 municípios', Object.keys(M.MUNICIPIOS).length === 27 && Object.values(M.MUNICIPIOS).reduce((s, x) => s + x.split('|').length, 0) === 5571);
ok('SP tem 645 municípios', M.municipiosUF('SP').length === 645);
ok('"SAO PAULO" vira "São Paulo"', M.municipioOficial('SP', 'SAO PAULO') === 'São Paulo');
ok('Apóstrofo e hífen', M.municipioOficial('SP', 'SANTA BARBARA D OESTE') === "Santa Bárbara d'Oeste" && M.municipioOficial('SP', 'biritiba-mirim') === 'Biritiba Mirim', M.municipioOficial('SP', 'biritiba-mirim'));
ok('Nome antigo e bairro', M.municipioOficial('SP', 'Embu') === 'Embu das Artes' && M.municipioOficial('SP', 'Santo Amaro') === 'São Paulo' && M.municipioOficial('RJ', 'Parati') === 'Paraty');
ok('Fora da lista ou sem UF: null', M.municipioOficial('SP', 'Cidade Inventada') === null && M.municipioOficial('', 'São Paulo') === null && M.municipioOficial('SP', '') === null);
ok('Mesmo nome em UFs diferentes, chaves diferentes', M.chaveCidade('BA', 'Santo Amaro') === 'BA:santo amaro' && M.chaveCidade('SP', 'Santo Amaro') === 'SP:sao paulo');

// 2. ajustes locais com dados sintéticos
const it = [];
const add = (n, uf, cid, linha, e) => { for (let i = 0; i < n; i++) it.push({ uf, cid: M.chaveCidade(uf, cid), nome: M.municipioOficial(uf, cid) || cid, linha, e }); };
add(12, 'SP', 'São Paulo', 'industria', 0.5); add(6, 'SP', 'Campinas', 'servicos', -0.3); add(3, 'SP', 'Bauru', 'servicos', -1); add(2, 'SP', 'Franca', 'servicos', -1);
const A = M.ajustesLocais(it, C);
ok('Cidades com 5 ou mais têm valor próprio', Object.keys(A.cidades).sort().join() === 'SP:campinas,SP:sao paulo', Object.keys(A.cidades).join());
ok('São Paulo: 12·0,5/(12+5)', perto(A.cidades['SP:sao paulo'].f, Math.exp(12 * 0.5 / 17)) && A.cidades['SP:sao paulo'].nome === 'São Paulo');
ok('Bauru (3) e Franca (2) juntas em demais cidades: 5·(−1)/10', perto(A.demais.SP.f, Math.exp(-0.5)) && A.demais.SP.n === 5, JSON.stringify(A.demais));
ok('Uma UF só: sem ajuste por estado', !Object.keys(A.ufs).length);
ok('Setor na cidade com 12 e 6 empresas', Object.keys(A.celulas).sort().join() === 'industria|SP:sao paulo,servicos|SP:campinas', Object.keys(A.celulas).join());
ok('Sobra depois da cidade vai para a célula', perto(A.celulas['industria|SP:sao paulo'].f, Math.exp(12 * (0.5 - 12 * 0.5 / 17) / 17)));
ok('Nada guarda o logaritmo', !JSON.stringify(A).includes('"e"'));
const B = M.ajustesLocais([...it.map(x => Object.assign({}, x)), ...Array.from({ length: 6 }, () => ({ uf: 'RJ', cid: 'RJ:rio de janeiro', nome: 'Rio de Janeiro', linha: 'servicos', e: 0.2 }))], C);
ok('Duas UFs: ajuste por estado', B.ufs.SP && B.ufs.RJ && B.ufs.RJ.n === 6, JSON.stringify(B.ufs));
const C4 = Object.assign({}, C, { minGrupo: 3 }), A3 = M.ajustesLocais(it, C4);
ok('minGrupo 3: Bauru ganha valor próprio', !!A3.cidades['SP:bauru'] && A3.demais.SP == null);

// 3. fator de uma empresa
const f1 = M.fatorLocal(A, 'industria', 'SP', 'SAO PAULO'), f2 = M.fatorLocal(A, 'servicos', 'SP', 'Bauru'), f3 = M.fatorLocal(A, 'servicos', 'SP', ''), f4 = M.fatorLocal(A, 'servicos', 'RJ', 'Niterói');
ok('São Paulo, indústria: cidade × setor na cidade', f1 && perto(f1.f, A.cidades['SP:sao paulo'].f * A.celulas['industria|SP:sao paulo'].f) && f1.partes.length === 2, f1 && f1.partes.map(p => p.rot).join('; '));
ok('Bauru: demais cidades de SP', f2 && perto(f2.f, A.demais.SP.f) && f2.partes[0].rot === 'demais cidades de SP');
ok('Sem município ou de outra UF: sem ajuste', f3 === null && f4 === null);
ok('Nome fora da lista do IBGE: sem “demais cidades”', M.fatorLocal(A, 'servicos', 'SP', 'Sao Paolo') === null);

// 4. calibração com cidade e aplicação nas estimativas
const regs = [];
const cidades = [['São Paulo', 14, 1.5], ['Campinas', 6, 0.7], ['Bauru', 2, 0.5], ['Franca', 3, 0.5]];
// ruído fixo (gerador congruente), para a amostra parecer real: desvio de uns 0,3 em logaritmo
let seed = 7, i = 0;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, ruido = () => Math.exp(0.6 * (rnd() + rnd() + rnd() - 1.5));
for (const [cid, n, mult] of cidades) for (let j = 0; j < n; j++, i++) {
  const func = 200 + 37 * i, rec = func * 703000 * mult * ruido();
  regs.push({ id: 'r' + i, nome: 'E' + i, cnpj: '', chaveSetor: 'x', setor: 'industria', uf: 'SP', cidade: cid, natureza: 'privada', receita: { 2025: rec }, gastoTI: { 2025: rec * 0.012 * mult * ruido() }, receitaTI: {}, func, funcTI: null, naoDivulga: false, checaRedondo: false, ignorarND: false });
}
const cal = M.calibrarRegistros(regs, P, { ano: 2026, id: 't', nome: 't', extras: [] });
ok('Receita e TI calibrados (25 empresas)', cal.receita.suficiente && cal.ti.suficiente, cal.receita.modelo + ' / ' + cal.ti.N);
ok('Receita: São Paulo acima e Campinas abaixo', cal.receita.local.cidades['SP:sao paulo'].f > 1 && cal.receita.local.cidades['SP:campinas'].f < 1, JSON.stringify(cal.receita.local.cidades));
ok('Receita: Bauru e Franca juntas (5)', cal.receita.local.demais.SP && cal.receita.local.demais.SP.n === 5);
ok('TI: ajustes locais medidos (São Paulo acima, Campinas abaixo)', cal.ti.local && cal.ti.local.cidades['SP:sao paulo'].f > 1 && cal.ti.local.cidades['SP:campinas'].f < 1, JSON.stringify(cal.ti.local.cidades) + ' N=' + cal.ti.N);
const Pc = M.parametrosCalibrados(P, cal), fc = M.fatoresCalibrados(cal, P);
const d = { nome: 'X', natureza: 'privada', setor: 'industria', uf: 'SP', municipio: 'Campinas', funcionarios: { v: 800, o: 'terceiros' }, fatEstimar: true };
const r1 = M.calcular(d, Pc, { ano: 2026, calib: fc }), r0 = M.calcular(Object.assign({}, d, { municipio: '' }), Pc, { ano: 2026, calib: fc });
const rf = x => x.receita.caminhos.find(c => c.cod === 'RF');
ok('Receita em Campinas = sem cidade × fator local (cidade × setor na cidade)', r1.receita.local && perto(rf(r1).v / rf(r0).v, r1.receita.local.f, 1e-6) && perto(r1.receita.local.f, cal.receita.local.cidades['SP:campinas'].f * ((cal.receita.local.celulas['industria|SP:campinas'] || {}).f || 1), 1e-9), (rf(r1).v / rf(r0).v).toFixed(4));
ok('Passo "Ajuste local da base" na conta', rf(r1).partes.some(p => /^Ajuste local da base: Campinas × /.test(p.rot)), rf(r1).partes.map(p => p.rot).join(' | '));
ok('Gasto de TI: k = setor × local', perto(r1.modelo.k, r1.modelo.kSetor * r1.modelo.local.f, 1e-9) && r0.modelo.local === null && perto(r0.modelo.k, r0.modelo.kSetor, 1e-9), `${r1.modelo.kSetor.toFixed(3)} × ${r1.modelo.local && r1.modelo.local.f}`);

// 5. regra do mínimo nos setores
const poucos = regs.slice(0, 12).map((x, j) => Object.assign({}, x, { setor: j < 3 ? 'saude' : 'industria' }));
const c2 = M.calibrarRegistros(poucos, P, { ano: 2026, extras: [] });
ok('Gasto de TI: setor com 3 empresas fica com a correção geral', c2.ti.suficiente && c2.ti.nS.saude === 3 && perto(c2.ti.ks.saude, c2.ti.kg, 1e-12), c2.ti.suficiente ? `${c2.ti.ks.saude} / ${c2.ti.kg}` : 'sem TI');
ok('Receita: setor com 3 empresas fica com o nível geral', c2.receita.setores.saude.n === 3 && c2.receita.setores.saude.rpe === Math.round(P.setores.saude.rpe * c2.receita.fatorGeral / 1000) * 1000, JSON.stringify(c2.receita.setores.saude));

// 6. calibração embutida: é a versão pública, só com os parâmetros que entram na conta.
// A regra do mínimo de empresas por grupo é aplicada ao gerar a calibração (seções 2, 4 e 5); a versão pública não guarda contagens.
const E = M.PAIS.calibracaoBase;
const PROIBIDAS = ['n', 'N', 'nS', 'nG', 'empresas', 'linhas', 'mapa', 'segmentos', 'descartes', 'col', 'descricao', 'formato', 'suspeitas', 'acertoAntes', 'acertoDepois', 'nLinhas', 'nExtras', 'nExtrasTodas', 'repetido', 'linhasTI', 'corte'];
const chavesDe = (o, out = []) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { out.push(k); chavesDe(v, out); } return out; };
const sobra = chavesDe(E).filter(k => PROIBIDAS.includes(k));
ok('Embutida: versão pública', E.publica === true && !('nome' in E), E.id);
ok('Embutida: sem contagens, nomes de arquivo, colunas ou segmentos da base', !sobra.length, sobra.join(', '));
ok('Embutida: grupos e setores em ordem alfabética', [E.receita.setores, E.ti.ks, E.receita.local.cidades, E.ti.local.cidades, E.receita.local.celulas].every(o => Object.keys(o).join() === Object.keys(o).sort().join()));
ok('Embutida: setores do gasto de TI sem valor próprio usam a geral', Object.entries(E.ti.ks).every(([l, k]) => E.ti.proprio[l] || k === E.ti.kg), JSON.stringify(E.ti.proprio));
ok('Embutida: 18 cidades na receita e 6 no gasto de TI', Object.keys(E.receita.local.cidades).length === 18 && Object.keys(E.ti.local.cidades).length === 6);
ok('Embutida: acerto em fração, sem o número de empresas', E.ti.pctAcertoDepois > 0 && E.ti.pctAcertoDepois < 1 && E.ti.pctAcertoAntes < E.ti.pctAcertoDepois, `${E.ti.pctAcertoAntes} → ${E.ti.pctAcertoDepois}`);
ok('Embutida: sem CNPJ, e-mail ou linhas de empresa', !/\d{14}|[a-z0-9._-]+@[a-z0-9-]+\.[a-z]|linhasTI|"emp"/i.test(JSON.stringify(E)));

// 7. a versão pública dá as mesmas estimativas que a calibração completa
const pub = M.calibracaoPublica(cal, C.minGrupo);
const Pp = M.parametrosCalibrados(P, pub), fp = M.fatoresCalibrados(pub, P);
let iguais = 0, total = 0;
for (const municipio of ['Campinas', 'São Paulo', 'Bauru', '']) for (const setor of ['industria', 'servicos', 'saude']) for (const func of [60, 800, 6000]) {
  const dd = { nome: 'X', natureza: 'privada', setor, uf: 'SP', municipio, funcionarios: { v: func, o: 'terceiros' }, fatEstimar: true };
  const a1 = M.calcular(JSON.parse(JSON.stringify(dd)), Pc, { ano: 2026, calib: fc }), a2 = M.calcular(JSON.parse(JSON.stringify(dd)), Pp, { ano: 2026, calib: fp });
  total++; if (a1.F === a2.F && a1.p10 === a2.p10 && a1.p90 === a2.p90 && a1.receita.usada.v === a2.receita.usada.v) iguais++;
}
ok('Versão pública: mesmas estimativas da calibração completa', iguais === total, `${iguais} de ${total}`);
ok('Versão pública: marca quem tem valor próprio', pub.ti.proprio.industria === true && pub.receita.setores.industria.proprio === true && !JSON.stringify(pub).includes('"n":'));
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exitCode = falhas ? 1 : 0;
