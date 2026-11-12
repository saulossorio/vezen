# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento semântico.

## [1.2.0] - 2026-11-12

Ajustes de uso pedidos depois do redesenho, e a calibração embutida passa a ser só parâmetros. As estimativas não mudaram.

### Adicionado
- **O que estimar** é a primeira escolha de cada análise: só o investimento em TI, ou a receita líquida e o investimento em TI. Salvar pede a escolha. Análises antigas ficam como estavam.
- Com a receita na análise, o cartão mostra a receita líquida acima do investimento em TI, e a aba Resultado a traz no topo.
- Barra lateral recolhível, só com os ícones e o nome de cada tela ao passar o mouse. Fica como a pessoa deixou.
- Em área estreita, o cartão fica preso embaixo da tela com os valores, e **Detalhes** abre o resto. No celular ele ocupa uma faixa baixa, com um valor por linha.

### Alterado
- A consulta do CNPJ só acontece quando a pessoa pede, pela lupa dentro do campo ou pelo Enter. Depois da primeira consulta, a lupa vira o botão de atualizar.
- As dicas para aumentar a confiança ficam num acordeão fechado no cartão, em vez de uma lista sempre aberta.
- Campos, listas, seletores e botões com a mesma altura. As listas ganharam seta própria.
- No computador, o cartão acompanha a rolagem sem passar da altura da tela; o que não cabe rola dentro dele.
- A calibração padrão embutida passou a ser a versão pública: só os parâmetros que entram na conta, sem o tamanho, o nome, as colunas, os segmentos ou a origem da base e sem contagens por grupo. A tela de calibração, o cartão, o resumo e a Metodologia deixaram de mostrar essas informações; o acerto aparece em porcentagem.
- `tools/gerar-calibracao.cjs` grava sempre a versão pública.

### Removido
- A caixa “Estimar a receita pela ferramenta”, substituída pela escolha do que estimar.

## [1.1.0] - 2026-11-12

Redesenho da interface inteira, pensado para quem analisa empresas em detalhe. O cálculo não mudou.

### Adicionado
- **Listas:** uma planilha (relatório do CRM, Excel, CSV ou Parquet) estimada de uma vez, com conferência das colunas, indicadores, busca, filtros, resultados em CSV e cada empresa podendo virar uma análise ou ser salva em Empresas.
- Barra lateral, como no Canis e no Laika, com a análise aberta e o aviso de backup.
- Tema escuro, guardado no navegador.
- Endereço próprio para cada tela e cada análise: o voltar do navegador funciona e recarregar a página reabre a análise salva.
- Empresas: busca por nome, CNPJ ou cidade, filtros por setor e confiança, ordem, seleção para comparar, baixar ou excluir, e a régua da faixa provável em cada linha.
- Tipo de estimativa com o valor que cada opção daria para a empresa.
- Ajuda de cada campo, com o que ele é, como entra na conta e onde encontrar.
- Teste de tela `tela-listas` e os testes de tela reescritos para a nova interface.

### Alterado
- Identidade visual do Canis e do Laika: fonte Public Sans, verde da 4Network e neutros levemente esverdeados.
- Análise em duas abas, Dados e Resultado. O formulário fica em seções (Identificação, Porte, Equipe e sinais de TI, Gasto de TI conhecido, Mais sobre a empresa), sem os códigos internos dos caminhos.
- A origem do dado virou um botão embaixo do campo, que só aparece quando há valor.
- O cartão do resultado mostra o valor, a faixa, a confiança, as estimativas do resumo, o tipo de estimativa e os dados que mais aumentam a confiança. Clicar num dado leva ao campo.
- O Resultado conta a história em ordem, com índice ao lado. Os caminhos ficam numa lista só, com a conta de cada um ao abrir.
- Calibração com os três tipos lado a lado. Parâmetros e Metodologia com índice fixo, e Parâmetros com busca.
- O código da interface foi separado em blocos por tela (`ui-base`, `ui-analise`, `ui-listas`...), com ações por nome (`data-acao`).

### Removido
- Animações disparadas pela rolagem e o gráfico de fluxo dos pesos, que repetia a lista dos caminhos.

## [1.0.0] - 2026-11-12

Primeira versão publicada. Antes se chamava Estimador de TI e não tinha repositório.

### Adicionado
- Estimativa do investimento em TI de uma empresa e, se pedido, da receita líquida, com faixa provável e a conta passo a passo.
- Três tipos de estimativa por análise: Fórmulas base (o tipo das análises novas), Calibração padrão e Minha calibração.
- Calibração padrão embutida, feita com uma base de empresas de 10/11/2026. Tem só números agregados.
- Ajuste por cidade com os 5.571 municípios do IBGE: estado, cidade (as pequenas juntas em "demais cidades") e setor dentro da cidade. Cada valor vem de pelo menos 5 empresas.
- Testes do motor e da tela em `tests/` e o script `tools/gerar-calibracao.cjs`.
- `AGENTS.md`, com as instruções para agentes de IA.
- Publicação no GitHub Pages: https://saulossorio.github.io/vezen/.
- Ícone na aba do navegador, com a mesma marca do cabeçalho.

### Alterado
- O nome passou de Estimador de TI para Vezen no título, no cabeçalho, na assinatura do resumo e nos nomes dos arquivos baixados. A chave de armazenamento do navegador continua `estimador-ti.v1`, para não perder o que já está salvo.
