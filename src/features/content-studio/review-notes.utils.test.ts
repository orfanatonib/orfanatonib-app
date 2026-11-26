import { afterEach, describe, expect, it } from "vitest";

import {
  clearSentNote,
  hasUnsentNotes,
  parseReviewNotes,
  readReviewNotes,
  reviewNotesKey,
  serializeReviewNotes,
  writeReviewNotes,
} from "./review-notes.utils";
import { REVIEW_NOTE_MAX_LENGTH } from "./review-workspace.constants";

afterEach(() => window.localStorage.clear());

describe("observações do revisor", () => {
  it("lê só texto por etapa e ignora lixo", () => {
    expect(parseReviewNotes(JSON.stringify({ a: "ajustar", b: "  ", c: 3, d: null }))).toEqual({ a: "ajustar" });
    expect(parseReviewNotes("não é json")).toEqual({});
    expect(parseReviewNotes(JSON.stringify(["x"]))).toEqual({});
    expect(parseReviewNotes(null)).toEqual({});
  });

  it("corta no limite de caracteres do servidor", () => {
    const long = "x".repeat(REVIEW_NOTE_MAX_LENGTH + 50);
    expect(parseReviewNotes(JSON.stringify({ a: long })).a).toHaveLength(REVIEW_NOTE_MAX_LENGTH);
  });

  it("não guarda observação vazia; sem nenhuma, não grava nada", () => {
    expect(serializeReviewNotes({ a: "  ", b: "" })).toBeNull();
    expect(serializeReviewNotes({ a: "ok", b: " " })).toBe('{"a":"ok"}');
    expect(hasUnsentNotes({ a: " " })).toBe(false);
    expect(hasUnsentNotes({ a: "ok" })).toBe(true);
  });

  it("recupera depois de recarregar e apaga a chave quando esvazia", () => {
    expect(writeReviewNotes("p1", { s1: "deixar mais curto" })).toBe(true);
    expect(readReviewNotes("p1")).toEqual({ s1: "deixar mais curto" });
    expect(readReviewNotes("outro")).toEqual({});
    writeReviewNotes("p1", {});
    expect(window.localStorage.getItem(reviewNotesKey("p1"))).toBeNull();
  });

  it("navegador que recusa guardar não derruba a tela", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("cota");
    };
    try {
      expect(writeReviewNotes("p1", { s1: "x" })).toBe(false);
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("só limpa a observação se ela ainda for o texto enviado", () => {
    expect(clearSentNote({ a: "enviado", b: "outro" }, "a", "enviado")).toEqual({ b: "outro" });
    const typedMore = { a: "enviado e mais um pouco" };
    expect(clearSentNote(typedMore, "a", "enviado")).toBe(typedMore);
  });
});
