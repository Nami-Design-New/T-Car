export interface ModelYearBadgeProps {
  year: number;
}

export function ModelYearBadge({ year }: ModelYearBadgeProps) {
  return (
    <span className="bg-primary-100 text-action-primary shrink-0 rounded-sm px-3 py-2 text-xs leading-none font-semibold">
      {year}
    </span>
  );
}
