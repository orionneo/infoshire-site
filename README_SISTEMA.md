# Sistema de Gestão para Assistências Técnicas - TechFix

## 🚀 Credenciais de Acesso Padrão

### Usuário Administrador Padrão
Para criar o usuário administrador padrão, você tem duas opções:

#### Opção 1: Registro Manual (Recomendado)
1. Acesse a página de registro: `/register`
2. Crie uma conta com qualquer usuário e senha
3. **O primeiro usuário registrado automaticamente se torna administrador**

#### Opção 2: Usar Credenciais Pré-configuradas
Se você executar a função de criação do admin, as credenciais serão:
- **Usuário**: `admin`
- **Senha**: `admin123`

**⚠️ IMPORTANTE**: Altere a senha padrão após o primeiro acesso!

## 📋 Funcionalidades

### Para Clientes
- ✅ Visualizar suas ordens de serviço
- ✅ Acompanhar status em tempo real
- ✅ Ver histórico completo de atualizações
- ✅ Conversar com técnicos via chat
- ✅ Enviar fotos do equipamento
- ✅ Gerenciar perfil pessoal

### Para Administradores
- ✅ Dashboard com métricas e estatísticas
- ✅ Criar e gerenciar ordens de serviço
- ✅ Atualizar status das ordens
- ✅ Conversar com clientes via chat
- ✅ Gerenciar clientes
- ✅ Gerenciar usuários e permissões
- ✅ Personalizar conteúdo do site
- ✅ Configurar informações de contato

## 🎨 Design

O sistema utiliza um esquema de cores profissional em azul tecnológico:
- Interface moderna e limpa
- Totalmente responsivo (desktop e mobile)
- Modo claro e escuro
- Componentes shadcn/ui

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **profiles**: Usuários do sistema (clientes e admins)
- **service_orders**: Ordens de serviço
- **order_status_history**: Histórico de mudanças de status
- **messages**: Sistema de chat por ordem
- **site_settings**: Configurações personalizáveis do site

### Status de Ordens
1. **Recebido**: Ordem criada
2. **Em Análise**: Técnico analisando o problema
3. **Aguardando Aprovação**: Aguardando aprovação do cliente
4. **Em Reparo**: Reparo em andamento
5. **Aguardando Peças**: Aguardando chegada de peças
6. **Finalizado**: Reparo concluído
7. **Pronto para Retirada**: Equipamento pronto

## 🔐 Sistema de Permissões

### Cliente (client)
- Acesso apenas às próprias ordens
- Pode visualizar histórico e conversar
- Não pode criar ou editar ordens

### Administrador (admin)
- Acesso total ao sistema
- Gerencia todas as ordens
- Gerencia usuários e permissões
- Personaliza o site

## 📱 Upload de Imagens

O sistema suporta upload de imagens no chat com:
- Compressão automática para max 1MB
- Conversão para formato WEBP
- Redimensionamento para 1080p
- Validação de tipo de arquivo

## 🌐 Páginas Públicas

- **Home**: Página inicial com apresentação
- **Serviços**: Lista de serviços oferecidos
- **Sobre**: Informações sobre a empresa
- **Contato**: Formulário e informações de contato

## 🔧 Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Formulários**: React Hook Form
- **Datas**: date-fns
- **Roteamento**: React Router

## 📝 Primeiros Passos

1. **Criar Primeiro Usuário Admin**
   - Acesse `/register`
   - Crie sua conta
   - Você será automaticamente admin (primeiro usuário)

2. **Configurar o Site**
   - Acesse `/admin/settings`
   - Personalize textos, contatos e informações

3. **Criar Ordens de Serviço**
   - Acesse `/admin/orders`
   - Clique em "Nova Ordem"
   - Preencha os dados do cliente e equipamento

4. **Gerenciar Usuários**
   - Acesse `/admin/users`
   - Altere permissões conforme necessário

## 🎯 Fluxo de Trabalho Típico

1. Cliente se cadastra no sistema
2. Admin cria ordem de serviço para o cliente
3. Admin atualiza status conforme progresso
4. Cliente acompanha em tempo real
5. Ambos podem trocar mensagens
6. Admin marca como concluído
7. Cliente é notificado para retirada

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) ativado
- Clientes só veem seus próprios dados
- Admins têm acesso controlado via helper functions
- Senhas criptografadas
- Validação de entrada em todos os formulários

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique a documentação do código
- Consulte os comentários inline
- Revise as políticas RLS no Supabase

---

**Desenvolvido com ❤️ para assistências técnicas modernas**
