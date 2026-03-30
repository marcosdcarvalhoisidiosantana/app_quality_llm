# QualiDoc - Controle de Documentos de Qualidade & RAG Local

Este é um aplicativo desktop construído em **Electron.js** e **TypeScript**, focado no controle e gerenciamento de documentos de qualidade de forma simples, segura e inteligente. Agora com suporte experimental de Ingestão de Dados via RAG Local.

## 🚀 Tecnologias

- **TypeScript**: Linguagem principal do projeto, garantindo tipagem forte e maior segurança.
- **Electron.js**: Framework para criação de aplicações multiplataforma.
- **SQLite3**: Banco de dados relacional embarcado para armazenamento local.
- **Tailwind CSS**: Framework para estilização rápida e responsiva.
- **Transformers.js (@xenova)**: Modelos de IA rodando 100% offline (ex: *all-MiniLM-L6-v2*) para geração de embeddings sem custo de API usando a sua própria CPU/GPU local.
- **pdf-parse & LangChain**: Extração avançada e automatizada de texto em anexos PDF e *Semantic Chunking* pronto para bancos Vetoriais e base de conhecimento (RAG).

## 📦 Estrutura do App

O projeto contém as seguintes funcionalidades:
1. **Início (Home)**: Visão geral e introdução sobre o app.
2. **Consultar**: Listagem de todos os documentos filtrados por setor com suporte à visualização e download.
3. **Inserir**: Adição de novos documentos em PDF e formulário protegido com uso de BLOBs/Buffer seguros no banco de dados.
4. **Setores**: Área de CRUD para criar e excluir os setores/departamentos da empresa.
5. **Configurações IA (Nova)**: Tela global usando o menu nativo do Electron para configurar os hiperparâmetros de LLM, caminhos de leitura e tamanho dos chunks do Langchain salvos localmente num arquivo JSON.
6. **Pipeline RAG Local (Novo)**: Extrator/Worker desenvolvido para ler PDFs locais, fragmentá-los de forma inteligente em chunks mantendo sua semântica original e convertê-los em embeddings vetoriais.

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada, 18+).

## 🛠️ Como Instalar e Rodar o App (Modo de Desenvolvimento)

1. **Clone o repositório ou baixe os arquivos** localmente para sua máquina.
2. **Navegue até o diretório** do projeto:
   ```bash
   cd app_quality_llm
   ```

3. **Instale as dependências** do npm:
   ```bash
   npm install
   ```

4. **Inicie o aplicativo** (este comando irá compilar o TypeScript dinamicamente, os estilos do Tailwind CSS e iniciar a janela do Electron):
   ```bash
   npm run dev
   ```

### Scripts Adicionais

- `npm run watch`: Inicia o compilador TypeScript no modo de observação (`--watch`) para atualizar automaticamente arquivos modificados para a pasta `dist/`.
- `npm run start`: Inicia o aplicativo diretamente lendo os arquivos compilados da pasta `dist/`.
- `npm run build:css`: Transpila as classes utilizadas no HTML gerando o `output.css`.

## 🛡️ Segurança Adotada

- `nodeIntegration: false`: Ativo, desabilitando a renderização de APIs arriscadas dentro do contexto front-end da aplicação.
- `contextIsolation: true`: Executa a renderização das telinhas de forma totalmente isolada.
- **Comunicador IPC Seguro (`preload.ts`)**: Ponte TypeScript restrita com APIs bem definidas exportadas pela classe window garantindo zero acesso file-system direto do DOM.
