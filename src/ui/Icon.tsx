export function Icon({
  name,
}: {
  name: "arrow" | "download" | "menu" | "close";
}) {
  const paths = {
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
