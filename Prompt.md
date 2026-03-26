Estrutura de Prompt (demo simples: Electron)

1) Contexto da tarefa

Você é um(a) dev fullstack sênior. Sua missão é gerar um aplicativo para controle de documentos de qualidade (Instruções de trabalho e formulários específicos) em Electron.js com:

Página inicial padrão com uma introdução a finalidade do aplicativo.
Página Home.
Página em que seja possível inserir os documentos em pdf apenas.
Página em que seja possível consultar os documentos.
Nesta página, é necessário que seja possível consultar os documentos por diferentes áreas, com uma barra lateral separando os documentos por setor.
Página em que seja possível fazer um CRUD dos setores.
Deve ser possível fazer o download dos arquivos e visualizar eles dentro do próprio sistema.
Banco SQLite local (arquivo .sqlite) construído. Com tabelas criadas.

A tabela dos documentos deve ter o nome Doc_Qualidade e conter a seguinte estrutura que aceitem os arquivos em formato .pdf:
    IDdoc (Chave primária)
    TituloDoc
    Arquivo
    SetorDoc (IDsetor -> Chave estrangeira da tabela Set_empresa)
    EstadoDoc (Inativo, Ativo)

A tabela dos setores deve ter o nome Set_empresa e contar a seguinte estrutura:
    IDsetor (Chave primária)
    NomeSetor

Deve existe um relação entre a tabela dos setores em que um setor pode conter vários documentos, porém cada documento deve possuir apenas um setor.

Criação de um script de preaload pronto para: Expor APIs Seguras (contextBridge), Comunicação via IPC (Inter-Process Communication) e Acesso Limitado ao Node.js
Sistema pronto para rodar o electron build e rebuild se necessário.
Gerar também um README.md com instruções claras para rodar.
UI simples e bonita com Tailwind CSS
Contexto escalável para alterações futuras

2) Contexto de tom
Direto, didático e enxuto. Explique só o essencial para rodar o demo.

3) Dados de antecedentes, documentos e imagens
Você TEM acesso a MCPs, o do Playwright e do Github deve ser utilizado quando julgar necessário.

4) Descrição detalhada da tarefa e regras
Gere o código e os arquivos mínimos para o demo funcionar, sem passos desnecessários.

Requisitos técnicos:

Electron.js e sqlite.
Gerenciador: npm (obrigatório).
Dependências: liste e instale apenas o necessário.
Se certifique de que as dependências não deixem vulnerabilidades, apenas as moderadas ou baixas.
Deve-se criar um repositório no github com o projeto.

Comportamento esperado:

Rodar o aplicativo e abrir a página principal.
CRUD dos documentos funcionando corretamente.
Navegação entre as páginas também.

5) Pensar passo a passo / respirar fundo
Pense passo a passo internamente para evitar erros de caminhos/exports/imports. NÃO mostre seu raciocínio. Mostre apenas o resultado final.

6) Formatação da saída
Responda em português e siga EXATAMENTE esta ordem:

Instalação e configuração do Electron
Criação do preload e o contexto de segurança
Criação de um script e criação do db local.
Criação das páginas.
Testes de funcionamento.