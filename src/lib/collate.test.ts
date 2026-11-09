import { describe, expect, it } from "vitest";
import { compareText } from "./collate";

describe("compareText", () => {
  it("follows the Mongolian alphabet, ө after о and ү after у", () => {
    const words = ["Үүр", "Өглөө", "Улаан", "Пүрэв", "Онгоц", "Ахлах"];
    expect([...words].sort(compareText)).toEqual(["Ахлах", "Онгоц", "Өглөө", "Пүрэв", "Улаан", "Үүр"]);
  });

  it("ignores case and puts shorter prefixes first", () => {
    expect(compareText("ажил", "Ажил")).toBe(0);
    expect(compareText("Аж", "Ажил")).toBeLessThan(0);
  });

  it("sorts Latin text and digits before Cyrillic", () => {
    expect(["Төсөл", "Website", "2027"].sort(compareText)).toEqual(["2027", "Website", "Төсөл"]);
  });
});
