import type { ReactNode } from "react";

export interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

/**
 * Delt tom-tilstand (se «Konsekvente tomme/lastings/feil-tilstander» i
 * docs/design.md), f.eks. søk uten treff eller en tom watchlist-fane.
 */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="text-text-muted flex flex-col items-center gap-3 py-8 text-center">
      <p>{message}</p>
      {action}
    </div>
  );
}
