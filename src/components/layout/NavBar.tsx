import type { AriaAttributes } from "react";
import { NavLink } from "react-router-dom";

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-1 px-4 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
    isActive
      ? "text-brand-magenta"
      : "text-text-muted hover:text-text-primary focus-visible:text-text-primary"
  }`;

/**
 * Vises på alle sider med lenker til Hjem og Watchlist (se design.md).
 *
 * Visuelt en fast bunn-fanebar (se
 * docs/design.md#visuelt-tema-cinefind-fase-11 og skjermbildene i
 * docs/design-spec/screenshots/): samme to ruter (`/`, `/mylist`) som før,
 * kun visuell endring. Fanen til `/` heter "Søk" (ikke "Hjem") iht.
 * skjermbildene — det synlige teksten er også lenkens tilgjengelige navn
 * (ingen `aria-label`-mismatch), så `App.test.tsx` er oppdatert tilsvarende.
 * Lenken til `/mylist` heter fortsatt "Watchlist", uendret fra før, og
 * treffes av samme `getByRole("link", { name: "Watchlist" })` som i
 * e2e/watchlist.spec.ts.
 */
export function NavBar() {
  return (
    <nav
      aria-label="Hovedmeny"
      className="border-surface-border/40 bg-surface fixed inset-x-0 bottom-0 z-10 flex h-[78px] items-center justify-around border-t backdrop-blur-md"
    >
      <NavLink to="/" end className={linkClassName}>
        <SearchIcon aria-hidden="true" />
        <span>Søk</span>
      </NavLink>
      <NavLink to="/mylist" className={linkClassName}>
        <StarIcon aria-hidden="true" />
        <span>Watchlist</span>
      </NavLink>
    </nav>
  );
}

function SearchIcon(props: { "aria-hidden"?: AriaAttributes["aria-hidden"] }) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function StarIcon(props: { "aria-hidden"?: AriaAttributes["aria-hidden"] }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2.5l2.9 6.06 6.6.77-4.9 4.55 1.27 6.53L12 17.6l-5.87 3.31 1.27-6.53-4.9-4.55 6.6-.77Z" />
    </svg>
  );
}
