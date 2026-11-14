# Instruções para agentes de IA

Vale para qualquer agente (Claude Code, Codex, Cursor e outros) que for ler ou mudar este repositório. Leia este arquivo inteiro antes de mexer em qualquer coisa.

## O que é

O Vezen estima o investimento em TI de empresas brasileiras e, se pedido, a receita líquida. É um único arquivo, `index.html`, que funciona sem instalar nada e guarda os dados no navegador de quem usa.

Faz parte da família do Canis:
- **Sirius:** o CRM atual.
- **Canis:** o sistema novo.
- **Laika:** a ferramenta que limpa planilhas.

O Vezen deve virar um módulo do Canis no futuro. Não crie dependência do Canis sem pedido.

Está publicado no GitHub Pages: https://saulossorio.github.io/vezen/. O site é o `index.html` da raiz da branch `main`, e o arquivo `.nojekyll` faz o GitHub servir os arquivos como estão. **Cada push na `main` atualiza o site em poucos minutos.**

## Antes de mudar

1. Leia o `README.md` e este arquivo.
2. Se a tarefa toca o método (fórmulas, parâmetros, calibração), leia a aba **Metodologia** da própria ferramenta. Ela é a explicação oficial do cálculo e precisa continuar batendo com o código.
3. Rode os testes antes de mudar, para saber o estado de partida.

## Como o `index.html` está organizado

| Bloco | O que tem |
|---|---|
| `<script id="tema">` | Aplica o tema claro ou escuro antes de a página aparecer |
| `<style id="fontes">` | A fonte Public Sans embutida, a mesma do Laika, para funcionar sem internet |
| `<style id="estilo">` | Todo o CSS. Começa pelos tokens de cor e tamanho no `:root` (identidade do Canis e do Laika), com o tema escuro em `:root[data-tema="escuro"]`. Depois vêm base, casca, controles e cada tela |
| Símbolos SVG e casca | Ícones (`<symbol id="i-...">`), barra lateral, topo do celular, `<main id="app">`, diálogo e aviso rápido |
| `<script id="parquet">` | Leitor de arquivos Parquet |
| `<script id="motor">` | O cálculo, sem tela. Contém `CONFIG` e `PAIS` (parâmetros, fontes e endereços da BrasilAPI) e a calibração embutida `calibracaoBase`, numa linha só e na versão pública (`calibracaoPublica`). Também traz `MUNICIPIOS` (lista do IBGE), as funções de cálculo e de calibração e `rodarTestes`. No fim, `module.exports` expõe tudo isso para os testes no Node |
| `<script id="ui-base">` | Utilidades, estado salvo (`S`) e da tela (`UI`), tipos de estimativa, navegação pelo endereço (`TELAS`, `navegar`, `render`), barra lateral, ações (`ACOES`), diálogos, menus e dicas |
| `<script id="ui-excel">` | Gera arquivos Excel (.xlsx) sem biblioteca: `baixarExcel(nome, abas)`, em que cada aba é `{ nome, colunas: [{ t, tipo, l }], linhas }`. Número entra como número de verdade, com formato de reais, inteiro, ano ou percentual |
| `<script id="ui-graficos">` | Gráficos em SVG próprio: a régua da faixa provável, os caminhos, a faixa, a projeção, a curva e a comparação |
| `<script id="ui-analise">` | Análise de uma empresa: o que estimar, formulário em seções, origem e ajuda de cada campo, cartão do resultado, CNPJ e câmbio |
| `<script id="ui-resultado">` | Aba Resultado, resumo para copiar e prompt da IA |
| `<script id="ui-empresas">` | Lista de empresas, comparação e exportação: Excel (formato principal), CSV e backup em JSON |
| `<script id="ui-listas">` | Listas: uma planilha inteira estimada de uma vez |
| `<script id="ui-calibracao">` | Calibração padrão, minha calibração e leitura de planilhas (o mapa de colunas é usado também pelas listas) |
| `<script id="ui-parametros">` | Editor de parâmetros |
| `<script id="ui-metodologia">` | Metodologia e testes de aceitação |
| `<script id="ui-glossario">` | Glossário (`GLOSSARIO`, a fonte única das definições), tela do glossário e as siglas do texto que viram link (`linkarTermos`) |
| `<script id="ui-inicio">` | Eventos gerais e início |

São scripts clássicos: uma constante declarada num bloco vale nos outros. Por isso dois blocos não podem declarar o mesmo nome.

Para achar algo, busque pelo nome: `calcular`, `receitaEmpresa`, `calibrarBase`, `ajustesLocais`, `fatorLocal`, `atualizarPainel`, `telaLista` e assim por diante. Não leia o arquivo inteiro de uma vez: ele tem uns 700 KB, e as linhas de `calibracaoBase`, `MUNICIPIOS` e da fonte são enormes.

## Como a interface funciona

- **Telas e endereço.** Cada tela registra um objeto em `TELAS` (`titulo`, `render` e, se precisar, `depois`, `entrar`, `sair`, `input`, `change`, `click`, `keydown`). O endereço decide a tela: `#/empresas`, `#/empresas/comparar`, `#/analise/<id>` e `#/analise/<id>/resultado`, `#/listas`, `#/listas/nova`, `#/listas/<id>`, `#/calibracao`, `#/parametros`, `#/metodologia`, `#/glossario`, `#/glossario/<termo>`, `#/testes`. O voltar do navegador funciona, e `sair` pode pedir confirmação.
- **Ações.** Botões usam `data-acao="nome"`, e a função fica registrada com `acoes({ nome: ... })` no bloco da tela. Não crie um `addEventListener` por botão.
- **Redesenhar.** `render()` redesenha a tela; `renderAqui()` mantém a rolagem. Na análise, digitar só atualiza o cartão (`atualizarPainel`), para não perder o foco do campo.
- **Análise.** A primeira escolha é o que estimar (`dados.fatEstimar`: `true` para receita líquida e investimento em TI, `false` só para TI, `null` enquanto ninguém escolheu; salvar pede a escolha). O cartão mostra a receita só quando `fatEstimar` é `true`. A consulta do CNPJ só acontece pela lupa dentro do campo ou pelo Enter, nunca sozinha.
- **Empresa modelo.** `EMPRESA_MODELO`, no bloco `ui-analise`, é um caso real com dados públicos: o Banco do Brasil, com funcionários e gasto de TI dos documentos oficiais do banco e as fontes no aviso da análise. Só entra número de documento oficial, com a fonte citada. Ela precisa estar completa (nenhum campo faltando, com valor ou com motivo verdadeiro), com a confiança em 80 ou mais e sem alerta de divergência (o teste `tela-analise` confere). Abrir de novo leva à análise salva, se houver.
- **Campo sem valor.** Nenhum campo que entra na conta é opcional (`CAMPOS_SEM_DADO`, no bloco `ui-analise`): ou tem valor, ou a pessoa diz por quê (não encontrado, a empresa não divulga, não se aplica), e o motivo fica em `dados.semDado`. O campo vazio sem motivo muda de cor no próprio campo (fundo e borda vermelhos, pelo `:has(.sem-dado[data-estado="pendente"])` do CSS) e traz o botão neutro “Sem dado?”. Não ponha etiqueta nem chip vermelho ao lado: a marca é o campo. O topo da análise conta quantos faltam, e `faltaCampo()` bloqueia salvar e copiar o resumo enquanto faltar algum, sem opção de passar por cima, levando o foco ao primeiro campo que falta. Isso não muda a estimativa. Ficam de fora o que é só registro (vagas, tecnologias, grupo) e o que tem valor padrão (intensidade digital). As cores seguem o sentido: vermelho é falta, âmbar é dado que falta e foi explicado, verde é não se aplica. Para incluir um campo, acrescente-o em `CAMPOS_SEM_DADO` e ponha `botaoSemDado` ao lado do botão de origem. A chave antiga `nao-achei` vira `nao-encontrado` em `migrar()`.
- **Tecnologias.** Busca em camadas (`blocoTecnologias`), em “Mais sobre a empresa”: a lista abre nas categorias, cada categoria mostra as tecnologias dela, e digitar busca em todas de uma vez, com a categoria ao lado do resultado. Nada de subtítulos dentro da lista de busca. Funciona pelo teclado (setas, Enter entra ou marca, Esc sobe uma camada). A busca vale também para os exemplos (SAP, Salesforce...), e as escolhidas ficam como marcas que se removem com um clique. São só registro e não entram na conta. Para incluir uma tecnologia, acrescente-a em `TECNOLOGIAS`.
- **Período do valor da receita.** O valor da receita cobre 12 meses (ano fechado) ou parte do ano (9, 6 ou 3 meses, como nos balanços trimestrais e no IF.data): `dados.fatMeses`, `'12'` por padrão, e fora de 1 a 12 vale 12. `receitaEmpresa` multiplica o valor por 12 ÷ meses (sem ajuste de sazonalidade) antes do crescimento até o ano da estimativa, e cada mês que falta soma `receita.sMeses` à incerteza (suposição inicial, editável em Parâmetros). Só o formulário da análise tem o seletor “Período”; as listas e as calibrações usam valores anuais. Os rótulos da receita não falam em “último ano fechado”. O teste `motor-periodo` confere.
- **Exportar.** Excel (.xlsx) é o formato principal para quem só quer ler e compartilhar: a lista de empresas (duas abas, “Empresas” e “Dados e motivos”) e cada lista importada têm botão próprio e item no menu. O CSV fica no menu de opções, e o backup em JSON (`exp-json`) é só o arquivo técnico para restaurar o Vezen. Todo arquivo novo para baixar nasce em Excel, pelo `baixarExcel` do bloco `ui-excel`.
- **Glossário.** `GLOSSARIO` (bloco `ui-glossario`) é a fonte única: termo, nome por extenso, categoria, significado, utilidade e site oficial. A tela do glossário tem busca, categoria e filtro por letra (Todas e A a Z, como um dicionário; as letras sem termo na busca ficam apagadas), e ela e a janelinha das siglas do texto mostram o mesmo significado, porque as duas leem o mesmo campo. `linkarTermos` troca, depois de cada desenho de tela, as siglas e os termos do texto por links (`.gl-link`): só o primeiro de cada termo em cada seção (“TI”, uma vez por tela), e nunca em campos, botões, links, rótulos, títulos de seção, fórmulas, nem no que a pessoa digitou (tabelas de empresas e de listas, nome da empresa). Sigla ou termo técnico novo na interface: acrescente em `GLOSSARIO`. Site oficial só com endereço conferido. O teste `tela-glossario` falha se uma sigla do texto das telas não estiver no glossário nem na lista de permitidas do teste (estados, nomes de produtos, variáveis das fórmulas).
- **Barra lateral.** Começa por “Nova análise” (de qualquer tela; recolhida, vira só o ícone com o nome na dica), seguida de Empresas, Listas, Calibração, Parâmetros, Metodologia e Glossário. No pé ficam o Exportar (Excel e backup) e o tema.
- **Cartão e largura.** A grade da análise fica num contêiner (`.ws-corpo`) e se adapta pela largura dele, não da janela: com espaço, o cartão fica ao lado e acompanha a rolagem; em área estreita, vira uma barra presa embaixo da tela com os valores, e “Detalhes” abre o resto. A barra lateral recolhida (`data-lateral="recolhida"` no `<html>`, guardada em `vezen.lateral`) dá mais espaço ao conteúdo.
- **Nova tela.** Registre em `TELAS`, ponha o link em `renderNav()` e escreva o teste de tela dela.
- **Bancos muito grandes.** O gasto por usuário e por receita cai com o tamanho do banco: `P.escala.bancos` (`de`, em usuários, e `beta`) multiplica por `(usuários ÷ de)^−beta` só os caminhos pela receita e por usuários, só em bancos acima de `de`. Foi calibrado com dois bancos grandes, pelos documentos oficiais deles (Banco do Brasil, 2025, e Santander Brasil, 2024), e bancos médios, outros setores e `beta` = 0 seguem como antes. O teste `motor-bancos` confere isso. A explicação e as fontes estão na Metodologia.

## Regras que não podem quebrar

- **Um arquivo só.** Nada de CDN, pacote ou arquivo externo no `index.html`. A internet só é usada para a BrasilAPI (CNPJ e câmbio), quando quem usa pede.
- **O site depende do `index.html` na raiz.** Não mova nem renomeie esse arquivo, e não apague o `.nojekyll`.
- **O motor não mexe na tela.** Nada de `document` ou `window` dentro de `<script id="motor">`, porque os testes rodam o motor no Node.
- **Dados salvos.** A chave do navegador é `estimador-ti.v1`. Ela não muda: vem do nome antigo, e trocá-la apagaria o que cada pessoa já salvou. Se mudar o formato do estado, adapte `migrar()` para que dados e backups antigos continuem abrindo.
- **Privacidade.** Nenhum dado real entra no repositório: nem relatórios do CRM, nem planilhas, nem backups ou listas exportadas. Os testes usam só dados fictícios, em `tests/dados/`. A calibração embutida é a versão pública (`calibracaoPublica`): só os parâmetros que entram na conta, de grupos com pelo menos `calibracao.minGrupo` empresas (hoje, 5). Nada de nome, CNPJ, e-mail ou linha de empresa, e nada que descreva a base: tamanho, nome do arquivo, colunas, segmentos, estado de origem ou quantas empresas há em cada grupo. A tela, o resumo e a Metodologia também não mostram essas informações da calibração padrão embutida; uma base enviada no navegador fica só naquele navegador e pode mostrá-las.
- **Método.** Não invente regra de negócio nem mude fórmula, parâmetro ou calibração por conta própria. Se o pedido for ambíguo, pergunte. Quando o método mudar, atualize a Metodologia junto: a seção da fórmula e “A conta inteira”, na Visão geral (`metVisao`), que resume a conta do começo ao fim e precisa bater com as seções.
- **Sem arquivos avulsos.** Nada de cópias, demos ou páginas de teste soltas. Arquivo novo entra na estrutura (`tests/`, `tools/`).

## Como escrever

- Nomes e comentários do código em português, no estilo do resto do arquivo. Comente pouco, só o porquê.
- Textos da tela em português do Brasil, simples, sem jargão e sem primeira pessoa: “Não encontrado”, não “Não encontrei”. Sigla ou termo técnico que precise aparecer entra no `GLOSSARIO`, e o texto vira link para a definição.
- Números e datas no formato brasileiro: R$ 14,70 mi; 1.234,5; dd/mm/aaaa.
- Não use travessão para unir ou interromper frases. Use vírgula, dois-pontos, parênteses ou frases separadas.
- Não use códigos internos (E1, E2, σ) na interface do dia a dia: eles ficam na Metodologia e em “Números técnicos”.
- A ajuda de cada campo (`AJUDA`) diz o que o campo é e o que informar, em palavras simples. Fórmulas, multiplicadores e valores padrão do cálculo ficam na Metodologia, e a ajuda aponta para a seção certa (`AJUDA_MET`).

## Desenho da interface

- **Identidade.** É a do Canis e do Laika (4Network): fonte Public Sans, verde `#8dc63f` nos botões principais, neutros levemente esverdeados, barra lateral clara.
- **Cores.** Use só os tokens do `:root` (`--tinta`, `--cinza`, `--linha`, `--marca`, `--acento`...), nunca uma cor fixa no HTML gerado. Os dois temas, claro e escuro, precisam funcionar.
- **Gráficos.** As cores dos gráficos foram validadas para daltonismo: verde para médias de mercado, azul para dados reais da empresa, sempre com legenda ou rótulo. Todo gráfico traz “Ver dados em tabela”.
- **Celular.** Toda tela precisa funcionar sem rolagem lateral em 375 px de largura. Tabelas largas ficam dentro de `.tab-wrap`; a lista de empresas vira cartões.
- **Movimento.** Nada de animação disparada pela rolagem. Movimento só como resposta a uma ação e sempre curto (até uns 200 ms): janelinhas e menus entram e saem, diálogos entram e saem, a tela troca com uma entrada leve, e as mudanças de estado (cor do campo, marcas das tecnologias, categorias, o valor do cartão) acontecem aos poucos. Quem pede menos animação (`prefers-reduced-motion`) recebe tudo na hora: o CSS desliga as transições e o JS usa `reduzMov()`. As janelinhas saem do DOM 150 ms depois de fechar (sem o id e inertes, para nunca haver dois `#pop`) e o diálogo, 110 ms depois; o teste `tela-transicoes` confere.
- **Teclado.** Tudo precisa funcionar pelo teclado, com o foco visível. Os menus abrem com Enter, andam com as setas e fecham com Esc.

## Testes

```sh
npm test            # motor: casos de aceitação, ajustes por cidade, bancos grandes e período da receita (só Node.js)
npm run test:tela   # tela: abre o Chrome sem janela (precisa de npm install)
```

- Tudo precisa passar antes de dar uma mudança por terminada. Se algo falhar, diga o que falhou; não esconda nem apague o teste.
- Os casos de aceitação (A a F) são os mesmos da tela "Testes de aceitação" da ferramenta. Só mude um valor esperado com o acordo do dono do produto.
- Ao mudar a tela, acrescente verificações no teste de tela do tema (veja `tests/README.md`).
- `tela-analise` mostra dois erros "Failed to load resource" no fim. São esperados: o teste clica na lupa do CNPJ e aperta Enter com a consulta bloqueada de propósito.

## Trocar a calibração padrão por uma base nova

1. Deixe o relatório do CRM fora do repositório.
2. Rode `node tools/gerar-calibracao.cjs /caminho/relatorio.xls`. O script lê o relatório com o próprio motor e regrava só a linha `calibracaoBase` do `index.html`, já na versão pública. As colunas usadas e as contagens aparecem só no terminal, para conferência.
3. Confira as colunas e os números que ele mostra.
4. Rode os testes. `motor-cidades` falha se a calibração embutida tiver contagens, nome de arquivo, colunas ou segmentos da base, CNPJ ou e-mail, e confere que a versão pública dá as mesmas estimativas que a completa.
5. Atualize nos testes os valores que dependem da base: cidades com valor próprio, fatores e valores esperados.
6. Registre no `CHANGELOG.md` sem citar o tamanho, o nome ou a origem da base.

## Ao terminar uma mudança

1. Rode `npm test` e `npm run test:tela`.
2. Registre a mudança no `CHANGELOG.md`, no formato Keep a Changelog e em português.
3. Faça commit e push só quando o dono do produto pedir, porque um push na `main` publica a mudança no site. A mensagem de commit vai em português e diz o que mudou e por quê.
4. Depois do push, abra https://saulossorio.github.io/vezen/ e confira que a mudança apareceu e que a página abre sem erro.

## Falando com o dono do produto

O dono do produto escreve em espanhol. Responda em espanhol, curto: a conclusão e, se precisar, uma pergunta. Não use siglas, códigos internos nem nomes de função. Antes de decidir algo que muda o resultado das estimativas, pergunte.

## Pendências conhecidas

- **Correção do gasto de TI por caminho de cálculo.** Hoje a correção é só por setor, mas na base do CRM cada caminho se afasta do gasto declarado de um jeito diferente.
- **Tecnologias da empresa.** Falta decidir se elas devem mudar a intensidade digital automática.
- **Bancos grandes.** O ajuste de tamanho (`escala.bancos`) foi calibrado com só dois bancos. Quando houver mais bancos grandes com gasto de TI publicado, confira se `de` e `beta` ainda servem.
- **Integração com o Canis.** A aba de dados financeiros do Canis guarda faturamento e investimento em TI com fonte e confiança, e é ali que as estimativas do Vezen devem entrar.
