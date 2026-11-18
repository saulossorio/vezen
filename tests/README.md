# Testes

Os testes usam só dados fictícios. Os do motor precisam só do Node.js. Os de tela usam o Chrome instalado e o pacote `playwright-core`, que vem com `npm install`.

| Arquivo | O que confere |
|---|---|
| `motor-casos.test.cjs` | Os casos de aceitação A a F, os mesmos da tela "Testes de aceitação" da ferramenta |
| `motor-bancos.test.cjs` | Nível do Método Vezen: os caminhos de mercado ficam perto do gasto real do Banco do Brasil e do Santander Brasil sem ajuste especial, o caminho pela receita e o por usuários dão valores próximos em cada setor, e a soma de indústria, comércio e serviços cabe no mercado brasileiro de TI |
| `motor-periodo.test.cjs` | Receita informada de 3, 6 ou 9 meses: levada a 12 meses, com a incerteza que cresce por mês que falta, junto com o ano anterior, o faturamento bruto, a origem do dado e períodos inválidos |
| `motor-receitas.test.cjs` | Receita de vários anos e ano de referência: a linha do ano, a mais recente antes dele, o crescimento da própria empresa, valor de depois trazido para trás, valor informado usado como está e o gasto real do ano como gasto do ano. |
| `motor-cidades.test.cjs` | Nomes dos municípios do IBGE, ajustes por cidade, regra do mínimo de empresas, o caminho EP dos métodos por percentual e a versão do CR embutida (CR0, dados modelo): pública, com contagens por grupo e sem nome de arquivo, colunas, segmentos, CNPJ, e-mail ou linha de empresa, e com as mesmas estimativas da calibração completa |
| `tela-analise.test.cjs` | Análise de uma empresa: os dois resultados no cartão, altura dos campos, origem do dado, receita líquida (tipo, ano, receita global e câmbio), cartão do resultado com a receita e as dicas recolhidas, resumo para copiar, prompt, CNPJ (filial e busca só pela lupa ou Enter), aba Resultado, barra lateral recolhida, cartão preso embaixo na área estreita, barra lateral (recolhida e Nova análise), empresa modelo (confiança de 80 ou mais, sem alerta e com as duas fontes oficiais), campo sem valor (motivo, o próprio campo em vermelho, cores com sentido, bloqueio de salvar e do resumo, resultado), período do valor da receita, ajudas dos campos e Metodologia (conta inteira na Visão geral, ordem das seções), tecnologias (busca em camadas, teclado), dados de versões anteriores e celular |
| `tela-tipos.test.cjs` | A tela Métodos (um item só no menu, 21 seções em 4 grupos, parâmetros do CR com contagens, documentação do Vezen), a escolha do método na análise, o Personalizado (formulário, importação, lista baixada, modelo e percentuais diretos), as rotas antigas e a migração de dados antigos |
| `tela-cidades.test.cjs` | Campo Município com a lista do IBGE, Personalizado com cidades (planilha e formulário, tabela por lugar com contagens), valores e resumo com o ajuste por lugar, o CR0 (dados modelo) com estados e cidades e a consulta de CNPJ pela lupa; a receita da DRE na CVM preenchida pela busca do CNPJ |
| `tela-listas.test.cjs` | Listas (importar, conferir colunas, filtrar, baixar em Excel e CSV, salvar e abrir empresas), busca e seleção em Empresas, comparação, Excel das empresas (duas abas, números de verdade), backup, parâmetros pendentes, tema escuro, voltar do navegador e menu do celular |
| `tela-glossario.test.cjs` | Glossário: dados dos verbetes, lista em ordem alfabética, busca, categoria e filtro por letra, chegada por um termo, siglas do texto que viram link (um por seção, nunca em campo, botão, título ou no que a pessoa digitou), janelinha com a mesma definição da lista em todos os termos, e a conferência de que as siglas das telas estão no glossário |
| `tela-tour.test.cjs` | Tour guiado: abre na primeira visita, faz o exercício do Banco do Brasil com cliques de verdade, sem perder nem tapar alvo (computador e celular), segura cliques fora do destaque, espera cada tarefa, pula, reabre, Voltar e Esc |
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
- Os testes não repetem números da base do CR: conferem a forma dos dados (rótulo, contagens inteiras, percentuais plausíveis), não valores. Os valores por cidade vêm das planilhas fictícias de `dados/`.
