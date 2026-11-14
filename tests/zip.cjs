// Leitor mínimo de .zip (e portanto de .xlsx) só com o Node.js: devolve { nome: Buffer } com o conteúdo de cada arquivo.
const zlib = require('zlib');
function lerZip(buf) {
  const fim = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fim < 0) throw new Error('não é um zip');
  const n = buf.readUInt16LE(fim + 10), out = {};
  let p = buf.readUInt32LE(fim + 16);
  for (let i = 0; i < n; i++) {
    const met = buf.readUInt16LE(p + 10), comp = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const nome = buf.toString('utf8', p + 46, p + 46 + nl);
    const ini = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), dados = buf.subarray(ini, ini + comp);
    out[nome] = met === 8 ? zlib.inflateRawSync(dados) : Buffer.from(dados);
    p += 46 + nl + el + cl;
  }
  return out;
}
// uma aba do .xlsx como lista de linhas: texto (inlineStr) e número, na ordem das colunas
function abaXlsx(arquivos, k = 1) {
  const xml = arquivos[`xl/worksheets/sheet${k}.xml`].toString('utf8');
  const des = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return [...xml.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)].map(r => [...r[1].matchAll(/<c r="([A-Z]+)\d+"(?: s="(\d+)")?(?: t="inlineStr")?>(?:<is><t[^>]*>([\s\S]*?)<\/t><\/is>|<v>([^<]*)<\/v>)<\/c>/g)].map(c => c[3] !== undefined ? des(c[3]) : Number(c[4])));
}
const nomesAbas = arquivos => [...arquivos['xl/workbook.xml'].toString('utf8').matchAll(/<sheet name="([^"]*)"/g)].map(m => m[1]);
module.exports = { lerZip, abaXlsx, nomesAbas };
