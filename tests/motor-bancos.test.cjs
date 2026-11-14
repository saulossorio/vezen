// Bancos muito grandes: o gasto por usuário e por receita cai com o tamanho (parâmetro escala.bancos). Confere contra os documentos oficiais de dois bancos
// e confere que bancos médios, outros setores e o parâmetro desligado seguem como antes.
const fs = require('fs'), path = require('path'), arq = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports, P = JSON.parse(JSON.stringify(M.PAIS.parametros));
let falhas = 0;
const ok = (rot, c, info = '') => { console.log((c ? '✓ ' : '✗ ') + rot + (info !== '' ? '  [' + info + ']' : '')); if (!c) falhas++; };
const perto = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const copia = x => JSON.parse(JSON.stringify(x));
const calc = (d, PP = P) => M.calcular(copia(Object.assign({ fatEstimar: false, digital: '' }, d)), PP, { ano: 2026 });
const caminho = (r, cod) => r.ests.find(e => e.cod === cod);
const semEscala = copia(P); semEscala.escala.bancos.beta = 0;

// documentos oficiais: Banco do Brasil (2025) e Santander Brasil (2024, investimentos mais despesas de tecnologia)
const BB = { nome: 'Banco A', natureza: 'publico', tipoPublico: 'estatal', setor: 'banco', uf: 'DF', fatAno: '2025', fatTipo: 'liquida',
  funcionarios: { v: 85206, o: 'oficial' }, unidades: { v: 3955, o: 'oficial' }, faturamento: { v: 73.9e9, o: 'oficial' }, crescFunc: { v: -1.6, o: 'oficial' },
  gastosReais: [{ ano: 2024, v: 6.2e9, o: 'oficial' }, { ano: 2025, v: 6.8e9, o: 'oficial' }] };
const SANT = { nome: 'Banco B', natureza: 'listada', setor: 'banco', uf: 'SP', fatAno: '2024', fatTipo: 'liquida',
  funcionarios: { v: 55600, o: 'oficial' }, faturamento: { v: 73.757e9, o: 'oficial' }, gastosReais: [{ ano: 2024, v: 4.242e9, o: 'oficial' }] };

// 1. parâmetro
const esc = P.escala && P.escala.bancos;
ok('Parâmetro: escala dos bancos com ponto de partida e inclinação', !!esc && esc.de > 0 && esc.beta > 0, JSON.stringify(esc));

// 2. os caminhos de modelo chegam perto do gasto real dos dois bancos; sem o ajuste, passavam de 2 vezes
for (const [nome, d] of [['Banco do Brasil', BB], ['Santander Brasil', SANT]]) {
  const r = calc(d), r0 = calc(d, semEscala), real = caminho(r, 'E0').v;
  const razao = cod => caminho(r, cod).v / real, razao0 = cod => caminho(r0, cod).v / real;
  ok(`${nome}: caminho pela receita dentro de 1,75 vez do gasto real`, razao('E1') > 1 / 1.75 && razao('E1') < 1.75, razao('E1').toFixed(2));
  ok(`${nome}: caminho por usuários dentro de 1,75 vez do gasto real`, razao('E2') > 1 / 1.75 && razao('E2') < 1.75, razao('E2').toFixed(2));
  ok(`${nome}: sem o ajuste, os caminhos de modelo passavam de 2 vezes o real`, razao0('E1') > 2 && razao0('E2') > 2, razao0('E1').toFixed(2) + ' e ' + razao0('E2').toFixed(2));
}

// 3. com o ajuste, o gasto real de um banco grande não gera alerta de divergência e a confiança fica alta
const rBB = calc(BB);
ok('Banco do Brasil: sem alerta de divergência', !rBB.alerta, String(rBB.alerta || ''));
ok('Banco do Brasil: confiança de 80 ou mais', rBB.ic >= 80, rBB.ic);
ok('Banco do Brasil: fator de escala abaixo de 1', rBB.fEsc < 1 && rBB.fEsc > 0.2, rBB.fEsc.toFixed(3));

// 4. bancos médios, outros setores e parâmetro desligado: nada muda
const medio = { nome: 'Banco C', natureza: 'privada', setor: 'banco', uf: 'SP', funcionarios: { v: 2000, o: 'terceiros' }, faturamento: { v: 3e9, o: 'terceiros' } };
const rm = calc(medio), rm0 = calc(medio, semEscala);
ok('Banco médio: fator de escala 1', rm.fEsc === 1, rm.fEsc);
ok('Banco médio: mesmas estimativas com e sem o parâmetro', rm.F === rm0.F && rm.p10 === rm0.p10 && rm.p90 === rm0.p90);
ok('Indústria grande: fator de escala 1', calc({ nome: 'Empresa D', natureza: 'privada', setor: 'industria', uf: 'SP', funcionarios: { v: 85000, o: 'terceiros' } }).fEsc === 1);
ok('Parâmetro desligado (inclinação 0): fator de escala 1 mesmo no banco grande', calc(BB, semEscala).fEsc === 1);

// 5. continuidade no ponto de partida: abaixo e em de, nada muda; acima, cai aos poucos
const comUsuarios = n => calc({ nome: 'Banco E', natureza: 'privada', setor: 'banco', uf: 'SP', usuarios: { v: n, o: 'terceiros' }, funcionarios: { v: n, o: 'terceiros' }, faturamento: { v: n * 1.2e6, o: 'terceiros' } });
const de = esc.de, beta = esc.beta;
ok('No ponto de partida o fator é 1', comUsuarios(de).fEsc === 1, comUsuarios(de).fEsc);
ok('Logo acima do ponto de partida, quase 1', comUsuarios(de + 1).fEsc < 1 && comUsuarios(de + 1).fEsc > 0.999, comUsuarios(de + 1).fEsc.toFixed(5));
ok('Acima do ponto de partida, cai pela inclinação: (usuários ÷ de) elevado a −β', perto(comUsuarios(de * 2).fEsc, Math.pow(2, -beta), 1e-9) && perto(comUsuarios(de * 4).fEsc, Math.pow(4, -beta), 1e-9), comUsuarios(de * 2).fEsc.toFixed(4));
ok('Quanto maior o banco, menor o fator', comUsuarios(de * 4).fEsc < comUsuarios(de * 2).fEsc && comUsuarios(de * 2).fEsc < comUsuarios(de + 1).fEsc);

console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exitCode = falhas ? 1 : 0;
