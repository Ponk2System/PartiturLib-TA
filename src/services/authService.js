import { BASE_URL, SUPABASE_KEY, IS_SUPABASE } from '../config/api'

const SESSION_KEY = 'partiturlib_auth_session'
const PROFILE_KEY = 'partiturlib_auth_profile'
const AUTH_CHANGED = 'partiturlib-auth-changed'

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const notify = () => window.dispatchEvent(new Event(AUTH_CHANGED))

export const getSession = () => read(SESSION_KEY)
export const getAccessToken = () => getSession()?.access_token || null
export const getCurrentProfile = () => read(PROFILE_KEY)
export const isAuthenticated = () => Boolean(getAccessToken())

const request = async (path, options = {}) => {
  if (!IS_SUPABASE || !BASE_URL || !SUPABASE_KEY) {
    throw new Error('Layanan akun belum dikonfigurasi. Tambahkan konfigurasi Supabase terlebih dahulu.')
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.msg || body.message || body.error_description || 'Permintaan akun gagal.')
  return body
}

export const refreshProfile = async () => {
  const session = getSession()
  if (!session?.user?.id || !session.access_token) return null
  const data = await request(`/rest/v1/profiles?id=eq.${session.user.id}&select=*`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const profile = data[0] || null
  if (profile) write(PROFILE_KEY, profile)
  return profile
}

const saveSession = async (session) => {
  write(SESSION_KEY, session)
  try { await refreshProfile() } catch { /* profile can be fetched again later */ }
  notify()
}

export const signUp = async ({ email, password, username }) => {
  const data = await request('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, data: { username } }),
  })
  if (data.access_token) await saveSession(data)
  return { requiresEmailConfirmation: !data.access_token }
}

export const signIn = async ({ email, password }) => {
  const data = await request('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  await saveSession(data)
  return getCurrentProfile()
}

export const signOut = () => {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(PROFILE_KEY)
  notify()
}

export const updateProfile = async ({ username, bio, avatar }) => {
  const session = getSession()
  if (!session?.user?.id) throw new Error('Silakan masuk terlebih dahulu.')
  const data = await request(`/rest/v1/profiles?id=eq.${session.user.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${session.access_token}`, Prefer: 'return=representation' },
    body: JSON.stringify({ username, bio, avatar }),
  })
  const profile = data[0]
  if (profile) write(PROFILE_KEY, profile)
  notify()
  return profile
}

export const onAuthChanged = (callback) => {
  window.addEventListener(AUTH_CHANGED, callback)
  return () => window.removeEventListener(AUTH_CHANGED, callback)
}

export default { getSession, getAccessToken, getCurrentProfile, isAuthenticated, refreshProfile, signUp, signIn, signOut, updateProfile, onAuthChanged }
