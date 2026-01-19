# 🌐 Busca Web Gratuita com IA - Guia Completo

## 📋 Visão Geral

Sistema de busca web integrado com IA (Gemini 2.5 Flash) que permite aos técnicos buscar informações técnicas na web com citações de fontes confiáveis, **totalmente gratuito**.

## ✨ Funcionalidades Implementadas

### 1. **Edge Function: ai-web-search**
- ✅ Integração com Gemini 2.5 Flash API via gateway (grátis)
- ✅ Busca web com citações automáticas de fontes
- ✅ Suporte para streaming de respostas (SSE)
- ✅ Tratamento de erros e timeouts
- ✅ CORS headers configurados
- ✅ Extração de URLs reais das fontes citadas

### 2. **Componente: WebSearchAssistant**
- ✅ Interface de busca intuitiva
- ✅ Exibição de resultados com fontes citadas
- ✅ Botões para copiar e aplicar informações
- ✅ Loading state com aviso de espera (até 30s)
- ✅ Tratamento de erros amigável
- ✅ Badges com queries de busca realizadas
- ✅ Links clicáveis para fontes

### 3. **Integrações**

#### 📝 AdminOrders (Abertura de OS)
**Localização:** Formulário de criação de nova OS

**Funcionalidades:**
- Buscar especificações de equipamentos
- Buscar problemas comuns
- Auto-preencher campo de descrição com informações encontradas
- Contexto: `abertura_os`

**Como usar:**
1. Ao criar nova OS, role até o final do formulário
2. Encontre o card "🔍 Buscar Informações Técnicas"
3. Digite sua consulta (ex: "Samsung Galaxy S21 problemas comuns de bateria")
4. Clique em "Buscar"
5. Aguarde até 30 segundos
6. Clique em "Aplicar Informações" para adicionar ao campo de descrição

#### 🧠 DiagnosticAssistant (Diagnóstico)
**Localização:** Painel lateral de diagnóstico em AdminOrderDetail

**Funcionalidades:**
- Buscar soluções para problemas específicos
- Exibir resultados com fontes confiáveis
- Contexto: `diagnostico`

**Como usar:**
1. Abra uma OS em AdminOrderDetail
2. No painel de "Diagnóstico Assistido"
3. Role até o final e clique em "Buscar Mais Informações na Web"
4. Digite sua consulta (ex: "notebook não liga após queda causa comum")
5. Veja resultados com fontes citadas

#### 📚 AIKnowledgeAdmin (Base de Conhecimento)
**Localização:** Aba "Documentar Novo Caso"

**Funcionalidades:**
- Validar informações técnicas com fontes externas
- Comparar definições internas com web
- Enriquecer casos documentados
- Contexto: `validacao`

**Como usar:**
1. Vá para Admin > Base de Conhecimento IA
2. Aba "Documentar Novo Caso"
3. Preencha os campos do caso
4. Clique em "Validar com Web"
5. Busque informações adicionais
6. Clique em "Aplicar Informações" para adicionar às observações

## 🎯 Contextos de Busca

### `abertura_os` (Abertura de OS)
Prompt otimizado para:
- Especificações técnicas de equipamentos
- Problemas comuns conhecidos
- Componentes principais
- Informações úteis para diagnóstico

### `diagnostico` (Diagnóstico)
Prompt otimizado para:
- Causas comuns de problemas
- Testes diagnósticos recomendados
- Soluções conhecidas
- Peças que costumam falhar

### `validacao` (Validação)
Prompt otimizado para:
- Definições técnicas precisas
- Uso em eletrônicos/computadores
- Informações relevantes para técnicos
- Termos relacionados

## 🔍 Exemplos de Consultas

### Especificações
```
iPhone 13 Pro Max bateria mAh capacidade
Samsung Galaxy S21 tela AMOLED especificações
MacBook Pro M1 2020 RAM máxima suportada
```

### Problemas Comuns
```
notebook não liga após queda d'água
celular não carrega bateria incha
tela preta mas aparelho liga som
```

### Validação Técnica
```
backlight LCD funcionamento
reballing BGA processo técnico
PMIC chip função eletrônica
```

## 📊 Estrutura de Resposta

### Informações Retornadas
1. **Resposta da IA**: Texto completo com informações técnicas
2. **Fontes Citadas**: Lista de URLs com títulos
3. **Queries de Busca**: Termos usados pela IA para buscar

### Exemplo de Resposta
```json
{
  "success": true,
  "answer": "O iPhone 13 Pro Max possui uma bateria de 4.352 mAh...",
  "sources": [
    {
      "title": "Apple iPhone 13 Pro Max - Wikipedia",
      "url": "https://pt.wikipedia.org/wiki/IPhone_13_Pro_Max"
    },
    {
      "title": "iPhone 13 Pro Max Specs - GSMArena",
      "url": "https://www.gsmarena.com/apple_iphone_13_pro_max-11089.php"
    }
  ],
  "searchQueries": [
    "iPhone 13 Pro Max battery capacity mAh"
  ]
}
```

## ⚠️ Avisos Importantes

### Tempo de Resposta
- **Primeira resposta pode levar até 30 segundos**
- Aviso exibido automaticamente durante busca
- Não feche a janela enquanto busca

### Validação de Informações
- ⚠️ **Sempre valide as informações antes de usar**
- O técnico deve ter controle final sobre as decisões
- Use as fontes citadas para verificar informações
- Disclaimer exibido em todos os resultados

### Limitações
- Requer conexão com internet
- Depende da disponibilidade da API Gemini
- Informações podem estar desatualizadas
- Sempre consulte fontes oficiais para informações críticas

## 🛠️ Arquitetura Técnica

### Edge Function
**Arquivo:** `supabase/functions/ai-web-search/index.ts`

**Fluxo:**
1. Recebe query e contexto
2. Constrói prompt contextualizado
3. Chama API Gemini 2.5 Flash
4. Processa streaming SSE
5. Extrai texto, fontes e queries
6. Remove duplicatas de fontes
7. Retorna resposta estruturada

**Autenticação:**
- Usa `INTEGRATIONS_API_KEY` (injetada automaticamente)
- Header: `X-Gateway-Authorization: Bearer ${apiKey}`

### Frontend Component
**Arquivo:** `src/components/WebSearchAssistant.tsx`

**Props:**
```typescript
interface WebSearchAssistantProps {
  context?: 'abertura_os' | 'diagnostico' | 'validacao';
  onApplyResult?: (result: string) => void;
  placeholder?: string;
  title?: string;
  description?: string;
}
```

**Estados:**
- `query`: Consulta do usuário
- `isSearching`: Loading state
- `result`: Resultado da busca
- `error`: Mensagem de erro
- `copied`: Estado do botão copiar

## 🚀 Como Testar

### Teste 1: Especificações
1. Vá para Admin > Ordens de Serviço
2. Clique em "Criar Nova OS"
3. Role até "Buscar Informações Técnicas"
4. Digite: "iPhone 13 Pro Max bateria mAh"
5. Clique em "Buscar"
6. Aguarde resposta
7. Verifique fontes citadas
8. Clique em "Aplicar Informações"
9. Verifique se foi adicionado ao campo de descrição

### Teste 2: Diagnóstico
1. Abra uma OS existente
2. Vá para o painel de "Diagnóstico Assistido"
3. Clique em "Buscar Mais Informações na Web"
4. Digite: "notebook não liga causa comum"
5. Clique em "Buscar"
6. Verifique causas e soluções retornadas
7. Clique nas fontes para verificar

### Teste 3: Validação
1. Vá para Admin > Base de Conhecimento IA
2. Aba "Documentar Novo Caso"
3. Preencha alguns campos
4. Clique em "Validar com Web"
5. Digite: "backlight LCD funcionamento"
6. Clique em "Buscar"
7. Clique em "Aplicar Informações"
8. Verifique se foi adicionado às observações

## 💡 Dicas de Uso

### Para Melhores Resultados
1. **Seja específico**: "Samsung Galaxy S21 bateria" > "celular bateria"
2. **Use termos técnicos**: "PMIC chip" > "chip de energia"
3. **Inclua modelo**: "iPhone 13 Pro Max" > "iPhone"
4. **Combine problema + equipamento**: "MacBook Pro não liga após líquido"

### Quando Usar
- ✅ Especificações desconhecidas
- ✅ Problemas raros ou específicos
- ✅ Validar informações técnicas
- ✅ Aprender sobre novos equipamentos
- ✅ Confirmar procedimentos de reparo

### Quando NÃO Usar
- ❌ Informações críticas de segurança (consulte manual oficial)
- ❌ Procedimentos de soldagem complexos (consulte especialista)
- ❌ Diagnósticos médicos ou de segurança
- ❌ Informações confidenciais ou proprietárias

## 📈 Benefícios

### Para o Técnico
- ⚡ Acesso rápido a informações técnicas
- 📚 Fontes confiáveis citadas
- 🎯 Contexto específico para cada situação
- 💰 Totalmente gratuito
- 🔍 Busca web integrada no fluxo de trabalho

### Para a Assistência Técnica
- 📊 Diagnósticos mais precisos
- ⏱️ Redução de tempo de pesquisa
- 💡 Aprendizado contínuo
- 🎓 Base de conhecimento enriquecida
- 🌐 Acesso a informações atualizadas

## 🔧 Troubleshooting

### Erro: "API key não configurada"
**Solução:** A chave é injetada automaticamente. Verifique se a Edge Function foi deployada corretamente.

### Erro: "Timeout"
**Solução:** A primeira resposta pode levar até 30s. Aguarde ou tente novamente.

### Erro: "Nenhuma informação encontrada"
**Solução:** Tente reformular a consulta com termos mais específicos.

### Fontes não aparecem
**Solução:** Algumas consultas podem não retornar fontes. Isso é normal.

## 📝 Notas de Desenvolvimento

### API Gemini 2.5 Flash
- **Endpoint:** `https://app-8pj0bpgfx6v5-api-zYm4ze3j7XvL.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse`
- **Método:** POST
- **Formato:** Server-Sent Events (SSE)
- **Timeout:** Até 30 segundos para primeira resposta
- **Custo:** Gratuito via gateway

### Grounding Metadata
A API retorna metadados de "grounding" que incluem:
- `groundingChunks`: Fontes web usadas
- `groundingSupports`: Correspondência texto-fonte
- `webSearchQueries`: Queries executadas

### Extração de URLs
URLs são extraídas do formato redirect:
```
https://vertexaisearch.cloud.google.com/grounding-api-redirect/...?url=REAL_URL
```

## 🎉 Conclusão

O sistema de busca web com IA está **100% funcional** e pronto para uso. Ele fornece uma ferramenta poderosa e gratuita para técnicos buscarem informações técnicas com citações de fontes confiáveis, integrada diretamente no fluxo de trabalho do sistema Infoshire.

**Próximos passos:**
1. Testar com casos reais
2. Coletar feedback dos técnicos
3. Ajustar prompts conforme necessário
4. Expandir para outros contextos se necessário

---

**Desenvolvido com ❤️ para Infoshire**
**Data:** 2026-01-04
**Versão:** 1.0.0
