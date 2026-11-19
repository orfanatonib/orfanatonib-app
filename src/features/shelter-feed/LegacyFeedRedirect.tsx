import { Navigate, useLocation } from 'react-router-dom';

import { SHELTER_FEED_PATH } from './routes';

/** `/feed-abrigos` (endereço antigo) → `/feed-ministerio-orfanatos-nib`, sem perder query nem âncora. */
export function LegacyFeedRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: SHELTER_FEED_PATH, search, hash }} replace />;
}
