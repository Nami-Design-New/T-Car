import { ReactNode } from 'react';

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
}

export default function FilterPanel({
  title = 'تصفية النتائج',
  children,
}: FilterPanelProps) {
  return (
    <aside className="filters_panel">
      <div className="filter_header">
        <h3>{title}</h3>
      </div>
      {children}
    </aside>
  );
}