## Contexto do produto
- Moradores usam WhatsApp para: reservas de espaços, receber/enviar boletos/2ª via, receber notificações de encomendas, abrir ocorrências/chamados, receber avisos/comunicados, consultar documentos.
- Síndicos e funcionários usam painel web para: cadastrar encomendas, aprovar/rejeitar reservas, publicar comunicados, gerenciar documentos, acompanhar ocorrências e financeiro.
- Haverá um "Client" (conta assinante do pacote / dono do contrato), e dentro dele existem condomínios.

## Decisões de modelagem (importantes)
- Deve existir entidade **Client** (assinante do pacote). Um Client pode ter vários condomínios.
- Deve existir entidade **Condominium**.
- NÃO vamos modelar bloco/torre/building (sem Block/Building).
- Deve existir entidade **Unit** (unidade).
- Deve existir entidade **User**.
- Um **User pode ter mais de uma Unit** (N:N via tabela de associação).
- Usuário pode ter **mais de 1 role** (roles como enum, mas relacionamento N:N em tabela `user_roles`).
- Sobre conversas do WhatsApp: NÃO armazenar histórico completo. No máximo um **contexto pequeno em JSON** + `state`, com **expiração (TTL)** e rotina para limpar (para não crescer).
- Deve existir **Space** (espaços), **Booking** (reservas).
- NÃO vamos criar entidade SpaceAvailabilityRule (regras de espaço ficam em `rules_json` no Space).
- BookingApproval separado NÃO é necessário: decisão de aprovação/rejeição pode ficar dentro do Booking (campos `decision_by`, `decision_at`, `decision_note`) e trilha pode ser via `audit_logs`.
- Spaces podem ser pagos ou não: deixar suporte no modelo (ex.: `is_paid`, `price_amount`). Integração de pagamento fica em aberto, mas o modelo deve suportar.
- Deve existir **Package** (encomendas). Não criar PackageMedia; usar anexos/mídia genérica.
- Deve existir **Occurrence** (ocorrências/chamados) e comentários.
- Deve existir **Invoice** (boletos/cobranças) e **Payment** (pagamentos) de forma unificada (boletos do condomínio e taxas de reserva podem virar invoices).
- Deve existir **PaymentReceipt** (comprovante enviado) com revisão (aprovado/rejeitado).
- Deve existir **Announcement** (avisos/comunicados) + opcional deliveries (rastreamento).
- Deve existir **Document** (documentos do condomínio).
- Deve existir **Media** + **Attachment** genérico (para anexar arquivos a qualquer entidade).
- Recomendado: **AuditLog** para trilha de ações (aprovação, baixa de encomenda, etc.).
- Recomendado: WhatsAppMessage log (idempotência, rastreio de envio). Se implementar, manter simples.

## Entidades e tabelas (propor modelo relacional em Postgres)
Crie as tabelas abaixo, com chaves, índices e constraints:
1) clients
2) condominiums (FK -> clients)
3) units (FK -> condominiums; unique(condominium_id, code))
4) users (FK -> condominiums; unique(condominium_id, phone_e164))
5) user_roles (PK composta user_id + role enum)
6) unit_memberships (FK -> users, units; unique(user_id, unit_id); campos type/is_primary/status/datas)
7) conversation_contexts (context_json jsonb, state string, expires_at timestamp; FK -> condominium; FK opcional user_id; phone_e164 opcional)
8) whatsapp_messages (opcional, mas recomendado): direction, wa_message_id unique, payload_json, status
9) spaces (rules_json jsonb; requires_approval; is_paid; price_amount)
10) bookings (FK -> condominium, space, unit, requested_by; status; start_at/end_at; termos; decisão embutida: decision_by/at/note)
11) packages (FK -> condominium, unit, received_by; status; received_at/picked_up_at)
12) occurrences + occurrence_comments (FKs; status; category; priority; assigned_to opcional)
13) invoices (FK -> condominium, unit; type; competence; due_date; amount; status; barcode/linha_digitavel; external_reference)
14) payments (FK -> condominium; FK opcional invoice_id; FK opcional booking_id; amount; method; status; paid_at; external_reference)
15) payment_receipts (FK -> payment; sent_by; status; reviewed_by/at/note)
16) announcements (+ opcional announcement_deliveries)
17) documents (FK -> condominium; uploaded_by; media_id; visibility)
18) media (provider/bucket/key/mime/size; FK condominium; uploaded_by opcional)
19) attachments (media_id + entity_type + entity_id)
20) audit_logs (actor, action, entity_type/id, metadata_json)

## Requisitos técnicos
- Use uuid como PK.
- Use `created_at`/`updated_at` em quase todas.
- Use jsonb onde indicado.
- Pense em índices para consultas comuns:
  - bookings por space_id + intervalo de data
  - packages por unit_id + status
  - occurrences por status/assigned_to
  - invoices por unit_id + competence/status
  - payments por invoice_id/status
  - conversation_contexts por phone_e164/user_id e expires_at
  - whatsapp_messages por wa_message_id e phone_e164
- Pense em integridade: cascades apropriados e `ON DELETE` bem definido (evitar apagar histórico crítico).




