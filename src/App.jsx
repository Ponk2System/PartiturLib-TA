import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import scoreService from './services/scoreService.js'
import './App.css'

// ---------------------------------------------------------------------------
// Lazy Loaded Route Pages (Code Splitting)
// Reduces initial JavaScript bundle size by only loading pages on demand.
// ---------------------------------------------------------------------------
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const CreateScorePage = lazy(() => import('./pages/CreateScorePage.jsx'))
const EditScorePage = lazy(() => import('./pages/EditScorePage.jsx'))
const ScoreDetail = lazy(() => import('./components/score/ScoreDetail.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedScore, setSelectedScore] = useState(null)
  const [editingScore, setEditingScore] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // URL synchronization helper for sharelink & deep linking
  const syncUrl = (scoreId) => {
    try {
      const url = new URL(window.location.href)
      if (scoreId) {
        url.searchParams.set('score', scoreId)
        url.searchParams.set('gun', scoreId)
      } else {
        url.searchParams.delete('score')
        url.searchParams.delete('gun')
        url.searchParams.delete('item')
      }
      window.history.replaceState({}, '', url)
    } catch {
      // browser history may be restricted in sandboxed iframes
    }
  }

  // Deep linking: read '?score=' or '?gun=' on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const scoreParam = params.get('score') || params.get('gun') || params.get('item')
    if (scoreParam) {
      scoreService
        .getScoreById(scoreParam)
        .then((res) => {
          if (res && res.data) {
            setSelectedScore(res.data)
            setMode('detail')
          }
        })
        .catch((err) => {
          console.warn('[DeepLink] Score not found:', err)
        })
    }
  }, [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      syncUrl(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingScore(payload)
      setMode('edit')
      syncUrl(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedScore(payload)
      setMode('detail')
      syncUrl(payload?.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedScore(null)
      setEditingScore(null)
      syncUrl(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedScore(null)
    setEditingScore(null)
    syncUrl(null)
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense
          fallback={
            <div className="suspense-loader">
              <Loader size={32} className="spin" />
              <p>Memuat halaman…</p>
            </div>
          }
        >
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateScorePage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditScorePage
              score={editingScore}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'detail' && selectedScore && (
            <ScoreDetail
              score={selectedScore}
              onBack={handleBackToList}
              onEdit={(s) => handleNavigate('Edit', s)}
              onDelete={(s) => setDeleteTarget(s)}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectScore={(s) => handleNavigate('Detail', s)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage onReplaySplash={() => setShowSplash(true)} />
              )}
              {tab === 'About' && <About />}
              {tab === 'Contact' && <Contact />}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Partitur"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title || deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await scoreService.deleteScore(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Gagal menghapus partitur.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
