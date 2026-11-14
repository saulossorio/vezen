# Testes

Os testes usam só dados fictícios. Os do motor precisam só do Node.js. Os de tela usam o Chrome instalado e o pacote `playwright-core`, que vem com `npm install`.

| Arquivo | O que confere |
|---|---|
| `motor-casos.test.cjs` | Os casos de aceitação A a F, os mesmos da tela "Testes de aceitação" da ferramenta |
| `motor-bancos.test.cjs` | Ajuste de tamanho para bancos muito grandes: os caminhos de modelo chegam perto do gasto real do Banco do Brasil e do Santander Brasil (e passavam de 2 vezes sem o ajuste), sem alerta e com confiança alta, e bancos médios, outros setores e o parâmetro zerado ficam como antes |
| `motor-periodo.test.cjs` | Receita informada de 3, 6 ou 9 meses: levada a 12 meses, com a incerteza que cresce por mês que falta, junto com o ano anterior, o faturamento bruto, a origem do dado e períodos inválidos |
| `motor-cidades.test.cjs` | Nomes dos municípios do IBGE, ajustes por cidade, regra do mínimo de empresas e a calibração embutida na versão pública: sem contagens, nome de arquivo, colunas ou segmentos da base, sem CNPJ, e-mail ou linha de empresa, e com as mesmas estimativas da calibração completa |
| `tela-analise.test.cjs` | Análise de uma empresa: o que estimar, altura dos campos, origem do dado, receita líquida (tipo, ano, receita global e câmbio), cartão do resultado com a receita e as dicas recolhidas, resumo para copiar, prompt, CNPJ (filial e busca só pela lupa ou Enter), aba Resultado, barra lateral recolhida, cartão preso embaixo na área estreita, barra lateral (recolhida e Nova análise), empresa modelo (confiança de 80 ou mais, sem alerta e com as duas fontes oficiais), campo sem valor (motivo, o próprio campo em vermelho, cores com sentido, bloqueio de salvar e do resumo, resultado), período do valor da receita, ajudas dos campos e Metodologia (conta inteira na Visão geral, ordem das seções), tecnologias (busca em camadas, teclado), dados de versões anteriores e celular |
| `tela-tipos.test.cjs` | Os três tipos de estimativa, a calibração padrão sem tamanho, nome ou origem da base, a minha calibração (formulário, importação, lista baixada e modelo), a troca da base padrão e a migração de dados antigos |
| `tela-cidades.test.cjs` | Campo Município, valores por cidade, resultado, resumo, tela de calibração (cidades em ordem alfabética, sem contagens), minha calibração com cidade e consulta de CNPJ pela lupa |
| `tela-listas.test.cjs` | Listas (importar, conferir colunas, filtrar, baixar em Excel e CSV, salvar e abrir empresas), busca e seleção em Empresas, comparação, Excel das empresas (duas abas, números de verdade), backup, parâmetros pendentes, tema escuro, voltar do navegador e menu do celular |
| `tela-glossario.test.cjs` | Glossário: dados dos verbetes, lista em ordem alfabética, busca, categoria e filtro por letra, chegada por um termo, siglas do texto que viram link (um por seção, nunca em campo, botão, título ou no que a pessoa digitou), janelinha com a mesma definição da lista em todos os termos, e a conferência de que as siglas das telas estão no glossário |
| `tela-transicoes.test.cjs` | Janelinhas e diálogos com entrada e saída curtas, sem ids repetidos, e tudo imediato para quem pede menos animação |
| `zip.cjs` | Leitor mínimo de .zip (e portanto de .xlsx), só com o Node.js, usado pelos testes de Excel |
| `dados/` | Planilhas fictícias usadas pelos testes de tela |

```sh
npm test            # motor
npm run test:tela   # tela (abre o Chrome sem janela)
```

- O Chrome é procurado em `/Applications/Google Chrome.app`. Se estiver em outro lugar, defina `CHROME_PATH`.
- Os testes de tela bloqueiam ou simulam a BrasilAPI. Por isso `tela-analise` mostra dois erros "Failed to load resource" no fim (a lupa e o Enter do CNPJ), que são esperados.
- Imagens e arquivos baixados durante os testes vão para a pasta temporária do sistema, nunca para o repositório.
- Alguns testes conferem valores da calibração embutida atual: 18 cidades na receita e 6 no gasto de TI, fatores por cidade e setores com a correção geral. Ao trocar a base, atualize esses valores depois de conferir que fazem sentido.
