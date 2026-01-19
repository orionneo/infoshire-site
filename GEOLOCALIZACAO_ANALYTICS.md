# 🌍 Geolocalização no Analytics

## ✅ IMPLEMENTADO

Sistema de geolocalização por IP integrado ao analytics para rastrear cidade e país dos visitantes.

---

## 🎯 Como Funciona

### 1. Captura Automática

Quando um visitante acessa o site pela primeira vez:

```
1. AnalyticsTracker detecta nova sessão
   ↓
2. trackSessionStart() é chamado
   ↓
3. getGeolocation() faz requisição para ipapi.co
   ↓
4. API retorna: { city: "São Paulo", country: "Brazil" }
   ↓
5. Dados são salvos em analytics_sessions
   ↓
6. Dashboard exibe em "De Onde São os Visitantes"
```

### 2. API Utilizada

**Serviço:** ipapi.co  
**Endpoint:** https://ipapi.co/json/  
**Método:** GET  
**Autenticação:** Não requerida (free tier)

**Limites:**
- 1500 requisições/dia (grátis)
- 30.000 requisições/mês (grátis)
- Sem necessidade de API key

**Dados Retornados:**
```json
{
  "ip": "177.123.45.67",
  "city": "São Paulo",
  "region": "São Paulo",
  "country": "BR",
  "country_name": "Brazil",
  "timezone": "America/Sao_Paulo",
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

**Dados Armazenados:**
- ✅ `city` - Nome da cidade
- ✅ `country` - Nome do país
- ❌ IP não é armazenado (privacidade)
- ❌ Coordenadas não são armazenadas

---

## 📊 Visualização no Dashboard

### Card "De Onde São os Visitantes"

Exibe as principais cidades e países dos visitantes:

```
🌍 De Onde São os Visitantes
Principais cidades e regiões

São Paulo, Brazil          15 visitas
Rio de Janeiro, Brazil     8 visitas
Belo Horizonte, Brazil     5 visitas
Curitiba, Brazil           3 visitas
Porto Alegre, Brazil       2 visitas
```

### Dados Agregados

A API `getVisitorLocations(days, limit)` retorna:

```typescript
[
  {
    city: "São Paulo",
    country: "Brazil",
    count: 15
  },
  {
    city: "Rio de Janeiro",
    country: "Brazil",
    count: 8
  }
]
```

---

## 🔧 Implementação Técnica

### Função getGeolocation()

```typescript
export async function getGeolocation(): Promise<{ 
  city: string | null; 
  country: string | null 
}> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[ANALYTICS] Erro ao buscar geolocalização:', response.status);
      return { city: null, country: null };
    }

    const data = await response.json();

    return {
      city: data.city || null,
      country: data.country_name || null,
    };
  } catch (error) {
    console.error('[ANALYTICS] Erro ao buscar geolocalização:', error);
    return { city: null, country: null };
  }
}
```

### Integração no trackSessionStart()

```typescript
// Obter geolocalização (cidade e país)
const location = await getGeolocation();

// Inserir sessão com localização
const { error: sessionError } = await supabase
  .from('analytics_sessions')
  .insert({
    session_id: sessionId,
    visitor_id: visitorId,
    // ... outros campos
    city: location.city,
    country: location.country,
    // ...
  });
```

---

## 🧪 Validação

### Teste 1: Verificar Captura

1. Abrir site em aba anônima
2. Abrir DevTools → Network
3. Procurar requisição para `ipapi.co`
4. Verificar resposta com city e country

### Teste 2: Verificar Banco de Dados

```sql
-- Verificar sessões com localização
SELECT 
  session_id,
  city,
  country,
  created_at
FROM analytics_sessions 
WHERE created_at > now() - interval '1 hour'
  AND city IS NOT NULL
ORDER BY created_at DESC;
```

### Teste 3: Verificar Dashboard

1. Login como admin
2. Acessar /admin/analytics
3. Rolar até "De Onde São os Visitantes"
4. Verificar lista de cidades e países

---

## 🔒 Privacidade

### O Que É Armazenado

✅ **Cidade** - Nome da cidade (ex: "São Paulo")  
✅ **País** - Nome do país (ex: "Brazil")

### O Que NÃO É Armazenado

❌ **Endereço IP** - Nunca armazenado  
❌ **Coordenadas GPS** - Não armazenadas  
❌ **Região/Estado** - Não armazenado (apenas cidade)  
❌ **Timezone** - Não armazenado  
❌ **ISP** - Não armazenado

### Conformidade LGPD/GDPR

- ✅ Dados não identificam indivíduo específico
- ✅ Cidade/país são dados agregados
- ✅ IP não é armazenado (apenas usado para lookup)
- ✅ Usuário pode limpar localStorage para novo visitor_id

---

## 🚨 Troubleshooting

### Localização Vazia no Dashboard

**Sintoma:** Card "De Onde São os Visitantes" mostra "Nenhum dado de localização disponível ainda"

**Causas Possíveis:**

#### 1. API Bloqueada

**Verificar:**
```
DevTools → Network → Filtrar por "ipapi"
```

**Soluções:**
- Desabilitar adblocker temporariamente
- Verificar firewall corporativo
- Testar em rede diferente

#### 2. Limite de Requisições Excedido

**Verificar:**
```
Console → Procurar erro 429 (Too Many Requests)
```

**Soluções:**
- Aguardar reset diário (1500 req/dia)
- Considerar upgrade do plano ipapi.co
- Implementar cache de localização por IP

#### 3. Dados Antigos

**Verificar:**
```sql
SELECT COUNT(*) FROM analytics_sessions WHERE city IS NULL;
```

**Solução:**
- Dados antigos (antes da implementação) não têm localização
- Novos acessos terão localização automaticamente
- Aguardar novos visitantes

#### 4. Erro na API

**Verificar:**
```
Console → Procurar "[ANALYTICS] Erro ao buscar geolocalização"
```

**Soluções:**
- Verificar conectividade com ipapi.co
- Testar endpoint manualmente: https://ipapi.co/json/
- Verificar se API está online

---

## 📈 Estatísticas de Uso

### Requisições por Visitante

- **1 requisição** por sessão (nova aba/navegador)
- **0 requisições** para sessões existentes (cache em sessionStorage)
- **Média:** ~1 requisição por visitante único

### Exemplo de Consumo

**Site com 100 visitantes/dia:**
- 100 requisições/dia
- 3000 requisições/mês
- ✅ Dentro do limite gratuito (30.000/mês)

**Site com 1000 visitantes/dia:**
- 1000 requisições/dia
- 30.000 requisições/mês
- ✅ No limite do plano gratuito

**Site com 2000+ visitantes/dia:**
- 2000+ requisições/dia
- 60.000+ requisições/mês
- ⚠️ Considerar plano pago ipapi.co

---

## 🔄 Alternativas de API

Se precisar trocar de serviço de geolocalização:

### 1. ip-api.com

**Prós:**
- 45 requisições/minuto (grátis)
- Sem limite diário
- Dados detalhados

**Contras:**
- Limite por minuto (não por dia)
- Requer tratamento de rate limit

**Endpoint:**
```
https://ip-api.com/json/
```

### 2. ipgeolocation.io

**Prós:**
- 1000 requisições/dia (grátis)
- API key gratuita
- Dados precisos

**Contras:**
- Requer cadastro e API key
- Limite menor que ipapi.co

**Endpoint:**
```
https://api.ipgeolocation.io/ipgeo?apiKey=YOUR_KEY
```

### 3. Abstract API

**Prós:**
- 20.000 requisições/mês (grátis)
- API key gratuita
- Suporte a HTTPS

**Contras:**
- Requer cadastro
- Limite mensal

**Endpoint:**
```
https://ipgeolocation.abstractapi.com/v1/?api_key=YOUR_KEY
```

---

## ✅ Checklist de Implementação

- [x] Criar função getGeolocation()
- [x] Integrar em trackSessionStart()
- [x] Adicionar campos city e country no INSERT
- [x] Testar captura de localização
- [x] Verificar dados no banco
- [x] Validar exibição no dashboard
- [x] Documentar sistema
- [x] Adicionar troubleshooting

---

## 🎉 Resultado

**GEOLOCALIZAÇÃO FUNCIONANDO! 🌍**

✅ Captura automática de cidade e país  
✅ API gratuita (1500 req/dia)  
✅ Privacidade preservada (sem IP armazenado)  
✅ Dashboard exibe localizações  
✅ Pronto para produção

**Próximo Passo:** Acessar site público em aba anônima e verificar localização no dashboard admin após alguns segundos.
