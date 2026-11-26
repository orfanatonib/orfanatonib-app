import { describe, expect, it } from "vitest";

import { addedKeys, diffBucketAndRefs, keyFromUrl } from "./s3-invariants";

describe("keyFromUrl", () => {
  it("lê path-style (LocalStack) e virtual-host (AWS)", () => {
    expect(keyFromUrl("http://localhost:4566/bkt/local/uploads/1_a.png", "bkt")).toBe("local/uploads/1_a.png");
    expect(keyFromUrl("https://bkt.s3.amazonaws.com/prod/uploads/1_a.png", "bkt")).toBe("prod/uploads/1_a.png");
  });
  it("devolve null quando a URL não é do bucket", () => {
    expect(keyFromUrl("https://youtube.com/watch?v=1", "bkt")).toBeNull();
  });
});

describe("diffBucketAndRefs", () => {
  it("separa órfãos (no bucket sem referência) de quebrados (referência sem objeto)", () => {
    const result = diffBucketAndRefs(["a", "b", "c"], ["b", "c", "d"]);
    expect(result).toEqual({ orphans: ["a"], broken: ["d"] });
  });
  it("conjuntos iguais não têm nada", () => {
    expect(diffBucketAndRefs(["a"], ["a"])).toEqual({ orphans: [], broken: [] });
  });
  it("duplicatas não distorcem", () => {
    expect(diffBucketAndRefs(["a", "a"], ["a", "a"])).toEqual({ orphans: [], broken: [] });
  });
});

describe("addedKeys", () => {
  it("lista só o que apareceu depois", () => {
    expect(addedKeys(["a"], ["a", "b", "c"])).toEqual(["b", "c"]);
    expect(addedKeys(["a", "b"], ["a"])).toEqual([]);
  });
});
