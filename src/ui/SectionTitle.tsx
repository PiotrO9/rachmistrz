import type { ReactNode } from "react";
export function SectionTitle({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="sectionTitle">
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}
