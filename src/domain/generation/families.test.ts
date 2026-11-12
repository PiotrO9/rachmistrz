import { describe, expect, it } from "vitest";
import type { Family } from "../config";
import { digitPair, regroupCount } from "./additive";
import { productPool } from "./product";
import { seed } from "../../testing/seed";

describe("jawne ograniczenia rodzin", () => {
  it("stosuje pożyczkę przez zero niezależnie od nazwy rodziny", () => {
    const random = seed(71);
    const family: Extract<Family, { kind: "digits" }> = {
      id: "renamed",
      weight: 1,
      kind: "digits",
      digits: 3,
      regroup: 2,
      zeroAt: 1,
    };
    for (let i = 0; i < 100; i++) {
      const [a, b] = digitPair(
        "subtract",
        family,
        (items) => items[Math.floor(random() * items.length)],
      );
      expect(Math.floor(a / 10) % 10).toBe(0);
      expect(regroupCount(a, b, true)).toBe(2);
      expect(a).toBeGreaterThan(b);
    }
  });
  it("stosuje pierwszy most dziesiątkowy niezależnie od nazwy rodziny", () => {
    const family: Extract<Family, { kind: "digits" }> = {
      id: "renamed",
      weight: 1,
      kind: "digits",
      digits: 2,
      regroup: 1,
      bridgeToTwenty: true,
    };
    for (const last of [false, true]) {
      const [a, b] = digitPair(
        "subtract",
        family,
        (items) => items[last ? items.length - 1 : 0],
      );
      expect(a).toBeLessThan(20);
      expect(b).toBeLessThan(10);
      expect(regroupCount(a, b, true)).toBe(1);
    }
  });
  it("oddziela pule definicji o tym samym id oraz mnożenie od dzielenia", () => {
    const family: Extract<Family, { kind: "product" }> = {
      id: "same",
      weight: 1,
      kind: "product",
      left: [30, 31],
      right: { kind: "values", values: [30, 31, 33] },
      excludeMultiplesOfTen: true,
      excludeSquares: true,
    };
    expect(productPool("multiply", family)).toEqual([[31, 33]]);
    expect(productPool("divide", family)).toEqual([]);
    expect(
      productPool("multiply", {
        ...family,
        right: { kind: "range", bounds: [32, 33] },
      }),
    ).toEqual([
      [31, 32],
      [31, 33],
    ]);
    expect(productPool("multiply", family)).toEqual([[31, 33]]);
  });
});
