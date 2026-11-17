// Gera uma versão do Método CR (a linha "calibracaoBase: {...}," dentro do index.html) a partir de uma planilha de empresas, usando o próprio motor.
// Uso: node tools/gerar-calibracao.cjs <planilha> [rótulo]      ex.: node tools/gerar-calibracao.cjs base.xls CR1
// A planilha fica fora do repositório. No index.html entra só a versão pública (calibracaoPublica, no motor): os parâmetros que entram na conta
// e quantas empresas há em cada grupo, sem o nome do arquivo, as colunas, os segmentos ou qualquer linha de empresa.
// Depois rode os testes: eles conferem que a versão embutida é a pública.
const fs = require('fs'), path = require('path');
const base = process.argv[2], rotulo = process.argv[3] || 'CR1';
if (!base) { console.error('Uso: node tools/gerar-calibracao.cjs <planilha> [rótulo]'); process.exit(1); }
const arq = path.join(__dirname, '..', 'index.html'), html = fs.readFileSync(arq, 'utf8');
const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/), mod = { exports: {} };
new Function('module', m[1])(mod);
const M = mod.exports;
(async () => {
  const nome = path.basename(base), agora = new Date(), P = JSON.parse(JSON.stringify(M.PAIS.parametros));
  const tab = await M.lerTabela(new Uint8Array(fs.readFileSync(base)), nome);
  const cal = M.calibrarBase(tab, M.mapaAutomatico(tab), P, { ano: agora.getFullYear(), nome, data: agora.toISOString() });
  cal.origem = 'embutida'; cal.rotulo = rotulo; cal.id = rotulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9.]+/g, '-') + '-' + agora.toISOString().slice(0, 10);
  const pub = M.calibracaoPublica(cal, P.calibracao.minGrupo ?? 5);
  // 4 casas decimais bastam e deixam a linha bem menor
  const json = JSON.stringify(pub, (k, v) => typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e4) / 1e4 : v);
  const re = /^      calibracaoBase: \{.*\},$/gm, achados = html.match(re);
  if (!achados || achados.length !== 1) throw new Error('linha da calibração embutida: ' + (achados ? achados.length : 0));
  fs.writeFileSync(arq, html.replace(re, () => '      calibracaoBase: ' + json + ','));
  // as contagens abaixo aparecem só neste terminal, para conferência; não vão para o arquivo
  const R = cal.receita || {}, T = cal.ti || {}, n = o => o ? Object.keys(o).length : 0, r4 = x => x == null ? x : Math.round(x * 1e4) / 1e4;
  console.log('colunas usadas (só no terminal):', JSON.stringify(cal.mapa));
  console.log('gravado:', json.length, 'caracteres | rótulo', rotulo, '| receita n', R.n, 'β', r4(R.beta), 'cidades', n(R.local && R.local.cidades), 'células', n(R.local && R.local.celulas),
    '| TI N', T.N, 'p geral', r4(T.pg), 's', r4(T.s), 'cidades', n(T.local && T.local.cidades), 'células', n(T.local && T.local.celulas), '| acerto CR', T.acertoPct, 'Vezen', T.acertoVezen, '| avisos', (cal.avisos || []).length);
  if ((cal.avisos || []).length) console.log('avisos (só no terminal):', cal.avisos.join(' | '));
})().catch(e => { console.error(e); process.exit(1); });
