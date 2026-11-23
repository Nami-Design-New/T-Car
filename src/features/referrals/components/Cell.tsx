export default function Cell({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <span className="flex items-center justify-between gap-0.5 text-sm">
      {/* Shown on mobile; on desktop the header row names the column. */}
      <span className="text-text-subtle text-xs">{label}</span>
      <span className="text-text-primary text-xs font-semibold">
        {children}
      </span>
    </span>
  );
}
