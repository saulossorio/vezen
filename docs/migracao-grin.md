# Migração para o Grin

O Vezen usa o Grin 2.23, copiado da release https://github.com/saulossorio/grin/releases/tag/v2.23. Este documento registra o que havia antes, a classe do Grin que substitui cada parte, o que continua próprio do Vezen e as decisões tomadas na migração.

## Como o Grin entra no arquivo

O Vezen é um único `index.html` que funciona sem internet. Por isso o Grin entra inteiro no `<head>`.

| Bloco | Origem |
|---|---|
| `<style id="grin">` | `dist/grin.inline.css` da v2.23, com Geist e Geist Mono embutidas |
| `<script id="grin-js" defer>` | `dist/grin.js` da v2.23 |
| Comentário antes dos dois blocos | Versão, link da release e o texto da licença SIL Open Font License 1.1 das fontes |

Para atualizar, leia o CHANGELOG do Grin entre as versões, substitua os dois blocos e o número da versão no comentário e confira as telas.

O `grin.js` fica antes do script de tema do Vezen. Os comportamentos que o Grin liga sozinho no carregamento (glossário, sumário, dropzone, barra lateral) não encontram as telas do Vezen, que são desenhadas depois pelo JavaScript. Os que escutam o `document` (tooltip, popover, abas, tema) só agem em atributos que o Vezen não usa (`data-tooltip`, `data-popover`, `role="tab"`, `data-theme-toggle`).

## Tokens

### Cores

| Token antigo do Vezen | Token do Grin |
|---|---|
| `--fundo` | `--background` |
| `--lateral` | `--sidebar` |
| `--superficie` | `--surface` |
| `--suave` | `--muted` |
| `--tinta` | `--foreground` |
| `--cinza` | `--muted-foreground` |
| `--cinza2` | `--border-strong` (traços) e `--input` (pontos neutros) |
| `--linha`, `--linha-suave`, `--linha-forte` | `--border`, `--border-soft`, `--border-strong` |
| `--hover` | `--hover` |
| `--sel` | `--row-selected` |
| `--marca`, `--marca-texto` | `--primary`, `--primary-foreground` |
| `--marca-f`, `--marca-b`, `--marca-ativa` | `--brand-bg`, `--brand-border`, `--sidebar-active` |
| `--link` | `--link` |
| `--foco` | `--ring` |
| `--crit`, `--crit-f`, `--crit-b`, `--crit-forte` | `--crit-fg`, `--crit-bg`, `--crit-border`, `--crit-solid` |
| `--aviso`, `--aviso-f`, `--aviso-b` | `--warn-fg`, `--warn-bg`, `--warn-border` (pontos: `--warn-solid`) |
| `--info`, `--info-f`, `--info-b` | `--info-fg`, `--info-bg`, `--info-border` |
| `--ok`, `--ok-f`, `--ok-b` | `--ok-fg`, `--ok-bg`, `--ok-border` (pontos e barras: `--ok-solid`) |
| `--alta-f`, `--media-f`, `--baixa-f` | `--ok-bg`, `--warn-bg`, `--crit-bg` |
| `--acento`, `--mod` | `--chart-1` (médias de mercado, verde) |
| `--real` | `--chart-2` (dados reais da empresa, azul) |
| `--acento-faixa` | `--chart-band` |
| `--grade` | `--chart-grid` |
| `--veu` | `--overlay` |
| `--sombra-p`, `--sombra-g` | `--shadow-sm`, `--shadow-lg` |

Cores escritas direto que saíram: `#fff` do botão de perigo, os verdes de hover do botão principal, o âmbar da medida de confiança, a sombra do cartão preso embaixo e o véu escuro do tour. Nenhuma cor literal ficou no `<style id="estilo">` nem no HTML gerado.

### Medidas e tipo

| Antes | Grin |
|---|---|
| Public Sans embutida | Geist e Geist Mono do Grin |
| `--fonte` | `--font-sans` |
| Fórmulas em Cambria Math (fonte do sistema) | `--font-mono`, com as letras em `--font-sans` itálico, como o `.formula` |
| `--texto` (16 px) | `--text-base` |
| Tamanhos em rem soltos | `--text-xs` a `--text-4xl` |
| Pesos 500, 550, 600, 650, 700 | `--weight-medium`, `--weight-semibold`, `--weight-bold` |
| `--raio-p`, `--raio`, `--raio-g` | `--radius-sm`, `--radius-lg`, `--radius-xl` |
| `999px`, `50%` | `--radius-pill` |
| `--dur` (160 ms) e durações soltas | `--dur-fast`, `--dur`, `--dur-slow` |
| `--ease` próprio | `--ease`, `--ease-in-out` do Grin |
| `--alt` (40 px) | `--control-h`, fixado em 40 px (ver Decisões) |

## Componentes

| Parte do Vezen | Classes antigas | Grin |
|---|---|---|
| Casca | `.app` | `.casca` própria (ver Decisões) |
| Barra lateral | `.lateral`, `.lat-marca`, `.lat-item`, `.lat-sub`, `.lat-n`, `.lat-sep`, `.lat-pe`, `.lat-ver`, `.ponto` | `.sidebar`, `.app-logo`, `.nav-item`, `.nav-sub`, `.nav-count`, `.nav-divider`, `.sidebar-footer`, `.nav-item.small`, `.tag`, `.dot.warn` |
| Nova análise | `.lat-nova` | `.btn.primary` |
| Topo do celular | `.topo-movel` | `.topbar` |
| Aviso de armazenamento | `.aviso-armaz` | `.banner.warn` |
| Botões | `.btn.prim`, `.btn.fant`, `.btn.perigo-forte`, `.btn.peq`, `.btn.ico-so` | `.btn.primary`, `.btn.ghost`, `.btn.danger`, `.btn.xs`, `.btn.icon` |
| Link de ação | `.link-btn`, `.link-btn.perigo` | `.link`, `.link.danger` |
| Campos | `input`, `select`, `textarea` sem classe | `.input`, `.select`, `.textarea` |
| Campo com rótulo | `.campo` | `.field` |
| Valor com prefixo, sufixo ou lupa | `.entrada`, `.pre`, `.suf`, `.acao-dentro` | `.input-group`, `.input-addon`, `.btn.ghost.icon.xs` |
| Ajuda do campo | `.ajuda` | `.help-button` |
| Texto de ajuda | `.dica` | aparência do `.field-hint` |
| Checkbox | `.chk-linha` | `.checkbox` |
| Opções lado a lado | `.seg`, `.seg-op` | `.segmented` |
| Tabelas | `table`, `.tab-wrap`, `.tab-rola`, `td.n` | `.table`, `.table.compact`, `.table-wrap`, `.table-wrap.scroll`, `.numeric` |
| Menus | `.menu-pop`, `.mi`, `hr` | `.menu`, `.menu-item`, `.menu-item.danger`, `.menu-separator` |
| Ajuda e termos | `.pop-ajuda`, `.pop-termo`, `h4` | `.popover.open`, `.popover-title` |
| Dica flutuante | `.tip` | `.tooltip` |
| Diálogo | `#dlg`, `.largo`, `#dlg-corpo`, `#dlg-acoes` | `.dialog`, `.dialog.wide`, `.dialog-body`, `.dialog-footer` |
| Aviso rápido | `.toast` próprio | aparência do `.toast` |
| Selos | `.selo`, `.selo.cnpj`, `.oficial`, `.agregador`, `.aprox`, `.pend` | `.badge`, `.badge.info`, `.ok`, `.brand`, `.warn` |
| Confiança e método | `.conf`, `.chip-modo` | `.badge`, com o tom do nível ou do método |
| Estado | `.estado` | aparência do `.status` e do `.dot` |
| Avisos | `.alerta`, `.alerta.critico`, `.info-caixa`, `.nota` | `.alert.warn`, `.alert.crit`, `.alert`, `.alert.neutral` |
| Cabeçalho da tela | `.cab`, `.sub` | `.page-title-row`, `.page-description` |
| Painéis e seções | `.painel`, `.secao-form` | `.card` |
| Tela vazia | `.vazio` | `.empty-state` |
| Escolha do método | `.comecos`, `.comeco` | `.action-cards`, `.action-card` |
| Indicadores da lista | `.kpis`, `.kpi` | `.stat-grid`, `.stat`, `.stat-label`, `.stat-value` |
| Soltar planilha | `.soltar`, `.sobre` | `.dropzone`, `.over` |
| Etapas da lista | `.etapas-lote` | `.steps.horizontal`, `.step`, `.step-title` |
| Etapas da conta | `.etapas`, `.et-val`, `li.total` | `.breakdown`, `.breakdown-value`, `li.total` |
| Dados e Resultado | `.abas` | `.tabs`, `.tab` |
| Busca | `.busca` | `.search` |
| Glossário | `.gl-letras`, `.gl-grupo`, `.gl-letra`, `.gl-item`, `.gl-cab`, `.gl-nome`, `.gl-link` | `.letter-index`, `.glossary-group`, `.glossary-letter`, `.glossary-item`, `.glossary-head`, `.glossary-aka`, `.term` |
| Tour | `.tour-luz`, `.tour-cartao`, `.tour-topo`, `.tour-passo`, `.tour-barra`, `.tour-pe` | `.tour-spot`, `.tour-card`, `.tour-top`, `.tour-count`, `.progress.sm`, `.tour-actions` |
| Variação do valor | `.delta` | `.delta` |
| Texto secundário e leitor de tela | `.mudo`, `.sr` | `.text-secondary`, `.sr-only` |

Classes antigas que continuam no markup, ao lado das do Grin, porque o JavaScript ou os testes as procuram: `lat-nova`, `lat-item`, `lat-sub`, `lat-ver`, `lateral`, `campo`, `entrada`, `com-acao`, `acao-dentro`, `ajuda`, `seg`, `seg-op`, `mi`, `menu-pop`, `selo`, `conf`, `chip-modo`, `alerta`, `nota`, `info-caixa`, `painel`, `secao-form`, `vazio`, `comeco`, `comecos-met`, `kpi`, `soltar`, `etapas`, `etapas-lote`, `abas`, `cab`, `sub`, `gl-*`, `tour-*`, `link-btn`, `n`, `sr`. Elas não carregam mais aparência própria, salvo o que está em Próprio do Vezen.

## Próprio do Vezen

Estas partes não têm equivalente no Grin. Ficam no `<style id="estilo">`, reescritas com tokens e medidas do Grin.

| Parte | Motivo |
|---|---|
| Régua da faixa provável (`.regua`, `.mini-regua`) | Visualização própria em escala logarítmica, com `--chart-1`, `--chart-2` e `--chart-band` |
| Caminhos de cálculo (`.cam-*`, `.eixo-log`) | Lista com gráfico de pontos em cada linha |
| Barras dos ajustes e das categorias (`.hbar`, `.hb-*`, `.est-b`, `.cat-b`) | Barra com dois trechos e marca de comparação; o `.bar-list` do Grin tem um trecho só |
| Gráficos em SVG (`.graf`, `.leg`) | Desenhados pelo Vezen; usam os tokens de gráfico e o texto do `.chart` |
| Equação em termos (`.eq`, `.termo`, `.op`) | Conta com o valor de cada termo |
| Fórmulas (`.fx`, `.fx-g`) | Aparência do `.formula`, com a grade alinhada pelo sinal de igual |
| Legenda das letras (`.letras`) | Aparência do `.symbols`, com uma linha entre os itens |
| Cartão do resultado (`.cartao-res`, `.cr-*`, `.resumo-lado`) | Aparência do `.aside-panel`; vira barra presa embaixo na área estreita, por consulta de contêiner |
| Escolha do método no cartão (`.modo-op`) | Aparência do `.choice`, com o valor à direita |
| Origem do dado e sem dado (`.origem`, `.sem-dado`, `.sdc-*`) | Botão em forma de selo que abre um menu; o campo que falta fica vermelho no próprio campo |
| Tecnologias (`.tec-*`, `.tag-tec`) | Busca em camadas por categoria; aparência da lista e das marcas do `.combobox` |
| Nota da empresa modelo (`.nota-modelo`) | Forma do `.alert` no tom da marca, que o `.alert` não tem |
| Recorte e mensagens do tour (`.tour-bloq`, `.tour-msg`, `.tour-acao`) | O tour do Vezen é um exercício com tarefas, cliques segurados fora do recorte e mensagens por tentativa |
| Índices laterais (`.indice-lado`, `.doc-ind`) | Aparência do `.toc`; os itens são botões que rolam até a seção |
| Receita por ano e gasto real (`.rec-*`, `.reais`) | Linhas de ano, valor, período e origem em grade própria |

## Decisões

| Decisão | Motivo |
|---|---|
| Classes do Grin acrescentadas ao lado das antigas, sem trocar os nomes que o JavaScript usa | A tarefa só muda a aparência. Trocar nomes que o JavaScript e os testes procuram mudaria código de comportamento. |
| Altura dos controles fixada em 40 px (`--control-h`) | O teste `tela-analise` confere campos, listas e seletores com 40 px. O Grin tem 44 px (confortável) e 36 px (compacto). |
| A casca usa `.casca`, não `.app` | O `sidebar.js` do Grin assume `.app > .sidebar` e liga o próprio recolher, com outra chave no navegador e recolhendo sozinho abaixo de 1100 px. O Vezen mantém `vezen.lateral`, `data-lateral` e o menu do celular, que os testes conferem. |
| Barra recolhida com 64 px | O Grin usa 72 px; o teste do Vezen confere no máximo 64 px. |
| Recolher a barra e abrir o menu do celular com `--dur` (220 ms), não `--dur-slow` | Os testes esperam 250 e 300 ms antes de medir a barra. |
| Janelinhas com a transição do Vezen (`.visivel`) e sem a animação de entrada do `.menu` | O Vezen tira a janelinha do DOM 150 ms depois de fechar e o teste de transições mede a saída. A transição usa `--dur-fast` (140 ms), que cabe nesse tempo. |
| Diálogo entra pela animação do `.dialog` e sai pela classe `saindo` | O JavaScript espera 110 ms pela saída antes de fechar. |
| `@keyframes surgir` continua com esse nome, com os valores do `grin-rise` | O teste de transições lê o nome da animação da troca de tela. |
| Cinco nomes antigos continuam como apelido (`--crit`, `--crit-f`, `--aviso`, `--ok`, `--cinza`) | O teste `tela-analise` lê esses tokens para comparar as cores dos campos. Eles apontam para os tokens do Grin. |
| O tema continua em `vezen.tema` e `data-tema`; o script de tema marca também `data-theme` | A chave do navegador e o atributo são lidos pelo JavaScript e pelos testes. O alto contraste segue o sistema operacional (`prefers-contrast`), como no Grin sem atributo. |
| Ícones continuam no sprite do Vezen (`<symbol id="i-...">`), com traço 2 | Têm o mesmo desenho dos ícones do Grin (estilo Lucide). Trocar pelos do Grin exigiria mudar a função `ico()` e os nomes em todas as telas. |
| As abas Dados e Resultado deixaram de ficar presas no topo | O `.tabs` do Grin tem largura do conteúdo; preso no topo, flutuava sobre o formulário sem uma faixa de fundo. |
| Na lista de empresas, a coluna Setor e lugar quebra a linha | As células do `.table` não quebram linha; a tabela passava da largura de 1200 px. |
| Nas tabelas de leitura (`.table.compact`) o texto quebra a linha | São tabelas com frases (parâmetros, fontes, testes). |
| Rótulo dos indicadores da lista em linha, não em flex | O rótulo tem termos do glossário no meio do texto; em flex, cada termo ia para uma coluna. |
| Na tela de 1200 px, o cartão do resultado fica ao lado do formulário | Com a barra lateral e as margens do Grin, a área de conteúdo passou de 876 para 888 px, acima do limite de 879 px em que o cartão vai para baixo. |
| Versão 4.0.0 | A interface inteira mudou de design system; cálculos, dados salvos e arquivos exportados não mudaram. |

## Propostas para o Grin

Todas as propostas abaixo entraram no Grin 2.20. Os dois ajustes que o Vezen fazia por conta própria (a linha das etapas horizontais e o `Document.prototype.closest`) saíram na versão 4.0.1, porque o Grin passou a resolver os dois casos. Os recursos novos (controles de 40 px, abas como links, saída animada de menus, `.alert.brand`, barra em partes e campo com dado que falta) ainda não são usados pelo Vezen; adotá-los é uma mudança de tela à parte.

| Proposta | Detalhe |
|---|---|
| `tabs.js` e outros módulos com `e.target.closest` | Conferir se `e.target` é um elemento antes de chamar `closest`. |
| Chave `}` sobrando no fim de `sidebar.css` | O `dist/grin.css` da v2.19 termina a seção da barra lateral com uma chave a mais. |
| Linha das etapas horizontais | A linha começa em `left: 44px`, e o título começa em 48 px. |
| Densidade de 40 px | Uma densidade intermediária, ou um token documentado para a altura dos controles. |
| `sidebar.js` opcional | Um atributo para não ligar o recolher automático numa `.app > .sidebar` que já tem o próprio. |
| Abas como links | Estilo de `.tab[aria-current="page"]` para abas que trocam de endereço. |
| Popover e menu com saída animada | Uma classe de saída e um evento ao terminar, para quem tira o elemento do DOM. |
| Alerta no tom da marca | `.alert.brand`, para notas informativas que não são aviso. |
| Barra com dois trechos | Uma variação do `.bar-list` com parte e total. |
| Campo que falta | Um estado documentado para campo obrigatório sem valor, com fundo e borda vermelhos, além do `aria-invalid`. |

## Partes obrigatórias do Grin

Desde a versão 4.1.0 o Vezen tem as partes que o Grin exige em toda ferramenta. O logo leva a versão na `.tag`. O botão de recolher é o `.sidebar-toggle`, redondo na borda, embora o comportamento continue sendo o do Vezen (`vezen.lateral`, `data-lateral`). O botão de tema mostra sol e lua, e o painel Aparência (`data-appearance`) fica logo abaixo dele. A assinatura `.app-footer` aparece só em Empresas, Métodos e Glossário (`TELAS_ASSINATURA`), no fim do conteúdo, e nunca fica fixa. O tema escolhido no painel Aparência passa pelo Grin, e o Vezen acompanha pelo evento `grin:theme`, guardando a escolha em `vezen.tema`.
