# Roadmap de execuÃ§Ã£o â€” ParaSempre Studio

## 1. Premissas

- Estimativas para uma pessoa full-stack experiente, com apoio parcial de design/QA.
- Intervalos incluem implementaÃ§Ã£o e testes, nÃ£o espera de terceiros ou jurÃ­dico.
- Com duas pessoas, o calendÃ¡rio reduz, mas dependÃªncias P0 continuam sequenciais.
- NÃ£o vender acesso multi-cliente antes do Gate 0.
- Cada fase deve terminar em software demonstrÃ¡vel e telemetria utilizÃ¡vel.

## 2. VisÃ£o das fases

| Fase | Objetivo | Estimativa | Resultado |
|---|---|---:|---|
| 0 | Resgate tÃ©cnico e seguranÃ§a | 3â€“5 semanas | Base segura para dados reais |
| 1 | Beta B2B vendÃ¡vel | 5â€“8 semanas | Primeiras 5â€“10 assessorias |
| 2 | Planejamento profissional | 6â€“9 semanas | Produto substitui parte das planilhas |
| 3 | OperaÃ§Ã£o premium | 6â€“9 semanas | Dia D, mesas e check-in |
| 4 | Crescimento e escala | contÃ­nuo | DomÃ­nios, automaÃ§Ãµes, IA e integraÃ§Ãµes |

CalendÃ¡rio provÃ¡vel para uma pessoa: 5 a 7 meses atÃ© um Pro consistente. O beta pago restrito pode comeÃ§ar apÃ³s 8 a 13 semanas, desde que todos os gates P0 estejam cumpridos.

## 3. Fase 0 â€” resgate tÃ©cnico e seguranÃ§a

### Objetivo

Eliminar riscos que tornam o SaaS inseguro e criar um pipeline confiÃ¡vel.

### Sprint 0.1 â€” baseline e CI

- [ ] Congelar snapshot do schema e dados de teste.
- [ ] Corrigir os 42 erros TypeScript.
- [ ] Separar tsconfig de app/server/scripts.
- [ ] Adicionar ESLint/format check.
- [ ] CI: install, typecheck, test, build e audit.
- [ ] Definir bundle budget.
- [ ] Atualizar React Router/Vite e dependÃªncias corrigÃ­veis.
- [ ] Substituir `xlsx` ou isolar importaÃ§Ã£o com biblioteca mantida.

Aceite:

- `npm run typecheck`, `npm test` e `npm run build` verdes em CI limpa.
- Zero vulnerabilidade alta conhecida sem exceÃ§Ã£o documentada e aprovada.

### Sprint 0.2 â€” identidade e tenant isolation

- [ ] Escolher e configurar Supabase Auth.
- [ ] Criar `organizations`, memberships e events.
- [ ] Migrar conta da plataforma e remover login admin por evento.
- [ ] Middleware `requireIdentity`, `requireOrganizationRole` e `requireEventAccess`.
- [ ] Todas as queries mutÃ¡veis filtradas por organizaÃ§Ã£o/evento.
- [ ] Testes de dois workspaces em todas as rotas atuais.
- [ ] Separar segredo/sessÃ£o e revogaÃ§Ã£o.
- [ ] RecuperaÃ§Ã£o de senha e verificaÃ§Ã£o de e-mail.

Aceite:

- UsuÃ¡rio A nÃ£o lÃª nem altera qualquer recurso de B, mesmo trocando slug/header/UUID.
- Criar evento concede acesso imediato sem segundo login.

### Sprint 0.3 â€” integridade pÃºblica

- [ ] Nova API pÃºblica com slug na rota.
- [ ] Presente detail e reserva vinculados ao evento.
- [ ] Token de confirmaÃ§Ã£o de reserva com hash.
- [ ] Mensagens pÃºblicas retornam sÃ³ aprovadas.
- [ ] RSVP deduplicado e idempotente.
- [ ] CAPTCHA adaptativo e rate limit com proxy correto.
- [ ] Testes concorrentes de reserva/expiraÃ§Ã£o/confirm.

### Sprint 0.4 â€” dados e operaÃ§Ã£o

- [ ] Criar migrations Supabase versionadas.
- [ ] Remover DDL de runtime e schema duplicado.
- [ ] RLS/grants revisados.
- [ ] Migrar uploads para object storage.
- [ ] Remover scraping de imagens.
- [ ] Mover expiraÃ§Ã£o para job persistente.
- [ ] Handler de erro no final, security headers, CORS allowlist e body limits.
- [ ] Logs estruturados, error tracking e health/readiness.
- [ ] Backup e restore testados.

### Gate 0

- [ ] Zero falha P0 de autorizaÃ§Ã£o conhecida.
- [ ] CI obrigatÃ³ria.
- [ ] Dois tenants isolados em E2E.
- [ ] Dados e storage com backup.
- [ ] Runbook de deploy/rollback/incidente.

## 4. Fase 1 â€” beta B2B vendÃ¡vel

### Objetivo

Permitir que uma assessoria crie, publique e cobre valor com a experiÃªncia digital existente.

### Ã‰pico 1.1 â€” landing e onboarding B2B

- [ ] Reescrever landing para assessorias.
- [ ] PÃ¡gina de preÃ§os real e FAQ.
- [ ] Trial com plano definido.
- [ ] Wizard: workspace â†’ template â†’ evento â†’ marca â†’ publicaÃ§Ã£o â†’ convite do casal.
- [ ] Checklist de ativaÃ§Ã£o.
- [ ] Demo isolada por evento.
- [ ] Corrigir geraÃ§Ã£o/ediÃ§Ã£o de slug e validar comportamento visual.

Aceite:

- UsuÃ¡rio novo publica evento e convida cliente em menos de 30 minutos sem suporte.

### Ã‰pico 1.2 â€” carteira e marca

- [ ] Dashboard multi-evento.
- [ ] Status e arquivamento.
- [ ] Logo, cores e textos da assessoria.
- [ ] VisÃ£o de uso do plano.
- [ ] ResponsÃ¡vel por evento.
- [ ] NavegaÃ§Ã£o mobile do admin.

### Ã‰pico 1.3 â€” portal bÃ¡sico do casal

- [ ] Convite de uso Ãºnico.
- [ ] Overview com site, RSVP, prÃ³ximos passos e documentos compartilhados.
- [ ] ComentÃ¡rios/atividade.
- [ ] ConfiguraÃ§Ã£o de visibilidade.

### Ã‰pico 1.4 â€” billing e entitlements

- [ ] Adapter Mercado Pago.
- [ ] Checkout sandbox/produÃ§Ã£o.
- [ ] Webhook verificado e idempotente.
- [ ] Subscription state machine.
- [ ] Entitlements e usage counters no backend.
- [ ] Upgrade, downgrade, cancelamento e grace.
- [ ] E-mails transacionais de billing.

### Ã‰pico 1.5 â€” legal e suporte

- [ ] Termos B2B, privacidade, DPA e polÃ­tica de retenÃ§Ã£o revisados por jurÃ­dico.
- [ ] Consentimento e comunicaÃ§Ã£o de convidados.
- [ ] ExportaÃ§Ã£o/exclusÃ£o de workspace.
- [ ] Central de ajuda mÃ­nima.
- [ ] Canal de suporte e SLA do beta.

### Gate 1 â€” beta pago

- [ ] Cinco assessorias onboardadas.
- [ ] TrÃªs eventos reais publicados com consentimento.
- [ ] Billing end-to-end confirmado por webhook.
- [ ] AtivaÃ§Ã£o > 50% dos trials assistidos.
- [ ] Nenhum incidente de isolamento.
- [ ] Erros crÃ­ticos alertados em atÃ© 5 minutos.

## 5. Fase 2 â€” planejamento profissional

### Objetivo

Fazer o produto substituir planilhas centrais do planejamento.

### Ã‰pico 2.1 â€” templates e tarefas

- [ ] Templates â€œcompletaâ€ e â€œDia Dâ€.
- [ ] Datas relativas.
- [ ] Tarefas, marcos, responsÃ¡veis, prioridades e visibilidade.
- [ ] VisÃµes lista/calendÃ¡rio/minhas tarefas.
- [ ] AprovaÃ§Ãµes do casal.
- [ ] NotificaÃ§Ãµes de vencimento.

### Ã‰pico 2.2 â€” orÃ§amento

- [ ] Categorias e itens.
- [ ] Estimado/contratado/pago/pendente/vencido.
- [ ] Parcelas e alertas.
- [ ] Resumo do casal.
- [ ] ExportaÃ§Ã£o PDF/CSV.

### Ã‰pico 2.3 â€” fornecedores e contratos

- [ ] DiretÃ³rio do workspace.
- [ ] VÃ­nculo por evento.
- [ ] Status e valores.
- [ ] Documentos versionados.
- [ ] AvaliaÃ§Ã£o privada.

### Ã‰pico 2.4 â€” documentos

- [ ] Pastas/categorias lÃ³gicas.
- [ ] Scan de malware.
- [ ] VersÃµes e auditoria.
- [ ] Compartilhamento com casal.
- [ ] Quotas por plano.

### Gate 2

- [ ] 60% dos workspaces ativos usam tarefas semanalmente.
- [ ] 40% dos eventos usam orÃ§amento ou fornecedores.
- [ ] Pelo menos 3 clientes relatam reduÃ§Ã£o de planilhas/WhatsApp.
- [ ] Churn de 90 dias abaixo de 15% no grupo inicial.

## 6. Fase 3 â€” operaÃ§Ã£o premium

### Ã‰pico 3.1 â€” convidados avanÃ§ados

- [ ] FamÃ­lias/grupos.
- [ ] ImportaÃ§Ã£o validada.
- [ ] RSVP nominal por token.
- [ ] Segmentos e lembretes.
- [ ] RelatÃ³rios e restriÃ§Ãµes.

### Ã‰pico 3.2 â€” mesas

- [ ] Mesas/capacidade.
- [ ] AlocaÃ§Ã£o e conflitos.
- [ ] ImpressÃ£o/exportaÃ§Ã£o.

### Ã‰pico 3.3 â€” check-in

- [ ] Busca rÃ¡pida.
- [ ] QR opaco.
- [ ] IdempotÃªncia/offline limitado.
- [ ] MÃ©tricas de chegada.

### Ã‰pico 3.4 â€” cronograma Dia D

- [ ] Template relativo Ã  cerimÃ´nia.
- [ ] ResponsÃ¡veis e fornecedores.
- [ ] VisÃµes filtradas.
- [ ] Status real e atraso.
- [ ] Modo mÃ³vel/offline.
- [ ] PDF pÃºblico/privado.

### Gate 3

- [ ] Teste de carga compatÃ­vel com pico de check-in.
- [ ] SimulaÃ§Ã£o offline e reconciliaÃ§Ã£o concluÃ­da.
- [ ] OperaÃ§Ã£o piloto em dois eventos com plano de fallback em papel/CSV.
- [ ] Nenhuma duplicidade de check-in ou perda de mudanÃ§a.

## 7. Fase 4 â€” crescimento e escala

Priorizar conforme uso, nÃ£o pela novidade.

- [ ] DomÃ­nio customizado automatizado.
- [ ] E-mail com domÃ­nio/branding do workspace.
- [ ] WhatsApp oficial com consentimento, templates e crÃ©ditos.
- [ ] Google Calendar.
- [ ] Assinatura eletrÃ´nica via parceiro.
- [ ] ImportaÃ§Ã£o assistida por IA.
- [ ] Resumos e sugestÃµes de pendÃªncias.
- [ ] API/integraÃ§Ãµes para Studio.
- [ ] Marketplace de templates.
- [ ] RelatÃ³rios de capacidade e margem do escritÃ³rio.

## 8. Backlog P0 em formato de tickets

| ID | Ticket | DependÃªncia |
|---|---|---|
| SEC-001 | Impedir token platform em rotas admin | Nenhuma |
| SEC-002 | Criar membership e escopo organizacional | SEC-001 |
| SEC-003 | Aplicar autorizaÃ§Ã£o em toda rota privada | SEC-002 |
| SEC-004 | Filtrar todas as mutaÃ§Ãµes por org/event | SEC-002 |
| SEC-005 | Corrigir confirmaÃ§Ã£o pÃºblica de presente | Nenhuma |
| SEC-006 | Ocultar mensagens nÃ£o aprovadas da API pÃºblica | Nenhuma |
| SEC-007 | RLS/grants em schemas expostos | Modelo novo |
| AUTH-001 | Unificar logins | SEC-002 |
| AUTH-002 | VerificaÃ§Ã£o de e-mail e reset de senha | AUTH-001 |
| DATA-001 | Consolidar migrations | Nenhuma |
| DATA-002 | Migrar tenant â†’ event + organization | DATA-001 |
| STOR-001 | Migrar BYTEA para object storage | DATA-001 |
| OPS-001 | Jobs persistentes para expiraÃ§Ã£o | DATA-001 |
| OPS-002 | Observabilidade e alertas | Nenhuma |
| QA-001 | Corrigir 42 erros TypeScript | Nenhuma |
| QA-002 | Testes de autorizaÃ§Ã£o multi-tenant | SEC-003 |
| QA-003 | E2E signup â†’ evento â†’ portal/site | AUTH-001 |
| DEP-001 | Atualizar deps e remover xlsx vulnerÃ¡vel | Nenhuma |
| UX-001 | Corrigir slug no wizard | Nenhuma |
| UX-002 | Admin mobile | Design system |

## 9. Plano de validaÃ§Ã£o antes de construir tudo

### Semana de descoberta

Entrevistar 10 profissionais. Perguntas:

1. Quantos eventos ativos e quantas pessoas na equipe?
2. Quais planilhas/processos sÃ£o reutilizados?
3. Onde ocorrem mais cobranÃ§as ou erros?
4. O casal recebe algum portal hoje?
5. Quanto tempo leva para configurar um novo evento?
6. Qual ferramenta jÃ¡ paga e quanto?
7. Qual funÃ§Ã£o faria trocar de processo?
8. PreferÃªncia de cobranÃ§a mensal/anual e faixa aceitÃ¡vel?

NÃ£o apresentar features antes de entender o processo atual.

### Testes de proposta

Criar trÃªs versÃµes de landing/demo:

- A: Portal white-label e site.
- B: Planejamento e reduÃ§Ã£o de planilhas.
- C: OperaÃ§Ã£o de RSVP e Dia D.

MÃ©trica: pedido de demo qualificado e intenÃ§Ã£o de pagar, nÃ£o clique genÃ©rico.

### Concierge beta

- Importar manualmente uma planilha por cliente.
- Configurar template junto com a assessoria.
- Acompanhar primeiro evento.
- Registrar tempo gasto, dÃºvidas e funÃ§Ãµes ignoradas.

## 10. Definition of Done

Uma histÃ³ria sÃ³ estÃ¡ pronta quando:

- critÃ©rios de aceite aprovados;
- autorizaÃ§Ã£o positiva e negativa testada;
- migrations revisadas e reversibilidade documentada;
- validaÃ§Ã£o frontend/backend;
- loading, empty, error e permission states;
- acessibilidade e mobile verificados;
- logs/telemetria sem dados sensÃ­veis;
- unit/integration/E2E proporcionais ao risco;
- documentaÃ§Ã£o e suporte atualizados;
- feature flag e rollback quando necessÃ¡rio;
- mÃ©tricas de sucesso definidas.

## 11. Checklist do primeiro lanÃ§amento pago

### Produto

- [ ] Conta Ãºnica e onboarding completo.
- [ ] Workspace, evento, portal e site funcionais.
- [ ] Trial, planos e checkout.
- [ ] Limites e upgrade claros.
- [ ] ExportaÃ§Ã£o bÃ¡sica.

### SeguranÃ§a

- [ ] Pentest focado em BOLA/IDOR, auth e uploads.
- [ ] MFA na infraestrutura.
- [ ] Secrets scan e rotaÃ§Ã£o.
- [ ] RLS/advisors sem achado crÃ­tico.
- [ ] DependÃªncias sem alta conhecida.

### OperaÃ§Ã£o

- [ ] Status page e canal de suporte.
- [ ] Alertas e on-call definido.
- [ ] Restore testado.
- [ ] Runbook de incidente.
- [ ] Provider de e-mail com SPF/DKIM/DMARC.

### Legal/comercial

- [ ] Termos, privacidade e DPA.
- [ ] PolÃ­tica de cancelamento/reembolso.
- [ ] Nota fiscal e processo contÃ¡bil definidos.
- [ ] Consentimento de comunicaÃ§Ãµes.
- [ ] Contrato e SLA do plano Studio.

## 12. PrÃ³ximas dez aÃ§Ãµes concretas

1. Revisar e aprovar o posicionamento B2B â€œParaSempre Studioâ€.
2. Entrevistar 10 assessorias antes de fechar preÃ§os.
3. Criar branch de estabilizaÃ§Ã£o e tornar CI obrigatÃ³ria.
4. Corrigir TypeScript e dependÃªncias.
5. Projetar migration organization/event/membership.
6. Unificar autenticaÃ§Ã£o e remover admin global.
7. Escrever suÃ­te de isolamento com dois workspaces.
8. Corrigir APIs pÃºblicas de mensagens/reservas.
9. Implementar onboarding B2B e portal bÃ¡sico.
10. Integrar billing somente apÃ³s entitlement server-side.
