# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento semântico.

## [4.3.5] - 2026-11-24

### Alterado
- Grin 2.39, a mesma versão do Laika.

## [4.3.4] - 2026-11-24

### Alterado
- Grin 2.38. Listas vazia: "Analisar uma lista" fica só no estado vazio, sem repetir no cabeçalho.
- A escolha do método (Empresas vazia e Nova análise) deixa de usar `.empty-state`: é uma tela de escolha com `.action-card`. Em Nova análise, os cards passam a usar a largura da página, alinhados ao título, como em Empresas, e o título vira "Escolha o método".

## [4.3.3] - 2026-11-24

### Alterado
- Estados vazios (Listas, Comparar e Resultado sem dados) com o ícone do `.empty-state` do Grin, como no Laika.

## [4.3.2] - 2026-11-24

### Alterado
- Grin 2.37.
- Diálogos pela regra do modal do Grin: cabeçalho com o título e o botão Fechar, como no Laika. Antes o título ficava dentro do texto e não havia Fechar. O foco começa no primeiro campo ou em Cancelar.

## [4.3.1] - 2026-11-24

### Alterado
- Grin 2.35. As ações do cabeçalho ficam alinhadas pelo topo com o título em todas as telas. Antes, em Listas e nas outras telas, ficavam embaixo, e só em Empresas ficavam em cima.
- Campos, listas e botões com a altura do Grin: 44 px no modo confortável e 36 px no compacto, pelo painel Aparência. Antes o Vezen fixava 40 px.
- Avisos rápidos com o toast do Grin, com ícone e botão de fechar, como no Laika. Os avisos de problema usam o tom de atenção.
- Correção: uma regra `.ok` do Vezen pintava de verde o texto dos componentes do Grin com o tom ok, como o toast. Agora vale só para os elementos do Vezen.

## [4.3.0] - 2026-11-24

### Alterado
- Grin 2.32.
- Barra lateral do Grin: o `sidebar.js` recolhe, expande e abre o drawer no celular, e guarda a escolha. Saíram a casca própria, a barra do topo no celular e o menu próprio. No celular, a barra vira drawer a partir de 760 px, como no Grin (antes 960 px). Recolhida, a barra tem 72 px, a largura do Grin.
- "Nova análise" usa `.sidebar-action`, a ação principal da barra lateral do Grin.
- O botão de tema é o do Grin (`data-theme-toggle`).
- As dicas usam o tooltip do Grin (`data-tooltip`).
- Ícones: os de interface vêm do Grin. Antes o Vezen tinha 79 desenhos próprios, alguns diferentes dos do Grin e do Laika, como a lua do tema escuro. Os próprios que ficaram (setor, governo, nuvem, servidor e outros conceitos do Vezen) são desenhos do Lucide, o mesmo estilo do Grin.
- O Tour guiado usa o ícone de mapa, como no Grin.
- Logo em `.app-logo-mark`, com o espaço de 16 px do Grin embaixo (antes 12 px). A assinatura tem 20 px de espaço em cima e embaixo, como no Laika.

### Removido
- Com a barra recolhida, a análise aberta não aparece mais como ícone. O Grin esconde os subitens na barra recolhida.

## [4.2.3] - 2026-11-21

### Alterado
- Método Personalizado sem dados: volta a ser clicável e mostra "Sem dados ainda · Adicionar dados". No resultado detalhado, escolher o método leva à análise, onde estão os campos dele. A versão 4.2.2 o deixava desabilitado.
- Resultado detalhado, Dados usados: o rótulo é texto corrido, e um termo do glossário como "Gasto de TI" não se divide mais em colunas. A origem e o detalhe ficam na mesma linha. Os cartões se distribuem como o `.stat-grid` do Grin, sem um cartão sozinho numa linha.
- Resultado detalhado, Ajustes pelo perfil: o fator e o efeito (por exemplo "× 1,17 +17%") ficam na mesma linha, numa coluna de largura fixa.
- Resultado no celular: a origem de um dado (por exemplo "Terceiros") quebra dentro do cartão e não cria rolagem lateral.
- Gráficos do resultado: a largura desconta o índice lateral, e os gráficos não são mais reduzidos com texto menor. A projeção tem espaço para os valores do eixo e mostra só o valor de cada ano. A taxa, igual em todos os anos, aparece embaixo do gráfico.

## [4.2.2] - 2026-11-21

### Alterado
- Resultado detalhado: o índice "Nesta página" marca a seção que está no topo da tela, como o índice do Grin, e acompanha a rolagem e os cliques.
- Contas dos caminhos numa linha só. Os rótulos longos quebram dentro do próprio termo. No celular a conta continua quebrando em várias linhas.
- Resultado detalhado: o Método Personalizado sem dados fica desabilitado e não pode ser clicado, porque ali não há formulário para preencher os dados. Na análise ele continua clicável e abre os campos dele.

## [4.2.1] - 2026-11-21

### Alterado
- Grin 2.27. A tela inicial volta a ter o cabeçalho no mesmo lugar das outras telas, com as mesmas margens. Os quatro métodos ficam numa linha, na largura da página. A coluna centralizada da 4.2.0 mudava a posição do título ao passar para outra tela.
- Resultado detalhado: os números (receita, geral, conservadora, parte da receita, caminhos e projeção) ficam embaixo da régua, na coluna do valor. Antes ficavam embaixo do cartão inteiro, e a coluna do valor ficava vazia ao lado do painel de confiança e métodos.

## [4.2.0] - 2026-11-21

### Alterado
- Grin 2.26. Empresas sem nenhuma empresa usa o padrão Tela inicial do Grin, como o Laika. O conteúdo fica numa coluna centralizada de 680 px, no centro vertical da janela, os quatro métodos ficam em duas colunas e a assinatura fica no fim, na mesma largura. Com empresas, a tela continua sendo a lista.

## [4.1.2] - 2026-11-21

### Alterado
- Grin 2.25. Em Empresas, Métodos e Glossário a tela ocupa pelo menos a altura da janela. Com pouco conteúdo, a assinatura fica no fim da janela. Com mais conteúdo, fica depois dele e rola junto.

## [4.1.1] - 2026-11-21

### Alterado
- Grin 2.23. A assinatura aparece só em Empresas, a tela inicial, e na documentação (Métodos e Glossário). Fica logo depois do conteúdo e rola com ele. Saiu das telas de trabalho (análise, listas e testes).

## [4.1.0] - 2026-11-21

### Adicionado
- **Painel Aparência do Grin** no pé da barra lateral, logo abaixo do botão de tema, com tema, alto contraste, densidade e tamanho da fonte. O tema escolhido ali e o do botão ficam sempre iguais.
- **Assinatura** no fim de cada tela: "Vezen 4.1.0 · por Saúl Ossorio", com a versão do Grin usada.

### Alterado
- **Grin 2.22.** O botão de recolher a barra lateral passa a ser o do Grin, redondo na borda da barra, e a barra recolhida tem a largura do Grin (72 px).
- Corrigido o tema: o Grin 2.20 apagava o tema escolhido no Vezen ao carregar e a tela seguia o tema do sistema.

### Não mudou
- Cálculos, parâmetros, dados salvos no navegador, importação e exportação de arquivos e textos das telas.

## [4.0.1] - 2026-11-21

### Alterado
- **Grin 2.20.** O Grin embutido passa da 2.19 para a 2.20, que corrige os problemas encontrados na migração. Saem os dois ajustes que o Vezen fazia por conta própria: a linha entre as etapas horizontais e a proteção para eventos disparados no próprio `document`.

### Não mudou
- Cálculos, parâmetros, dados salvos no navegador, importação e exportação de arquivos, textos e telas. Todos os testes de motor e de tela passam como na 4.0.0.

## [4.0.0] - 2026-11-21

### Alterado
- **Design system Grin 2.19.** A interface inteira passa a usar o Grin, copiado da release v2.19 e embutido no `index.html`: fontes Geist e Geist Mono no lugar da Public Sans, tokens semânticos de cor nos temas claro e escuro, com alto contraste, e os componentes do Grin (barra lateral, botões, campos, tabelas, menus, popovers, diálogo, selos, avisos, cartões, abas, etapas, glossário e tour).
- Fórmulas da tela Métodos em Geist Mono, com as letras em itálico na cor da marca.
- Abas Dados e Resultado no formato das abas do Grin, sem ficar presas no topo.
- Tabela de equivalências entre as classes antigas e as do Grin, e as decisões da migração, em `docs/migracao-grin.md`.

### Não mudou
- Cálculos, parâmetros, dados salvos no navegador, importação e exportação de arquivos e textos das telas.

## [3.9.3] - 2026-11-20

### Alterado
- **Marca**: estrela de quatro pontas feita de quatro triângulos equiláteros, na cor do tema (também no ícone da aba).
- **Versão** num selo ao lado do nome Vezen, no topo do menu.

## [3.9.2] - 2026-11-20

### Alterado
- Versão do Vezen à vista no rodapé do menu lateral.

### Corrigido
- Nova análise pela tela de Empresas abria rolada até o nome da empresa: o foco no nome não rola mais a página.

## [3.9.1] - 2026-11-20

### Corrigido
- Escolher o método abre a análise do topo; o cursor vai ao percentual só quando o Personalizado ainda não tem dados (senão, ao nome da empresa).

## [3.9.0] - 2026-11-20

### Alterado
- **Personalizado**: na análise, a seção “Dados do Método Personalizado” vem primeiro, sempre aberta, com os percentuais prontos para editar. Sem nenhum percentual nem empresas suficientes, o resto do formulário fica bloqueado. O cartão do Personalizado na escolha do método abre a análise direto, e o método pode ser escolhido sem dados.
- Formulário dos percentuais: colunas alinhadas, “Adicionar linha” separado dos botões, “Remover percentuais” no lugar de “Voltar às empresas”.

## [3.8.3] - 2026-11-20

### Alterado
- **Personalizado na análise**: seção “Dados do Método Personalizado” no formulário e botão “Editar percentuais e empresas” no cartão do método, para ver e mudar os percentuais e as empresas sem sair da análise.

## [3.8.2] - 2026-11-20

### Corrigido
- Alinhamento da seta em “só registro” e do ícone dos avisos dentro da caixa da receita.

## [3.8.1] - 2026-11-20

### Alterado
- Estado da análise nova: “Não salva”.

## [3.8.0] - 2026-11-20

### Alterado
- **Método Personalizado**: os percentuais informados são por setor e estado (linhas setor × estado, com “todos” para o resto; vale a linha mais específica). O cartão do método, sem dados, abre ali mesmo as empresas, a planilha e os percentuais; com os percentuais salvos, a análise abre no método e mostra o percentual em uso.
- **Gasto de TI real** no formato da receita: a primeira linha já vem com o ano de referência, valor e período (o valor de menos de 12 meses é levado ao ano). O campo separado do gasto declarado saiu; o valor salvo nele vira a linha do ano de referência.
- **Análise nova** tem o botão Voltar, que volta à escolha do método; a escolha do método volta para Empresas.
- **Cartões dos métodos** sem o selo do que medem; **tour** com textos curtos.

## [3.7.2] - 2026-11-20

### Alterado
- **Cartões dos métodos** com texto curto e sem termos técnicos.
- **Personalizado sem dados**: o percentual da receita gasto com TI é informado no próprio cartão, que abre a análise com ele.
- **Tela vazia de Empresas**: embaixo dos métodos, só o link da empresa modelo.

## [3.7.1] - 2026-11-20

### Alterado
- **Tela vazia de Empresas** mostra os quatro métodos, com o que cada um mede; o cartão abre a análise já com o método. Lista, backup e empresa modelo ficam como links embaixo.

### Corrigido
- **Dados salvos que não abrem** não são mais apagados: o texto original fica guardado no navegador (`estimador-ti.v1.ilegivel`) e um aviso aparece no topo.

## [3.7.0] - 2026-11-20

### Adicionado
- **Escolha do método explicada.** Cada cartão mostra o que o método mede (gasto total, só CAPEX ou os dois) e uma frase sobre a conta e a fonte.

### Alterado
- **Personalizado sem dados:** o cartão leva para Métodos, Seus dados, onde se cadastram as empresas ou os percentuais, em vez de ficar desativado.
- **Tela vazia de Empresas:** só o link da empresa modelo; o tour fica na barra lateral.

## [3.6.1] - 2026-11-20

### Alterado
- **Tour reescrito em tom impessoal:** o primeiro passo diz o que o Vezen é (ferramenta para estimar dados financeiros de empresas no Brasil); sem saudação, exclamação, adjetivos nem a quantidade de passos no texto.

## [3.6.0] - 2026-11-20

### Adicionado
- **Receita pelo IF.data.** A busca do CNPJ traz a receita dos bancos, cooperativas e financeiras que não publicam DFP na CVM, do balanço no IF.data do Banco Central (três últimos anos fechados): resultado da intermediação financeira, já depois da perda esperada com crédito, mais tarifas e serviços, junho mais dezembro. A líder de um conglomerado prudencial leva a receita do conglomerado; as outras instituições, a individual. Selo “via IF.data” e link para o IF.data. A CVM continua na frente quando tem a empresa.
- **Tarefa semanal** gera também `dados/receitas-ifdata.json` (`tools/receitas-ifdata.cjs`).

## [3.5.0] - 2026-11-19

### Adicionado
- **Método FGV**, o quarto método: a conta exata da [calculadora de benchmarking de TI da PDCA TI](https://www.pdcati.com.br/benchmarking-ti/) (Gustavo de Castro Rafael), receita líquida × Índice G do setor na 36ª Pesquisa Anual do Uso de TI da FGVcia (2025). Gasto total de TI. Seis setores, como na calculadora: Agro 5%, Indústria 5,5%, Serviços 14,5%, Comércio 4,8%, Financeiro 21% e Geral 10%; o CAPU de cada setor aparece só para comparar. Campo “Setor (FGV)”; sem escolha, vale o mais próximo do setor da ferramenta, e sem setor, Geral. Não vale para órgão público. Em Métodos, “Fórmula e fonte”, com os links da calculadora e da pesquisa, e “Parâmetros em uso”; no glossário, Método FGV e PDCA TI.

### Alterado
- **Métodos por tabela** (CR1 e FGV) usam o mesmo motor: cada tabela diz o campo do segmento, o segmento de cada setor, a linha do setor para estimar a receita e se mede só CAPEX.
- **Escolha do método** com quatro opções.

## [3.4.1] - 2026-11-19

### Adicionado
- **Índice G e CAPU na documentação.** Em Métodos, Caminhos: de onde vêm as fórmulas dos dois primeiros caminhos (os indicadores da Pesquisa Anual do Uso de TI da FGV), por que somam CAPEX e OPEX e por que o nível dos percentuais não vem da FGV. Índice G no glossário; o CAPU ganha a origem.
- **Índice G no resultado.** O percentual da receita do valor geral, no gasto total com salários, aparece como o Índice G estimado da empresa.

## [3.4.0] - 2026-11-19

### Adicionado
- **Método CR1, a primeira versão oficial do CR.** Tabela do estudo de Carol Rocha (2026): percentual de investimento em TI, só CAPEX, sobre a receita líquida, ou sobre a despesa empenhada no órgão público, por segmento e estado. Sem valor no estado, vale a média nacional do segmento. Os 12 segmentos do estudo, mais PRODs (5,14%, a mediana das empresas de processamento de dados do governo no estudo) e Serviços e outros (3%, prestação de serviços na pesquisa de tendências). Administração direta no Amapá (0%) conta como sem valor.
- **Campo Segmento no CR1**, com a lista do estudo, no lugar do setor; sem escolha, vale o segmento mais próximo do setor. O órgão público informa a despesa empenhada total e o estado.
- **Método Vezen só com CAPEX.** No painel, “O que estimar”: gasto total de TI (como antes) ou só investimento (CAPEX), que é o total, e cada caminho, vezes a parte de investimento do gasto de TI (32%, FGV; 36% nos bancos, FEBRABAN).

### Alterado
- **O CR1 substitui o CR0** (dados modelo). O CR1 não tem cidade nem ajuste por lugar, e gasto real, gasto declarado e despesa de TI não entram nele, porque são gasto total. O resultado se chama “Investimento em TI (CAPEX)”.
- **Teste da lupa do CNPJ** espera a resposta em vez de um tempo fixo: a consulta da CVM às vezes demora mais.

## [3.3.0] - 2026-11-18

### Adicionado
- **Receita da DRE pelo CNPJ.** O botão de buscar ou atualizar o CNPJ também procura a DRE da empresa na CVM. Nas companhias abertas, preenche a receita do ano de referência (ou do último publicado), com origem DRE, período de 12 meses e os anos anteriores como histórico, e mostra o selo “via CVM” com o link para o documento. Editar a receita tira o selo. Empresa fora da CVM fica como estava.
- **Arquivo semanal da CVM.** `tools/receitas-cvm.cjs` lê os dados abertos da CVM (DFP dos três últimos anos, DRE consolidada ou, sem ela, a individual) e grava `dados/receitas-cvm.json`, com cerca de 700 companhias. A tarefa “Receitas da CVM” do GitHub roda toda segunda e publica o arquivo se os números mudarem. Nos bancos, a receita é o resultado da intermediação financeira depois da perda esperada com crédito, mais as receitas de serviços e tarifas.

## [3.2.1] - 2026-11-18

### Alterado
- **Valores abreviados.** Receita, gasto real e os demais campos de valor aceitam “73,9 bi”, “250 mi” e “300 mil”; ao sair do campo, aparece o número inteiro. O tour usa a forma abreviada.

## [3.2.0] - 2026-11-18

### Alterado
- **Tour guiado como exercício.** A pessoa cria a análise do Banco do Brasil e preenche, ela mesma, os dados oficiais da empresa modelo: método, nome, natureza, tipo de órgão, setor, receita, origem (DRE), funcionários, um dado marcado como não encontrado e o gasto de TI real. O tour nunca troca de tela nem de aba sozinho: cada mudança é um clique da pessoa, e o Próximo espera a tarefa ser feita, com aviso de acerto. Saiu o passo que só mostrava o aviso da empresa modelo.
- **Textos do tour.** Tom mais acolhedor, e cada passo explica o porquê: por que o método vem antes, por que a origem pesa, por que marcar um dado que falta, qual a vantagem do pedido pronto para a IA em vez de perguntar direto.
- **No celular**, a página rola para o campo do passo não ficar embaixo do quadro do tour.
- **Fonte.** Texto corrido em 16px (antes 15px), no novo token `--texto`; tamanhos entre 15 e 16px passaram a 16px.

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
