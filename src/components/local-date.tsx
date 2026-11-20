"use client";
// Shows a date in the viewer's own time zone (the server runs in UTC).
export function LocalDate({ iso, withTime = false }: { iso: string; withTime?: boolean }) {
  const d = new Date(iso);
  const text = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
