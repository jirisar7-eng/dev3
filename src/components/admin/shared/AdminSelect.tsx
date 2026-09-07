import React from 'react';

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function AdminSelect({ options, className = '', ...props }: AdminSelectProps) {
  return (
    <select
      className={`w-full md:w-auto max-w-full appearance-none bg-[var(--admin-surface-muted)] border border-[var(--admin-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--admin-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-info)] focus:border-transparent cursor-pointer truncate pr-8 bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[position:right_10px_center] ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
