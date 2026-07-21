# Plano mestre â€” ParaSempre Studio

## 1. Resumo executivo

O projeto tem uma base funcional relevante, mas a oferta atual Ã© genÃ©rica: â€œsite de casamento para casaisâ€. Esse mercado tem concorrentes maduros e tende a comparar preÃ§o, quantidade de templates e taxa sobre presentes.

A oportunidade mais coerente com o cÃ³digo e com a intenÃ§Ã£o de vender para profissionais Ã© outra:

> **ParaSempre Studio Ã© o sistema white-label para assessorias organizarem casamentos e entregarem uma experiÃªncia premium aos noivos e convidados.**

O comprador Ã© a assessoria. O casal e os convidados sÃ£o usuÃ¡rios convidados. A assinatura pertence ao escritÃ³rio, nÃ£o ao casamento.

O produto combina trÃªs superfÃ­cies:

1. **Studio da assessoria** â€” carteira de eventos, equipe, tarefas, orÃ§amento, fornecedores, documentos e mÃ©tricas.
2. **Portal do casal** â€” aprovaÃ§Ãµes, pendÃªncias, orÃ§amento, documentos, mensagens e visÃ£o do progresso.
3. **ExperiÃªncia do convidado** â€” site, RSVP, lista de presentes, PIX, recados, mesas e check-in.

Essa estratÃ©gia transforma o site atual em uma parte valiosa de um produto maior, em vez de descartÃ¡-lo.

## 2. DiagnÃ³stico do produto atual

### 2.1 Maturidade por Ã¡rea

| Ãrea | Estado | AvaliaÃ§Ã£o |
|---|---|---|
| Site pÃºblico | Funcional | Bom ponto de partida |
| Presentes e reservas | Funcional com riscos | Precisa vincular confirmaÃ§Ã£o a uma reserva segura |
| RSVP e recados | Funcional bÃ¡sico | Falta lista nominal, convite, deduplicaÃ§Ã£o e antispam |
| PIX | ExibiÃ§Ã£o de chave/QR | NÃ£o rastreia pagamento; nÃ£o deve ser vendido como arrecadaÃ§Ã£o automÃ¡tica |
| PersonalizaÃ§Ã£o | Dez temas e configuraÃ§Ãµes | Bom diferencial para white-label |
| Painel do evento | CRUD e mÃ©tricas de presentes | Ainda nÃ£o Ã© painel de planejamento |
| Multi-tenant | Parcial | ResoluÃ§Ã£o por slug existe; autorizaÃ§Ã£o estÃ¡ insegura |
| Conta da plataforma | Parcial | Cria sites, mas nÃ£o concede acesso coerente ao painel criado |
| Planos pagos | Mock | Sem cobranÃ§a, limites, trial ou cancelamento |
| ProduÃ§Ã£o | ProtÃ³tipo avanÃ§ado | NÃ£o estÃ¡ pronto para dados reais de mÃºltiplos clientes |

### 2.2 EvidÃªncias verificadas

- `npm test`: 6 testes aprovados, todos concentrados em validaÃ§Ã£o de entrada.
- `npm run build`: gera build, com bundle principal de 1.564,60 KB e alerta de chunk acima de 500 KB.
- `npx tsc --noEmit`: falha com 42 erros.
- `npm audit --omit=dev`: 8 vulnerabilidades; 3 altas, incluindo `react-router`, `vite` e `xlsx`.
- NÃ£o hÃ¡ pipeline de CI, Playwright, lint, migraÃ§Ãµes versionadas nem testes de isolamento entre tenants.
- A landing page mostra Free/Pro/Premium, mas Pro e Premium estÃ£o â€œEm breveâ€.
- O console lista sites, porÃ©m a criaÃ§Ã£o termina no login administrativo separado.
- No fluxo visual de demonstraÃ§Ã£o, o slug foi concatenado incorretamente e o novo site recebeu dados globais do demo, evidenciando falta de isolamento no modo de apresentaÃ§Ã£o.

## 3. Mercado e posicionamento

### 3.1 Leitura do mercado em julho de 2026

SoluÃ§Ãµes brasileiras voltadas a assessorias jÃ¡ anunciam mÃ³dulos como orÃ§amento, fornecedores, contratos, portal do cliente, cronograma e RSVP. Faixas pÃºblicas observadas:

- Plannifier: aproximadamente R$ 82, R$ 167 e R$ 295 por mÃªs, variando eventos, mensagens, armazenamento e IA.
- Nupcial: gratuito para um casamento, R$ 99 para atÃ© 10 e R$ 249 para atÃ© 40 casamentos.
- HÃ¡ concorrentes de baixo preÃ§o anunciando planos Ãºnicos, o que limita uma disputa baseada apenas em checklist de funÃ§Ãµes.

ConclusÃ£o: o ParaSempre nÃ£o deve se vender como â€œmais um gerenciador de tarefasâ€. O diferencial inicial deve ser:

- experiÃªncia visual premium entregue ao casal e convidados;
- white-label real para a assessoria;
- criaÃ§Ã£o rÃ¡pida a partir de templates da prÃ³pria assessoria;
- operaÃ§Ã£o de RSVP e Dia D integrada ao site;
- facilidade suficiente para substituir planilhas e grupos dispersos de WhatsApp.

### 3.2 Categoria proposta

**Sistema operacional de casamentos para assessorias**, com portal e site white-label.

### 3.3 Mensagem principal

> Organize todos os seus casamentos e entregue uma experiÃªncia com a sua marca â€” do primeiro checklist ao check-in do Ãºltimo convidado.

Mensagens secundÃ¡rias:

- â€œMenos planilhas, menos mensagens perdidas, mais percepÃ§Ã£o de valor.â€
- â€œSeu processo vira template e cada novo casamento comeÃ§a pronto.â€
- â€œOs noivos acompanham sem cobrar atualizaÃ§Ã£o pelo WhatsApp.â€

## 4. Cliente ideal

### 4.1 ICP primÃ¡rio

Assessora ou cerimonialista autÃ´noma que:

- mantÃ©m de 3 a 15 eventos ativos;
- usa planilhas, Drive e WhatsApp;
- quer aparentar mais profissionalismo;
- vende assessoria completa ou parcial;
- precisa reduzir retrabalho e cobranÃ§a de status;
- decide a compra sem processo corporativo longo.

### 4.2 ICP secundÃ¡rio

EscritÃ³rio com 3 a 10 pessoas e 15 a 60 eventos ativos, que precisa de permissÃµes, templates, gestÃ£o de equipe, white-label e visÃ£o de capacidade.

### 4.3 UsuÃ¡rios finais

- ProprietÃ¡ria da assessoria.
- Planejadora/assessora.
- Coordenador do Dia D.
- Assistente/estagiÃ¡rio.
- Casal/cliente.
- Fornecedor convidado.
- Convidado do evento.

### 4.4 Jobs to be done

1. Quando fecho um novo casamento, quero aplicar meu processo padrÃ£o em minutos.
2. Quando os noivos pedem atualizaÃ§Ã£o, quero que vejam o progresso sem depender de mim.
3. Quando chega o Dia D, quero uma Ãºnica versÃ£o do cronograma com responsÃ¡veis.
4. Quando envio RSVP, quero saber quem respondeu, quem precisa de lembrete e quem chegou.
5. Quando apresento meu serviÃ§o, quero que o software reforce minha marca e justifique meu preÃ§o.

## 5. Produto final

### 5.1 Estrutura comercial

- Uma **organizaÃ§Ã£o/workspace** representa a assessoria pagante.
- Um workspace possui membros, marca, assinatura, limites e integraÃ§Ãµes.
- Cada **evento** pertence a um workspace.
- Casais sÃ£o convidados ao portal do evento, sem ocupar assento pago da equipe.
- O site pÃºblico Ã© uma publicaÃ§Ã£o do evento.
- Plano, cobranÃ§a e uso sÃ£o calculados no workspace.

### 5.2 MÃ³dulos

| MÃ³dulo | Resultado vendido |
|---|---|
| Carteira de eventos | VisÃ£o de todos os casamentos e prÃ³ximos marcos |
| Templates operacionais | Processo da assessoria replicado sem copiar planilha |
| Portal do casal | TransparÃªncia, aprovaÃ§Ãµes e menos mensagens dispersas |
| Site e RSVP | ExperiÃªncia do convidado sob a marca da assessoria |
| OrÃ§amento | Estimado, contratado, pago, vencido e saldo |
| Fornecedores e contratos | HistÃ³rico por evento e rede de parceiros |
| Documentos | Arquivos organizados por evento e categoria |
| Cronograma Dia D | Linha do tempo, responsÃ¡veis, alertas e versÃ£o mÃ³vel |
| Convidados, mesas e check-in | OperaÃ§Ã£o completa do convite Ã  entrada |
| AutomaÃ§Ãµes | E-mail/WhatsApp por gatilhos e segmentos |
| White-label | Logo, cores, domÃ­nio e remoÃ§Ã£o da marca ParaSempre |
| RelatÃ³rios | Capacidade da equipe, margem, respostas e desempenho |

## 6. Planos e preÃ§os recomendados

Os preÃ§os abaixo sÃ£o hipÃ³tese de lanÃ§amento. Devem ser validados com pelo menos 10 entrevistas e 3 testes de proposta antes de serem tratados como definitivos.

### 6.1 Grade sugerida

| Recurso | Gratuito | Solo â€” R$ 89/mÃªs | Pro â€” R$ 179/mÃªs | Studio â€” R$ 329/mÃªs |
|---|---:|---:|---:|---:|
| Eventos ativos | 1 | 5 | 20 | 60 |
| UsuÃ¡rios da equipe | 1 | 1 | 3 | 10 |
| Casais/clientes convidados | Ilimitado | Ilimitado | Ilimitado | Ilimitado |
| Site + RSVP + presentes + PIX | Sim | Sim | Sim | Sim |
| Tarefas e templates | BÃ¡sico | Completo | Completo | Completo |
| OrÃ§amento e fornecedores | â€” | Sim | Sim | Sim |
| Portal do casal | BÃ¡sico | Sim | Sim | Sim |
| ExportaÃ§Ãµes | â€” | CSV/PDF | CSV/PDF | CSV/PDF/API |
| Cronograma Dia D | â€” | BÃ¡sico | Completo | Completo |
| Mesas e check-in | â€” | â€” | Sim | Sim |
| AutomaÃ§Ãµes | â€” | â€” | 500/mÃªs | 2.000/mÃªs |
| White-label | â€” | Logo e cores | Remove marca | Marca + domÃ­nio prÃ³prio |
| Armazenamento | 500 MB | 2 GB | 10 GB | 30 GB |
| Suporte | Base | E-mail | PrioritÃ¡rio | PrioritÃ¡rio + onboarding |

PreÃ§o anual: 10 mensalidades por 12 meses de acesso.

### 6.2 Oferta de primeiros clientes

**Plano Fundadores: R$ 59/mÃªs por 12 meses**, limitado Ã s primeiras 20 assessorias, com:

- atÃ© 5 eventos ativos;
- onboarding individual de 60 minutos;
- importaÃ§Ã£o inicial de uma planilha;
- canal direto de feedback;
- preÃ§o mantido enquanto a assinatura permanecer ativa.

O objetivo Ã© aprender e criar casos, nÃ£o maximizar receita no primeiro mÃªs.

### 6.3 Receitas adicionais

- Setup white-label e migraÃ§Ã£o: R$ 390 a R$ 1.490.
- Evento ativo adicional: R$ 15/mÃªs.
- UsuÃ¡rio de equipe adicional: R$ 19/mÃªs.
- Pacotes de WhatsApp: custo do provedor + margem operacional.
- CriaÃ§Ã£o de template exclusivo: serviÃ§o fechado.
- Treinamento de equipe: pacote avulso.
- Futuro marketplace de templates e parceiros, com comissÃ£o transparente.

### 6.4 O que nÃ£o monetizar no inÃ­cio

- NÃ£o custodiar dinheiro de presentes.
- NÃ£o cobrar percentual escondido sobre PIX do casal.
- NÃ£o criar split financeiro antes de validaÃ§Ã£o jurÃ­dica, contÃ¡bil e antifraude.
- NÃ£o prometer assinatura digital prÃ³pria; integrar provedor especializado depois.

Para a assinatura SaaS, usar uma abstraÃ§Ã£o de billing e iniciar com Mercado Pago, que oferece assinaturas recorrentes e webhooks no Brasil. A camada de domÃ­nio nÃ£o deve depender diretamente do provedor para permitir troca futura.

## 7. AtualizaÃ§Ãµes premium prioritÃ¡rias

### Premium 1 â€” Studio multi-evento

- Workspace da assessoria.
- Equipe e papÃ©is.
- Carteira de eventos com filtros e prÃ³ximos marcos.
- Conta Ãºnica para acessar todos os eventos.
- Limites aplicados no servidor.

Ã‰ o requisito mÃ­nimo para cobrar de uma assessoria.

### Premium 2 â€” Portal do casal

- Checklist visÃ­vel.
- AprovaÃ§Ãµes e comentÃ¡rios.
- Documentos.
- OrÃ§amento resumido.
- PrÃ³ximas decisÃµes.
- Branding da assessoria.

Ã‰ o mÃ³dulo de maior percepÃ§Ã£o de valor e reduz WhatsApp operacional.

### Premium 3 â€” Planejamento profissional

- Templates de checklist.
- Tarefas, marcos, dependÃªncias e responsÃ¡veis.
- OrÃ§amento estimado x contratado x pago.
- Fornecedores, propostas, contratos e parcelas.
- RelatÃ³rios PDF.

### Premium 4 â€” OperaÃ§Ã£o de convidados

- FamÃ­lias/grupos e convites nominativos.
- RSVP por token.
- Lembretes segmentados.
- RestriÃ§Ãµes alimentares.
- Mesas e assentos.
- QR Code e check-in.

### Premium 5 â€” Dia D

- Cronograma privado e compartilhÃ¡vel.
- ResponsÃ¡veis e fornecedores por item.
- ConfirmaÃ§Ã£o de leitura.
- Alertas de atraso.
- Interface mÃ³vel e modo de leitura offline.

### Premium 6 â€” White-label e crescimento

- Logo, cores, tipografia e favicon.
- DomÃ­nio customizado.
- RemoÃ§Ã£o da marca ParaSempre.
- Templates prÃ³prios da assessoria.
- PÃ¡gina comercial/portfÃ³lio opcional.

### Premium 7 â€” AutomaÃ§Ãµes e IA assistiva

- E-mail e WhatsApp por gatilhos.
- ImportaÃ§Ã£o inteligente de planilhas e contratos.
- Resumo de pendÃªncias.
- SugestÃµes que exigem aprovaÃ§Ã£o humana.

IA entra depois que os fluxos e dados estiverem estruturados; nÃ£o deve ser a primeira promessa.

## 8. EstratÃ©gia de lanÃ§amento

### 8.1 Wedge inicial

Vender primeiro:

> â€œEm 30 minutos, sua assessoria ganha um portal com sua marca, site do casal, RSVP e painel para acompanhar o evento.â€

NÃ£o apresentar o beta como ERP completo.

### 8.2 AquisiÃ§Ã£o

1. Entrevistar 10 assessorias locais ou de comunidades profissionais.
2. Fazer onboarding concierge das cinco primeiras.
3. Criar dois templates prontos: assessoria completa e assessoria do dia.
4. Publicar demonstraÃ§Ã£o gravada de 3 minutos.
5. Usar indicaÃ§Ã£o com um mÃªs de crÃ©dito para cada cliente convertido.
6. Produzir conteÃºdo prÃ¡tico: planilha de checklist, roteiro de Dia D, modelo de orÃ§amento.
7. Parcerias com cursos e comunidades de cerimonialistas.

### 8.3 Funil recomendado

| Etapa | Evento mensurado | Meta inicial |
|---|---|---:|
| Visita | Abriu landing B2B | â€” |
| Lead | Solicitou demo/criou conta | 5% das visitas qualificadas |
| AtivaÃ§Ã£o | Criou evento + publicou portal/site | 60% dos cadastros |
| Valor | Convidou casal ou importou convidados | 50% dos ativados |
| ConversÃ£o | Iniciou assinatura | 20% dos trials qualificados |
| RetenÃ§Ã£o | Continua apÃ³s 90 dias | > 85% |

### 8.4 MÃ©tricas de produto

- Tempo atÃ© primeiro evento publicado: menos de 30 minutos.
- Tempo atÃ© primeiro valor: menos de 15 minutos usando template.
- Eventos ativos por workspace.
- Percentual de eventos com casal convidado.
- RSVP enviados e taxa de resposta.
- Tarefas concluÃ­das no prazo.
- Uso semanal por assessora.
- MRR, ARPA, churn de clientes e expansÃ£o.
- Tickets por workspace e tempo de resoluÃ§Ã£o.

### 8.5 CenÃ¡rios de receita

| CenÃ¡rio | ComposiÃ§Ã£o ilustrativa | MRR |
|---|---|---:|
| ValidaÃ§Ã£o | 10 Fundadores a R$ 59 | R$ 590 |
| Primeira traÃ§Ã£o | 25 Solo + 15 Pro + 5 Studio | R$ 6.555 |
| NegÃ³cio sustentÃ¡vel inicial | 100 clientes com ARPA mÃ©dio de R$ 145 | R$ 14.500 |

Os cenÃ¡rios nÃ£o sÃ£o projeÃ§Ãµes garantidas; servem para orientar metas e custo operacional.

## 9. PrincÃ­pios de produto

1. O pagante Ã© a assessoria; o evento nÃ£o Ã© o tenant comercial principal.
2. Toda funÃ§Ã£o premium tem entitlement verificado no servidor.
3. Uma conta e uma sessÃ£o para o profissional; nada de segundo login por evento.
4. O header de tenant informa contexto, nunca autorizaÃ§Ã£o.
5. Toda tela mÃ³vel deve funcionar no Dia D.
6. Toda automaÃ§Ã£o precisa de histÃ³rico, consentimento e opt-out quando aplicÃ¡vel.
7. Dados financeiros de planejamento nÃ£o sÃ£o processamento de pagamentos.
8. IA sugere; a assessora aprova aÃ§Ãµes externas.
9. Templates reduzem tempo de onboarding e sÃ£o parte central do produto.
10. Funcionalidade sem telemetria e critÃ©rio de aceite nÃ£o estÃ¡ pronta.

## 10. DecisÃµes e nÃ£o objetivos

### DecisÃµes

- Manter React/Vite e Express no curto prazo.
- Evoluir como modular monolith, nÃ£o microserviÃ§os.
- Adotar organizaÃ§Ã£o como limite de cobranÃ§a e evento como unidade operacional.
- Usar banco PostgreSQL gerenciado e storage de objetos.
- Separar billing, notificaÃ§Ãµes e storage por adapters.
- ComeÃ§ar no Brasil, em portuguÃªs e moeda BRL.

### NÃ£o objetivos das primeiras versÃµes

- Marketplace completo de fornecedores.
- Aplicativo nativo iOS/Android.
- Sistema contÃ¡bil/fiscal.
- Processar ou custodiar presentes em dinheiro.
- Assinatura eletrÃ´nica prÃ³pria.
- Editor visual livre de pÃ¡ginas.
- IA autÃ´noma enviando mensagens ou alterando orÃ§amento.

## 11. ReferÃªncias de mercado e plataforma

- Plannifier: https://plannifier.com.br/
- Nupcial: https://www.nupcialapp.com.br/
- Mercado Pago Assinaturas: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview
- Supabase â€” checklist de produÃ§Ã£o: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase â€” Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- LGPD compilada: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
