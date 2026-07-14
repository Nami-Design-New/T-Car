import { ReactNode } from 'react';

interface SectionTitleProps {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'left' | 'center';
}

export default function SectionTitle({ title, subtitle, align = 'center' }: SectionTitleProps) {
  return (
    <div className={`section-title ${align === 'center' ? 'is-center' : 'is-left'}`}>
      <h2 className="section-title-heading">{title}</h2>
      {subtitle && <p className="section-title-subtitle">{subtitle}</p>}
    </div>
  );
}
