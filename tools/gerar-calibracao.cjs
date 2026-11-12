// Refaz a calibração padrão que vem dentro do index.html (a linha "calibracaoBase: {...},") com uma base nova do CRM, usando o próprio motor.
// Uso: node tools/gerar-calibracao.cjs <relatorio-do-crm.xls>
// A base fica fora do repositório. No index.html entra só a versão pública da calibração (calibracaoPublica, no motor): os parâmetros
// que entram na conta, sem o nome do arquivo, as colunas, os segmentos, o tamanho da base, a origem ou as contagens de cada grupo.
// Depois rode os testes: eles conferem que a versão embutida é a pública.
const fs = require('fs'), path = require('path');
const base = process.argv[2];
if (!base) { console.error('Uso: node tools/gerar-calibracao.cjs <relatorio-do-crm.xls>'); process.exit(1); }
const arq = path.join(__dirname, '..', 'index.html'), html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports;
(async () => {
  const nome = path.basename(base), agora = new Date(), P = JSON.parse(JSON.stringify(M.PAIS.parametros));
  const tab = await M.lerTabela(new Uint8Array(fs.readFileSync(base)), nome);
  const cal = M.calibrarBase(tab, M.mapaAutomatico(tab), P, { ano: agora.getFullYear(), nome, data: agora.toISOString() });
  cal.origem = 'embutida';
  const pub = M.calibracaoPublica(cal, P.calibracao.minGrupo ?? 5);
  // 4 casas decimais bastam e deixam a linha bem menor
  const json = JSON.stringify(pub, (k, v) => typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e4) / 1e4 : v);
  const re = /^      calibracaoBase: \{.*\},$/gm, achados = html.match(re);
  if (!achados || achados.length !== 1) throw new Error('linha da calibração embutida: ' + (achados ? achados.length : 0));
  fs.writeFileSync(arq, html.replace(re, () => '      calibracaoBase: ' + json + ','));
  // as contagens abaixo aparecem só neste terminal, para conferência; não vão para o arquivo
  const R = cal.receita || {}, T = cal.ti || {}, n = o => o ? Object.keys(o).length : 0, r4 = x => x == null ? x : Math.round(x * 1e4) / 1e4;
  console.log('colunas usadas (só no terminal):', JSON.stringify(cal.mapa));
  console.log('gravado:', json.length, 'caracteres | receita n', R.n, 'β', r4(R.beta), 'cidades', n(R.local && R.local.cidades), 'células', n(R.local && R.local.celulas),
    '| TI N', T.N, 'kg', r4(T.kg), 'λ', r4(T.lambda), 'cidades', n(T.local && T.local.cidades), 'células', n(T.local && T.local.celulas), '| avisos', (cal.avisos || []).length);
  if ((cal.avisos || []).length) console.log('avisos (só no terminal):', cal.avisos.join(' | '));
})().catch(e => { console.error(e); process.exit(1); });
