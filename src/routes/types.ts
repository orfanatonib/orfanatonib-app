import type { RouteData } from "@/store/slices/route/routeSlice";

export type DynamicRouteData = RouteData;

/** Decisão de como renderizar uma rota dinâmica (vinda da API). */
export type DynamicRouteTarget =
  | { kind: "redirect"; to: string }
  | { kind: "member-shell" }
  | { kind: "page" };
