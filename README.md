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






talvez fazer quando limpar a conversa apagar o context tmb






# Plano: Camada de IA para Entendimento de Mensagens no Bot de WhatsApp

## Resumo
Adicionar uma camada de entendimento semântico ao bot de WhatsApp para interpretar frases livres como `abre as opcoes`, `quero ver minhas contas` ou `tem encomenda pra mim`, sem transformar o bot inteiro em um fluxo dependente de LLM.

A arquitetura será **híbrida**:
- primeiro, fluxo determinístico e barato
- depois, IA **somente** quando o parser determinístico falhar
- para mensagens de usuários não cadastrados ou sem residência, **nenhuma chamada de IA**
- modelo principal: **OpenAI `gpt-5-nano`**
- sem fallback para modelo maior por enquanto
- quando a confiança vier baixa, o fallback será **mostrar o menu**, não fazer uma segunda chamada

Isso minimiza custo, reduz desperdício de tokens e evita gastar com pessoas que nem pertencem ao condomínio.

## Decisões fechadas
- Provedor inicial de IA: **OpenAI**
- Arquitetura da camada de IA: **adapter agnóstico a provedor**, com implementação OpenAI agora
- Escopo da IA: **somente frase livre**, quando o parser determinístico não resolver
- Estratégia de modelo: **`gpt-5-nano` como modelo principal**
- Baixa confiança: **mostrar menu**, sem escalar para outro modelo
- Usuário não cadastrado: **resposta fixa**, sem IA
- Usuário sem residência: **resposta fixa**, sem IA
- Seleções numéricas e fluxos explícitos (`1`, `2`, `trocar unidade`, `reiniciar`): **sem IA**

## Justificativa de modelo e custo
Com base nos preços oficiais atuais da OpenAI em 3 de março de 2026:
- `gpt-5-nano`: **$0.05 / 1M input** e **$0.40 / 1M output**
- `gpt-4o-mini`: **$0.15 / 1M input** e **$0.60 / 1M output**

Fontes oficiais:
- [OpenAI Pricing](https://platform.openai.com/docs/pricing/)
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [GPT-5 for developers](https://openai.com/index/introducing-gpt-5-for-developers)

Para esse caso de uso, `gpt-5-nano` é a melhor escolha porque:
- as mensagens são curtas
- a saída será só classificação estruturada
- o bot já tem contexto determinístico de condomínio/unidade
- não precisamos de geração longa nem raciocínio profundo
- o maior risco está em custo desnecessário, não em tarefa complexa

## Objetivo funcional
Permitir que o bot entenda variações semânticas de comandos sem exigir frases exatas.

Exemplos:
- `abre as opcoes` -> `MENU`
- `quero meus boletos` -> `CONSULTAR_BOLETOS`
- `tem correspondencia` -> `VER_ENCOMENDAS`
- `quero registrar um problema` -> `ABRIR_OCORRENCIA`

Sem IA, essas mensagens hoje caem em “não entendi” ou exigem alias demais no parser.

## Estratégia geral
## Camada 1: gate determinístico
Antes de qualquer IA, o fluxo continua exatamente como já está:

1. validar canal
2. normalizar telefone
3. carregar/criar `ConversationContext`
4. resolver identidade com `IdentityResolutionService`
5. se `UNIDENTIFIED`: resposta fixa
6. se `NO_RESIDENCE`: resposta fixa
7. se `NEEDS_CONDOMINIUM_SELECTION`: fluxo determinístico
8. se `NEEDS_UNIT_SELECTION`: fluxo determinístico
9. se `AWAITING_OCCURRENCE_INPUT`: fluxo determinístico
10. só quando o contexto estiver resolvido e o parser determinístico falhar, chamar IA

## Camada 2: parser determinístico
Continuar usando o parser atual para:
- `menu`
- `consultar boletos`
- `consultar documentos`
- `listar espacos`
- `ver minhas encomendas`
- `abrir ocorrencia`
- `trocar unidade`
- `trocar condominio`
- `reiniciar`
- opções numéricas (`1`, `2`, `3`, etc.)

Se o parser resolver, o fluxo termina ali.
Sem IA.

## Camada 3: classificador semântico por IA
A IA entra apenas quando:
- o usuário está identificado
- condomínio e unidade já foram resolvidos quando necessário
- a mensagem não bate com comando determinístico
- o bot não está em um estado transacional rígido como `AWAITING_CONDOMINIUM_SELECTION` ou `AWAITING_UNIT_SELECTION`

A IA não vai “conversar livremente”.
Ela vai apenas classificar a intenção e devolver JSON curto.

## Arquitetura proposta
## 1. Novo adapter de IA
Criar uma interface interna para desacoplar o fluxo do provedor:

### `IntentClassifier`
Método:
```ts
classify(params: ClassifyIntentParams): Promise<ClassifyIntentResult>
```

### `ClassifyIntentParams`
Campos:
- `message: string`
- `availableIntents: IntentCode[]`
- `conversationState: string`
- `hasCondominiumResolved: boolean`
- `hasUnitResolved: boolean`

### `ClassifyIntentResult`
Campos:
- `intent: IntentCode | 'UNKNOWN'`
- `confidence: 'HIGH' | 'LOW'`
- `normalizedText?: string`
- `reason?: string`

### `IntentCode`
Valores:
- `MENU`
- `CONSULTAR_BOLETOS`
- `CONSULTAR_DOCUMENTOS`
- `LISTAR_ESPACOS`
- `VER_ENCOMENDAS`
- `ABRIR_OCORRENCIA`
- `TROCAR_UNIDADE`
- `TROCAR_CONDOMINIO`
- `REINICIAR`
- `UNKNOWN`

## 2. Implementação OpenAI
Criar:
- `src/modules/whatsapp/ai/intent-classifier.interface.ts`
- `src/modules/whatsapp/ai/openai-intent-classifier.service.ts`
- opcional recomendado: `src/modules/whatsapp/ai/dto/classify-intent-result.ts`

### Responsabilidade do serviço OpenAI
- receber a frase livre
- enviar um prompt curto para `gpt-5-nano`
- exigir saída estruturada
- devolver somente intenção classificada

### API recomendada
Usar a **Responses API** da OpenAI com saída JSON estruturada.

## 3. Ponto de integração no fluxo atual
O ponto certo para integrar a IA é dentro de [`intent-dispatcher.service.ts`](/Users/antoniovitafonseca/dev/cond/src/modules/whatsapp/intent-dispatcher.service.ts), logo depois do parser determinístico falhar e antes de cair no default “não entendi”.

### Regra
Hoje o dispatcher faz:
- `extractCommand(...)`
- `switch (command)`
- `default -> menu + nao entendi`

Vamos mudar para:
1. `extractCommand(...)`
2. se comando conhecido, segue fluxo atual
3. se comando desconhecido e contexto resolvido, chamar `IntentClassifier`
4. se IA devolver `HIGH`, mapear para o comando interno correspondente
5. se IA devolver `LOW` ou `UNKNOWN`, mostrar menu

## Comportamento detalhado
## Quando NÃO chamar IA
Não chamar IA em nenhum desses casos:
- `UNIDENTIFIED`
- `NO_RESIDENCE`
- `NEEDS_CONDOMINIUM_SELECTION`
- `NEEDS_UNIT_SELECTION`
- mensagem numérica usada em seleção
- comandos globais exatos
- `AWAITING_OCCURRENCE_INPUT`
- mensagem vazia

## Quando chamar IA
Chamar IA quando:
- `identity.status === 'RESOLVED'`
- o parser determinístico não encontrou comando
- `contextState` não exige input rígido
- existe texto livre do usuário

## Exemplo de fluxo real
### Caso 1
Usuário:
- `abre as opcoes`

Fluxo:
1. parser determinístico falha
2. IA recebe a frase
3. IA devolve:
```json
{ "intent": "MENU", "confidence": "HIGH" }
```
4. dispatcher trata como `menu`

### Caso 2
Usuário:
- `quero ver minhas contas`

IA devolve:
```json
{ "intent": "CONSULTAR_BOLETOS", "confidence": "HIGH" }
```

### Caso 3
Usuário:
- `acho que preciso falar algo`

IA devolve:
```json
{ "intent": "UNKNOWN", "confidence": "LOW" }
```

Ação:
- mostrar menu
- não chamar outro modelo
- não responder de forma “criativa”

## Prompt e saída do classificador
## Prompt de sistema recomendado
O modelo deve receber instruções curtas, restritivas e sem abertura para conversação.

Exemplo de intenção do prompt:
- você é um classificador de intenção para um bot de condomínio
- classifique a mensagem do usuário em uma única intenção
- responda apenas JSON válido
- se a frase for ambígua, use `UNKNOWN`
- não invente intenções fora da lista fornecida

## Prompt de entrada recomendado
Campos enviados:
- mensagem do usuário
- lista de intenções disponíveis
- estado da conversa
- se condomínio está resolvido
- se unidade está resolvida

## Saída JSON obrigatória
```json
{
  "intent": "MENU",
  "confidence": "HIGH"
}
```

Valores válidos:
- `intent`: um `IntentCode` ou `UNKNOWN`
- `confidence`: `HIGH` ou `LOW`

## Mudanças específicas no código
## 1. `WhatsappModule`
Adicionar provider da IA:
- `OpenAiIntentClassifierService`

Se usar env/config:
- registrar `ConfigModule` se ainda não existir no projeto
- ou injetar `process.env.OPENAI_API_KEY` diretamente no primeiro corte

## 2. `IntentDispatcherService`
Refatorar para:
- manter `extractCommand`
- adicionar `resolveIntent(...)`
- `resolveIntent(...)` tenta:
  1. parser determinístico
  2. IA
  3. fallback para menu

### Novo fluxo interno sugerido
```ts
const resolvedIntent = await this.resolveIntent(params);

switch (resolvedIntent) {
  ...
}
```

## 3. Novo service `OpenAiIntentClassifierService`
Responsabilidades:
- montar prompt
- chamar OpenAI
- validar/parsing do JSON
- se resposta vier inválida, devolver `UNKNOWN/LOW`

## 4. Novo util de rate control opcional
Não obrigatório no primeiro corte, mas recomendado no plano:
- limitar chamadas por `phone` por janela curta
- evitar custo por spam

Exemplo:
- no máximo 1 classificação por mensagem
- no máximo X classificações por minuto por telefone

## 5. `ConversationContext`
Não precisa mudar o schema agora.

Opcional:
- guardar em `contextJson.lastIntentSource` um valor como:
  - `deterministic`
  - `ai_high_confidence`
  - `ai_low_confidence`
Isso ajuda debugging, mas pode ficar fora do primeiro corte.

## Configuração necessária
## Variáveis de ambiente
Adicionar:
- `OPENAI_API_KEY`
- opcional: `OPENAI_INTENT_MODEL=gpt-5-nano`

## Defaults
- modelo default: `gpt-5-nano`
- timeout por chamada: 2 a 4 segundos
- temperatura: baixa ou padrão equivalente
- saída sempre estruturada

## Interfaces públicas e tipos novos
## Novo tipo `IntentCode`
```ts
export type IntentCode =
  | 'MENU'
  | 'CONSULTAR_BOLETOS'
  | 'CONSULTAR_DOCUMENTOS'
  | 'LISTAR_ESPACOS'
  | 'VER_ENCOMENDAS'
  | 'ABRIR_OCORRENCIA'
  | 'TROCAR_UNIDADE'
  | 'TROCAR_CONDOMINIO'
  | 'REINICIAR'
  | 'UNKNOWN';
```

## Novo contrato `ClassifyIntentResult`
```ts
export interface ClassifyIntentResult {
  intent: IntentCode;
  confidence: 'HIGH' | 'LOW';
  normalizedText?: string;
  reason?: string;
}
```

## Novo contrato `IntentClassifier`
```ts
export interface IntentClassifier {
  classify(params: ClassifyIntentParams): Promise<ClassifyIntentResult>;
}
```

## Regras de custo
## Nunca gastar token em:
- telefone não cadastrado
- usuário sem residência
- seleção de condomínio/unidade
- menu numérico
- estados rígidos do fluxo
- mensagens vazias

## Gastar token apenas em:
- frase livre de usuário já autenticado/contextualizado
- uma única chamada por mensagem
- prompt curto
- saída JSON mínima

## Estimativa qualitativa de custo
Com mensagens curtas, prompt pequeno e JSON curto:
- `gpt-5-nano` deve custar uma fração muito pequena por mensagem
- o maior ganho vem do gate determinístico, não do modelo em si

Por isso o plano prioriza:
- reduzir o número de chamadas
- reduzir o tamanho do prompt
- reduzir o tamanho do output
- evitar fallback em cascata

## Observabilidade mínima
Adicionar logs estruturados para:
- `phoneHash`
- `contextState`
- `deterministicHit: boolean`
- `aiCalled: boolean`
- `aiIntent`
- `aiConfidence`
- `finalIntent`

Isso permite medir:
- quantas mensagens foram resolvidas sem IA
- quantas precisaram de IA
- onde a IA está errando
- quanto custo evitamos

## Testes e cenários
## Testes determinísticos
- `menu` não chama IA
- `2` em seleção de unidade não chama IA
- `reiniciar` não chama IA
- `consultar boletos` não chama IA

## Testes sem IA por identidade
- usuário não identificado não chama IA
- usuário sem residência não chama IA

## Testes com IA
- `abre as opcoes` -> `MENU`
- `quero meus boletos` -> `CONSULTAR_BOLETOS`
- `quero ver os documentos` -> `CONSULTAR_DOCUMENTOS`
- `tem encomenda pra mim` -> `VER_ENCOMENDAS`
- `quero relatar um problema` -> `ABRIR_OCORRENCIA`

## Testes de fallback
- resposta inválida da OpenAI -> menu
- timeout -> menu
- `confidence = LOW` -> menu
- `intent = UNKNOWN` -> menu

## Testes de custo/comportamento
- mesma mensagem conhecida não chama IA
- seleção numérica não chama IA
- usuário fora da base não chama IA

## Rollout recomendado
## Fase 1
- implementar interface `IntentClassifier`
- implementar OpenAI classifier
- integrar no dispatcher
- logs básicos
- fallback para menu

## Fase 2
- métricas de uso
- tuning do prompt
- adicionar aliases semânticos aprendidos a partir de logs
- reduzir ainda mais dependência da IA com melhorias no parser determinístico

## Fase 3
- opcional: classificador por few-shot melhorado
- opcional: usar `gpt-4o-mini` apenas em ambientes de teste/comparação offline
- opcional: eval suite com frases reais anonimizadas

## Assunções explícitas
- o bot continuará sendo predominantemente determinístico
- IA não responderá livremente ao usuário; só classificará intenção
- OpenAI será o primeiro provedor
- `gpt-5-nano` será o modelo padrão
- não haverá fallback para modelo maior no primeiro corte
- fallback para baixa confiança será mostrar menu
- `ConversationContext` atual é suficiente para essa fase
- o projeto aceitará usar `OPENAI_API_KEY` como segredo operacional

## Resultado esperado
Ao final da implementação:
- o bot entenderá frases livres comuns sem depender de comandos exatos
- o custo ficará controlado porque a IA só entra quando realmente precisa
- usuários fora da base não consumirão tokens
- o fluxo atual de condomínio/unidade continuará determinístico
- a camada de IA ficará desacoplada, permitindo trocar de provedor depois
