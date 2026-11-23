// ---------------------------------------------------------------------------
// queryCache.js — In-memory query caching store with TTL support.
// Used by useScores and scoreService to cache catalog responses and invalidate
// them automatically on score mutations.
// ---------------------------------------------------------------------------

const scoresCache = new Map()
const singleScoreCache = new Map()
export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes TTL

export function getCachedScores(key) {
  if (!scoresCache.has(key)) return null
  const entry = scoresCache.get(key)
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    scoresCache.delete(key)
    return null
  }
  return entry
}

export function setCachedScores(key, data, pagination) {
  scoresCache.set(key, {
    data,
    pagination,
    timestamp: Date.now(),
  })
}

export function getCachedScoreById(id) {
  if (!singleScoreCache.has(id)) return null
  const entry = singleScoreCache.get(id)
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    singleScoreCache.delete(id)
    return null
  }
  return entry.data
}

export function setCachedScoreById(id, data) {
  singleScoreCache.set(id, {
    data,
    timestamp: Date.now(),
  })
}

export function invalidateScoresCache() {
  scoresCache.clear()
  singleScoreCache.clear()
}

// Backward compatibility exports
export const getCachedGuns = getCachedScores
export const setCachedGuns = setCachedScores
export const getCachedGunById = getCachedScoreById
export const setCachedGunById = setCachedScoreById
export const invalidateGunsCache = invalidateScoresCache
