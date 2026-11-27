import { Plus, Music } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'

import { useState } from 'react'
import { Plus, Music, Heart, User, MoreHorizontal, Info, Phone, X } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Katalog' },
  { id: 'Favorites', label: 'Repertoar', hasBadge: true },
  { id: 'Profile', label: 'Profil' },
  { id: 'About', label: 'Tentang' },
  { id: 'Contact', label: 'Kontak' },
]

function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const isMoreActive = tab === 'About' || tab === 'Contact'

  const handleSelectNav = (tabId) => {
    onTab(tabId)
    setShowMoreMenu(false)
  }

  return (
    <>
      <header className="header">
        <div
          className="header-brand-wrap"
          onClick={() => handleSelectNav('Catalog')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleSelectNav('Catalog')
          }}
          aria-label="PartiturLib Home"
        >
          <div
            className="header-logo-badge"
            style={{ backgroundColor: 'var(--brass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Music size={20} color="#fff" />
          </div>
          <span className="brand display" style={{ letterSpacing: '0.04em' }}>
            Partitur<span style={{ color: 'var(--brass)' }}>Lib</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav desktop-only" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'nav-link active' : 'nav-link'}
              onClick={() => handleSelectNav(item.id)}
            >
              {item.label}
              {item.hasBadge && favCount > 0 && (
                <span className="nav-badge">{favCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        {onNavigateCreate && (
          <button
            type="button"
            className="btn btn--primary btn--sm header-cta desktop-only"
            onClick={onNavigateCreate}
            title="Unggah partitur baru"
          >
            <Plus size={15} /> Unggah Partitur
          </button>
        )}

        {/* Mobile Header Quick Counter */}
        <div className="mobile-only header-mobile-actions">
          {favCount > 0 && (
            <button
              type="button"
              className="mobile-fav-pill"
              onClick={() => handleSelectNav('Favorites')}
              aria-label={`${favCount} partitur di repertoar`}
            >
              <Heart size={14} fill="var(--brass)" color="var(--brass)" />
              <span>{favCount}</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav mobile-only" aria-label="Navigasi Bawah">
        <button
          type="button"
          className={`bottom-nav-item ${tab === 'Catalog' ? 'active' : ''}`}
          onClick={() => handleSelectNav('Catalog')}
          aria-label="Katalog Partitur"
        >
          <Music size={20} />
          <span className="bottom-nav-label">Katalog</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${tab === 'Favorites' ? 'active' : ''}`}
          onClick={() => handleSelectNav('Favorites')}
          aria-label="Repertoar Partitur"
        >
          <div className="bottom-nav-icon-wrap">
            <Heart size={20} />
            {favCount > 0 && <span className="bottom-nav-badge">{favCount}</span>}
          </div>
          <span className="bottom-nav-label">Repertoar</span>
        </button>

        {onNavigateCreate && (
          <button
            type="button"
            className="bottom-nav-item bottom-nav-item--action"
            onClick={onNavigateCreate}
            aria-label="Unggah Partitur"
          >
            <div className="bottom-nav-action-btn">
              <Plus size={22} color="#fff" />
            </div>
            <span className="bottom-nav-label">Unggah</span>
          </button>
        )}

        <button
          type="button"
          className={`bottom-nav-item ${tab === 'Profile' ? 'active' : ''}`}
          onClick={() => handleSelectNav('Profile')}
          aria-label="Profil Musisi"
        >
          <User size={20} />
          <span className="bottom-nav-label">Profil</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          aria-label="Menu Lainnya"
          aria-expanded={showMoreMenu}
        >
          <MoreHorizontal size={20} />
          <span className="bottom-nav-label">Lainnya</span>
        </button>
      </nav>

      {/* Mobile 'Lainnya' Bottom Sheet / Drawer */}
      {showMoreMenu && (
        <div className="mobile-sheet-backdrop" onClick={() => setShowMoreMenu(false)}>
          <div
            className="mobile-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu Tambahan"
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-header">
              <span className="mobile-sheet-title">Informasi &amp; Bantuan</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-sheet-menu">
              <button
                type="button"
                className={`mobile-sheet-item ${tab === 'About' ? 'active' : ''}`}
                onClick={() => handleSelectNav('About')}
              >
                <Info size={18} />
                <span>Tentang PartiturLib</span>
              </button>
              <button
                type="button"
                className={`mobile-sheet-item ${tab === 'Contact' ? 'active' : ''}`}
                onClick={() => handleSelectNav('Contact')}
              >
                <Phone size={18} />
                <span>Hubungi Kami</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
