import { describe, expect, it } from 'vitest';
import { FeatureFlagKeys } from '@/features/feature-flags/types';
import { MediaTargetType } from '@/store/slices/types';
import { MEMBER_NAV_ITEMS, MEMBER_SUBPAGE_PATHS } from '../constants/navigation';
import { MemberNavItemId } from '../types/navigation';
import {
  buildMemberContentPath,
  filterNavItems,
  getMemberHomeQuickActionKeys,
  isMemberActionVisible,
  isMemberAreaEntityType,
  resolveActiveNavItemId,
} from './navigation';

const ids = (items: readonly { id: MemberNavItemId }[]) => items.map((item) => item.id);

describe('filterNavItems', () => {
  it('Fotos do Abrigo some do menu com a flag de envio desligada e volta ligada', () => {
    const off = ids(
      filterNavItems(MEMBER_NAV_ITEMS, {
        isAdminOrLeader: false,
        isFeatureEnabled: (key) => key !== FeatureFlagKeys.SHELTER_PHOTO_UPLOAD,
      }),
    );
    const on = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: false, isFeatureEnabled: () => true }));
    expect(off).not.toContain(MemberNavItemId.Photos);
    expect(off).toContain(MemberNavItemId.Overview);
    expect(on).toContain(MemberNavItemId.Photos);
  });

  it('esconde Integrações para quem não é admin/líder', () => {
    const visible = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: false }));
    expect(visible).not.toContain(MemberNavItemId.Integrations);
    expect(visible).toContain(MemberNavItemId.Overview);
  });

  it('mostra Integrações para admin/líder', () => {
    const visible = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: true }));
    expect(visible).toContain(MemberNavItemId.Integrations);
  });

  it('Integrações FM some do menu com a flag integration desligada, mesmo para admin/líder, e volta ligada', () => {
    const off = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: true, isFeatureEnabled: () => false }));
    const on = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: true, isFeatureEnabled: () => true }));
    expect(off).not.toContain(MemberNavItemId.Integrations);
    expect(on).toContain(MemberNavItemId.Integrations);
  });

  it('não inclui a Área dos Acolhidos (página solo, fora do menu do membro)', () => {
    const paths = MEMBER_NAV_ITEMS.map((item) => item.to);
    expect(paths.some((path) => path.startsWith('/area-dos-acolhidos'))).toBe(false);
  });
});

describe('resolveActiveNavItemId', () => {
  const items = filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: false });

  it('Home só fica ativo na rota exata', () => {
    expect(resolveActiveNavItemId(items, '/area-do-membro', [])).toBe(MemberNavItemId.Overview);
    expect(resolveActiveNavItemId(items, '/area-do-membro/qualquer', [])).toBeNull();
  });

  it('subpáginas e subpáginas das subpáginas mantêm o item pai ativo', () => {
    expect(resolveActiveNavItemId(items, MEMBER_SUBPAGE_PATHS.documents, [])).toBe(
      MemberNavItemId.Documents,
    );
    expect(resolveActiveNavItemId(items, `${MEMBER_SUBPAGE_PATHS.videos}/abc-123`, [])).toBe(
      MemberNavItemId.Videos,
    );
  });

  it('página dinâmica de material de visita ativa o item Materiais', () => {
    const routes = [{ path: 'visita-semana-1', entityType: MediaTargetType.VisitMaterialsPage }];
    expect(resolveActiveNavItemId(items, '/visita-semana-1', routes)).toBe(MemberNavItemId.Materials);
  });

  it('rota desconhecida não ativa nenhum item', () => {
    expect(resolveActiveNavItemId(items, '/outra-coisa', [])).toBeNull();
  });
});

describe('isMemberAreaEntityType', () => {
  it('inclui conteúdo do membro e exclui página pública de abrigo', () => {
    expect(isMemberAreaEntityType(MediaTargetType.VisitMaterialsPage)).toBe(true);
    expect(isMemberAreaEntityType(MediaTargetType.IdeasPage)).toBe(true);
    expect(isMemberAreaEntityType(MediaTargetType.ShelterPage)).toBe(false);
  });
});

describe('buildMemberContentPath', () => {
  it('monta /area-do-membro/<seção>/:id para materiais, ideias e vídeos', () => {
    expect(buildMemberContentPath(MediaTargetType.VisitMaterialsPage, 'abc')).toBe(
      '/area-do-membro/materiais-visita/abc',
    );
    expect(buildMemberContentPath(MediaTargetType.IdeasPage, 'abc')).toBe('/area-do-membro/ideias/abc');
    expect(buildMemberContentPath(MediaTargetType.VideosPage, 'abc')).toBe('/area-do-membro/videos/abc');
  });

  it('devolve null para tipos sem esse padrão e codifica o id', () => {
    expect(buildMemberContentPath(MediaTargetType.ShelterPage, 'abc')).toBeNull();
    expect(buildMemberContentPath(MediaTargetType.IdeasPage, 'a b')).toBe('/area-do-membro/ideias/a%20b');
  });
});

describe('getMemberHomeQuickActionKeys', () => {
  it('o botão de integrações da Home é só de admin/líder', () => {
    expect(getMemberHomeQuickActionKeys(true)).toContain('integrations');
    expect(getMemberHomeQuickActionKeys(false)).not.toContain('integrations');
  });

  it('os atalhos de todos continuam para o membro comum', () => {
    expect(getMemberHomeQuickActionKeys(false)).toEqual(expect.arrayContaining(['materials', 'photos', 'shelteredArea', 'rate']));
  });
});

describe('flags do menu e dos atalhos da Área do Membro', () => {
  it('todo item do menu declara a flag da sua rota', () => {
    for (const item of MEMBER_NAV_ITEMS) expect(item.featureKey, item.id).toBeTruthy();
  });

  it('com todas as flags desligadas nenhum item do menu aparece', () => {
    expect(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: true, isFeatureEnabled: () => false })).toEqual([]);
  });

  it('atalho some com a flag desligada e volta ligada', () => {
    const action = { to: '/eventos', featureKey: 'events_section' };
    expect(isMemberActionVisible(action, { isFeatureEnabled: () => false, visibleDynamicPaths: [] })).toBe(false);
    expect(isMemberActionVisible(action, { isFeatureEnabled: () => true, visibleDynamicPaths: [] })).toBe(true);
  });

  it('atalho de página dinâmica só aparece se a rota existir', () => {
    const action = { to: '/amor', dynamicRoute: true };
    const on = { isFeatureEnabled: () => true };
    expect(isMemberActionVisible(action, { ...on, visibleDynamicPaths: [] })).toBe(false);
    expect(isMemberActionVisible(action, { ...on, visibleDynamicPaths: ['amor'] })).toBe(true);
  });
});
