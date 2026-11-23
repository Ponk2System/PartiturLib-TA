import { useState, useEffect, useCallback } from 'react'
import favoriteService from '../services/favoriteService'
import { getUserIdentifier } from '../services/userService'

// ---------------------------------------------------------------------------
// localStorage fallback — used when the backend is unavailable so that
// favourites are still fully functional offline.
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'partiturlib_favorites'
const LEGACY_KEY = 'partiturlib_favorites'
const FAVORITES_UPDATED_EVENT = 'partiturlib_favorites_updated'

export function notifyFavoritesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT))
  }
}

const readLocalFavs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY) || localStorage.getItem(LEGACY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeLocalFavs = (ids) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
  } catch {
    /* quota exceeded — silently fail */
  }
}

// ---------------------------------------------------------------------------
// useFavorites — list all favourited score IDs.
// First attempts the server; on failure uses localStorage.
// ---------------------------------------------------------------------------

export function useFavorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLocal, setIsLocal] = useState(false)
  const userIdentifier = getUserIdentifier()

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await favoriteService.getFavorites(userIdentifier)

      if (response.success) {
        setFavorites(response.data || [])
        setIsLocal(false)
      } else {
        throw new Error(response.message)
      }
    } catch {
      // Fallback to localStorage
      setFavorites(readLocalFavs())
      setIsLocal(true)
    } finally {
      setLoading(false)
    }
  }, [userIdentifier])

  useEffect(() => {
    fetchFavorites()

    const handleUpdate = () => {
      fetchFavorites()
    }

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleUpdate)
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleUpdate)
    }
  }, [fetchFavorites])

  return { favorites, loading, error, isLocal, refetch: fetchFavorites }
}

// ---------------------------------------------------------------------------
// useToggleFavorite — toggle a score in/out of favourites.
// ---------------------------------------------------------------------------

export function useToggleFavorite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userIdentifier = getUserIdentifier()

  const toggleFavorite = async (scoreId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await favoriteService.toggleFavorite({
        score_id: scoreId,
        recipe_id: scoreId,
        user_identifier: userIdentifier,
      })

      if (response.success) {
        notifyFavoritesUpdated()
        return response.data
      }
      throw new Error(response.message)
    } catch {
      // Fallback: toggle in localStorage
      const current = readLocalFavs()
      const idx = current.findIndex((id) => String(id) === String(scoreId))
      let isFavorited

      if (idx === -1) {
        current.push(scoreId)
        isFavorited = true
      } else {
        current.splice(idx, 1)
        isFavorited = false
      }
      writeLocalFavs(current)
      notifyFavoritesUpdated()
      return { is_favorited: isFavorited }
    } finally {
      setLoading(false)
    }
  }

  return { toggleFavorite, loading, error }
}

// ---------------------------------------------------------------------------
// useIsFavorited — convenience wrapper for a single score.
// ---------------------------------------------------------------------------

export function useIsFavorited(scoreId) {
  const { favorites, loading: fetchLoading, refetch } = useFavorites()
  const { toggleFavorite: toggle, loading: toggleLoading } = useToggleFavorite()

  // Check both server-format (objects with .id) and local-format (plain ids)
  const isFavorited = favorites.some((fav) => {
    const favId = typeof fav === 'object' && fav !== null ? (fav.id ?? fav.score_id ?? fav.product_id ?? fav.recipe_id) : fav
    return String(favId) === String(scoreId)
  })

  const toggleFavorite = async () => {
    const result = await toggle(scoreId)
    if (result) await refetch()
    return result
  }

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  }
}

export { getUserIdentifier }
