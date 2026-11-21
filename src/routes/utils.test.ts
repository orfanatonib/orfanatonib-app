import { describe, expect, it } from "vitest";
import { MEMBER_SUBPAGE_PATHS } from "@/pages/MemberArea/constants/navigation";
import { MediaTargetType } from "@/store/slices/types";
import type { DynamicRouteData } from "./types";
import { resolveDynamicRouteTarget } from "./utils";

const route = (entityType: string, idToFetch = "abc 1"): DynamicRouteData =>
  ({ id: "r1", path: "algo", entityType, idToFetch }) as DynamicRouteData;

describe("resolveDynamicRouteTarget", () => {
  it("visitante abre a página pura, mesmo de tipo do membro", () => {
    expect(resolveDynamicRouteTarget(route(MediaTargetType.VisitMaterialsPage), false)).toEqual({ kind: "page" });
  });

  it("logado com material/ideia/vídeo é redirecionado ao endereço da Área do Membro", () => {
    expect(resolveDynamicRouteTarget(route(MediaTargetType.VisitMaterialsPage), true)).toEqual({
      kind: "redirect",
      to: `${MEMBER_SUBPAGE_PATHS.materials}/abc%201`,
    });
    expect(resolveDynamicRouteTarget(route(MediaTargetType.IdeasPage), true).kind).toBe("redirect");
    expect(resolveDynamicRouteTarget(route(MediaTargetType.VideosPage), true).kind).toBe("redirect");
  });

  it("logado com página de imagens (tipo do membro sem endereço próprio) abre dentro da casca", () => {
    expect(resolveDynamicRouteTarget(route(MediaTargetType.ImagesPage), true)).toEqual({ kind: "member-shell" });
  });

  it("logado com tipo fora da Área do Membro abre a página pura", () => {
    expect(resolveDynamicRouteTarget(route("OutroTipo"), true)).toEqual({ kind: "page" });
  });
});
