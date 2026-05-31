import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/70 ${className}`}
      {...props}
    />
  );
}
