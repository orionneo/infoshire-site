# Módulo de Garantia de 90 Dias - Documentação Completa

## Visão Geral

Este módulo implementa um sistema completo de garantia padrão de 90 dias para todas as ordens de serviço (OS) finalizadas no sistema de gestão de assistências técnicas.

## Funcionalidades Implementadas

### 1. Campos de Garantia no Banco de Dados

**Tabela: `service_orders`**

Novos campos adicionados:
- `data_conclusao` (timestamptz): Data em que a OS foi marcada como finalizada/pronta para retirada
- `data_retirada` (timestamptz): Data em que o cliente retirou o equipamento
- `data_fim_garantia` (timestamptz): Data de término da garantia (calculada automaticamente como data_conclusao + 90 dias)
- `em_garantia` (boolean): Indica se a OS ainda está dentro do período de garantia
- `retorno_garantia` (boolean): Indica se esta OS é um retorno de garantia de outra OS

### 2. Triggers Automáticos

**Trigger: `trigger_update_completion_date`**
- Dispara quando o status da OS muda para 'completed' ou 'ready_for_pickup'
- Define automaticamente `data_conclusao` com a data/hora atual
- Executa antes da atualização do registro

**Trigger: `trigger_calculate_warranty_end_date`**
- Dispara em INSERT ou UPDATE na tabela service_orders
- Calcula automaticamente `data_fim_garantia` (data_conclusao + 90 dias)
- Atualiza `em_garantia` baseado na data atual vs data_fim_garantia
- Executa antes da inserção/atualização do registro

### 3. View para Garantias Expirando

**View: `warranties_expiring_soon`**

Retorna todas as garantias que expirarão nos próximos 7 dias, incluindo:
- Informações da OS (número, equipamento, série)
- Dados do cliente (nome, email, telefone)
- Dias restantes de garantia
- Ordenado por data de expiração (mais próximas primeiro)

### 4. Edge Function para Verificação Diária

**Função: `check-warranties`**

Executada diariamente (via cron job ou manualmente), realiza:

1. **Atualização de Garantias Expiradas**
   - Marca `em_garantia = false` para todas as OSs com data_fim_garantia < data atual

2. **Listagem de Garantias Expirando**
   - Busca todas as garantias que expirarão nos próximos 7 dias

3. **Notificação via Telegram**
   - Envia relatório completo com:
     - Garantias expiradas hoje
     - Garantias expirando nos próximos 7 dias
     - Informações detalhadas de cada OS (número, cliente, equipamento, dias restantes)

**Como invocar manualmente:**
```typescript
import { checkWarrantiesManually } from '@/db/api';

const result = await checkWarrantiesManually();
```

### 5. API Functions

**Buscar Garantia por Cliente/Equipamento:**
```typescript
searchWarranty({
  clientId?: string,
  equipment?: string,
  serialNumber?: string
}): Promise<ServiceOrderWithClient[]>
```

**Listar OSs em Garantia:**
```typescript
getOrdersInWarranty({
  clientId?: string,
  startDate?: string,
  endDate?: string
}): Promise<ServiceOrderWithClient[]>
```

**Obter Garantias Expirando em Breve:**
```typescript
getWarrantiesExpiringSoon(): Promise<WarrantyExpiringSoon[]>
```

**Atualizar Data de Retirada:**
```typescript
updateOrderPickupDate(orderId: string, pickupDate: string): Promise<ServiceOrder>
```

**Marcar como Retorno de Garantia:**
```typescript
markAsWarrantyReturn(orderId: string, isWarrantyReturn: boolean): Promise<ServiceOrder>
```

### 6. Páginas Frontend

#### 6.1 Busca Rápida de Garantia (`/admin/warranty-search`)

Permite buscar garantias por:
- Equipamento (busca parcial)
- Número de série/etiqueta

Exibe:
- Lista de todas as OSs encontradas
- Status de garantia destacado (em garantia, expirada, sem garantia)
- Informações detalhadas de cada OS
- Dias restantes de garantia
- Data de conclusão e fim de garantia

#### 6.2 Listagem de Garantias Ativas (`/admin/warranty-list`)

Funcionalidades:
- Cards de resumo (total em garantia, expirando em breve, clientes ativos)
- Alerta destacado para garantias expirando nos próximos 7 dias
- Filtros:
  - Por cliente
  - Por período de conclusão (data início/fim)
- Exportação para CSV
- Lista completa com indicadores visuais para garantias expirando em breve

#### 6.3 Componente de Status de Garantia

Usado em:
- AdminOrderDetail
- ClientOrderDetail

Exibe:
- Badge de status (em garantia / expirada)
- Data de conclusão
- Data de retirada (se registrada)
- Data de fim de garantia
- Dias restantes (com alerta se < 7 dias)
- Indicador de retorno de garantia

Ações do Admin:
- Registrar data de retirada
- Marcar/desmarcar como retorno de garantia

### 7. Integração com Menu Admin

Novos itens no menu lateral:
- **Buscar Garantia** (ícone: Shield) - `/admin/warranty-search`
- **Garantias Ativas** (ícone: Shield) - `/admin/warranty-list`

## Fluxo de Funcionamento

### Fluxo 1: Criação de Garantia

1. Técnico marca OS como "Pronto para retirada" ou "Finalizado"
2. Trigger `trigger_update_completion_date` define `data_conclusao` automaticamente
3. Trigger `trigger_calculate_warranty_end_date` calcula:
   - `data_fim_garantia = data_conclusao + 90 dias`
   - `em_garantia = true` (se data atual < data_fim_garantia)
4. Cliente e técnico visualizam informações de garantia na tela de detalhes da OS

### Fluxo 2: Verificação Diária (Automática)

1. Edge function `check-warranties` é executada diariamente (via cron)
2. Atualiza `em_garantia = false` para garantias expiradas
3. Busca garantias expirando nos próximos 7 dias
4. Envia notificação via Telegram com relatório completo
5. Técnico recebe alerta e pode tomar ações preventivas

### Fluxo 3: Busca de Garantia

1. Cliente retorna com equipamento com problema
2. Técnico acessa "Buscar Garantia"
3. Informa equipamento ou número de série
4. Sistema lista todas as OSs anteriores
5. Destaca se alguma está em garantia
6. Técnico pode:
   - Criar nova OS marcada como "retorno de garantia"
   - Visualizar histórico completo do equipamento

### Fluxo 4: Gestão de Garantias

1. Admin acessa "Garantias Ativas"
2. Visualiza resumo e alertas de garantias expirando
3. Pode filtrar por cliente ou período
4. Exporta relatório em CSV para análise
5. Clica em OS específica para ver detalhes e tomar ações

## Configuração do Cron Job

Para executar a verificação diária automaticamente, configure um cron job no Supabase:

1. Acesse o painel do Supabase
2. Vá em "Database" > "Cron Jobs"
3. Crie um novo job:
   ```sql
   SELECT cron.schedule(
     'check-warranties-daily',
     '0 9 * * *', -- Executa todo dia às 9h
     $$
     SELECT net.http_post(
       url := 'https://[SEU_PROJETO].supabase.co/functions/v1/check-warranties',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer [SEU_ANON_KEY]"}'::jsonb,
       body := '{}'::jsonb
     );
     $$
   );
   ```

## Configuração do Telegram

Para receber notificações via Telegram:

1. Crie um bot no Telegram via @BotFather
2. Obtenha o token do bot
3. Adicione o token como secret no Supabase:
   - Nome: `TELEGRAM_BOT_TOKEN`
   - Valor: token do bot
4. Configure o Chat ID nas configurações do sistema
5. Ative as notificações do Telegram nas configurações

## Índices para Performance

Índices criados para otimizar consultas:
- `idx_service_orders_em_garantia`: Filtra OSs em garantia
- `idx_service_orders_data_fim_garantia`: Ordena por data de expiração
- `idx_service_orders_data_conclusao`: Filtra por data de conclusão
- `idx_service_orders_client_equipment`: Busca por cliente e equipamento

## Tipos TypeScript

```typescript
export type ServiceOrder = {
  // ... campos existentes
  data_conclusao: string | null;
  data_retirada: string | null;
  data_fim_garantia: string | null;
  em_garantia: boolean;
  retorno_garantia: boolean;
};

export type WarrantyExpiringSoon = {
  id: string;
  order_number: string;
  client_id: string;
  equipment: string;
  serial_number: string | null;
  data_conclusao: string;
  data_fim_garantia: string;
  em_garantia: boolean;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  dias_restantes: number;
};
```

## Testes Recomendados

1. **Teste de Criação de Garantia:**
   - Criar nova OS
   - Marcar como "Pronto para retirada"
   - Verificar se data_conclusao e data_fim_garantia foram definidas
   - Verificar se em_garantia = true

2. **Teste de Expiração:**
   - Criar OS com data_conclusao antiga (> 90 dias)
   - Executar check-warranties manualmente
   - Verificar se em_garantia = false

3. **Teste de Busca:**
   - Criar várias OSs para mesmo cliente/equipamento
   - Buscar por equipamento
   - Verificar se todas as OSs são listadas
   - Verificar destaque de garantias ativas

4. **Teste de Notificação:**
   - Criar OS com data_fim_garantia próxima (< 7 dias)
   - Executar check-warranties
   - Verificar se notificação Telegram foi enviada

## Manutenção

### Ajustar Período de Garantia

Para alterar o período padrão de 90 dias:

1. Edite a função `calculate_warranty_end_date` na migration
2. Altere `INTERVAL '90 days'` para o período desejado
3. Execute a migration atualizada

### Adicionar Novos Campos

Se precisar adicionar mais informações de garantia:

1. Crie nova migration adicionando campos
2. Atualize tipo `ServiceOrder` em `types.ts`
3. Atualize componente `WarrantyStatus` para exibir novos campos
4. Atualize páginas de busca/listagem se necessário

## Arquivos Criados/Modificados

### Novos Arquivos:
- `supabase/migrations/00031_add_warranty_fields.sql`
- `supabase/functions/check-warranties/index.ts`
- `src/pages/admin/WarrantySearch.tsx`
- `src/pages/admin/WarrantyList.tsx`
- `src/components/WarrantyStatus.tsx`

### Arquivos Modificados:
- `src/types/types.ts` - Adicionados campos de garantia e novos tipos
- `src/db/api.ts` - Adicionadas funções de garantia
- `src/routes.tsx` - Adicionadas rotas de garantia
- `src/components/layouts/AdminLayout.tsx` - Adicionados itens de menu
- `src/pages/admin/AdminOrderDetail.tsx` - Adicionado componente WarrantyStatus
- `src/pages/client/ClientOrderDetail.tsx` - Adicionado componente WarrantyStatus

## Suporte e Troubleshooting

### Garantia não está sendo criada automaticamente

Verifique:
1. Se a migration foi aplicada corretamente
2. Se os triggers estão ativos no banco de dados
3. Se o status da OS está sendo atualizado para 'completed' ou 'ready_for_pickup'

### Notificações Telegram não estão sendo enviadas

Verifique:
1. Se o TELEGRAM_BOT_TOKEN está configurado nos secrets
2. Se o Chat ID está configurado nas configurações do sistema
3. Se as notificações do Telegram estão ativadas
4. Logs da edge function para erros específicos

### Busca de garantia não retorna resultados

Verifique:
1. Se há OSs cadastradas para o cliente/equipamento buscado
2. Se a busca está usando termos corretos (case-insensitive)
3. Logs do console para erros de API

## Conclusão

O módulo de garantia está completamente integrado ao sistema existente, seguindo os mesmos padrões de código e arquitetura. Todas as funcionalidades foram implementadas conforme solicitado, incluindo:

✅ Campos de garantia no banco de dados
✅ Cálculo automático de data de fim de garantia
✅ Triggers para atualização automática
✅ Edge function para verificação diária
✅ Notificações via Telegram
✅ Páginas de busca e listagem
✅ Componente de status de garantia
✅ Integração com páginas existentes
✅ Rotas e menu atualizados
✅ Tipos TypeScript completos
✅ Documentação completa
