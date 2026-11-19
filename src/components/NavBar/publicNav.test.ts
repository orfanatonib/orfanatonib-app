import { describe, expect, it } from 'vitest';

import { FeatureFlagKeys } from '@/features/feature-flags/types';

import { PUBLIC_NAV_ITEMS, visiblePublicNavItems } from './publicNav';

describe('menu público por flag', () => {
  it('com tudo ligado mostra os 5 itens na ordem', () => {
    expect(visiblePublicNavItems(() => true).map((i) => i.to)).toEqual(['/', '/feed-abrigos', '/sobre', '/eventos', '/contato']);
  });

  it('a Home nunca some, mesmo com tudo desligado', () => {
    expect(visiblePublicNavItems(() => false).map((i) => i.to)).toEqual(['/']);
  });

  it.each([
    [FeatureFlagKeys.SHELTER_FEED, '/feed-abrigos'],
    [FeatureFlagKeys.ABOUT_PAGE, '/sobre'],
    [FeatureFlagKeys.EVENTS_SECTION, '/eventos'],
    [FeatureFlagKeys.CONTACT_FORM, '/contato'],
  ])('flag %s desligada esconde só %s', (flag, to) => {
    const items = visiblePublicNavItems((f) => f !== flag).map((i) => i.to);
    expect(items).not.toContain(to);
    expect(items).toHaveLength(PUBLIC_NAV_ITEMS.length - 1);
  });
});
