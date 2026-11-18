# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento semântico.

## [3.1.0] - 2026-11-17

### Adicionado
- **Tour guiado.** Passo a passo pelo caminho básico: Empresas, nova análise e método, empresa modelo, natureza, receita, origem do dado, campo sem valor, resultado ao vivo, pesquisa com IA, salvar, aba Resultado, Listas, Métodos e glossário. Abre sozinho na primeira visita, pode ser pulado (Agora não, Pular tour, Esc) e reaberto pela barra lateral (Tour guiado) ou pela tela vazia de Empresas. Destaca cada parte com um recorte que desliza de um passo para o outro; nos passos de clique, o clique no destaque avança. Clique fora do destaque balança o cartão e diz o que fazer; parte que não aparece mostra o aviso com Tentar de novo. Teclado: setas, Tab dentro do cartão e Esc. Nada é salvo durante o tour.

## [3.0.1] - 2026-11-17

### Alterado
- **Prompt para IA.** Pede só os dados que entram na conta do método e da natureza da análise, e a resposta vem numa tabela (Dado, Valor, Ano, Fonte, Tipo), com valores com ponto de milhar, mais uma linha com o que não foi encontrado e no máximo três observações.
- **Etapa da despesa pública.** No órgão público, a despesa de TI do ano vem com a etapa: liquidada (padrão), paga, empenhada ou dotação. O valor entra como está; paga, empenhada e dotação somam incerteza ao caminho (0,05, 0,10 e 0,25, suposições iniciais) e baixam a confiança. O resumo e os dados usados dizem a etapa, e o prompt para IA pede as quatro.
- **Origem do dado: três opções.** “Oficial via outro site” saiu: o documento vale igual, venha de onde vier, e conta como Oficial. Na receita, Oficial aparece como **DRE**. Análises e listas salvas com a origem antiga passam a Oficial (incerteza 0,05 em vez de 0,10).
- Copiar o resumo não é mais bloqueado por campo vazio: o resumo lista os campos que faltam em “Dados ainda não informados”.

## [3.0.0] - 2026-11-16

### Alterado
- **Nível do Método Vezen.** O % da receita gasto com TI e o gasto por usuário de cada setor deixaram de vir da pesquisa da FGV, que ficava de 2 a 5 vezes acima do gasto real. O valor central agora é a média geométrica entre a mediana internacional do setor e a mediana do gasto declarado por empresas brasileiras; nos bancos entram também os balanços do Banco do Brasil e do Santander Brasil. As estimativas pelo Método Vezen ficam, em geral, de 60% a 85% menores.
- O gasto por usuário (CAPU) de cada setor passou a ser coerente com o % da receita: % × receita por funcionário ÷ usuários por funcionário. Os dois caminhos de mercado dão valores próximos numa empresa típica.
- Incerteza dos caminhos de mercado maior (0,80 a 0,95 pela receita; 0,90 a 1,05 por usuários; 0,85 pela equipe), porque as referências divergem entre si. A confiança das análises sem gasto real cai cerca de 10 pontos.
- Métodos, Setores: nova parte “Nível”, com a fórmula, as fontes e a conferência com o tamanho do mercado brasileiro de TI (ABES e IDC) e a receita dos setores (IBGE).
- **CR0 no lugar do CR1 provisório.** O método por percentual vem com dados modelo, fictícios, com a segmentação completa: segmento, estado, cidade e segmento na cidade. O nome do método segue a versão; o CR1 será a primeira versão oficial.
- **Só os campos que entram na conta.** A análise mostra e pede só os campos que mudam o resultado no método escolhido. Com gasto de TI do ano de referência informado, equipe, usuários e unidades saem do formulário em qualquer método. O que já foi digitado fica guardado.
- **Método antes dos dados.** A análise nova começa pela escolha do método; o formulário abre depois, só com os campos daquele método. O método continua podendo ser trocado no painel.
- **Formulário por natureza.** Órgão público: seção “Execução orçamentária”, com a despesa de TI do ano (empenhada ou liquidada), servidores de TI e gasto real; sem receita, funcionários, setor nem usuários. Estatal: contratos de TI do ano. Pequena e terceiro setor sem usuários; terceiro setor sem setor. Município só nos métodos por percentual. A caixa do Método Personalizado só aparece com gasto real informado.
- Empresas, sem nenhuma análise: três cartões clicáveis (Nova análise, Analisar uma lista, Importar backup) no lugar do texto e das caixas; o cabeçalho não repete os botões.
- Métodos, Os três métodos: nova linha “Dados da empresa”, com o que cada método usa.
- Casos de aceitação A a E com os valores do novo nível. No caso C, o gasto real fica longe das referências do setor e o alerta de divergência aparece.

### Removido
- Ajustes por número de unidades e por crescimento de funcionários (até 10%, sem fonte) e os campos deles; % de vendas online e % de alunos a distância. A projeção sem histórico usa a média de mercado. Caso de aceitação A com a nova projeção.
- O ajuste especial de bancos muito grandes: com o novo nível, os dois bancos conferidos ficam a menos de 1,2 vez do gasto real sem ele.

## [2.2.0] - 2026-11-16

### Adicionado
- **Receita por ano**, como o gasto real: uma linha por ano, com valor, período e origem. A conta usa a linha do ano de referência; sem ela, a mais recente antes dele. Com dois anos fechados ou mais, a receita vai ao ano de referência pelo crescimento da própria empresa.
- **Ano de referência** em cada análise, no cartão e no resultado. Por padrão, o último ano fechado; receita líquida e investimento em TI são desse ano.
- Teste `motor-receitas` e o verbete Ano de referência no glossário.

### Alterado
- A receita do último ano fechado entra como foi informada: não é mais levada ao ano em curso.
- O valor de receita informado é usado como está, de qualquer origem. A origem muda só a incerteza, e a estimativa pelos funcionários fica para comparação. Antes, um valor não oficial era juntado com a estimativa.
- Gasto real do próprio ano de referência vale como o gasto do ano e vira o resultado; o de outros anos segue no caminho E0.
- Salvar nunca é bloqueado: salva, o aviso diz quantos campos faltam, e eles continuam em vermelho, inclusive o nome. Copiar o resumo continua pedindo os campos.
- “Usar esta empresa no Método Personalizado” começa desmarcado; análises salvas antes ficam fora até serem marcadas.
- **Métodos reescrita.** Títulos dizem o que a seção contém. Cada fórmula fica em bloco, alinhada pelo sinal de igual, com a legenda das letras e o valor em uso. Notas curtas no lugar dos parágrafos. Tabelas com as colunas numéricas da mesma largura e a unidade embaixo do título. A Fórmula completa do Vezen vem em cinco passos.
- Nas listadas, “Receita líquida, ano anterior” e “dois anos antes” viraram linhas da receita.
- Excel das empresas: coluna Ano de referência; em Dados e motivos, uma linha por ano de receita e de gasto real.

## [2.1.0] - 2026-11-15

### Alterado
- **Os dois resultados sempre à vista.** O passo “O que esta análise vai estimar” saiu: toda análise mostra a receita líquida e o investimento em TI, no cartão, no resultado e no resumo, cada um com a origem (valor informado com a origem do dado, estimada pela ferramenta, informada e estimada, ou meio da faixa do enquadramento). A receita é estimada sempre que falta; no Método Vezen, um valor não oficial é juntado à estimativa, como a Metodologia já descrevia. Análises que estavam “só investimento em TI” podem mudar de valor por isso.
- Nas listas, a opção “Estimar a receita quando faltar” saiu: ela é sempre estimada.
- O rótulo “Tipo de estimativa” virou “Método” no cartão, no resultado, nas listas e nas planilhas baixadas.

## [2.0.0] - 2026-11-15

Reorganização das três telas de documentação e parâmetros em uma só, e os três tipos de estimativa redefinidos como métodos. Análises salvas com “Calibração padrão” ou “Minha calibração” mudam de valor, porque esses métodos passaram a calcular por percentual da receita.

### Adicionado
- **Tela Métodos**, no lugar de Calibração, Parâmetros e Metodologia: a visão geral (os dois resultados e os três métodos lado a lado), a documentação do Método Vezen com os parâmetros em tabelas de só leitura e as fontes, a documentação e os parâmetros do Método CR1 (com a versão, a data e quantas empresas há em cada grupo), e a documentação do Método Personalizado com a única área de entrada de dados, marcada como tal. As rotas antigas continuam abrindo, nas seções certas.
- **Método CR1** (Carol Rocha): investimento em TI = receita líquida × percentual do setor, ajustado por estado e cidade, medido numa base de empresas reais; a receita, quando falta, é estimada pela receita por funcionário da mesma base. Os percentuais em uso são provisórios, calculados pela ferramenta com as empresas da base que declararam o gasto de TI, e ficam fixos até uma nova versão (CR1.1, CR2) gerada pelo administrador com `tools/gerar-calibracao.cjs`.
- **Método Personalizado** com um terceiro caminho de entrada: percentuais digitados (geral e por setor), sem informar empresas. Os outros dois (planilha e empresas digitadas) continuam; o mínimo caiu para 5 empresas.
- Caminho `EP` (receita × percentual) nos métodos por percentual, com a incerteza medida na própria base e o acerto do CR1 e do Vezen nas mesmas empresas.
- Glossário: Método Vezen, CR1, Método Personalizado e EP.

### Alterado
- “Fórmulas base” virou **Método Vezen**, com parâmetros fixos: o editor de Parâmetros saiu (importar, exportar, editar e voltar ao padrão), assim como a troca da base padrão pela tela. Uma mudança de parâmetro é uma versão nova da ferramenta.
- Nos métodos por percentual, a receita informada vale como está e só é estimada quando falta; gasto real da empresa continua tendo prioridade em todos os métodos.
- O teste de aceitação F passou a conferir o método por percentual.
- A versão pública da base do CR1 guarda as contagens por grupo (liberadas pelo dono do produto); nome do arquivo, colunas, segmentos e linhas de empresa continuam fora.

### Removido
- As telas Calibração, Parâmetros e Metodologia como itens do menu, o editor de parâmetros e a importação de parâmetros por arquivo.

## [1.8.1] - 2026-11-14

### Alterado
- **Metodologia:** a Visão geral traz a conta inteira em cinco passos (receita, caminhos com médias de mercado, caminhos com dados reais, junção e resultado), cada um com o link para a seção que detalha. E1 e E2 passaram a mostrar o ajuste dos bancos muito grandes (f esc), que antes só aparecia em “Porte, região e ajustes”. A receita vem antes dos caminhos, e o próximo melhor dado depois dos resultados. No celular, as fórmulas quebram em linhas em vez de ficar cortadas.

## [1.8.0] - 2026-11-14

### Adicionado
- **Período do valor da receita:** ao lado do ano, o campo **Período** diz quantos meses o valor cobre: 12 (ano fechado), 9, 6 ou 3, como nos balanços trimestrais e semestrais e no IF.data. A ferramenta leva o valor a 12 meses (multiplica por 12 e divide pelos meses, sem ajuste de sazonalidade) antes do crescimento até o ano da estimativa, e cada mês que falta soma 0,02 à incerteza da receita (parâmetro `receita.sMeses`, editável em Parâmetros). Antes, um valor de 3 ou 6 meses entrava como se fosse de um ano inteiro. As análises salvas ficam em 12 meses e não mudam de valor.
- **Filtro por letra no Glossário**, como num dicionário: Todas e A a Z, combinado com a busca e a categoria. As letras sem termo ficam apagadas, e a barra fica à vista ao rolar a lista.
- Teste `motor-periodo`.

### Alterado
- Os rótulos da receita não falam mais em “último ano fechado” (“Receita (IF.data)”, “Receita líquida”, “Prêmios emitidos”...), e o aviso do ano atual deixou de mandar usar o último ano fechado: agora manda marcar o período.
- A Metodologia, o resultado, o resumo e a ajuda da receita contam a conversão para 12 meses.

## [1.7.0] - 2026-11-14

### Adicionado
- **Glossário**, na barra lateral: as siglas e os termos da ferramenta em ordem alfabética, cada um com o significado, a utilidade e o site oficial, com busca e filtro por categoria. No texto, as siglas e os termos sublinhados (FGV, Brasscom, CNPJ, MEI, receita líquida...) abrem uma janelinha com a mesma definição do glossário, e dali dá para ir ao verbete. Funciona pelo teclado.
- **Excel (.xlsx)** como formato principal para baixar, gerado sem biblioteca: as empresas (abas “Empresas” e “Dados e motivos”) e cada lista importada. Os valores saem como número, com formato de reais. O CSV passa para o menu de opções, e o backup em JSON fica como arquivo técnico para restaurar o Vezen.
- **Nova análise** no alto da barra lateral, de qualquer tela. Com a barra recolhida, vira só o ícone.
- **Transições curtas** nas janelinhas, nos diálogos, na troca de tela e nas mudanças de estado (cor do campo, marcas das tecnologias, categorias). Quem pede menos animação recebe tudo na hora.
- **Ajuste de tamanho para bancos muito grandes** (parâmetro `escala.bancos`, explicado na Metodologia): o gasto por usuário e por receita cai conforme o banco cresce. Foi calibrado com os documentos oficiais do Banco do Brasil (2025) e do Santander Brasil (2024). Bancos médios, outros setores e o parâmetro zerado seguem como antes.
- Testes `motor-bancos`, `tela-glossario` e `tela-transicoes`.

### Alterado
- O campo que falta informar muda de cor no próprio campo, com fundo e borda vermelhos. O botão embaixo dele fica neutro, “Sem dado?”.
- Quando uma média de mercado se afasta de um dado real, o aviso só diz qual é e quanto dá, e que o resultado segue o dado real. Ele não manda mais conferir os dados.
- A busca de tecnologias é em camadas: primeiro a categoria, depois as tecnologias dela. Digitar busca em todas de uma vez, com a categoria ao lado do resultado, sem subtítulos dentro da lista.
- Os textos não usam primeira pessoa: “Não encontrei” virou “Não encontrado”, e “Não sei” virou “Sem informação”. O motivo salvo antes como “não achei” passa para “não encontrado” sozinho.
- A empresa modelo (Banco do Brasil) fica com confiança 95 e sem alerta de divergência. A nota sobre o alerta saiu da lista de fontes.

## [1.6.0] - 2026-11-14

### Alterado
- **Nenhum campo que entra na conta é opcional:** ou tem valor, ou a pessoa diz por quê. O campo vazio sem motivo mostra “Falta informar”, em vermelho, e o topo da análise conta quantos faltam. Enquanto faltar algum, não dá para salvar nem copiar o resumo. Saiu o “Salvar assim mesmo”.
- As cores dos motivos seguem o sentido: vermelho é falta informar, âmbar é “Não encontrado” e “Não divulga”, verde é “Não se aplica”.
- As ajudas dos campos dizem o que o campo é e o que informar. Fórmulas e multiplicadores ficam na Metodologia, e a ajuda tem o link “Como entra na conta”, que abre a seção certa (`#/metodologia/<seção>`).
- A empresa modelo ficou completa: receita (resultado da intermediação financeira mais receita de serviços) e agências com os valores oficiais, e motivo no que os documentos do banco não trazem. A confiança é 85, com o alerta de estimativas divergentes, esperado em bancos.

## [1.5.0] - 2026-11-14

### Alterado
- **Tecnologias:** no lugar de 36 marcações abertas, uma busca com lista de seleção múltipla. A lista só abre quando a pessoa pede, a busca vale também para os exemplos (SAP, Salesforce...) e as escolhidas ficam como marcas que se removem com um clique. Funciona pelo teclado.
- Os motivos “Não encontrado”, “Não divulga” e “Não se aplica” ganharam cores próprias, como os botões de origem, no botão, no menu e em Dados usados.
- A receita pede o último ano fechado: listadas, bancos, seguradoras e operadoras deixam de falar em “ano”, e o IF.data traz a dica de usar o acumulado de 12 meses. Um valor com o ano em curso avisa que pode ser parcial.
- O Porte perdeu o texto explicativo abaixo do título.

## [1.4.0] - 2026-11-14

### Adicionado
- **Campo sem valor:** em vez de ficar em branco, cada campo que entra na conta ganha o botão “Sem dado?”, no lugar do botão de origem. A pessoa diz por quê: não encontrei, a empresa não divulga ou não se aplica. O motivo fica salvo com a empresa, aparece em Dados usados e no resumo, e o cartão deixa de sugerir esse dado. Não muda a estimativa.
- **Verificador ao salvar:** lista os campos vazios sem motivo. Dá para revisar, com os pendentes destacados, ou salvar assim mesmo.

### Alterado
- A empresa modelo traz o motivo dos dados que os documentos do banco não têm. Receita e agências ficam pendentes de propósito.

## [1.3.0] - 2026-11-14

### Adicionado
- **Empresa modelo:** o Banco do Brasil, com dados públicos e confiança alta, para ver a ferramenta funcionando. Abre pelo menu de Empresas ou pelo link na tela vazia, como uma análise nova que só é salva se a pessoa quiser. Funcionários e gasto de TI de 2024 e 2025 vêm dos documentos oficiais do banco, citados no aviso no topo da análise.

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
