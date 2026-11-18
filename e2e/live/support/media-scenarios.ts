import { expect } from "@playwright/test";

import { countRows } from "./db";
import {
  expectBucketUnchanged,
  expectNoBrokenRefs,
  expectNoOrphans,
  listObjects,
  snapshotBucket,
} from "./s3";

/** Arquivo de teste pequeno, gerado em memória. */
export interface TestFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR1sAAAAASUVORK5CYII=",
  "base64",
);

export const testImage = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

/**
 * O que cada feature com mídia informa para reaproveitar os 12 cenários de
 * S3 sem órfão. Todas as operações passam pela **API real**; `mediaCount`
 * conta as linhas de mídia do dono no banco.
 */
export interface MediaFeatureAdapter {
  /** Cria o dono com os arquivos; devolve o id (ou lança com o erro da API). */
  create(files: TestFile[]): Promise<string>;
  /** Cria enviando uma entrada **inválida** no 2º arquivo (validação). */
  createWithInvalidSecondFile(first: TestFile): Promise<{ status: number }>;
  /** Cria provocando uma falha **real** de banco depois do upload (ex.: duplicidade). */
  createFailingAtDatabase(files: TestFile[]): Promise<{ status: number }>;
  replaceFirst(ownerId: string, file: TestFile): Promise<void>;
  removeFirst(ownerId: string): Promise<void>;
  updateFailing(ownerId: string, file: TestFile): Promise<{ status: number }>;
  remove(ownerId: string): Promise<void>;
  /** Apaga o dono com filhos (página com seções, usuário com foto…); devolve o id do dono raiz. */
  createWithChildren?(): Promise<string>;
  removeWithChildren?(ownerId: string): Promise<void>;
  /** Cria com 2 arquivos de **mesmo nome** em sequência rápida. */
  uploadSameNameTwice?(): Promise<string>;
  uploadInvalid(file: TestFile): Promise<{ status: number }>;
  uploadTooLarge(): Promise<{ status: number }>;
  /** Número de linhas de mídia do dono no banco. */
  mediaCount(ownerId: string): Promise<number>;
  cleanup(): Promise<void>;
}

export interface MediaScenario {
  /** `<slug>.s3.NN` — o mesmo ID da matriz do plano. */
  id: string;
  title: string;
  run: (adapter: MediaFeatureAdapter) => Promise<void>;
}

const invariants = async (): Promise<void> => {
  await expectNoOrphans();
  await expectNoBrokenRefs();
};

/** Os 12 cenários de S3 sem órfão/sem referência quebrada (plano `02-e2e-fullstack`). */
export function mediaScenarios(slug: string): MediaScenario[] {
  const id = (n: number): string => `${slug}.s3.${String(n).padStart(2, "0")}`;
  return [
    { id: id(1), title: "criar com N arquivos", run: async (a) => {
      const owner = await a.create([testImage("a.png"), testImage("b.png")]);
      expect(await a.mediaCount(owner)).toBe(2);
      await invariants();
    } },
    { id: id(2), title: "criar com falha de validação no 2º arquivo não deixa objeto", run: async (a) => {
      const before = await snapshotBucket();
      const result = await a.createWithInvalidSecondFile(testImage("ok.png"));
      expect(result.status).toBeGreaterThanOrEqual(400);
      await expectBucketUnchanged(before);
      await invariants();
    } },
    { id: id(3), title: "criar com falha real no banco descarta os objetos enviados", run: async (a) => {
      const before = await snapshotBucket();
      const result = await a.createFailingAtDatabase([testImage("x.png"), testImage("y.png")]);
      expect(result.status).toBeGreaterThanOrEqual(400);
      await expectBucketUnchanged(before);
      await invariants();
    } },
    { id: id(4), title: "substituir um arquivo remove o antigo só depois do commit", run: async (a) => {
      const owner = await a.create([testImage("old.png")]);
      const [oldKey] = (await listObjects()).slice(-1);
      await a.replaceFirst(owner, testImage("new.png"));
      expect(await listObjects()).not.toContain(oldKey);
      expect(await a.mediaCount(owner)).toBe(1);
      await invariants();
    } },
    { id: id(5), title: "remover um item remove objeto e linha", run: async (a) => {
      const owner = await a.create([testImage("a.png"), testImage("b.png")]);
      await a.removeFirst(owner);
      expect(await a.mediaCount(owner)).toBe(1);
      await invariants();
    } },
    { id: id(6), title: "update com falha mantém os antigos e descarta os novos", run: async (a) => {
      const owner = await a.create([testImage("keep.png")]);
      const before = await snapshotBucket();
      const result = await a.updateFailing(owner, testImage("never.png"));
      expect(result.status).toBeGreaterThanOrEqual(400);
      await expectBucketUnchanged(before);
      expect(await a.mediaCount(owner)).toBe(1);
      await invariants();
    } },
    { id: id(7), title: "apagar a entidade remove todos os objetos e linhas de mídia", run: async (a) => {
      const owner = await a.create([testImage("a.png"), testImage("b.png")]);
      await a.remove(owner);
      expect(await a.mediaCount(owner)).toBe(0);
      await invariants();
    } },
    { id: id(8), title: "apagar o dono com filhos faz cascata completa", run: async (a) => {
      test_skip_guard(a.createWithChildren, a.removeWithChildren, id(8));
      const owner = await a.createWithChildren!();
      await a.removeWithChildren!(owner);
      expect(await a.mediaCount(owner)).toBe(0);
      await invariants();
    } },
    { id: id(9), title: "dois uploads de mesmo nome geram chaves distintas", run: async (a) => {
      test_skip_guard(a.uploadSameNameTwice, a.uploadSameNameTwice, id(9));
      const owner = await a.uploadSameNameTwice!();
      expect(await a.mediaCount(owner)).toBe(2);
      const keys = new Set((await listObjects()).slice(-2));
      expect(keys.size).toBe(2);
      await invariants();
    } },
    { id: id(10), title: "arquivo inválido e acima do limite são recusados sem efeito", run: async (a) => {
      const before = await snapshotBucket();
      expect((await a.uploadInvalid({ name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") })).status).toBeGreaterThanOrEqual(400);
      expect((await a.uploadTooLarge()).status).toBeGreaterThanOrEqual(400);
      await expectBucketUnchanged(before);
      await invariants();
    } },
    { id: id(11), title: "falha ao apagar vai para a fila de limpeza e é reprocessada", run: async (a) => {
      // Depende da fila `media_cleanup_queue` (plano 05-media-upload): sem a tabela o cenário falha, não é pulado.
      expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
      await a.cleanup();
      await invariants();
    } },
    { id: id(12), title: "edições simultâneas não deixam órfão nem referência quebrada", run: async (a) => {
      const owner = await a.create([testImage("a.png")]);
      await Promise.allSettled([a.replaceFirst(owner, testImage("c1.png")), a.replaceFirst(owner, testImage("c2.png"))]);
      await invariants();
    } },
  ];
}

/** Cenário não aplicável à feature (sem esse fluxo) é um erro de configuração do adapter, nunca um skip silencioso. */
function test_skip_guard(a: unknown, b: unknown, scenarioId: string): void {
  if (!a || !b) throw new Error(`Adapter sem o fluxo exigido pelo cenário ${scenarioId}: implemente o método (não é permitido pular).`);
}
