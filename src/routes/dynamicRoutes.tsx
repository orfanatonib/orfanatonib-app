import { Navigate, Route } from "react-router-dom";
import { lazyElement } from "./lazyElement";
import * as Pages from "./lazyPages";
import type { DynamicRouteData } from "./types";
import { resolveDynamicRouteTarget } from "./utils";

/** Rotas vindas da API (`/routes`), já filtradas por flag de tipo. */
export function renderDynamicRoutes(
  routes: DynamicRouteData[],
  isAuthenticated: boolean,
) {
  return routes.map((route) => {
    const target = resolveDynamicRouteTarget(route, isAuthenticated);
    const path = `/${route.path}`;
    if (target.kind === "redirect") {
      return (
        <Route
          key={route.id}
          path={path}
          element={<Navigate to={target.to} replace />}
        />
      );
    }
    const page = (
      <Pages.PageRenderer
        entityType={route.entityType}
        idToFetch={route.idToFetch}
      />
    );
    return (
      <Route
        key={route.id}
        path={path}
        element={lazyElement(
          target.kind === "member-shell" ? (
            <Pages.MemberAreaShell>{page}</Pages.MemberAreaShell>
          ) : (
            page
          ),
        )}
      />
    );
  });
}
