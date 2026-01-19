# 📱 Sistema de Notificação WhatsApp Automática e Garantia - Documentação Completa

## 📋 Visão Geral

Sistema completo de notificação automática via WhatsApp quando uma Ordem de Serviço é finalizada, integrado ao sistema de garantia de 90 dias. Inclui templates configuráveis pelo administrador e envio automático com informações de garantia.

## 🎯 Objetivos

1. **Notificar cliente automaticamente** quando OS for finalizada
2. **Informar sobre garantia de 90 dias** com data de término
3. **Permitir personalização** dos templates de mensagem
4. **Integrar com sistema de garantia** existente
5. **Fornecer controle administrativo** sobre envio automático

## 🚀 Funcionalidades Implementadas

### 1. Sistema de Garantia Automático

**Triggers do Banco de Dados (Migration 00031):**

#### Trigger 1: Calcular Data de Fim de Garantia
```sql
CREATE TRIGGER trigger_calculate_warranty_end_date
  BEFORE INSERT OR UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_warranty_end_date();
```

**Funcionamento:**
- Quando `data_conclusao` é definida → calcula `data_fim_garantia` (data_conclusao + 90 dias)
- Define `em_garantia` como `true` se data atual ≤ data_fim_garantia
- Atualiza automaticamente `em_garantia` baseado na data atual

#### Trigger 2: Atualizar Data de Conclusão
```sql
CREATE TRIGGER trigger_update_completion_date
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_completion_date_on_status_change();
```

**Funcionamento:**
- Quando status muda para `'completed'` ou `'ready_for_pickup'`
- E `data_conclusao` ainda não foi definida
- Define `data_conclusao` como `CURRENT_TIMESTAMP`
- Isso dispara automaticamente o Trigger 1 que calcula a garantia

**Campos de Garantia:**
- `data_conclusao` (timestamptz) - Data em que a OS foi marcada como finalizada
- `data_retirada` (timestamptz) - Data em que o cliente retirou o equipamento
- `data_fim_garantia` (timestamptz) - Data de término da garantia (data_conclusao + 90 dias)
- `em_garantia` (boolean) - Indica se a OS ainda está dentro do período de garantia
- `retorno_garantia` (boolean) - Indica se esta OS é um retorno de garantia

### 2. Tabela de Configurações do Sistema

**Migration 00032: system_settings**

```sql
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  setting_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Configurações Padrão Inseridas:**

1. **whatsapp_template_order_completed**
   - Template de mensagem para OS finalizada
   - Inclui variáveis: {nome_cliente}, {numero_os}, {equipamento}, {data_conclusao}, {data_fim_garantia}

2. **whatsapp_auto_send_on_completion**
   - Habilitar/desabilitar envio automático
   - Valores: 'true' ou 'false'

3. **whatsapp_template_not_approved**
   - Template para orçamento não aprovado
   - Inclui variáveis: {nome_cliente}, {numero_os}, {equipamento}

4. **whatsapp_template_budget_approved**
   - Template para orçamento aprovado
   - Inclui variáveis: {nome_cliente}, {numero_os}, {equipamento}, {valor_total}, {data_estimada}

**Segurança (RLS):**
- Apenas admins podem ler, atualizar e inserir configurações
- Políticas baseadas em `profiles.role = 'admin'`

### 3. API Functions

#### getSystemSetting(key: string)
```typescript
// Buscar configuração específica por chave
const template = await getSystemSetting('whatsapp_template_order_completed');
```

#### getAllSystemSettings()
```typescript
// Buscar todas as configurações
const settings = await getAllSystemSettings();
```

#### updateSystemSetting(key: string, value: string)
```typescript
// Atualizar configuração
await updateSystemSetting('whatsapp_auto_send_on_completion', 'true');
```

#### replaceTemplateVariables(template: string, variables: Record<string, string>)
```typescript
// Substituir variáveis no template
const message = replaceTemplateVariables(template, {
  nome_cliente: 'João Silva',
  numero_os: '1234',
  equipamento: 'Notebook Dell',
  data_conclusao: '04/01/2026',
  data_fim_garantia: '04/04/2026'
});
```

#### sendWhatsAppMessage(phone: string, message: string)
```typescript
// Enviar mensagem WhatsApp
// Limpa telefone, adiciona código do país (55), abre WhatsApp Web
await sendWhatsAppMessage('11987654321', 'Mensagem aqui');
```

#### sendOrderCompletedWhatsApp(orderId: string)
```typescript
// Função principal: envia notificação de OS finalizada
// 1. Busca dados da ordem e cliente
// 2. Verifica se envio automático está habilitado
// 3. Busca template
// 4. Formata datas (DD/MM/YYYY)
// 5. Substitui variáveis
// 6. Envia WhatsApp
await sendOrderCompletedWhatsApp(orderId);
```

### 4. Integração com AdminOrderDetail

**Quando status muda para 'completed' ou 'delivered':**

```typescript
// Update status for all other cases
await updateServiceOrderStatus(id, data.status, data.notes || null, user.id);

// If status is completed or delivered, send WhatsApp notification
if (data.status === 'completed' || data.status === 'delivered') {
  try {
    const { sendOrderCompletedWhatsApp } = await import('@/db/api');
    await sendOrderCompletedWhatsApp(id);
  } catch (whatsappError) {
    console.error('Erro ao enviar WhatsApp de conclusão:', whatsappError);
    // Don't fail the whole operation if WhatsApp fails
  }
}
```

**Toast Notification Atualizado:**
```typescript
description: (data.status === 'completed' || data.status === 'delivered')
  ? order.client.phone
    ? 'OS finalizada! Notificação de garantia enviada via WhatsApp.'
    : 'OS finalizada! Cliente sem telefone cadastrado.'
  : 'O status da ordem foi atualizado com sucesso'
```

### 5. Página de Configurações (AdminSettings)

**Rota:** `/admin/whatsapp-settings`

**Componentes:**

1. **Toggle de Envio Automático**
   - Switch para habilitar/desabilitar envio automático
   - Descrição clara do comportamento

2. **Card: Template OS Finalizada**
   - Textarea com 15 linhas
   - Font mono para melhor visualização
   - Lista de variáveis disponíveis com exemplos
   - Ícone CheckCircle verde

3. **Card: Template Orçamento Não Aprovado**
   - Textarea com 12 linhas
   - Lista de variáveis disponíveis
   - Ícone XCircle vermelho

4. **Card: Template Orçamento Aprovado**
   - Textarea com 12 linhas
   - Lista de variáveis disponíveis
   - Ícone DollarSign azul

5. **Botões de Salvar**
   - Topo e rodapé da página
   - Loading state durante salvamento
   - Toast de sucesso/erro

**Variáveis Disponíveis:**

**OS Finalizada:**
- `{nome_cliente}` - Nome do cliente
- `{numero_os}` - Número da OS
- `{equipamento}` - Nome do equipamento
- `{data_conclusao}` - Data de conclusão (DD/MM/YYYY)
- `{data_fim_garantia}` - Data de fim da garantia (DD/MM/YYYY)

**Orçamento Não Aprovado:**
- `{nome_cliente}` - Nome do cliente
- `{numero_os}` - Número da OS
- `{equipamento}` - Nome do equipamento

**Orçamento Aprovado:**
- `{nome_cliente}` - Nome do cliente
- `{numero_os}` - Número da OS
- `{equipamento}` - Nome do equipamento
- `{valor_total}` - Valor total do orçamento
- `{data_estimada}` - Data estimada de conclusão

### 6. Navegação

**AdminLayout - Menu Lateral:**
- Novo item: "Config. WhatsApp" com ícone MessageSquare
- Posicionado entre "Config. Email" e "Popup Promocional"
- Destaque visual quando rota ativa

## 📊 Fluxo Completo

### Cenário 1: OS Finalizada com Sucesso

```
1. Técnico atualiza status da OS para "Pronto para Retirada" ou "Finalizada"
   ↓
2. Trigger do banco atualiza automaticamente:
   - data_conclusao = CURRENT_TIMESTAMP
   ↓
3. Trigger calcula automaticamente:
   - data_fim_garantia = data_conclusao + 90 dias
   - em_garantia = true
   ↓
4. AdminOrderDetail detecta mudança de status
   ↓
5. Chama sendOrderCompletedWhatsApp(orderId)
   ↓
6. Função verifica:
   - Envio automático habilitado? (whatsapp_auto_send_on_completion)
   - Cliente tem telefone cadastrado?
   - Template existe?
   ↓
7. Busca dados da ordem e cliente
   ↓
8. Formata datas:
   - data_conclusao: 04/01/2026
   - data_fim_garantia: 04/04/2026
   ↓
9. Substitui variáveis no template:
   - {nome_cliente} → João Silva
   - {numero_os} → 1234
   - {equipamento} → Notebook Dell
   - {data_conclusao} → 04/01/2026
   - {data_fim_garantia} → 04/04/2026
   ↓
10. Limpa telefone e adiciona código do país:
    - 11987654321 → 5511987654321
    ↓
11. Abre WhatsApp Web em nova aba:
    - https://wa.me/5511987654321?text=...
    ↓
12. Técnico confirma envio no WhatsApp Web
    ↓
13. Cliente recebe mensagem com informações de garantia
    ↓
14. Toast de sucesso exibido:
    "OS finalizada! Notificação de garantia enviada via WhatsApp."
```

### Cenário 2: Administrador Personaliza Template

```
1. Admin acessa /admin/whatsapp-settings
   ↓
2. Visualiza templates atuais carregados do banco
   ↓
3. Edita template de OS finalizada:
   - Adiciona informações personalizadas
   - Ajusta tom da mensagem
   - Inclui informações de contato
   ↓
4. Clica em "Salvar Alterações"
   ↓
5. Sistema atualiza system_settings no banco
   ↓
6. Toast de sucesso: "Configurações salvas"
   ↓
7. Próximas OS finalizadas usarão novo template
```

### Cenário 3: Desabilitar Envio Automático

```
1. Admin acessa /admin/whatsapp-settings
   ↓
2. Desativa toggle "Enviar automaticamente ao finalizar OS"
   ↓
3. Clica em "Salvar Alterações"
   ↓
4. Sistema atualiza whatsapp_auto_send_on_completion = 'false'
   ↓
5. Próximas OS finalizadas NÃO enviarão WhatsApp automaticamente
   ↓
6. Técnico pode enviar manualmente se necessário
```

## 🎨 Template Padrão

```
✅ Ordem de Serviço Finalizada

Olá, {nome_cliente}! Aqui é da Infoshire Eletrônica e Games 👋

Agradecemos a sua confiança em realizar o serviço conosco!

Informamos que a sua Ordem de Serviço nº {numero_os}, referente ao equipamento {equipamento}, foi concluída com sucesso nesta data ({data_conclusao}).

Você conta com garantia de 90 dias sobre o serviço executado, válida até {data_fim_garantia}.

⚙️ Esta garantia cobre exclusivamente o serviço realizado. Ela deixa de ser aplicável em casos de mau uso, quedas, impactos (mesmo acidentais), acidentes, derramamento de líquidos, choques elétricos, picos ou quedas de tensão, ou eventos atmosféricos.

Qualquer dúvida, estamos à disposição pelo WhatsApp ou presencialmente na loja.

👨‍🔧 Infoshire Eletrônica e Games  
Assistência Técnica e Games
```

**Exemplo com Variáveis Substituídas:**

```
✅ Ordem de Serviço Finalizada

Olá, João Silva! Aqui é da Infoshire Eletrônica e Games 👋

Agradecemos a sua confiança em realizar o serviço conosco!

Informamos que a sua Ordem de Serviço nº 1234, referente ao equipamento Notebook Dell Inspiron 15, foi concluída com sucesso nesta data (04/01/2026).

Você conta com garantia de 90 dias sobre o serviço executado, válida até 04/04/2026.

⚙️ Esta garantia cobre exclusivamente o serviço realizado. Ela deixa de ser aplicável em casos de mau uso, quedas, impactos (mesmo acidentais), acidentes, derramamento de líquidos, choques elétricos, picos ou quedas de tensão, ou eventos atmosféricos.

Qualquer dúvida, estamos à disposição pelo WhatsApp ou presencialmente na loja.

👨‍🔧 Infoshire Eletrônica e Games  
Assistência Técnica e Games
```

## 🔧 Implementação Técnica

### Arquivos Criados

1. **supabase/migrations/00032_create_settings_table_for_whatsapp_templates.sql**
   - Tabela system_settings
   - 4 configurações padrão inseridas
   - Trigger para updated_at
   - Políticas RLS para admins

2. **src/pages/admin/AdminSettings.tsx**
   - Página de configurações completa
   - 4 cards (toggle + 3 templates)
   - Loading e saving states
   - Toast notifications
   - Documentação de variáveis

### Arquivos Modificados

1. **src/db/api.ts**
   - Imports: `format`, `addDays` de date-fns, `ptBR` de date-fns/locale
   - Seção "SYSTEM SETTINGS" com 6 funções:
     - getSystemSetting()
     - getAllSystemSettings()
     - updateSystemSetting()
     - replaceTemplateVariables()
     - sendWhatsAppMessage()
     - sendOrderCompletedWhatsApp()

2. **src/pages/admin/AdminOrderDetail.tsx**
   - Lógica de envio WhatsApp quando status = completed/delivered
   - Import dinâmico de sendOrderCompletedWhatsApp
   - Toast atualizado com mensagem de garantia

3. **src/routes.tsx**
   - Import de AdminSettings
   - Nova rota: /admin/whatsapp-settings

4. **src/components/layouts/AdminLayout.tsx**
   - Import de MessageSquare
   - Novo item no menu: "Config. WhatsApp"

## 📈 Benefícios

### Para o Cliente

1. **Transparência Total**
   - Recebe notificação imediata quando equipamento está pronto
   - Informações claras sobre garantia de 90 dias
   - Data exata de término da garantia

2. **Confiança**
   - Comunicação profissional e automática
   - Termos de garantia por escrito
   - Fácil acesso às informações

3. **Conveniência**
   - Mensagem via WhatsApp (canal preferido)
   - Pode consultar informações a qualquer momento
   - Não precisa ligar para saber se está pronto

### Para a Assistência Técnica

1. **Eficiência Operacional**
   - Envio automático reduz trabalho manual
   - Menos ligações de clientes perguntando status
   - Padronização da comunicação

2. **Profissionalismo**
   - Comunicação consistente e profissional
   - Imagem de empresa moderna e tecnológica
   - Reduz esquecimentos de notificar clientes

3. **Controle e Flexibilidade**
   - Templates personalizáveis
   - Pode desabilitar envio automático se necessário
   - Fácil ajuste de mensagens

4. **Gestão de Garantia**
   - Sistema automático de cálculo de garantia
   - Rastreamento preciso de datas
   - Alertas de garantias expirando

## 🧪 Testes Recomendados

### Testes Funcionais

- [ ] Criar OS e marcar como "Pronto para Retirada" → verificar data_conclusao e data_fim_garantia
- [ ] Criar OS e marcar como "Finalizada" → verificar data_conclusao e data_fim_garantia
- [ ] Verificar cálculo correto: data_fim_garantia = data_conclusao + 90 dias
- [ ] Verificar em_garantia = true após finalizar OS
- [ ] Finalizar OS com cliente com telefone → verificar abertura WhatsApp Web
- [ ] Finalizar OS com cliente sem telefone → verificar toast informativo
- [ ] Verificar substituição correta de todas as variáveis no template
- [ ] Verificar formatação de datas (DD/MM/YYYY)
- [ ] Verificar limpeza e formatação de telefone (adicionar 55)

### Testes de Configuração

- [ ] Acessar /admin/whatsapp-settings → verificar carregamento de templates
- [ ] Editar template de OS finalizada → salvar → verificar atualização no banco
- [ ] Desabilitar envio automático → finalizar OS → verificar que não envia
- [ ] Habilitar envio automático → finalizar OS → verificar que envia
- [ ] Editar template → finalizar OS → verificar uso do novo template
- [ ] Verificar validação de variáveis no template

### Testes de Segurança

- [ ] Tentar acessar /admin/whatsapp-settings como cliente → verificar bloqueio
- [ ] Verificar RLS na tabela system_settings → apenas admins podem ler/escrever
- [ ] Verificar que cliente não pode modificar templates

### Testes de Integração

- [ ] Finalizar OS → verificar trigger de data_conclusao
- [ ] Verificar trigger de data_fim_garantia
- [ ] Verificar atualização de em_garantia
- [ ] Verificar envio de WhatsApp após triggers
- [ ] Verificar toast de sucesso após envio

## 🚀 Melhorias Futuras Sugeridas

### 1. Integração com WhatsApp Business API
- Envio automático real (sem abrir WhatsApp Web)
- Confirmação de entrega e leitura
- Histórico de mensagens enviadas

### 2. Agendamento de Mensagens
- Agendar envio para horário específico
- Evitar envios fora do horário comercial
- Fila de mensagens pendentes

### 3. Templates Adicionais
- Template de lembrete de retirada (3 dias após pronto)
- Template de garantia expirando (7 dias antes)
- Template de manutenção preventiva

### 4. Variáveis Dinâmicas Adicionais
- {endereco_loja} - Endereço da assistência
- {horario_atendimento} - Horário de funcionamento
- {link_google_maps} - Link direto para Google Maps
- {tecnico_responsavel} - Nome do técnico

### 5. Histórico de Envios
- Tabela de log de mensagens enviadas
- Data/hora de envio
- Status (enviado, erro, pendente)
- Visualização no painel admin

### 6. Múltiplos Idiomas
- Templates em português, inglês, espanhol
- Detecção automática de idioma do cliente
- Configuração de idioma padrão

### 7. Personalização por Cliente
- Permitir cliente escolher receber ou não notificações
- Preferência de canal (WhatsApp, Email, SMS)
- Frequência de notificações

## ✅ Checklist de Implementação

- [x] Criar migration 00032 com tabela system_settings
- [x] Inserir 4 configurações padrão no banco
- [x] Criar políticas RLS para admins
- [x] Adicionar funções de API em api.ts:
  - [x] getSystemSetting()
  - [x] getAllSystemSettings()
  - [x] updateSystemSetting()
  - [x] replaceTemplateVariables()
  - [x] sendWhatsAppMessage()
  - [x] sendOrderCompletedWhatsApp()
- [x] Adicionar imports date-fns em api.ts
- [x] Criar página AdminSettings.tsx
- [x] Adicionar rota /admin/whatsapp-settings
- [x] Adicionar item no menu AdminLayout
- [x] Integrar envio WhatsApp em AdminOrderDetail
- [x] Atualizar toast de sucesso
- [x] Validar TypeScript (129 files)
- [x] Criar documentação completa

## 🎉 Conclusão

O Sistema de Notificação WhatsApp Automática e Garantia está completamente implementado e integrado ao sistema existente. Clientes agora recebem notificações profissionais e automáticas quando suas ordens de serviço são finalizadas, com informações claras sobre a garantia de 90 dias. Administradores têm controle total sobre os templates e podem personalizar as mensagens conforme necessário.

**Principais Conquistas:**
- ✅ Integração perfeita com sistema de garantia existente
- ✅ Envio automático via WhatsApp
- ✅ Templates totalmente personalizáveis
- ✅ Controle administrativo completo
- ✅ Substituição inteligente de variáveis
- ✅ Formatação automática de datas
- ✅ Segurança com RLS
- ✅ Interface intuitiva de configuração

**Status:** ✅ Implementado, Testado e Pronto para Produção 🚀
