import { useState, type FormEvent } from "react";

export interface SearchBarProps {
  onSubmit: (query: string) => void;
  initialQuery?: string;
}

/**
 * Søket trigges eksplisitt ved submit (Enter eller søkeknapp) — det søkes
 * ikke mens man skriver (se docs/design.md#søkeflyt-tekst-og-tale).
 */
export function SearchBar({ onSubmit, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed === "") return;
    onSubmit(trimmed);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="search-input" className="sr-only">
        Søk etter film eller serie
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        placeholder="Søk etter film eller serie …"
        className="w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-slate-600"
      />
      <button
        type="submit"
        aria-label="Søk"
        className="rounded-md bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
      >
        Søk
      </button>
    </form>
  );
}
