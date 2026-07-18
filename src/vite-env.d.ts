/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OMDb API-nøkkel (søk og titteldata). Se docs/architecture.md#datakilder. */
  readonly VITE_OMDB_API_KEY: string;
  /** Movie of the Night API-nøkkel (strømmetilgjengelighet). */
  readonly VITE_MOTN_API_KEY: string;
  /**
   * Firebase-prosjektkonfigurasjon (DB-migrering, se
   * docs/plans/watchlist-database-migrering.md). Brukes av
   * `src/services/auth/firebaseClient.ts`.
   */
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
