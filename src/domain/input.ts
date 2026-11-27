export function correction(
  previous: string,
  next: string,
  editing: boolean,
  inputType = "",
) {
  if (next === previous) return { increment: 0, editing };
  if (inputType === "toggleSign" && !previous.startsWith("-"))
    return { increment: 0, editing: false };
  const removal =
    next.length < previous.length || inputType.startsWith("delete");
  const replacement =
    previous.length > 0 && !next.startsWith(previous) && !removal;
  if (removal) return { increment: editing ? 0 : 1, editing: true };
  return { increment: replacement && !editing ? 1 : 0, editing: false };
}
