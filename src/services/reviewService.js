import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewService — Score practice notes, markings & musician reviews.
// Supports Supabase (public.reviews) with score_id & product_id compatibility.
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews / notes for a given score.
   */
  async getReviews(scoreId) {
    if (IS_SUPABASE) {
      try {
        const data = await apiClient.get(
          `/rest/v1/reviews?score_id=eq.${scoreId}&select=*&order=created_at.desc`,
        )
        const list = Array.isArray(data)
          ? data.map((r) => ({
              id: r.id,
              score_id: r.score_id || r.product_id,
              user_identifier: r.user_id ? `Musician ${String(r.user_id).substring(0, 8)}` : 'Anonymous Musician',
              rating: r.rating,
              comment: r.comment || '',
              created_at: r.created_at,
            }))
          : []

        return { success: true, data: list }
      } catch (err) {
        console.warn('[ReviewService] score_id query failed, trying product_id:', err.message)
        try {
          const data = await apiClient.get(
            `/rest/v1/reviews?product_id=eq.${scoreId}&select=*&order=created_at.desc`,
          )
          const list = Array.isArray(data)
            ? data.map((r) => ({
                id: r.id,
                score_id: r.score_id || r.product_id,
                user_identifier: r.user_id ? `Musician ${String(r.user_id).substring(0, 8)}` : 'Anonymous Musician',
                rating: r.rating,
                comment: r.comment || '',
                created_at: r.created_at,
              }))
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
   * Submit a new practice note / review.
   */
  async createReview(scoreId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        score_id: Number(scoreId),
        product_id: Number(scoreId), // compatibility
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      try {
        const res = await apiClient.post('/rest/v1/reviews', payload, {
          headers: { Prefer: 'return=representation' },
        })
        const created = Array.isArray(res) ? res[0] : res
        return {
          success: true,
          data: {
            id: created.id,
            score_id: created.score_id || created.product_id,
            user_identifier: created.user_id ? `Musician ${String(created.user_id).substring(0, 8)}` : 'Anonymous Musician',
            rating: created.rating,
            comment: created.comment,
            created_at: created.created_at,
          },
        }
      } catch {
        // Fallback without product_id if schema has score_id only
        delete payload.product_id
        const res = await apiClient.post('/rest/v1/reviews', payload, {
          headers: { Prefer: 'return=representation' },
        })
        const created = Array.isArray(res) ? res[0] : res
        return {
          success: true,
          data: {
            id: created.id,
            score_id: created.score_id,
            user_identifier: created.user_id ? `Musician ${String(created.user_id).substring(0, 8)}` : 'Anonymous Musician',
            rating: created.rating,
            comment: created.comment,
            created_at: created.created_at,
          },
        }
      }
    }

    return {
      success: true,
      data: {
        id: Date.now(),
        score_id: Number(scoreId),
        user_identifier: 'Local Musician',
        rating: Number(reviewData.rating),
        comment: reviewData.comment,
        created_at: new Date().toISOString(),
      },
    }
  }
}

export default new ReviewService()
