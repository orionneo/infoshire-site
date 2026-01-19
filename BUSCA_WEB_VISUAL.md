# 🎨 Busca Web com IA - Guia Visual

## 🗺️ Mapa de Localização

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA INFOSHIRE                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│  AdminOrders  │    │  Diagnostic    │    │ AIKnowledge  │
│               │    │   Assistant    │    │    Admin     │
└───────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│ 🔍 Buscar     │    │ 🌐 Buscar Mais │    │ 🔍 Validar   │
│ Informações   │    │ Informações    │    │ com Web      │
│ Técnicas      │    │ na Web         │    │              │
└───────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ WebSearchAssistant│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ai-web-search   │
                    │  Edge Function   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Gemini 2.5 Flash │
                    │   API (Grátis)   │
                    └──────────────────┘
```

## 📱 Interface do Componente

```
┌─────────────────────────────────────────────────────────┐
│ 🌐 Busca Web com IA                                     │
│ Busque informações técnicas na web com citações        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ O que você quer saber?                                 │
│ ┌─────────────────────────────────────┬─────────────┐ │
│ │ Ex: iPhone 13 Pro Max bateria mAh  │  🔍 Buscar  │ │
│ └─────────────────────────────────────┴─────────────┘ │
│                                                         │
│ ⏱️ Buscando informações na web...                      │
│    A primeira resposta pode levar até 30 segundos.    │
│                                                         │
│ Buscas realizadas:                                     │
│ [iPhone 13 Pro Max battery capacity]                  │
│                                                         │
│ Informações encontradas:                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ O iPhone 13 Pro Max possui uma bateria de      │   │
│ │ 4.352 mAh, a maior já colocada em um iPhone... │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ✅ Fontes citadas (3):                                 │
│ 🔗 Apple iPhone 13 Pro Max - Wikipedia                │
│    https://pt.wikipedia.org/wiki/...                  │
│ 🔗 iPhone 13 Pro Max Specs - GSMArena                 │
│    https://www.gsmarena.com/...                       │
│ 🔗 iPhone 13 Pro Max Review - TechRadar               │
│    https://www.techradar.com/...                      │
│                                                         │
│ ⚠️ Sempre valide as informações antes de usar.        │
│    O técnico deve ter controle final sobre decisões.  │
│                                                         │
│ ┌──────────────────┐  ┌─────────────────────────┐    │
│ │ 📋 Copiar Texto  │  │ ✅ Aplicar Informações  │    │
│ └──────────────────┘  └─────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Fluxo de Uso

### 1️⃣ Abertura de OS
```
Técnico cria nova OS
        │
        ▼
Preenche equipamento e problema
        │
        ▼
Quer mais informações?
        │
        ▼
Clica em "Buscar Informações Técnicas"
        │
        ▼
Digite: "Samsung S21 problemas bateria"
        │
        ▼
Aguarda 10-30 segundos
        │
        ▼
Vê resultados com fontes
        │
        ▼
Clica em "Aplicar Informações"
        │
        ▼
Informações adicionadas ao campo descrição
        │
        ▼
Continua preenchendo OS
```

### 2️⃣ Diagnóstico
```
Técnico abre OS para diagnóstico
        │
        ▼
Vê sugestões da IA local
        │
        ▼
Quer mais informações da web?
        │
        ▼
Clica em "Buscar Mais Informações na Web"
        │
        ▼
Digite: "notebook não liga após queda"
        │
        ▼
Vê causas e soluções com fontes
        │
        ▼
Usa informações para diagnóstico
```

### 3️⃣ Validação
```
Técnico documenta novo caso
        │
        ▼
Preenche problema e solução
        │
        ▼
Quer validar informações?
        │
        ▼
Clica em "Validar com Web"
        │
        ▼
Digite: "backlight LCD funcionamento"
        │
        ▼
Vê definições técnicas com fontes
        │
        ▼
Clica em "Aplicar Informações"
        │
        ▼
Informações adicionadas às observações
```

## 🎨 Cores e Ícones

### Ícones Usados
- 🔍 Buscar / Pesquisar
- 🌐 Web / Internet
- ⏱️ Tempo / Aguardar
- ✅ Sucesso / Confirmação
- ⚠️ Aviso / Atenção
- 📋 Copiar
- 🔗 Link / Fonte
- 💡 Dica / Sugestão

### Estados Visuais
```
┌─────────────────────────────────────┐
│ Estado: IDLE (Pronto)               │
│ Cor: Padrão                         │
│ Botão: Azul (Primary)               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Estado: LOADING (Buscando)          │
│ Cor: Amarelo (Warning)              │
│ Botão: Desabilitado + Spinner      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Estado: SUCCESS (Sucesso)           │
│ Cor: Verde (Success)                │
│ Botão: Verde + CheckCircle          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Estado: ERROR (Erro)                │
│ Cor: Vermelho (Destructive)         │
│ Botão: Vermelho + AlertCircle       │
└─────────────────────────────────────┘
```

## 📊 Métricas de Uso

### Tempo Médio
```
┌─────────────────────────────────────┐
│ Primeira busca:     15-30 segundos  │
│ Buscas seguintes:   10-20 segundos  │
│ Aplicar resultado:  < 1 segundo     │
└─────────────────────────────────────┘
```

### Tamanho de Resposta
```
┌─────────────────────────────────────┐
│ Texto:    200-500 caracteres        │
│ Fontes:   2-5 URLs                  │
│ Queries:  1-3 termos                │
└─────────────────────────────────────┘
```

## 🎓 Exemplos Visuais

### ✅ Boa Consulta
```
┌─────────────────────────────────────┐
│ iPhone 13 Pro Max bateria mAh      │
│                                     │
│ ✅ Específico                       │
│ ✅ Modelo completo                  │
│ ✅ Termo técnico claro              │
└─────────────────────────────────────┘
```

### ❌ Consulta Ruim
```
┌─────────────────────────────────────┐
│ celular bateria                     │
│                                     │
│ ❌ Muito genérico                   │
│ ❌ Sem modelo                       │
│ ❌ Sem contexto                     │
└─────────────────────────────────────┘
```

---

**Dica:** Use este guia visual para entender rapidamente onde e como usar a busca web com IA!
