import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

interface Options {
  sequence: number;
  revealed?: boolean;
  canInteract: boolean;
  busy: boolean;
  onInput: (value: string, inputType: string) => Promise<boolean>;
  onSkip: () => Promise<boolean>;
}

export function useAnswerInput({
  sequence,
  revealed,
  canInteract,
  busy,
  onInput,
  onSkip,
}: Options) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) input.current?.focus();
  }, [sequence]);
  useEffect(() => {
    const captureDigit = (event: globalThis.KeyboardEvent) => {
      const field = input.current;
      if (
        !field ||
        !canInteract ||
        busy ||
        revealed ||
        event.defaultPrevented ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        !/^[0-9]$/.test(event.key) ||
        event.target === field
      )
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="dialog"], dialog',
        )
      )
        return;
      event.preventDefault();
      field.focus({ preventScroll: true });
      field.setSelectionRange(field.value.length, field.value.length);
      void onInput(field.value + event.key, "insertText");
    };
    window.addEventListener("keydown", captureDigit);
    return () => window.removeEventListener("keydown", captureDigit);
  }, [canInteract, busy, revealed, onInput]);

  return {
    input,
    onPointerDown: (event: PointerEvent<HTMLInputElement>) => {
      if (event.pointerType === "mouse") event.preventDefault();
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (!e.repeat && canInteract) void onSkip();
      }
    },
    skipAndFocus: () => {
      void onSkip();
      input.current?.focus();
    },
  };
}
