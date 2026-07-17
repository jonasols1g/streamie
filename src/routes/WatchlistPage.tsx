import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { WatchlistItemCard } from "../components/watchlist/WatchlistItemCard";
import { WatchlistTabs } from "../components/watchlist/WatchlistTabs";
import { useWatchlist } from "../context/WatchlistContext";
import type { WatchlistStatus } from "../types/watchlist";

const EMPTY_MESSAGE: Record<WatchlistStatus, string> = {
  planned: "Du har ikke lagt til noe du planlegger å se ennå.",
  watched: "Du har ikke merket noe som sett ennå.",
};

const searchLink = (
  <Link
    to="/"
    className="bg-brand-gradient rounded-2xl px-4 py-2 font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
  >
    Søk etter titler
  </Link>
);

/**
 * Watchlist-siden (se docs/design.md#watchlist-ux og
 * docs/design-spec/screenshots/04-watchlist.png): to faner ("Planlagt" /
 * "Sett") som filtrerer `WatchlistItem`-listen på status, med egen
 * tom-tilstand per fane.
 *
 * Skjermbildet viser sidetittelen som "Min liste" — sidens `<h1>` beholder
 * derimot teksten "Watchlist" uendret, fordi den treffes eksplisitt av
 * `App.test.tsx` og det beskyttede e2e/deep-links.spec.ts
 * (`getByRole("heading", { name: "Watchlist" })`), som ikke skal måtte
 * endres for denne rene restylingen.
 */
export function WatchlistPage() {
  const { items } = useWatchlist();
  const [activeTab, setActiveTab] = useState<WatchlistStatus>("planned");

  const planned = items.filter((item) => item.status === "planned");
  const watched = items.filter((item) => item.status === "watched");
  const visibleItems = activeTab === "planned" ? planned : watched;

  return (
    <section>
      {/*
        h1 må beholde nøyaktig teksten "Watchlist" (ingen antall inni) for at
        accessible name skal forbli "Watchlist" — App.test.tsx og
        e2e/deep-links.spec.ts treffer eksakt på dette. Antallet vises som en
        søskennode ved siden av, ikke inni overskriften.
      */}
      <div className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl font-bold">Watchlist</h1>
        <span className="text-text-muted text-base font-normal">
          {items.length}
        </span>
      </div>

      <div className="mt-4">
        <WatchlistTabs
          active={activeTab}
          onChange={setActiveTab}
          plannedCount={planned.length}
          watchedCount={watched.length}
        />
      </div>

      <div
        className="mt-6"
        role="tabpanel"
        id="watchlist-tabpanel"
        aria-labelledby={`watchlist-tab-${activeTab}`}
        tabIndex={-1}
      >
        {visibleItems.length === 0 ? (
          <EmptyState message={EMPTY_MESSAGE[activeTab]} action={searchLink} />
        ) : (
          <div className="flex flex-col gap-3">
            {visibleItems.map((item) => (
              <WatchlistItemCard key={item.mediaId} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
