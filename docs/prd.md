# Sistema de Gestão para Assistências Técnicas InfoShire - Documento de Requisitos Atualizado

## 1. Visão Geral do Projeto

### 1.1 Descrição\nSistema completo (website responsivo + aplicação web + aplicativo mobile) voltado para a assistência técnica InfoShire, especializada em eletrônicos, computadores, notebooks, celulares, videogames e equipamentos em geral. O sistema funciona como showcase profissional e plataforma SaaS, moderna, intuitiva e profissional, com foco em transparência, experiência do cliente e produtividade do técnico.

### 1.2 Objetivo Principal
Permitir que o cliente final acompanhe em tempo real o status do reparo do seu equipamento através de website ou aplicativo mobile (iOS/Android), enquanto o técnico/admin gerencia ordens de serviço, comunicação, conteúdo do site, personalização visual e controle financeiro, tudo em um único painel. Demonstrar o diferencial da InfoShire: acompanhamento do reparo em tempo real.\n
### 1.3 Diferencial do Produto
Acompanhamento do reparo em tempo real + comunicação direta com o técnico através de múltiplas plataformas (web e mobile), aumentando confiança, reduzindo ligações e melhorando a experiência do cliente final. Menos ligações, mais transparência e mais confiança.

### 1.4 Identidade Visual
- Logotipo: InfoShire
- Paleta de cores: Preto e verde neon
- Estilo visual: Futurista, tecnológico e de alta qualidade
- Conteúdo institucional alinhado ao site www.infoshire.com.br

## 2. Tipos de Usuários

### 2.1 Cliente Final
- Cadastro e login seguro (web e aplicativo mobile)
- **Cadastro e login através de Google OAuth**
- **Botão Continuar com Google em telas de login e cadastro**
- **Criação automática de usuário se e-mail não existir no sistema**
- **Autenticação direta se e-mail já existir, sem duplicação de registros**
- **Redirecionamento automático para área logada após autenticação bem-sucedida**
- **Compatibilidade total com Safari iOS e navegadores mobile**
- **Logout funcional e seguro**
- Login utilizando número de telefone cadastrado (sem espaços, traços ou parênteses)
- Senha padrão quando cadastrado pelo técnico: 123456
- Obrigatoriedade de alteração de senha no primeiro acesso (apenas para cadastros com e-mail/senha)
- Tela de boas-vindas e redefinição de senha obrigatória após primeiro login (apenas para cadastros com e-mail/senha)
- Acesso às suas ordens de serviço via web ou app\n- Rastreamento de OS sem login através de número da OS ou e-mail
- Botão de retorno ao site principal na página de rastreamento público de OS
- Acompanhamento em tempo real do status do reparo\n- Visualização de histórico de serviços\n- Visualização de histórico de aprovações de orçamento com data, horário, responsável pela aprovação e valores detalhados
- Troca de mensagens com o técnico através do app ou web
- Edição de mensagens enviadas pelo cliente na aba mensagens
- Exclusão de mensagens enviadas pelo cliente na aba mensagens
- Visualização de fotos do equipamento enviadas pelo técnico
- Visualização da foto de entrada do equipamento anexada na criação da OS
- Visualização de fotos de todos os itens adicionais cadastrados na OS
- Notificações push no aplicativo mobile sobre mudanças de status
- Notificações automáticas de mudanças de status
- Visualização de timeline completa com data, horário e responsável por cada mudança de status, incluindo aprovações de orçamento
- Visualização de progresso percentual da OS baseado no status atual
- Visualização completa da OS (somente leitura) incluindo todos os detalhes, histórico e linha do tempo
- Visualização de todos os itens/equipamentos cadastrados na OS (equipamento principal + itens adicionais)
- Visualização de pop-up promocional ao acessar o site com opção de fechar
- Recebimento de mensagem via WhatsApp quando OS entrar em status Aguardando Aprovação
- Recebimento de credenciais de acesso (login e senha padrão) via WhatsApp junto com o orçamento
- Acesso a link direto para aprovação de orçamento via WhatsApp
- Visualização detalhada do orçamento (mão de obra, peças e total)
- Aprovação de orçamento com um clique através do link recebido\n- Recusa de orçamento com um clique através do link recebido
- Visualização do status de aprovação do orçamento dentro da OS
- Visualização do link de aprovação e informações completas do orçamento dentro do chat de mensagens da OS
- Aprovação de orçamento diretamente pelo sistema web ou app através do link disponível no chat\n- Recusa de orçamento diretamente pelo sistema web ou app através do link disponível no chat
- Acesso ao orçamento mesmo se a mensagem do WhatsApp não for recebida ou número estiver incorreto
- Funcionalidade de alteração de senha disponível no perfil do cliente (apenas para cadastros com e-mail/senha)
- Recebimento automático de mensagem via WhatsApp quando OS for finalizada/encerrada
- Recebimento de mensagem automática via WhatsApp quando orçamento não for aprovado informando prazo de retirada do equipamento
- Visualização consolidada de valores financeiros da OS
- Consulta rápida de garantia: buscar por cliente + aparelho (ou número de série/etiqueta) e visualizar todas as OS anteriores com destaque claro para OS em garantia e data de fim de garantia
- Visualização de status de garantia na OS: se equipamento está em garantia, data de conclusão, data de retirada e data de fim de garantia
\n### 2.2 Técnico / Administrador
- Painel administrativo completo\n- Tela de boas-vindas inteligente com resumo de notificações e ações rápidas
- Dashboard de Analytics integrado na mensagem de boas-vindas com indicadores principais
- Criação, edição e gestão de ordens de serviço
- Cadastro rápido de clientes durante a criação de OS (nome e telefone)
- Definição de senha padrão 123456 para clientes cadastrados pelo técnico
- Captura de foto do equipamento no momento da entrada (via celular)
- Funcionalidade de adicionar múltiplos itens/equipamentos dentro da mesma OS
- Registro da data de entrada do equipamento (preenchida automaticamente)
- Sistema automático de estimativa de conclusão\n- Correção de bug de seleção de data\n- Atualização de status do reparo em tempo real
- Novo status: Não Aprovado - Cancelado
- Registro automático de data de conclusão e início da contagem de garantia ao alterar status para Finalizada/Retirada
- Envio automático de mensagem via WhatsApp quando OS for finalizada/encerrada
- Registro automático de data de retirada ao alterar status para Finalizada/Retirada
- Cálculo automático de data de fim de garantia (data de conclusão + 90 dias)
- Marcação automática de emGarantia como true ao finalizar OS
- Marcação automática de retornoGarantia como true quando cliente retornar com equipamento dentro do prazo de garantia
- Busca rápida de garantia\n- Listagem de OS em garantia com filtros\n- Visualização de lista de OS que terão garantia vencendo nos próximos 7 dias
- Recebimento de notificação via Bot do Telegram quando garantia de algum equipamento vencer
- Comunicação direta com o cliente via chat interno (sincronizado entre web e app)
- Edição de mensagens enviadas pelo técnico na aba mensagens
- Exclusão de mensagens enviadas pelo técnico na aba mensagens
- Envio de fotos do equipamento para o cliente\n- Envio de fotos de itens adicionais para o cliente\n- Gerenciamento de clientes\n- Exclusão de clientes cadastrados
- Visualização de página personalizada do cliente
- Personalização do site (conteúdo, páginas, textos, cores e logotipo)
- Controle de usuários e permissões
- Exclusão de usuários administrativos
- Dashboard com indicadores (OS abertas, concluídas, atrasadas, canceladas, etc.)
- Sistema de Analytics completo integrado ao dashboard administrativo
- Gestão de usuários administrativos
- Criação e edição de pop-ups promocionais para exibição no site
- Definição de valores de orçamento ao colocar OS em Aguardando Aprovação
- Detalhamento de custos (mão de obra, peças e total)
- Envio automático de mensagem WhatsApp com link de aprovação e credenciais de acesso ao cliente
- Registro automático do link de aprovação e informações do orçamento no chat de mensagens da OS
- Visualização detalhada do histórico de aprovações dentro da OS com data, horário, responsável e valores\n- Visualização do status de aprovação do orçamento pelo cliente\n- Visualização do status de recusa do orçamento pelo cliente\n- Acompanhamento de orçamentos aprovados/recusados/pendentes dentro da OS
- Recebimento de notificações instantâneas quando cliente aprovar orçamento
- Recebimento de notificações instantâneas quando cliente recusar orçamento
- Acesso ao Dashboard Financeiro Completo\n- Acompanhamento de receita acumulada do mês baseado em aprovações de orçamentos
- Separação de faturamento em mão de obra e peças
- Indicadores financeiros simples e objetivos
- Envio de orçamentos adicionais a qualquer momento durante o processo de reparo
- Possibilidade de enviar múltiplos orçamentos para a mesma OS
- Visualização consolidada de todos os orçamentos enviados e aprovados/recusados por OS
- Funcionalidade de aplicação de desconto em ordens de serviço
- Visualização detalhada de valores financeiros por OS
- Histórico completo de aprovações e recusas com data, horário, responsável e valores detalhados
- Configuração do Bot do Telegram para recebimento de notificações
- Envio de e-mails promocionais para clientes cadastrados
- Configuração de serviço de e-mail transacional gratuito (Resend)
- Envio automático de mensagem via WhatsApp quando OS for finalizada\n- Envio automático de mensagem via WhatsApp quando orçamento não for aprovado\n- Editor de Template de Mensagem de OS Finalizada/Encerrada
- Editor de Template de Mensagem de Orçamento Não Aprovado
- Editor de Template de Mensagem de Orçamento (Envio de Orçamento via WhatsApp)
- Editor de Template de Mensagem de Equipamento Pronto para Retirada
- Sistema de Alertas Inteligente com Navegação Direta e Marcação de Leitura
- Acesso ao Módulo Knowledge Engine (Motor de Conhecimento)\n- Acesso ao Assistente de Abertura de OS com IA
- Acesso ao Diagnóstico Assistido por IA dentro da OS
- Acesso ao Centro de Conhecimento Técnico (funcionalidade completa com dashboard dedicado)
- Configuração de Pesquisa na Web para IA (funcionalidade expandida)
- Transcrição de Áudio para Texto em Português BR (Speech-to-Text) em campos de texto da área administrativa
- Sistema de Coloração e Filtros Visuais para Status de OS
- **Sincronização manual de avaliações do Google através de botão no painel administrativo**
- **Gerenciamento de exibição de avaliações (ocultar/exibir, destacar, ordenar)**
- **Configuração de parâmetros do carrossel de avaliações**
\n## 3. Funcionalidades Principais

### 3.1 Sistema de Cadastro e Login com Google OAuth
\n#### 3.1.1 Visão Geral
\n**Objetivo:**
Implementar autenticação via Google usando Google OAuth, permitindo que clientes criem conta e façam login utilizando suas contas Google existentes de forma rápida, segura e compatível com dispositivos mobile.

**Método de Integração:**
Google OAuth 2.0\n
#### 3.1.2 Fluxo de Cadastro

**Opções de Cadastro:**
\n1. **Cadastro Tradicional (E-mail/Senha):**
   - Campo: Nome completo
   - Campo: E-mail
   - Campo: Telefone
   - Campo: Senha
   - Campo: Confirmar senha
   - Botão: Criar Conta

2. **Cadastro com Google:**
   - Botão: Continuar com Google
   - Ícone do Google + texto\n   - Ao clicar, abre fluxo de autenticação Google OAuth
   - Sistema captura automaticamente: nome, e-mail e foto de perfil
   - Cliente precisa informar telefone em passo posterior (campo adicional após autenticação)
   - Conta criada automaticamente após autorização

**Layout da Página de Cadastro:**

```\n--- Criar Conta ---

[Botão: 🔵 Continuar com Google]

--- ou ---

[Campo: Nome Completo]
[Campo: E-mail]
[Campo: Telefone]
[Campo: Senha]
[Campo: Confirmar Senha]
\n[Botão: Criar Conta]
\nJá possui conta? [Fazer Login]
```

#### 3.1.3 Fluxo de Login

**Opções de Login:**

1. **Login Tradicional:**
   - Campo: E-mail ou Telefone
   - Campo: Senha
   - Checkbox: Lembrar-me
   - Link: Esqueci minha senha
   - Botão: Entrar

2. **Login com Google:**
   - Botão: Continuar com Google
   - Ícone do Google + texto\n   - Login instantâneo com um clique via Google OAuth
   - Sem necessidade de senha
   - Redirecionamento automático para área logada após autenticação

**Layout da Página de Login:**\n
```
--- Entrar ---

[Botão: 🔵 Continuar com Google]

--- ou ---

[Campo: E-mail ou Telefone]
[Campo: Senha]

[Checkbox] Lembrar-me
[Link: Esqueci minha senha]

[Botão: Entrar]
\nNão possui conta? [Criar Conta]
```
\n#### 3.1.4 Integração com Sistema Existente

**Compatibilidade:**
\n1. **Clientes Cadastrados pelo Técnico:**
   - Continuam usando login com telefone + senha padrão (123456)
   - Podem vincular conta Google posteriormente no perfil
   - Opção: Vincular Conta Google disponível em Configurações

2. **Clientes com Cadastro Tradicional:**
   - Podem vincular conta Google posteriormente\n   - Opção: Vincular Conta Google disponível em Configurações
   - Após vinculação, podem usar ambos os métodos de login

3. **Clientes com Cadastro Google:**
   - Se e-mail não existir no sistema: novo usuário criado automaticamente
   - Se e-mail já existir: autenticação direta sem duplicação de registros
   - Podem definir senha posteriormente se desejarem
   - Opção: Definir Senha disponível em Configurações
   - Após definir senha, podem usar ambos os métodos de login

**Banco de Dados:**

Tabela: users (atualizada)\n
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;\nALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email'; -- 'email', 'google', 'phone'\nALTER TABLE users ADD COLUMN profile_picture_url TEXT;
```

#### 3.1.5 Segurança e Privacidade

**Medidas de Segurança:**\n
1. **Validação de E-mail:**
   - E-mails vindos do Google são automaticamente verificados
   - Não é necessário enviar e-mail de confirmação
\n2. **Proteção de Dados:**
   - Sistema solicita apenas permissões essenciais do Google
   - Permissões: perfil básico (nome, e-mail, foto)\n   - Não solicita acesso a outros dados do Google

3. **Desvinculação de Conta:**
   - Cliente pode desvincular conta Google a qualquer momento
   - Opção disponível em Configurações > Segurança
   - Ao desvincular, cliente deve definir senha para continuar acessando

4. **Logout:**
   - Funcionalidade de logout funcional e segura
   - Encerra sessão corretamente\n   - Limpa tokens de autenticação

#### 3.1.6 Experiência do Usuário

**Vantagens para o Cliente:**

1. **Cadastro Rápido:**
   - Apenas um clique para criar conta
   - Não precisa memorizar nova senha
   - Dados preenchidos automaticamente

2. **Login Instantâneo:**
   - Acesso com um clique\n   - Sem necessidade de digitar senha
   - Mais seguro (autenticação Google)
   - Redirecionamento automático para área logada

3. **Sincronização de Foto:**
   - Foto de perfil do Google automaticamente importada
   - Atualizada automaticamente se cliente alterar no Google
\n4. **Compatibilidade Mobile:**
   - Funciona perfeitamente em Safari iOS\n   - Compatível com todos os navegadores mobile
   - Experiência fluida em dispositivos móveis

**Mensagens do Sistema:**

1. **Após Cadastro com Google:**
   - Bem-vindo, [Nome]! Sua conta foi criada com sucesso usando sua conta Google.
\n2. **Após Login com Google:**
   - Olá, [Nome]! Você entrou com sucesso usando sua conta Google.

3. **Vinculação de Conta:**
   - Sua conta Google foi vinculada com sucesso! Agora você pode fazer login usando Google ou e-mail/senha.

#### 3.1.7 Implementação Técnica

**Configuração do Google OAuth:**
\n1. **Criar Projeto no Google Cloud Console:**
   - Acessar Google Cloud Console
   - Criar novo projeto ou selecionar existente
   - Habilitar Google+ API
\n2. **Configurar OAuth Consent Screen:**
   - Tipo de aplicativo: Externo
   - Nome do aplicativo: InfoShire
   - E-mail de suporte\n   - Domínio autorizado\n\n3. **Criar Credenciais OAuth 2.0:**
   - Tipo: ID do cliente OAuth\n   - Tipo de aplicativo: Aplicativo da Web
   - Nome: InfoShire Web Client
   - Origens JavaScript autorizadas: https://seudominio.com\n   - URIs de redirecionamento autorizados: https://seudominio.com/auth/google/callback

**Frontend:**

**Componente GoogleLoginButton.tsx:**

```jsx
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import axios from 'axios';
\nconst GoogleLoginButton = ({ buttonText = 'Continuar com Google', onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
\n  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        \n        // Enviar token para backend
        const response = await axios.post('/api/auth/google', {
          access_token: tokenResponse.access_token\n        });
        
        if (onSuccess) onSuccess(response.data);
        
        // Redirecionar para área logada\n        window.location.href = '/dashboard';
        
      } catch (error) {
        console.error('Erro no login com Google:', error);
        if (onError) onError(error);
      } finally {\n        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Erro no login com Google:', error);
      if (onError) onError(error);
    },
    flow: 'implicit'
  });

  return (
    <button\n      onClick={() => login()}
      disabled={loading}
      className=\"google-login-button\"
    >
      {loading ? (
        <span>Carregando...</span>
      ) : (
        <>\n          <img src=\"/google-icon.svg\" alt=\"Google\" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};

export default GoogleLoginButton;
```

**Configuração do Provider (App.tsx):**
\n```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId=\"SEU_GOOGLE_CLIENT_ID\">
      {/* Resto da aplicação */}
    </GoogleOAuthProvider>
  );\n}

export default App;
```

**Backend:**

**Endpoint de Autenticação Google:**

```javascript\n// POST /api/auth/google
\nconst { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {\n  const { access_token } = req.body;
  \n  try {
    // Verificar token com Google
    const response = await axios.get(\n      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );
    
    const { sub: google_id, email, name, picture } = response.data;\n    
    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)\n      .single();
    
    let user;
    \n    if (existingUser) {
      // Usuário existe - atualizar google_id se necessário
      if (!existingUser.google_id) {
        await supabase
          .from('users')
          .update({
            google_id: google_id,
            profile_picture_url: picture,
            auth_provider: 'google'
          })
          .eq('id', existingUser.id);
      }
      user = existingUser;
    } else {
      // Criar novo usuário
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          email: email,
          name: name,
          profile_picture_url: picture,
          auth_provider: 'google',
          google_id: google_id,
          email_verified: true,
          role: 'client'
        })
        .select()
        .single();
      
      user = newUser;
    }
    \n    // Gerar JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );\n    
    return res.json({
      success: true,
      token: token,
      user: user,
      needsPhone: !user.phone // Indica se precisa completar cadastro
    });
    
  } catch (error) {
    console.error('Erro na autenticação Google:', error);\n    return res.status(500).json({ error: 'Falha na autenticação' });\n  }
};
```

**Endpoint de Logout:**

```javascript\n// POST /api/auth/logout

const logout = async (req, res) => {
  try {
    // Invalidar token (adicionar à blacklist se necessário)
    const token = req.headers.authorization?.split(' ')[1];
    \n    if (token) {\n      // Adicionar token à blacklist no Redis ou banco de dados
      await addToBlacklist(token);
    }
    
    return res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao realizar logout' });
  }\n};
```
\n#### 3.1.8 Compatibilidade Mobile

**Safari iOS:**

1. **Configurações Específicas:**
   - Suporte a redirect URLs com deep linking
   - Tratamento de popups bloqueados
   - Fallback para redirect flow em vez de popup

2. **Testes Necessários:**
   - Login em Safari iOS (iPhone/iPad)
   - Login em Chrome iOS
   - Login em navegadores in-app (Instagram, Facebook)

**Android:**

1. **Configurações Específicas:**\n   - Suporte a Chrome Custom Tabs
   - Tratamento de intent URLs
\n2. **Testes Necessários:**
   - Login em Chrome Android
   - Login em navegadores alternativos

#### 3.1.9 Critérios de Aceite

**Funcionalidade:**
- ✓ Botão Continuar com Google presente em /login e /cadastro
- ✓ Ao autenticar com Google, se e-mail não existir, criar usuário e perfil de cliente
- ✓ Ao autenticar com Google, se e-mail existir, autenticar e logar
- ✓ Salvar no perfil: nome (Google), e-mail; telefone solicitado em passo posterior
- ✓ Não criar contas duplicadas
- ✓ Funcionar em mobile (Safari iOS)
- ✓ Redirect correto pós-login para área logada
- ✓ Logout funcional e seguro

**Segurança:**
- ✓ Tokens validados corretamente
- ✓ Sessões gerenciadas de forma segura
- ✓ Logout limpa tokens e encerra sessão
\n**Usabilidade:**
- ✓ Processo de login rápido e intuitivo
- ✓ Mensagens de erro claras\n- ✓ Compatibilidade com todos os navegadores\n\n### 3.2 Carrossel de Avaliações Reais do Google

#### 3.2.1 Visão Geral

**Objetivo:**
Exibir avaliações reais de clientes da InfoShire diretamente do Google Maps no carrossel de depoimentos do site, aumentando credibilidade e confiança dos visitantes.

**Fonte de Dados:**
Google Maps Place ID: ChIJO8Y3b_BsrpQRy0IB0qC8ZuA

**Requisitos Principais:**
- Buscar nota média e total de avaliações do Google\n- Buscar reviews reais (nome, foto, texto, nota)
- Cachear reviews no backend por 12 horas para reduzir custo e latência
- Carrossel com avaliações reais\n- Não usar depoimentos manuais ou fake\n
#### 3.2.2 Integração com Google Places API

**API Utilizada:**
Google Places API - Place Details

**Dados Capturados:**
\n1. **Para Cada Avaliação:**
   - Nome do autor
   - Foto de perfil do autor
   - Classificação (estrelas de 1 a 5)
   - Texto da avaliação
   - Data da avaliação
   - Link para perfil do Google do autor

2. **Informações Gerais:**
   - Classificação média da InfoShire (rating)
   - Número total de avaliações (user_ratings_total)
   - Link para página do Google Maps

**Limitação da API:**
- A API retorna no máximo 5 avaliações por requisição\n- Sistema deve trabalhar com esse limite e exibir as avaliações disponíveis

#### 3.2.3 Sistema de Cache no Backend

**Estratégia de Cache:**
\n1. **Armazenamento:**
   - Reviews armazenados em cache no backend (Redis ou memória)
   - Informações gerais (rating, total) também em cache
   - Timestamp de última sincronização

2. **Atualização:**
   - Cache válido por 12 horas\n   - Após expiração, nova requisição à API do Google\n   - Sincronização manual através do painel administrativo

3. **Vantagens:**
   - Reduz chamadas à API do Google (economia de custos)
   - Melhora performance do site (carregamento mais rápido)
   - Garante disponibilidade mesmo se API do Google estiver temporariamente indisponível

#### 3.2.4 Layout do Carrossel

**Localização:**
Página inicial do site (seção Depoimentos)

**Estrutura do Carrossel:**
\n```\n--- O Que Nossos Clientes Dizem ---

[Classificação Geral: ⭐⭐⭐⭐⭐ 4.9 (127 avaliações)]
[Link: Ver todas as avaliações no Google]

[Card de Avaliação 1]
┌─────────────────────────────────────┐
│ [Foto]  João Silva                  │
│         ⭐⭐⭐⭐⭐                    │
│                                     │
│ Excelente atendimento! Meu notebook │
│ foi consertado rapidamente e o      │
│ acompanhamento em tempo real foi    │
│ muito útil. Recomendo!              │
│                                     │
│ Há 2 semanas                        │
└─────────────────────────────────────┘
\n[Card de Avaliação 2]
[Card de Avaliação 3]\n...
\n[Indicadores: ● ○ ○ ○ ○]\n```

**Elementos do Card:**
\n1. **Cabeçalho:**
   - Foto de perfil do autor (circular)
   - Nome do autor\n   - Classificação em estrelas
\n2. **Corpo:**
   - Texto da avaliação (máximo 200 caracteres)
   - Botão Ler mais (se texto exceder limite)
\n3. **Rodapé:**
   - Data relativa (Há X dias/semanas/meses)
   - Ícone do Google\n\n#### 3.2.5 Funcionalidades do Carrossel

**Exibição:**

1. **Configuração:**
   - Exibir até 5 avaliações (limite da API)
   - Layout responsivo
   - Animações suaves

2. **Comportamento:**
   - Navegação manual através de indicadores
   - Swipe em dispositivos touch
   - Teclado (setas esquerda/direita)
\n**Atualização de Dados:**

1. **Frequência:**
   - Cache válido por 12 horas
   - Atualização automática após expiração do cache
   - Botão manual de sincronização no painel admin

2. **Cache:**
   - Avaliações armazenadas em cache no backend
   - Reduz chamadas à API do Google
   - Melhora performance do site

#### 3.2.6 Implementação Técnica

**Backend:**

**Endpoint de Sincronização:**

```javascript
// GET /api/reviews/google\n
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 43200 }); // 12 horas\n
const getGoogleReviews = async (req, res) => {
  const placeId = 'ChIJO8Y3b_BsrpQRy0IB0qC8ZuA';
  const cacheKey = 'google_reviews';
  
  try {
    // Verificar cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);\n    }
    
    // Buscar detalhes do lugar incluindo avaliações
    const response = await client.placeDetails({\n      params: {
        place_id: placeId,
        fields: ['name', 'rating', 'user_ratings_total', 'reviews'],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    \n    const placeData = response.data.result;
    const reviews = placeData.reviews || [];
    
    const data = {
      rating: placeData.rating,\n      total_reviews: placeData.user_ratings_total,
      reviews: reviews.map(review => ({
        author_name: review.author_name,
        author_photo: review.profile_photo_url,
        rating: review.rating,
        text: review.text,\n        time: new Date(review.time * 1000).toISOString(),
        author_url: review.author_url
      })),
      last_sync: new Date().toISOString()
    };\n    
    // Salvar no cache
    cache.set(cacheKey, data);
    
    return res.json(data);
    
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return res.status(500).json({ error: 'Falha ao buscar avaliações' });
  }
};
```

**Endpoint de Sincronização Manual (Admin):**

```javascript
// POST /api/admin/reviews/sync

const syncGoogleReviews = async (req, res) => {
  const placeId = 'ChIJO8Y3b_BsrpQRy0IB0qC8ZuA';
  const cacheKey = 'google_reviews';
  
  try {
    // Limpar cache\n    cache.del(cacheKey);
    
    // Buscar novos dados
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'rating', 'user_ratings_total', 'reviews'],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    const placeData = response.data.result;
    const reviews = placeData.reviews || [];
    
    const data = {\n      rating: placeData.rating,
      total_reviews: placeData.user_ratings_total,
      reviews: reviews.map(review => ({\n        author_name: review.author_name,
        author_photo: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        time: new Date(review.time * 1000).toISOString(),
        author_url: review.author_url
      })),
      last_sync: new Date().toISOString()
    };
    
    // Salvar no cache
    cache.set(cacheKey, data);\n    
    return res.json({\n      success: true,
      reviews_synced: reviews.length,
      rating: placeData.rating,\n      total_reviews: placeData.user_ratings_total\n    });
    
  } catch (error) {\n    return res.status(500).json({ error: 'Falha ao sincronizar avaliações' });
  }
};
```

**Frontend:**

**Componente ReviewsCarousel.tsx:**

```jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ReviewsCarousel = () => {
  const [reviewsData, setReviewsData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
\n  useEffect(() => {\n    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews/google');
      const data = await response.json();
      setReviewsData(data);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }
  };

  const renderStars = (rating) => {\n    return '⭐'.repeat(rating);
  };
\n  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);\n    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
    return `Há ${Math.floor(diffDays / 30)} meses`;
  };

  if (!reviewsData) return null;

  return (\n    <section className=\"reviews-section\">
      <h2>O Que Nossos Clientes Dizem</h2>
      \n      <div className=\"business-rating\">
        <span className=\"stars\">{renderStars(Math.round(reviewsData.rating))}</span>
        <span className=\"rating\">{reviewsData.rating}</span>
        <span className=\"count\">({reviewsData.total_reviews} avaliações)</span>\n        <a \n          href=\"https://www.google.com/maps/place/?q=place_id:ChIJO8Y3b_BsrpQRy0IB0qC8ZuA\" 
          target=\"_blank\" 
          rel=\"noopener noreferrer\"
        >
          Ver todas as avaliações no Google\n        </a>
      </div>

      <div className=\"carousel-container\">
        <div className=\"reviews-track\">
          {reviewsData.reviews.map((review, idx) => (
            <motion.div
              key={idx}
              className=\"review-card\"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className=\"review-header\">
                <img 
                  src={review.author_photo} 
                  alt={review.author_name} 
                  className=\"author-photo\" 
                />
                <div className=\"author-info\">\n                  <h4>{review.author_name}</h4>\n                  <div className=\"rating\">{renderStars(review.rating)}</div>
                </div>
              </div>\n              <div className=\"review-body\">\n                <p>\n                  {review.text.length > 200 \n                    ? `${review.text.substring(0, 200)}...` 
                    : review.text}
                </p>
                {review.text.length > 200 && (
                  <a 
                    href={review.author_url} 
                    target=\"_blank\" 
                    rel=\"noopener noreferrer\"
                  >\n                    Ler mais\n                  </a>
                )}
              </div>
              <div className=\"review-footer\">
                <span className=\"date\">{formatDate(review.time)}</span>
                <img src=\"/google-icon.svg\" alt=\"Google\" className=\"google-icon\" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className=\"carousel-indicators\">
          {reviewsData.reviews.map((_, idx) => (\n            <button
              key={idx}
              className={idx === currentIndex ? 'active' : ''}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir para review ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsCarousel;
```

**Estilos CSS:**

```css\n.reviews-section {
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  color: #ffffff;
}

.reviews-section h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #00ff00;
}

.business-rating {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 1.2rem;
}\n
.business-rating .stars {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.business-rating .rating {
  font-weight: bold;
  color: #00ff00;
  margin-right: 0.5rem;
}

.business-rating a {
  color: #00ff00;
  text-decoration: none;
  margin-left: 1rem;
  transition: opacity 0.3s;
}\n
.business-rating a:hover {
  opacity: 0.8;
}

.carousel-container {\n  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
}

.reviews-track {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.review-card {\n  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 12px;
  padding: 2rem;
  min-width: 350px;
  max-width: 350px;
  box-shadow: 0 4px 20px rgba(0, 255, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.review-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 255, 0, 0.2);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
\n.author-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #00ff00;
}\n
.author-info h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #ffffff;
}

.author-info .rating {
  font-size: 1rem;
  margin-top: 0.25rem;
}\n
.review-body {
  margin: 1.5rem 0;
  line-height: 1.6;\n  color: rgba(255, 255, 255, 0.9);
}

.review-body a {
  color: #00ff00;
  text-decoration: none;
  font-size: 0.9rem;
}\n
.review-footer {
  display: flex;\n  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;\n  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.review-footer .date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.review-footer .google-icon {\n  width: 20px;\n  height: 20px;\n}\n
.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.carousel-indicators button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 0, 0.5);
  background: transparent;
  cursor: pointer;
  transition: all 0.3s;
}\n
.carousel-indicators button.active {
  background: #00ff00;
  transform: scale(1.2);\n}

.carousel-indicators button:hover {
  border-color: #00ff00;\n}

@media (max-width: 1024px) {
  .reviews-track {
    flex-direction: column;
    align-items: center;
  }
  
  .review-card {
    min-width: 100%;
    max-width: 500px;
  }
}\n\n@media (max-width: 768px) {
  .reviews-section h2 {
    font-size: 2rem;
  }
  
  .review-card {
    padding: 1.5rem;
  }
}\n```

#### 3.2.7 Painel Administrativo

**Funcionalidades Admin:**

1. **Sincronização Manual:**
   - Botão: Sincronizar Avaliações do Google
   - Exibe última data de sincronização
   - Mostra número de avaliações sincronizadas
   - Indicador de status (sincronizando/concluído/erro)

2. **Gerenciamento de Exibição:**
   - Ocultar/exibir avaliações específicas
   - Destacar avaliações favoritas
   - Definir ordem de exibição
\n3. **Configurações do Carrossel:**
   - Número de avaliações exibidas\n   - Filtro padrão de exibição
\n**Layout do Painel:**

```\n--- Gerenciar Avaliações do Google ---

Última Sincronização: 18/01/2026 às 21:10
Total de Avaliações: 127
Classificação Média: 4.9 ⭐

[Botão: 🔄 Sincronizar Agora]

--- Lista de Avaliações ---

[Tabela]\n| Autor         | Classificação | Data       | Exibir | Ações     |
|---------------|---------------|------------|--------|----------|
| João Silva    | ⭐⭐⭐⭐⭐    | 16/01/2026 | ✓      | [Editar] |
| Maria Santos  | ⭐⭐⭐⭐      | 14/01/2026 | ✓      | [Editar] |
| Pedro Costa   | ⭐⭐⭐⭐⭐    | 12/01/2026 | ✓      | [Editar] |\n...
\n--- Configurações do Carrossel ---
\n[Campo: Número de avaliações exibidas] 5
[Dropdown: Filtro padrão] Todas as avaliações
\n[Botão: Salvar Configurações]
```\n
#### 3.2.8 Responsividade

**Desktop (> 1024px):**
- Múltiplos cards visíveis simultaneamente
- Layout em grid\n- Indicadores de navegação
\n**Tablet (768px - 1024px):**
- 2 cards visíveis simultaneamente
- Layout em grid
- Indicadores de navegação

**Mobile (< 768px):**
- 1 card visível por vez
- Layout em coluna
- Swipe para navegação manual
- Indicadores de navegação

#### 3.2.9 Critérios de Aceite

**Funcionalidade:**
- ✓ Exibir nota média do Google
- ✓ Exibir total de avaliações do Google
- ✓ Exibir carrossel com avaliações reais
- ✓ Cachear resposta no backend por 12 horas
- ✓ Reduzir custo e latência através do cache
- ✓ Sincronização manual através do painel admin
- ✓ Gerenciamento de exibição de avaliações
- ✓ Configuração de parâmetros do carrossel

**Performance:**
- ✓ Carregamento rápido (< 2 segundos)
- ✓ Sem chamadas diretas constantes à API do Google
- ✓ Cache eficiente\n\n**Usabilidade:**
- ✓ Navegação manual opcional
- ✓ Responsivo em todos os dispositivos
- ✓ Link para página do Google Maps
\n### 3.3 Sistema de Ordens de Serviço (OS)

(Conteúdo mantido conforme documento original)

### 3.4 Sistema de Coloração e Filtros Visuais para Status de OS

(Conteúdo mantido conforme documento original)

### 3.5 Sistema de Rastreamento de OS sem Login

(Conteúdo mantido conforme documento original)

### 3.6 Histórico de Aprovações de Orçamento

(Conteúdo mantido conforme documento original)

### 3.7 Página Personalizada do Cliente

(Conteúdo mantido conforme documento original)

### 3.8 Sistema de Mensagens e Compartilhamento de Fotos

(Conteúdo mantido conforme documento original)

### 3.9 Painel Administrativo (CMS + Gestão)\n
(Conteúdo mantido conforme documento original)\n
## 4. Sistema de Garantia Integrado

(Conteúdo mantido conforme documento original)

## 5. Observação Final

O sistema foi atualizado para incluir:
\n1. **Sistema de Cadastro e Login com Google OAuth:**
   - Cadastro rápido com um clique usando conta Google
   - Login instantâneo sem necessidade de senha
   - Sincronização automática de nome, e-mail e foto de perfil
   - Verificação automática de e-mail existente (sem duplicação)
   - Redirecionamento automático para área logada
   - Compatibilidade total com Safari iOS e navegadores mobile
   - Logout funcional e seguro
   - Compatibilidade com sistema de cadastro tradicional
   - Opção de vincular conta Google a cadastros existentes
   - Maior segurança e conveniência para os clientes

2. **Carrossel de Avaliações Reais do Google:**
   - Integração com Google Places API para exibir avaliações reais
   - Sistema de cache no backend (válido por 12 horas)\n   - Exibição de até 5 avaliações (limite da API)
   - Exibição de classificação média e número total de avaliações
   - Link direto para página do Google Maps
   - Painel administrativo para sincronização manual e configurações
   - Gerenciamento de exibição de avaliações
   - Aumento de credibilidade e confiança dos visitantes
   - Não usa depoimentos manuais ou fake\n
3. **Funcionalidades Anteriores Mantidas:**
   - Sistema de Coloração e Filtros Visuais para Status de OS
   - Histórico Completo de Aprovações de Orçamento
   - Botão de Retorno ao Site na Página de Rastreamento Público
   - Todas as demais funcionalidades do sistema

Todas as funcionalidades foram integradas de forma harmoniosa, garantindo uma experiência completa, moderna e altamente produtiva para técnicos, administradores e clientes.