// Compatibility helpers used by favorites/reviews. Score ownership itself is
// enforced by Supabase Auth and RLS, never by this browser-only identifier.
import authService from './authService'

const LEGACY_ID_KEY = 'partiturlib_legacy_user_id'

const legacyId = () => {
  try {
    let id = localStorage.getItem(LEGACY_ID_KEY)
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`
      localStorage.setItem(LEGACY_ID_KEY, id)
    }
    return id
  } catch { return `local-${Date.now()}` }
}

export const getUserIdentifier = () => authService.getSession()?.user?.id || legacyId()
export const getUserProfile = () => {
  const profile = authService.getCurrentProfile()
  if (profile) return { ...profile, userId: profile.id }
  return { username: 'Tamu', avatar: null, bio: '', userId: null, role: 'guest' }
}

export const saveUserProfile = (profile) => ({ success: true, data: profile })
export const updateUsername = () => ({ success: false, message: 'Gunakan halaman profil akun.' })
export const updateBio = updateUsername
export const updateAvatar = updateUsername
export const resetUserIdentifier = () => legacyId()

export default { getUserIdentifier, getUserProfile, saveUserProfile, updateUsername, updateBio, updateAvatar, resetUserIdentifier }
