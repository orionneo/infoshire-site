# 📱 Guia Rápido: Template do WhatsApp

## ✅ PROBLEMA RESOLVIDO!

O sistema agora **usa o template configurado** nas Configurações do Site!

---

## 🎯 Como Configurar

### Passo a Passo:

1. **Acesse Configurações do Site**
   - Menu lateral → "Configurações do Site"

2. **Role até "Mensagens do WhatsApp"**
   - Seção com template editável

3. **Edite o Template**
   - Use as variáveis disponíveis
   - Personalize a mensagem

4. **Salve**
   - Clique em "Salvar Configurações"

5. **Teste**
   - Marque uma OS como "Pronto para Retirada"
   - Verifique a mensagem no WhatsApp

---

## 📝 Variáveis Disponíveis

| Variável | O Que Mostra |
|----------|--------------|
| `{{cliente_nome}}` | Nome do cliente |
| `{{equipamento}}` | Nome do equipamento |
| `{{numero_os}}` | Número da OS |
| `{{valor_total}}` | Valor total (com emoji e formatação) |
| `{{desconto}}` | Desconto aplicado (se houver) |
| `{{valor_final}}` | Valor final com desconto |
| `{{observacoes}}` | Observações adicionais |

---

## 💡 Exemplo Simples

### Template:
```
Olá {{cliente_nome}}! 

Seu {{equipamento}} está pronto! 🎉

OS: #{{numero_os}}

{{valor_final}}

Aguardamos você!
```

### Resultado:
```
Olá João Silva! 

Seu iPhone 12 Pro está pronto! 🎉

OS: #OS-2026-001

✨ *Valor final:* R$ 300,00

Aguardamos você!
```

---

## 🎨 Formatação WhatsApp

- **Negrito**: `*texto*`
- **Itálico**: `_texto_`
- **Tachado**: `~texto~`
- **Emojis**: Use diretamente (🎉 📱 💰 ✨)

---

## ⚠️ Importante

- Use `{{variavel}}` com **chaves duplas**
- Não adicione espaços dentro das chaves
- Variáveis são **case sensitive** (minúsculas)
- Valores opcionais (desconto) só aparecem se existirem

---

## 🐛 Não Funciona?

1. Verifique se salvou as configurações
2. Confirme a sintaxe das variáveis
3. Teste com uma OS real
4. Recarregue a página

---

**Status**: ✅ Funcionando  
**Versão**: 2.0  
**Data**: 10/01/2026
