import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-sky-700 text-white hover:bg-sky-800"
      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50";

  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition ${variantClass} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
