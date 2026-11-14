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
2. **Uma empresa:** em **Empresas**, clique em **Nova análise**. Primeiro escolha o que a análise vai estimar: só o investimento em TI, ou a receita líquida e o investimento em TI. Depois, na aba **Dados**, preencha o que souber. Para trazer nome, estado, município e porte da Receita Federal, digite o CNPJ e clique na lupa dentro do campo (ou aperte Enter): a consulta só acontece quando você pede. Marque a origem de cada número no botão que aparece embaixo do campo.
3. O cartão ao lado mostra a receita líquida (quando a análise a estima) e o investimento em TI, com a faixa provável e a confiança. Nele você escolhe o tipo de estimativa, vendo quanto cada um daria, e em **Como aumentar a confiança** estão os dados que mais ajudariam (clique para ir ao campo). Em telas estreitas o cartão fica preso embaixo, só com os valores, e **Detalhes** abre o resto.
4. Na aba **Resultado** está a explicação completa: os caminhos do cálculo, a faixa, a receita, os ajustes e a projeção. Dali, ou do cartão, dá para copiar um resumo pronto.
5. **Uma lista:** em **Listas**, escolha uma planilha (relatório do CRM, Excel, CSV ou Parquet), confira o que cada coluna é e veja todas as empresas estimadas. Filtre, baixe os resultados em CSV, abra qualquer empresa como análise ou salve as escolhidas em Empresas.
6. Exporte um backup de vez em quando, pela barra lateral: se os dados do navegador forem apagados, as análises e as listas se perdem.

**Empresa modelo:** para ver a ferramenta funcionando antes de usar com as suas empresas, abra a empresa modelo pelo menu de **Empresas** (ou pelo link na tela vazia). É o Banco do Brasil, com funcionários e gasto de TI tirados dos documentos oficiais do banco, e confiança alta. As fontes ficam no aviso no topo da análise.

**Calibração** mostra os três tipos de estimativa e os dados de cada um. **Parâmetros** mostra e permite mudar os números usados nas contas. **Metodologia** explica cada fórmula. O tema escuro fica no fim da barra lateral, e o botão ao lado do nome recolhe a barra, deixando só os ícones.

## Tipos de estimativa

| Tipo | De onde vêm os números |
|---|---|
| Fórmulas base | Só das médias de mercado. É o tipo das análises novas |
| Calibração padrão | Das médias corrigidas com a base de empresas que vem com a ferramenta, ou com outra base enviada na aba **Calibração** |
| Minha calibração | Das médias corrigidas com as suas empresas: digitadas, importadas de planilha ou análises salvas com o gasto real |

As calibrações também ajustam por estado, cidade e setor dentro da cidade, só onde há pelo menos 5 empresas.

## Privacidade

- Os dados ficam só no navegador de quem usa, mesmo na versão publicada: não há servidor guardando nada.
- A versão publicada e o arquivo baixado guardam os dados cada um no seu canto. Para passar as análises de um para o outro, exporte um backup em **Empresas** e importe no outro.
- A internet só é usada para consultar o CNPJ e a cotação de moedas na BrasilAPI.
- A calibração que vem no arquivo tem só os parâmetros que entram na conta: médias por setor, por porte e por cidade, cada uma de um grupo com 5 empresas ou mais. Não tem nome, CNPJ nem contato de nenhuma empresa, nem o tamanho, o nome ou a origem da base.
- Não guarde neste repositório relatórios do CRM, planilhas nem backups com dados reais. O `.gitignore` bloqueia esses arquivos.

## Onde está cada coisa

| Caminho | O que é |
|---|---|
| `index.html` | O Vezen inteiro: estilos, motor de cálculo (`<script id="motor">`) e a interface em blocos, um por tela (`ui-base`, `ui-analise`, `ui-listas`...) |
| `tests/` | Testes do motor e da tela, com dados fictícios. Veja [tests/README.md](tests/README.md) |
| `tools/gerar-calibracao.cjs` | Refaz a calibração padrão embutida com uma base nova do CRM |
| `AGENTS.md` | Instruções para agentes de IA que forem mudar o código. O `CLAUDE.md` aponta para ele |
| `CHANGELOG.md` | Histórico de versões |

## Testes

Os testes do motor precisam só do Node.js. Os de tela usam o Chrome instalado:

```sh
npm install         # só para os testes de tela
npm test            # motor
npm run test:tela   # tela
```
