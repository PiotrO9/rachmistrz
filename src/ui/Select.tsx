import { Icon, type IconName } from "./Icon";
import { FieldLabel } from "./FieldLabel";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface Option<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  shortLabel?: string;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
}
interface Props<T extends string | number> {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  renderValue?: (value: T) => ReactNode;
  disabled?: boolean;
  label?: string;
  fieldHelp?: string;
  compact?: boolean;
}
export function Select<T extends string | number>({
  id,
  value,
  onChange,
  options,
  disabled = false,
  label,
  fieldHelp,
  compact = false,
  renderValue,
}: Props<T>) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null),
    restoreFocus = useRef(false),
    ignoreDismissClick = useRef(false);
  // A persisted selection briefly disables its trigger. Restore keyboard focus after that save.
  useEffect(() => {
    if (disabled || !restoreFocus.current) return;
    const frame = requestAnimationFrame(() => {
      if (
        document.activeElement === document.body ||
        document.activeElement === trigger.current
      )
        trigger.current?.focus();
      restoreFocus.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [disabled, value]);
  const selected = options.find((option) => option.value === value);
  const control = (
    <SelectPrimitive.Root
      value={String(value)}
      onOpenChange={(open) => {
        if (open) setDialog(trigger.current?.closest("dialog") ?? null);
      }}
      disabled={disabled}
      onValueChange={(next) => {
        restoreFocus.current = true;
        const option = options.find((option) => String(option.value) === next);
        if (option) onChange(option.value);
      }}
    >
      <SelectPrimitive.Trigger
        ref={trigger}
        id={id}
        aria-label={label}
        className={`selectTrigger${compact ? " selectCompact" : ""}`}
        onPointerDown={() => {
          ignoreDismissClick.current = false;
        }}
        onKeyDown={() => {
          ignoreDismissClick.current = false;
        }}
        onClick={(event) => {
          // Dismissing on touch pointerdown can send the same gesture's click
          // to this trigger after Radix removes its outside-pointer lock.
          if (ignoreDismissClick.current) {
            event.preventDefault();
            ignoreDismissClick.current = false;
          }
        }}
      >
        <SelectPrimitive.Value>
          {renderValue?.(value) ??
            (selected?.icon ? (
              <span className="selectIconValue">
                <span className="selectOptionIcon">
                  <Icon name={selected.icon} />
                </span>
                <span>{selected.shortLabel ?? selected.label}</span>
              </span>
            ) : (
              selected?.shortLabel
            ))}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <svg
            className="selectChevron"
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="m5 8 5 5 5-5" />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={dialog}>
        <SelectPrimitive.Content
          position="popper"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className={`selectMenu${compact ? " selectMenuCompact" : ""}`}
          aria-label={label}
          onPointerDownOutside={(event) => {
            ignoreDismissClick.current =
              event.detail.originalEvent.pointerType !== "mouse";
          }}
        >
          <SelectPrimitive.ScrollUpButton
            className="selectScroll"
            aria-hidden="true"
          >
            ⌃
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="selectViewport">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={String(option.value)}
                className="selectOption"
                textValue={option.label}
                aria-describedby={
                  option.description
                    ? id + "-description-" + option.value
                    : undefined
                }
              >
                {option.icon && (
                  <span className="selectOptionIcon">
                    <Icon name={option.icon} />
                  </span>
                )}
                {option.leading}
                <span className="selectOptionText">
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  {option.description && (
                    <span
                      id={id + "-description-" + option.value}
                      className="selectDescription"
                    >
                      {option.description}
                    </span>
                  )}
                </span>
                {option.trailing}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton
            className="selectScroll"
            aria-hidden="true"
          >
            ⌄
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
  return fieldHelp && label ? (
    <div className="selectField">
      <FieldLabel htmlFor={id} label={label} help={fieldHelp} />
      {control}
    </div>
  ) : (
    control
  );
}
