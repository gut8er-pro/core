// Two-tier AI result cache.
//
// Layer 1: in-memory Map keyed by photoId+operation. Survives within a
// process; very fast. Used by analyzers via getCacheKey/getCachedResult/
// setCachedResult — these names are kept for backwards compatibility with
// existing analyzer code.
//
// Layer 2: Postgres `AiResult` table keyed by (contentHash, operation,
// locale, promptVersion). Survives restarts; deduplicates AI calls across
// different reports that contain the same image. Accessed only via
// `withAiCache` which is the new preferred entry point.
//
// Pre-warming: at the start of each Generate run the pipeline calls
// `prewarmFromDb()` to copy any matching DB rows into the in-memory map for
// the photos being processed. Analyzers then transparently hit the in-mem
// cache without knowing about the DB layer.

import { prisma } from '@/lib/prisma'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour for in-memory entries

type CacheEntry<T = unknown> = {
	value: T
	expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function getCacheKey(photoId: string, operation: string): string {
	return `${photoId}:${operation}`
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

/**
 * Persist a freshly-computed AI result to the DB so future runs (after
 * server restart, or on a different image with the same content) can skip
 * the API call. Best-effort — errors are logged but don't fail the call.
 */
async function persistToDb(params: {
	contentHash: string
	operation: string
	locale: string
	promptVersion: number
	result: unknown
}): Promise<void> {
	const { contentHash, operation, locale, promptVersion, result } = params
	if (!contentHash) return
	try {
		await prisma.aiResult.upsert({
			where: {
				contentHash_operation_locale_promptVersion: {
					contentHash,
					operation,
					locale,
					promptVersion,
				},
			},
			create: {
				contentHash,
				operation,
				locale,
				promptVersion,
				result: result as object,
			},
			update: {
				result: result as object,
			},
		})
	} catch (err) {
		console.warn('[ai-cache] Failed to persist AI result:', err)
	}
}

/**
 * Pre-warm the in-memory cache from DB for a batch of photos that are about
 * to be processed. Call once at the start of `runPipeline`. Subsequent
 * `getCachedResult` calls inside analyzers will hit transparently.
 *
 * Returns the number of cache entries loaded, for telemetry.
 */
async function prewarmFromDb(
	entries: Array<{
		photoId: string
		contentHash: string | null
		operation: string
		locale: string // empty string if locale-agnostic
		promptVersion: number
	}>,
): Promise<number> {
	const eligible = entries.filter((e) => e.contentHash)
	if (eligible.length === 0) return 0

	// Single OR query covers all (contentHash, op, locale, version) combinations.
	const rows = await prisma.aiResult.findMany({
		where: {
			OR: eligible.map((e) => ({
				contentHash: e.contentHash as string,
				operation: e.operation,
				locale: e.locale,
				promptVersion: e.promptVersion,
			})),
		},
	})

	// Build a lookup so we can find each row's matching entry (and its photoId)
	const rowKey = (r: {
		contentHash: string
		operation: string
		locale: string
		promptVersion: number
	}) => `${r.contentHash}|${r.operation}|${r.locale}|${r.promptVersion}`
	const rowsByKey = new Map(rows.map((r) => [rowKey(r), r]))

	let loaded = 0
	for (const entry of eligible) {
		const r = rowsByKey.get(
			`${entry.contentHash}|${entry.operation}|${entry.locale}|${entry.promptVersion}`,
		)
		if (!r) continue
		// Build the in-mem cache key the same way the analyzer does. Locale-aware
		// analyzers append `:${locale}` to their op string when calling getCacheKey,
		// so the key shape is `${photoId}:${operation}` or
		// `${photoId}:${operation}:${locale}` depending on the analyzer.
		const memKey = entry.locale
			? getCacheKey(entry.photoId, `${entry.operation}:${entry.locale}`)
			: getCacheKey(entry.photoId, entry.operation)

		// Stale `photoId` rewrite: persisted rows carry the photoId of the photo
		// that originally produced the row. When a different report reuses that
		// content (same contentHash, new photo record), downstream code keys off
		// `result.photoId` to map back to the live photo — so we rebind it to the
		// current photoId before priming the in-mem cache.
		const value =
			r.result && typeof r.result === 'object' && !Array.isArray(r.result)
				? { ...(r.result as Record<string, unknown>), photoId: entry.photoId }
				: r.result
		setCachedResult(memKey, value)
		loaded++
	}
	return loaded
}

/**
 * Persist multiple results to DB after a pipeline run. Each entry is the
 * tuple needed to identify and store one AI result. Errors per-entry are
 * swallowed so the rest still get saved.
 */
async function persistResultsToDb(
	entries: Array<{
		contentHash: string | null
		operation: string
		locale: string
		promptVersion: number
		result: unknown
	}>,
): Promise<number> {
	const eligible = entries.filter((e) => e.contentHash)
	let saved = 0
	await Promise.all(
		eligible.map(async (e) => {
			try {
				await persistToDb({
					contentHash: e.contentHash as string,
					operation: e.operation,
					locale: e.locale,
					promptVersion: e.promptVersion,
					result: e.result,
				})
				saved++
			} catch {
				// already logged inside persistToDb
			}
		}),
	)
	return saved
}

export {
	CACHE_TTL_MS,
	getCachedResult,
	getCacheKey,
	persistResultsToDb,
	prewarmFromDb,
	setCachedResult,
}
