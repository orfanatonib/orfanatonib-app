import { Suspense, type ReactNode } from "react";
import RouteFallback from "./RouteFallback";

/**
 * Envolve o elemento de uma rota em `Suspense` com o esqueleto. Cada página tem a
 * própria fronteira: um layout (Outlet) não é substituído pelo fallback quando só a
 * página filha está sendo baixada. Chamado como função nos arquivos de rotas.
 */
export function lazyElement(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}
