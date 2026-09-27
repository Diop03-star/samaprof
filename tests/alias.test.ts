import { describe, it, expect } from "vitest";
import path from "node:path";
import config from "../vitest.config";

describe("alias @", () => {
  it("pointe sur la racine du projet, pas sur __dirname", () => {
    const alias = (config.resolve?.alias ?? {}) as Record<string, string>;
    expect(alias["@"]).toBe(path.resolve(process.cwd(), "."));
  });
});
