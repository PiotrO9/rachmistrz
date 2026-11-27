import * as Popover from "@radix-ui/react-popover";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function FieldLabel({
  htmlFor,
  label,
  help,
}: {
  htmlFor: string;
  label: string;
  help: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const [mode, setMode] = useState<"hover" | "pinned" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverOnly = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  function show(next: "hover" | "pinned") {
    clearTimeout(timer.current);
    hoverOnly.current = next === "hover";
    setDialog(trigger.current?.closest("dialog") ?? null);
    setMode(next);
  }
  function leave() {
    clearTimeout(timer.current);
    if (mode === "hover") {
      timer.current = setTimeout(() => setMode(null), 180);
    }
  }
  return (
    <div className="fieldLabel">
      <label htmlFor={htmlFor}>{label}</label>
      <Popover.Root
        open={mode !== null}
        onOpenChange={(open) => (open ? show("pinned") : setMode(null))}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            ref={trigger}
            className="fieldHelp"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && mode !== "pinned")
                show("hover");
            }}
            onPointerLeave={leave}
            onClick={(event) => {
              if (mode === "hover") {
                event.preventDefault();
                show("pinned");
                panel.current?.focus();
              }
            }}
            aria-label={"Pomoc: " + label}
          >
            <Icon name="help" />
          </button>
        </Popover.Trigger>
        <Popover.Portal container={dialog}>
          <Popover.Content
            ref={panel}
            tabIndex={-1}
            aria-label={label}
            className="fieldHelpPanel"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            onPointerEnter={() => clearTimeout(timer.current)}
            onPointerLeave={leave}
            onCloseAutoFocus={(event) => {
              if (hoverOnly.current) event.preventDefault();
            }}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              if (!hoverOnly.current) panel.current?.focus();
            }}
          >
            <strong>{label}</strong>
            <p>{help}</p>
            <Popover.Arrow className="fieldHelpArrow" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
