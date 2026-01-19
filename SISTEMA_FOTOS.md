# 📸 Sistema de Fotos do Equipamento

## ✅ Funcionalidade Implementada

Sistema completo para técnicos enviarem fotos dos equipamentos e clientes visualizarem, criando transparência excepcional no processo de reparo.

---

## 🎯 Visão Geral

### O Que Foi Implementado

1. **Upload de Fotos (Técnico/Admin)**
   - Interface para enviar fotos do equipamento
   - Compressão automática de imagens
   - Descrição opcional para cada foto
   - Pré-visualização antes do envio

2. **Galeria de Fotos (Cliente e Técnico)**
   - Visualização em grid responsivo
   - Zoom para ver foto em tamanho completo
   - Informações de quem enviou e quando
   - Descrição de cada foto

3. **Gerenciamento (Técnico/Admin)**
   - Exclusão de fotos
   - Histórico completo de uploads
   - Organização por ordem de serviço

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `order_images`

```sql
CREATE TABLE order_images (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES service_orders(id),
  image_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único da imagem
- `order_id`: Referência à ordem de serviço
- `image_url`: URL pública da imagem no storage
- `description`: Descrição opcional (ex: "Vista frontal", "Defeito identificado")
- `uploaded_by`: Quem enviou a foto (técnico)
- `created_at`: Data e hora do upload

### Storage Bucket

**Nome**: `app-8pj0bpgfx6v5_order_images`
**Tipo**: Privado (acesso controlado por RLS)

---

## 🔒 Segurança e Permissões

### Políticas RLS (Row Level Security)

#### Tabela `order_images`

1. **Admins têm acesso total**
   ```sql
   Admins can do everything (INSERT, SELECT, UPDATE, DELETE)
   ```

2. **Clientes podem visualizar fotos de suas ordens**
   ```sql
   Clients can SELECT images from their own orders
   ```

#### Storage Bucket

1. **Admins podem fazer upload**
   ```sql
   Admins can INSERT images
   ```

2. **Admins podem excluir**
   ```sql
   Admins can DELETE images
   ```

3. **Usuários autenticados podem visualizar**
   ```sql
   Authenticated users can SELECT images from their orders
   ```

---

## 📱 Interface do Usuário

### Para Técnicos/Admins

#### Aba "Fotos" na Ordem de Serviço

**Localização**: Admin → Ordens → Detalhes da Ordem → Aba "Fotos"

**Funcionalidades:**

1. **Seção de Upload**
   - Botão "Selecionar Foto"
   - Pré-visualização da imagem
   - Campo de descrição (opcional)
   - Botão "Enviar Foto"
   - Indicador de progresso durante upload

2. **Galeria de Fotos**
   - Grid 2x3 (mobile: 2 colunas, desktop: 3 colunas)
   - Hover mostra ícone de zoom
   - Botão de exclusão (X) no canto superior direito
   - Descrição abaixo de cada foto

3. **Visualização em Tamanho Completo**
   - Clique na foto abre modal
   - Imagem em alta resolução
   - Descrição completa
   - Informações de quem enviou e quando

### Para Clientes

#### Aba "Fotos" na Ordem de Serviço

**Localização**: Cliente → Minhas Ordens → Detalhes da Ordem → Aba "Fotos"

**Funcionalidades:**

1. **Galeria de Fotos (Somente Visualização)**
   - Grid responsivo
   - Clique para ampliar
   - Descrição de cada foto
   - Informações de data e hora

2. **Visualização em Tamanho Completo**
   - Modal com imagem ampliada
   - Descrição detalhada
   - Informações do técnico que enviou

---

## 🖼️ Compressão Automática de Imagens

### Processo de Compressão

1. **Verificação de Tamanho**
   - Se arquivo < 1MB: Envia sem compressão
   - Se arquivo > 1MB: Aplica compressão

2. **Redimensionamento**
   - Máximo: 1920x1080 (Full HD)
   - Mantém proporção original
   - Reduz apenas se necessário

3. **Conversão para WebP**
   - Formato moderno e eficiente
   - Qualidade: 80%
   - Reduz tamanho em até 70%

4. **Validações**
   - Tamanho máximo antes da compressão: 5MB
   - Formatos aceitos: JPG, PNG, WEBP, GIF
   - Apenas arquivos de imagem

### Benefícios

- ✅ Economia de espaço de armazenamento
- ✅ Carregamento mais rápido
- ✅ Melhor experiência do usuário
- ✅ Redução de custos de storage

---

## 🔧 API Functions

### `uploadOrderImage(orderId, file, description?)`

**Descrição**: Faz upload de uma foto do equipamento

**Parâmetros:**
- `orderId` (string): ID da ordem de serviço
- `file` (File): Arquivo de imagem
- `description` (string, opcional): Descrição da foto

**Retorno:**
```typescript
{
  image_url: string;  // URL pública da imagem
  id: string;         // ID do registro no banco
}
```

**Processo:**
1. Comprime a imagem (se necessário)
2. Gera nome único: `{orderId}_{timestamp}.{ext}`
3. Faz upload para o storage bucket
4. Salva registro no banco de dados
5. Retorna URL e ID

### `getOrderImages(orderId)`

**Descrição**: Busca todas as fotos de uma ordem

**Parâmetros:**
- `orderId` (string): ID da ordem de serviço

**Retorno:**
```typescript
OrderImageWithUploader[] // Array de imagens com dados do uploader
```

**Dados Retornados:**
```typescript
{
  id: string;
  order_id: string;
  image_url: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  uploader: {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}
```

### `deleteOrderImage(imageId)`

**Descrição**: Exclui uma foto (admin apenas)

**Parâmetros:**
- `imageId` (string): ID da imagem

**Processo:**
1. Busca dados da imagem no banco
2. Extrai nome do arquivo da URL
3. Exclui arquivo do storage
4. Exclui registro do banco de dados

---

## 🎨 Componente: OrderImageGallery

### Props

```typescript
interface OrderImageGalleryProps {
  orderId: string;      // ID da ordem de serviço
  isAdmin?: boolean;    // Se é admin (mostra upload e delete)
}
```

### Uso

**Admin:**
```tsx
<OrderImageGallery orderId={order.id} isAdmin={true} />
```

**Cliente:**
```tsx
<OrderImageGallery orderId={order.id} isAdmin={false} />
```

### Estados

- `images`: Array de imagens carregadas
- `loading`: Carregando imagens
- `uploading`: Upload em progresso
- `selectedFile`: Arquivo selecionado para upload
- `description`: Descrição da foto
- `previewUrl`: URL de pré-visualização
- `selectedImage`: Imagem selecionada para zoom

### Funcionalidades

1. **Carregamento Automático**
   - Carrega fotos ao montar o componente
   - Atualiza após upload ou exclusão

2. **Upload (Admin)**
   - Seleção de arquivo
   - Validação de tipo e tamanho
   - Pré-visualização
   - Campo de descrição
   - Botão de envio com loading

3. **Galeria**
   - Grid responsivo
   - Hover effects
   - Clique para ampliar
   - Descrição visível

4. **Modal de Zoom**
   - Imagem em tamanho completo
   - Descrição completa
   - Informações do uploader
   - Data e hora

5. **Exclusão (Admin)**
   - Botão X no hover
   - Confirmação antes de excluir
   - Feedback de sucesso/erro

---

## 📋 Fluxo de Uso

### Fluxo do Técnico

1. **Recebe Equipamento**
   - Cliente deixa equipamento para reparo

2. **Cria Ordem de Serviço**
   - Registra no sistema

3. **Tira Fotos do Equipamento**
   - Estado inicial
   - Defeitos identificados
   - Peças danificadas
   - Processo de reparo

4. **Envia Fotos para o Cliente**
   - Acessa ordem de serviço
   - Vai na aba "Fotos"
   - Seleciona foto
   - Adiciona descrição
   - Envia

5. **Cliente Recebe Notificação**
   - Vê fotos em tempo real
   - Entende o problema
   - Acompanha o reparo

### Fluxo do Cliente

1. **Acessa Ordem de Serviço**
   - Login no sistema
   - Minhas Ordens
   - Seleciona ordem

2. **Visualiza Fotos**
   - Aba "Fotos"
   - Vê todas as fotos enviadas
   - Clica para ampliar

3. **Entende o Problema**
   - Vê estado do equipamento
   - Lê descrições do técnico
   - Acompanha progresso

4. **Transparência Total**
   - Confia no serviço
   - Menos ligações
   - Mais satisfação

---

## ✨ Benefícios

### Para o Técnico

- ✅ Documenta estado do equipamento
- ✅ Prova visual do problema
- ✅ Reduz mal-entendidos
- ✅ Menos ligações de clientes
- ✅ Profissionalismo

### Para o Cliente

- ✅ Transparência total
- ✅ Vê o que está sendo feito
- ✅ Entende o problema
- ✅ Confia no serviço
- ✅ Acompanha em tempo real

### Para a Assistência Técnica

- ✅ Diferencial competitivo
- ✅ Maior satisfação do cliente
- ✅ Menos reclamações
- ✅ Documentação completa
- ✅ Profissionalismo elevado

---

## 🎯 Casos de Uso

### 1. Documentação do Estado Inicial

**Cenário**: Cliente traz notebook com tela quebrada

**Ação do Técnico**:
1. Tira foto da tela quebrada
2. Descrição: "Tela com rachaduras no canto superior direito"
3. Envia para o cliente

**Benefício**: Cliente vê exatamente o estado do equipamento

### 2. Identificação de Defeitos Adicionais

**Cenário**: Ao abrir o equipamento, técnico encontra mais problemas

**Ação do Técnico**:
1. Tira foto do problema adicional
2. Descrição: "Bateria estufada, precisa ser substituída"
3. Envia para o cliente

**Benefício**: Cliente entende necessidade de reparo adicional

### 3. Progresso do Reparo

**Cenário**: Reparo em andamento

**Ação do Técnico**:
1. Tira fotos do processo
2. Descrição: "Tela nova instalada, testando funcionamento"
3. Envia para o cliente

**Benefício**: Cliente acompanha progresso em tempo real

### 4. Comprovação de Qualidade

**Cenário**: Reparo concluído

**Ação do Técnico**:
1. Tira foto do equipamento funcionando
2. Descrição: "Reparo concluído, equipamento testado e funcionando perfeitamente"
3. Envia para o cliente

**Benefício**: Cliente vê resultado antes de buscar

---

## 🔧 Configurações Técnicas

### Limites e Restrições

- **Tamanho máximo antes da compressão**: 5MB
- **Tamanho máximo após compressão**: 1MB
- **Resolução máxima**: 1920x1080 (Full HD)
- **Formatos aceitos**: JPG, PNG, WEBP, GIF, AVIF
- **Formato de saída**: WebP (qualidade 80%)

### Storage

- **Bucket**: `app-8pj0bpgfx6v5_order_images`
- **Tipo**: Privado
- **Cache**: 3600 segundos (1 hora)
- **Nomenclatura**: `{orderId}_{timestamp}.{ext}`

### Performance

- **Compressão**: Automática no cliente
- **Upload**: Assíncrono com feedback
- **Carregamento**: Lazy loading nas galerias
- **Cache**: Imagens cacheadas pelo navegador

---

## 📱 Responsividade

### Mobile (< 768px)

- Grid: 2 colunas
- Fotos: Tamanho reduzido
- Modal: Tela cheia
- Upload: Interface simplificada

### Tablet (768px - 1024px)

- Grid: 2-3 colunas
- Fotos: Tamanho médio
- Modal: Centralizado

### Desktop (> 1024px)

- Grid: 3 colunas
- Fotos: Tamanho completo
- Modal: Centralizado com padding

---

## 🚀 Como Usar

### Para Técnicos

1. **Acessar Ordem de Serviço**
   ```
   Admin → Ordens → [Selecionar Ordem]
   ```

2. **Ir para Aba Fotos**
   ```
   Histórico | Fotos | Mensagens
              ↑ Clicar aqui
   ```

3. **Enviar Foto**
   ```
   1. Clicar em "Selecionar Foto"
   2. Escolher arquivo
   3. (Opcional) Adicionar descrição
   4. Clicar em "Enviar Foto"
   ```

4. **Gerenciar Fotos**
   ```
   - Ver todas as fotos enviadas
   - Clicar para ampliar
   - Passar mouse e clicar X para excluir
   ```

### Para Clientes

1. **Acessar Ordem de Serviço**
   ```
   Minhas Ordens → [Selecionar Ordem]
   ```

2. **Ver Fotos**
   ```
   Histórico | Fotos | Mensagens
              ↑ Clicar aqui
   ```

3. **Visualizar**
   ```
   - Ver galeria de fotos
   - Clicar para ampliar
   - Ler descrições
   ```

---

## 📊 Estatísticas e Métricas

### Impacto Esperado

- **Redução de ligações**: 40-60%
- **Aumento de satisfação**: 30-50%
- **Redução de reclamações**: 50-70%
- **Aumento de confiança**: 60-80%

### Métricas a Acompanhar

- Número de fotos enviadas por ordem
- Taxa de visualização pelos clientes
- Tempo médio até primeira foto
- Feedback dos clientes

---

**InfoShire - Transparência Total com Fotos do Equipamento** 🔧📸
