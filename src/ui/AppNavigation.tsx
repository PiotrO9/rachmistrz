import { useNavigationDrawer } from "./useNavigationDrawer";
import type { AppView } from "../app-view";
import { Icon } from "./Icon";

export function AppNavigation({
  view,
  matches,
  onNavigate,
}: {
  matches: boolean;
  view: AppView;
  onNavigate: (view: AppView) => void;
}) {
  const { open, setOpen, drawer, toggle, ...drawerEvents } =
    useNavigationDrawer();

  const navigate = (next: AppView) => {
    setOpen(false);
    onNavigate(next);
  };
  const tabs = (
    [
      { id: "game", name: "Trening" },
      ...(matches ? [{ id: "matches", name: "Zapałki" } as const] : []),
      { id: "settings", name: "Ustawienia" },
      { id: "history", name: "Historia" },
    ] as const
  ).map((tab) => (
    <button
      key={tab.id}
      className={view === tab.id ? "active" : ""}
      aria-current={view === tab.id ? "page" : undefined}
      onClick={() => navigate(tab.id)}
    >
      {tab.name}
    </button>
  ));

  return (
    <div className="appNavigation">
      <header className="header">
        <a
          className="brand"
          href="./"
          onClick={(event) => {
            event.preventDefault();
            navigate("game");
          }}
          aria-label="Rachmistrz — wróć do gry"
        >
          <span className="brandMark">
            r<span>·</span>
          </span>
          <span>rachmistrz</span>
        </a>
        <span className="headerNote">Trening liczenia w pamięci</span>
        <button
          className="menuToggle"
          ref={toggle}
          aria-label="Otwórz menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </header>
      <nav
        className="navigation desktopNavigation"
        aria-label="Główna nawigacja"
      >
        {tabs}
      </nav>
      <dialog
        id="mobile-navigation"
        className="navigationDrawer"
        ref={drawer}
        aria-labelledby="menu-title"
        onCancel={() => setOpen(false)}
        onKeyDown={drawerEvents.onKeyDown}
        onClick={drawerEvents.onClick}
      >
        <div className="drawerHeader">
          <span id="menu-title">Menu</span>
          <button
            className="drawerClose"
            aria-label="Zamknij menu"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav
          className="navigation mobileNavigation"
          aria-label="Główna nawigacja"
        >
          {tabs}
        </nav>
      </dialog>
    </div>
  );
}
