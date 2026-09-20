import { describe, expect, it } from "vitest";
import { readAnonToken } from "./anon-token";

function req(token?: string): Request {
  return new Request("http://localhost/x", { headers: token ? { "X-Anon-Token": token } : {} });
}

describe("readAnonToken", () => {
  it("accepts a UUID", () => {
    const uuid = "3f0c8a52-7e1b-4a0e-9d55-0c1d2e3f4a5b";
    expect(readAnonToken(req(uuid))).toBe(uuid);
  });

  it("treats a missing header as anonymous-without-token", () => {
    expect(readAnonToken(req())).toBeUndefined();
  });

  it("rejects blobs and odd characters", () => {
    for (const bad of ["short", "x".repeat(65), "has spaces in it", '{"$ne":null}']) {
      expect(() => readAnonToken(req(bad))).toThrow("malformed");
    }
  });
});
