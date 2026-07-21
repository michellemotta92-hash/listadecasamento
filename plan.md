# Plano de Correções e Melhorias — ParaSempre

## BUGS CRÍTICOS 🔴

### 1. Race condition — reservas duplicadas
**Arquivo:** `server/routes.ts:120-129`
Check + update em queries separadas. Dois usuários simultâneos podem reservar o mesmo presente.

**Fix:** transação com `SELECT ... FOR UPDATE`:
```sql
BEGIN;
SELECT id, status FROM gift_items WHERE id = $1 FOR UPDATE;
-- só continua se disponivel
UPDATE gift_items SET status = 'reservado' WHERE id = $1;
COMMIT;
```

---

### 2. Expire query reseta presentes errados
**Arquivo:** `server/index.ts:62-64` e `server/routes.ts:29-31`

Segunda query busca TODAS reservas `expirada` (incluindo históricas). Se User A tinha reserva antiga expirada no mesmo presente que User B acabou de reservar, o presente de B é incorretamente resetado para `disponivel`.

**Fix:**
```sql
UPDATE gift_items SET status = 'disponivel'
WHERE status = 'reservado'
  AND id NOT IN (SELECT gift_item_id FROM gift_reservations WHERE status = 'pendente')
  AND id IN (SELECT gift_item_id FROM gift_reservations WHERE status = 'expirada');
```
Aplicar nos dois lugares (cron em `index.ts` e inline em `routes.ts` GET /gifts).

---

### 3. Autenticação sem segurança (CRÍTICO)
**Arquivo:** `server/routes.ts:244-252`, `src/lib/services/auth.ts`

- Senha armazenada e comparada em plaintext no DB
- Token estático hardcoded `'parasempre-admin-token'` retornado para todos os usuários
- Nenhum middleware valida token — endpoints admin completamente abertos
- Frontend armazena apenas `'true'` no localStorage

**Fix:**
1. Hash de senha com `bcrypt` no cadastro e `bcrypt.compare` no login
2. Gerar JWT real com `jsonwebtoken` (payload: userId, exp: 24h)
3. Middleware `requireAuth` que valida Bearer token em todas as rotas `/api/admin/*`

---

### 4. GiftReservationFlow mostra "Você reservou" para visitante errado
**Arquivo:** `src/components/public/GiftReservationFlow.tsx:113`

```tsx
// PROBLEMA: gift.status === 'reservado' pode ser reserva de outra pessoa
(gift.status === 'reservado' && reservationStatus !== 'confirming')
```

Se outro usuário reservou, `gift.status === 'reservado'` mas `reservationStatus === 'idle'` — exibe mensagem errada.

**Fix:** remover a segunda condição. Mostrar estado "reservado" apenas quando `reservationStatus === 'reserved'` (localStorage local).

---

### 5. handleBuyClick ignora falha na reserva
**Arquivo:** `src/components/public/GiftReservationFlow.tsx:53-58`

Se `createReservation` retorna `null`, modal abre e conta regressiva redireciona para loja sem reserva criada.

**Fix:**
```tsx
const handleBuyClick = useCallback(async () => {
  setReservationStatus('reserving');
  const result = await createReservation(gift.id);
  if (!result) {
    setReservationStatus('idle');
    // mostrar toast de erro
    return;
  }
  setIsModalOpen(true);
  setCountdown(10);
}, [gift.id]);
```

---

## BUGS MÉDIOS 🟡

### 6. Tenant hardcoded em todo lugar
**Arquivo:** `server/routes.ts` (linhas 22, 74, 107, 157, 168, 196, 205, 224, 229)

`getTenantId('miejohn')` hardcoded em todos os endpoints. DB é multi-tenant mas API é single-tenant.

**Fix temporário:** extrair slug para variável de ambiente `TENANT_SLUG=miejohn`.
**Fix correto:** passar slug via header `X-Tenant` ou subdomínio.

---

### 7. `sort_order` ausente no tipo GiftItem
**Arquivo:** `src/types/index.ts:14`

Campo existe no DB e na API mas não no TypeScript interface.

**Fix:** adicionar `sort_order?: number` à interface `GiftItem`.

---

### 8. `require()` em módulo ESM
**Arquivo:** `server/routes.ts:352-353`

`require('https')` / `require('http')` em arquivo compilado como ESM. Funciona via `tsx` mas é bug latente.

**Fix:** `import https from 'https'; import http from 'http';` no topo do arquivo.

---

### 9. CORS aberto em produção
**Arquivo:** `server/index.ts:13`

`Access-Control-Allow-Origin: '*'` permite qualquer origem chamar a API.

**Fix:** restringir para domínio do frontend em produção via variável de ambiente.

---

### 10. Modal de redirect sem fechar
**Arquivo:** `src/components/public/GiftReservationFlow.tsx:144`

`onClose={() => {}}` vazio. Se navegador bloquear popup, usuário fica preso no modal sem poder fechar.

**Fix:** permitir fechar após 3s ou adicionar botão "Abrir manualmente".

---

### 11. Sem validação de input
**Arquivo:** `server/routes.ts:170, 207`

`guest_name`, `message`, `guests_count` sem limites nem sanitização.

**Fix:**
- `guest_name`: max 100 chars
- `message`: max 1000 chars
- `guests_count`: min 1, max 20, parseInt obrigatório

---

### 12. guest_name hardcoded na reserva
**Arquivo:** `server/routes.ts:136`

```ts
[gift_id, gift.tenant_id, 'Convidado', null, 'pendente', expiresAt]
```

Nome e email do convidado nunca são coletados. Casal não sabe quem reservou.

**Fix:** coletar nome + email antes de reservar (modal antes do redirect).

---

## IDEIAS PARA CRESCER 🟢

### Feature 1 — Coleta de dados do convidado
Antes de reservar, pedir nome e email. Já existe campo no DB (`guest_name`, `guest_email`).
- Casal vê quem comprou o quê no painel admin
- Habilita notificações e agradecimentos

### Feature 2 — Notificação por email / WhatsApp
Quando presente é confirmado (`comprado`), notificar casal com:
- Nome do presente
- Nome do convidado
- **Email:** Nodemailer + SMTP
- **WhatsApp:** Twilio / Z-API (mais efetivo no Brasil)

### Feature 3 — Presente em grupo (vaquinha)
Vários convidados contribuem para presente caro. Ex: TV R$ 3.000 → 6 pessoas × R$ 500.
- Novo campo `contribution_value` em `gift_items`
- Nova tabela `gift_contributions`
- Barra de progresso de arrecadação

### Feature 4 — Pix / Fundo Honeymoon
Seção separada com chave Pix ou QR code para contribuições em dinheiro.
- Simples: exibir QR code + chave configurada no admin
- Avançado: integrar MercadoPago para rastrear pagamentos

### Feature 5 — Busca por nome de presente
Campo de busca na página de presentes. Com 50+ itens fica difícil achar.
- Input controlado + `useMemo` filtrando por `name.toLowerCase().includes(search)`

### Feature 6 — QR Code para convite físico
Gerar QR code no painel admin que leva para o site. Casal cola no convite impresso.
- Biblioteca: `qrcode` (npm)
- Download como PNG direto do painel

### Feature 7 — Nota de agradecimento
Após confirmar presente, casal escreve mensagem personalizada → enviada por email ao convidado.
- Depende da Feature 1 (coletar email do convidado)

### Feature 8 — Multi-tenant real
Desbloquear estrutura já existente no DB. Cada casal tem slug/domínio próprio.
- Monetização: plano gratuito (20 presentes) + pago (ilimitado)
- Remover hardcode `'miejohn'` dos endpoints (ver Bug #6)

---

## Ordem de Prioridade Sugerida

| # | Item | Tipo | Impacto |
|---|------|------|---------|
| 1 | Race condition reservas | Bug crítico | Perda de dados |
| 2 | Expire query errada | Bug crítico | Quebra reservas |
| 3 | Auth com bcrypt + JWT | Bug crítico | Segurança |
| 4 | GiftReservationFlow condição errada | Bug crítico | UX errada |
| 5 | handleBuyClick sem error handling | Bug crítico | Reserva fantasma |
| 6 | Coleta nome/email convidado | Feature | Dados reais |
| 7 | sort_order no tipo GiftItem | Bug médio | TypeScript |
| 8 | Validação de input | Bug médio | Segurança |
| 9 | Busca por nome | Feature | UX |
| 10 | Notificação email/WhatsApp | Feature | Valor para casal |
| 11 | Pix / Honeymoon fund | Feature | Conversão |
| 12 | Presente em grupo | Feature | Diferencial |
| 13 | QR Code | Feature | Marketing |
| 14 | Multi-tenant real | Feature | Escala |
