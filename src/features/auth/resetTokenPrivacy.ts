const REFERRER_META_ID = 'reset-password-no-referrer';
const CLEAN_PATH = '/recuperar-senha';

/**
 * Privacidade do token de redefinição de senha (plano 06, T3.4): enquanto a página
 * está aberta o navegador não envia `Referer` e a URL com o token sai do histórico
 * e da barra (o token fica só em memória). Devolve a função que desfaz o `meta`.
 */
export function protectResetToken(doc: Document = document, win: Window = window): () => void {
  const meta = doc.createElement('meta');
  meta.id = REFERRER_META_ID;
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  doc.head.appendChild(meta);

  // `replaceState` não dispara navegação no React Router: a tela segue montada.
  win.history.replaceState(win.history.state, '', CLEAN_PATH);

  return () => {
    doc.getElementById(REFERRER_META_ID)?.remove();
  };
}
