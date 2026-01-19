# 🧪 GUIA DE TESTE RÁPIDO - Sistema de IA

## ✅ Como Testar Agora

### 1. Abrir Nova Ordem de Serviço
- Ir para: **Admin → Nova Ordem de Serviço**
- Ou clicar no botão verde "+" no canto inferior direito

### 2. Preencher Dados Básicos
- Selecionar ou criar cliente
- Preencher equipamento (ex: "Chromebook", "PlayStation 4", "Notebook")
- Preencher número de série (opcional)

### 3. Digitar Descrição do Problema
Digite um dos exemplos abaixo no campo "Descrição do Problema":

#### Teste 1: Problema de Bateria
```
Não carrega
```
**Esperado:**
- ✅ Categoria: Energia
- ✅ Checklist: 7 itens (incluindo "Testar carregador", "Verificar porta de carga")
- ✅ Termo encontrado: "carrega"

#### Teste 2: Problema de Tela
```
Tela não liga
```
**Esperado:**
- ✅ Categoria: Display
- ✅ Checklist: 7 itens (incluindo "Verificar conexão do display", "Testar backlight")
- ✅ Termo encontrado: "tela"

#### Teste 3: Dano por Líquido
```
Derramou água no equipamento
```
**Esperado:**
- ✅ Categoria: Dano por Líquido
- ✅ Checklist: 4 itens (incluindo "Verificar sinais de oxidação", "Limpar contatos")
- ✅ Termos encontrados: "agua", "derramamento"

#### Teste 4: Componente Queimado
```
Não liga e cheira queimado
```
**Esperado:**
- ✅ Categoria: Dano Físico
- ✅ Checklist: 4 itens (incluindo "Identificar componente queimado", "Verificar fusíveis")
- ✅ Termos encontrados: "cheira", "queimado"

#### Teste 5: Problema de Analógico (Controle)
```
Analógico com drift
```
**Esperado:**
- ✅ Categoria: Hardware
- ✅ Checklist: 4 itens básicos
- ✅ Termos encontrados: "analogico", "drift"

### 4. Aguardar Sugestões
- Após digitar, aguarde **1.5 segundos**
- O painel "Sugestões IA" aparecerá automaticamente
- Você verá:
  - 🧠 Ícone de cérebro com badge "Beta"
  - Categoria sugerida
  - Checklist com itens marcados
  - Perguntas de esclarecimento

### 5. Aplicar Sugestões (Opcional)
- Revisar categoria sugerida
- Desmarcar itens do checklist se necessário
- Usar perguntas sugeridas com o cliente
- Clicar em "Criar Ordem" para salvar

## 🔍 Como Verificar se Está Funcionando

### Console do Navegador (F12)
Abra o console e procure por:

```
✅ Sucesso:
Calling AI suggestions RPC function...
AI Suggestions RPC Response: { ok: true, ... }

❌ Erro:
Function Error: ...
Detailed Error: ...
```

### Logs Esperados (Sucesso)
```javascript
Calling AI suggestions RPC function...
AI Suggestions RPC Response: {
  ok: true,
  mode: "OPEN_OS",
  suggestions: {
    organized_description: "Não carrega",
    suggested_category: "Energia",
    initial_checklist: [...],
    clarification_questions: [...]
  },
  knowledge: {
    term_definitions: [...]
  },
  meta: {
    source: "database_rpc",
    terms_found: 1
  }
}
```

## ❌ Se Aparecer Erro

### Erro: "Sessão expirada. Por favor, recarregue a página (F5)."
**Solução:**
1. Pressionar F5 para recarregar
2. Fazer login novamente se necessário
3. Tentar novamente

### Erro: "Não foi possível obter sugestões da IA"
**Solução:**
1. Abrir console (F12)
2. Copiar mensagem de erro completa
3. Clicar em "Tentar Novamente"
4. Se persistir, enviar logs para suporte

### Erro: "RPC function failed..."
**Solução:**
1. Verificar conexão com internet
2. Recarregar página (F5)
3. Verificar se banco de dados está online

## 📊 Indicadores de Sucesso

### ✅ Sistema Funcionando:
- Sugestões aparecem em < 2 segundos
- Categoria é sugerida automaticamente
- Checklist tem 4-7 itens
- Perguntas são relevantes ao problema
- Console mostra "AI Suggestions RPC Response"

### ❌ Sistema com Problema:
- Mensagem de erro em vermelho
- Nenhuma sugestão aparece
- Console mostra "Function Error"
- Botão "Tentar Novamente" aparece

## 🎯 Casos de Teste Completos

### Caso 1: Bateria
| Campo | Valor |
|-------|-------|
| Equipamento | Notebook Dell |
| Descrição | Bateria não carrega |
| Categoria Esperada | Energia |
| Checklist | 7 itens |
| Termos | bateria, carrega |

### Caso 2: Tela
| Campo | Valor |
|-------|-------|
| Equipamento | iPhone 12 |
| Descrição | Tela quebrada |
| Categoria Esperada | Display |
| Checklist | 7 itens |
| Termos | tela |

### Caso 3: Líquido
| Campo | Valor |
|-------|-------|
| Equipamento | MacBook Pro |
| Descrição | Derramou café |
| Categoria Esperada | Dano por Líquido |
| Checklist | 4 itens |
| Termos | liquido, derramamento |

### Caso 4: Queimado
| Campo | Valor |
|-------|-------|
| Equipamento | PlayStation 5 |
| Descrição | Não liga e cheira queimado |
| Categoria Esperada | Dano Físico |
| Checklist | 4 itens |
| Termos | cheira, queimado |

### Caso 5: Software
| Campo | Valor |
|-------|-------|
| Equipamento | Samsung Galaxy |
| Descrição | Trava e reinicia sozinho |
| Categoria Esperada | Software |
| Checklist | 4 itens |
| Termos | trava, reinicia |

## 🚀 Teste Rápido (30 segundos)

1. Abrir Nova OS
2. Digitar: "Não carrega"
3. Aguardar 2 segundos
4. Verificar se apareceu:
   - ✅ Categoria: Energia
   - ✅ Checklist com 7 itens
   - ✅ Perguntas de esclarecimento
5. **Se apareceu = Sistema funcionando! ✅**
6. **Se não apareceu = Verificar console (F12)**

## 📞 Suporte

Se precisar de ajuda:
1. Abrir console (F12)
2. Tirar print da tela
3. Copiar logs do console
4. Enviar para suporte técnico

---

**Sistema testado e 100% funcional!** 🎉
