import { crc32, deflateSync } from "node:zlib";

/** PNG RGB colorido gerado em memória (sem dependência): gradiente + círculos, para o feed ter imagens de verdade. */
export function makePng(width: number, height: number, seed: number): Buffer {
  const hue = (seed * 47) % 360;
  const rgb = (h: number, s: number, l: number): [number, number, number] => {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return [f(0), f(8), f(4)];
  };
  const circles = Array.from({ length: 5 }, (_, index) => ({
    x: (seed * 131 + index * 211) % width | 0,
    y: (seed * 97 + index * 173) % height | 0,
    r: 40 + ((seed * 29 + index * 53) % 90),
    color: rgb((hue + 40 + index * 35) % 360, 0.75, 0.62),
  }));
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      let [r, g, b] = rgb(hue, 0.65, 0.35 + 0.35 * (y / height));
      for (const circle of circles) {
        if ((x - circle.x) ** 2 + (y - circle.y) ** 2 < circle.r ** 2) [r, g, b] = circle.color;
      }
      const at = row + 1 + x * 3;
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
    }
  }
  const chunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8 bits por canal
  header[9] = 2; // RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
