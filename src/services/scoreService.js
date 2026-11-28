import { apiClient, IS_SUPABASE } from '../config/api'
import { invalidateScoresCache } from '../utils/queryCache'
import SCORES_FALLBACK from '../data/scores'
import { isAuthenticated } from './authService'

// ---------------------------------------------------------------------------
// Normalizer — standardizes score shape whether received from Supabase
// (public.scores), legacy public.products view, or local offline data.
// ---------------------------------------------------------------------------
export const normalizeScore = (item) => {
  if (!item) return null

  // Resolve instrumentation
  let instrumentationList = []
  if (Array.isArray(item.instrumentation) && item.instrumentation.length > 0) {
    instrumentationList = item.instrumentation
  } else if (Array.isArray(item.specs) && item.specs.length > 0) {
    instrumentationList = item.specs
  } else if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
    instrumentationList = item.ingredients.map((i) =>
      typeof i === 'string' ? i : `${i.name || ''} ${i.quantity || ''}`.trim(),
    )
  } else {
    instrumentationList = ['Full Score']
  }

  // Resolve movements
  let movementsList = []
  if (Array.isArray(item.movements) && item.movements.length > 0) {
    movementsList = item.movements
  } else if (Array.isArray(item.steps) && item.steps.length > 0) {
    movementsList = item.steps
  } else {
    movementsList = ['Complete Movement']
  }

  const title = item.title || item.name || 'Untitled Score'
  const composer = item.composer || item.caliber || 'Unknown Composer'
  const arranger = item.arranger || 'Original'
  const category = item.category || item.type || 'Orchestra'
  const year = Number(item.year_composed ?? item.price ?? 0)
  const coverUrl =
    item.cover_image_url ||
    item.image_url ||
    item.image ||
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80'
  const fileUrl =
    item.file_url ||
    'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'

  return {
    ...item,
    id: item.id,
    title,
    name: title, // Compatibility
    composer,
    arranger,
    year_composed: year,
    price: year, // Compatibility
    category,
    type: category, // Compatibility
    instrumentation: instrumentationList,
    specs: instrumentationList, // Compatibility
    ingredients: instrumentationList.map((inst, idx) => ({
      id: `inst-${idx}`,
      name: inst,
      quantity: '',
    })),
    difficulty: item.difficulty || 'Intermediate',
    key_signature: item.key_signature || 'C Major',
    tempo: item.tempo || 'Allegro',
    time_signature: item.time_signature || '4/4',
    file_url: fileUrl,
    file_name: item.file_name || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    file_size: item.file_size || '1.5 MB',
    cover_image_url: coverUrl,
    image_url: coverUrl, // Compatibility
    image: coverUrl, // Compatibility
    description: item.description || '',
    movements: movementsList,
    steps: movementsList, // Compatibility
    duration: item.duration || '05:00',
    created_at: item.created_at || new Date().toISOString(),
    uploader_id: item.uploader_id || null,
    uploader_name: item.uploader_name || 'PartiturLib',
  }
}

// ---------------------------------------------------------------------------
// ScoreService — wraps backend CRUD endpoints for sheet music scores.
// Supports both Supabase PostgREST table (/rest/v1/scores) and
// local offline storage.
// ---------------------------------------------------------------------------
class ScoreService {
  /**
   * Fetch a paginated, filterable list of scores.
   */
  async getScores(params = {}) {
    if (IS_SUPABASE) {
      const queryParts = ['select=*']

      if (params.search) {
        // Search in title, composer, or arranger
        const s = encodeURIComponent(params.search)
        queryParts.push(`or=(title.ilike.*${s}*,composer.ilike.*${s}*,arranger.ilike.*${s}*)`)
      }

      if (params.category && params.category !== 'All') {
        queryParts.push(`category=eq.${encodeURIComponent(params.category)}`)
      }

      if (params.sort_by) {
        const order = params.order === 'desc' ? 'desc' : 'asc'
        queryParts.push(`order=${params.sort_by}.${order}`)
      } else {
        queryParts.push('order=created_at.desc')
      }

      if (params.limit) {
        const page = Math.max(1, Number(params.page) || 1)
        const limit = Number(params.limit)
        const offset = (page - 1) * limit
        queryParts.push(`limit=${limit}`)
        queryParts.push(`offset=${offset}`)
      }

      try {
        queryParts.push('archived_at=is.null')
        const url = `/rest/v1/scores?${queryParts.join('&')}`
        const raw = await apiClient.get(url)
        const items = Array.isArray(raw) ? raw.map(normalizeScore) : []

        return {
          success: true,
          data: items,
          total: items.length,
          page: Number(params.page) || 1,
          limit: Number(params.limit) || items.length,
        }
      } catch (err) {
        console.warn('[ScoreService] Supabase /rest/v1/scores query failed, trying /rest/v1/products view or fallback:', err.message)
        try {
          // Attempt query on products view if scores table isn't directly exposed yet
          const fallbackUrl = `/rest/v1/products?select=*`
          const raw = await apiClient.get(fallbackUrl)
          const items = Array.isArray(raw) ? raw.map(normalizeScore) : []
          return {
            success: true,
            data: items,
            total: items.length,
            page: 1,
            limit: items.length,
          }
        } catch {
          // Offline fallback
          return {
            success: true,
            data: SCORES_FALLBACK.map(normalizeScore),
            total: SCORES_FALLBACK.length,
            page: 1,
            limit: SCORES_FALLBACK.length,
          }
        }
      }
    }

    // Offline / Mock fallback
    return {
      success: true,
      data: SCORES_FALLBACK.map(normalizeScore),
      total: SCORES_FALLBACK.length,
      page: 1,
      limit: SCORES_FALLBACK.length,
    }
  }

  /**
   * Fetch a single score by ID.
   */
  async getScoreById(id) {
    if (IS_SUPABASE) {
      try {
        const raw = await apiClient.get(`/rest/v1/scores?id=eq.${id}&archived_at=is.null&select=*`)
        const item = Array.isArray(raw) ? raw[0] : raw
        if (item) {
          return { success: true, data: normalizeScore(item) }
        }
      } catch {
        // Fallback to local
      }
    }

    const localItem = SCORES_FALLBACK.find((s) => String(s.id) === String(id))
    if (localItem) {
      return { success: true, data: normalizeScore(localItem) }
    }

    throw new Error('Partitur tidak ditemukan.')
  }

  /**
   * Create a new score.
   */
  async createScore(scoreData) {
    if (!isAuthenticated()) throw new Error('Silakan masuk dengan akun Anda untuk mengunggah partitur.')
    invalidateScoresCache()

    const payload = {
      title: scoreData.title || scoreData.name || 'Untitled Score',
      composer: scoreData.composer || 'Unknown Composer',
      arranger: scoreData.arranger || 'Original',
      year_composed: scoreData.year_composed ? Number(scoreData.year_composed) : null,
      category: scoreData.category || scoreData.type || 'Orchestra',
      instrumentation: Array.isArray(scoreData.instrumentation)
        ? scoreData.instrumentation
        : typeof scoreData.instrumentation === 'string'
          ? scoreData.instrumentation.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      difficulty: scoreData.difficulty || 'Intermediate',
      key_signature: scoreData.key_signature || 'C Major',
      tempo: scoreData.tempo || 'Allegro',
      time_signature: scoreData.time_signature || '4/4',
      file_url: scoreData.file_url || '',
      file_name: scoreData.file_name || 'score.pdf',
      file_size: scoreData.file_size || '1.0 MB',
      cover_image_url:
        scoreData.cover_image_url ||
        scoreData.image_url ||
        scoreData.image ||
        'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80',
      description: scoreData.description || '',
      movements: Array.isArray(scoreData.movements)
        ? scoreData.movements
        : typeof scoreData.movements === 'string'
          ? scoreData.movements.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
      duration: scoreData.duration || '05:00',
    }

    if (IS_SUPABASE) {
      const res = await apiClient.post('/rest/v1/scores', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeScore(created) }
    }

    // Local mockup creation
    const newId = Date.now()
    const created = { id: newId, ...payload }
    return { success: true, data: normalizeScore(created) }
  }

  /**
   * Update an existing score.
   */
  async updateScore(id, scoreData) {
    if (!isAuthenticated()) throw new Error('Silakan masuk terlebih dahulu.')
    invalidateScoresCache()

    const payload = {
      ...(scoreData.title && { title: scoreData.title }),
      ...(scoreData.name && { title: scoreData.name }),
      ...(scoreData.composer && { composer: scoreData.composer }),
      ...(scoreData.arranger && { arranger: scoreData.arranger }),
      ...(scoreData.year_composed !== undefined && { year_composed: Number(scoreData.year_composed) }),
      ...(scoreData.category && { category: scoreData.category }),
      ...(scoreData.type && { category: scoreData.type }),
      ...(scoreData.instrumentation && {
        instrumentation: Array.isArray(scoreData.instrumentation)
          ? scoreData.instrumentation
          : scoreData.instrumentation.split(',').map((s) => s.trim()),
      }),
      ...(scoreData.difficulty && { difficulty: scoreData.difficulty }),
      ...(scoreData.key_signature && { key_signature: scoreData.key_signature }),
      ...(scoreData.tempo && { tempo: scoreData.tempo }),
      ...(scoreData.time_signature && { time_signature: scoreData.time_signature }),
      ...(scoreData.file_url && { file_url: scoreData.file_url }),
      ...(scoreData.file_name && { file_name: scoreData.file_name }),
      ...(scoreData.file_size && { file_size: scoreData.file_size }),
      ...(scoreData.cover_image_url && { cover_image_url: scoreData.cover_image_url }),
      ...(scoreData.description !== undefined && { description: scoreData.description }),
      ...(scoreData.movements && {
        movements: Array.isArray(scoreData.movements)
          ? scoreData.movements
          : scoreData.movements.split('\n').map((s) => s.trim()),
      }),
      ...(scoreData.duration && { duration: scoreData.duration }),
      updated_at: new Date().toISOString(),
    }

    if (IS_SUPABASE) {
      const res = await apiClient.patch(`/rest/v1/scores?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeScore(updated) }
    }

    return { success: true, data: normalizeScore({ id, ...payload }) }
  }

  /**
   * Move a score to the archive. Permanent deletion is kept separate so an
   * accidental delete can still be managed from the archive.
   */
  async deleteScore(id) {
    if (!isAuthenticated()) throw new Error('Silakan masuk terlebih dahulu.')
    invalidateScoresCache()

    if (IS_SUPABASE) {
      await apiClient.patch(`/rest/v1/scores?id=eq.${id}`, {
        archived_at: new Date().toISOString(),
      })
      return { success: true }
    }

    return { success: true }
  }

  async getArchivedScores() {
    if (!isAuthenticated()) throw new Error('Silakan masuk terlebih dahulu.')
    if (IS_SUPABASE) {
      const raw = await apiClient.get('/rest/v1/scores?archived_at=not.is.null&select=*&order=archived_at.desc')
      return { success: true, data: Array.isArray(raw) ? raw.map(normalizeScore) : [] }
    }
    return { success: true, data: [] }
  }

  async permanentlyDeleteScore(id) {
    if (!isAuthenticated()) throw new Error('Silakan masuk terlebih dahulu.')
    invalidateScoresCache()
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/scores?id=eq.${id}`)
    }
    return { success: true }
  }

  async restoreScore(id) {
    if (!isAuthenticated()) throw new Error('Silakan masuk terlebih dahulu.')
    invalidateScoresCache()
    if (IS_SUPABASE) {
      await apiClient.patch(`/rest/v1/scores?id=eq.${id}`, { archived_at: null })
    }
    return { success: true }
  }

  // -------------------------------------------------------------------------
  // Compatibility Aliases for older GunService consumers
  // -------------------------------------------------------------------------
  async getGuns(params) {
    return this.getScores(params)
  }
  async getGunById(id) {
    return this.getScoreById(id)
  }
  async createGun(data) {
    return this.createScore(data)
  }
  async updateGun(id, data) {
    return this.updateScore(id, data)
  }
  async deleteGun(id) {
    return this.deleteScore(id)
  }
}

const scoreService = new ScoreService()
export default scoreService
