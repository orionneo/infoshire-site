# Customização de Template do WhatsApp

## Visão Geral

Foi implementado um sistema de template customizável para as mensagens do WhatsApp enviadas quando uma ordem de serviço é marcada como "Pronto para Retirada".

## Funcionalidades

### 1. Editor de Template na Área Admin

Na página **Configurações do Site** (`/admin/settings`), foi adicionada uma nova seção chamada **"Mensagem do WhatsApp"** onde o administrador pode:

- Editar o template da mensagem de retirada
- Visualizar as variáveis disponíveis
- Salvar as alterações

### 2. Variáveis Disponíveis

O template suporta as seguintes variáveis que são substituídas automaticamente:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{cliente_nome}}` | Nome do cliente | João Silva |
| `{{equipamento}}` | Nome do equipamento | Notebook Dell |
| `{{numero_os}}` | Número da ordem de serviço | OS-001 |
| `{{valor_total}}` | Valor total formatado | 💰 *Valor total:* R$ 150,00 |
| `{{desconto}}` | Desconto aplicado (se houver) | 🎁 *Desconto aplicado:* R$ 20,00 |
| `{{valor_final}}` | Valor final com desconto | ✨ *Valor final:* R$ 130,00 |
| `{{observacoes}}` | Observações adicionais | 📝 Observações: Trazer documento |

### 3. Template Padrão

Se nenhum template for configurado, o sistema usa o seguinte template padrão:

```
Olá {{cliente_nome}}! 

Temos uma ótima notícia! Seu equipamento *{{equipamento}}* (OS #{{numero_os}}) está pronto para ser retirado! 🎉

📍 *Endereço para retirada:*
[Seu endereço aqui]

🕐 *Horário de atendimento:*
[Seu horário aqui]

{{valor_total}}
{{desconto}}
{{valor_final}}

{{observacoes}}Aguardamos você! 😊
```

## Como Usar

### Para o Administrador

1. Acesse **Painel Admin** → **Configurações do Site**
2. Role até a seção **"Mensagem do WhatsApp"**
3. Edite o template usando as variáveis disponíveis
4. Use `*texto*` para formatar em negrito no WhatsApp
5. Clique em **"Salvar Configurações"**

### Para o Técnico

Quando alterar o status de uma OS para **"Pronto para Retirada"**:

1. O sistema automaticamente gera a mensagem usando o template configurado
2. Todas as variáveis são substituídas pelos valores reais da OS
3. Um botão "Abrir WhatsApp" aparece para enviar a mensagem ao cliente

## Formatação do WhatsApp

O template suporta formatação do WhatsApp:

- `*texto*` - Negrito
- `_texto_` - Itálico
- `~texto~` - Riscado
- ` ```texto``` ` - Monoespaçado

## Exemplo de Uso

### Template Configurado:
```
Olá {{cliente_nome}}! 👋

Seu *{{equipamento}}* está pronto! 🎉

OS: #{{numero_os}}

{{valor_total}}
{{desconto}}
{{valor_final}}

📍 Rua Exemplo, 123 - Centro
🕐 Seg-Sex: 9h às 18h

{{observacoes}}Até logo! 😊
```

### Resultado Final:
```
Olá João Silva! 👋

Seu *Notebook Dell* está pronto! 🎉

OS: #OS-001

💰 *Valor total:* R$ 150,00
🎁 *Desconto aplicado:* R$ 20,00
✨ *Valor final:* R$ 130,00

📍 Rua Exemplo, 123 - Centro
🕐 Seg-Sex: 9h às 18h

📝 Observações: Trazer documento com foto

Até logo! 😊
```

## Implementação Técnica

### Banco de Dados

- Nova configuração: `whatsapp_pickup_template` na tabela `site_settings`
- Tipo: `jsonb` (texto JSON)

### Arquivos Modificados

1. **src/pages/admin/AdminSiteSettings.tsx**
   - Adicionado campo de formulário para o template
   - Adicionado card com instruções de uso
   - Atualizado salvamento para incluir o template

2. **src/pages/admin/AdminOrderDetail.tsx**
   - Modificado para buscar o template das configurações
   - Implementado sistema de substituição de variáveis
   - Mantido template padrão como fallback

3. **supabase/migrations/add_whatsapp_message_template.sql**
   - Criada migração para adicionar o template padrão

### Lógica de Substituição

```typescript
// Busca o template
let template = await getSiteSetting('whatsapp_pickup_template');

// Prepara os valores das variáveis
const valorTotal = order.total_cost 
  ? `💰 *Valor total:* R$ ${order.total_cost.toFixed(2).replace('.', ',')}`
  : '';

// Substitui as variáveis
const message = template
  .replace(/\{\{cliente_nome\}\}/g, order.client.name)
  .replace(/\{\{equipamento\}\}/g, order.equipment)
  .replace(/\{\{numero_os\}\}/g, order.order_number)
  // ... outras substituições
```

## Benefícios

✅ **Personalização Total**: Cada assistência pode ter sua própria mensagem  
✅ **Fácil de Usar**: Interface intuitiva com instruções claras  
✅ **Flexível**: Suporta qualquer formato de mensagem  
✅ **Profissional**: Mantém consistência na comunicação  
✅ **Dinâmico**: Valores são atualizados automaticamente  

## Notas Importantes

- As variáveis vazias (como `{{desconto}}` quando não há desconto) são substituídas por string vazia
- O template é salvo no banco de dados e pode ser editado a qualquer momento
- Mudanças no template afetam apenas mensagens futuras
- O sistema mantém um template padrão caso nenhum seja configurado
