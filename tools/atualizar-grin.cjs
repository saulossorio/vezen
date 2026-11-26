#!/usr/bin/env node
/* Troca o Grin embutido no index.html por outra versão publicada.
   Uso: node tools/atualizar-grin.cjs 2.52             (baixa dist/ da tag v2.52 no GitHub)
        node tools/atualizar-grin.cjs 2.52 ../grin     (lê dist/ da tag v2.52 de uma cópia local do repositório do Grin)
   Substitui o CSS (dist/grin.inline.css, com as fontes dentro) e o JavaScript (dist/grin.js) inteiros, atualiza o número
   da versão no index.html e nos documentos que o citam e confere que as duas fontes continuam embutidas.
   Depois: suba a versão do Vezen (VERSAO_APP, package.json e CHANGELOG.md), rode os testes e confira a tela. Veja AGENTS.md. */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const HTML = path.join(RAIZ, 'index.html');
const TAG_CSS = '<style id="grin">', TAG_JS = '<script id="grin-js" defer>'; // as tags que abrem os blocos do Grin no index.html
const DOCS = ['AGENTS.md', 'docs/migracao-grin.md'];      // documentos que citam a versão em uso

const [nova, pastaGrin] = process.argv.slice(2);
if (!/^\d+\.\d+$/.test(nova || '')) { console.error('Uso: node tools/atualizar-grin.cjs X.Y [pasta do repositório do Grin]'); process.exit(1); }

async function lerDist(arq) {
  if (pastaGrin) return execFileSync('git', ['-C', pastaGrin, 'show', `v${nova}:dist/${arq}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const r = await fetch(`https://raw.githubusercontent.com/saulossorio/grin/v${nova}/dist/${arq}`);
  if (!r.ok) throw new Error(`Não achei dist/${arq} na tag v${nova} (HTTP ${r.status}). A release existe?`);
  return r.text();
}

// troca o conteúdo do bloco que abre com `abre` e começa com o comentário do Grin
function trocar(s, abre, novo) {
  const i = s.indexOf(abre + '\n/* Grin ');
  if (i < 0) throw new Error(`Não achei o bloco ${abre} do Grin no index.html`);
  const ini = i + abre.length + 1, fecha = '</' + abre.slice(1).split(/[ >]/)[0] + '>', fim = s.indexOf(fecha, ini);
  return s.slice(0, ini) + novo.replace(/\n+$/, '') + '\n' + s.slice(fim);
}

(async () => {
  let s = fs.readFileSync(HTML, 'utf8');
  const atual = (s.match(/Grin (\d+\.\d+), copiado de https:\/\/github\.com\/saulossorio\/grin\/releases\/tag\/v/) || [])[1];
  if (!atual) throw new Error('Não achei a linha "Grin X.Y, copiado de …" no index.html');
  const [css, js] = await Promise.all([lerDist('grin.inline.css'), lerDist('grin.js')]);
  if (!css.startsWith(`/* Grin ${nova} `) || !js.startsWith(`/* Grin ${nova} `)) throw new Error(`Os arquivos baixados não são do Grin ${nova}`);
  s = trocar(s, TAG_CSS, css);
  s = trocar(s, TAG_JS, js);
  // só as citações da versão em uso: comentários antigos como "(Grin 2.41: …)" contam de onde veio uma regra e ficam
  const esc = atual.replace('.', '\\.');
  s = s.replace(new RegExp(`Grin ${esc}(, copiado de https://github\\.com/saulossorio/grin/releases/tag/v)${esc}`, 'g'), `Grin ${nova}$1${nova}`)
       .replace(new RegExp(`>Grin ${esc}</a>`, 'g'), `>Grin ${nova}</a>`);
  const fontes = (s.match(/font\/woff2;base64/g) || []).length;
  if (fontes !== 2) throw new Error(`Esperava as 2 fontes embutidas (Geist e Geist Mono) e achei ${fontes}`);
  fs.writeFileSync(HTML, s);
  for (const d of DOCS) {
    const p = path.join(RAIZ, d), t = fs.readFileSync(p, 'utf8');
    const n = t.replace(new RegExp(`(Grin |release v|tag/v|da v)${esc}\\b`, 'g'), `$1${nova}`);
    if (n !== t) fs.writeFileSync(p, n);
    if (!n.includes(`Grin ${nova}`)) console.warn(`Atenção: ${d} não cita “Grin ${nova}”. Confira a versão citada nele.`);
  }
  console.log(`Grin ${atual} → ${nova} em index.html e ${DOCS.join(', ')}. Agora: versão do Vezen, CHANGELOG, testes e tela.`);
})().catch(e => { console.error(e.message); process.exit(1); });
