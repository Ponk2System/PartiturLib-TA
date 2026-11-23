// ---------------------------------------------------------------------------
// draftStorage.js — auto-save / restore form drafts via localStorage.
//
// Drafts are keyed by a string id:
//   'create_score' / 'create'  → the Create form
//   '<uuid>'                   → the Edit form for a specific score
//
// Each draft is stored under `score_draft_<id>` and its companion
// timestamp under `score_draft_<id>_ts`.
// ---------------------------------------------------------------------------

const PREFIX = 'score_draft_'
const LEGACY_PREFIX = 'gun_draft_'
const TS_SUFFIX = '_ts'

/**
 * Persist a draft object.
 * @param {Object} draftData — arbitrary JSON-serializable form state
 * @param {string} draftId   — 'create_score', 'create', or a score ID
 * @returns {boolean} true on success
 */
export const saveDraft = (draftData, draftId = 'create') => {
  try {
    const key = `${PREFIX}${draftId}`
    const ts = new Date().toISOString()
    localStorage.setItem(key, JSON.stringify({ ...draftData, savedAt: ts }))
    localStorage.setItem(`${key}${TS_SUFFIX}`, ts)
    return true
  } catch {
    return false
  }
}

/**
 * Load a previously saved draft.
 * @returns {Object|null}
 */
export const loadDraft = (draftId = 'create') => {
  try {
    const raw =
      localStorage.getItem(`${PREFIX}${draftId}`) ||
      localStorage.getItem(`${LEGACY_PREFIX}${draftId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Remove a draft and its timestamp from storage.
 */
export const deleteDraft = (draftId = 'create') => {
  try {
    const key = `${PREFIX}${draftId}`
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}${TS_SUFFIX}`)
    localStorage.removeItem(`${LEGACY_PREFIX}${draftId}`)
    localStorage.removeItem(`${LEGACY_PREFIX}${draftId}${TS_SUFFIX}`)
    return true
  } catch {
    return false
  }
}

/**
 * Check whether a draft exists for the given ID.
 * @param {string} draftId
 * @returns {boolean}
 */
export const hasDraft = (draftId = 'create') => {
  return (
    localStorage.getItem(`${PREFIX}${draftId}`) !== null ||
    localStorage.getItem(`${LEGACY_PREFIX}${draftId}`) !== null
  )
}

/**
 * Retrieve the ISO timestamp for when a draft was last saved.
 * @param {string} draftId
 * @returns {string|null}
 */
export const getDraftTimestamp = (draftId = 'create') => {
  return (
    localStorage.getItem(`${PREFIX}${draftId}${TS_SUFFIX}`) ||
    localStorage.getItem(`${LEGACY_PREFIX}${draftId}${TS_SUFFIX}`) ||
    null
  )
}

/**
 * Format a saved-at timestamp for display.
 * @param {string|null} isoString
 * @returns {string}
 */
export const formatDraftTime = (isoString) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
