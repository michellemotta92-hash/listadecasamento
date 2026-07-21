# ParaSempre Studio

SaaS B2B2C para assessorias e cerimonialistas gerenciarem vários casamentos e entregarem site, RSVP, lista de presentes, Pix informativo, recados e planejamento aos clientes.

## O que já está implementado

- Conta única da plataforma e acesso a vários eventos.
- Organizações, memberships e papéis (`owner`, `admin`, `planner`, `coordinator`, `viewer`).
- Autorização por evento no servidor; IDs enviados pelo cliente nunca definem a organização.
- Landing B2B, onboarding, carteira multi-evento e painel de planos/uso.
- Catálogo de planos, entitlements, limites de eventos e solicitações de contratação.
- Checklist de planejamento com prazos, prioridades, visibilidade, versão otimista e auditoria.
- Site público, RSVP, recados moderados, presentes, Pix e configurações visuais.
- Reserva transacional de presente e confirmação protegida por token com hash.
- Migrações SQL versionadas, CI, testes, typecheck, build e auditoria de dependências.

Os módulos e critérios completos de produção estão em [docs/INDICE-PLANO-PRODUCAO.md](docs/INDICE-PLANO-PRODUCAO.md).

## Stack

- React 19, Vite 7, Tailwind CSS 4 e React Router 7.
- Express 5 e PostgreSQL.
- Migrações compatíveis com Supabase CLI; a aplicação usa conexão Postgres privada.
- Vitest e GitHub Actions.

## Desenvolvimento

Requisitos: Node.js 20.19+ e PostgreSQL 15+.

```bash
npm ci
```

Copie `.env.example` para `.env` e defina no mínimo:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=gere-uma-chave-aleatoria-longa
VITE_DEMO_MODE=false
PORT=3001
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY_HOPS=1
```

Prepare o banco e inicie frontend/API:

```bash
npm run migrate
npm run dev:all
```

URLs principais:

- `/` — landing B2B.
- `/app/signup` — criar conta e workspace.
- `/app/sites` — carteira de eventos.
- `/app/plans` — plano, uso e solicitação de contratação.
- `/{slug}` — experiência pública.
- `/{slug}/admin` — operação do evento, sem segundo login.

## Qualidade

```bash
npm run check
npm audit --audit-level=high
```

`npm run check` executa typecheck, testes e build. A mesma sequência roda em `.github/workflows/ci.yml`.

## Banco e migrações

As migrações ficam em `supabase/migrations` e são a fonte de verdade. O comando `npm run migrate` aplica os arquivos em ordem e registra cada versão em `app_migrations`.

Não execute migrações automaticamente contra produção sem backup e janela de rollback. O arquivo `supabase/schema.sql` é legado e não deve receber novas alterações.

## Produção

```bash
npm run check
npm run migrate
npm run start
```

Variáveis obrigatórias: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN` e `TRUST_PROXY_HOPS` conforme a topologia do proxy.

Antes de cobrar clientes, ainda é necessário conectar o gateway de billing/webhooks, recuperação/verificação de e-mail, object storage, observabilidade, backups testados, termos/privacidade e testes E2E em ambiente isolado. A aplicação registra solicitações de upgrade, mas não ativa um plano a partir do retorno do navegador.

## Segurança relevante

- Rotas privadas exigem token da plataforma e membership ativa na organização do evento.
- Mutações filtram também por `tenant_id` derivado no servidor.
- Recados públicos retornam somente itens aprovados.
- Links de loja aceitam apenas HTTPS.
- Uploads validam assinatura JPEG/PNG/WebP e limite de tamanho.
- A geração antiga por scraping foi desativada até existir um provedor seguro.
- RLS é habilitado como defesa adicional e papéis públicos do Data API não recebem grants implícitos.

Não use a tabela `admin_users`: ela existe apenas para migração de instalações antigas e seus endpoints retornam `410 Gone`.
