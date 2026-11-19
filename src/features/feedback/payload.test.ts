import { describe, expect, it } from "vitest";

import { buildSiteFeedbackPayload } from "./payload";

describe("buildSiteFeedbackPayload", () => {
  const values = { name: " Ana ", email: " a@x.com ", rating: 5, comment: "ótimo", category: "content" };

  it("manda só os cinco campos do contrato, sem createdAt/updatedAt/published", () => {
    const payload = buildSiteFeedbackPayload(values);
    expect(Object.keys(payload).sort()).toEqual(["category", "comment", "email", "name", "rating"]);
    expect(payload).toMatchObject({ name: "Ana", email: "a@x.com" });
  });

  it("e-mail em branco não vai no corpo", () => {
    expect(buildSiteFeedbackPayload({ ...values, email: "  " })).not.toHaveProperty("email");
  });
});
