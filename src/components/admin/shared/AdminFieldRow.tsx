import React from 'react';

interface AdminFieldRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminFieldRow({ label, description, children, className = '' }: AdminFieldRowProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-slate-300 transition-colors ${className}`}>
      <div className="flex-1 min-w-0 pr-4">
        <div className="font-bold text-xs text-[var(--admin-primary)] uppercase tracking-wide truncate">{label}</div>
        {description && <div className="text-[10px] text-[var(--admin-text-muted)] mt-1 truncate">{description}</div>}
      </div>
      <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 flex items-center">
        {children}
      </div>
    </div>
  );
}
