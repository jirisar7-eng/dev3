import React from 'react';

interface AdminCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function AdminCard({ title, description, children, className = '', headerAction }: AdminCardProps) {
  return (
    <div className={`bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col min-w-0 ${className}`}>
      {(title || description || headerAction) && (
        <div className="p-4 sm:p-5 border-b border-[var(--admin-border)] bg-[var(--admin-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {title && <h3 className="font-extrabold text-sm text-[var(--admin-primary)] truncate">{title}</h3>}
            {description && <p className="text-xs text-[var(--admin-text-muted)] mt-1">{description}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5 flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
