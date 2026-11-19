import { describe, expect, it } from "vitest";

import { parseSseText } from "./sse.utils";

describe("parseSseText", () => {
  it("lê mensagens completas e ignora comentários", () => {
    const text = ': heartbeat\n\nevent: jobs\ndata: [{"a":1}]\n\nevent: end\ndata: {"reason":"idle"}\n\n';
    const { messages, offset } = parseSseText(text, 0);
    expect(messages).toEqual([
      { event: "jobs", data: '[{"a":1}]' },
      { event: "end", data: '{"reason":"idle"}' },
    ]);
    expect(offset).toBe(text.length);
  });
  it("deixa a mensagem incompleta para a próxima leitura (incremental)", () => {
    const part1 = "event: jobs\ndata: [1]\n\nevent: jobs\ndata: [2";
    const first = parseSseText(part1, 0);
    expect(first.messages).toHaveLength(1);
    const full = `${part1}]\n\n`;
    const second = parseSseText(full, first.offset);
    expect(second.messages).toEqual([{ event: "jobs", data: "[2]" }]);
  });
  it("sem event usa 'message'", () => {
    expect(parseSseText("data: x\n\n", 0).messages).toEqual([{ event: "message", data: "x" }]);
  });
});
