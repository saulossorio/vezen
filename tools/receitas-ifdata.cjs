// Gera dados/receitas-ifdata.json: a receita de cada instituição autorizada pelo Banco Central, pela raiz do CNPJ
// (8 dígitos), da Demonstração de Resultado do IF.data. Serve para os bancos, cooperativas e financeiras que não
// publicam DFP na CVM. Roda junto da tarefa semanal das receitas da CVM.
// A líder de um conglomerado prudencial leva a receita do conglomerado (é o que mais se aproxima da DRE consolidada
// da CVM); as outras instituições, a receita individual.
// Formato: inst[raiz do CNPJ] = { n: nome, r: { ano: receita em reais }, c: 1 se é do conglomerado }
// Uso: node tools/receitas-ifdata.cjs [anos]      ex.: node tools/receitas-ifdata.cjs 3   (padrão: os 3 últimos anos fechados)
const fs = require('fs'), path = require('path');
const BASE = 'https://olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata/';
const nAnos = +process.argv[2] || 3, hoje = new Date();
const saida = path.join(__dirname, '..', 'dados', 'receitas-ifdata.json');

// A DRE do IF.data é semestral em junho e dezembro (em março e setembro, só o trimestre): o ano é junho + dezembro.
// Receita = resultado da intermediação financeira (já depois da perda esperada com crédito) + tarifas + serviços,
// a mesma linha que tools/receitas-cvm.cjs usa para os bancos na CVM. Desde 2025 (Resolução CMN 4.966) a DRE mudou
// de nomes e separou os serviços de pagamento; as duas versões estão abaixo, pelo nome da coluna.
const LINHAS = [
  'Resultado de Intermediação Financeira',
  'Rendas de Prestação de Serviços', 'Rendas de Tarifas Bancárias',            // até 2024
  'Outras Rendas de Prestação de Serviços', 'Resultado com Serviços por Transações de Pagamento', // desde 2025
];
const nomeCol = s => String(s || '').split('\n')[0].trim();

async function pedir(recurso, q) {
  const r = await fetch(BASE + recurso + '?' + q + '&$format=json');
  if (!r.ok) throw new Error(recurso + ': http ' + r.status);
  return (await r.json()).value || [];
}
// valores de um semestre: código no IF.data -> receita (null se o período ainda não saiu)
// tipo 3 = instituições individuais (código = raiz do CNPJ); tipo 1 = conglomerados prudenciais (código C0…)
async function semestre(am, tipo) {
  // o nome da coluna termina com a letra da conta depois de uma quebra de linha: o filtro pega pelo começo, e o resto sai aqui
  const filtro = "startswith(NomeColuna,'Rendas') or startswith(NomeColuna,'Outras Rendas') or startswith(NomeColuna,'Resultado')";
  const v = await pedir('IfDataValores(AnoMes=@AnoMes,TipoInstituicao=@TipoInstituicao,Relatorio=@Relatorio)',
    `@AnoMes=${am}&@TipoInstituicao=${tipo}&@Relatorio='4'&$select=CodInst,NomeColuna,Saldo&$filter=` + encodeURIComponent(filtro));
  if (!v.length) return null;
  const vistos = new Set(), soma = {};
  for (const x of v) {
    const n = nomeCol(x.NomeColuna), k = x.CodInst;
    if (!LINHAS.includes(n) || !/^(\d{8}|C\d{7})$/.test(k) || vistos.has(k + n)) continue; // o IF.data às vezes repete a linha
    vistos.add(k + n);
    soma[k] = (soma[k] || 0) + (+x.Saldo || 0);
  }
  return soma;
}

(async () => {
  const inst = {};
  let ano = hoje.getFullYear() - 1, lidos = 0;
  // o último ano fechado pode ainda não ter dezembro publicado: volta um ano até achar nAnos anos completos
  for (let tent = 0; lidos < nAnos && tent < nAnos + 2; tent++, ano--) {
    const [i1, i2, c1, c2] = await Promise.all([semestre(ano + '06', 3), semestre(ano + '12', 3), semestre(ano + '06', 1), semestre(ano + '12', 1)]);
    if (!i1 || !i2) { console.log(ano, ': ano ainda incompleto no IF.data'); continue; }
    const cad = await pedir('IfDataCadastro(AnoMes=@AnoMes)', `@AnoMes=${ano}12&$select=CodInst,NomeInstituicao,CodConglomeradoPrudencial,CnpjInstituicaoLider`);
    const nomes = {}, lider = {};
    for (const c of cad) {
      nomes[c.CodInst] = String(c.NomeInstituicao || '').trim();
      if (c.CodConglomeradoPrudencial && /^\d{8}$/.test(c.CnpjInstituicaoLider || '')) lider[c.CnpjInstituicaoLider] = c.CodConglomeradoPrudencial;
    }
    let n = 0;
    const gravar = (k, v, cong) => {
      if (!(v > 0)) return;
      const e = inst[k] = inst[k] || { n: nomes[k] || '', r: {} };
      e.r[ano] = Math.round(v); if (cong) e.c = 1; n++;
    };
    // só quem tem os dois semestres
    for (const [k, cg] of Object.entries(lider)) if (c1 && c2 && cg in c1 && cg in c2) gravar(k, c1[cg] + c2[cg], true);
    for (const k of Object.keys(i2)) if (k in i1 && !(inst[k] && inst[k].r[ano])) gravar(k, i1[k] + i2[k], false);
    lidos++;
    console.log(ano, ':', n, 'instituições com receita');
  }
  if (!Object.keys(inst).length) { console.error('Nenhuma receita lida: o arquivo não foi alterado.'); process.exit(1); }
  // a data só muda quando os números mudam: assim a tarefa semanal não grava nada à toa
  let antes = null; try { antes = JSON.parse(fs.readFileSync(saida, 'utf8')); } catch (e) { /* primeira vez */ }
  const igual = antes && JSON.stringify(antes.inst) === JSON.stringify(inst);
  const json = { fonte: 'Banco Central, IF.data: Demonstração de Resultado (conglomerado prudencial para a líder; individual para as outras)', atualizado: igual ? antes.atualizado : hoje.toISOString().slice(0, 10), inst };
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, JSON.stringify(json) + '\n');
  console.log('gravado:', Object.keys(inst).length, 'instituições,', (fs.statSync(saida).size / 1024).toFixed(0), 'KB');
})().catch(e => { console.error(e); process.exit(1); });
