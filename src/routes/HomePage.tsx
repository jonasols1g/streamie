import { EmptyState } from "../components/common/EmptyState";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SearchBar } from "../components/search/SearchBar";
import { SearchResultsGrid } from "../components/search/SearchResultsGrid";
import { VoiceSearchButton } from "../components/search/VoiceSearchButton";
import { useMediaSearch } from "../hooks/useMediaSearch";

/**
 * Tekstsøk og talesøk (fase 8) går gjennom nøyaktig samme kodepath: begge
 * ender i dette `handleSearch(query)`-kallet (se
 * docs/design.md#søkeflyt-tekst-og-tale).
 */
export function HomePage() {
  const { status, results, errorCode, search, retry } = useMediaSearch();

  function handleSearch(query: string) {
    search(query);
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Søk</h1>
      <p className="mt-2 text-slate-600">
        Søk etter filmer og serier du vil legge til i watchlisten din.
      </p>

      <div className="mt-4 flex items-start gap-2">
        <div className="flex-1">
          <SearchBar onSubmit={handleSearch} />
        </div>
        <VoiceSearchButton onResult={handleSearch} />
      </div>

      <div className="mt-6">
        {status === "loading" && <LoadingSpinner label="Søker …" />}

        {status === "error" && errorCode !== null && (
          <ErrorMessage code={errorCode} onRetry={retry} />
        )}

        {status === "success" && results.length === 0 && (
          <EmptyState message="Ingen treff. Prøv et annet søk." />
        )}

        {status === "success" && results.length > 0 && (
          <SearchResultsGrid results={results} />
        )}
      </div>
    </section>
  );
}
