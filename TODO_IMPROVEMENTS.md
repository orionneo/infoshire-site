# Task: Implementar Status "Não Aprovado" e Corrigir Bug Financeiro

## Plan
- [x] Análise inicial do projeto
- [x] Adicionar novo status "not_approved" ao tipo OrderStatus
- [x] Atualizar componente OrderStatusBadge para incluir o novo status
- [x] Modificar edge function send-telegram-notification para suportar notificação de não aprovação
- [x] Atualizar AdminOrderDetail para incluir botão WhatsApp quando status for "not_approved"
- [x] Corrigir bug de data no AdminFinancial (mostrando dezembro ao invés do mês correto)
- [x] Corrigir bug no vite.config.ts (includeAssets)
- [x] Testar lint
- [x] Adicionar 'not_approved' ao enum do banco de dados (migration)
- [x] Melhorar mensagem de não aprovação com texto empático

## Notes
- Bug identificado e corrigido: getMonthlyRevenue estava usando date.getMonth() que tinha problemas de timezone
- Solução: extrair mês diretamente da string ISO (substring(0, 7)) ao invés de usar Date object
- Status "not_approved" adicionado com sucesso
- Telegram notification implementada para "not_approved"
- WhatsApp message para "not_approved" implementada com informação sobre retirada em 7 dias ou taxa de R$20/dia
- Similar ao fluxo de "ready_for_pickup" mas com mensagem diferente
- Bug no vite.config.ts corrigido (miaodaDevPlugin() estava dentro do array includeAssets)
- Lint passou com sucesso!
- **CRÍTICO**: Migration criada para adicionar 'not_approved' ao enum order_status no banco de dados

## Implementações Realizadas

### 1. Novo Status "Não Aprovado - Cancelado"
- Adicionado ao tipo OrderStatus em types.ts
- Configurado no OrderStatusBadge com variant "destructive" (vermelho)
- Disponível no dropdown de status do admin
- **Migration aplicada**: Enum order_status no banco de dados atualizado

### 2. Notificação Telegram
- Edge function atualizada para suportar notificationType: 'approved' | 'not_approved'
- Mensagem específica para orçamento não aprovado com informações sobre retirada

### 3. Fluxo WhatsApp para Não Aprovado
- Quando admin muda status para "not_approved":
  - Mensagem salva no chat interno
  - WhatsApp abre automaticamente (se cliente tiver telefone)
  - Mensagem informa sobre prazo de 7 dias e taxa de R$20/dia
  - Notificação Telegram enviada automaticamente

### 4. Correção Bug Financeiro
- Problema: Mês sendo exibido incorretamente (dezembro ao invés do mês correto)
- Causa: Conversão de timezone ao usar Date.getMonth()
- Solução: Extração direta do mês da string ISO usando substring(0, 7)

### 5. Correção Banco de Dados
- Problema: Admin não conseguia atualizar status para "not_approved"
- Causa: Enum order_status no banco não incluía o novo valor
- Solução: Migration 00030_add_not_approved_status_to_enum.sql aplicada com sucesso
- Verificado: Enum agora contém todos os 9 status incluindo 'not_approved'

### 6. Melhoria na Mensagem de Não Aprovação
- Adicionada linha empática no início da mensagem: "Lamentamos que você não aprovou o orçamento que enviamos"
- Mensagem atualizada tanto no chat interno quanto no WhatsApp
- Tom mais profissional e empático ao comunicar a não aprovação do orçamento
- Adicionado endereço completo: Rua Expedicionário Hélio Alves de Camargo, 614, Jd. Chapadão, Campinas - SP
- Incluídos links diretos para Google Maps e Waze para facilitar a localização
- Horário de atendimento detalhado (Segunda a sexta: 09:00 às 19:00 | Sábado: 09:00 às 16:00)
- Mensagem completa e profissional com todas as informações necessárias para retirada do equipamento
