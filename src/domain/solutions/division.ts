import type { Task } from "../types";
import type { Solution } from "./types";
export function explainDivision({ a, b, answer }: Task): Solution {
  return {
    explanation:
      "Sprawdź dzielenie przez mnożenie. Jaka liczba pomnożona przez dzielnik daje dzielną?",
    steps: [
      `${b} × ? = ${a}`,
      `${b} × ${answer} = ${a}`,
      `${a} ÷ ${b} = ${answer}`,
    ],
  };
}
