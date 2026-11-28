import { useState } from 'react'
import { LogIn, LogOut, Save, ShieldCheck, UserRound, UserPlus } from 'lucide-react'
import authService from '../services/authService'

export default function ProfilePage({ onReplaySplash, onAuthChange }) {
  const [profile, setProfile] = useState(() => authService.getCurrentProfile())
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(() => profile?.username || '')
  const [bio, setBio] = useState(() => profile?.bio || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const sync = (next) => {
    setProfile(next)
    setUsername(next?.username || '')
    setBio(next?.bio || '')
    onAuthChange?.(next)
  }

  const submitAuth = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      if (mode === 'register') {
        const result = await authService.signUp({ email: email.trim(), password, username: username.trim() || 'Musisi' })
        if (result.requiresEmailConfirmation) setMessage('Akun dibuat. Periksa email Anda untuk mengonfirmasi akun, lalu masuk.')
        else sync(await authService.refreshProfile())
      } else {
        sync(await authService.signIn({ email: email.trim(), password }))
      }
    } catch (err) { setError(err.message || 'Autentikasi gagal.') } finally { setBusy(false) }
  }

  const saveProfile = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      const next = await authService.updateProfile({ username: username.trim() || 'Musisi', bio: bio.trim(), avatar: profile.avatar || null })
      sync(next); setMessage('Profil berhasil disimpan.')
    } catch (err) { setError(err.message || 'Gagal menyimpan profil.') } finally { setBusy(false) }
  }

  if (!profile?.id) return (
    <div className="profile-page">
      <section className="masthead"><h1 className="display">Masuk ke PartiturLib</h1><p className="lede">Akun diperlukan untuk mengunggah partitur. Pengunjung tetap dapat melihat koleksi.</p></section>
      <form className="profile-form" onSubmit={submitAuth}>
        <h3 className="section-title">{mode === 'login' ? 'Masuk' : 'Buat Akun'}</h3>
        {mode === 'register' && <div className="form-group"><label className="form-label" htmlFor="auth-name">Nama tampilan</label><input id="auth-name" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>}
        <div className="form-group"><label className="form-label" htmlFor="auth-email">Email</label><input id="auth-email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="form-group"><label className="form-label" htmlFor="auth-password">Kata sandi</label><input id="auth-password" className="form-input" type="password" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}
        <button className="btn btn--primary" disabled={busy} type="submit">{mode === 'login' ? <><LogIn size={16} /> Masuk</> : <><UserPlus size={16} /> Daftar</>}</button>
        <button className="link-btn" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button>
      </form>
    </div>
  )

  return (
    <div className="profile-page">
      <section className="masthead"><h1 className="display">Profil Musisi</h1><p className="lede">Anda masuk sebagai <strong>{profile.role === 'admin' ? 'Admin' : 'User'}</strong>. {profile.role === 'admin' ? 'Admin dapat mengelola semua partitur.' : 'Anda hanya dapat mengelola unggahan sendiri.'}</p></section>
      <div className="profile-card">
        <div className="profile-card-top">
          <div className={`avatar-wrap avatar-wrap--${profile.role === 'admin' ? 'admin' : 'user'}`} aria-label={`Ikon ${profile.role === 'admin' ? 'admin' : 'user'}`}>
            <div className="avatar-placeholder">
              {profile.role === 'admin' ? <ShieldCheck size={38} /> : <UserRound size={38} />}
            </div>
          </div>
          <div className="profile-identity"><h2 className="display">{profile.username}</h2><p>{profile.email || authService.getSession()?.user?.email}</p><span className="mono-badge">Role: {profile.role}</span></div>
        </div>
      </div>
      <form className="profile-form" onSubmit={saveProfile}><h3 className="section-title">Detail Akun</h3><div className="form-group"><label className="form-label" htmlFor="prof-name">Nama tampilan</label><input id="prof-name" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required /></div><div className="form-group"><label className="form-label" htmlFor="prof-bio">Bio</label><textarea id="prof-bio" className="form-textarea" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} /></div>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<button type="submit" className="btn btn--primary" disabled={busy}><Save size={16} /> Simpan Profil</button><button type="button" className="btn btn--outline" onClick={() => { authService.signOut(); sync(null) }}><LogOut size={16} /> Keluar</button>{onReplaySplash && <button type="button" className="link-btn" onClick={onReplaySplash}>Putar intro</button>}</form>
    </div>
  )
}
