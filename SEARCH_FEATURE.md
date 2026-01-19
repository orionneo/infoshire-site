# Funcionalidade de Busca - Sistema de Gestão para Assistências Técnicas

## Visão Geral

Foi implementada uma funcionalidade de busca completamente **gratuita** e **livre de serviços pagos** no site público. A busca permite que visitantes pesquisem conteúdo do site de forma rápida e eficiente.

## Características Principais

### ✅ Completamente Gratuita
- Não utiliza nenhum serviço externo pago
- Baseada em consultas diretas ao banco de dados Supabase (já incluído no projeto)
- Sem custos adicionais de API ou serviços de terceiros

### 🎛️ Controle pelo Admin
- Toggle on/off no painel administrativo
- Configuração em tempo real
- Localizado em: **Admin → Configurações do Site → Funcionalidades do Site**

### 🔍 Funcionalidades de Busca
- Busca em tempo real (com debounce de 300ms)
- Pesquisa em todo o conteúdo do site:
  - Nome do site
  - Títulos e subtítulos da página inicial
  - Conteúdo da página "Sobre"
  - Informações de contato (email, telefone, endereço)
  - Outras configurações públicas

### ⌨️ Atalhos de Teclado
- **Ctrl+K** ou **Cmd+K** (Mac): Abre a busca rapidamente
- **ESC**: Fecha o modal de busca

### 📱 Responsivo
- Funciona perfeitamente em desktop e mobile
- Interface adaptada para diferentes tamanhos de tela
- Botão de busca visível tanto no menu desktop quanto mobile

## Arquivos Modificados/Criados

### Novos Arquivos
1. **`/src/components/SearchBar.tsx`**
   - Componente principal da barra de busca
   - Modal de busca com resultados em tempo real
   - Suporte a atalhos de teclado

### Arquivos Modificados
1. **`/src/db/api.ts`**
   - Adicionada função `getSearchEnabled()`: Verifica se a busca está ativada
   - Adicionada função `searchSiteContent()`: Realiza a busca no conteúdo do site

2. **`/src/pages/admin/AdminSiteSettings.tsx`**
   - Adicionado campo `search_enabled` no formulário
   - Novo card "Funcionalidades do Site" com toggle para ativar/desativar busca
   - Salvamento da configuração no banco de dados

3. **`/src/components/layouts/PublicLayout.tsx`**
   - Importação do componente `SearchBar`
   - Verificação da configuração `search_enabled`
   - Exibição condicional da barra de busca (desktop e mobile)

4. **`/vite.config.ts`**
   - Correção de erro de configuração do PWA
   - Aumento do limite de cache para 3MB

### Banco de Dados
1. **Migration: `add_search_settings`**
   - Adiciona configuração `search_enabled` na tabela `site_settings`
   - Valor padrão: `true` (busca ativada)

## Como Usar

### Para Administradores

1. **Ativar/Desativar a Busca:**
   - Acesse: **Painel Admin → Configurações do Site**
   - Role até a seção **"Funcionalidades do Site"**
   - Use o toggle **"Barra de Busca"** para ativar ou desativar
   - Clique em **"Salvar Configurações"**

2. **Efeito Imediato:**
   - Quando desativada: A barra de busca desaparece do site público
   - Quando ativada: A barra de busca aparece no header do site

### Para Visitantes do Site

1. **Abrir a Busca:**
   - Clique no botão "Buscar" no header do site
   - Ou use o atalho **Ctrl+K** (Windows/Linux) ou **Cmd+K** (Mac)

2. **Realizar uma Busca:**
   - Digite o termo que deseja buscar (mínimo 2 caracteres)
   - Os resultados aparecem automaticamente
   - Cada resultado mostra:
     - Tipo (Página, Contato, Informação, etc.)
     - Título
     - Prévia do conteúdo (até 200 caracteres)

3. **Fechar a Busca:**
   - Clique no X no campo de busca
   - Clique fora do modal
   - Pressione **ESC**

## Detalhes Técnicos

### Arquitetura
```
┌─────────────────────────────────────────┐
│         PublicLayout (Header)           │
│  ┌───────────────────────────────────┐  │
│  │  SearchBar Component              │  │
│  │  - Verifica se está ativada       │  │
│  │  - Exibe botão de busca           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Modal de Busca (Dialog)         │
│  ┌───────────────────────────────────┐  │
│  │  Input de busca                   │  │
│  │  - Debounce 300ms                 │  │
│  │  - Mínimo 2 caracteres            │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │  Resultados                       │  │
│  │  - Cards com tipo, título e texto │  │
│  │  - Loading skeleton               │  │
│  │  - Mensagem "sem resultados"      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         API (searchSiteContent)         │
│  - Consulta site_settings               │
│  - Filtra por termo de busca            │
│  - Retorna resultados formatados        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Supabase Database               │
│         Tabela: site_settings           │
└─────────────────────────────────────────┘
```

### Performance
- **Debounce**: 300ms para evitar consultas excessivas
- **Mínimo de caracteres**: 2 (evita buscas muito genéricas)
- **Limite de texto**: 200 caracteres por resultado
- **Cache**: Não utiliza cache (sempre busca dados atualizados)

### Segurança
- Busca apenas em dados públicos (tabela `site_settings`)
- Não expõe dados sensíveis ou privados
- Não permite SQL injection (usa Supabase client com prepared statements)
- Políticas RLS do Supabase aplicadas automaticamente

## Possíveis Expansões Futuras

### Funcionalidades Adicionais (Opcionais)
1. **Busca em Serviços**: Adicionar busca na descrição de serviços oferecidos
2. **Busca em FAQ**: Se houver uma seção de perguntas frequentes
3. **Histórico de Buscas**: Salvar termos mais buscados (analytics)
4. **Sugestões**: Autocompletar baseado em buscas anteriores
5. **Filtros**: Filtrar por tipo de conteúdo (Página, Contato, etc.)

### Melhorias de UX (Opcionais)
1. **Highlight**: Destacar o termo buscado nos resultados
2. **Navegação por Teclado**: Usar setas para navegar entre resultados
3. **Busca Avançada**: Operadores booleanos (AND, OR, NOT)
4. **Busca por Voz**: Integração com Web Speech API (gratuita)

## Troubleshooting

### A busca não aparece no site
1. Verifique se está ativada no Admin → Configurações do Site
2. Limpe o cache do navegador
3. Verifique o console do navegador por erros

### Nenhum resultado é encontrado
1. Verifique se há conteúdo cadastrado em Configurações do Site
2. Tente termos mais genéricos
3. Verifique se o termo tem pelo menos 2 caracteres

### Erro ao buscar
1. Verifique a conexão com o Supabase
2. Verifique as políticas RLS da tabela `site_settings`
3. Verifique os logs do console do navegador

## Conclusão

A funcionalidade de busca foi implementada com sucesso, seguindo os requisitos:
- ✅ Completamente gratuita
- ✅ Sem dependências de serviços pagos
- ✅ Controle total pelo admin (ligar/desligar)
- ✅ Interface moderna e responsiva
- ✅ Performance otimizada
- ✅ Segura e confiável

O sistema está pronto para uso em produção!
