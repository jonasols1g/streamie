/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OMDb API-nøkkel (søk og titteldata). Se docs/architecture.md#datakilder. */
  readonly VITE_OMDB_API_KEY: string;
  /** Movie of the Night API-nøkkel (strømmetilgjengelighet). */
  readonly VITE_MOTN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
