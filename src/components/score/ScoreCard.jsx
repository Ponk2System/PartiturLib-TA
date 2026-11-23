import { useState } from 'react'
import { Share2, Check, FileText } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { truncate } from '../../utils/helpers'

/**
 * ScoreCard — Card for displaying sheet music in the repertoire catalog.
 */
export default function ScoreCard({ score, onSelect, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false)
  const item = score || {}

  const title = item.title || item.name || 'Untitled Score'
  const composer = item.composer || item.caliber || 'Unknown Composer'
  const arranger = item.arranger && item.arranger !== 'Original' ? `Arr. ${item.arranger}` : ''
  const category = item.category || item.type || 'Orchestra'
  const year = item.year_composed || item.price || ''
  const keySig = item.key_signature || ''
  const coverUrl =
    item.cover_image_url ||
    item.image_url ||
    item.image ||
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80'

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}${window.location.pathname}?score=${encodeURIComponent(item.id || title)}`
    const shareData = {
      title: `${title} — Partitur Library`,
      text: `Lihat partitur ${title} karya ${composer} (${category}) di Partitur Library!`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyFallback(shareUrl)
        }
      }
    } else {
      copyFallback(shareUrl)
    }
  }

  const copyFallback = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <li className="card score-card" style={{ position: 'relative' }}>
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(item)}
        aria-label={`Lihat Partitur ${title}`}
      >
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
          <img
            className="card-img"
            src={coverUrl}
            alt={title}
            width="240"
            height="180"
            loading="lazy"
            style={{ objectFit: 'cover', width: '100%', height: '180px' }}
          />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <FileText size={12} /> PDF Partitur
          </span>
        </div>

        <span className="name display" style={{ marginTop: '10px', fontSize: '1.15rem' }}>
          {title}
        </span>

        <span className="type" style={{ color: 'var(--brass)', fontWeight: 600 }}>
          {composer} {arranger ? `· ${arranger}` : ''}
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '6px 0' }}>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(180, 130, 60, 0.15)',
              color: 'var(--brass)',
              fontWeight: 500,
            }}
          >
            {category}
          </span>
          {keySig && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(100, 116, 139, 0.15)',
                color: 'var(--steel)',
              }}
            >
              ♫ {keySig}
            </span>
          )}
        </div>

        {item.description && (
          <span className="card-desc">{truncate(item.description, 75)}</span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
            {year ? `Tahun: ${year}` : ''}
          </span>
          {item.duration && (
            <span style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>
              ⏱ {item.duration}
            </span>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="card-actions">
        <FavoriteButton scoreId={item.id || title} />

        <button
          type="button"
          className={`card-act-btn ${copied ? 'card-act-btn--success' : ''}`}
          onClick={handleShare}
          aria-label={`Bagikan partitur ${title}`}
          title={copied ? 'Tautan disalin!' : 'Bagikan partitur'}
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
        </button>

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            aria-label={`Edit ${title}`}
            title="Edit Partitur"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item)
            }}
            aria-label={`Hapus ${title}`}
            title="Hapus Partitur"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
