import { useEffect, useRef, useState } from "react";
import type { SavedProgress } from "../domain";
import type { SettingsAction } from "../training/engine";
import {
  puzzle,
  solved,
  step,
  target,
  firstBit,
  plusBit,
} from "../domain/matches";
import "../styles/matches.css";

const positions = [
  [50, 6],
  [86, 28],
  [86, 73],
  [50, 95],
  [14, 73],
  [14, 28],
  [50, 50],
];
const names = [
  "góra",
  "prawy górny",
  "prawy dolny",
  "dół",
  "lewy dolny",
  "lewy górny",
  "środek",
];
function round(saved: SavedProgress, previous?: number) {
  const { level, epoch } = saved.matches;
  const start = puzzle(level, Math.random, previous);
  return { start, level, epoch: epoch ?? 0 };
}
export function Matches({
  saved,
  disabled,
  settled,
  dispatch,
}: {
  saved: SavedProgress;
  disabled: boolean;
  settled?: string;
  dispatch: (a: SettingsAction) => Promise<boolean>;
}) {
  const [task, setTask] = useState(() => round(saved));
  const [moves, setMoves] = useState<number[]>([]);
  const board = moves.at(-1) ?? task.start;
  const [selected, select] = useState<number>();
  const [hover, setHover] = useState<number>();
  const [pointer, setPointer] = useState<{
    x: number;
    y: number;
    vertical: boolean;
  }>();
  const drag = useRef<{ bit: number; x: number; y: number } | null>(null);
  const [hint, setHint] = useState<number>();
  const [helped, setHelped] = useState(false);
  const [message, say] = useState("");
  const [pending, setPending] = useState<{ id: string; reveal: boolean }>();
  const [shown, setShown] = useState(0);
  const limit = task.level;
  const locked = disabled || !!pending;
  function finish(skipped: boolean) {
    const id = crypto.randomUUID();
    setPending({ id, reveal: skipped && saved.showSolution });
    select(undefined);
    setHint(undefined);
    void dispatch({
      type: "matchResult",
      id,
      epoch: task.epoch,
      outcome: { skipped, corrections: helped ? 1 : 0 },
    });
  }
  function next() {
    setTask(round(saved, task.start));
    setMoves([]);
    setHelped(false);
    setPending(undefined);
    setShown(0);
    say("");
    select(undefined);
    setHint(undefined);
  }
  useEffect(() => {
    if (!pending || settled !== pending.id || pending.reveal) return;
    const timer = setTimeout(next, 550);
    return () => clearTimeout(timer);
  });
  function move(from: number, to: number) {
    if (locked || moves.length >= limit || from === to || board & (1 << to))
      return;
    const after = board ^ (1 << from) ^ (1 << to);
    setMoves([...moves, after]);
    select(undefined);
    setHint(undefined);
    if (solved(after)) {
      say("Dobrze!");
      finish(false);
    } else
      say(
        moves.length + 1 === limit
          ? "Spróbuj inaczej. Cofnij ruch."
          : "Przełóż jeszcze jedną zapałkę.",
      );
  }
  const reveal = pending?.reveal && pending.id === settled;
  let display = reveal ? task.start : board;
  if (reveal) {
    const goal = target(task.start, limit)!;
    for (let i = 0; i < shown; i++) display = step(display, goal);
  }
  function slot(
    bit: number,
    x: number,
    y: number,
    vertical: boolean,
    label: string,
  ) {
    const active = !!(display & (1 << bit));
    return (
      <button
        key={bit}
        data-bit={bit}
        disabled={
          locked ||
          moves.length === limit ||
          (!active && selected === undefined)
        }
        className={[
          "matchSlot",
          vertical ? "vertical" : "horizontal",
          active ? "occupied" : "empty",
          selected === bit || hint === bit ? "marked" : "",
          hover === bit ? "over" : "",
        ].join(" ")}
        style={{ left: x + "%", top: y + "%" }}
        aria-label={label + (active ? " — zapałka" : " — wolne miejsce")}
        aria-pressed={selected === bit}
        onPointerDown={(e) => {
          if (active) {
            drag.current = { bit, x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
            select(bit);
          }
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const dest = document
              .elementFromPoint(e.clientX, e.clientY)
              ?.closest<HTMLElement>("[data-bit]");
            setPointer({
              x: e.clientX,
              y: e.clientY,
              vertical: dest?.classList.contains("vertical") ?? vertical,
            });
            setHover(dest ? Number(dest.dataset.bit) : undefined);
          }
        }}
        onPointerCancel={() => {
          setPointer(undefined);
          drag.current = null;
          setHover(undefined);
          select(undefined);
        }}
        onPointerUp={(e) => {
          setPointer(undefined);
          const start = drag.current;
          drag.current = null;
          setHover(undefined);
          if (!start) return;
          if (Math.hypot(start.x - e.clientX, start.y - e.clientY) > 5) {
            const dest = document
              .elementFromPoint(e.clientX, e.clientY)
              ?.closest<HTMLElement>("[data-bit]");
            if (dest) move(start.bit, Number(dest.dataset.bit));
            select(undefined);
          }
        }}
        onClick={(e) => {
          if (active) {
            if (e.detail === 0) select(bit);
          } else if (selected !== undefined) move(selected, bit);
        }}
      >
        <i />
      </button>
    );
  }
  function digit(index: number) {
    return (
      <div className="matchDigit">
        {positions.map(([x, y], i) =>
          slot(
            index * 7 + i,
            x,
            y,
            ![0, 3, 6].includes(i),
            ["Pierwsza cyfra", "Druga cyfra", "Wynik"][index] + ", " + names[i],
          ),
        )}
      </div>
    );
  }
  return (
    <section className="matches">
      <h1>Zapałki</h1>
      <p>
        {limit === 1 ? "Przełóż jedną zapałkę" : "Przełóż dwie zapałki"}, żeby
        równanie było prawdziwe.
      </p>
      <div className="matchBoard">
        {digit(0)}
        <div className="matchDigit operator">
          <span>−</span>
          {slot(plusBit, 50, 50, true, "Znak działania")}
        </div>
        {digit(1)}
        <span>=</span>
        {digit(2)}
      </div>
      {pointer && (
        <i
          aria-hidden="true"
          className="draggedMatch"
          style={{
            left: pointer.x,
            top: pointer.y,
            rotate: pointer.vertical ? "90deg" : "0deg",
          }}
        />
      )}
      <p role="status">
        {reveal ? "Rozwiązanie · ruch " + shown + " z " + limit : message}
      </p>
      {reveal ? (
        <button onClick={() => (shown < limit ? setShown(shown + 1) : next())}>
          {shown < limit ? "Pokaż ruch" : "Dalej"}
        </button>
      ) : (
        <div className="matchActions">
          <button
            disabled={locked || !moves.length}
            onClick={() => {
              setMoves(moves.slice(0, -1));
              say("");
              select(undefined);
              setHint(undefined);
            }}
          >
            Cofnij
          </button>
          <button
            disabled={locked}
            onClick={() => {
              setHelped(true);
              const goal = target(board, limit - moves.length);
              if (goal === undefined) {
                say("Cofnij ostatni ruch.");
                return;
              }
              setHint(firstBit(board & ~goal));
              say("Przełóż wyróżnioną zapałkę.");
            }}
          >
            Podpowiedz
          </button>
          <button disabled={locked} onClick={() => finish(true)}>
            Pomiń
          </button>
        </div>
      )}
    </section>
  );
}
