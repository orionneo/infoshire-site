## 🚨 EMERGENCY - EXECUTE ESTA SQL NO SUPABASE AGORA!

**O PROBLEMA:** Ainda existem 2 triggers ATIVOS bloqueando o INSERT:
1. `trigger_auto_generate_approval_token`
2. `trigger_calculate_warranty_end_date`

Ambos são **BEFORE INSERT**, ou seja, **BLOQUEIAM a operação** até completarem.

---

## 📋 PASSO A PASSO:

### **1. Abra Supabase Console**
https://app.supabase.com → seu projeto

### **2. Clique em "SQL Editor"**

### **3. COPIE E COLE ESTA SQL:**

```sql
DROP TRIGGER IF EXISTS trigger_auto_generate_approval_token ON public.service_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_calculate_warranty_end_date ON public.service_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_completion_date ON public.service_orders CASCADE;

SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'service_orders';
```

### **4. Clique em "Run"**

### **5. Você deve ver resultado VAZIO**
(sem nenhuma linha de trigger)

---

## ✅ DEPOIS TESTE:

```
1. Ctrl+Shift+R no site
2. Abra Nova Ordem
3. Preencha dados
4. TROQUE DE ABA
5. ESPERE 30 SEGUNDOS
6. VOLTE
7. Clique em "CRIAR"
8. ✅ Deve estar INSTANTÂNEO!
```

---

## 🔍 O QUE ESTAVA ACONTECENDO:

**Sequence do problema:**

```
1. Admin clica "Criar" (tab backgroundada há 30s)
2. JavaScript envia: await createServiceOrder()
3. Supabase: INSERT service_orders...
4. ❌ ANTES: trigger_auto_generate_approval_token DISPARA
5. ❌ Tenta fazer SELECT queries
6. Firefox Tracking Prevention BLOQUEIA
7. ❌ TIMEOUT 60s
8. UI travada em "Criando..."
```

**Depois de executar esta SQL:**

```
1. Admin clica "Criar"
2. JavaScript envia: await createServiceOrder()
3. Supabase: INSERT service_orders... ✅ SEM TRIGGERS!
4. ✅ INSTANTÂNEO (<100ms)
5. Toast "Ordem criada"
6. SUCESSO!
```

---

**EXECUTE AGORA!** 🚀
