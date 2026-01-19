# Novas Funcionalidades: Exclusão de Usuários e Email Marketing

## 📋 Visão Geral

Este documento descreve as novas funcionalidades adicionadas ao sistema InfoShire:

1. **Exclusão de Clientes e Usuários** - Permite ao administrador deletar usuários do sistema
2. **Email Marketing** - Sistema completo para envio de campanhas promocionais por email

---

## 🗑️ Funcionalidade de Exclusão

### Onde Encontrar

- **Painel Admin → Clientes** - Botão "Deletar" em cada cliente
- **Painel Admin → Usuários** - Botão "Deletar" em cada usuário

### Como Funciona

1. **Confirmação Obrigatória**: Ao clicar em "Deletar", um diálogo de confirmação é exibido
2. **Aviso de Irreversibilidade**: O sistema alerta que a ação é permanente
3. **Exclusão Completa**: Remove o usuário de:
   - Tabela `auth.users` (autenticação)
   - Tabela `profiles` (perfil do usuário)
   - Todas as ordens de serviço relacionadas (CASCADE)
   - Todas as mensagens relacionadas (CASCADE)

### Segurança

- ⚠️ **ATENÇÃO**: Esta ação é **IRREVERSÍVEL**
- Apenas administradores podem deletar usuários
- Confirmação dupla para evitar exclusões acidentais
- Logs de erro detalhados para troubleshooting

### Implementação Técnica

**Edge Function**: `delete-user`
- Localização: `/supabase/functions/delete-user/index.ts`
- Usa `SUPABASE_SERVICE_ROLE_KEY` para permissões administrativas
- Deleta via `supabaseAdmin.auth.admin.deleteUser()`

**API Function**: `deleteProfile(userId: string)`
- Localização: `/src/db/api.ts`
- Chama a Edge Function para executar a exclusão

---

## 📧 Sistema de Email Marketing

### Onde Encontrar

**Painel Admin → Email Marketing**

### Funcionalidades

#### 1. Compor Email
- **Assunto**: Campo para o título do email
- **Mensagem**: Área de texto para o corpo do email
- **Formatação**: Suporta quebras de linha (convertidas para `<br>` no HTML)

#### 2. Seleção de Destinatários
- **Selecionar Todos**: Checkbox para selecionar todos os clientes
- **Seleção Individual**: Checkboxes para cada cliente
- **Visualização**: Nome e email de cada cliente
- **Contador**: Mostra quantos destinatários estão selecionados

#### 3. Envio de Campanha
- **Validação**: Verifica se assunto, mensagem e destinatários foram preenchidos
- **Envio em Lote**: Envia para todos os destinatários selecionados
- **Feedback**: Mostra quantos emails foram enviados com sucesso
- **Histórico**: Salva a campanha no banco de dados

#### 4. Histórico de Campanhas
- **Visualização**: Lista todas as campanhas enviadas
- **Detalhes**: Assunto, mensagem, número de destinatários
- **Metadados**: Quem enviou e quando
- **Ordenação**: Mais recentes primeiro

### Como Usar

1. Acesse **Painel Admin → Email Marketing**
2. Na aba **"Compor Email"**:
   - Digite o assunto do email
   - Escreva a mensagem promocional
   - Selecione os destinatários (ou marque "Selecionar todos")
3. Clique em **"Enviar Campanha"**
4. Aguarde a confirmação de envio
5. Verifique o histórico na aba **"Histórico"**

### Configuração Necessária

#### Resend API Key

O sistema usa o serviço **Resend** para envio de emails. É necessário configurar a chave de API:

1. Crie uma conta em [resend.com](https://resend.com)
2. Obtenha sua API Key
3. Configure no Supabase:

```bash
# Via Supabase Dashboard
Settings → Edge Functions → Secrets
Nome: RESEND_API_KEY
Valor: re_xxxxxxxxxxxxxxxxxx

# Ou via CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

#### Domínio de Envio

Por padrão, os emails são enviados de:
```
InfoShire <noreply@infoshire.com>
```

Para usar seu próprio domínio:
1. Configure o domínio no Resend
2. Edite `/supabase/functions/send-email-campaign/index.ts`
3. Altere a linha `from: 'InfoShire <noreply@infoshire.com>'`

### Implementação Técnica

#### Banco de Dados

**Tabela**: `email_campaigns`
```sql
- id: UUID (Primary Key)
- subject: TEXT (Assunto do email)
- body: TEXT (Corpo do email)
- recipients_count: INTEGER (Número de destinatários)
- sent_by: UUID (Referência ao admin que enviou)
- sent_at: TIMESTAMP (Data/hora do envio)
- created_at: TIMESTAMP
```

**RLS Policies**:
- Apenas admins podem visualizar campanhas
- Apenas admins podem criar campanhas

#### Edge Function

**Nome**: `send-email-campaign`
**Localização**: `/supabase/functions/send-email-campaign/index.ts`

**Fluxo**:
1. Valida autenticação e permissões (apenas admin)
2. Busca emails dos destinatários selecionados
3. Envia emails via API do Resend
4. Salva campanha no banco de dados
5. Retorna resultado com contagem de sucessos

**Formato do Email**:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Olá [Nome do Cliente],</h2>
  <div style="margin: 20px 0; line-height: 1.6;">
    [Corpo da mensagem]
  </div>
  <hr>
  <p style="color: #666; font-size: 12px;">
    Esta é uma mensagem promocional da InfoShire Assistência Técnica.
  </p>
</div>
```

#### API Functions

**Localização**: `/src/db/api.ts`

```typescript
// Enviar campanha
sendEmailCampaign(data: {
  subject: string;
  body: string;
  recipientIds: string[];
}): Promise<void>

// Buscar histórico
getEmailCampaigns(): Promise<EmailCampaignWithSender[]>
```

#### Types

**Localização**: `/src/types/types.ts`

```typescript
export type EmailCampaign = {
  id: string;
  subject: string;
  body: string;
  recipients_count: number;
  sent_by: string | null;
  sent_at: string;
  created_at: string;
};

export type EmailCampaignWithSender = EmailCampaign & {
  sender: {
    name: string | null;
    email: string | null;
  } | null;
};
```

---

## 🔧 Troubleshooting

### Exclusão de Usuários

**Erro: "Usuário não encontrado"**
- Verifique se o usuário existe no banco de dados
- Confirme que o ID está correto

**Erro: "Não foi possível deletar o usuário"**
- Verifique os logs da Edge Function
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verifique permissões RLS

### Email Marketing

**Erro: "Serviço de email não configurado"**
- Configure `RESEND_API_KEY` nas secrets do Supabase
- Reinicie as Edge Functions após configurar

**Erro: "Nenhum destinatário válido encontrado"**
- Verifique se os clientes têm emails cadastrados
- Confirme que os IDs dos clientes estão corretos

**Emails não chegam**
- Verifique spam/lixo eletrônico
- Confirme que a API Key do Resend está válida
- Verifique logs da Edge Function para erros específicos
- Confirme que o domínio está verificado no Resend

**Erro: "Acesso negado"**
- Apenas administradores podem enviar campanhas
- Verifique se o usuário tem role='admin'

---

## 📊 Monitoramento

### Logs das Edge Functions

Para visualizar logs de erros:

```bash
# Via Supabase Dashboard
Edge Functions → [nome-da-funcao] → Logs

# Ou via CLI
supabase functions logs delete-user
supabase functions logs send-email-campaign
```

### Métricas de Email

- **Taxa de Envio**: Visualize no histórico de campanhas
- **Destinatários**: Contador em cada campanha
- **Histórico**: Todas as campanhas ficam salvas permanentemente

---

## 🎯 Boas Práticas

### Exclusão de Usuários

1. ✅ **Sempre confirme** antes de deletar
2. ✅ **Faça backup** de dados importantes antes de limpezas em massa
3. ✅ **Documente** o motivo da exclusão (se necessário)
4. ❌ **Não delete** usuários com ordens de serviço ativas sem avisar

### Email Marketing

1. ✅ **Teste primeiro** enviando para você mesmo
2. ✅ **Revise** assunto e mensagem antes de enviar
3. ✅ **Personalize** a mensagem para seu público
4. ✅ **Respeite** a frequência de envio (não spam)
5. ✅ **Monitore** o histórico para evitar duplicatas
6. ❌ **Não envie** emails genéricos demais
7. ❌ **Não abuse** da frequência de envio

---

## 🚀 Próximos Passos

### Melhorias Futuras Sugeridas

**Email Marketing**:
- [ ] Templates de email pré-definidos
- [ ] Editor visual de emails (WYSIWYG)
- [ ] Agendamento de campanhas
- [ ] Segmentação de clientes (por status, data, etc.)
- [ ] Estatísticas de abertura e cliques
- [ ] Anexos de arquivos
- [ ] Testes A/B

**Exclusão**:
- [ ] Soft delete (arquivar ao invés de deletar)
- [ ] Exportação de dados antes da exclusão
- [ ] Logs de auditoria de exclusões
- [ ] Recuperação de usuários deletados (dentro de X dias)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este documento primeiro
2. Consulte os logs das Edge Functions
3. Verifique a documentação do Resend: [resend.com/docs](https://resend.com/docs)
4. Entre em contato com o suporte técnico

---

**Última atualização**: Janeiro 2026
**Versão**: 1.0.0
