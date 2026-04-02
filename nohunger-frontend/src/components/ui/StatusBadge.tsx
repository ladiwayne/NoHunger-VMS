import React from 'react';

type BadgeVariant =
  | 'active'
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'checked-in'
  | 'checked-out'
  | 'in-progress'
  | 'logged';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-[hsl(142,72%,92%)] text-[hsl(142,72%,20%)] border-[hsl(142,72%,72%)]',
  upcoming: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-warning/12 text-warning border-warning/20',
  accepted: 'bg-[hsl(142,72%,92%)] text-[hsl(142,72%,20%)] border-[hsl(142,72%,72%)]',
  declined: 'bg-destructive/10 text-destructive border-destructive/20',
  'checked-in': 'bg-[hsl(142,72%,92%)] text-[hsl(142,72%,20%)] border-[hsl(142,72%,72%)]',
  'checked-out': 'bg-muted text-muted-foreground border-border',
  'in-progress': 'bg-primary/10 text-primary border-primary/30',
  logged: 'bg-muted text-muted-foreground border-border',
};

const defaultLabels: Record<BadgeVariant, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  'checked-in': 'Checked In',
  'checked-out': 'Checked Out',
  'in-progress': 'In Progress',
  logged: 'Logged',
};

const dotColors: Record<BadgeVariant, string> = {
  active: 'bg-[hsl(142,72%,29%)] animate-pulse',
  upcoming: 'bg-primary',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
  pending: 'bg-warning animate-pulse',
  accepted: 'bg-[hsl(142,72%,29%)]',
  declined: 'bg-destructive',
  'checked-in': 'bg-[hsl(142,72%,29%)] animate-pulse',
  'checked-out': 'bg-muted-foreground',
  'in-progress': 'bg-primary animate-pulse',
  logged: 'bg-muted-foreground',
};

export default function StatusBadge({ variant, label, size = 'md' }: StatusBadgeProps) {
  const displayLabel = label || defaultLabels[variant];
  const sizeClass =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-[11px] px-2 py-1 gap-1.5';

  return (
    <span
      className={`
      inline-flex items-center rounded-full border font-600 whitespace-nowrap
      ${variantStyles[variant]} ${sizeClass}
    `}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      {displayLabel}
    </span>
  );
}
