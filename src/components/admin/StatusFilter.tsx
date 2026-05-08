interface StatusFilterOption<T extends string> {
  value: T;
  label: string;
}

interface StatusFilterProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: StatusFilterOption<T>[];
  label: string;
}

export default function StatusFilter<T extends string>({ value, onChange, options, label }: StatusFilterProps<T>) {
  return (
    <label className="block min-w-[160px]">
      {label && <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
