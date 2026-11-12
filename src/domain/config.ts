import { operations, type Level, type Operation } from "./types";
// Persisted blocks and trends use these limits in schemas v2 and v3.
export const ADAPTATION = {
  blockSize: 8,
  consecutiveBlocks: 2,
  cleanToAdvance: 7,
  skipsToLower: 3,
  correctedToLower: 5,
  correctionsToLower: 8,
} as const;
export const LEVELS = [
  { value: 1, name: "Podstawowy" },
  { value: 2, name: "Łatwy" },
  { value: 3, name: "Średni" },
  { value: 4, name: "Trudny" },
  { value: 5, name: "Ekspercki" },
] as const;
export const getLevel = (value: Level) => LEVELS[value - 1];
export const REVIEW_SHARE = 0.2;
type Interval = readonly [number, number];
type Operands =
  | { kind: "range"; bounds: Interval }
  | { kind: "values"; values: readonly number[] };
export type Family = { id: string; weight: number } & (
  | {
      kind: "digits";
      digits: number;
      regroup: number;
      trailingZeros?: number;
      bridgeToTwenty?: boolean;
      zeroAt?: number;
    }
  | { kind: "nearHundred" }
  | { kind: "power"; base: Interval; exponent: number }
  | {
      kind: "product";
      left: Interval;
      right: Operands;
      excludeMultiplesOfTen?: boolean;
      excludeSquares?: boolean;
    }
);
const range = (min: number, max: number): Operands => ({
  kind: "range",
  bounds: [min, max],
});
const values = (...values: number[]): Operands => ({ kind: "values", values });
interface CurriculumLevel {
  description: string;
  families: readonly Family[];
}
const digits = (
  id: string,
  weight: number,
  length: number,
  regroup: number,
  trailingZeros = 0,
): Extract<Family, { kind: "digits" }> => ({
  id,
  weight,
  kind: "digits",
  digits: length,
  regroup,
  trailingZeros,
});
const product = (
  id: string,
  weight: number,
  left: Interval,
  right: Operands,
  constraints: Pick<
    Extract<Family, { kind: "product" }>,
    "excludeMultiplesOfTen" | "excludeSquares"
  > = {},
): Family => ({ id, weight, kind: "product", left, right, ...constraints });
export const CURRICULUM: Record<
  Operation,
  readonly [
    CurriculumLevel,
    CurriculumLevel,
    CurriculumLevel,
    CurriculumLevel,
    CurriculumLevel,
  ]
> = {
  add: [
    {
      description: "Do 20 · np. 8 + 7",
      families: [digits("units", 1, 1, 0), digits("cross-ten", 1, 1, 1)],
    },
    {
      description: "Dwie cyfry · np. 47 + 28",
      families: [digits("two-simple", 1, 2, 0), digits("two-carry", 3, 2, 1)],
    },
    {
      description: "Trzy cyfry i prosty rozkład · np. 472 + 305",
      families: [
        digits("hundreds", 1, 3, 0, 2),
        digits("three-simple", 1, 3, 0),
        digits("three-carry", 2, 3, 1),
      ],
    },
    {
      description: "Kilka przeniesień · np. 586 + 278",
      families: [
        digits("three-carry", 1, 3, 1),
        digits("two-carries", 3, 3, 2),
      ],
    },
    {
      description: "Łańcuchy przeniesień · np. 867 + 768",
      families: [
        digits("two-carries", 1, 3, 2),
        digits("three-carries", 3, 3, 3),
      ],
    },
  ],
  subtract: [
    {
      description: "Do 20 · np. 15 − 6",
      families: [
        digits("units", 1, 1, 0),
        { ...digits("cross-ten", 1, 2, 1), bridgeToTwenty: true },
      ],
    },
    {
      description: "Dwie cyfry · np. 63 − 25",
      families: [digits("two-simple", 1, 2, 0), digits("two-borrow", 3, 2, 1)],
    },
    {
      description: "Trzy cyfry i zaokrąglanie · np. 243 − 199",
      families: [
        digits("hundreds", 1, 3, 0, 2),
        digits("three-simple", 1, 3, 0),
        { id: "near-hundred", weight: 2, kind: "nearHundred" },
      ],
    },
    {
      description: "Pożyczki między cyframi · np. 732 − 458",
      families: [digits("one-borrow", 1, 3, 1), digits("two-borrows", 3, 3, 2)],
    },
    {
      description: "Pożyczki przez zero · np. 902 − 487",
      families: [
        digits("two-borrows", 1, 3, 2),
        { ...digits("through-zero", 3, 3, 2), zeroAt: 1 },
      ],
    },
  ],
  multiply: [
    {
      description: "Mnożenie przez 2, 5 i 10 · np. 7 × 5",
      families: [product("easy-tables", 1, [2, 10], values(2, 5, 10))],
    },
    {
      description: "Tabliczka i proste rozszerzenia · np. 23 × 3",
      families: [
        product("tables", 3, [3, 9], range(3, 9)),
        product("small-times", 1, [11, 24], range(2, 3)),
      ],
    },
    {
      description: "Dwie cyfry przez jedną · np. 78 × 5",
      families: [
        product("times-five", 1, [25, 99], values(5)),
        product("single-digit", 3, [25, 99], range(3, 9)),
      ],
    },
    {
      description: "Wygodne mnożniki · np. 36 × 25 lub 28 × 19",
      families: [
        product("friendly", 3, [12, 69], values(11, 12, 15, 25)),
        product("near-ten", 1, [12, 39], values(19, 21, 29, 31)),
      ],
    },
    {
      description: "Dwie cyfry przez dwie · np. 73 × 28",
      families: [
        product("two-digit", 1, [26, 99], range(13, 99), {
          excludeMultiplesOfTen: true,
          excludeSquares: true,
        }),
      ],
    },
  ],
  divide: [
    {
      description: "Dzielenie przez 2, 5 i 10 · np. 40 ÷ 5",
      families: [product("easy-tables", 1, [2, 10], values(2, 5, 10))],
    },
    {
      description: "Tabliczka i proste rozkłady · np. 84 ÷ 4",
      families: [
        product("tables", 3, [3, 9], range(3, 9)),
        product("small-quotient", 1, [11, 24], range(2, 4)),
      ],
    },
    {
      description: "Większe liczby przez jedną cyfrę · np. 252 ÷ 4",
      families: [product("single-divisor", 1, [25, 99], range(3, 9))],
    },
    {
      description: "Wygodne dzielniki dwucyfrowe · np. 624 ÷ 12",
      families: [
        product("friendly-divisor", 1, [12, 60], values(11, 12, 15, 25)),
      ],
    },
    {
      description: "Trudniejsze dzielniki dwucyfrowe · np. 828 ÷ 46",
      families: [
        product("two-digit-divisor", 1, [13, 39], range(13, 69), {
          excludeMultiplesOfTen: true,
          excludeSquares: true,
        }),
      ],
    },
  ],
  power: [
    {
      description: "Potęga 2 · podstawy 2–10",
      families: [
        {
          id: "power-2-2",
          weight: 1,
          kind: "power",
          base: [2, 10],
          exponent: 2,
        },
      ],
    },
    {
      description: "Potęga 2 · podstawy 11–20",
      families: [
        {
          id: "power-2-11",
          weight: 1,
          kind: "power",
          base: [11, 20],
          exponent: 2,
        },
      ],
    },
    {
      description: "Potęga 3 · podstawy 2–10",
      families: [
        {
          id: "power-3-2",
          weight: 1,
          kind: "power",
          base: [2, 10],
          exponent: 3,
        },
      ],
    },
    {
      description: "Potęga 2 · podstawy 21–30",
      families: [
        {
          id: "power-2-21",
          weight: 1,
          kind: "power",
          base: [21, 30],
          exponent: 2,
        },
      ],
    },
    {
      description: "Potęga 4 · podstawy 2–6",
      families: [
        {
          id: "power-4-2",
          weight: 1,
          kind: "power",
          base: [2, 6],
          exponent: 4,
        },
      ],
    },
  ],
  root: [
    {
      description: "Pierwiastek stopnia 2 · wyniki 2–10",
      families: [
        {
          id: "root-2-2",
          weight: 1,
          kind: "power",
          base: [2, 10],
          exponent: 2,
        },
      ],
    },
    {
      description: "Pierwiastek stopnia 2 · wyniki 11–20",
      families: [
        {
          id: "root-2-11",
          weight: 1,
          kind: "power",
          base: [11, 20],
          exponent: 2,
        },
      ],
    },
    {
      description: "Pierwiastek stopnia 3 · wyniki 2–10",
      families: [
        {
          id: "root-3-2",
          weight: 1,
          kind: "power",
          base: [2, 10],
          exponent: 3,
        },
      ],
    },
    {
      description: "Pierwiastek stopnia 2 · wyniki 21–30",
      families: [
        {
          id: "root-2-21",
          weight: 1,
          kind: "power",
          base: [21, 30],
          exponent: 2,
        },
      ],
    },
    {
      description: "Pierwiastek stopnia 4 · wyniki 2–6",
      families: [
        { id: "root-4-2", weight: 1, kind: "power", base: [2, 6], exponent: 4 },
      ],
    },
  ],
};
export function levelDescription(operation: Operation, level: Level) {
  return CURRICULUM[operation][level - 1].description;
}
export const labels: Record<Operation, string> = {
  add: "Dodawanie",
  subtract: "Odejmowanie",
  multiply: "Mnożenie",
  divide: "Dzielenie",
  power: "Potęgowanie",
  root: "Pierwiastkowanie",
};
export const symbols: Record<Operation, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
  power: "xⁿ",
  root: "√",
};
export const PRESETS: { name: string; active: Operation[] }[] = [
  {
    name: "Podstawowe działania",
    active: ["add", "subtract", "multiply", "divide"],
  },
  { name: "Dodawanie i odejmowanie", active: ["add", "subtract"] },
  { name: "Mnożenie i dzielenie", active: ["multiply", "divide"] },
  ...operations.map((op) => ({ name: labels[op], active: [op] })),
];

export const HISTORY_LIMITS = { days: 365, levelChanges: 500 } as const;
