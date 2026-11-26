import { describe, expect, it } from "vitest";

import {
  ADMIN_LANDING_PATH,
  MEMBER_LANDING_PATH,
  landingPathFor,
} from "./landing";

describe("landingPathFor", () => {
  it("admin e líder vão para o painel", () => {
    expect(landingPathFor("admin")).toBe(ADMIN_LANDING_PATH);
    expect(landingPathFor("leader")).toBe(ADMIN_LANDING_PATH);
  });

  it("membro e papel desconhecido ou ausente vão para a Área do Membro", () => {
    expect(landingPathFor("member")).toBe(MEMBER_LANDING_PATH);
    expect(landingPathFor("coordinator")).toBe(MEMBER_LANDING_PATH);
    expect(landingPathFor(undefined)).toBe(MEMBER_LANDING_PATH);
    expect(landingPathFor(null)).toBe(MEMBER_LANDING_PATH);
  });
});
