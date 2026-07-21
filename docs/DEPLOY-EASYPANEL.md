# Deploy de produção no EasyPanel

Este projeto possui uma imagem Docker multi-stage, executa as migrações versionadas com lock antes de iniciar a API e expõe healthchecks de prontidão e vida. O primeiro lançamento recomendado é uma versão beta de produção com uma réplica.

Documentação oficial de referência: [App Service](https://easypanel.io/docs/services/app), [Builders](https://easypanel.io/docs/builders) e [Postgres Service](https://easypanel.io/docs/services/postgres).

## 1. Antes do primeiro deploy

- Faça backup do PostgreSQL e teste a restauração.
- Rotacione a senha do banco Railway que apareceu no histórico antigo do Git.
- Rotacione também a chave antiga da Pexels encontrada no histórico.
- Gere um `JWT_SECRET` exclusivo com pelo menos 48 bytes aleatórios.
- Confirme que o domínio já aponta para o servidor do EasyPanel.
- Use uma réplica inicialmente; o job de expiração roda dentro da aplicação.

Exemplo para gerar o segredo:

```bash
openssl rand -base64 48
```

## 2. Criar o App Service

1. No EasyPanel, crie um projeto e adicione um serviço do tipo **App**.
2. Em **Source**, conecte o GitHub e selecione este repositório.
3. Escolha a branch de produção. Antes do merge, use `fix/normalize-gift-prices`; depois, prefira `main`.
4. Mantenha o caminho do Dockerfile como `Dockerfile` na raiz.
5. Defina uma réplica e habilite o deploy automático somente depois do primeiro smoke test.

O EasyPanel detecta o Dockerfile e constrói as duas etapas. A imagem final contém somente dependências de runtime, os artefatos compilados e as migrações.

## 3. Variáveis de ambiente

Cadastre no serviço App:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=<segredo-aleatorio-longo>
CORS_ORIGIN=https://$(PRIMARY_DOMAIN)
TRUST_PROXY_HOPS=1
TENANT_SLUG=miejohn
DATABASE_POOL_MAX=10
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=true
VITE_DEMO_MODE=false
```

Regras:

- Nunca coloque segredos no repositório ou no Dockerfile.
- Para o PostgreSQL interno do EasyPanel, normalmente use `DATABASE_SSL=false` e a URL privada fornecida pelo serviço.
- Para um PostgreSQL externo que exige TLS, use `DATABASE_SSL=true`. Só defina `DATABASE_SSL_REJECT_UNAUTHORIZED=false` se o provedor exigir certificado não verificável e o risco tiver sido aceito.
- Se houver mais de um domínio permitido, separe as origens completas de `CORS_ORIGIN` por vírgula.
- Mantenha `DATABASE_POOL_MAX=10` e pool mínimo zero para evitar reter conexões ociosas.

## 4. Domínio, proxy e healthcheck

Em **Domains & Proxy**:

- marque o domínio público como primário;
- use protocolo HTTP entre o proxy e o container;
- configure a porta de destino como `3000`;
- deixe o EasyPanel emitir e renovar o certificado HTTPS;
- configure o healthcheck HTTP em `/api/health`.

Endpoints disponíveis:

- `GET /api/health` — prontidão, incluindo consulta ao banco;
- `GET /api/health/live` — processo HTTP ativo, sem depender do banco.

## 5. Banco e inicialização

O comando do container executa, nesta ordem:

```text
node server-dist/migrate.js
node server-dist/index.js
```

As migrações usam `app_migrations`, transações e um advisory lock do PostgreSQL. Assim, dois containers não aplicam o mesmo arquivo simultaneamente. Se uma migração falhar, a API não sobe e o deploy deve ser considerado malsucedido.

As migrações atuais são aditivas, mas o rollback do código não desfaz automaticamente o schema. Faça backup antes de qualquer release que altere dados ou remova colunas.

## 6. Smoke test do primeiro deploy

Execute na ordem:

1. Abra `/api/health` e confirme `{"ok":true,"db":true}`.
2. Abra `/api/platform/plans` e confirme a lista de planos.
3. Abra `/` e valide a landing page em HTTPS.
4. Crie uma conta em `/app/signup` e um evento de teste.
5. Teste o site público, RSVP, recado, reserva e confirmação de presente.
6. Entre no admin do evento e valide checklist, convidados, presentes e configurações.
7. Confira os logs do App e do PostgreSQL sem erros de migração, CORS ou autenticação.

## 7. Rollback

1. No EasyPanel, faça redeploy do commit anterior conhecido como estável.
2. Preserve o banco; não restaure um backup automaticamente se a release só alterou código.
3. Se houve migração destrutiva, siga o runbook específico da release e restaure apenas com janela de manutenção aprovada.
4. Rode novamente os smoke tests.

## 8. Prontidão comercial

O sistema está preparado para deploy técnico como beta de produção. Antes de vender com cobrança automática e SLA, ainda precisam ser concluídos: gateway de billing e webhooks, verificação/recuperação de e-mail, object storage, observabilidade e alertas, backups com restauração testada, termos/privacidade e suíte E2E em ambiente isolado.

Até o billing estar conectado, os upgrades geram solicitações comerciais e não liberam plano a partir do retorno do navegador.
