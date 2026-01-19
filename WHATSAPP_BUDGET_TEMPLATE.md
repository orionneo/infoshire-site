# 💬 Template Editável de Orçamento WhatsApp

## ✅ IMPLEMENTADO

Sistema de template editável para mensagens de orçamento enviadas via WhatsApp, permitindo que técnicos e admins personalizem o conteúdo incluindo informações sobre parcelamento, formas de pagamento, etc.

---

## 🎯 Funcionalidade

### Antes
- ❌ Mensagem de orçamento **hardcoded** no código
- ❌ Impossível personalizar sem alterar código
- ❌ Sem informações sobre parcelamento/formas de pagamento
- ❌ Incluía credenciais de login (senha 123456) na mensagem

### Depois
- ✅ Template **100% editável** via painel admin
- ✅ Personalizável com informações de pagamento
- ✅ Variáveis dinâmicas para dados do orçamento
- ✅ Mensagem limpa e profissional
- ✅ Fallback automático se template não configurado

---

## 📍 Localização

### Painel Admin
**Caminho:** `/admin/settings`

**Seção:** "Template: Envio de Orçamento"

**Posição:** Após "Template: Orçamento Aprovado"

---

## 🔧 Variáveis Disponíveis

O template suporta as seguintes variáveis dinâmicas:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{nome_cliente}` | Nome do cliente | "João Silva" |
| `{numero_os}` | Número da OS | "OS-2026-001" |
| `{equipamento}` | Nome do equipamento | "Notebook Dell Inspiron" |
| `{valor_mao_obra}` | Valor da mão de obra | "150,00" |
| `{valor_pecas}` | Valor das peças | "200,00" |
| `{valor_total}` | Valor total do orçamento | "350,00" |
| `{observacoes}` | Observações do orçamento | "📝 *Observações:*\nTroca de HD necessária\n\n" |
| `{link_aprovacao}` | Link para aprovação | "https://infoshire.com.br/approve/abc123" |

**Nota:** As variáveis devem ser usadas entre chaves: `{nome_cliente}`, `{valor_total}`, etc.

---

## 📝 Template Padrão

```
Olá {nome_cliente}! 

Seu orçamento para o reparo do equipamento *{equipamento}* (OS #{numero_os}) está pronto:

💰 *Valor da mão de obra:* R$ {valor_mao_obra}
🔧 *Valor das peças:* R$ {valor_pecas}
📊 *Valor total:* R$ {valor_total}

{observacoes}✅ *Para aprovar o orçamento, clique no link:*
{link_aprovacao}

💳 *Formas de pagamento:*
• Dinheiro
• PIX
• Cartão de crédito (parcelamento disponível)
• Cartão de débito

Aguardamos sua aprovação para iniciar o reparo! 🔧
```

---

## 🎨 Exemplos de Personalização

### Exemplo 1: Adicionar Parcelamento Detalhado

```
Olá {nome_cliente}! 

Seu orçamento para o reparo do equipamento *{equipamento}* (OS #{numero_os}) está pronto:

💰 *Valor da mão de obra:* R$ {valor_mao_obra}
🔧 *Valor das peças:* R$ {valor_pecas}
📊 *Valor total:* R$ {valor_total}

{observacoes}✅ *Para aprovar o orçamento, clique no link:*
{link_aprovacao}

💳 *Formas de pagamento:*
• 💵 Dinheiro (5% de desconto)
• 📱 PIX (5% de desconto)
• 💳 Cartão de crédito:
  - Até 3x sem juros
  - 4x a 12x com juros (consulte taxas)
• 💳 Cartão de débito

🎁 *Promoção:* Pagamento à vista com 10% de desconto!

Aguardamos sua aprovação para iniciar o reparo! 🔧
```

### Exemplo 2: Adicionar Garantia e Prazo

```
Olá {nome_cliente}! 

Seu orçamento para o reparo do equipamento *{equipamento}* (OS #{numero_os}) está pronto:

💰 *Valor da mão de obra:* R$ {valor_mao_obra}
🔧 *Valor das peças:* R$ {valor_pecas}
📊 *Valor total:* R$ {valor_total}

{observacoes}⏱️ *Prazo de execução:* 3 a 5 dias úteis após aprovação

🛡️ *Garantia:* 90 dias para serviço e peças

✅ *Para aprovar o orçamento, clique no link:*
{link_aprovacao}

💳 *Formas de pagamento:*
• Dinheiro
• PIX
• Cartão de crédito (parcelamento em até 6x)
• Cartão de débito

Aguardamos sua aprovação! 🔧
```

### Exemplo 3: Adicionar Horário de Atendimento

```
Olá {nome_cliente}! 

Seu orçamento para o reparo do equipamento *{equipamento}* (OS #{numero_os}) está pronto:

💰 *Valor da mão de obra:* R$ {valor_mao_obra}
🔧 *Valor das peças:* R$ {valor_pecas}
📊 *Valor total:* R$ {valor_total}

{observacoes}✅ *Para aprovar o orçamento, clique no link:*
{link_aprovacao}

💳 *Formas de pagamento:*
• Dinheiro
• PIX
• Cartão de crédito (parcelamento disponível)
• Cartão de débito

📞 *Dúvidas?* Entre em contato:
• WhatsApp: (11) 99999-9999
• Horário: Seg-Sex 9h-18h | Sáb 9h-13h

Aguardamos sua aprovação! 🔧
```

---

## 🔄 Fluxo de Funcionamento

### 1. Admin Edita Template

```
1. Admin acessa /admin/settings
   ↓
2. Rola até "Template: Envio de Orçamento"
   ↓
3. Edita mensagem adicionando info de parcelamento
   ↓
4. Clica em "Salvar Alterações"
   ↓
5. Template salvo em system_settings
```

### 2. Técnico Envia Orçamento

```
1. Técnico acessa OS e preenche orçamento
   ↓
2. Define status como "Aguardando Aprovação"
   ↓
3. Sistema busca template em system_settings
   ↓
4. Substitui variáveis com dados reais
   ↓
5. Gera link de aprovação único
   ↓
6. Abre WhatsApp com mensagem personalizada
```

### 3. Cliente Recebe Mensagem

```
Cliente recebe no WhatsApp:

"Olá João Silva! 

Seu orçamento para o reparo do equipamento *Notebook Dell* (OS #OS-2026-001) está pronto:

💰 *Valor da mão de obra:* R$ 150,00
🔧 *Valor das peças:* R$ 200,00
📊 *Valor total:* R$ 350,00

✅ *Para aprovar o orçamento, clique no link:*
https://infoshire.com.br/approve/abc123

💳 *Formas de pagamento:*
• Dinheiro
• PIX
• Cartão de crédito (parcelamento disponível)
• Cartão de débito

Aguardamos sua aprovação para iniciar o reparo! 🔧"
```

---

## 🗄️ Estrutura de Dados

### Tabela: system_settings

```sql
INSERT INTO system_settings (
  setting_key,
  setting_value,
  setting_description
) VALUES (
  'whatsapp_template_budget_request',
  'Olá {nome_cliente}! ...',
  'Template de mensagem WhatsApp enviada ao cliente quando um novo orçamento é disponibilizado'
);
```

**Campos:**
- `setting_key`: `whatsapp_template_budget_request`
- `setting_value`: Conteúdo do template com variáveis
- `setting_description`: Descrição do template

---

## 💻 Implementação Técnica

### 1. AdminSettings.tsx

**Estado:**
```typescript
const [templateBudgetRequest, setTemplateBudgetRequest] = useState('');
```

**Carregamento:**
```typescript
case 'whatsapp_template_budget_request':
  setTemplateBudgetRequest(setting.setting_value);
  break;
```

**Salvamento:**
```typescript
updateSystemSetting('whatsapp_template_budget_request', templateBudgetRequest)
```

### 2. AdminOrderDetail.tsx

**Busca do Template:**
```typescript
let whatsappTemplate = await getSiteSetting('whatsapp_template_budget_request');

// Fallback se não encontrado
if (!whatsappTemplate) {
  whatsappTemplate = `Olá {nome_cliente}! ...`;
}
```

**Substituição de Variáveis:**
```typescript
const whatsappMessage = whatsappTemplate
  .replace(/{nome_cliente}/g, order.client.name || 'Cliente')
  .replace(/{numero_os}/g, order.order_number)
  .replace(/{equipamento}/g, order.equipment)
  .replace(/{valor_mao_obra}/g, formattedLaborCost)
  .replace(/{valor_pecas}/g, formattedPartsCost)
  .replace(/{valor_total}/g, formattedTotalCost)
  .replace(/{observacoes}/g, formattedObservations)
  .replace(/{link_aprovacao}/g, approvalUrl);
```

**Formatação de Valores:**
```typescript
const formattedLaborCost = laborCost.toFixed(2).replace('.', ',');
const formattedPartsCost = partsCost.toFixed(2).replace('.', ',');
const formattedTotalCost = totalCost.toFixed(2).replace('.', ',');
```

**Formatação de Observações:**
```typescript
const formattedObservations = data.budget_notes 
  ? `📝 *Observações:*\n${data.budget_notes}\n\n` 
  : '';
```

---

## 🧪 Validação

### Teste 1: Editar Template

1. Login como admin
2. Acessar `/admin/settings`
3. Rolar até "Template: Envio de Orçamento"
4. Adicionar texto sobre parcelamento:
   ```
   💳 *Parcelamento:*
   • Até 3x sem juros
   • 4x a 12x com juros
   ```
5. Clicar em "Salvar Alterações"
6. Verificar toast de sucesso

### Teste 2: Enviar Orçamento

1. Acessar uma OS existente
2. Preencher orçamento:
   - Mão de obra: R$ 100,00
   - Peças: R$ 50,00
   - Observações: "Troca de tela"
3. Alterar status para "Aguardando Aprovação"
4. Clicar em "Salvar e Enviar WhatsApp"
5. Verificar mensagem no WhatsApp com:
   - ✅ Nome do cliente
   - ✅ Número da OS
   - ✅ Equipamento
   - ✅ Valores formatados (R$ 100,00, R$ 50,00, R$ 150,00)
   - ✅ Observações formatadas
   - ✅ Link de aprovação
   - ✅ Informações de parcelamento (se adicionadas)

### Teste 3: Verificar Fallback

1. Deletar template do banco:
   ```sql
   DELETE FROM system_settings 
   WHERE setting_key = 'whatsapp_template_budget_request';
   ```
2. Enviar novo orçamento
3. Verificar que mensagem padrão é usada
4. Verificar que não há erros no console

---

## 🔍 Troubleshooting

### Template Não Aparece

**Causa:** Migration não aplicada

**Solução:**
```sql
-- Verificar se template existe
SELECT * FROM system_settings 
WHERE setting_key = 'whatsapp_template_budget_request';

-- Se não existir, inserir manualmente
INSERT INTO system_settings (setting_key, setting_value, setting_description)
VALUES (
  'whatsapp_template_budget_request',
  'Olá {nome_cliente}! ...',
  'Template de mensagem WhatsApp enviada ao cliente quando um novo orçamento é disponibilizado'
);
```

### Variáveis Não São Substituídas

**Causa:** Variáveis escritas incorretamente

**Solução:**
- ✅ Correto: `{nome_cliente}`
- ❌ Errado: `{{nome_cliente}}`, `{nome-cliente}`, `[nome_cliente]`

### Valores Não Formatados

**Causa:** Formatação de valores não aplicada

**Solução:**
- Valores são formatados automaticamente no código
- Formato: `150.00` → `150,00`
- Não é necessário formatar no template

### Observações Não Aparecem

**Causa:** Campo `budget_notes` vazio

**Solução:**
- Se `budget_notes` estiver vazio, `{observacoes}` é substituído por string vazia
- Comportamento esperado e correto

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Editabilidade** | ❌ Hardcoded | ✅ Editável via admin |
| **Parcelamento** | ❌ Não mencionado | ✅ Personalizável |
| **Formas de Pagamento** | ❌ Não mencionado | ✅ Incluído no template |
| **Credenciais de Login** | ❌ Incluídas (senha 123456) | ✅ Removidas (segurança) |
| **Variáveis** | ❌ Interpolação direta | ✅ Sistema de templates |
| **Fallback** | ❌ Erro se não configurado | ✅ Template padrão |
| **Manutenção** | ❌ Requer alteração de código | ✅ Alteração via UI |

---

## ✅ Checklist de Implementação

- [x] Adicionar estado `templateBudgetRequest` em AdminSettings
- [x] Adicionar case `whatsapp_template_budget_request` em loadSettings
- [x] Adicionar template no handleSave
- [x] Criar card UI "Template: Envio de Orçamento"
- [x] Adicionar 8 variáveis disponíveis na documentação
- [x] Criar migration 00037 com template padrão
- [x] Atualizar AdminOrderDetail para buscar template
- [x] Implementar substituição de variáveis
- [x] Adicionar fallback para template padrão
- [x] Formatar valores monetários (R$ X,XX)
- [x] Formatar observações condicionalmente
- [x] Validar TypeScript (132 files)
- [x] Documentar funcionalidade completa

---

## 🎉 Resultado Final

**TEMPLATE DE ORÇAMENTO WHATSAPP EDITÁVEL! 💬**

✅ **100% editável** via painel admin  
✅ **8 variáveis dinâmicas** disponíveis  
✅ **Informações de parcelamento** personalizáveis  
✅ **Fallback automático** se não configurado  
✅ **Valores formatados** automaticamente (R$ X,XX)  
✅ **Observações condicionais** (só aparecem se existirem)  
✅ **Segurança melhorada** (credenciais removidas)  
✅ **Manutenção simplificada** (sem alterar código)

**Próximo Passo:**
1. Login como admin
2. Acessar `/admin/settings`
3. Rolar até "Template: Envio de Orçamento"
4. Personalizar mensagem com informações de parcelamento
5. Salvar alterações
6. Testar enviando um orçamento via WhatsApp

**Exemplo de Uso:**
```
Admin edita template adicionando:
"💳 Parcelamento em até 6x sem juros no cartão!"

Cliente recebe:
"... 
💳 *Formas de pagamento:*
• Dinheiro
• PIX
• Cartão de crédito (parcelamento em até 6x sem juros!)
..."
```
