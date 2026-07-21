# PRD â€” mÃ³dulos premium do ParaSempre Studio

Status: proposta para implementaÃ§Ã£o
VersÃ£o: 1.0
Data: 20/07/2026

## 1. Objetivo

Construir um SaaS B2B2C no qual assessorias e cerimonialistas organizam vÃ¡rios eventos, colaboram com a equipe e entregam portal, site e operaÃ§Ã£o de convidados aos clientes.

## 2. Resultado de negÃ³cio

O produto estarÃ¡ comercialmente validÃ¡vel quando uma assessoria puder:

1. criar uma conta e um workspace;
2. iniciar trial sem intervenÃ§Ã£o manual;
3. criar um evento a partir de template;
4. convidar o casal;
5. publicar site/RSVP com sua marca;
6. acompanhar o evento sem segundo login;
7. assinar, trocar ou cancelar plano;
8. nunca acessar dados de outro workspace.

## 3. Personas e papÃ©is

### 3.1 Equipe da assessoria

| Papel | PermissÃµes principais |
|---|---|
| Owner | Billing, exclusÃ£o, seguranÃ§a, equipe e todos os eventos |
| Admin | Equipe, templates, configuraÃ§Ãµes e todos os eventos; sem transferir propriedade |
| Planner | CRUD nos eventos atribuÃ­dos e comunicaÃ§Ã£o com clientes |
| Coordinator | Cronograma, convidados e check-in dos eventos atribuÃ­dos |
| Viewer | Leitura dos eventos atribuÃ­dos |

### 3.2 UsuÃ¡rios externos

| Papel | PermissÃµes principais |
|---|---|
| Cliente/casal | Portal do evento, aprovaÃ§Ãµes, comentÃ¡rios e itens explicitamente compartilhados |
| Fornecedor | Link restrito para cronograma/documento especÃ­fico |
| Convidado | Site pÃºblico, RSVP, recados, presentes e check-in |

UsuÃ¡rios externos nÃ£o consomem assento pago da equipe.

## 4. Jornadas essenciais

### 4.1 AquisiÃ§Ã£o e ativaÃ§Ã£o

1. UsuÃ¡rio chega Ã  landing B2B.
2. Cria conta, verifica e-mail e cria workspace.
3. Seleciona â€œAssessoria completaâ€ ou â€œAssessoria do diaâ€.
4. Informa casal, data, cidade e tamanho estimado.
5. O sistema cria evento com checklist, cronograma e pÃ¡ginas iniciais.
6. UsuÃ¡rio personaliza marca e publica.
7. Convida o casal.
8. O produto registra ativaÃ§Ã£o quando evento publicado + cliente convidado.

### 4.2 Trabalho semanal

1. Profissional abre carteira de eventos.
2. VÃª tarefas atrasadas, parcelas prÃ³ximas, RSVPs e eventos futuros.
3. Entra em um evento sem nova autenticaÃ§Ã£o.
4. Atualiza responsÃ¡veis, documentos e decisÃµes.
5. Casal recebe notificaÃ§Ã£o e responde no portal.

### 4.3 Dia do evento

1. Coordenador abre cronograma mÃ³vel.
2. Confere responsÃ¡veis e contatos crÃ­ticos.
3. Faz check-in por busca ou QR Code.
4. Marca item como iniciado/concluÃ­do/atrasado.
5. AlteraÃ§Ãµes ficam registradas e sincronizam apÃ³s reconexÃ£o.

## 5. Requisitos funcionais

Prioridades: **P0** bloqueia venda; **P1** compÃµe o MVP pago; **P2** diferencia o Pro; **P3** expansÃ£o.

## 5.1 FundaÃ§Ã£o de identidade e workspace

### FR-AUTH-001 â€” Conta Ãºnica do profissional â€” P0

O profissional usa uma Ãºnica conta para todos os eventos e workspaces aos quais pertence.

CritÃ©rios de aceite:

- NÃ£o existe login administrativo separado por evento.
- ApÃ³s criar evento, o usuÃ¡rio autorizado entra diretamente no painel.
- SessÃ£o expirada volta ao login e preserva o destino de retorno.
- E-mail pode ser verificado e senha pode ser redefinida.
- Logout invalida a sessÃ£o atual.
- MFA fica disponÃ­vel para owners e admins no Pro/Studio.

### FR-ORG-001 â€” Workspace da assessoria â€” P0

CritÃ©rios de aceite:

- Cadastro cria workspace e membership `owner` em transaÃ§Ã£o Ãºnica.
- Nome, slug, telefone, fuso horÃ¡rio, moeda, logo e cores sÃ£o configurÃ¡veis.
- Slug Ã© Ãºnico e reservado contra termos de sistema.
- Owner pode transferir propriedade somente apÃ³s reautenticaÃ§Ã£o.
- ExclusÃ£o inicia janela de recuperaÃ§Ã£o de 30 dias.

### FR-ORG-002 â€” Equipe e permissÃµes â€” P1

CritÃ©rios de aceite:

- Owner/admin convida por e-mail com expiraÃ§Ã£o.
- Convite nÃ£o pode ser reutilizado.
- Limite de assentos Ã© aplicado no backend.
- Papel e eventos atribuÃ­dos podem ser alterados.
- Remover membro revoga acesso imediatamente.
- Toda mudanÃ§a gera log de auditoria.

## 5.2 Carteira de eventos

### FR-EVT-001 â€” Criar evento â€” P0

Campos mÃ­nimos: nome, tipo, casal/cliente, data, fuso, cidade, slug pÃºblico, template e responsÃ¡vel.

CritÃ©rios de aceite:

- CriaÃ§Ã£o verifica entitlement de eventos ativos.
- Slug Ã© validado e checado no servidor.
- Evento comeÃ§a como `draft`.
- Template Ã© copiado em transaÃ§Ã£o Ãºnica.
- UsuÃ¡rio criador recebe acesso ao evento.
- Evento novo nÃ£o herda dados de outro evento.

### FR-EVT-002 â€” Estados do evento â€” P0

Estados: `draft`, `active`, `completed`, `archived`, `canceled`.

Regras:

- Apenas `draft` e `active` contam como ativos para limite.
- Publicar site exige evento `draft` ou `active` e slug vÃ¡lido.
- Arquivar torna portal e site indisponÃ­veis conforme configuraÃ§Ã£o.
- ExclusÃ£o lÃ³gica precede exclusÃ£o fÃ­sica.

### FR-EVT-003 â€” Carteira e dashboard â€” P1

CritÃ©rios de aceite:

- Lista filtra por status, data, responsÃ¡vel e busca.
- Cards mostram data, progresso, atrasos, RSVP e prÃ³xima aÃ§Ã£o.
- Dashboard do workspace agrega eventos sem misturar dados entre organizaÃ§Ãµes.
- PaginaÃ§Ã£o Ã© server-side.
- Empty state oferece template e demonstraÃ§Ã£o guiada.

## 5.3 Templates da assessoria

### FR-TPL-001 â€” Templates operacionais â€” P1

Um template pode conter tarefas, categorias de orÃ§amento, categorias de fornecedores, cronograma-base, pÃ¡ginas e textos.

CritÃ©rios de aceite:

- Sistema fornece templates iniciais versionados.
- Workspace pode duplicar e editar seus prÃ³prios templates.
- Aplicar template cria cÃ³pia; ediÃ§Ãµes futuras no template nÃ£o alteram eventos existentes.
- Datas relativas usam a data do evento, por exemplo `D-180`.
- Itens impossÃ­veis por data passada sÃ£o sinalizados, nÃ£o ocultados.

## 5.4 Portal do casal

### FR-CLI-001 â€” Convite do casal â€” P1

CritÃ©rios de aceite:

- Convite tem token de uso Ãºnico e expiraÃ§Ã£o.
- Casal pode ter dois ou mais usuÃ¡rios.
- Assessoria escolhe seÃ§Ãµes visÃ­veis.
- RevogaÃ§Ã£o remove acesso imediatamente.
- Cliente sÃ³ acessa eventos aos quais foi convidado.

### FR-CLI-002 â€” VisÃ£o do progresso â€” P1

Exibe prÃ³ximos marcos, tarefas compartilhadas, aprovaÃ§Ãµes pendentes, orÃ§amento resumido, documentos e mensagens.

CritÃ©rios de aceite:

- Itens internos nunca aparecem ao cliente.
- AlteraÃ§Ã£o de visibilidade Ã© auditada.
- Cliente pode comentar e anexar arquivo nos itens permitidos.
- NotificaÃ§Ãµes respeitam preferÃªncias e opt-out.

### FR-CLI-003 â€” AprovaÃ§Ãµes â€” P2

CritÃ©rios de aceite:

- Item pode exigir aprovaÃ§Ã£o de um ou ambos os clientes.
- Estados: `pending`, `approved`, `changes_requested`, `canceled`.
- DecisÃ£o registra usuÃ¡rio, data e comentÃ¡rio.
- Nova versÃ£o invalida aprovaÃ§Ã£o anterior de forma explÃ­cita.

## 5.5 Site pÃºblico e marca

### FR-SITE-001 â€” PublicaÃ§Ã£o â€” P0

Preservar home, presentes, recados, RSVP e PIX existentes.

CritÃ©rios de aceite:

- Preview nÃ£o indexÃ¡vel antes da publicaÃ§Ã£o.
- PublicaÃ§Ã£o exige configuraÃ§Ã£o mÃ­nima e confirma URL final.
- Site pÃºblico nunca expÃµe IDs internos, e-mails ou dados ocultos.
- PÃ¡gina inexistente retorna 404 real, nÃ£o HTML com status 200.
- Cache Ã© invalidado apÃ³s publicaÃ§Ã£o.

### FR-SITE-002 â€” White-label â€” P1/P2

Entitlements:

- Gratuito: marca ParaSempre obrigatÃ³ria.
- Solo: logo e cores da assessoria.
- Pro: remoÃ§Ã£o da marca ParaSempre.
- Studio: domÃ­nio customizado e kit completo de marca.

CritÃ©rios de aceite:

- Backend informa capacidades; frontend nÃ£o infere pelo nome do plano.
- Tema nÃ£o pode injetar CSS/HTML arbitrÃ¡rio.
- Contraste mÃ­nimo WCAG AA Ã© verificado nos campos principais.

### FR-SITE-003 â€” DomÃ­nio customizado â€” P3

CritÃ©rios de aceite:

- Mostra instruÃ§Ã£o DNS e status de verificaÃ§Ã£o.
- DomÃ­nio sÃ³ ativa apÃ³s comprovaÃ§Ã£o de propriedade.
- TLS Ã© obrigatÃ³rio.
- Um domÃ­nio pertence a um Ãºnico workspace/evento.
- Falha de renovaÃ§Ã£o gera alerta e fallback para domÃ­nio padrÃ£o.

## 5.6 Presentes e contribuiÃ§Ãµes

### FR-GFT-001 â€” Lista de presentes â€” P0

CritÃ©rios de aceite:

- CRUD sempre filtra pelo `event_id` autorizado.
- Reserva usa transaÃ§Ã£o e expira de forma idempotente.
- ConfirmaÃ§Ã£o exige `reservation_token` nÃ£o adivinhÃ¡vel.
- Token Ã© armazenado com hash e nÃ£o aparece em logs.
- Um presente comprado nÃ£o volta automaticamente a disponÃ­vel.
- Links externos usam allowlist de protocolos `https` e proteÃ§Ã£o contra URLs perigosas.

### FR-GFT-002 â€” PIX informativo â€” P0

CritÃ©rios de aceite:

- Interface deixa claro que o sistema apenas exibe a chave/QR.
- Chave fica visÃ­vel somente quando seÃ§Ã£o estiver publicada.
- AlteraÃ§Ã£o de chave por admin exige reautenticaÃ§Ã£o ou confirmaÃ§Ã£o forte.
- NÃ£o marcar contribuiÃ§Ã£o como paga sem confirmaÃ§Ã£o do casal ou provedor.

### FR-GFT-003 â€” ContribuiÃ§Ã£o rastreÃ¡vel â€” P3

Fora do MVP. Quando implementado, usar provedor conectado ao recebedor. O ParaSempre nÃ£o mantÃ©m saldo do casal.

## 5.7 Convidados e RSVP

### FR-GST-001 â€” Cadastro de convidados â€” P1

Entidades: famÃ­lia/grupo, convidado, contato, convite e acompanhante.

CritÃ©rios de aceite:

- ImportaÃ§Ã£o CSV apresenta prÃ©via, validaÃ§Ã£o e relatÃ³rio de erros.
- E-mail/telefone normalizados permitem detectar duplicatas.
- A assessoria decide se acompanhante Ã© permitido.
- CrianÃ§as e restriÃ§Ãµes alimentares podem ser registradas.
- Dados podem ser exportados e excluÃ­dos conforme polÃ­tica de retenÃ§Ã£o.

### FR-RSVP-001 â€” RSVP nominal â€” P1

CritÃ©rios de aceite:

- Convite usa token aleatÃ³rio, uso limitado e expiraÃ§Ã£o configurÃ¡vel.
- Convidado sÃ³ confirma pessoas do seu grupo.
- Reenvio nÃ£o cria duplicata.
- MudanÃ§a apÃ³s prazo pode ser bloqueada ou enviada para aprovaÃ§Ã£o.
- Status: `not_sent`, `sent`, `opened`, `confirmed`, `declined`, `partial`, `expired`.
- Toda resposta registra origem, data e versÃ£o.

### FR-RSVP-002 â€” FormulÃ¡rio aberto â€” P0

O formulÃ¡rio atual pode continuar em planos bÃ¡sicos, com:

- CAPTCHA apÃ³s comportamento suspeito;
- rate limit correto atrÃ¡s de proxy;
- deduplicaÃ§Ã£o por evento + e-mail;
- consentimento/aviso de privacidade;
- moderaÃ§Ã£o de conteÃºdo;
- endpoint pÃºblico retornando somente dados publicÃ¡veis.

### FR-SEAT-001 â€” Mesas e assentos â€” P2

CritÃ©rios de aceite:

- Criar mesas com capacidade.
- Arrastar grupo ou indivÃ­duo sem exceder capacidade.
- Alertar grupos separados e pessoas sem mesa.
- Exportar lista por mesa e ordem alfabÃ©tica.
- AlteraÃ§Ãµes simultÃ¢neas detectam conflito de versÃ£o.

### FR-CHECKIN-001 â€” Check-in â€” P2

CritÃ©rios de aceite:

- Busca por nome, grupo, telefone parcial ou QR.
- QR nÃ£o contÃ©m dados pessoais em texto claro.
- Segundo check-in informa horÃ¡rio e operador anterior.
- Funciona em viewport mÃ³vel e com fila offline limitada.
- SincronizaÃ§Ã£o idempotente nÃ£o duplica entrada.

## 5.8 Planejamento

### FR-TSK-001 â€” Tarefas e marcos â€” P1

Campos: tÃ­tulo, descriÃ§Ã£o, status, prioridade, data, responsÃ¡vel, visibilidade, dependÃªncias, anexos e tags.

CritÃ©rios de aceite:

- VisÃµes lista, calendÃ¡rio e â€œminhas tarefasâ€.
- DependÃªncia bloqueadora Ã© exibida.
- Tarefa interna nÃ£o aparece no portal.
- AlteraÃ§Ãµes relevantes geram atividade e notificaÃ§Ã£o.
- RecorrÃªncia fica fora do MVP inicial.

### FR-BUD-001 â€” OrÃ§amento â€” P1

CritÃ©rios de aceite:

- Valores em centavos/decimal seguro; nunca `float`.
- Categorias configurÃ¡veis.
- Exibe estimado, contratado, pago, pendente e vencido.
- Itens vinculam fornecedor, contrato e parcelas.
- EdiÃ§Ã£o concorrente usa versÃ£o otimista.
- ExportaÃ§Ã£o PDF/CSV respeita visibilidade.
- O mÃ³dulo nÃ£o movimenta dinheiro.

### FR-VEN-001 â€” Fornecedores â€” P1

CritÃ©rios de aceite:

- DiretÃ³rio do workspace e vÃ­nculo especÃ­fico por evento.
- Contatos, categoria, status, valores, observaÃ§Ãµes internas e avaliaÃ§Ã£o privada.
- Um fornecedor global do workspace nÃ£o enxerga eventos.
- Dados pessoais e comerciais tÃªm acesso restrito por papel.

### FR-DOC-001 â€” Documentos e contratos â€” P1

CritÃ©rios de aceite:

- Upload direto para object storage com URL assinada.
- Tipo e tamanho verificados no servidor/storage.
- Versionamento e histÃ³rico de download.
- AntivÃ­rus/scan assÃ­ncrono antes de compartilhar.
- RetenÃ§Ã£o conforme plano e evento arquivado.
- Assinatura eletrÃ´nica Ã© integraÃ§Ã£o futura.

## 5.9 Cronograma do Dia D

### FR-TIM-001 â€” Linha do tempo â€” P2

Campos: horÃ¡rio planejado/real, duraÃ§Ã£o, local, descriÃ§Ã£o pÃºblica/privada, responsÃ¡veis, fornecedores, dependÃªncias e contatos.

CritÃ©rios de aceite:

- Templates relativos ao horÃ¡rio da cerimÃ´nia.
- VisÃ£o completa e visÃµes filtradas por pessoa/fornecedor.
- AlteraÃ§Ã£o registra autor e horÃ¡rio.
- Status: `planned`, `ready`, `started`, `delayed`, `done`, `skipped`.
- Atraso propaga apenas como simulaÃ§Ã£o atÃ© confirmaÃ§Ã£o do operador.

### FR-TIM-002 â€” Modo operaÃ§Ã£o â€” P2

CritÃ©rios de aceite:

- Interface de alto contraste e botÃµes grandes.
- Carrega dados crÃ­ticos recentes sem conexÃ£o.
- Fila local mostra itens ainda nÃ£o sincronizados.
- Conflito nÃ£o sobrescreve silenciosamente alteraÃ§Ã£o do servidor.
- Telefones sÃ³ aparecem para papÃ©is autorizados.

## 5.10 ComunicaÃ§Ãµes e automaÃ§Ãµes

### FR-COM-001 â€” NotificaÃ§Ãµes transacionais â€” P1

Eventos mÃ­nimos: convite de equipe, convite do casal, recuperaÃ§Ã£o de senha, RSVP recebido, aprovaÃ§Ã£o solicitada, documento compartilhado e assinatura alterada.

CritÃ©rios de aceite:

- Templates versionados.
- Retry com backoff e dead-letter queue.
- IdempotÃªncia por evento/destinatÃ¡rio/template.
- Logs nÃ£o armazenam corpo sensÃ­vel desnecessÃ¡rio.

### FR-AUT-001 â€” AutomaÃ§Ãµes â€” P2

Gatilhos iniciais:

- tarefa vencendo;
- parcela vencendo;
- RSVP sem resposta;
- aprovaÃ§Ã£o pendente;
- evento em D-30/D-7/D-1.

CritÃ©rios de aceite:

- Regra tem audiÃªncia, canal, janela de envio e opt-out.
- Preview mostra quantidade de destinatÃ¡rios.
- Owner pode pausar automaÃ§Ãµes.
- Envio em massa exige confirmaÃ§Ã£o explÃ­cita.
- CobranÃ§a por crÃ©dito usa uso confirmado pelo provedor.

### FR-AI-001 â€” ImportaÃ§Ã£o assistida â€” P3

CritÃ©rios de aceite:

- Arquivo Ã© processado em job isolado.
- Resultado vira rascunho revisÃ¡vel.
- Nenhuma alteraÃ§Ã£o Ã© publicada automaticamente.
- Campos extraÃ­dos guardam confianÃ§a e referÃªncia Ã  origem.
- Documento pode ser excluÃ­do apÃ³s extraÃ§Ã£o conforme escolha do cliente.

## 5.11 Billing e entitlements

### FR-BILL-001 â€” Trial e assinatura â€” P0

CritÃ©rios de aceite:

- Trial tem inÃ­cio/fim e plano explÃ­citos.
- Checkout Ã© criado no backend.
- Webhook autenticado Ã© a fonte de verdade do status.
- Evento de webhook Ã© idempotente.
- Retorno do navegador nunca ativa plano sozinho.
- Estados: `trialing`, `active`, `past_due`, `grace_period`, `canceled`, `expired`.

### FR-BILL-002 â€” Limites â€” P0

CritÃ©rios de aceite:

- Limites sÃ£o consultados por entitlement, nÃ£o por `if plan ===` espalhado.
- Backend bloqueia criaÃ§Ã£o acima do limite com cÃ³digo de erro estÃ¡vel.
- UI mostra uso antes do bloqueio.
- Downgrade nÃ£o apaga dados; impede nova criaÃ§Ã£o e oferece prazo de ajuste.
- Owner pode exportar dados mesmo em `past_due` dentro da janela de retenÃ§Ã£o.

### Entitlements mÃ­nimos

| Chave | Tipo |
|---|---|
| `active_events.max` | nÃºmero |
| `team_seats.max` | nÃºmero |
| `storage.bytes` | nÃºmero |
| `automation_messages.monthly` | nÃºmero |
| `client_portal.enabled` | booleano |
| `budget.enabled` | booleano |
| `day_of.enabled` | booleano |
| `seating.enabled` | booleano |
| `checkin.enabled` | booleano |
| `branding.remove_powered_by` | booleano |
| `custom_domain.enabled` | booleano |
| `exports.enabled` | booleano |

## 6. Regras transversais

### 6.1 Isolamento

- Toda entidade de negÃ³cio possui `organization_id` e, quando aplicÃ¡vel, `event_id`.
- `organization_id` nunca Ã© aceito do body como autoridade.
- A organizaÃ§Ã£o Ã© derivada da membership autenticada e do recurso acessado.
- Toda query mutÃ¡vel contÃ©m filtro de organizaÃ§Ã£o/evento.
- Testes automatizados tentam acesso cruzado em cada mÃ³dulo.

### 6.2 Auditoria

Registrar: login sensÃ­vel, mudanÃ§as de papel, exportaÃ§Ã£o, publicaÃ§Ã£o, alteraÃ§Ã£o de PIX, billing, exclusÃ£o, download de documento restrito e mudanÃ§as no Dia D.

Campos: ator, organizaÃ§Ã£o, evento, aÃ§Ã£o, alvo, before/after sanitizado, IP reduzido/hasheado quando possÃ­vel, user-agent, request ID e timestamp.

### 6.3 ExclusÃ£o e retenÃ§Ã£o

- Soft delete para workspace, evento e usuÃ¡rios.
- RecuperaÃ§Ã£o padrÃ£o de 30 dias.
- Backups expiram conforme polÃ­tica de infraestrutura.
- Documentos de eventos arquivados seguem retenÃ§Ã£o do plano/contrato.
- SolicitaÃ§Ã£o de titular Ã© rastreÃ¡vel.

## 7. Requisitos nÃ£o funcionais

| ID | Requisito |
|---|---|
| NFR-001 | Disponibilidade mensal inicial de 99,5% para API e portal |
| NFR-002 | p95 GET autenticado < 500 ms sem contar terceiros |
| NFR-003 | p95 de mutaÃ§Ãµes comuns < 800 ms |
| NFR-004 | LCP mÃ³vel do site pÃºblico < 2,5 s no p75 |
| NFR-005 | Todas as pÃ¡ginas principais acessÃ­veis por teclado e WCAG 2.2 AA |
| NFR-006 | Logs estruturados com `request_id`, `organization_id` e erro sanitizado |
| NFR-007 | RPO de 24 h no beta e 1 h apÃ³s lanÃ§amento pago estÃ¡vel |
| NFR-008 | RTO de 8 h no beta e 4 h apÃ³s lanÃ§amento pago estÃ¡vel |
| NFR-009 | Upload nÃ£o bloqueia processo Node nem armazena bytes no banco principal |
| NFR-010 | Jobs sÃ£o idempotentes e retomÃ¡veis |
| NFR-011 | Data/hora armazenada em UTC e exibida no fuso do evento |
| NFR-012 | Valores monetÃ¡rios usam BRL e representaÃ§Ã£o decimal segura |

## 8. Telemetria de produto

Eventos mÃ­nimos:

- `workspace_created`
- `event_created`
- `template_applied`
- `event_published`
- `client_invited`
- `client_joined`
- `guest_import_completed`
- `rsvp_submitted`
- `task_completed`
- `approval_decided`
- `checkout_started`
- `subscription_activated`
- `limit_reached`
- `checkin_completed`

Cada evento inclui IDs pseudÃ´nimos, plano, origem e timestamp; nunca conteÃºdo de mensagem, documento ou chave PIX.

## 9. CritÃ©rio do MVP vendÃ¡vel

Todos os itens abaixo devem estar concluÃ­dos:

- FR-AUTH-001, FR-ORG-001, FR-EVT-001/002, FR-SITE-001, FR-GFT-001/002, FR-BILL-001/002.
- Conta Ãºnica e autorizaÃ§Ã£o por membership.
- Site, RSVP, recados e presentes atuais preservados.
- Portal do casal bÃ¡sico.
- Branding bÃ¡sico da assessoria.
- Billing funcional em sandbox e produÃ§Ã£o.
- Termos, privacidade, consentimentos e fluxo de exclusÃ£o.
- Testes E2E de dois workspaces isolados.
- Observabilidade, backup e procedimento de incidente.

## 10. Fora do escopo do MVP

- Mesas, check-in e PWA offline completa.
- WhatsApp em massa.
- IA e leitura de contratos.
- DomÃ­nio customizado automÃ¡tico.
- Marketplace.
- Pagamentos de presentes.
- Aplicativos nativos.
