import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ className = "", label, id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className={`mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 ${className}`}
        {...props}
      />
    </label>
  );
}
