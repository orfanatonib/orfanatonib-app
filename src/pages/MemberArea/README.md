# MemberArea - Estrutura Reorganizada

## 📁 Estrutura de Pastas

```
src/pages/MemberArea/
├── components/
│   ├── Banners/           # Todos os banners
│   │   ├── IdeasSharingBanner.tsx
│   │   ├── MemberWeekBanner.tsx
│   │   ├── MemberMeditationBanner.tsx
│   │   ├── InformativeBanner.tsx
│   │   └── index.ts
│   ├── Sections/          # Seções de conteúdo
│   │   ├── BannerSection.tsx
│   │   ├── MemberContent.tsx
│   │   ├── CommentsSection.tsx
│   │   ├── DocumentsSection.tsx
│   │   ├── IdeasGallerySection.tsx
│   │   ├── TrainingVideosSection.tsx
│   │   ├── WeekMaterialsList.tsx
│   │   └── index.ts
│   ├── Buttons/           # Componentes de botão
│   │   ├── FofinhoButton.tsx
│   │   └── index.ts
│   ├── Forms/             # Formulários
│   │   ├── SiteFeedbackForm.tsx
│   │   └── index.ts
│   ├── Modals/            # Modais e componentes modais
│   │   ├── AddImageModal.tsx
│   │   ├── NotificationModal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── index.ts
│   └── index.ts           # Export principal
├── constants/
│   └── index.ts           # Constantes e estilos
├── hooks/
│   ├── useMemberArea.ts
│   └── index.ts
├── types/
│   └── index.ts           # Interfaces TypeScript
├── IdeasSection/          # Seção de ideias
│   └── IdeasSectionPage.tsx
├── ImageSection/          # Seção de imagens
│   ├── ImageSectionEditor.tsx
│   └── ImageSectionPage.tsx
└── MemberArea.tsx        # Componente principal
```

## 🎯 Organização por Categoria

### Banners
- **IdeasSharingBanner**: Banner para compartilhar ideias
- **MemberWeekBanner**: Banner dos materiais da semana
- **MemberMeditationBanner**: Banner de meditação diária
- **InformativeBanner**: Banner informativo geral

### Sections
- **BannerSection**: Gerencia a exibição dos banners
- **MemberContent**: Conteúdo principal para membros logados
- **CommentsSection**: Seção de comentários
- **DocumentsSection**: Seção de documentos
- **IdeasGallerySection**: Galeria de ideias
- **TrainingVideosSection**: Seção de vídeos de treinamento
- **WeekMaterialsList**: Lista de materiais da semana

### Buttons
- **FofinhoButton**: Botão principal de navegação

### Forms
- **SiteFeedbackForm**: Formulário de feedback do site

### Modals
- **AddImageModal**: Modal para adicionar imagens
- **NotificationModal**: Modal de notificações
- **LoadingSpinner**: Spinner de carregamento

### Layout (sidebar)
- **MemberAreaLayout**: rota-layout (`<Outlet />`) que embrulha a Home, as subpáginas e as subpáginas das subpáginas do membro (`/area-do-membro`, `/area-do-membro/documentos|ideias|videos|integracoes` (Integrações FM, só admin/líder; saiu do `/adm`, e `/adm/integracoes` redireciona), `/area-do-membro/materiais-visita|compartilhar-ideia|imagens-abrigo|manual|avaliar-site`). A **Área dos Acolhidos** (`/area-dos-acolhidos`) é página solo, aberta pelo menu do canto superior direito, e fica fora da casca e do sidebar.
- **MemberAreaShell**: o esqueleto fixo (fundo, `MemberAreaHeader`, sidebar no desktop ou barra de abas deslizante no mobile e área de conteúdo com altura mínima). Trocar de subpágina só troca o miolo; subpáginas não devem declarar `minHeight: 100vh` nem fundo próprio. O **`MemberPageHeader`** (ícone, título e descrição) é desenhado pela casca a partir do item do menu (`description` em `MEMBER_NAV_ITEMS`); subpáginas **não** repetem título. Todo cartão usa `MEMBER_CARD_SX`.
- **Largura:** a casca ocupa **95% da janela no desktop e 98% no mobile** (`MEMBER_SHELL_LAYOUT.width`); subpáginas não somam margem lateral própria.
- **Páginas de conteúdo por id:** materiais, ideias e vídeos abrem em `/area-do-membro/materiais-visita/:id`, `/area-do-membro/ideias/:id` e `/area-do-membro/videos/:id` (`MemberContentPage`, `MEMBER_CONTENT_PAGE_BASE_PATH`, `buildMemberContentPath`). O endereço antigo por slug da API redireciona para o novo quando há login.
- **Visualização de material e de ideia:** cabeçalho em cartão + `VisitMediaCard` para cada mídia (vídeo, documento, imagem, áudio). Seções de ideia agrupam as mídias por tipo em `IdeaSectionCard`.
- **MemberGalleryGrid**: galeria padrão (busca, grade responsiva, "Mostrar mais") usada por Documentos, Galeria de Ideias e Vídeos de Treinamento. Regras puras em `utils/gallery.ts`.
- **Manual do Membro**: lista dirigida por dados em `pages/MinistryInstructions/manualSections.ts`, cada seção num `ManualSection` (cartão padrão, variante clara ou em gradiente). Também envolve as páginas dinâmicas de conteúdo (`VisitMaterialsPage`, `VideosPage`, `ImagesPage`, `IdeasPage`) quando o usuário está logado; `ShelterPage` (pública) fica fora.
- **MemberAreaSidebar**: itens definidos em `constants/navigation.ts`, tipos/enums em `types/navigation.ts` e regras puras (filtro por flag/papel e item ativo) em `utils/navigation.ts`. O menu é só conveniência de UI: a API continua sendo a autoridade de acesso.
- A **Home** segue a organização da Área do Professor do Clubinho: cabeçalho personalizado com avatar, papel, abrigo e perfil; avisos; preparação da semana; acesso rápido; guia responsivo e mural. O banner de materiais usa a rota `VisitMaterialsPage` marcada como `current` e abre o conteúdo por `idToFetch`; sem material atual, oferece o acervo. Meditação mantém sua disponibilidade e visualização existentes. O guia mostra 1/2/3 cartões conforme a largura, com botões acessíveis e sem avanço automático. Documentos, ideias e vídeos continuam nas subpáginas. Os tokens visuais ficam em `src/theme/memberArea.ts`. Testes de apresentação e navegação: `components/memberHome.test.tsx`.
- Para adicionar um item: incluir o id em `MemberNavItemId`, a definição em `MEMBER_NAV_ITEMS` e, se a rota nova for do membro, colocá-la dentro de `<MemberAreaLayout />` no `App.tsx`.

## 🔄 Imports

Todos os componentes são exportados através de seus respectivos `index.ts` e podem ser importados assim:

```typescript
// Importar componentes específicos
import { IdeasSharingBanner, MemberWeekBanner } from './components';

// Importar de categorias específicas
import { IdeasSharingBanner } from './components/Banners';
import { DocumentsSection } from './components/Sections';
```

## 📝 Benefícios da Reorganização

1. **Melhor Organização**: Componentes agrupados por função
2. **Facilita Manutenção**: Estrutura clara e previsível
3. **Imports Limpos**: Exports centralizados em cada pasta
4. **Escalabilidade**: Fácil adicionar novos componentes nas categorias corretas
5. **Separação de Responsabilidades**: Cada pasta tem uma responsabilidade específica
