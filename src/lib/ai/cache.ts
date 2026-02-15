// In-memory AI result cache with TTL expiration.
// Caches results by "{photoUrl}:{operation}" key to avoid redundant Claude API calls.

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

type CacheEntry<T = unknown> = {
	value: T
	expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function getCacheKey(photoUrl: string, operation: string): string {
	return `${photoUrl}:${operation}`
}

function getCachedResult<T = unknown>(key: string): T | null {
	const entry = cache.get(key)
	if (!entry) return null

	if (Date.now() > entry.expiresAt) {
		cache.delete(key)
		return null
	}

	return entry.value as T
}

function setCachedResult<T = unknown>(key: string, value: T): void {
	cache.set(key, {
		value,
		expiresAt: Date.now() + CACHE_TTL_MS,
	})
}

export { getCacheKey, getCachedResult, setCachedResult, CACHE_TTL_MS }
