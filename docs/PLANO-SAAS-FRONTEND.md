# Plano: Frontend ParaSempre â†’ SaaS robusto

> Documento de arquitetura e roadmap. **NÃ£o commitar** atÃ© vocÃª revisar e aprovar fases.
> Data: 2026-05-22

---

## 1. VisÃ£o

Transformar o frontend atual (site Ãºnico de casamento + painel admin acoplado) em uma **plataforma SaaS multi-tenant**: vÃ¡rios casais, cada um com site pÃºblico + painel, sob uma marca **ParaSempre** com Ã¡rea de marketing, onboarding e billing.

### Hoje (resumo)

| Aspecto | Estado atual |
|---------|----------------|
| Rotas | `/:domain` (pÃºblico) + `/:domain/admin` |
| Tenant | Slug na URL; API usa `TENANT_SLUG` no servidor |
| Dados | `fetch` manual em `api.ts` + services |
| Auth admin | JWT em `localStorage`, `AuthContext` booleano |
| UI | Tailwind 4 + componentes ad hoc, Motion |
| Demo | `VITE_DEMO_MODE` + `demo-store` em memÃ³ria |
| Tipos | `src/types/index.ts` alinhado ao DB |

### Alvo (SaaS)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  parasempre.com (Marketing)                                      â”‚
â”‚  Landing Â· PreÃ§os Â· Login Â· Cadastro                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  app.parasempre.com (Console da plataforma)                      â”‚
â”‚  Meus sites Â· Criar casamento Â· Plano Â· Faturamento Â· Equipe     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚ 1 site = 1 tenant
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â–¼                    â–¼                    â–¼
  ana-joao.parasempre.app  /miejohn          /casal-x
  (subdomÃ­nio)             (path legado)      (path legado)
        â”‚                    â”‚                    â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
              Site pÃºblico + Admin do casal (como hoje, melhorado)
```

---

## 2. PrincÃ­pios de design

1. **Migrar em camadas** â€” nÃ£o reescrever tudo; cada fase entrega valor e mantÃ©m o site do casal no ar.
2. **Um cÃ³digo, trÃªs superfÃ­cies** â€” marketing, console e tenant compartilham design system e cliente API.
3. **Tenant no contexto, nÃ£o no `config.ts`** â€” slug vem da URL/subdomÃ­nio; API recebe `X-Tenant-Slug`.
4. **Server state â‰  UI state** â€” TanStack Query para API; Context/Zustand sÃ³ para auth, tema preview, modais.
5. **Tipos de ponta a ponta** â€” contratos API estÃ¡veis; frontend nÃ£o adivinha JSON.
6. **Acessibilidade e mobile-first** â€” painel admin usado no celular no dia do evento.

---

## 3. Abordagens (escolha recomendada)

### OpÃ§Ã£o A â€” Monorepo (Turborepo + 3 apps)

- `apps/marketing` (Next.js ou Astro â€” SEO)
- `apps/console` (Vite + React)
- `apps/tenant` (Vite â€” extrair o atual)
- `packages/ui`, `packages/api-client`, `packages/types`

**PrÃ³s:** isolamento claro, deploy independente.
**Contras:** mais CI, mais complexidade para time pequeno.

### OpÃ§Ã£o B â€” SPA Ãºnica com route groups (recomendada para vocÃª)

Manter **um** Vite/React, reorganizar rotas:

```
/                     â†’ redirect marketing ou tenant list (logado)
/(marketing)/*        â†’ landing, pricing, signup
/app/*                â†’ console SaaS (auth plataforma)
/:tenant/*            â†’ site pÃºblico (atual)
/:tenant/admin/*      â†’ painel casal (atual)
```

**PrÃ³s:** menor custo de migraÃ§Ã£o; reaproveita 100% do cÃ³digo atual.
**Contras:** bundle maior atÃ© code-splitting; marketing SEO limitado (mitigar com prerender ou Astro depois).

### OpÃ§Ã£o C â€” Next.js full-stack no frontend

App Router com RSC, middleware de tenant por subdomÃ­nio.

**PrÃ³s:** SEO, middleware nativo.
**Contras:** reescrita grande; Express atual vira BFF ou API separada.

### RecomendaÃ§Ã£o

**Fase 0â€“2: OpÃ§Ã£o B** (SPA com grupos).
**Fase 4+:** extrair marketing para Astro/Next se SEO virar gargalo.

---

## 4. Arquitetura frontend alvo

### 4.1 Estrutura de pastas (alvo)

```
src/
â”œâ”€â”€ app/                    # bootstrap, providers globais
â”œâ”€â”€ routes/
â”‚   â”œâ”€â”€ marketing/          # landing, pricing, legal
â”‚   â”œâ”€â”€ platform/           # console SaaS
â”‚   â””â”€â”€ tenant/
â”‚       â”œâ”€â”€ public/         # Home, presentes, RSVPâ€¦
â”‚       â””â”€â”€ admin/          # painel casal
â”œâ”€â”€ features/               # domÃ­nio (gifts, rsvp, auth, billingâ€¦)
â”‚   â””â”€â”€ gifts/
â”‚       â”œâ”€â”€ components/
â”‚       â”œâ”€â”€ hooks/
â”‚       â”œâ”€â”€ api.ts
â”‚       â””â”€â”€ types.ts
â”œâ”€â”€ shared/
â”‚   â”œâ”€â”€ ui/                 # Button, Modal, DataTableâ€¦
â”‚   â”œâ”€â”€ api/                # client, interceptors, errors
â”‚   â”œâ”€â”€ lib/                # utils, themes
â”‚   â””â”€â”€ hooks/
â”œâ”€â”€ contexts/               # sÃ³ cross-cutting (Auth, Tenant, Toast)
â””â”€â”€ types/                  # re-export ou gerado do OpenAPI
```

Regra: **pÃ¡gina fina** (`pages` sÃ³ compÃµe features); lÃ³gica em `features/*`.

### 4.2 Providers (Ã¡rvore)

```
QueryClientProvider
  AuthProvider (plataforma: user + org)
    TenantProvider (slug, config, theme)   â† sÃ³ rotas /:tenant
      ThemeProvider (CSS vars do tenant)
        Router
```

- **Platform auth:** conta do casal (email/senha, OAuth futuro).
- **Tenant context:** `siteConfig`, `tenantId`, `slug`, `plan`, `limits`.
- Admin do casal usa JWT **scoped ao tenant** (nÃ£o misturar com sessÃ£o da plataforma).

### 4.3 Cliente API

Substituir `api.ts` plano por:

```ts
// shared/api/client.ts
- baseURL from env
- inject Authorization (platform | tenant-admin)
- inject X-Tenant-Slug from TenantProvider
- normalize errors â†’ ApiError { code, message, status }
- retry idempotente em GET (opcional)
```

Camada por domÃ­nio:

```ts
// features/gifts/api.ts
export const giftsApi = {
  list: (tenant) => queryKey + fetcher,
  create: â€¦
}
```

### 4.4 Server state (TanStack Query)

| Recurso | Query key | InvalidaÃ§Ã£o |
|---------|-----------|-------------|
| Site config | `['tenant', slug, 'config']` | apÃ³s PATCH config |
| Gifts | `['tenant', slug, 'gifts', filters]` | apÃ³s CRUD/reserva |
| Reservations | `['tenant', slug, 'reservations']` | apÃ³s confirmar/expirar |
| RSVP / Messages | idem | idem |

BenefÃ­cios: cache, loading/error uniformes, refetch apÃ³s mutaÃ§Ã£o, stale-while-revalidate na lista de presentes.

### 4.5 FormulÃ¡rios e validaÃ§Ã£o

- **react-hook-form** + **zod** (schemas espelham `server/validation.ts`).
- Schemas compartilhados em `packages/validation` ou duplicados com teste de paridade (Vitest).

### 4.6 Design system

| Camada | Escolha |
|--------|---------|
| Primitivos | Radix UI (Dialog, Select, Tabs, Toast) |
| Estilo | Tailwind 4 + tokens CSS |
| Componentes | shadcn/ui pattern (copiar para `shared/ui`) |
| Ãcones | lucide-react (jÃ¡ usa) |
| Tabelas admin | TanStack Table |
| GrÃ¡ficos dashboard | recharts ou tremor |

**Temas por tenant:** manter `themes.ts`; aplicar via `data-theme` + CSS variables no `TenantProvider`.

### 4.7 Rotas e multi-tenant

**ResoluÃ§Ã£o do tenant (ordem):**

1. SubdomÃ­nio `*.parasempre.app` â†’ slug
2. Path `/:tenant/...` (legado)
3. Fallback 404 / pÃ¡gina â€œsite nÃ£o encontradoâ€

**Middleware Vite (dev):** proxy ou plugin que simula subdomÃ­nio em `localhost`.

**Router (react-router 7):**

```tsx
[
  { path: '/', element: <MarketingLayout />, children: [...] },
  { path: '/app', element: <PlatformGuard />, children: [
      { path: 'sites', element: <SitesListPage /> },
      { path: 'sites/new', element: <OnboardingWizard /> },
      { path: 'billing', element: <BillingPage /> },
    ]},
  { path: '/:tenant', element: <TenantResolver />, children: [
      { element: <PublicLayout />, children: [...] },
      { path: 'admin', element: <TenantAdminGuard />, children: [...] },
    ]},
]
```

`TenantResolver`: GET `/api/tenants/:slug/public` â†’ 404 se inexistente; hidrata `TenantProvider`.

---

## 5. SuperfÃ­cies do produto (UX)

### 5.1 Marketing (`/`)

- Hero + prova social
- Funcionalidades (lista presentes, RSVP, Pix, recados)
- Tabela de planos (Free / Pro / Premium)
- FAQ, termos, privacidade
- CTA: â€œCriar meu site grÃ¡tisâ€ â†’ `/app/sites/new`

### 5.2 Console plataforma (`/app`)

| Tela | FunÃ§Ã£o |
|------|--------|
| Login / Signup | Conta ParaSempre (nÃ£o confundir com admin do site) |
| Dashboard | Lista de sites, status publicado, uso do plano |
| Novo site (wizard) | Slug, nomes, data, template â†’ cria tenant |
| Site settings | DomÃ­nio custom (futuro), excluir site |
| Billing | Stripe Customer Portal (fase posterior) |
| Equipe | Convidar co-organizador (fase posterior) |

### 5.3 Site do casal (`/:tenant`) â€” evoluÃ§Ã£o do atual

Melhorias sem mudar conceito:

- Skeleton loaders nas listas
- Busca e filtros persistentes na URL (`?q=&room=`)
- PÃ¡gina offline-friendly (service worker leve, opcional)
- SEO: meta por tenant (jÃ¡ parcial em `PublicLayout`)
- Preview de tema no admin com query `?preview_theme=` (jÃ¡ existe)

### 5.4 Admin do casal (`/:tenant/admin`) â€” evoluÃ§Ã£o

- Layout responsivo (drawer mobile)
- DataTable com paginaÃ§Ã£o server-side (quando > 100 presentes)
- Bulk actions (importar XLSX jÃ¡ existe â€” integrar na nova tabela)
- Indicadores no dashboard: reservas pendentes, RSVPs, recados nÃ£o lidos
- Empty states e onboarding checklist (â€œadicione 5 presentesâ€, â€œconfigure Pixâ€)

---

## 6. Modelo de dados e API (contrato frontend)

O DB jÃ¡ tem `tenants`. O backend precisa evoluir em paralelo (nÃ£o sÃ³ frontend):

### Novos endpoints (sugeridos)

| MÃ©todo | Rota | Uso frontend |
|--------|------|----------------|
| GET | `/api/tenants/:slug/public` | Resolver tenant + config pÃºblica |
| POST | `/api/platform/auth/register` | Signup SaaS |
| POST | `/api/platform/auth/login` | Login plataforma |
| GET | `/api/platform/sites` | Lista sites do usuÃ¡rio |
| POST | `/api/platform/sites` | Criar tenant + site default |
| GET | `/api/platform/sites/:id` | Detalhe + mÃ©tricas |
| PATCH | `/api/platform/sites/:id` | Plano, slug, suspender |

Rotas atuais `/api/gifts`, etc. passam a exigir **`X-Tenant-Slug`** (ou JWT com `tenantId` claim) em vez de `TENANT_SLUG` fixo no servidor.

### Entidades TypeScript (extensÃ£o)

```ts
type PlanId = 'free' | 'pro' | 'premium';

interface PlatformUser {
  id: string;
  email: string;
  name: string;
}

interface SiteSummary {
  id: string;
  slug: string;
  couple_name: string;
  event_date: string | null;
  plan: PlanId;
  status: 'draft' | 'published' | 'suspended';
  gift_count: number;
  created_at: string;
}

interface TenantLimits {
  max_gifts: number;
  custom_domain: boolean;
  remove_branding: boolean;
}
```

`TenantProvider` expÃµe `limits` para esconder features na UI (upgrade CTA).

---

## 7. Planos comerciais (impacto no frontend)

| Recurso | Free | Pro | Premium |
|---------|------|-----|---------|
| Presentes | 20 | 100 | Ilimitado |
| PÃ¡ginas | Todas | Todas | Todas |
| Branding â€œParaSempreâ€ | Sim | Opcional | NÃ£o |
| DomÃ­nio custom | â€” | â€” | Sim |
| Temas premium | 3 | 10 | Todos |
| Export RSVP | â€” | CSV | CSV + API |

UI: componente `<UpgradeGate feature="remove_branding" />` no admin e footer pÃºblico.

---

## 8. SeguranÃ§a e robustez (frontend)

| Item | AÃ§Ã£o |
|------|------|
| Token | `httpOnly` cookie para platform (ideal); atÃ© lÃ¡, `sessionStorage` + rotaÃ§Ã£o |
| Tenant admin JWT | Claim `tenant_id`; validar no client que slug da URL bate |
| CSRF | SameSite cookies quando migrar |
| XSS | Sanitizar recados renderizados (DOMPurify) |
| Rate limit | UI: mensagem amigÃ¡vel quando API retorna 429 |
| Erros | Error Boundary por rota + pÃ¡gina 500 tenant |
| Env | `VITE_*` documentados; nunca secret no bundle |

---

## 9. Roadmap por fases

### Fase 0 â€” FundaÃ§Ã£o (1â€“2 semanas)

**Objetivo:** preparar o terreno sem mudar UX visÃ­vel.

- [ ] Reorganizar pastas â†’ `features/` + `shared/`
- [ ] Instalar `@tanstack/react-query`, `zod`, `react-hook-form`
- [ ] Criar `TenantProvider` + hook `useTenant()`
- [ ] Migrar `getSiteConfig` e `useGifts` para Query
- [ ] Cliente API com `X-Tenant-Slug` do `useParams().domain`
- [ ] Error boundary + pÃ¡gina 404 tenant
- [ ] Extrair 5â€“8 componentes para `shared/ui` (Button, Modal, Input, Badge, Skeleton)

**CritÃ©rio de pronto:** site `miejohn` funciona igual; menos `useState`+`useEffect` manual nas pÃ¡ginas.

---

### Fase 1 â€” Console mÃ­nimo (2â€“3 semanas)

**Objetivo:** primeiro passo SaaS â€” criar segundo site sem cÃ³digo.

- [ ] Rotas `/app/*` com layout prÃ³prio (sidebar escura, diferente do casal)
- [ ] Auth plataforma (signup/login) â€” backend novo
- [ ] `SitesListPage` + `CreateSiteWizard` (slug, nomes, data)
- [ ] ApÃ³s criar â†’ redirect `/:slug/admin`
- [ ] Login plataforma separado do login `/:slug/admin/login` (unificar UX depois)

**CritÃ©rio de pronto:** usuÃ¡rio cria conta, cria site `casal-teste`, vÃª lista vazia de presentes, configura.

---

### Fase 2 â€” Multi-tenant real no frontend (1â€“2 semanas)

- [ ] Remover `defaultTenant: 'miejohn'` de `config.ts`
- [ ] `TenantResolver` com loading/404
- [ ] Todas as chamadas API passam slug dinÃ¢mico
- [ ] Demo mode: seletor de tenant fake no dev
- [ ] Testes E2E (Playwright): dois tenants isolados

---

### Fase 3 â€” Admin robusto (2â€“3 semanas)

- [ ] Dashboard com cards mÃ©tricos (Query agregations ou endpoint `/stats`)
- [ ] DataTable presentes (sort, filter, pagination)
- [ ] FormulÃ¡rios config com zod + autosave debounced
- [ ] Checklist onboarding no admin
- [ ] Toast/unified feedback (jÃ¡ tem `ToastContext` â€” padronizar)

---

### Fase 4 â€” Marketing e conversÃ£o (2 semanas)

- [ ] PÃ¡ginas `/`, `/pricing`, `/signup`
- [ ] Comparativo de planos + `<UpgradeGate />`
- [ ] Footer com link para console
- [ ] (Opcional) Astro/Next sÃ³ para marketing se precisar SEO

---

### Fase 5 â€” Billing e escala (3+ semanas)

- [ ] Stripe Checkout + Customer Portal
- [ ] Webhooks â†’ atualizar `plan` no tenant
- [ ] Limites enforced na UI + API
- [ ] SubdomÃ­nios em produÃ§Ã£o (`*.parasempre.app`)
- [ ] DomÃ­nio custom (CNAME) â€” Premium

---

## 10. Stack sugerida (adicionar ao projeto)

| Pacote | Motivo |
|--------|--------|
| `@tanstack/react-query` | Server state, cache, mutations |
| `@tanstack/react-table` | Admin tables |
| `react-hook-form` + `@hookform/resolvers` | FormulÃ¡rios |
| `zod` | ValidaÃ§Ã£o + tipos |
| `@radix-ui/react-*` | Acessibilidade |
| `class-variance-authority` | Variantes de componentes (shadcn) |
| `@playwright/test` | E2E multi-tenant |
| `msw` | Mock API em dev/storybook |

**NÃ£o adicionar ainda:** Redux, Next.js (atÃ© Fase 4), GraphQL (REST suficiente).

---

## 11. MigraÃ§Ã£o de cÃ³digo existente (mapa)

| Atual | Destino |
|-------|---------|
| `src/pages/public/*` | `src/routes/tenant/public/` ou `features/*/pages` |
| `src/pages/admin/*` | `src/routes/tenant/admin/` |
| `src/lib/services/*` | `src/features/*/api.ts` + hooks Query |
| `src/lib/api.ts` | `src/shared/api/client.ts` |
| `src/contexts/AuthContext.tsx` | `features/auth` (split platform vs tenant) |
| `src/components/ui/Modal.tsx` | `shared/ui/dialog.tsx` (Radix) |
| `src/lib/demo-data.ts` | `features/dev/demo-provider.tsx` |
| `GiftReservationFlow.tsx` | `features/gifts/reservation-flow.tsx` (sem mudar lÃ³gica) |

---

## 12. Riscos e mitigaÃ§Ã£o

| Risco | MitigaÃ§Ã£o |
|-------|-----------|
| Bundle gigante | `React.lazy` por rota (marketing, app, tenant) |
| Duas autenticaÃ§Ãµes confusas | Labels claros: â€œConta ParaSempreâ€ vs â€œPainel do casamentoâ€ |
| Backend single-tenant | Fase 2 bloqueada atÃ© API aceitar slug por request |
| RegressÃ£o reservas | Playwright: fluxo reserva + expira em CI |
| Scope creep | Uma fase por PR interno; nÃ£o pular Fase 0 |

---

## 13. MÃ©tricas de sucesso

- Tempo para criar site novo (signup â†’ primeiro presente): **< 10 min**
- Lighthouse mobile site pÃºblico: **> 85**
- Zero chamadas API sem tenant slug (audit grep)
- Admin usÃ¡vel em viewport 375px
- 80% das telas admin com loading skeleton (nÃ£o flash vazio)

---

## 14. O que NÃƒO fazer agora

- Reescrever em Next.js de uma vez
- Micro-frontends
- GraphQL
- Commit/push sem sua revisÃ£o (conforme pedido)
- Billing antes do console criar sites (Fase 5 depois de 1â€“2)

---

## 15. PrÃ³ximo passo imediato (quando for implementar)

1. Aprovar **OpÃ§Ã£o B** (SPA com route groups) ou A/C.
2. Executar **Fase 0** checklist (Query + TenantProvider + pastas).
3. Definir contrato mÃ­nimo com backend: `GET /tenants/:slug/public` + `POST /platform/sites`.
4. SÃ³ entÃ£o UI do wizard de criaÃ§Ã£o de site.

---

## ApÃªndice A â€” Exemplo de `TenantProvider`

```tsx
// contexts/TenantContext.tsx
export function TenantProvider({ slug, children }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant', slug, 'public'],
    queryFn: () => tenantsApi.getPublic(slug),
    enabled: !!slug,
  });

  if (isLoading) return <TenantShellSkeleton />;
  if (error || !data) return <TenantNotFound slug={slug} />;

  return (
    <TenantContext.Provider value={data}>
      <ThemeProvider theme={data.config.theme}>{children}</ThemeProvider>
    </TenantContext.Provider>
  );
}
```

## ApÃªndice B â€” Exemplo de code-splitting

```tsx
const PlatformApp = lazy(() => import('@/routes/platform'));
const TenantPublic = lazy(() => import('@/routes/tenant/public'));
// router.tsx â€” Suspense por segmento
```

---

*Fim do plano. RevisÃ£o: ajustar prazos, planos comerciais e escolha A/B/C antes de codar.*
