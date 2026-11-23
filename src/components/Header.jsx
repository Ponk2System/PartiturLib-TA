import { Plus, Music } from 'lucide-react'
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

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
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

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Unggah partitur baru"
        >
          <Plus size={15} /> Unggah Partitur
        </button>
      )}
    </header>
  )
}

export default Header
