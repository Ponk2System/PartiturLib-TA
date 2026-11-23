import { useState, useEffect, useCallback } from 'react'
import scoreService from '../services/scoreService'
import {
  getCachedScores,
  setCachedScores,
  getCachedScoreById,
  setCachedScoreById,
  invalidateScoresCache,
} from '../utils/queryCache'

export { invalidateScoresCache }

// ---------------------------------------------------------------------------
// useScores — fetch the paginated / filtered sheet music list from Supabase/cache.
// Returns { scores, loading, error, pagination, refetch }.
// ---------------------------------------------------------------------------
export function useScores(params = {}) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  const paramKey = JSON.stringify(params)

  const fetchScores = useCallback(async (options = {}) => {
    const force = options?.force === true

    if (!force) {
      const cached = getCachedScores(paramKey)
      if (cached) {
        setScores(cached.data || [])
        setPagination(cached.pagination || null)
        setError(null)
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await scoreService.getScores(params)

      if (response.success) {
        const data = response.data || []
        const pageInfo = response.pagination || null
        setScores(data)
        setPagination(pageInfo)
        setCachedScores(paramKey, data, pageInfo)
      } else {
        setError(response.message || 'Gagal memuat daftar partitur.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat partitur.')
      setScores([])
    } finally {
      setLoading(false)
    }
  }, [paramKey, params])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  return {
    scores,
    guns: scores, // Compatibility alias
    loading,
    error,
    pagination,
    refetch: (options) => fetchScores(options),
  }
}

// ---------------------------------------------------------------------------
// useScore — fetch a single score by ID.
// ---------------------------------------------------------------------------
export function useScore(id) {
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchScore = useCallback(async (options = {}) => {
    if (!id) {
      setScore(null)
      setLoading(false)
      return
    }

    const force = options?.force === true

    if (!force) {
      const cached = getCachedScoreById(id)
      if (cached) {
        setScore(cached)
        setError(null)
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await scoreService.getScoreById(id)

      if (response.success) {
        setScore(response.data)
        setCachedScoreById(id, response.data)
      } else {
        setError(response.message || 'Partitur tidak ditemukan.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat detail partitur.')
      setScore(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchScore()
  }, [fetchScore])

  return {
    score,
    gun: score, // Compatibility alias
    loading,
    error,
    refetch: (options) => fetchScore(options),
  }
}

// Compatibility exports
export const useGuns = useScores
export const useGun = useScore
