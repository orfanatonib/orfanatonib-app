import { describe, expect, it } from 'vitest';

import { protectResetToken } from './resetTokenPrivacy';

describe('protectResetToken', () => {
  it('põe o meta referrer, tira o token da URL e desfaz o meta ao sair', () => {
    window.history.replaceState(null, '', '/recuperar-senha/token-secreto');
    const restore = protectResetToken();

    const meta = document.head.querySelector('meta[name="referrer"]');
    expect(meta?.getAttribute('content')).toBe('no-referrer');
    expect(window.location.pathname).toBe('/recuperar-senha');
    expect(window.location.href).not.toContain('token-secreto');

    restore();
    expect(document.head.querySelector('meta[name="referrer"]')).toBeNull();
  });
});
