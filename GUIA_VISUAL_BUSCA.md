# 🔍 Guia Visual - Funcionalidade de Busca

## 📍 Localização da Busca no Site

### Desktop (Tela Grande)
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]  [Início] [Serviços] [Sobre] [Contato]  [🔍 Buscar...]  [Entrar] [Cadastrar]  │
└─────────────────────────────────────────────────────────────────────┘
                                                      ↑
                                            Barra de Busca aqui!
```

### Mobile (Tela Pequena)
```
┌──────────────────────────────────────┐
│  [Logo]  [🔍] [🏠] [💼] [ℹ️] [✉️] [🔐]  │
└──────────────────────────────────────┘
           ↑
    Botão de Busca
```

## 🎯 Como Ativar/Desativar

### Painel Administrativo

```
Admin → Configurações do Site
│
├── Informações Gerais
│   └── Nome do Site
│
├── ⭐ Funcionalidades do Site  ← AQUI!
│   └── [Toggle] Barra de Busca
│       └── "Exibir barra de busca no site público"
│
├── Página Inicial
│   └── Título Principal
│   └── Subtítulo
│
└── [Salvar Configurações]
```

## 💡 Modal de Busca

Quando o usuário clica no botão de busca, aparece:

```
┌────────────────────────────────────────────────┐
│  Buscar no site                           [X]  │
├────────────────────────────────────────────────┤
│  🔍 [Digite para buscar...]                    │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ [Página] Página Inicial                  │ │
│  │ Assistência Técnica Especializada...     │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ [Contato] E-mail de Contato              │ │
│  │ contato@techfix.com                      │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ [Página] Sobre Nós                       │ │
│  │ Conte a história da sua empresa...       │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
└────────────────────────────────────────────────┘

Dica: Pressione Ctrl+K para abrir rapidamente
```

## ⚙️ Estados da Busca

### 1. Busca Ativada (Toggle ON)
- ✅ Botão de busca visível no header
- ✅ Usuários podem pesquisar
- ✅ Atalho Ctrl+K funciona

### 2. Busca Desativada (Toggle OFF)
- ❌ Botão de busca não aparece
- ❌ Usuários não podem pesquisar
- ❌ Atalho Ctrl+K não funciona

## 🎨 Exemplo de Uso

### Cenário 1: Buscar Informações de Contato
```
1. Usuário clica em "Buscar" ou pressiona Ctrl+K
2. Digite: "telefone"
3. Resultado:
   ┌──────────────────────────────────┐
   │ [Contato] Telefone de Contato    │
   │ (11) 99999-9999                  │
   └──────────────────────────────────┘
```

### Cenário 2: Buscar Sobre a Empresa
```
1. Usuário clica em "Buscar"
2. Digite: "experiência"
3. Resultado:
   ┌──────────────────────────────────┐
   │ [Página] Sobre Nós               │
   │ Mais de 24 anos de experiência...│
   └──────────────────────────────────┘
```

### Cenário 3: Nenhum Resultado
```
1. Usuário clica em "Buscar"
2. Digite: "xyz123"
3. Resultado:
   ┌──────────────────────────────────┐
   │  🔍                              │
   │  Nenhum resultado encontrado     │
   │  para "xyz123"                   │
   └──────────────────────────────────┘
```

## 🚀 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+K` (Windows/Linux) | Abrir busca |
| `Cmd+K` (Mac) | Abrir busca |
| `ESC` | Fechar busca |
| `Ctrl+X` | Limpar campo de busca |

## 📊 Tipos de Resultados

A busca categoriza os resultados em:

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| 🏠 **Página** | Conteúdo de páginas | Página Inicial, Sobre Nós |
| 📧 **Contato** | Informações de contato | Email, Telefone, Endereço |
| ℹ️ **Informação** | Dados gerais | Nome do Site |

## 🎯 Dicas de Uso

### Para Administradores
1. ✅ Mantenha o conteúdo do site atualizado para melhores resultados
2. ✅ Use descrições claras e objetivas nas configurações
3. ✅ Teste a busca após atualizar conteúdo
4. ✅ Desative temporariamente se estiver fazendo grandes mudanças

### Para Usuários
1. ✅ Use palavras-chave específicas
2. ✅ Tente variações se não encontrar
3. ✅ Use o atalho Ctrl+K para rapidez
4. ✅ Mínimo 2 caracteres para buscar

## 🔧 Solução de Problemas

### Problema: Busca não aparece
**Solução:** Verifique se está ativada em Admin → Configurações do Site

### Problema: Nenhum resultado
**Solução:** Verifique se há conteúdo cadastrado nas configurações

### Problema: Busca lenta
**Solução:** Normal - aguarde 300ms após digitar (debounce)

---

**Sistema pronto para uso! 🎉**
