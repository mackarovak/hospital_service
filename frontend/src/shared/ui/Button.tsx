import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "inverse" | "onDark";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variantClass = {
    primary: "bg-sky-700 text-white shadow-sm shadow-sky-900/20 hover:bg-sky-800",
    secondary: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    inverse: "bg-sky-50 text-sky-900 shadow-sm shadow-sky-900/10 hover:bg-sky-100",
    onDark: "border border-sky-200 bg-white text-sky-800 hover:bg-sky-50",
  }[variant];

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    />
  );
}
