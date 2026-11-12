import type { Operation } from "../types";
import type { Family } from "../config";
import type { Pair } from "./types";
type ProductFamily = Extract<Family, { kind: "product" }>;

const productPools = new WeakMap<
  ProductFamily,
  Map<Operation, readonly Pair[]>
>();
export function productPool(
  operation: Operation,
  family: ProductFamily,
): readonly Pair[] {
  const cached = productPools.get(family)?.get(operation);
  if (cached) return cached;
  const pool: Pair[] = [];
  const selection = family.right;
  const right =
    selection.kind === "values"
      ? selection.values
      : Array.from(
          { length: selection.bounds[1] - selection.bounds[0] + 1 },
          (_, i) => selection.bounds[0] + i,
        );
  for (let a = family.left[0]; a <= family.left[1]; a++)
    for (const b of right) {
      if (operation === "divide" && a * b > 999) continue;
      if (
        (family.excludeMultiplesOfTen && (a % 10 === 0 || b % 10 === 0)) ||
        (family.excludeSquares && a === b)
      )
        continue;
      pool.push([a, b]);
    }
  const pools =
    productPools.get(family) ?? new Map<Operation, readonly Pair[]>();
  pools.set(operation, pool);
  productPools.set(family, pools);
  return pool;
}
