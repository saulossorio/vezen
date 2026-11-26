// Nível do Vezen BR: confere o % da receita e o gasto por usuário contra os balanços de dois bancos grandes (os únicos gastos de TI oficiais usados),
// a coerência entre o caminho pela receita e o caminho por usuários em cada setor, e a conferência com o tamanho do mercado brasileiro de TI.
const fs = require('fs'), path = require('path'), arq = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports, P = JSON.parse(JSON.stringify(M.PAIS.parametros));
let falhas = 0;
const ok = (rot, c, info = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (info !== '' ? '  [' + info + ']' : '')); if (!c) falhas++; };
const copia = x => JSON.parse(JSON.stringify(x));
const calc = d => M.calcular(copia(Object.assign({ fatEstimar: false, digital: '' }, d)), P, { ano: 2026 });
const caminho = (r, cod) => r.ests.find(e => e.cod === cod);

// documentos oficiais: Banco do Brasil (2025) e Santander Brasil (2024, investimentos mais despesas de tecnologia)
const BB = { nome: 'Banco A', natureza: 'publico', tipoPublico: 'estatal', setor: 'banco', uf: 'DF', fatAno: '2025', fatTipo: 'liquida',
  funcionarios: { v: 85206, o: 'oficial' }, unidades: { v: 3955, o: 'oficial' }, faturamento: { v: 73.9e9, o: 'oficial' }, crescFunc: { v: -1.6, o: 'oficial' },
  gastosReais: [{ ano: 2024, v: 6.2e9, o: 'oficial' }, { ano: 2025, v: 6.8e9, o: 'oficial' }] };
const SANT = { nome: 'Banco B', natureza: 'listada', setor: 'banco', uf: 'SP', fatAno: '2024', fatTipo: 'liquida',
  funcionarios: { v: 55600, o: 'oficial' }, faturamento: { v: 73.757e9, o: 'oficial' }, gastosReais: [{ ano: 2024, v: 4.242e9, o: 'oficial' }] };

// 1. sem ajuste especial para bancos: o nível do setor basta
ok('Sem ajuste especial de bancos nos parâmetros', !P.escala);
for (const [nome, d] of [['Banco do Brasil', BB], ['Santander Brasil', SANT]]) {
  const r = calc(d), real = caminho(r, 'E0').v, razao = cod => caminho(r, cod).v / real;
  ok(`${nome}: caminho pela receita dentro de 1,5 vez do gasto real`, razao('E1') > 1 / 1.5 && razao('E1') < 1.5, razao('E1').toFixed(2));
  ok(`${nome}: caminho por usuários dentro de 1,5 vez do gasto real`, razao('E2') > 1 / 1.5 && razao('E2') < 1.5, razao('E2').toFixed(2));
  ok(`${nome}: sem alerta de divergência e confiança de 80 ou mais`, !r.alerta && r.ic >= 80, r.ic);
}

// 2. em cada setor, os dois caminhos de mercado dão valores próximos numa empresa típica (receita por funcionário do setor)
for (const [id, linha] of [['banco', 'bancos'], ['seguradora', 'seguros'], ['tecnologia', 'tecnologia'], ['servicos', 'servicos'], ['saude', 'saude'], ['educacao', 'educacao'], ['industria', 'industria'], ['varejo', 'comercio'], ['logistica', 'logistica']]) {
  const L = P.setores[linha], n = 400, r = calc({ natureza: 'privada', setor: id, funcionarios: { v: n, o: 'oficial' }, faturamento: { v: n * L.rpe, o: 'oficial' }, fatAno: '2026' });
  const q = caminho(r, 'E1').v / caminho(r, 'E2').v;
  ok(`${L.nome}: caminho pela receita e por usuários a menos de 1,35 vez um do outro`, q > 1 / 1.35 && q < 1.35, q.toFixed(2));
}

// 3. o nível cabe no mercado: indústria, comércio e serviços somados ficam abaixo do mercado brasileiro de TI
const N = P.nivel, S = P.setores, soma = S.industria.p * N.receitaIndustria + S.comercio.p * N.receitaComercio + S.servicos.p * N.receitaServicos;
ok('Indústria, comércio e serviços somados ficam entre metade e o total do mercado de TI', soma > 0.5 * N.mercadoTI && soma < N.mercadoTI, (soma / 1e9).toFixed(0) + ' de ' + (N.mercadoTI / 1e9).toFixed(0) + ' bi');
ok('Percentuais entre 1% e 10% da receita', Object.values(S).every(s => s.p == null || (s.p >= 0.01 && s.p <= 0.10)));

console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exitCode = falhas ? 1 : 0;
