# Vezen

Estima quanto uma empresa brasileira investe em TI e, se você pedir, a receita líquida dela. É um único arquivo HTML: abre no navegador, não precisa instalar nada e **os dados ficam só no seu computador**.

O nome vem de Wezen, uma estrela da constelação do Cão Maior. Em árabe, Wezen quer dizer "o peso", e o Vezen pesa cada empresa em TI. Faz parte da família do Canis:

| Ferramenta | O que faz |
|---|---|
| Sirius | O CRM atual |
| Canis | O sistema novo |
| Laika | Limpa as planilhas antes de entrarem no Canis |
| Vezen | Estima o investimento em TI de cada empresa |

## Como usar

1. Abra **https://saulossorio.github.io/vezen/**. Ou baixe o `index.html` e abra com duplo clique: funciona igual, até sem internet.
2. **Uma empresa:** clique em **Nova análise**, no alto da barra lateral. Na aba **Dados**, preencha o que souber: a análise mostra sempre os dois resultados, a receita líquida (informada ou estimada) e o investimento em TI, cada um com a origem. Para trazer nome, estado, município e porte da Receita Federal, digite o CNPJ e clique na lupa dentro do campo (ou aperte Enter): a consulta só acontece quando você pede. Marque a origem de cada número no botão que aparece embaixo do campo. Na receita, informe também o ano e o período do valor: 12 meses, ou 9, 6 ou 3 quando o dado vem de um balanço trimestral ou semestral, e a ferramenta o leva a 12 meses. Nenhum campo é opcional: ou tem valor, ou você diz por quê. O campo vazio fica em vermelho, e o botão **Sem dado?** embaixo dele abre o motivo: não encontrado, a empresa não divulga ou não se aplica. Enquanto faltar algum, não dá para salvar nem copiar o resumo.
3. O cartão ao lado mostra a receita líquida e o investimento em TI, com a faixa provável e a confiança. Nele você escolhe o tipo de estimativa, vendo quanto cada um daria, e em **Como aumentar a confiança** estão os dados que mais ajudariam (clique para ir ao campo). Em telas estreitas o cartão fica preso embaixo, só com os valores, e **Detalhes** abre o resto.
4. Na aba **Resultado** está a explicação completa: os caminhos do cálculo, a faixa, a receita, os ajustes e a projeção. Dali, ou do cartão, dá para copiar um resumo pronto.
5. **Uma lista:** em **Listas**, escolha uma planilha (relatório do CRM, Excel, CSV ou Parquet), confira o que cada coluna é e veja todas as empresas estimadas. Filtre, baixe os resultados em Excel (ou CSV), abra qualquer empresa como análise ou salve as escolhidas em Empresas.
6. Em **Exportar**, na barra lateral, baixe as empresas em Excel para ler e compartilhar. Faça também o backup (.json) de vez em quando: se os dados do navegador forem apagados, as análises e as listas se perdem, e é o backup que as traz de volta.

**Empresa modelo:** um exemplo pronto (Banco do Brasil, com dados oficiais), no menu de **Empresas**.

**Métodos** explica como cada um dos três métodos calcula, com os parâmetros em uso (só leitura no Vezen e no CR1) e, no fim, os dados do Método Personalizado, a única parte que recebe dados seus. **Glossário** explica as siglas e os termos da ferramenta (FGV, Brasscom, CNPJ, MEI, receita líquida...), com o significado, a utilidade e o site oficial, e filtro por letra, como num dicionário; no texto, o que aparece sublinhado abre a definição. O tema escuro fica no fim da barra lateral, e o botão ao lado do nome recolhe a barra, deixando só os ícones.

## Os três métodos

Toda análise chega a dois números, a receita líquida e o investimento anual em TI, cada um com a origem à vista. O método escolhido na análise decide como a estimativa é feita:

| Método | De onde vêm os números | Quem muda os parâmetros |
|---|---|---|
| Método Vezen | Pesquisas públicas (FGV, Brasscom, FEBRABAN, Techaisle) e documentos oficiais: até sete caminhos de cálculo, juntados pela precisão, com índice de confiança. É o método das análises novas | Ninguém pela tela: só uma nova versão da ferramenta, com evidência |
| Método CR1 | Receita × percentual de TI observado numa base de empresas reais, por setor, estado e cidade (método de Carol Rocha). A receita, quando falta, é estimada pela receita por funcionário da mesma base | Só o administrador, com uma nova versão (CR1.1, CR2) |
| Método Personalizado | A mesma conta do CR1, com percentuais tirados das suas empresas (planilha, digitadas ou análises salvas com gasto real) ou digitados por você | Você, na tela Métodos |

Os percentuais do CR1 em uso são provisórios, calculados pela ferramenta com as empresas da base que declararam o gasto de TI, até a tabela definitiva ser carregada. Nos métodos por percentual, só um lugar com pelo menos 5 empresas tem valor próprio.

## Privacidade

- Os dados ficam só no navegador de quem usa, mesmo na versão publicada: não há servidor guardando nada.
- A versão publicada e o arquivo baixado guardam os dados cada um no seu canto. Para passar as análises de um para o outro, exporte um backup em **Empresas** e importe no outro.
- A internet só é usada para consultar o CNPJ e a cotação de moedas na BrasilAPI.
- A base do Método CR1 que vem no arquivo tem só os parâmetros que entram na conta e quantas empresas há em cada grupo. Não tem nome, CNPJ, contato nem nenhum valor de empresa, nem o nome do arquivo ou as colunas de origem.
- Não guarde neste repositório relatórios do CRM, planilhas nem backups com dados reais. O `.gitignore` bloqueia esses arquivos.

## Onde está cada coisa

| Caminho | O que é |
|---|---|
| `index.html` | O Vezen inteiro: estilos, motor de cálculo (`<script id="motor">`) e a interface em blocos, um por tela (`ui-base`, `ui-analise`, `ui-listas`, `ui-metodos`...) |
| `tests/` | Testes do motor e da tela, com dados fictícios. Veja [tests/README.md](tests/README.md) |
| `tools/gerar-calibracao.cjs` | Gera uma versão do Método CR1 (os parâmetros embutidos) a partir de uma planilha de empresas |
| `AGENTS.md` | Instruções para agentes de IA que forem mudar o código. O `CLAUDE.md` aponta para ele |
| `CHANGELOG.md` | Histórico de versões |

## Testes

Os testes do motor precisam só do Node.js. Os de tela usam o Chrome instalado:

```sh
npm install         # só para os testes de tela
npm test            # motor
npm run test:tela   # tela
```
