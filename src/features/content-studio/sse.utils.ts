/** Leitura incremental de um corpo `text/event-stream` (só o que o Estúdio usa: `event:` e `data:`). */
export interface SseMessage {
  event: string;
  data: string;
}

/**
 * Extrai as mensagens COMPLETAS (terminadas por linha em branco) de `text` a partir de `offset`.
 * Devolve também o novo offset (o fim da última mensagem completa); comentários (`: ...`) são ignorados.
 */
export function parseSseText(text: string, offset: number): { messages: SseMessage[]; offset: number } {
  const messages: SseMessage[] = [];
  let cursor = offset;
  for (;;) {
    const end = text.indexOf("\n\n", cursor);
    if (end < 0) break;
    const block = text.slice(cursor, end);
    cursor = end + 2;
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (data.length) messages.push({ event, data: data.join("\n") });
  }
  return { messages, offset: cursor };
}
