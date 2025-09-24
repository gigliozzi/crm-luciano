# CRM do Corretor

Aplicação full-stack (Node.js + React + SQLite) para controlar contatos de clientes, com foco em lembretes automáticos de aniversário via e-mail e WhatsApp (Twilio).

## Visão geral

- **Backend**: Express.js, autenticação JWT, CRUD de contatos, agendamento diário (`node-cron`), envio de e-mail (Nodemailer) e WhatsApp (Twilio).
- **Frontend**: React + Vite, tela de login, dashboard de aniversariantes do dia e gestão completa dos contatos.
- **Banco**: SQLite armazenado em arquivo local dentro de `backend/data`.

### Estrutura de pastas

```
backend/    # API Node.js/Express
frontend/   # Aplicação React
```

## Pré-requisitos

- Node.js 18+ (recomendado) e npm
- Conta SMTP válida para envio de e-mails (p. ex. Gmail, SendGrid etc.)
- Conta Twilio habilitada para WhatsApp (ou use o modo de simulação descrito abaixo)

## Configuração do backend

1. Entre na pasta `backend` e instale as dependências:
   ```bash
   cd backend
   npm install
   ```
2. Copie o arquivo `.env.example` para `.env` e preencha conforme necessário:
   ```bash
   cp .env.example .env
   ```

   Variáveis principais:
   - `PORT`: porta de execução do servidor (default 4000)
   - `JWT_SECRET`: segredo usado para assinar tokens JWT
   - `DATABASE_FILE`: caminho do arquivo SQLite (default `data/database.sqlite`)
   - Credenciais `MAIL_*` para o servidor SMTP
   - Credenciais `TWILIO_*` para envio via WhatsApp
   - `DEFAULT_ADMIN_*`: usuário padrão criado automaticamente (e-mail/senha)

   > Caso omita as credenciais de e-mail/WhatsApp, o sistema apenas registrará os envios no console (modo simulado).

3. Inicie o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```

   A API ficará disponível em `http://localhost:4000/api`. O job de aniversários roda diariamente à meia-noite (fuso `America/Sao_Paulo`) e também imediatamente ao iniciar o servidor.

## Configuração do frontend

1. Entre na pasta `frontend` e instale as dependências:
   ```bash
   cd frontend
   npm install
   ```
2. Copie o arquivo `.env.example` para `.env` e ajuste a URL da API se necessário:
   ```bash
   cp .env.example .env
   ```

3. Inicie o servidor de desenvolvimento do React:
   ```bash
   npm run dev
   ```

   A aplicação ficará disponível em `http://localhost:5173` (Vite). O proxy não é necessário porque a API usa CORS liberado.

## Fluxo de uso

1. Faça login com o usuário padrão informado em `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`.
2. Cadastre contatos com nome, sobrenome, data de nascimento, e-mail e telefone.
3. No dashboard você verá automaticamente os aniversariantes do dia atual.
4. À meia-noite, o agendador executará o job de lembretes e disparará e-mails/WhatsApp (ou logs em modo simulado).

## Rotas principais da API

| Método | Rota                         | Descrição                      |
|--------|-----------------------------|--------------------------------|
| POST   | `/api/auth/login`           | Login com e-mail/senha         |
| POST   | `/api/auth/register`        | (Opcional) cadastro de usuário |
| GET    | `/api/contacts`             | Lista contatos                 |
| POST   | `/api/contacts`             | Cria contato                   |
| GET    | `/api/contacts/:id`         | Detalhes de contato            |
| PUT    | `/api/contacts/:id`         | Atualiza contato               |
| DELETE | `/api/contacts/:id`         | Remove contato                 |
| GET    | `/api/contacts/birthdays/today` | Aniversariantes do dia     |

> Todas as rotas (exceto `/auth/*`) exigem cabeçalho `Authorization: Bearer <token>` devolvido no login.

## Notas adicionais

- O banco SQLite é criado automaticamente em `backend/data/database.sqlite`. Inclua esta pasta no backup, mas mantenha o arquivo fora do versionamento (`.gitignore` já configurado).
- O job de lembretes utiliza `node-cron` com o agendamento `0 0 * * *` (meia-noite). Ajuste o fuso horário se necessário no arquivo `backend/src/services/scheduler.js`.
- Para desenvolvimento sem Twilio/SMTP, deixe as variáveis vazias e acompanhe os logs no console.

## Próximos passos sugeridos

- Containerizar a solução com Docker para facilitar a distribuição.
- Adicionar testes automatizados (unitários/integrados) para garantir a qualidade do código.
- Integrar com provedores reais de SMS/WhatsApp e templates de e-mail com HTML.
