# EspecificaÃ§Ã£o de domÃ­nio, dados e API

## 1. MudanÃ§a central do domÃ­nio

No cÃ³digo atual, `tenant` representa um casamento. No produto B2B, o limite comercial e de seguranÃ§a principal deve ser a **organizaÃ§Ã£o da assessoria**.

```text
Organization (assessoria pagante)
â”œâ”€â”€ Memberships (equipe)
â”œâ”€â”€ Subscription + Entitlements
â”œâ”€â”€ Templates
â”œâ”€â”€ Vendor Directory
â””â”€â”€ Events (casamentos)
    â”œâ”€â”€ Clients (casal)
    â”œâ”€â”€ Site
    â”œâ”€â”€ Guests / RSVP / Seating / Check-in
    â”œâ”€â”€ Gifts / Reservations
    â”œâ”€â”€ Tasks / Approvals
    â”œâ”€â”€ Budget / Vendors / Contracts
    â”œâ”€â”€ Documents
    â””â”€â”€ Timeline
```

MigraÃ§Ã£o conceitual:

- `tenants` atual â†’ `events`.
- `platform_users` e `admin_users` â†’ identidade gerenciada + memberships.
- `owner_id` em tenant â†’ `organization_id` no evento.
- `theme_config` JSONB â†’ `event_sites` + configuraÃ§Ãµes tipadas; JSONB apenas para tokens/tema flexÃ­vel.

## 2. Entidades principais

As colunas padrÃ£o sÃ£o omitidas nas tabelas abaixo: `id`, `created_at`, `updated_at`, `deleted_at` e, quando necessÃ¡rio, `version`.

## 2.1 Identidade e organizaÃ§Ã£o

### `profiles`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | FK para identidade do Auth |
| `display_name` | text | obrigatÃ³rio apÃ³s onboarding |
| `phone_e164` | text | opcional |
| `locale` | text | default `pt-BR` |
| `timezone` | text | IANA |

NÃ£o guardar password hash nesta tabela quando Supabase Auth for adotado.

### `organizations`

| Campo | Tipo | Regra |
|---|---|---|
| `name` | text | 2â€“120 caracteres |
| `slug` | citext/text | Ãºnico, normalizado |
| `timezone` | text | default `America/Sao_Paulo` |
| `currency` | char(3) | default `BRL` |
| `status` | enum | `active`, `suspended`, `deleting` |
| `brand_config` | jsonb | schema versionado |

### `organization_memberships`

| Campo | Tipo | Regra |
|---|---|---|
| `organization_id` | uuid | obrigatÃ³rio |
| `user_id` | uuid | obrigatÃ³rio |
| `role` | enum | owner/admin/planner/coordinator/viewer |
| `status` | enum | invited/active/suspended |
| `invited_by` | uuid | auditÃ¡vel |
| `joined_at` | timestamptz | opcional |

Ãndice Ãºnico parcial para `(organization_id,user_id)` enquanto nÃ£o excluÃ­do. Deve existir exatamente um owner ativo.

### `organization_invitations`

- `organization_id`
- `email_normalized`
- `role`
- `event_scope` opcional
- `token_hash`
- `expires_at`
- `accepted_at`
- `invited_by`

Token bruto Ã© enviado uma vez; apenas hash fica no banco.

## 2.2 Eventos e clientes

### `events`

| Campo | Tipo | Regra |
|---|---|---|
| `organization_id` | uuid | limite de tenant obrigatÃ³rio |
| `name` | text | nome interno |
| `event_type` | enum | wedding, engagement, social, other |
| `status` | enum | draft, active, completed, archived, canceled |
| `starts_at` | timestamptz | opcional no rascunho |
| `timezone` | text | IANA |
| `venue_name` | text | opcional |
| `city`/`state` | text | opcional |
| `public_slug` | text | Ãºnico no domÃ­nio padrÃ£o |
| `lead_planner_id` | uuid | membership autorizada |
| `archived_at` | timestamptz | opcional |

Ãndices: `(organization_id,status,starts_at)`, `(organization_id,lead_planner_id)` e unique em `public_slug` ativo.

### `event_assignments`

Relaciona membros da organizaÃ§Ã£o a eventos para papÃ©is que nÃ£o veem toda a carteira.

- `organization_id`
- `event_id`
- `membership_id`
- `event_role`

### `contacts`

DiretÃ³rio privado da organizaÃ§Ã£o.

- `organization_id`
- `kind`: client, guest, vendor, other
- `name`
- `email_normalized`
- `phone_e164`
- dados de endereÃ§o opcionais
- `notes_private`

### `event_clients`

- `organization_id`
- `event_id`
- `contact_id`
- `user_id` opcional apÃ³s aceitar portal
- `role`: partner, decision_maker, viewer
- `portal_status`: invited, active, revoked

## 2.3 Site e domÃ­nio

### `event_sites`

- `organization_id`
- `event_id` unique
- `status`: draft, published, unpublished
- `theme_id`
- `brand_config` jsonb tipado
- `content` jsonb versionado
- `published_version`
- `published_at`
- `seo_title`, `seo_description`

### `site_pages`

- `organization_id`
- `event_id`
- `page_type`: home, gifts, messages, rsvp, pix, custom
- `slug`
- `status`
- `content` jsonb versionado
- `sort_order`

Unique `(event_id,slug)`.

### `custom_domains`

- `organization_id`
- `event_id` opcional
- `hostname` unique
- `status`: pending, verified, active, failed
- `verification_token_hash`
- `verified_at`
- `tls_status`

## 2.4 Planejamento

### `task_templates` / `task_template_items`

Pertencem Ã  organizaÃ§Ã£o ou ao catÃ¡logo do sistema. Itens usam `offset_days` relativo ao evento.

### `event_tasks`

- `organization_id`, `event_id`
- `title`, `description`
- `status`: todo, in_progress, blocked, done, canceled
- `priority`
- `due_at`
- `assignee_membership_id` opcional
- `client_visible` boolean
- `completed_at`, `completed_by`
- `source_template_item_id` opcional
- `version`

### `task_dependencies`

Unique `(task_id,depends_on_task_id)` e check para impedir autorreferÃªncia. Ciclos sÃ£o rejeitados no service.

### `approvals`

- `organization_id`, `event_id`
- `resource_type`, `resource_id`
- `status`: pending, approved, changes_requested, canceled
- `requested_by`, `requested_at`
- `decided_by`, `decided_at`
- `decision_comment`
- `resource_version`

## 2.5 OrÃ§amento, fornecedores e contratos

### `budget_categories`

- `organization_id`, `event_id`
- `name`, `sort_order`
- `estimated_amount numeric(14,2)`

### `budget_items`

- `organization_id`, `event_id`, `category_id`
- `description`
- `estimated_amount`, `contracted_amount`
- `currency`
- `event_vendor_id` opcional
- `contract_id` opcional
- `client_visible`
- `status`

### `payment_installments`

Representa controle de planejamento, nÃ£o transaÃ§Ã£o processada.

- `organization_id`, `event_id`, `budget_item_id`
- `description`
- `amount`
- `due_date`
- `status`: planned, paid, overdue, canceled
- `paid_at`
- `payment_method_note`

### `vendors`

DiretÃ³rio da organizaÃ§Ã£o:

- `organization_id`
- `legal_name`, `display_name`, `category`
- contatos
- `notes_private`
- `rating_private`
- `status`

### `event_vendors`

- `organization_id`, `event_id`, `vendor_id`
- `status`: prospect, quoted, selected, contracted, completed, canceled
- `quoted_amount`, `contracted_amount`
- contato especÃ­fico e observaÃ§Ãµes

### `contracts`

- `organization_id`, `event_id`, `event_vendor_id`
- `document_id`
- `status`
- `signed_at`, `starts_at`, `ends_at`
- metadados, nunca o arquivo no banco relacional

## 2.6 Convidados e operaÃ§Ã£o

### `guest_groups`

- `organization_id`, `event_id`
- `name`
- `primary_contact_id`
- `max_companions`
- `invitation_status`

### `guests`

- `organization_id`, `event_id`, `group_id`
- `contact_id` opcional
- `name`
- `age_group`
- `email_normalized`, `phone_e164`
- `dietary_restrictions`
- `accessibility_notes`
- `rsvp_status`

### `invitations`

- `organization_id`, `event_id`, `group_id`
- `token_hash` unique
- `status`
- `sent_at`, `opened_at`, `expires_at`
- `max_uses`, `use_count`

### `rsvp_responses`

- `organization_id`, `event_id`, `invitation_id`
- `guest_id`
- `response`: confirmed, declined
- `source`: web, staff, import
- `submitted_at`
- `response_version`

Unique lÃ³gica para Ãºltima resposta ativa por guest; manter histÃ³rico de alteraÃ§Ãµes.

### `seating_tables` / `seat_assignments`

- Mesa: nome, capacidade, Ã¡rea, sort order.
- Assento: table_id, guest_id, seat_label opcional.
- Unique `guest_id` ativo e constraint de capacidade no service/transaÃ§Ã£o.

### `checkins`

- `organization_id`, `event_id`, `guest_id`
- `checked_in_at`
- `checked_in_by`
- `device_event_id` unique para idempotÃªncia offline
- `source`: search, qr, manual

## 2.7 Presentes, recados e PIX

### `gift_items`

Adicionar `organization_id` e substituir `tenant_id` por `event_id`. Manter os campos atuais com checks e Ã­ndices compostos.

### `gift_reservations`

- `organization_id`, `event_id`, `gift_item_id`
- dados mÃ­nimos do convidado
- `status`
- `expires_at`
- `confirmation_token_hash`
- `confirmed_at`

Ãndice Ãºnico parcial impede mais de uma reserva `pending` por gift.

### `guest_messages`

- `organization_id`, `event_id`
- `guest_name`, `message`
- `moderation_status`: pending, approved, hidden, rejected
- `moderated_by`, `moderated_at`

Public API retorna somente `approved` por select/view dedicado.

### `pix_configs`

- `organization_id`, `event_id` unique
- `enabled`
- `key_type`
- `key_ciphertext` ou segredo protegido conforme threat model
- `beneficiary_name`
- `qr_asset_id`
- `updated_by`

Nunca incluir chave PIX em logs ou analytics.

## 2.8 Documentos e arquivos

### `file_assets`

- `organization_id`, `event_id` opcional
- `storage_provider`, `bucket`, `object_key`
- `original_name`, `mime_type`, `size_bytes`, `sha256`
- `scan_status`: pending, clean, infected, failed
- `visibility`: private, client, public
- `uploaded_by`
- `retention_until`

### `documents`

- `organization_id`, `event_id`
- `title`, `category`
- `current_file_asset_id`
- `client_visible`
- `status`

### `document_versions`

HistÃ³rico imutÃ¡vel ligando documento, file asset, versÃ£o e autor.

## 2.9 Cronograma

### `timeline_templates` / `timeline_template_items`

Itens relativos ao horÃ¡rio base da cerimÃ´nia.

### `timeline_items`

- `organization_id`, `event_id`
- `title`, descriÃ§Ãµes privada/pÃºblica
- `planned_start`, `planned_end`
- `actual_start`, `actual_end`
- `status`
- `location`
- `owner_membership_id`
- `client_visible`
- `version`

### `timeline_participants`

RelaÃ§Ã£o com membro, fornecedor ou contato, contendo instruÃ§Ã£o especÃ­fica.

## 2.10 Billing, entitlements e auditoria

### `billing_customers`

- `organization_id` unique
- `provider`
- `provider_customer_id` unique

### `subscriptions`

- `organization_id`
- `provider`, `provider_subscription_id`
- `plan_code`
- `status`
- `trial_ends_at`, `current_period_start`, `current_period_end`
- `cancel_at_period_end`
- `last_provider_sync_at`

### `entitlements`

CatÃ¡logo por plano: `plan_code`, `key`, `value_json`, `effective_from/to`.

### `organization_entitlement_overrides`

Usado para contrato especial, add-on ou suporte; sempre auditado.

### `usage_counters`

- `organization_id`
- `metric_key`
- `period_start`, `period_end`
- `used`, `reserved`
- unique por organizaÃ§Ã£o/mÃ©trica/perÃ­odo

### `billing_webhook_events`

- `provider`, `provider_event_id` unique
- `event_type`
- `payload_redacted`
- `received_at`, `processed_at`
- `status`, `attempts`, `last_error_code`

### `audit_logs`

Append-only com organizaÃ§Ã£o, evento, ator, aÃ§Ã£o, alvo, request ID e diffs sanitizados. Particionar/arquivar conforme volume.

## 3. Contrato HTTP

Base: `/api/v1`.

### 3.1 Envelope de erro

Content-Type: `application/problem+json`.

```json
{
  "type": "https://docs.parasempre.app/errors/plan-limit-reached",
  "title": "Limite do plano atingido",
  "status": 403,
  "code": "PLAN_LIMIT_REACHED",
  "detail": "Seu plano permite 5 eventos ativos.",
  "request_id": "req_01...",
  "fields": {
    "active_events": "5/5"
  }
}
```

O campo `detail` Ã© seguro para o usuÃ¡rio; stacks e SQL nunca retornam.

### 3.2 PaginaÃ§Ã£o

```json
{
  "data": [],
  "page": {
    "next_cursor": "opaque",
    "has_more": false
  }
}
```

Limite padrÃ£o 25, mÃ¡ximo 100.

### 3.3 ConcorrÃªncia

Recursos editÃ¡veis retornam `ETag` ou `version`. PATCH exige `If-Match`; conflito retorna `409 VERSION_CONFLICT`.

### 3.4 IdempotÃªncia

OperaÃ§Ãµes de convite, criaÃ§Ã£o de checkout, importaÃ§Ã£o, check-in offline e confirmaÃ§Ãµes aceitam `Idempotency-Key` com escopo de usuÃ¡rio/organizaÃ§Ã£o/rota.

## 4. Endpoints

## 4.1 SessÃ£o

| MÃ©todo | Rota | Acesso |
|---|---|---|
| POST | `/auth/signup` | PÃºblico + rate limit/CAPTCHA |
| POST | `/auth/login` | PÃºblico + rate limit |
| POST | `/auth/logout` | Autenticado |
| POST | `/auth/refresh` | SessÃ£o vÃ¡lida |
| POST | `/auth/password/forgot` | PÃºblico, resposta nÃ£o enumerÃ¡vel |
| POST | `/auth/password/reset` | Token vÃ¡lido |
| GET | `/me` | Autenticado |

## 4.2 Workspaces e equipe

| MÃ©todo | Rota | PermissÃ£o |
|---|---|---|
| POST | `/organizations` | UsuÃ¡rio autenticado |
| GET | `/organizations` | Membership |
| GET/PATCH | `/organizations/:orgId` | member / owner-admin |
| GET | `/organizations/:orgId/entitlements` | member |
| GET | `/organizations/:orgId/usage` | owner-admin |
| GET/POST | `/organizations/:orgId/members` | member / owner-admin |
| PATCH/DELETE | `/organizations/:orgId/members/:id` | owner-admin |
| POST | `/organization-invitations/:token/accept` | Autenticado + token |

`orgId` Ã© validado contra membership; nÃ£o basta estar autenticado.

## 4.3 Eventos

| MÃ©todo | Rota | PermissÃ£o |
|---|---|---|
| GET/POST | `/organizations/:orgId/events` | assigned+ / criar conforme papel e entitlement |
| GET/PATCH | `/events/:eventId` | event access / planner+ |
| POST | `/events/:eventId/publish` | planner+ + entitlement |
| POST | `/events/:eventId/archive` | admin/planner autorizado |
| POST | `/events/:eventId/restore` | admin/planner autorizado |
| GET/POST | `/events/:eventId/clients` | event access / planner+ |
| POST | `/events/:eventId/clients/:id/invite` | planner+ |

## 4.4 Planejamento

- `/events/:eventId/tasks`
- `/events/:eventId/approvals`
- `/events/:eventId/budget/categories`
- `/events/:eventId/budget/items`
- `/events/:eventId/installments`
- `/organizations/:orgId/vendors`
- `/events/:eventId/vendors`
- `/events/:eventId/contracts`
- `/events/:eventId/documents`
- `/events/:eventId/timeline`

Listagem: event access. MutaÃ§Ã£o: planner/admin conforme policy. Cliente usa endpoints de portal limitados, nÃ£o os endpoints internos completos.

## 4.5 Convidados

- `/events/:eventId/guest-groups`
- `/events/:eventId/guests`
- `/events/:eventId/guest-imports`
- `/events/:eventId/invitations`
- `/events/:eventId/rsvps`
- `/events/:eventId/tables`
- `/events/:eventId/checkins`

ImportaÃ§Ã£o retorna `202 Accepted` com `job_id`.

## 4.6 Portal do casal

Usar rotas explicitamente filtradas:

- `GET /portal/events`
- `GET /portal/events/:eventId/overview`
- `GET /portal/events/:eventId/tasks`
- `GET /portal/events/:eventId/budget-summary`
- `GET /portal/events/:eventId/documents`
- `POST /portal/approvals/:approvalId/decision`
- `POST /portal/resources/:type/:id/comments`

O service aplica `client_visible`; nÃ£o reutilizar serializaÃ§Ã£o interna por conveniÃªncia.

## 4.7 API pÃºblica

Base: `/api/v1/public/events/:slug`.

| MÃ©todo | Rota | ObservaÃ§Ã£o |
|---|---|---|
| GET | `/` | Config pÃºblica sanitizada |
| GET | `/gifts` | Somente campos publicÃ¡veis |
| GET | `/gifts/:publicId` | Deve pertencer ao evento |
| POST | `/gift-reservations` | Rate limit + idempotÃªncia |
| POST | `/gift-reservations/:token/confirm` | Token de reserva |
| GET | `/messages` | Somente aprovadas |
| POST | `/messages` | Sempre pending/moderaÃ§Ã£o configurÃ¡vel |
| POST | `/rsvp/lookup` | Token ou dados mÃ­nimos, anti-enumeraÃ§Ã£o |
| POST | `/rsvp/responses` | Token nominal/idempotÃªncia |

Evitar aceitar `X-Tenant-Slug` em APIs pÃºblicas novas; o slug estÃ¡ na rota e o recurso derivado Ã© usado em todos os filtros.

## 4.8 Billing

| MÃ©todo | Rota | PermissÃ£o |
|---|---|---|
| GET | `/organizations/:orgId/billing/subscription` | owner |
| POST | `/organizations/:orgId/billing/checkout` | owner + idempotency key |
| POST | `/organizations/:orgId/billing/change-plan` | owner |
| POST | `/organizations/:orgId/billing/cancel` | owner + reauth |
| POST | `/webhooks/mercadopago` | Assinatura do provider, sem sessÃ£o de usuÃ¡rio |

## 5. Matriz de autorizaÃ§Ã£o resumida

| Recurso | Owner/Admin | Planner | Coordinator | Viewer | Client | Public |
|---|---|---|---|---|---|---|
| Billing/equipe | RW | â€” | â€” | â€” | â€” | â€” |
| Evento atribuÃ­do | RW | RW | R/operacional | R | R limitado | Publicado |
| Tarefas internas | RW | RW | R/assigned | R | â€” | â€” |
| Tarefas compartilhadas | RW | RW | R | R | R/comment | â€” |
| OrÃ§amento | RW | RW | R | R | R resumo | â€” |
| Convidados | RW | RW | RW | R | ConfigurÃ¡vel | RSVP prÃ³prio |
| Check-in | RW | RW | RW | R | â€” | token/QR |
| Documentos privados | RW | RW | atribuÃ­do | R | â€” | â€” |
| Documentos cliente | RW | RW | R | R | R | â€” |
| Site/config | RW | RW | R | R | preview | publicado |

Toda cÃ©lula ainda depende de membership/assignment do evento correto.

## 6. Eventos de domÃ­nio e jobs

### Eventos

- `OrganizationCreated`
- `MemberInvited`
- `EventCreated`
- `TemplateApplied`
- `EventPublished`
- `ClientInvited`
- `TaskOverdue`
- `ApprovalRequested`
- `RsvpSubmitted`
- `GiftReserved`
- `GiftReservationExpired`
- `GuestCheckedIn`
- `SubscriptionStatusChanged`
- `EntitlementLimitReached`
- `FileUploaded`
- `FileScanCompleted`

### Outbox

TransaÃ§Ãµes que alteram estado e exigem efeito externo gravam evento em `outbox_events` na mesma transaÃ§Ã£o. Worker publica/processa e marca `processed_at`. Isso evita perder notificaÃ§Ã£o entre commit e chamada externa.

## 7. Regras de migraÃ§Ã£o dos dados atuais

1. Criar organizaÃ§Ã£o â€œlegadoâ€ para cada owner conhecido; eventos sem owner entram em organizaÃ§Ã£o de quarentena administrativa.
2. Converter cada `tenant` em `event` mantendo slug.
3. Copiar `theme_config` para `event_sites` apÃ³s validaÃ§Ã£o por schema e versÃ£o.
4. Adicionar `organization_id` e `event_id` Ã s tabelas filhas por join, em backfill auditado.
5. Criar memberships antes de trocar autenticaÃ§Ã£o.
6. Mapear admin global manualmente; nÃ£o conceder acesso automÃ¡tico a todos os eventos.
7. Migrar imagens `BYTEA` para object storage, validar hash/MIME e reescrever URLs.
8. Ativar constraints como `NOT VALID`, validar dados e sÃ³ depois tornar `NOT NULL`.
9. Fazer dual-read curto apenas se necessÃ¡rio; evitar dual-write prolongado.
10. Manter aliases/redirects para slugs pÃºblicos antigos.

## 8. Testes obrigatÃ³rios do domÃ­nio

Para cada endpoint privado:

- usuÃ¡rio sem sessÃ£o â†’ 401;
- usuÃ¡rio de outra organizaÃ§Ã£o â†’ 404 ou 403 consistente, sem vazamento;
- membro sem papel â†’ 403;
- membro com papel â†’ sucesso;
- recurso de evento nÃ£o atribuÃ­do â†’ 403;
- body com outro `organization_id` â†’ ignorado/rejeitado;
- ID existente em outro tenant â†’ nunca alterado;
- plano sem entitlement â†’ erro `PLAN_FEATURE_DISABLED`;
- limite atingido â†’ `PLAN_LIMIT_REACHED`;
- repetiÃ§Ã£o com mesma idempotency key â†’ mesmo resultado;
- versÃ£o antiga â†’ 409.

Para billing/webhooks:

- assinatura invÃ¡lida rejeitada;
- evento duplicado nÃ£o reaplica;
- eventos fora de ordem nÃ£o regridem estado incorretamente;
- retorno do checkout sem webhook nÃ£o ativa plano.
