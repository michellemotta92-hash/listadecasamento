# ParaSempre Studio â€” plano de produto e produÃ§Ã£o

Data da anÃ¡lise: 20/07/2026
Estado analisado: working tree local, incluindo alteraÃ§Ãµes ainda nÃ£o commitadas.

## DecisÃ£o executiva

O projeto deve evoluir de **site de casamento para casais** para **SaaS B2B2C de operaÃ§Ã£o e experiÃªncia digital para assessorias e cerimonialistas**.

Nome de trabalho: **ParaSempre Studio**.

Proposta de valor:

> A assessoria organiza vÃ¡rios casamentos em um Ãºnico painel e entrega a cada casal um portal privado, um site pÃºblico e uma operaÃ§Ã£o de convidados com a prÃ³pria marca.

Essa direÃ§Ã£o aproveita o que jÃ¡ estÃ¡ pronto â€” site pÃºblico, presentes, RSVP, recados, PIX, temas, painel e inÃ­cio de multi-tenant â€” e adiciona o que torna o produto vendÃ¡vel para profissionais: workspace, equipe, planejamento, orÃ§amento, fornecedores, cronograma, portal do cliente, white-label, cobranÃ§a e seguranÃ§a entre clientes.

## Documentos

1. [PLANO-MESTRE-SAAS-ASSESSORIAS.md](./PLANO-MESTRE-SAAS-ASSESSORIAS.md)
   VisÃ£o do negÃ³cio, posicionamento, planos, preÃ§os, monetizaÃ§Ã£o, mÃ©tricas e estratÃ©gia de venda.

2. [PRD-MODULOS-PREMIUM.md](./PRD-MODULOS-PREMIUM.md)
   Requisitos do produto, usuÃ¡rios, jornadas, mÃ³dulos premium, regras e critÃ©rios de aceite.

3. [ARQUITETURA-PRODUCAO.md](./ARQUITETURA-PRODUCAO.md)
   DiagnÃ³stico tÃ©cnico, arquitetura final, seguranÃ§a multi-tenant, billing, observabilidade, LGPD e gates de produÃ§Ã£o.

4. [MODELO-DADOS-E-API.md](./MODELO-DADOS-E-API.md)
   Modelo de domÃ­nio, entidades, permissÃµes, contratos de API e eventos assÃ­ncronos.

5. [ROADMAP-EXECUCAO.md](./ROADMAP-EXECUCAO.md)
   Fases, backlog priorizado, dependÃªncias, estimativas e checklist de lanÃ§amento.

## Leitura rÃ¡pida

### O que jÃ¡ tem valor

- Site pÃºblico por slug.
- Lista de presentes, reserva, RSVP, recados e PIX.
- PersonalizaÃ§Ã£o visual e dez temas.
- Painel administrativo do evento.
- Cadastro da plataforma e criaÃ§Ã£o de sites.
- React Query, Zod, React Hook Form, rate limit, bcrypt e JWT iniciados.
- Reserva de presente com transaÃ§Ã£o e bloqueio pessimista.

### O que impede vender hoje

- SessÃµes administrativas nÃ£o pertencem a um evento ou organizaÃ§Ã£o.
- Um usuÃ¡rio autenticado pode alterar outro tenant trocando o header da requisiÃ§Ã£o.
- Token de usuÃ¡rio da plataforma Ã© aceito em rotas administrativas porque os dois usam o mesmo segredo e a validaÃ§Ã£o administrativa nÃ£o verifica o tipo do token.
- Planos sÃ£o valores fixos no cÃ³digo, sem assinatura, entitlements ou limites no servidor.
- O onboarding termina em um segundo login nÃ£o relacionado Ã  conta criada.
- A confirmaÃ§Ã£o de compra de presente Ã© pÃºblica e nÃ£o exige segredo da reserva.
- Mensagens ocultas podem ser lidas pelo endpoint pÃºblico.
- TypeScript falha com 42 erros; hÃ¡ apenas 6 testes unitÃ¡rios de validaÃ§Ã£o.
- O bundle principal tem 1,56 MB minificado e 436,96 KB gzip.
- `npm audit --omit=dev` encontrou 8 vulnerabilidades, sendo 3 altas.
- NÃ£o hÃ¡ CI/CD, testes E2E, migraÃ§Ãµes versionadas, observabilidade, recuperaÃ§Ã£o de senha, verificaÃ§Ã£o de e-mail ou documentos legais.

### SequÃªncia recomendada

1. **Resgate tÃ©cnico e seguranÃ§a** â€” nÃ£o vender antes de concluir.
2. **Beta pago B2B** â€” workspace, eventos, conta Ãºnica, white-label bÃ¡sico e billing.
3. **Planejamento profissional** â€” tarefas, orÃ§amento, fornecedores, documentos e portal do cliente.
4. **OperaÃ§Ã£o premium** â€” cronograma do dia, mesas, check-in e automaÃ§Ãµes.
5. **Escala** â€” domÃ­nios, WhatsApp, IA assistiva, integraÃ§Ãµes e marketplace.

## Resultado comercial esperado

Meta inicial realista: validar 10 assessorias, converter 5 clientes pagantes e atingir ativaÃ§Ã£o em menos de 30 minutos. O objetivo nÃ£o Ã© competir imediatamente como ERP completo; Ã© vender primeiro a combinaÃ§Ã£o jÃ¡ prÃ³xima do projeto atual: **experiÃªncia digital white-label + RSVP + portal do casal + operaÃ§Ã£o centralizada**.
