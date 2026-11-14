// Receita informada de menos de 12 meses (balanço trimestral ou semestral, IF.data): é levada a 12 meses, e cada mês que falta soma incerteza.
const fs = require('fs'), path = require('path'), arq = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports, P = JSON.parse(JSON.stringify(M.PAIS.parametros));
let falhas = 0;
const ok = (rot, c, info = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (info !== '' ? '  [' + info + ']' : '')); if (!c) falhas++; };
const perto = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const copia = x => JSON.parse(JSON.stringify(x));
const base = { nome: 'Empresa A', natureza: 'privada', setor: 'varejo', uf: 'SP', fatEstimar: false, fatTipo: 'liquida', fatAno: '2026', funcionarios: { v: 800, o: 'terceiros' }, faturamento: { v: 120e6, o: 'oficial' } };
const calc = (extra = {}, PP = P) => M.calcular(copia(Object.assign({}, base, extra)), PP, { ano: 2026 });
const r12 = calc({ fatMeses: '12' }), rSem = calc();

ok('Parâmetro: incerteza por mês que falta, com a fonte marcada como suposição inicial', P.receita.sMeses > 0 && !!M.PAIS.fontes['receita.sMeses'] && M.PAIS.fontes['receita.sMeses'].aprox === true, String(P.receita.sMeses));
ok('Sem período ou com 12 meses: nada muda', rSem.F === r12.F && rSem.p10 === r12.p10 && rSem.p90 === r12.p90 && rSem.receita.usada.v === 120e6 && r12.receita.informada.meses === 12 && r12.receita.informada.fm === 1);
for (const [meses, fator] of [[9, 12 / 9], [6, 2], [3, 4]]) {
  const r = calc({ fatMeses: String(meses) });
  ok(`${meses} meses: a receita é multiplicada por 12 ÷ ${meses}`, perto(r.receita.usada.v, 120e6 * fator) && r.receita.informada.meses === meses && perto(r.receita.informada.fm, fator), (r.receita.usada.v / 1e6).toFixed(2) + ' mi');
  const s12 = r12.receita.usada.s, s = r.receita.usada.s;
  ok(`${meses} meses: cada mês que falta soma incerteza, em quadratura`, perto(s * s, s12 * s12 + ((12 - meses) * P.receita.sMeses) ** 2) && s > s12, s12.toFixed(3) + ' → ' + s.toFixed(3));
  ok(`${meses} meses: o gasto de TI estimado acompanha a receita maior`, r.F > r12.F, (r12.F / 1e6).toFixed(2) + ' → ' + (r.F / 1e6).toFixed(2) + ' mi');
}
ok('Com o parâmetro zerado, só a receita muda, sem incerteza a mais', (() => { const Q = copia(P); Q.receita.sMeses = 0; const r = calc({ fatMeses: '6' }, Q); return perto(r.receita.usada.s, r12.receita.usada.s) && perto(r.receita.usada.v, 240e6); })());
const r25 = calc({ fatAno: '2025', fatMeses: '6' });
ok('Período parcial de ano anterior: primeiro 12 meses, depois o crescimento até o ano da estimativa', perto(r25.receita.usada.v, 120e6 * 2 * (1 + P.receita.g)) && r25.receita.informada.dt === 1, (r25.receita.usada.v / 1e6).toFixed(2));
const rb = calc({ fatTipo: 'bruta', fatMeses: '6' }), ded = P.setores.comercio.ded;
ok('Faturamento bruto de 6 meses: tira os impostos e leva a 12 meses', ded > 0 && perto(rb.receita.usada.v, 120e6 * (1 - ded) * 2), (rb.receita.usada.v / 1e6).toFixed(2));
for (const ruim of ['0', '-3', '24', 'abc', '', null, 4.6]) {
  const r = calc({ fatMeses: ruim });
  ok(`Período inválido (${JSON.stringify(ruim)}): vale 12 meses, e 4,6 arredonda para 5`, ruim === 4.6 ? r.receita.informada.meses === 5 : r.receita.informada.meses === 12 && r.receita.usada.v === 120e6);
}
ok('Valor de terceiros ou palpite também é levado a 12 meses, com a incerteza da origem', (() => { const r = calc({ fatMeses: '6', faturamento: { v: 120e6, o: 'palpite' } }); return perto(r.receita.usada.v, 240e6) && r.receita.usada.s > r12.receita.usada.s; })());
ok('A origem do dado não muda com o período', calc({ fatMeses: '6' }).receita.informada.o === 'oficial');

console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exitCode = falhas ? 1 : 0;
