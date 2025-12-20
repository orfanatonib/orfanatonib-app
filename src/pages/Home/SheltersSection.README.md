# 🏠 SheltersSection - Seção de Abrigos

## 📋 Visão Geral

Componente que renderiza uma seção dedicada aos **Abrigos (Shelters)** na página inicial. Exibe apenas cards do tipo `ShelterPage`, criando uma galeria visual dos abrigos cadastrados no sistema.

## 🎯 Objetivo

Criar uma seção separada e destacada para os abrigos, diferenciando-os dos outros recursos (vídeos, documentos, etc.) que aparecem na `CardsSection`.

## 🔍 Diferenças: SheltersSection vs CardsSection

| Característica | CardsSection | SheltersSection |
|---------------|-------------|----------------|
| **Filtro** | Exclui `ShelterPage` | **Apenas** `ShelterPage` |
| **Tema de Cores** | Azul/Roxo | **Laranja/Vermelho** |
| **Ícone** | Nenhum | **🏠 Home Icon** |
| **Título** | "Explore Nossos Recursos" | **"Nossos Abrigos"** |
| **Descrição** | Nenhuma | **Texto explicativo** |
| **Localização** | Campo padrão | **Ícone de localização + subtitle** |
| **Background** | Gradiente azul | **Gradiente laranja** |

## 📊 Lógica de Filtragem

### **CardsSection (ANTES)**
```typescript
const filteredCards = routes.filter(
  (card) =>
    card.public &&
    card.idToFetch !== feedImageGalleryId &&
    card.entityType !== MediaTargetType.WeekMaterialsPage &&
    card.entityType !== MediaTargetType.Document &&
    card.entityType !== MediaTargetType.Informative &&
    card.entityType !== MediaTargetType.Meditation &&
    card.entityType !== MediaTargetType.ShelterPage // ❌ EXCLUI Shelters
);
```

### **SheltersSection (NOVO)** 🆕
```typescript
const filteredShelters = routes.filter(
  (card) => 
    card.public && 
    card.entityType === MediaTargetType.ShelterPage // ✅ APENAS Shelters
);
```

## 🎨 Design e Estilo

### **Tema de Cores**
```typescript
// Background principal
background: 'linear-gradient(135deg, #fff9f0 0%, #ffe8d6 50%, #fff5eb 100%)'

// Título
background: 'linear-gradient(45deg, #ff9800 30%, #ff5722 90%)'

// Barra superior do card
background: 'linear-gradient(90deg, #ff9800, #ff5722)'

// Hover do card
border: '1px solid rgba(255, 152, 0, 0.4)'
boxShadow: '0 20px 40px rgba(255, 152, 0, 0.2)'
```

### **Efeitos Visuais**
- ✅ **Animações Framer Motion** - Cards aparecem com fade + slide
- ✅ **Hover Scale** - Card cresce ao passar mouse
- ✅ **Image Zoom** - Imagem dá zoom no hover
- ✅ **Backdrop Blur** - Efeito de vidro fosco
- ✅ **Radial Gradients** - Fundo com círculos suaves

## 📋 Estrutura do Card

### **Informações Exibidas:**

1. **Imagem** (200px altura)
   - Placeholder se não houver imagem
   - Zoom no hover

2. **Título**
   - Nome do abrigo
   - Max 2 linhas (ellipsis)
   - Font Poppins, 700 weight

3. **Subtitle** (Localização) 🆕
   - Formato: "Cidade - Estado, Bairro Número"
   - Ícone de localização
   - Cor laranja (#ff9800)

4. **Descrição**
   - Max 100 caracteres (97 + ...)
   - Max 3 linhas (ellipsis)
   - Fallback: "Conheça mais sobre este abrigo"

### **Layout Responsivo:**

```typescript
Grid: 
  xs={12}  // 1 coluna em mobile
  sm={6}   // 2 colunas em tablet
  md={4}   // 3 colunas em desktop pequeno
  lg={3}   // 4 colunas em desktop grande
```

## 🔄 Fluxo de Dados

```
1. useSelector → Busca routes do Redux
2. useEffect → Filtra apenas ShelterPage
3. setShelterCards → Atualiza estado local
4. Render condicional → Só renderiza se houver cards
5. map → Renderiza grid de cards
6. Link → Navega para /${card.path}
```

## 🎭 Animações

### **Título da Seção**
```typescript
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
```

### **Cards**
```typescript
initial={{ opacity: 0, y: 50 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.6, delay: index * 0.1 }} // Efeito cascata
```

## 📱 Responsividade

| Breakpoint | Layout |
|-----------|--------|
| xs (mobile) | 1 coluna, padding 2 |
| sm (tablet) | 2 colunas, padding 3 |
| md (desktop) | 3-4 colunas, padding 4 |
| lg (desktop grande) | 4 colunas |

## 🔗 Integração com Home.tsx

```typescript
<Box>
  <HeroSection />
  {isAuthenticated && <WeekMaterialsBanner />}
  
  <CardsSection />        // ← Recursos gerais (vídeos, etc)
  <SheltersSection />     // ← 🆕 Abrigos (novo!)
  
  <FeaturesSection />
  <TestimonialsSection />
  <CTASection />
</Box>
```

## 🎯 Props e Estado

### **Props**
Nenhuma - componente autônomo

### **Estado Local**
```typescript
const [shelterCards, setShelterCards] = useState<ShelterCard[]>([]);
```

### **Redux**
```typescript
const routes = useSelector((state: RootState) => state.routes.routes);
```

## 📊 Tipos

```typescript
interface ShelterCard {
  id: string;
  title: string;
  subtitle?: string;      // 🆕 Localização
  description?: string;
  image?: string;
  path: string;
  entityType: string;
}
```

## 🛡️ Validações

### **Render Condicional**
```typescript
if (!shelterCards.length) return null;
```
- Se não houver abrigos, não renderiza a seção
- Evita seção vazia na página

### **Fallbacks**
- **Imagem:** `/placeholder-shelter.jpg`
- **Título:** `'Sem título'`
- **Descrição:** `'Conheça mais sobre este abrigo'`

## 🎨 Customização

### **Mudar Cores**
```typescript
// Tema laranja → azul
background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'

// Cards
border: '1px solid rgba(102, 126, 234, 0.2)'
```

### **Mudar Grid**
```typescript
<Grid item xs={12} sm={6} md={6} lg={4}>
  // 2 colunas em desktop em vez de 3-4
</Grid>
```

### **Mudar Título**
```typescript
<Typography>
  Abrigos Parceiros  // Em vez de "Nossos Abrigos"
</Typography>
```

## 🔄 Fluxo de Atualização

```
1. Backend adiciona novo shelter
2. Route criada automaticamente (backend)
3. Frontend busca routes (Redux)
4. SheltersSection filtra ShelterPage
5. Novo card aparece automaticamente ✅
```

## ✅ Funcionalidades

| Funcionalidade | Status |
|---------------|--------|
| Filtra apenas ShelterPage | ✅ |
| Exibe título e descrição | ✅ |
| Exibe localização (subtitle) | ✅ |
| Imagem com zoom hover | ✅ |
| Animações Framer Motion | ✅ |
| Grid responsivo | ✅ |
| Link para página do abrigo | ✅ |
| Render condicional | ✅ |
| Fallbacks para dados faltantes | ✅ |
| Tema laranja/vermelho | ✅ |

## 🎯 Exemplo de Card Renderizado

```
┌─────────────────────────┐
│ [Imagem do Abrigo]     │ ← 200px altura
├─────────────────────────┤
│ Abrigo Esperança       │ ← Título (Poppins 700)
│ 📍 Manaus - AM, Centro │ ← Localização (subtitle)
│                         │
│ Dedicado ao cuidado    │ ← Descrição (max 100 chars)
│ e educação de crian... │
└─────────────────────────┘
```

## 🚀 Performance

- ✅ **useMemo**: Não implementado (não necessário para filtro simples)
- ✅ **useCallback**: Não necessário (sem handlers complexos)
- ✅ **Lazy Loading**: Não necessário (poucos cards)
- ✅ **Render Condicional**: Não renderiza se vazio
- ✅ **Animações**: viewport={{ once: true }} - anima só 1 vez

## 📝 Notas Importantes

### **⚠️ Diferença de entityType**
```typescript
// Backend usa
entityType: 'shelterPage'  // lowercase P

// Frontend enum usa
MediaTargetType.ShelterPage // uppercase P
```

### **⚠️ Subtitle Format**
O subtitle vem do backend no formato:
```
"Cidade - Estado, Bairro Número"
Exemplo: "Manaus - AM, Centro 100"
```

### **⚠️ Ordem das Seções**
```
1. HeroSection
2. WeekMaterialsBanner (se autenticado)
3. CardsSection         ← Recursos gerais
4. SheltersSection      ← Abrigos (DEPOIS dos recursos)
5. FeaturesSection
6. TestimonialsSection
7. CTASection
```

## 🎉 Resultado Final

**Componente SheltersSection:**
- ✅ Criado e funcional
- ✅ Filtra apenas ShelterPage
- ✅ Design exclusivo (tema laranja)
- ✅ Integrado no Home.tsx
- ✅ Responsivo
- ✅ Animado
- ✅ Bem documentado

**Benefícios:**
1. 🎯 **Separação clara** entre recursos e abrigos
2. 🎨 **Design diferenciado** para abrigos
3. 📍 **Localização destacada** com ícone
4. 🏠 **Seção dedicada** com título próprio
5. ✨ **UX melhorada** - fácil encontrar abrigos

**Teste agora visitando a home!** 🏠✨🚀

