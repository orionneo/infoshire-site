# 🎯 Menu Admin - Estrutura Atualizada

## 📋 Menu Lateral Completo

```
┌─────────────────────────────────────┐
│  🔧 InfoShire Admin                 │
├─────────────────────────────────────┤
│                                     │
│  📊  Dashboard                      │
│  📦  Ordens de Serviço              │
│  👥  Clientes                       │
│  💰  Financeiro                     │
│  📈  Analytics                      │
│  🧠  Base de Conhecimento  ← NOVO! │
│  🛡️  Buscar Garantia               │
│  🛡️  Garantias Ativas              │
│  👤  Usuários                       │
│  📧  Email Marketing                │
│  ⚙️  Config. Email                  │
│  💬  Config. WhatsApp               │
│  📢  Popup Promocional              │
│  ⚙️  Configurações                  │
│                                     │
├─────────────────────────────────────┤
│  👤 Nome do Admin                   │
│  📧 email@exemplo.com               │
│                                     │
│  🏠  Ir para Site                   │
│  🚪  Sair                           │
└─────────────────────────────────────┘
```

## 🧠 Base de Conhecimento - Estrutura Interna

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 Base de Conhecimento IA                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┬─────────────┬─────────────┐              │
│  │ ➕ Adicionar│ 📖 Biblioteca│ 📈 Estatísticas│            │
│  │    Caso     │             │             │              │
│  └─────────────┴─────────────┴─────────────┘              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ABA ATIVA: Adicionar Caso                           │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ✨ Documentar Novo Caso                            │  │
│  │                                                       │  │
│  │  Título *                                            │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Ex: Notebook não liga após queda            │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  Tipo de Equipamento *                               │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Notebook                            ▼       │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  Marca                    Modelo                     │  │
│  │  ┌──────────────────┐   ┌──────────────────┐       │  │
│  │  │ Dell             │   │ Inspiron 15 3000 │       │  │
│  │  └──────────────────┘   └──────────────────┘       │  │
│  │                                                       │  │
│  │  Descrição do Problema *                             │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Cliente derrubou notebook...                │   │  │
│  │  │                                              │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  Descrição da Solução *                              │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Verificado RAM desencaixada...              │   │  │
│  │  │                                              │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  Tags                                                │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ [ram] [não liga] [queda]              +     │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  Dificuldade    Tempo (min)    Custo (R$)          │  │
│  │  ┌─────────┐   ┌─────────┐    ┌─────────┐         │  │
│  │  │ Fácil ▼ │   │ 15      │    │ 0.00    │         │  │
│  │  └─────────┘   └─────────┘    └─────────┘         │  │
│  │                                                       │  │
│  │  Peças Utilizadas                                    │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Nenhuma                                      │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  Notas Adicionais                                    │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Verificar sempre os módulos de RAM...       │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  [ Salvar Caso ]                                     │  │
│  │                                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📖 Biblioteca - Estrutura

```
┌─────────────────────────────────────────────────────────────┐
│  📖 Biblioteca de Casos Documentados                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Buscar                    [Equipamento ▼] [Dificuldade ▼]│
│  ┌────────────────────────┐  ┌──────────┐  ┌──────────┐   │
│  │ não liga...            │  │ Notebook │  │ Todas    │   │
│  └────────────────────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Título          │ Equip.  │ Dif. │ Tempo │ Views │ Ações│
│  ├─────────────────────────────────────────────────────┤  │
│  │ Notebook não    │ Notebook│ 🟢   │ 15min │  👁️ 23│ 👁️✏️🗑️│
│  │ liga após queda │         │      │       │       │      │
│  ├─────────────────────────────────────────────────────┤  │
│  │ Tela azul após  │ Desktop │ 🟡   │ 45min │  👁️ 15│ 👁️✏️🗑️│
│  │ atualização     │         │      │       │       │      │
│  ├─────────────────────────────────────────────────────┤  │
│  │ iPhone não      │ Smartph.│ 🔴   │ 90min │  👁️ 31│ 👁️✏️🗑️│
│  │ carrega bateria │         │      │       │       │      │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Estatísticas - Estrutura

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Estatísticas da Base de Conhecimento                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ 📄 Casos     │ │ 👁️ Views     │ │ 👍 Úteis     │       │
│  │    127       │ │    1,543     │ │    892       │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  ┌──────────────┐                                          │
│  │ ⏱️ Tempo Médio│                                          │
│  │    38 min    │                                          │
│  └──────────────┘                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🏆 Top Contribuidores                               │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  1️⃣  João Silva        42 casos    👍 156          │  │
│  │  2️⃣  Maria Santos      38 casos    👍 142          │  │
│  │  3️⃣  Pedro Costa       31 casos    👍 98           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🤖 Motor de IA                                      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  Eventos: 234  │  Pendentes: 12  │  Termos: 1,892  │  │
│  │                                                       │  │
│  │  ⚙️ Configurações                                    │  │
│  │  ☑️ Auto-aprendizado ativado                        │  │
│  │  ☐ Busca web desativada                             │  │
│  │                                                       │  │
│  │  [ Processar Eventos Pendentes ]                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Fluxo de Navegação

```
Menu Admin
    │
    ├─ Dashboard
    ├─ Ordens de Serviço
    ├─ Clientes
    ├─ Financeiro
    ├─ Analytics
    │
    ├─ 🧠 Base de Conhecimento ← VOCÊ ESTÁ AQUI
    │   │
    │   ├─ ➕ Adicionar Caso
    │   │   ├─ Preencher formulário
    │   │   ├─ Validar campos
    │   │   └─ Salvar → Sucesso!
    │   │
    │   ├─ 📖 Biblioteca
    │   │   ├─ Buscar casos
    │   │   ├─ Filtrar resultados
    │   │   ├─ 👁️ Visualizar detalhes
    │   │   ├─ ✏️ Editar caso
    │   │   ├─ 🗑️ Deletar caso
    │   │   └─ 👍 Marcar como útil
    │   │
    │   └─ 📊 Estatísticas
    │       ├─ Ver métricas gerais
    │       ├─ Ver top contribuidores
    │       ├─ Ver stats do motor IA
    │       └─ Configurar IA
    │
    ├─ Buscar Garantia
    ├─ Garantias Ativas
    └─ ...
```

## 🔑 Atalhos de Teclado (Futuro)

```
Ctrl + K        → Buscar casos
Ctrl + N        → Novo caso
Ctrl + S        → Salvar caso
Esc             → Fechar dialog
Tab             → Navegar campos
Enter           → Confirmar ação
```

## 📱 Versão Mobile

```
┌─────────────────────┐
│ ☰  Base Conhecimento│
├─────────────────────┤
│                     │
│ ┌─────┬─────┬─────┐│
│ │ ➕  │ 📖  │ 📊  ││
│ │Adici│Bibli│Stats││
│ └─────┴─────┴─────┘│
│                     │
│ [Conteúdo da aba]  │
│                     │
│                     │
│                     │
└─────────────────────┘
```

---

**Acesso:** Menu Admin → Base de Conhecimento (6º item)

**URL:** `/admin/ai-knowledge`

**Ícone:** 🧠 Brain
