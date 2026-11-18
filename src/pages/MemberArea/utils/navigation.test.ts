import { describe, expect, it } from 'vitest';
import { MediaTargetType } from '@/store/slices/types';
import { MEMBER_NAV_ITEMS, MEMBER_SUBPAGE_PATHS } from '../constants/navigation';
import { MemberNavItemId } from '../types/navigation';
import {
  buildMemberContentPath,
  filterNavItems,
  isMemberAreaEntityType,
  resolveActiveNavItemId,
} from './navigation';

const ids = (items: readonly { id: MemberNavItemId }[]) => items.map((item) => item.id);

describe('filterNavItems', () => {
  it('esconde Integrações para quem não é admin/líder', () => {
    const visible = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: false }));
    expect(visible).not.toContain(MemberNavItemId.Integrations);
    expect(visible).toContain(MemberNavItemId.Overview);
  });

  it('mostra Integrações para admin/líder', () => {
    const visible = ids(filterNavItems(MEMBER_NAV_ITEMS, { isAdminOrLeader: true }));
    expect(visible).toContain(MemberNavItemId.Integrations);
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
