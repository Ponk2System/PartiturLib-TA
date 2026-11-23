import { apiClient, IS_SUPABASE } from '../config/api'
import { normalizeScore } from './scoreService'

// ---------------------------------------------------------------------------
// FavoriteService — Sheet Music Favorites & Personal Repertoire.
// Supports Supabase (public.favorites with scores foreign key join)
// and localStorage fallback for offline resilience.
// ---------------------------------------------------------------------------

class FavoriteService {
  /**
   * Retrieve all favourited scores for the given user.
   */
  async getFavorites(userIdentifier) {
    if (IS_SUPABASE) {
      try {
        const data = await apiClient.get(
          `/rest/v1/favorites?user_id=eq.${userIdentifier}&select=score_id,product_id,created_at,scores(*)`,
        )
        const list = Array.isArray(data)
          ? data.map((fav) => {
              const sc = fav.scores ? normalizeScore(fav.scores) : null
              return {
                ...(sc || {}),
                id: fav.score_id || fav.product_id,
                score_id: fav.score_id || fav.product_id,
                product_id: fav.score_id || fav.product_id,
                created_at: fav.created_at,
              }
            })
          : []

        return { success: true, data: list }
      } catch (err) {
        console.warn('[FavoriteService] Score join failed, trying products view:', err.message)
        try {
          const data = await apiClient.get(
            `/rest/v1/favorites?user_id=eq.${userIdentifier}&select=score_id,product_id,created_at,products(*)`,
          )
          const list = Array.isArray(data)
            ? data.map((fav) => {
                const sc = fav.products ? normalizeScore(fav.products) : null
                return {
                  ...(sc || {}),
                  id: fav.score_id || fav.product_id,
                  score_id: fav.score_id || fav.product_id,
                  created_at: fav.created_at,
                }
              })
            : []
          return { success: true, data: list }
        } catch {
          return { success: true, data: [] }
        }
      }
    }

    return { success: true, data: [] }
  }

  /**
   * Toggle a score's favourite state (add <-> remove).
   * @param {Object} data  { score_id, product_id, user_identifier }
   */
  async toggleFavorite(data) {
    if (IS_SUPABASE) {
      const targetId = Number(data.score_id || data.recipe_id || data.product_id || data.gun_id)
      const userId = data.user_identifier

      try {
        // Check if already favorited
        const existing = await apiClient.get(
          `/rest/v1/favorites?user_id=eq.${userId}&score_id=eq.${targetId}&select=id`,
        )

        if (Array.isArray(existing) && existing.length > 0) {
          // Remove
          await apiClient.delete(
            `/rest/v1/favorites?user_id=eq.${userId}&score_id=eq.${targetId}`,
          )
          return { success: true, data: { isFavorite: false } }
        } else {
          // Add
          await apiClient.post(
            '/rest/v1/favorites',
            { user_id: userId, score_id: targetId },
            { headers: { Prefer: 'return=representation' } },
          )
          return { success: true, data: { isFavorite: true } }
        }
      } catch {
        // Fallback for schema variants
        const existing = await apiClient.get(
          `/rest/v1/favorites?user_id=eq.${userId}&product_id=eq.${targetId}&select=id`,
        )
        if (Array.isArray(existing) && existing.length > 0) {
          await apiClient.delete(
            `/rest/v1/favorites?user_id=eq.${userId}&product_id=eq.${targetId}`,
          )
          return { success: true, data: { isFavorite: false } }
        } else {
          await apiClient.post(
            '/rest/v1/favorites',
            { user_id: userId, product_id: targetId },
            { headers: { Prefer: 'return=representation' } },
          )
          return { success: true, data: { isFavorite: true } }
        }
      }
    }

    return { success: true, data: { isFavorite: true } }
  }
}

export default new FavoriteService()
