import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { post } }));

const { apiCreateAcceptedChrist } = await import("./api");

describe("apiCreateAcceptedChrist", () => {
  beforeEach(() => post.mockReset());

  it("envia o payload para POST /accepted-christs e devolve o corpo", async () => {
    const payload = { shelteredId: "s1", decision: "ACCEPTED", notes: "n" } as never;
    post.mockResolvedValue({ data: { id: "a1" } });
    await expect(apiCreateAcceptedChrist(payload)).resolves.toEqual({ id: "a1" });
    expect(post).toHaveBeenCalledWith("/accepted-christs", payload);
  });

  it("propaga o erro da API (o chamador decide a mensagem)", async () => {
    post.mockRejectedValue(new Error("403"));
    await expect(apiCreateAcceptedChrist({ shelteredId: "s1" } as never)).rejects.toThrow("403");
  });
});
