export interface CacheEntry<T> {
  data: T;
  cachedAt: number; // epoch ms
  expiresAt: number; // epoch ms
}
