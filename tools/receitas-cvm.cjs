// Gera dados/receitas-cvm.json: a receita da DRE de cada companhia aberta, por CNPJ, dos dados abertos da CVM (DFP, anual).
// O site da CVM não deixa o navegador baixar esses arquivos, e cada ano tem uns 13 MB; por isso uma tarefa do GitHub
// (.github/workflows/receitas-cvm.yml) roda este script toda semana e publica o arquivo pequeno junto do Vezen.
// Uso: node tools/receitas-cvm.cjs [anos]      ex.: node tools/receitas-cvm.cjs 3   (padrão: os 3 últimos anos fechados)
// Precisa do comando unzip.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const BASE = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/';
const nAnos = +process.argv[2] || 3, hoje = new Date(), ultimo = hoje.getFullYear() - 1;
const saida = path.join(__dirname, '..', 'dados', 'receitas-cvm.json');

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// CSV da CVM: separado por ponto e vírgula, em latin1, sem aspas
function linhas(buf) {
  const t = buf.toString('latin1').split(/\r?\n/).filter(Boolean), cab = t[0].split(';');
  return t.slice(1).map(l => { const c = l.split(';'), o = {}; cab.forEach((k, i) => { o[k] = c[i]; }); return o; });
}
function lerDoZip(zip, nome) {
  try { return execFileSync('unzip', ['-p', zip, nome], { maxBuffer: 1 << 30 }); } catch (e) { return null; }
}
const escala = e => e === 'MIL' ? 1e3 : 1;
const meses = (a, b) => (new Date(b) - new Date(a)) / 864e5 / 30.4;

// Receita de uma DRE (contas da CVM: código -> { ds, v }).
// Empresas em geral: 3.01, receita de venda de bens e serviços (já líquida).
// Bancos (3.01 é a receita de intermediação, só os juros): resultado da intermediação depois da perda esperada com crédito,
// mais as receitas de prestação de serviços e tarifas. É a linha que a ferramenta usa para bancos.
function receitaDaDRE(c) {
  const r = c['3.01']; if (!r) return null;
  if (!/intermedia/.test(norm(r.ds))) return { v: r.v, banco: false };
  const bruto = c['3.03']; if (!bruto) return null;
  let v = bruto.v;
  for (const [k, x] of Object.entries(c)) {
    if (!/^3\.04\.\d+$/.test(k)) continue;
    const d = norm(x.ds);
    if (/provis|perda esperada/.test(d) && /credito/.test(d)) v += x.v;
    else if (/prestacao de servic|tarifa/.test(d)) v += x.v;
  }
  return { v, banco: true };
}

async function baixar(url, dest) {
  const r = await fetch(url);
  if (!r.ok) return false;
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return true;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvm-')), empresas = {};
  try {
    for (let ano = ultimo; ano > ultimo - nAnos; ano--) {
      const zip = path.join(tmp, `dfp_${ano}.zip`);
      if (!(await baixar(`${BASE}dfp_cia_aberta_${ano}.zip`, zip))) { console.log(ano, ': sem arquivo na CVM'); continue; }
      // índice: a versão mais nova de cada documento e o link para ele
      const docs = {};
      for (const l of linhas(lerDoZip(zip, `dfp_cia_aberta_${ano}.csv`) || Buffer.from(''))) {
        const k = (l.CNPJ_CIA || '').replace(/\D/g, ''), v = +l.VERSAO;
        if (k.length === 14 && (!docs[k] || v > docs[k].versao)) docs[k] = { versao: v, link: l.LINK_DOC || '', nome: l.DENOM_CIA || '' };
      }
      // DRE consolidada; a individual só para quem não publica a consolidada
      const dres = {};
      for (const tipo of ['con', 'ind']) {
        const buf = lerDoZip(zip, `dfp_cia_aberta_DRE_${tipo}_${ano}.csv`); if (!buf) continue;
        const porCia = {};
        for (const l of linhas(buf)) {
          const k = (l.CNPJ_CIA || '').replace(/\D/g, '');
          if (!docs[k] || +l.VERSAO !== docs[k].versao || norm(l.ORDEM_EXERC) !== 'ultimo') continue;
          if (meses(l.DT_INI_EXERC, l.DT_FIM_EXERC) < 11.5) continue;
          const c = porCia[k] = porCia[k] || { fim: l.DT_FIM_EXERC, contas: {} };
          c.contas[l.CD_CONTA] = { ds: l.DS_CONTA, v: +l.VL_CONTA * escala(l.ESCALA_MOEDA) };
        }
        for (const [k, c] of Object.entries(porCia)) if (!dres[k]) { const r = receitaDaDRE(c.contas); if (r && r.v > 0) dres[k] = { ...r, fim: c.fim }; }
      }
      let n = 0;
      for (const [k, r] of Object.entries(dres)) {
        const e = empresas[k] = empresas[k] || { n: docs[k].nome.trim(), r: {} };
        const a = +String(r.fim).slice(0, 4);
        if (e.r[a]) continue;
        e.r[a] = [Math.round(r.v), docs[k].link];
        if (r.banco) e.b = 1;
        n++;
      }
      console.log(ano, ':', n, 'companhias com receita');
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  if (!Object.keys(empresas).length) { console.error('Nenhuma receita lida: o arquivo não foi alterado.'); process.exit(1); }
  // a data só muda quando os números mudam: assim a tarefa semanal não grava nada à toa
  let antes = null; try { antes = JSON.parse(fs.readFileSync(saida, 'utf8')); } catch (e) { /* primeira vez */ }
  const igual = antes && JSON.stringify(antes.empresas) === JSON.stringify(empresas);
  const json = { fonte: 'CVM, dados abertos: DFP (demonstrações financeiras anuais)', atualizado: igual ? antes.atualizado : hoje.toISOString().slice(0, 10), empresas };
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, JSON.stringify(json) + '\n');
  console.log('gravado:', Object.keys(empresas).length, 'companhias,', (fs.statSync(saida).size / 1024).toFixed(0), 'KB');
})().catch(e => { console.error(e); process.exit(1); });
