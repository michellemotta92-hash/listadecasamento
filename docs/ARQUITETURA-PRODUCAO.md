# Arquitetura de produÃ§Ã£o â€” ParaSempre Studio

## 1. Veredito tÃ©cnico

O projeto Ã© um protÃ³tipo funcional avanÃ§ado, mas nÃ£o deve receber mÃºltiplos clientes reais antes do saneamento P0. O maior risco nÃ£o Ã© performance; Ã© autorizaÃ§Ã£o multi-tenant.

## 2. Bloqueios encontrados no cÃ³digo atual

### P0 â€” quebra de isolamento e autorizaÃ§Ã£o

1. **Admin global sem vÃ­nculo com tenant**
   `server/migrate.ts` cria `admin_users` sem `tenant_id`, `organization_id` ou membership.

2. **JWT administrativo nÃ£o carrega escopo**
   `server/middleware/auth.ts` aceita apenas `userId` e `username`; `requireAuth` verifica assinatura, mas nÃ£o organizaÃ§Ã£o/evento.

3. **Tokens diferentes usam o mesmo segredo e o admin nÃ£o valida tipo**
   `platformAuth.ts` assina `{ type: 'platform' }` com o mesmo `JWT_SECRET`. `requireAuth` aceita qualquer JWT vÃ¡lido e faz cast para `AuthPayload`. Assim, token de qualquer conta da plataforma pode passar pelas rotas administrativas.

4. **Header define contexto sem verificar permissÃ£o**
   `resolveTenantSlug` aceita `X-Tenant-Slug`. Rotas administrativas usam esse slug para buscar dados, sem provar que o usuÃ¡rio pertence ao tenant.

5. **MutaÃ§Ãµes por ID nÃ£o filtram tenant**
   Em `server/routes.ts`, update/delete/reorder de presentes, mensagens e RSVP usam somente `WHERE id = $n`. Uma sessÃ£o vÃ¡lida pode modificar recurso de outro cliente se conhecer o UUID.

6. **ConfiguraÃ§Ã£o de qualquer site pode ser alterada**
   `PATCH /site-config` usa o slug do header e nÃ£o verifica ownership/membership.

7. **GestÃ£o de admins Ã© global**
   Qualquer sessÃ£o administrativa lista, cria, edita ou remove usuÃ¡rios globais.

### P0 â€” integridade do fluxo pÃºblico

1. **ConfirmaÃ§Ã£o de presente forjÃ¡vel**
   `POST /reservations/:giftId/confirm` Ã© pÃºblico e marca presente como comprado sem token da reserva.

2. **Reserva nÃ£o valida tenant da requisiÃ§Ã£o**
   O gift Ã© buscado sÃ³ por ID e a reserva herda seu tenant. O header Ã© ignorado nessa operaÃ§Ã£o.

3. **Detalhe de presente cruza tenant**
   `GET /gifts/:id` busca apenas pelo ID.

4. **Mensagens ocultas expostas**
   `GET /messages` nÃ£o exige autenticaÃ§Ã£o e sÃ³ filtra `is_approved` quando o cliente envia `?approved=true`. A ausÃªncia do parÃ¢metro retorna inclusive mensagens ocultas.

5. **RSVP permite duplicatas e enumeraÃ§Ã£o operacional**
   NÃ£o hÃ¡ convite/token, unique index ou idempotÃªncia.

### P0 â€” pipeline de qualidade e dependÃªncias

- `npx tsc --noEmit` falha com 42 erros.
- Vite transpila sem typecheck; portanto `npm run build` verde nÃ£o significa compilaÃ§Ã£o tipada vÃ¡lida.
- Apenas 6 testes unitÃ¡rios, todos de validaÃ§Ã£o.
- `npm audit --omit=dev` reporta 8 vulnerabilidades: 3 altas, 2 moderadas e 3 baixas.
- `xlsx` 0.18.5 aparece com advisories sem correÃ§Ã£o disponÃ­vel no pacote npm usado; substituir por biblioteca mantida ou mover importaÃ§Ã£o para processo isolado e estritamente validado.
- NÃ£o hÃ¡ teste E2E, de integraÃ§Ã£o, autorizaÃ§Ã£o ou concorrÃªncia.
- NÃ£o hÃ¡ CI.

### P1 â€” armazenamento e conteÃºdo

- Upload usa `multer.memoryStorage`; MIME vem do cliente e aceita qualquer `image/*`, inclusive formatos ativos como SVG.
- Imagens sÃ£o guardadas como `BYTEA` no banco principal, prejudicando backup, memÃ³ria e custo.
- Endpoint de imagens nÃ£o adiciona `X-Content-Type-Options: nosniff` nem polÃ­tica de conteÃºdo.
- RegeneraÃ§Ã£o de imagem raspa o Bing e baixa conteÃºdo externo sem limite de resposta, validaÃ§Ã£o real do arquivo ou licenÃ§a de uso.
- URLs e imagens nÃ£o sÃ£o namespaced por organizaÃ§Ã£o/evento.

### P1 â€” operaÃ§Ã£o

- `server/db.ts` fixa `ssl: false`.
- NÃ£o hÃ¡ migrations versionadas; `server/migrate.ts`, `supabase/schema.sql` e um `ALTER TABLE` no import de `routes.ts` concorrem como fontes de schema.
- `supabase/schema.sql` estÃ¡ defasado em relaÃ§Ã£o ao runtime e habilita RLS apenas em `gift_items`, com policy pÃºblica `USING (true)`.
- O handler de erro Ã© registrado antes das rotas em `server/index.ts`; erros posteriores nÃ£o ficam cobertos de forma confiÃ¡vel pelo middleware customizado.
- NÃ£o hÃ¡ `trust proxy` configurado para rate limit atrÃ¡s do Railway/reverse proxy.
- CORS vira `*` quando `CORS_ORIGIN` nÃ£o existe, inclusive por erro de configuraÃ§Ã£o.
- ExpiraÃ§Ã£o de reservas usa `setInterval` dentro do processo web; mÃºltiplas rÃ©plicas executariam o mesmo job.
- Health check testa apenas `SELECT 1`; nÃ£o distingue readiness de liveness.
- NÃ£o hÃ¡ observabilidade, alertas, tracing, filas, backup testado ou runbook.

### P1 â€” autenticaÃ§Ã£o e onboarding

- JWTs ficam no `localStorage`.
- Plataforma usa token de 7 dias; admin usa 24 horas; nÃ£o hÃ¡ refresh/revogaÃ§Ã£o/sessÃµes.
- Senha mÃ­nima Ã© 6 caracteres.
- NÃ£o hÃ¡ verificaÃ§Ã£o de e-mail, recuperaÃ§Ã£o de senha, MFA ou proteÃ§Ã£o contra credential stuffing alÃ©m de rate limit genÃ©rico.
- Criar site nÃ£o cria acesso administrativo compatÃ­vel; onboarding termina em segundo login.

## 3. Arquitetura alvo

Manter um **modular monolith** atÃ© haver escala que justifique separaÃ§Ã£o.

```mermaid
flowchart LR
    U["Assessoria, casal e convidado"] --> CDN["CDN / WAF / TLS"]
    CDN --> WEB["React + Vite"]
    WEB --> API["Express API modular"]
    API --> AUTH["Supabase Auth"]
    API --> DB["Supabase Postgres"]
    API --> STORE["Supabase Storage"]
    API --> QUEUE["Fila de jobs"]
    QUEUE --> WORKER["Worker"]
    WORKER --> EMAIL["E-mail"]
    WORKER --> MSG["WhatsApp futuro"]
    WORKER --> BILL["Mercado Pago"]
    API --> OBS["Logs, erros e mÃ©tricas"]
    WORKER --> OBS
```

### 3.1 SuperfÃ­cies

- `www.dominio`: marketing B2B e preÃ§os.
- `app.dominio`: studio autenticado e portal do casal.
- `{slug}.dominio` ou `dominio/e/{slug}`: site pÃºblico.
- DomÃ­nios customizados entram apÃ³s o MVP.

Uma SPA pode continuar no inÃ­cio com code-splitting por surface. Extrair marketing para Astro/Next sÃ³ se SEO e velocidade comercial justificarem.

### 3.2 Backend por mÃ³dulos

Estrutura sugerida:

```text
server/
  app.ts
  modules/
    auth/
    organizations/
    memberships/
    events/
    clients/
    sites/
    guests/
    rsvp/
    gifts/
    tasks/
    budgets/
    vendors/
    documents/
    timeline/
    billing/
    notifications/
    audit/
  shared/
    db/
    http/
    authz/
    jobs/
    storage/
    observability/
```

Cada mÃ³dulo contÃ©m schema de entrada, service, repository, rotas, policies e testes. Rotas nÃ£o executam SQL diretamente.

## 4. AutenticaÃ§Ã£o e autorizaÃ§Ã£o

### 4.1 Escolha

Usar Supabase Auth para identidade e remover as duas implementaÃ§Ãµes caseiras (`platform_users` e `admin_users`). E-mail/senha com PKCE no inÃ­cio; magic link e OAuth podem vir depois.

SessÃ£o recomendada:

- access token curto;
- refresh seguro;
- preferir cookie `HttpOnly`, `Secure`, `SameSite=Lax/Strict` mediado pelo backend;
- CSRF token para mutaÃ§Ãµes se autenticaÃ§Ã£o for por cookie;
- nunca guardar `service_role` no frontend.

Se a primeira fase mantiver Bearer token no cliente, aceitar apenas como transiÃ§Ã£o com CSP forte, expiraÃ§Ã£o curta e plano de migraÃ§Ã£o explÃ­cito.

### 4.2 Fonte de autorizaÃ§Ã£o

AutorizaÃ§Ã£o vem das tabelas `organization_memberships` e `event_assignments`, nÃ£o de `user_metadata` e nÃ£o do slug/header.

Fluxo de uma requisiÃ§Ã£o autenticada:

1. Validar identidade e sessÃ£o.
2. Resolver recurso por ID/slug.
3. Obter `organization_id` do recurso no banco.
4. Verificar membership ativa e papel.
5. Verificar assignment quando o papel nÃ£o tem acesso global.
6. Verificar entitlement da funÃ§Ã£o.
7. Executar query com `organization_id` e `event_id` no `WHERE`.
8. Auditar aÃ§Ã£o sensÃ­vel.

### 4.3 RLS

Mesmo com Express usando conexÃ£o confiÃ¡vel, habilitar RLS em todas as tabelas expostas ao Data API. A recomendaÃ§Ã£o atual do Supabase Ã© RLS em todo schema exposto.

Regras:

- mover tabelas internas/billing/jobs para schema nÃ£o exposto;
- nenhuma policy pÃºblica `USING (true)` em tabelas com mÃºltiplos eventos, exceto uma view pÃºblica cuidadosamente limitada;
- views pÃºblicas usam `security_invoker = true` quando aplicÃ¡vel;
- policies de update tÃªm `USING` e `WITH CHECK`;
- Ã­ndices em colunas usadas pelas policies;
- permissÃµes em `app_metadata` quando claims forem necessÃ¡rias; nunca `user_metadata`;
- testar cada policy com usuÃ¡rio A, usuÃ¡rio B, anon e service role.

MudanÃ§a recente relevante: tabelas podem nÃ£o ser expostas automaticamente ao Data/GraphQL API; grants e RLS sÃ£o controles diferentes e ambos precisam ser configurados quando o Data API for usado.

## 5. Banco e migraÃ§Ãµes

### 5.1 Fonte Ãºnica de verdade

- `supabase/migrations/*` passa a ser a Ãºnica fonte versionada.
- Remover DDL executado no import da aplicaÃ§Ã£o.
- `server/migrate.ts` deixa de criar schema em produÃ§Ã£o.
- Gerar migrations com CLI, revisar, testar em ambiente efÃªmero e aplicar via pipeline.
- Usar advisory locks ou mecanismo do provedor para impedir aplicaÃ§Ã£o concorrente.

### 5.2 ConvenÃ§Ãµes

- UUID ou UUIDv7 para chaves.
- `organization_id NOT NULL` em entidades privadas.
- `event_id NOT NULL` quando entidade Ã© de evento.
- `created_at`, `updated_at`, `deleted_at`, `version` onde necessÃ¡rio.
- `timestamptz` em UTC; `event_timezone` IANA.
- dinheiro em `numeric(14,2)` e moeda ISO; aplicaÃ§Ã£o usa centavos/decimal, nunca float.
- unique indexes parciais para recursos ativos.
- FKs com comportamento de delete explÃ­cito.
- check constraints para status e valores.

## 6. Billing

### 6.1 PrincÃ­pio

O provider cobra; o banco local decide acesso a partir de eventos de webhook verificados.

```mermaid
stateDiagram-v2
    [*] --> trialing
    trialing --> active: pagamento aprovado
    trialing --> expired: trial terminou
    active --> past_due: cobranÃ§a falhou
    past_due --> grace_period: polÃ­tica de tolerÃ¢ncia
    grace_period --> active: pagamento recuperado
    grace_period --> expired: prazo terminou
    active --> canceled: cancelamento no fim do ciclo
    canceled --> expired: perÃ­odo pago terminou
```

### 6.2 Regras

- Checkout criado apenas no backend.
- `external_reference` aponta para subscription local opaca.
- Webhook valida assinatura, busca o objeto no provider quando necessÃ¡rio e persiste evento bruto sanitizado.
- `billing_webhook_events(provider,event_id)` Ã© Ãºnico.
- Responder webhook rÃ¡pido; processamento pesado vai para fila.
- Reprocessamento Ã© seguro e idempotente.
- Frontend consulta `/billing/subscription`; nÃ£o decide plano pelo redirect.
- Adapter `BillingProvider` isola Mercado Pago de domÃ­nio.

### 6.3 Grace e downgrade

- 7 dias de `grace_period` como hipÃ³tese inicial.
- Durante grace: leitura e operaÃ§Ã£o do evento continuam; criaÃ§Ã£o premium pode ser bloqueada.
- ApÃ³s expiraÃ§Ã£o: leitura e exportaÃ§Ã£o por prazo contratual, sem novas mutaÃ§Ãµes.
- Downgrade nÃ£o apaga evento, documento ou usuÃ¡rio automaticamente.

## 7. Storage e documentos

- Supabase Storage ou R2/S3, nunca `BYTEA` no banco principal.
- Buckets privados por padrÃ£o.
- Caminho: `{organization_id}/{event_id}/{resource}/{uuid}`.
- Upload direto por URL assinada de curta duraÃ§Ã£o.
- ValidaÃ§Ã£o por magic bytes, tamanho, extensÃ£o e MIME.
- Bloquear SVG/HTML em origem pÃºblica ou sanitizar e servir de domÃ­nio separado.
- Scan de malware assÃ­ncrono.
- Thumbnails gerados em worker.
- URLs pÃºblicas apenas para assets intencionalmente publicados.
- PolÃ­tica de quota por entitlement.
- ExclusÃ£o lÃ³gica e garbage collection apÃ³s retenÃ§Ã£o.

Remover raspagem automÃ¡tica do Bing. Usar uploads licenciados, biblioteca de mÃ­dia com API/licenÃ§a ou geraÃ§Ã£o prÃ³pria autorizada.

## 8. Jobs e automaÃ§Ãµes

Jobs mÃ­nimos:

- expirar reserva;
- enviar notificaÃ§Ã£o;
- processar importaÃ§Ã£o;
- gerar PDF/exportaÃ§Ã£o;
- scan/thumbnail de arquivo;
- processar webhook;
- lembretes e automaÃ§Ãµes;
- purge apÃ³s retenÃ§Ã£o.

Requisitos:

- fila persistente baseada em Postgres/serviÃ§o gerenciado;
- idempotency key;
- retry exponencial com limite;
- dead-letter e alerta;
- locks por recurso;
- job payload contÃ©m IDs, nÃ£o dados sensÃ­veis completos;
- scheduler Ãºnico, nÃ£o `setInterval` em cada rÃ©plica web.

## 9. API e HTTP

- Prefixo `/api/v1`.
- JSON e UTF-8.
- Schemas Zod compartilhados apenas como pacote de contrato, sem importar cÃ³digo de servidor no browser.
- Erro padrÃ£o `application/problem+json`.
- `request_id` em toda resposta e log.
- PaginaÃ§Ã£o por cursor.
- ETag/version para ediÃ§Ã£o concorrente.
- `Idempotency-Key` em operaÃ§Ãµes suscetÃ­veis a repetiÃ§Ã£o.
- CORS deny-by-default com allowlist por ambiente.
- Helmet/CSP/HSTS/referrer-policy/permissions-policy.
- Body limit explÃ­cito no JSON.
- Rate limit por rota, IP e identidade, com `trust proxy` configurado para a topologia real.
- CAPTCHA adaptativo em cadastro, login suspeito, RSVP aberto e recados.

## 10. Frontend

### 10.1 Bundles e rotas

Code-splitting mÃ­nimo:

- marketing;
- auth;
- studio;
- portal do casal;
- site pÃºblico;
- admin/operaÃ§Ã£o;
- importador de planilha carregado somente quando aberto.

Definir budget inicial:

- JS inicial site pÃºblico < 200 KB gzip;
- JS inicial app autenticado < 300 KB gzip;
- nenhuma dependÃªncia pesada no chunk inicial.

### 10.2 Estado

- TanStack Query para server state.
- Form state com React Hook Form + Zod.
- Context apenas para sessÃ£o, workspace atual, tema e notificaÃ§Ãµes locais.
- Query keys sempre incluem organizaÃ§Ã£o/evento.
- Cache Ã© limpo ao trocar de workspace ou fazer logout.

### 10.3 Mobile e acessibilidade

O layout atual do admin usa sidebar fixa de 256 px e `margin-left`, sem navegaÃ§Ã£o mÃ³vel adequada. O painel do Dia D precisa ser mobile-first.

Gates:

- 360 px sem scroll horizontal;
- navegaÃ§Ã£o por teclado;
- foco visÃ­vel;
- labels reais em inputs;
- mensagens de erro associadas;
- contraste WCAG AA;
- reduÃ§Ã£o de movimento respeitada.

## 11. Observabilidade

### 11.1 Logs

JSON estruturado:

- timestamp;
- level;
- service/version/environment;
- request_id;
- route/status/duration;
- user_id pseudÃ´nimo;
- organization_id/event_id;
- error code e stack apenas no coletor privado.

Nunca logar senha, token, chave PIX, corpo de documento, e-mail completo ou mensagem de convidado.

### 11.2 Erros e mÃ©tricas

- Error tracking frontend/backend.
- MÃ©tricas: taxa de erro, latÃªncia p50/p95/p99, pool DB, filas, webhook lag, e-mails, uso/storage.
- Alertas: erro 5xx, login anormal, webhook falhando, fila parada, DB saturado, backup falho e domÃ­nio/TLS.
- Synthetic checks para landing, login, site pÃºblico e health/readiness.

## 12. SeguranÃ§a e LGPD

### 12.1 PapÃ©is legais esperados

Em geral, a assessoria decide a finalidade dos dados de seus clientes/convidados e tende a atuar como controladora; o ParaSempre processa dados sob suas instruÃ§Ãµes e tende a atuar como operador. Validar com assessoria jurÃ­dica e refletir em contrato/DPA.

### 12.2 Controles mÃ­nimos

- Termos B2B, polÃ­tica de privacidade e DPA.
- InventÃ¡rio de dados, finalidade, base legal, retenÃ§Ã£o e suboperadores.
- Canal para titulares.
- ExportaÃ§Ã£o, correÃ§Ã£o e exclusÃ£o.
- Consentimento separado para marketing.
- Opt-out e listas de supressÃ£o.
- Criptografia em trÃ¢nsito e em repouso.
- GestÃ£o de segredos e rotaÃ§Ã£o.
- 2FA nas contas de infraestrutura.
- Auditoria de acesso privilegiado.
- Plano de resposta a incidente e comunicaÃ§Ã£o.

A LGPD exige medidas de seguranÃ§a desde a concepÃ§Ã£o e prevÃª comunicaÃ§Ã£o de incidentes relevantes. Privacidade nÃ£o pode ser item pÃ³s-lanÃ§amento.

## 13. Ambientes e deploy

### 13.1 Ambientes

- Local: dados sintÃ©ticos.
- Preview por PR: banco isolado/branch e provider sandbox.
- Staging: configuraÃ§Ã£o prÃ³xima de produÃ§Ã£o, sem dados reais.
- ProduÃ§Ã£o: projetos, credenciais e domÃ­nios separados.

### 13.2 Pipeline

Em cada PR:

1. install reprodutÃ­vel com lockfile;
2. lint/format check;
3. TypeScript;
4. unit tests;
5. integration tests com Postgres;
6. testes de autorizaÃ§Ã£o multi-tenant;
7. build e bundle budget;
8. dependency/secret scan;
9. migration dry-run;
10. E2E crÃ­tico em preview.

Deploy:

- migrations compatÃ­veis antes do cÃ³digo que depende delas;
- release versionado;
- smoke test automÃ¡tico;
- rollback de aplicaÃ§Ã£o;
- migrations destrutivas em estratÃ©gia expand/contract.

## 14. Backup, recuperaÃ§Ã£o e SLO

### Beta pago

- Disponibilidade: 99,5% mensal.
- Backup diÃ¡rio verificado.
- RPO 24 h; RTO 8 h.
- Teste de restore antes do primeiro cliente pago e trimestral.

### ApÃ³s traÃ§Ã£o

- PITR habilitado.
- RPO 1 h; RTO 4 h.
- Runbook e responsÃ¡vel de plantÃ£o.
- ExportaÃ§Ã£o de storage considerada separadamente: backup do banco nÃ£o inclui automaticamente objetos do Storage.

## 15. Gates de produÃ§Ã£o

### Gate A â€” seguranÃ§a

- [ ] Uma identidade e memberships implementadas.
- [ ] Nenhuma rota mutÃ¡vel usa autenticaÃ§Ã£o sem autorizaÃ§Ã£o.
- [ ] Teste de BOLA/IDOR entre dois workspaces em todos os mÃ³dulos.
- [ ] RLS/grants revisados.
- [ ] Segredos rotacionados e fora do repositÃ³rio.
- [ ] DependÃªncias altas corrigidas/substituÃ­das.

### Gate B â€” qualidade

- [ ] Zero erros TypeScript.
- [ ] Testes unitÃ¡rios, integraÃ§Ã£o e E2E crÃ­ticos.
- [ ] CI obrigatÃ³ria na branch principal.
- [ ] MigraÃ§Ãµes versionadas e testadas.
- [ ] Bundle dentro do budget.

### Gate C â€” operaÃ§Ã£o

- [ ] Logs, error tracking, mÃ©tricas e alertas.
- [ ] Backup e restore testados.
- [ ] Jobs persistentes e idempotentes.
- [ ] Runbooks de deploy, rollback e incidente.
- [ ] Suporte e status page definidos.

### Gate D â€” negÃ³cio e legal

- [ ] Billing real com webhook idempotente.
- [ ] Entitlements no servidor.
- [ ] Termos, privacidade, DPA e polÃ­tica de retenÃ§Ã£o.
- [ ] Fluxo de exportaÃ§Ã£o/exclusÃ£o.
- [ ] Onboarding sem segundo login.

## 16. ReferÃªncias tÃ©cnicas

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase produÃ§Ã£o: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase seguranÃ§a da API: https://supabase.com/docs/guides/api/securing-your-api
- Supabase seguranÃ§a de produtos: https://supabase.com/docs/guides/security/product-security
- Mercado Pago webhooks: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks
- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
