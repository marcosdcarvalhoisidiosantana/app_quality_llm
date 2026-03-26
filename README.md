# QualiDoc - Controle de Documentos de Qualidade

Este é um aplicativo desktop construído em **Electron.js** focado no controle e gerenciamento de documentos de qualidade de forma simples e segura.

## 🚀 Tecnologias

- **Electron.js**: Framework para criação de aplicações desktop multiplataforma usando tecnologias web.
- **SQLite3**: Banco de dados relacional embarcado para armazenamento local.
- **Tailwind CSS**: Framework CSS utilitário para estilização rápida e responsiva.
- **Node.js**: Backend para uso pontual e comunicação do Electron.

## 📦 Estrutura do App

O projeto contém as páginas:
1. **Início (Home)**: Visão geral e introdução sobre o app.
2. **Consultar**: Listagem de todos os documentos filtrados por setor com suporte à visualização e download de arquivos PDF.
3. **Inserir**: Formulário protegido para adicionar novos documentos PDF (somente visualização final de caminho e upload para o DB como BLOB ou buffer seguro pelo IPC).
4. **Setores**: Área de CRUD para criar e excluir os setores/departamentos da empresa.

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada, 18+).
- NPM (incluso na instalação do Node.js).

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

4. **Inicie o aplicativo**:
   Este comando irá compilar os estilos do Tailwind CSS e iniciar a janela do Electron.
   ```bash
   npm run dev
   ```

### Scripts Adicionais

- `npm run start`: Inicia o aplicativo diretamente, sem recompilar o Tailwind.
- `npm run build:css`: Transpila as classes utilizadas no HTML pelo Tailwind gerando o `output.css`.
- `npm run rebuild`: Compila ou baixa binários pré-construídos do sqlite3 caso haja conflito de versão do Node/v8 do Electron com a da máquina. Use se o banco acusar erro de binding do sqlite3.

## 🛡️ Segurança Adotada

- `nodeIntegration: false`: Ativo, desabilitando que o processo de renderização das páginas (HTML/JS front-end) execute códigos diretos do Node.js.
- `contextIsolation: true`: Executa os pacotes do processo de renderização e do Node (main) em contextos fechados.
- **Comunicador IPC Seguro (`preload.js`)**: Ponte restrita controlando quais funções Node o Front-end pode chamar de forma declarativa e limitada (sem `eval` nem acesso ao file system).
