'use client';

interface Option {
  value: string;
  label: string;
}

interface Props
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: Option[];
  required?: boolean;
  error?: string;
}

export default function FormSelect({
  id,
  label,
  options,
  required,
  error,
  ...props
}: Props) {
  return (
    <div className="form_group">
      <label htmlFor={id} className="form_label">
        {label}
        {required && <span>*</span>}
      </label>

      <select
        id={id}
        className="form_select"
        {...props}
      >
        <option value="">
          اختر...
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="form_error">
          {error}
        </span>
      )}
    </div>
  );
}