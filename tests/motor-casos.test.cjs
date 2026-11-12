// Casos de aceitação do motor (A a F, os mesmos da tela "Testes de aceitação"): cada caso compara o calculado com o esperado.
// Uso: node tests/motor-casos.test.cjs [--tudo]   (--tudo mostra também os itens que passaram)
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const { PAIS, rodarTestes } = mod.exports, tudo = process.argv.includes('--tudo');
let falhas = 0;
for (const t of rodarTestes(JSON.parse(JSON.stringify(PAIS.parametros)))) {
  console.log(`Caso ${t.id}: ${t.ok ? 'OK' : 'FALHOU'}`);
  for (const i of t.itens) {
    if (!i.ok || tudo) console.log(`  ${i.ok ? '✓' : '✗'} ${i.rot}: obtido ${i.obtido} esperado ${i.esperado}`);
    if (!i.ok) falhas++;
  }
}
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
process.exitCode = falhas ? 1 : 0;
