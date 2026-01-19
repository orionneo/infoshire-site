# 🚀 AI Knowledge Engine - Guia Rápido

## ⚡ Quick Start

### 1. Acessar Painel Admin
```
URL: /admin/ai-knowledge
```

### 2. Verificar Estatísticas
- Total de eventos capturados
- Eventos pendentes para processar
- Termos aprendidos no glossário
- Erros não resolvidos

### 3. Processar Eventos
```
Clique em "Processar (N)" para processar eventos pendentes
```

### 4. Configurar
- **Aprendizado Automático:** ON (recomendado)
- **Busca Web:** OFF (experimental)
- **Restringir Fontes:** ON (se busca web ativa)

---

## 💻 Uso no Código

### Consultar Knowledge Engine
```typescript
import { queryAIKnowledge } from '@/db/api';

// Exemplo: Ao criar OS
const handleCreateOS = async () => {
  const knowledge = await queryAIKnowledge({
    text: formData.problem_description,
    equipamento_tipo: formData.equipment,
    marca: formData.brand,
    modelo: formData.model,
    context: {
      mode: 'OPEN_OS'
    }
  });

  // Usar conhecimento retornado
  if (knowledge.knowledge.common_causes.length > 0) {
    console.log('Causas comuns:', knowledge.knowledge.common_causes);
  }

  if (knowledge.knowledge.similar_cases.length > 0) {
    console.log('Casos similares:', knowledge.knowledge.similar_cases);
  }
};
```

### Processar Eventos (Admin)
```typescript
import { processAIKnowledgeEvents } from '@/db/api';

const handleProcess = async () => {
  const result = await processAIKnowledgeEvents(50);
  console.log(`Processados: ${result.processed_count}`);
  console.log(`Novos termos: ${result.new_terms_count}`);
};
```

### Obter Estatísticas (Admin)
```typescript
import { getAIKnowledgeStats } from '@/db/api';

const stats = await getAIKnowledgeStats();
console.log(stats);
```

---

## 🗄️ Consultas SQL Úteis

### Ver Eventos Recentes
```sql
SELECT 
  event_type,
  equipamento_tipo,
  raw_text,
  status,
  created_at
FROM ai_knowledge_events
ORDER BY created_at DESC
LIMIT 10;
```

### Ver Termos Mais Frequentes
```sql
SELECT 
  term,
  frequency,
  term_category,
  equipment_types
FROM ai_terms
ORDER BY frequency DESC
LIMIT 20;
```

### Ver Eventos Pendentes
```sql
SELECT COUNT(*) as pending_count
FROM ai_knowledge_events
WHERE status = 'PENDING';
```

### Processar Manualmente
```sql
SELECT * FROM process_ai_knowledge_events(50);
```

### Construir Cache de Casos Similares
```sql
SELECT build_similar_cases_cache('uuid-da-os');
```

---

## 🔧 Configurações Disponíveis

| Chave | Valores | Descrição |
|-------|---------|-----------|
| `AUTO_LEARN_ENABLED` | true/false | Captura automática de eventos |
| `WEB_ENABLED` | true/false | Busca web para enriquecer conhecimento |
| `RESTRICTED_WEB` | true/false | Restringir a fontes confiáveis |
| `MIN_TERM_FREQUENCY` | número | Frequência mínima para relevância |
| `SIMILARITY_THRESHOLD` | 0.0-1.0 | Threshold para casos similares |
| `MAX_SIMILAR_CASES` | número | Máximo de casos a retornar |

### Atualizar Configuração
```typescript
import { updateAIConfig } from '@/db/api';

await updateAIConfig('WEB_ENABLED', 'true');
await updateAIConfig('MAX_SIMILAR_CASES', '10');
```

---

## 🎯 Fluxo Típico

```
1. Técnico cria OS com descrição do problema
   ↓
2. Trigger captura evento automaticamente
   ↓
3. Evento fica PENDING até processamento
   ↓
4. Admin processa eventos (manual ou cron)
   ↓
5. Termos são extraídos e salvos no glossário
   ↓
6. Frontend pode consultar conhecimento via API
   ↓
7. Sistema retorna causas comuns e casos similares
```

---

## ⚠️ Troubleshooting

### Eventos não estão sendo capturados
```sql
-- Verificar se auto-learn está ativo
SELECT * FROM ai_config WHERE config_key = 'AUTO_LEARN_ENABLED';

-- Ativar se necessário
UPDATE ai_config 
SET config_value = 'true' 
WHERE config_key = 'AUTO_LEARN_ENABLED';
```

### Muitos eventos pendentes
```sql
-- Processar em lote maior
SELECT * FROM process_ai_knowledge_events(100);
```

### Ver erros recentes
```sql
SELECT 
  function_name,
  error_message,
  created_at
FROM ai_errors
WHERE resolved = false
ORDER BY created_at DESC
LIMIT 10;
```

### Limpar cache de casos similares
```sql
DELETE FROM ai_similar_cases WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## 📊 Métricas de Sucesso

### KPIs para Monitorar
- **Taxa de Processamento:** eventos processados / eventos capturados
- **Crescimento do Glossário:** novos termos por semana
- **Qualidade dos Casos Similares:** similarity_score médio
- **Taxa de Erro:** erros não resolvidos / total de eventos

### Queries de Métricas
```sql
-- Taxa de processamento
SELECT 
  COUNT(*) FILTER (WHERE status = 'PROCESSED') * 100.0 / COUNT(*) as taxa_processamento
FROM ai_knowledge_events;

-- Crescimento semanal
SELECT 
  DATE_TRUNC('week', created_at) as semana,
  COUNT(*) as novos_termos
FROM ai_terms
GROUP BY semana
ORDER BY semana DESC
LIMIT 4;

-- Similaridade média
SELECT AVG(similarity_score) as avg_similarity
FROM ai_similar_cases;
```

---

## 🔐 Segurança

### Dados Anonimizados
- ✅ Casos similares não expõem telefone/email
- ✅ Apenas 200 caracteres de descrição/solução
- ✅ RLS habilitado em todas as tabelas

### Permissões
- **Leitura:** Usuários autenticados
- **Escrita:** Apenas service role (via triggers/functions)
- **Admin:** Acesso ao painel de configuração

---

## 🚀 Próximas Implementações (Fase 2)

### Não Implementado Ainda:
- Diagnóstico assistido na UI ao criar OS
- Sugestões em tempo real
- Busca web automática
- Machine learning avançado
- Cron job para processamento automático

### Já Implementado:
- ✅ Captura automática de eventos
- ✅ Processamento de termos
- ✅ Glossário vivo
- ✅ Casos similares
- ✅ API de consulta (sempre 200)
- ✅ Painel administrativo
- ✅ Configurações

---

## 📞 Suporte

### Logs
```typescript
// Frontend
console.log('AI Knowledge Query:', result);

// Backend
SELECT * FROM ai_errors ORDER BY created_at DESC LIMIT 10;
```

### Debug
```sql
-- Ver último evento capturado
SELECT * FROM ai_knowledge_events ORDER BY created_at DESC LIMIT 1;

-- Ver último termo criado
SELECT * FROM ai_terms ORDER BY created_at DESC LIMIT 1;

-- Ver configuração atual
SELECT * FROM ai_config WHERE is_active = true;
```

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-01-15  
**Status:** ✅ Produção (Fase 1)
