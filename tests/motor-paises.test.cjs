// Outros países: o México usa as mesmas fórmulas com os seus parâmetros (CONFIG.paises.MX), em pesos, sem impostos sobre vendas na receita,
// e o país só vale durante a conta (comPais). Confere também que o Brasil continua igual.
const fs = require('fs'), path = require('path'), arq = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports, BR = M.CONFIG.paises.BR, MX = M.CONFIG.paises.MX;
let falhas = 0;
const ok = (rot, c, info = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (info !== '' ? '  [' + info + ']' : '')); if (!c) falhas++; };
const calcMX = d => M.comPais('MX', () => M.calcular(Object.assign({ pais: 'MX', fatEstimar: true, digital: '', receitasAnos: [], gastosReais: [] }, d), MX.parametros, { ano: 2025 }));

ok('México existe, em pesos', !!MX && MX.moeda === 'MXN' && MX.simbolo === 'MX$');
ok('Análise sem país é do Brasil', M.paisDe({}) === 'BR' && M.paisDe({ pais: 'XX' }) === 'BR' && M.paisDe({ pais: 'MX' }) === 'MX');
const rel = MX.parametros.nivel.kPais / MX.parametros.nivel.kBrasil;
ok('% da receita do México = Brasil × 0,50 ÷ 0,69 em todos os setores', Object.entries(MX.parametros.setores).every(([k, x]) => x.p == null || Math.abs(x.p - BR.parametros.setores[k].p * rel) < 0.0006), rel.toFixed(3));
ok('CAPU do México = p × receita por funcionário ÷ usuários', Object.values(MX.parametros.setores).every(x => x.capu == null || Math.abs(x.capu - x.p * x.rpe / x.u) <= 250));
ok('Receita mexicana sem impostos sobre vendas', Object.values(MX.parametros.setores).every(x => x.ded === 0));
ok('Incerteza do nível maior que no Brasil', Object.entries(MX.parametros.setores).every(([k, x]) => x.sE1 == null || x.sE1 > BR.parametros.setores[k].sE1));
ok('Brasil intacto: bancos 6,5%, custo da equipe 1,8', BR.parametros.setores.bancos.p === 0.065 && BR.parametros.equipe.fatorCLT === 1.8);

// BBVA México 2025: receita total MX$ 294.654 mi, 44.718 funcionários (relatório do 4T25). Só confere a ordem de grandeza
const bbva = calcMX({ nome: 'Banco MX', natureza: 'listada', setor: 'banco', uf: 'CDMX', fatAno: '2025', fatMeses: '12', faturamento: { v: 294654e6, o: 'oficial' }, funcionarios: { v: 44718, o: 'oficial' } });
const pct = bbva.F / 294654e6;
ok('Banco mexicano: gasto de TI entre 3% e 7% da receita', pct > 0.03 && pct < 0.07, (pct * 100).toFixed(1) + '%');
ok('Valores do México em MX$', M.comPais('MX', () => M.fmtRS(bbva.F)).startsWith('MX$ ') && M.fmtRS(1e6).startsWith('R$ '));
ok('O país volta ao Brasil depois da conta', M.fmtRS(1).startsWith('R$'));
// receita pelos funcionários: indústria com 1.000 pessoas, 2023 → 2025 a 5% ao ano
const ind = calcMX({ nome: 'Indústria MX', natureza: 'privada', setor: 'industria', uf: 'NL', funcionarios: { v: 1000, o: 'oficial' } });
const esperado = 1000 * 2810000 * 1.133 * Math.pow(1.05, 2);
ok('Receita pelos funcionários com o Censo Económico, levada de 2023 ao ano de referência', ind.receita.usada && Math.abs(ind.receita.usada.v / esperado - 1) < 0.02, M.comPais('MX', () => M.fmtRS(ind.receita.usada.v)));
// órgão público: etapa devengada
ok('Etapas do orçamento com os nomes do México', M.comPais('MX', () => M.CONFIG.paises.MX.etapas[0][1]) === 'Devengada');
// câmbio: FIX de 2024
ok('Câmbio do México: FIX de fim de 2024', M.comPais('MX', () => M.taxaPTAX('USD', 2024)).v === 20.7862);
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exit(falhas ? 1 : 0);
