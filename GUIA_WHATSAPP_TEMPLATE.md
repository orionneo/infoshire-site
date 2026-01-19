# 📱 Guia Rápido: Personalizar Mensagem do WhatsApp

## Como Configurar a Mensagem de Retirada

### Passo 1: Acessar as Configurações

1. Faça login no **Painel Admin**
2. Clique em **"Configurações do Site"** no menu lateral
3. Role a página até encontrar a seção **"Mensagem do WhatsApp"**

### Passo 2: Editar o Template

No campo **"Template da Mensagem"**, você verá um texto com variáveis especiais entre chaves duplas `{{variavel}}`.

**Exemplo:**
```
Olá {{cliente_nome}}!

Seu equipamento *{{equipamento}}* está pronto! 🎉
```

### Passo 3: Usar as Variáveis

As variáveis são substituídas automaticamente pelos dados reais da ordem de serviço:

| Digite | Será substituído por |
|--------|---------------------|
| `{{cliente_nome}}` | Nome do cliente |
| `{{equipamento}}` | Nome do equipamento |
| `{{numero_os}}` | Número da OS |
| `{{valor_total}}` | Valor total (já formatado) |
| `{{desconto}}` | Desconto aplicado |
| `{{valor_final}}` | Valor final com desconto |
| `{{observacoes}}` | Observações que você digitar |

### Passo 4: Formatar o Texto

Para deixar a mensagem mais bonita no WhatsApp:

- Use `*texto*` para **negrito**
- Use emojis para deixar mais amigável 😊
- Quebre linhas para melhor leitura

### Passo 5: Salvar

Clique no botão **"Salvar Configurações"** no final da página.

## Exemplos Práticos

### Exemplo 1: Mensagem Simples
```
Olá {{cliente_nome}}! 👋

Seu *{{equipamento}}* está pronto para retirada!

OS: #{{numero_os}}
{{valor_total}}

Aguardamos você! 😊
```

### Exemplo 2: Mensagem Completa
```
🎉 Boa notícia, {{cliente_nome}}!

Seu equipamento *{{equipamento}}* foi reparado e está pronto para retirada!

📋 *Detalhes da OS:*
• Número: #{{numero_os}}
• {{valor_total}}
• {{desconto}}
• {{valor_final}}

📍 *Endereço:*
Rua Exemplo, 123 - Centro
São Paulo - SP

🕐 *Horário de Atendimento:*
Segunda a Sexta: 9h às 18h
Sábado: 9h às 13h

{{observacoes}}

Até breve! 🚀
```

### Exemplo 3: Mensagem Profissional
```
Prezado(a) {{cliente_nome}},

Informamos que o reparo do equipamento *{{equipamento}}* (OS #{{numero_os}}) foi concluído com sucesso.

*Valores:*
{{valor_total}}
{{desconto}}
{{valor_final}}

*Retirada:*
📍 [Seu endereço]
🕐 [Seu horário]

{{observacoes}}

Atenciosamente,
Equipe [Sua Empresa]
```

## Dicas Importantes

✅ **Sempre teste** a mensagem antes de usar em produção  
✅ **Mantenha simples** - mensagens muito longas podem não ser lidas  
✅ **Use emojis** com moderação - eles deixam a mensagem mais amigável  
✅ **Inclua seu endereço e horário** - facilita para o cliente  
✅ **Personalize** de acordo com o estilo da sua empresa  

## Como Funciona na Prática

1. Você edita e salva o template nas configurações
2. Quando marcar uma OS como **"Pronto para Retirada"**
3. O sistema pega o template e substitui as variáveis
4. Aparece um botão **"Abrir WhatsApp"**
5. Ao clicar, abre o WhatsApp com a mensagem pronta
6. Você só precisa clicar em enviar!

## Variáveis Vazias

Se uma variável não tiver valor, ela simplesmente desaparece:

- Se não houver desconto, `{{desconto}}` vira texto vazio
- Se não houver observações, `{{observacoes}}` vira texto vazio
- Isso mantém a mensagem limpa e profissional

## Precisa de Ajuda?

Se tiver dúvidas sobre como usar as variáveis ou formatar a mensagem, consulte a documentação completa em `WHATSAPP_TEMPLATE_CUSTOMIZATION.md`.
