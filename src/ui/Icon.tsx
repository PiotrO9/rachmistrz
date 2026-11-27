export type IconName =
  "arrow" | "download" | "menu" | "close" | "trend" | "flag" | "equal" | "help";
export function Icon({ name }: { name: IconName }) {
  const paths = {
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.8-2.5 2-2.5 4" />
        <circle cx="12" cy="16.5" r=".9" fill="currentColor" stroke="none" />
      </>
    ),
    trend: <path d="m3 17 6-6 4 3 8-10m-6 0h6v6" />,
    flag: <path d="M5 21V4c5-4 9 4 15 0v10c-6 4-10-4-15 0" />,
    equal: <path d="M5 9h14M5 15h14" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4" />
      </>
    ),
  };
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
