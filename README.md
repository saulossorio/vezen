# Vezen

Estima quanto uma empresa brasileira investe em TI e a receita líquida dela, no último ano fechado (ou no ano que você escolher). É um único arquivo HTML: abre no navegador, não precisa instalar nada e **os dados ficam só no seu computador**.

O nome vem de Wezen, uma estrela da constelação do Cão Maior. Em árabe, Wezen quer dizer "o peso", e o Vezen pesa cada empresa em TI. Faz parte da família do Canis:

| Ferramenta | O que faz |
|---|---|
| Sirius | O CRM atual |
| Canis | O sistema novo |
| Laika | Limpa as planilhas antes de entrarem no Canis |
| Vezen | Estima o investimento em TI de cada empresa |

## Como usar

1. Abra **https://saulossorio.github.io/vezen/**. Ou baixe o `index.html` e abra com duplo clique: funciona igual, até sem internet.
2. **Uma empresa:** clique em **Nova análise**, no alto da barra lateral. Na aba **Dados**, preencha o que souber: a análise mostra sempre os dois resultados, a receita líquida (informada ou estimada) e o investimento em TI, cada um com a origem. Para trazer nome, estado, município e porte da Receita Federal, digite o CNPJ e clique na lupa dentro do campo (ou aperte Enter): a consulta só acontece quando você pede. Marque a origem de cada número no botão que aparece embaixo do campo. Na receita, informe também o ano e o período do valor: 12 meses, ou 9, 6 ou 3 quando o dado vem de um balanço trimestral ou semestral, e a ferramenta o leva a 12 meses. Nenhum campo é opcional: ou tem valor, ou você diz por quê. O campo vazio fica em vermelho, e o botão **Sem dado?** embaixo dele abre o motivo: não encontrado, a empresa não divulga ou não se aplica. O que faltar aparece no resumo como não informado.
3. O cartão ao lado mostra a receita líquida e o investimento em TI, com a faixa provável e a confiança. Nele você escolhe o tipo de estimativa, vendo quanto cada um daria, e em **Como aumentar a confiança** estão os dados que mais ajudariam (clique para ir ao campo). Em telas estreitas o cartão fica preso embaixo, só com os valores, e **Detalhes** abre o resto.
4. Na aba **Resultado** está a explicação completa: os caminhos do cálculo, a faixa, a receita, os ajustes e a projeção. Dali, ou do cartão, dá para copiar um resumo pronto.
5. **Uma lista:** em **Listas**, escolha uma planilha (relatório do CRM, Excel, CSV ou Parquet), confira o que cada coluna é e veja todas as empresas estimadas. Filtre, baixe os resultados em Excel (ou CSV), abra qualquer empresa como análise ou salve as escolhidas em Empresas.
6. Em **Exportar**, na barra lateral, baixe as empresas em Excel para ler e compartilhar. Faça também o backup (.json) de vez em quando: se os dados do navegador forem apagados, as análises e as listas se perdem, e é o backup que as traz de volta.

**Busca pelo CNPJ:** nada é preenchido sem o clique na lupa, dentro do campo CNPJ. A lupa fica discreta até o CNPJ estar completo e válido; aí fica verde. A busca preenche nome, estado, município e enquadramento pela Receita Federal, sugere natureza e setor (a pessoa aceita ou ignora) e marca esses campos com o selo via CNPJ. Abaixo do campo aparece o que foi preenchido, ou por que a busca falhou (CNPJ não encontrado, sem conexão, dados incompletos). A busca também traz a receita da DRE das companhias abertas, publicada na CVM, com o link para o documento, e a dos bancos, cooperativas e financeiras que não estão na CVM, do IF.data do Banco Central. Os arquivos com essas receitas são atualizados toda semana por uma tarefa do GitHub (`tools/receitas-cvm.cjs` e `tools/receitas-ifdata.cjs`).

**Tour guiado:** na primeira visita, um passo a passo ensina o caminho básico fazendo: você cria a análise do Banco do Brasil, digita o CNPJ e usa a busca para preencher o que ela traz; só o que a busca não traz, como funcionários, é digitado. Feita cada ação, o tour espera o **Próximo**. Pule quando quiser e reabra em **Tour guiado**, na barra lateral.

**Empresa modelo:** um exemplo pronto (Banco do Brasil, com dados oficiais), no menu de **Empresas**.

**Métodos** explica como cada um dos quatro métodos calcula, com os parâmetros em uso (só leitura no Vezen, no CR e no FGV) e, no fim, os dados do Método Personalizado, a única parte que recebe dados seus. **Glossário** explica as siglas e os termos da ferramenta (FGV, Brasscom, CNPJ, MEI, receita líquida...), com o significado, a utilidade e o site oficial, e filtro por letra, como num dicionário; no texto, o que aparece sublinhado abre a definição. O tema escuro fica no fim da barra lateral, e o botão ao lado do nome recolhe a barra, deixando só os ícones.

## Os quatro métodos

Toda análise chega a dois números do ano de referência (por padrão, o último ano fechado): a receita líquida e o investimento anual em TI, cada um com a origem à vista. A receita aceita um valor por ano, como o gasto real; a conta usa o do ano de referência. O método escolhido na análise decide como a estimativa é feita:

| Método | De onde vêm os números | Quem muda os parâmetros |
|---|---|---|
| Método Vezen | Referências públicas (medianas internacionais por setor, gasto declarado por empresas brasileiras, balanços, FGV, Brasscom, FEBRABAN): até sete caminhos de cálculo, juntados pela precisão, com índice de confiança. É o método das análises novas | Ninguém pela tela: só uma nova versão da ferramenta, com evidência |
| Método CR (CR1 em uso) | Receita líquida (ou despesa empenhada, no órgão público) × percentual de investimento em TI, só CAPEX, por segmento e estado, do estudo de Carol Rocha (2026). Sem valor no estado, a média nacional do segmento. A receita, quando falta, é estimada pelos funcionários, como no Vezen | Só o administrador, com uma nova versão (CR1.1, CR2) |
| Método FGV | Receita líquida × Índice G do setor na 36ª Pesquisa Anual do Uso de TI da FGV: a conta da [calculadora de benchmarking da PDCA TI](https://www.pdcati.com.br/benchmarking-ti/). Gasto total de TI, seis setores; os percentuais são bem maiores que os do Vezen, uma referência alta de mercado | Ninguém pela tela: só uma nova versão da ferramenta |
| Método Personalizado | A mesma conta do CR, com percentuais tirados das suas empresas (planilha, digitadas ou análises salvas com gasto real) ou digitados por você | Você, na tela Métodos |

O CR1 mede só investimento (CAPEX); o Método Vezen mede o gasto total de TI ou, se escolhido no painel, só o CAPEX. No Método Personalizado, só um lugar com pelo menos 5 empresas tem valor próprio.

## Outros países

Cada método vale num país, e a escolha do método mostra o país de cada um, com um filtro por país. No Brasil há quatro métodos; no **México**, o **Método Vezen México**: em pesos, com o RFC no lugar do CNPJ (sem busca, porque o RFC não tem consulta pública), termos e parâmetros mexicanos (Censos Económicos do INEGI, FIX do Banco de México, nível do gasto de TI ajustado ao mercado mexicano). Ele está explicado inteiro em **Métodos**, Método Vezen México. Argentina, Chile, Colômbia, Estados Unidos e Peru aparecem como "em breve".

Os segmentos são uma lista só, a mesma na análise, no pedido à IA e em todos os métodos.

## Privacidade

- Os dados ficam só no navegador de quem usa, mesmo na versão publicada: não há servidor guardando nada.
- A versão publicada e o arquivo baixado guardam os dados cada um no seu canto. Para passar as análises de um para o outro, exporte um backup em **Empresas** e importe no outro.
- A internet só é usada quando você pede: a busca pelo CNPJ (BrasilAPI e os arquivos de receita da CVM e do IF.data publicados por este repositório) e a cotação de moedas (BrasilAPI).
- A base do Método CR que vem no arquivo tem só os parâmetros que entram na conta e quantas empresas há em cada grupo. Não tem nome, CNPJ, contato nem nenhum valor de empresa, nem o nome do arquivo ou as colunas de origem.
- Não guarde neste repositório relatórios do CRM, planilhas nem backups com dados reais. O `.gitignore` bloqueia esses arquivos.

## Onde está cada coisa

| Caminho | O que é |
|---|---|
| `index.html` | O Vezen inteiro: estilos, motor de cálculo (`<script id="motor">`) e a interface em blocos, um por tela (`ui-base`, `ui-analise`, `ui-listas`, `ui-metodos`...) |
| `tests/` | Testes do motor e da tela, com dados fictícios. Veja [tests/README.md](tests/README.md) |
| `tools/gerar-calibracao.cjs` | Gera uma versão do Método CR (os parâmetros embutidos) a partir de uma planilha de empresas |
| `tools/atualizar-grin.cjs` | Troca o Grin embutido no `index.html` por outra versão publicada |
| `AGENTS.md` | Instruções para agentes de IA que forem mudar o código. O `CLAUDE.md` aponta para ele |
| `CHANGELOG.md` | Histórico de versões |

## Testes

Os testes do motor precisam só do Node.js. Os de tela usam o Chrome instalado:

```sh
npm install         # só para os testes de tela
npm test            # motor
npm run test:tela   # tela
```
