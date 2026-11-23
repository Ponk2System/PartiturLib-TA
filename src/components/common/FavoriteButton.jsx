import { Heart } from 'lucide-react'
import { useIsFavorited } from '../../hooks/useFavorites'

/**
 * A toggleable heart button for scores / repertoire.
 *
 * @param {Object}   props
 * @param {string|number} [props.scoreId]  — score ID or title
 * @param {string|number} [props.gunId]    — compatibility alias
 * @param {Function} [props.onToggle]      — optional callback after toggle
 */
export default function FavoriteButton({ scoreId, gunId, onToggle }) {
  const targetId = scoreId ?? gunId
  const { isFavorited, loading, toggleFavorite } = useIsFavorited(targetId)

  const handleClick = async (e) => {
    e.stopPropagation()
    const result = await toggleFavorite()
    if (result && onToggle) onToggle(result)
  }

  return (
    <button
      type="button"
      className={`fav-btn${isFavorited ? ' fav-btn--active' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={isFavorited ? 'Hapus dari repertoar' : 'Simpan ke repertoar'}
      title={isFavorited ? 'Hapus dari repertoar' : 'Simpan ke repertoar'}
    >
      <Heart
        size={18}
        fill={isFavorited ? 'var(--brass)' : 'none'}
        stroke={isFavorited ? 'var(--brass)' : 'var(--steel)'}
      />
    </button>
  )
}
