import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

// Keep this boundary aligned with navigation.css; E2E covers both sides.
const DESKTOP_QUERY = "(min-width: 651px)";

export function useNavigationDrawer() {
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = drawer.current!;
    const trigger = toggle.current;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = matchMedia(DESKTOP_QUERY);
    const resize = () => setOpen(false);
    desktop.addEventListener("change", resize);
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      desktop.removeEventListener("change", resize);
      if (!desktop.matches) trigger?.focus();
    };
  }, [open]);

  return {
    open,
    setOpen,
    drawer,
    toggle,
    onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => {
      if (event.key !== "Tab") return;
      const buttons =
        event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        setOpen(false);
    },
  };
}
