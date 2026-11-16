// Receita de vários anos e ano de referência: a conta usa a linha do ano de referência; sem ela, a mais recente antes dele.
// Com dois anos fechados ou mais, o crescimento que leva a receita ao ano de referência é o da própria empresa. O valor informado é usado como está.
const fs = require('fs'), path = require('path'), arq = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports, P = JSON.parse(JSON.stringify(M.PAIS.parametros)), C = P.crescimento;
let falhas = 0;
const ok = (rot, c, info = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (info !== '' ? '  [' + info + ']' : '')); if (!c) falhas++; };
const perto = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const copia = x => JSON.parse(JSON.stringify(x));
const mi = v => (v / 1e6).toFixed(2) + ' mi';
const base = { nome: 'Empresa A', natureza: 'privada', setor: 'varejo', uf: 'SP', fatEstimar: true, fatTipo: 'liquida', fatAno: '2025', fatMeses: '12', funcionarios: { v: 800, o: 'terceiros' }, faturamento: { v: 120e6, o: 'terceiros' } };
const calc = (extra = {}, ano = 2025) => M.calcular(copia(Object.assign({}, base, extra)), P, { ano });

// 1. o valor do ano de referência entra como foi informado
const r = calc();
ok('Receita do ano de referência: usada como está, sem crescimento', r.receita.usada.v === 120e6 && r.receita.informada.dt === 0 && r.receita.informada.fator === 1, mi(r.receita.usada.v));
ok('Valor de terceiros não é misturado com a estimativa: a estimativa fica para comparação', r.receita.modo === 'informada' && r.receita.comparacao === true && !!r.receita.estimativa);
ok('Palpite também é usado como está; a origem muda só a incerteza', (() => { const x = calc({ faturamento: { v: 120e6, o: 'palpite' } }); return x.receita.usada.v === 120e6 && x.receita.usada.s > r.receita.usada.s; })());
const r26 = calc({}, 2026);
ok('Com o ano de referência seguinte, o mesmo valor é levado um ano para frente', perto(r26.receita.usada.v, 120e6 * (1 + P.receita.g)) && r26.receita.informada.dt === 1, mi(r26.receita.usada.v));

// 2. várias linhas: escolhe a do ano de referência
const anos = { receitasAnos: [{ ano: '2024', v: 100e6, o: 'oficial', meses: '12' }, { ano: '2023', v: 80e6, o: 'oficial', meses: '12' }] };
const rv = calc(anos);
ok('Várias linhas: a do ano de referência é a usada', rv.receita.usada.v === 120e6 && rv.receita.informada.ano === 2025 && rv.receita.informada.i === 0);
ok('Várias linhas: todas ficam no resultado, para mostrar', rv.receita.anos.length === 3 && rv.receita.anos.map(x => x.ano).join() === '2025,2024,2023');
const gEmp = Math.pow(120 / 80, 1 / 2) - 1;
ok('Crescimento da própria receita: do primeiro ao último ano fechado', !!rv.receita.crescimento && perto(rv.receita.crescimento.g, gEmp) && rv.receita.crescimento.de === 2023 && rv.receita.crescimento.ate === 2025, (gEmp * 100).toFixed(1) + '%');

// 3. sem a linha do ano de referência: a mais recente antes dele, com o crescimento da empresa
const rAnt = calc({ faturamento: { v: '', o: '' }, ...anos });
const g2 = Math.pow(100 / 80, 1) - 1;
ok('Sem o ano de referência: usa a linha mais recente antes dele', rAnt.receita.informada.ano === 2024 && rAnt.receita.informada.i === 1);
ok('E a leva ao ano de referência com o crescimento da própria receita', perto(rAnt.receita.usada.v, 100e6 * (1 + g2)) && rAnt.receita.informada.gFonte === 'historico', mi(rAnt.receita.usada.v) + ', ' + (g2 * 100).toFixed(0) + '% ao ano');
const rUm = calc({ faturamento: { v: '', o: '' }, receitasAnos: [{ ano: '2024', v: 100e6, o: 'oficial', meses: '12' }] });
ok('Com um ano só, o crescimento é o de mercado', perto(rUm.receita.usada.v, 100e6 * (1 + P.receita.g)) && rUm.receita.informada.gFonte === 'media' && rUm.receita.crescimento === null);
const rLim = calc({ faturamento: { v: '', o: '' }, receitasAnos: [{ ano: '2024', v: 300e6, o: 'oficial', meses: '12' }, { ano: '2023', v: 100e6, o: 'oficial', meses: '12' }] });
ok('Crescimento da empresa fica nos limites do histórico', perto(rLim.receita.crescimento.g, C.histMax), (rLim.receita.crescimento.g * 100).toFixed(0) + '%');
const rParc = calc({ faturamento: { v: '', o: '' }, receitasAnos: [{ ano: '2024', v: 100e6, o: 'oficial', meses: '12' }, { ano: '2023', v: 30e6, o: 'oficial', meses: '3' }] });
ok('Período parcial não entra no crescimento da empresa', rParc.receita.crescimento === null);

// 4. só valor de depois do ano de referência: trazido para trás pelo crescimento
const rDep = calc({ fatAno: '2026', fatMeses: '6' });
ok('Valor de depois do ano de referência é trazido para trás', perto(rDep.receita.usada.v, 120e6 * 2 / (1 + P.receita.g)) && rDep.receita.informada.dt === -1, mi(rDep.receita.usada.v));
ok('Trazer para trás também soma a incerteza do crescimento', rDep.receita.usada.s > calc({ fatMeses: '6' }).receita.usada.s);
const rMesmo = calc({ receitasAnos: [{ ano: '2025', v: 60e6, o: 'oficial', meses: '6' }] });
ok('Duas linhas do mesmo ano: vale a que cobre mais meses', rMesmo.receita.informada.meses === 12 && rMesmo.receita.usada.v === 120e6);

// 5. linhas sem valor não contam, e a receita de outro ano conta como informada nos métodos por percentual
ok('Linha vazia não conta', calc({ receitasAnos: [{ ano: '2024', v: '', o: '', meses: '12' }] }).receita.anos.length === 1);
ok('Só com outra linha preenchida, a receita é informada', (() => { const x = calc({ faturamento: { v: '', o: '' }, receitasAnos: [{ ano: '2025', v: 90e6, o: 'oficial', meses: '12' }] }); return x.receita.modo === 'informada' && x.receita.usada.v === 90e6; })());
ok('Funções exportadas para a interface', typeof M.receitasInformadas === 'function' && typeof M.receitaDoAno === 'function' && typeof M.crescimentoReceita === 'function');

// 6. o resto da conta segue o ano de referência
const comReal = { gastosReais: [{ ano: 2024, v: 5e6, o: 'oficial' }, { ano: 2025, v: 6e6, o: 'oficial' }] };
const rr = calc(comReal), e0 = rr.ests.find(e => e.cod === 'E0'), e4 = rr.ests.find(e => e.cod === 'E4');
ok('Gasto real do próprio ano de referência vale como o gasto do ano (E4) e vira o resultado', !!e4 && e4.v === 6e6 && rr.E4ativo && rr.F === 6e6, mi(rr.F));
ok('E0 usa o gasto real mais recente de antes do ano de referência', !!e0 && perto(e0.v, 5e6 * (1 + rr.g)), mi(e0 ? e0.v : 0));
ok('Gasto declarado informado tem prioridade sobre o gasto real do mesmo ano', calc({ ...comReal, gastoDeclarado: { v: 7e6, o: 'oficial' } }).F === 7e6);
const rDep2 = calc({ gastosReais: [{ ano: 2026, v: 8e6, o: 'oficial' }] }), e0d = rDep2.ests.find(e => e.cod === 'E0');
ok('Só gasto real de depois do ano de referência: trazido para trás pelo crescimento', !!e0d && perto(e0d.v, 8e6 / (1 + rDep2.g)) && !rDep2.E4ativo, mi(e0d ? e0d.v : 0));
ok('A projeção começa no ano de referência', calc().projecao[0].ano === 2025 && calc({}, 2026).projecao[0].ano === 2026);

console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exitCode = falhas ? 1 : 0;
