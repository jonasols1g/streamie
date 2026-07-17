export interface LoadingSpinnerProps {
  label?: string;
}

/**
 * Delt lastings-tilstand (se «Konsekvente tomme/lastings/feil-tilstander» i
 * docs/design.md). `role="status"` + `aria-live="polite"` gjør at
 * skjermlesere annonserer at noe laster uten å avbryte fokus.
 */
export function LoadingSpinner({ label = "Laster …" }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-8 text-slate-600"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
      />
      <span>{label}</span>
    </div>
  );
}
