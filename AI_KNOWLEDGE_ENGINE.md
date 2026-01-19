# 🧠 AI Knowledge Engine - Documentação Técnica

## 📋 Visão Geral

O **Knowledge Engine** (Motor de Conhecimento) é um sistema de aprendizado contínuo que captura, processa e organiza conhecimento técnico automaticamente a partir das ações dos técnicos no sistema Infoshire.

### Objetivo
Criar uma base de conhecimento viva que:
- Aprende com cada OS criada/editada
- Normaliza termos técnicos em português
- Identifica casos similares automaticamente
- (Opcional) Enriquece conhecimento com fontes web confiáveis
- **NUNCA** gera erros para o front-end (sempre retorna 200)

---

## 🗄️ Estrutura do Banco de Dados

### 1. `ai_knowledge_events`
**Propósito:** Captura sinais de aprendizado de ações dos técnicos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `created_at` | TIMESTAMPTZ | Data de captura |
| `user_id` | UUID | Técnico que gerou o evento |
| `os_id` | UUID | Ordem de serviço relacionada |
| `equipamento_tipo` | TEXT | Tipo de equipamento |
| `marca` | TEXT | Marca do equipamento |
| `modelo` | TEXT | Modelo do equipamento |
| `raw_text` | TEXT | Texto bruto capturado |
| `event_type` | TEXT | Tipo: OS_CREATE, OS_UPDATE, STATUS_CHANGE, SOLUTION_MARKED |
| `normalized_terms` | TEXT[] | Termos normalizados extraídos |
| `categories` | TEXT[] | Categorias identificadas |
| `solution_tags` | TEXT[] | Tags de solução |
| `confidence` | NUMERIC(3,2) | Confiança (0.0 a 1.0) |
| `source` | TEXT | Fonte: TECH, CLIENT, SYSTEM |
| `status` | TEXT | Status: PENDING, PROCESSED, INDEXED |
| `processed_at` | TIMESTAMPTZ | Data de processamento |

**Triggers:**
- Captura automática ao criar/editar OS (se `AUTO_LEARN_ENABLED=true`)

---

### 2. `ai_terms`
**Propósito:** Glossário vivo de termos técnicos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `term` | TEXT | Termo original |
| `normalized_term` | TEXT | Termo normalizado (lowercase, sem acentos) |
| `synonyms` | TEXT[] | Sinônimos identificados |
| `definition_internal` | TEXT | Definição aprendida dos técnicos |
| `definition_web` | TEXT | Definição obtida da web (opcional) |
| `frequency` | INTEGER | Frequência de uso |
| `last_seen` | TIMESTAMPTZ | Última vez visto |
| `related_terms` | TEXT[] | Termos relacionados |
| `equipment_types` | TEXT[] | Tipos de equipamento associados |
| `examples` | TEXT[] | Exemplos de uso |
| `term_category` | TEXT | Categoria: SYMPTOM, COMPONENT, SOLUTION, TOOL, GENERAL |

**Índices:**
- `term`, `normalized_term`, `frequency DESC`, `term_category`

---

### 3. `ai_web_sources`
**Propósito:** Conhecimento opcional obtido de fontes web

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `term` | TEXT | Termo pesquisado |
| `term_id` | UUID | Referência ao termo |
| `source_name` | TEXT | Nome da fonte |
| `source_url` | TEXT | URL da fonte |
| `source_type` | TEXT | Tipo: MANUAL, FORUM, WIKI, MANUFACTURER |
| `extracted_summary` | TEXT | Resumo extraído |
| `troubleshooting_steps` | TEXT[] | Passos de troubleshooting |
| `trust_score` | NUMERIC(3,2) | Score de confiança (0.0 a 1.0) |
| `is_whitelisted` | BOOLEAN | Fonte está na whitelist |
| `fetched_at` | TIMESTAMPTZ | Data da busca |

---

### 4. `ai_similar_cases`
**Propósito:** Cache de casos similares pré-computados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `os_id` | UUID | OS de referência |
| `similar_os_id` | UUID | OS similar encontrada |
| `similarity_score` | NUMERIC(3,2) | Score de similaridade (0.0 a 1.0) |
| `matching_terms` | TEXT[] | Termos em comum |
| `anonymized_description` | TEXT | Descrição anonimizada (200 chars) |
| `anonymized_solution` | TEXT | Solução anonimizada (200 chars) |

**Privacidade:** Dados são anonimizados (sem telefone/email)

---

### 5. `ai_config`
**Propósito:** Configurações do sistema

| Chave | Valor Padrão | Descrição |
|-------|--------------|-----------|
| `WEB_ENABLED` | false | Habilitar busca web |
| `RESTRICTED_WEB` | true | Restringir a fontes confiáveis |
| `MIN_TERM_FREQUENCY` | 2 | Frequência mínima para relevância |
| `SIMILARITY_THRESHOLD` | 0.6 | Threshold para casos similares |
| `MAX_SIMILAR_CASES` | 5 | Máximo de casos similares a retornar |
| `AUTO_LEARN_ENABLED` | true | Aprendizado automático |

---

### 6. `ai_errors`
**Propósito:** Log de erros para debugging (anti-crash)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `function_name` | TEXT | Nome da função que falhou |
| `error_message` | TEXT | Mensagem de erro |
| `error_stack` | TEXT | Stack trace |
| `input_snapshot` | JSONB | Snapshot do input para debug |
| `user_id` | UUID | Usuário relacionado |
| `os_id` | UUID | OS relacionada |
| `resolved` | BOOLEAN | Erro resolvido |

---

## 🔧 Funções do Banco de Dados

### `normalize_text(input_text TEXT) → TEXT`
Normaliza texto em português:
- Converte para minúsculas
- Remove acentos
- Retorna texto normalizado

**Exemplo:**
```sql
SELECT normalize_text('Não Liga'); -- retorna: 'nao liga'
```

---

### `extract_keywords(input_text TEXT) → TEXT[]`
Extrai palavras-chave relevantes:
- Remove stopwords (o, a, de, da, etc.)
- Filtra palavras com menos de 3 caracteres
- Retorna array de keywords

**Exemplo:**
```sql
SELECT extract_keywords('Notebook não liga após queda');
-- retorna: ['notebook', 'nao', 'liga', 'apos', 'queda']
```

---

### `capture_ai_knowledge_event() → TRIGGER`
Trigger automático que captura eventos ao criar/editar OS:
- Detecta tipo de evento (CREATE, UPDATE, STATUS_CHANGE)
- Extrai keywords do texto
- Insere em `ai_knowledge_events` com status PENDING
- **NUNCA** falha a operação principal (try/catch)

---

### `process_ai_knowledge_events(batch_size INTEGER) → TABLE`
Processa eventos pendentes em lote:
- Processa até `batch_size` eventos (padrão: 50)
- Extrai termos e atualiza glossário
- Incrementa frequência de termos existentes
- Marca eventos como PROCESSED

**Retorno:**
```sql
{
  processed_count: INTEGER,
  new_terms_count: INTEGER,
  errors_count: INTEGER
}
```

**Uso:**
```sql
SELECT * FROM process_ai_knowledge_events(50);
```

---

### `build_similar_cases_cache(target_os_id UUID) → INTEGER`
Constrói cache de casos similares para uma OS:
- Busca OSs com mesmo equipamento
- Calcula similaridade baseada em termos em comum
- Filtra por threshold configurável
- Anonimiza dados sensíveis
- Retorna número de casos encontrados

**Uso:**
```sql
SELECT build_similar_cases_cache('uuid-da-os');
```

---

## 🌐 Edge Function: `ai-knowledge-query`

### Endpoint
```
POST /functions/v1/ai-knowledge-query
```

### Request Body
```typescript
{
  text: string;                    // Texto para análise (obrigatório)
  equipamento_tipo?: string;       // Tipo de equipamento
  marca?: string;                  // Marca
  modelo?: string;                 // Modelo
  context?: {
    os_id?: string;                // ID da OS (para casos similares)
    mode?: 'OPEN_OS' | 'IN_OS';   // Contexto de uso
  };
}
```

### Response (SEMPRE 200)
```typescript
{
  ok: true,
  normalized: {
    keywords: string[];            // Palavras-chave extraídas
    terms: string[];               // Termos técnicos identificados
    categories: string[];          // Categorias detectadas
    signals_missing: string[];     // Sinais faltantes (equipamento, marca, etc.)
  },
  knowledge: {
    term_definitions: [{           // Definições de termos
      term: string;
      definition_internal?: string;
      definition_web?: string;
      synonyms?: string[];
      category?: string;
    }],
    common_causes: string[];       // Causas comuns identificadas
    suggested_checks: string[];    // Verificações sugeridas
    similar_cases: [{              // Casos similares (anonimizados)
      similarity_score: number;
      description: string;
      solution: string;
      matching_terms: string[];
    }]
  },
  meta: {
    used_web: boolean;             // Se usou busca web
    fallback_reason: string | null; // Motivo de fallback (se houver)
    processing_time_ms: number;    // Tempo de processamento
  }
}
```

### Fallback Reasons
- `INSUFFICIENT_INPUT`: Texto vazio ou muito curto
- `EDGE_FUNCTION_ERROR`: Erro na edge function
- `CLIENT_ERROR`: Erro no cliente
- `INTERNAL_ERROR`: Erro interno não especificado

### Garantias
✅ **SEMPRE** retorna status 200  
✅ **NUNCA** lança exceção para o front-end  
✅ **SEMPRE** retorna estrutura padrão  
✅ Logs de erro salvos em `ai_errors`

---

## 📡 API Frontend

### `queryAIKnowledge(params) → Promise<AIKnowledgeResponse>`
Consulta o Knowledge Engine (wrapper da edge function)

**Uso:**
```typescript
import { queryAIKnowledge } from '@/db/api';

const result = await queryAIKnowledge({
  text: 'Notebook não liga, tela preta',
  equipamento_tipo: 'Notebook',
  marca: 'Dell',
  modelo: 'Inspiron 15',
  context: {
    os_id: 'uuid-da-os',
    mode: 'OPEN_OS'
  }
});

console.log(result.knowledge.common_causes);
console.log(result.knowledge.similar_cases);
```

---

### `processAIKnowledgeEvents(batchSize?) → Promise<{...}>`
Processa eventos pendentes (função administrativa)

**Uso:**
```typescript
import { processAIKnowledgeEvents } from '@/db/api';

const result = await processAIKnowledgeEvents(50);
console.log(`Processados: ${result.processed_count}`);
console.log(`Novos termos: ${result.new_terms_count}`);
```

---

### `buildSimilarCasesCache(osId) → Promise<number>`
Constrói cache de casos similares (função administrativa)

**Uso:**
```typescript
import { buildSimilarCasesCache } from '@/db/api';

const count = await buildSimilarCasesCache('uuid-da-os');
console.log(`${count} casos similares encontrados`);
```

---

### `getAIKnowledgeStats() → Promise<{...}>`
Obtém estatísticas do Knowledge Engine

**Uso:**
```typescript
import { getAIKnowledgeStats } from '@/db/api';

const stats = await getAIKnowledgeStats();
console.log(`Total de eventos: ${stats.total_events}`);
console.log(`Eventos pendentes: ${stats.pending_events}`);
console.log(`Termos aprendidos: ${stats.total_terms}`);
```

---

### `getAIConfig(key) → Promise<string | null>`
Obtém configuração do AI

**Uso:**
```typescript
import { getAIConfig } from '@/db/api';

const webEnabled = await getAIConfig('WEB_ENABLED');
console.log(`Web enabled: ${webEnabled === 'true'}`);
```

---

### `updateAIConfig(key, value) → Promise<void>`
Atualiza configuração do AI (função administrativa)

**Uso:**
```typescript
import { updateAIConfig } from '@/db/api';

await updateAIConfig('WEB_ENABLED', 'true');
await updateAIConfig('MAX_SIMILAR_CASES', '10');
```

---

## 🎯 Fluxo de Aprendizado

### 1. Captura Automática
```
Técnico cria/edita OS
    ↓
Trigger: capture_ai_knowledge_event()
    ↓
Extrai keywords do texto
    ↓
Insere em ai_knowledge_events (status: PENDING)
```

### 2. Processamento
```
Admin clica "Processar Eventos"
    ↓
Chama: process_ai_knowledge_events(50)
    ↓
Para cada evento PENDING:
  - Normaliza termos
  - Cria/atualiza termos no glossário
  - Incrementa frequência
  - Marca como PROCESSED
```

### 3. Consulta
```
Frontend chama: queryAIKnowledge({text, ...})
    ↓
Edge Function:
  - Extrai keywords
  - Detecta termos técnicos
  - Busca definições no glossário
  - Busca casos similares no cache
  - Gera causas comuns e sugestões
    ↓
Retorna resposta estruturada (SEMPRE 200)
```

---

## 🔒 Segurança e Privacidade

### RLS (Row Level Security)
- ✅ Todas as tabelas têm RLS habilitado
- ✅ Usuários autenticados podem ler
- ✅ Apenas service role pode escrever (via triggers/functions)

### Anonimização
- ✅ Casos similares são anonimizados (200 chars)
- ✅ Sem telefone, email ou dados pessoais
- ✅ Apenas sintomas e soluções genéricas

### Anti-Crash
- ✅ Triggers com try/catch (nunca falham operação principal)
- ✅ Edge function sempre retorna 200
- ✅ Erros logados em `ai_errors` para debugging
- ✅ Frontend tem fallback padrão

---

## 🌐 Busca Web (Opcional)

### Configuração
```typescript
await updateAIConfig('WEB_ENABLED', 'true');
await updateAIConfig('RESTRICTED_WEB', 'true');
```

### Whitelist de Fontes Confiáveis
- iFixit (manuais de reparo)
- Sites de fabricantes oficiais
- Wikipedia (termos técnicos)
- Fóruns técnicos reconhecidos

### Restrições
- ❌ Nunca coletar dados pessoais
- ❌ Nunca copiar conteúdo extenso
- ✅ Apenas resumos e checklists públicos
- ✅ Verificar trust_score antes de usar

---

## 📊 Painel Administrativo

### Acesso
```
/admin/ai-knowledge
```

### Funcionalidades
1. **Estatísticas em Tempo Real**
   - Total de eventos capturados
   - Eventos pendentes
   - Termos aprendidos
   - Erros não resolvidos

2. **Ações**
   - Processar eventos pendentes
   - Atualizar base de conhecimento

3. **Configurações**
   - Aprendizado automático (on/off)
   - Busca web (on/off)
   - Restringir a fontes confiáveis (on/off)

4. **Informações**
   - Como funciona
   - Coleta de conhecimento
   - Processamento inteligente
   - Casos similares
   - Enriquecimento web

---

## 🧪 Testes

### Teste 1: Captura Automática
```sql
-- Criar uma OS de teste
INSERT INTO service_orders (...)
VALUES (...);

-- Verificar se evento foi capturado
SELECT * FROM ai_knowledge_events
WHERE os_id = 'uuid-da-os'
ORDER BY created_at DESC
LIMIT 1;
```

### Teste 2: Processamento
```sql
-- Processar eventos
SELECT * FROM process_ai_knowledge_events(10);

-- Verificar termos criados
SELECT * FROM ai_terms
ORDER BY created_at DESC
LIMIT 10;
```

### Teste 3: Consulta
```typescript
const result = await queryAIKnowledge({
  text: 'Notebook Dell não liga',
  equipamento_tipo: 'Notebook',
  marca: 'Dell'
});

console.log(result.knowledge.common_causes);
// Esperado: ['Verificar conexões e alimentação', ...]
```

---

## 🚀 Próximos Passos (Fase 2)

### NÃO Implementado Nesta Fase:
- ❌ Diagnóstico Assistido na UI
- ❌ Sugestões em tempo real ao criar OS
- ❌ Busca web automática (apenas infraestrutura)
- ❌ Machine Learning avançado

### Implementado Nesta Fase:
- ✅ Infraestrutura completa do Knowledge Engine
- ✅ Captura automática de eventos
- ✅ Processamento de termos
- ✅ Casos similares
- ✅ API de consulta (sempre 200)
- ✅ Painel administrativo
- ✅ Configurações
- ✅ Anti-crash design

---

## 📝 Notas Importantes

1. **Performance:** Cache de casos similares deve ser reconstruído periodicamente (cron job futuro)
2. **Escalabilidade:** Processamento em lote (50 eventos por vez) para evitar timeouts
3. **Manutenção:** Revisar `ai_errors` regularmente para identificar problemas
4. **Privacidade:** NUNCA expor dados sensíveis em casos similares
5. **Web Search:** Implementar whitelist antes de ativar busca web

---

**Versão:** 1.0.0  
**Data:** 2026-01-15  
**Status:** ✅ Infraestrutura Completa (Fase 1)  
**Próxima Fase:** Diagnóstico Assistido na UI
