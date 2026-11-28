import { useEffect, useState } from 'react'
import { Share2, Check, Download, FileText, UserRound, CalendarDays, RotateCcw } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { truncate } from '../../utils/helpers'

/**
 * ScoreCard — Card for displaying sheet music in the repertoire catalog.
 */
export default function ScoreCard({ score, onSelect, onEdit, onDelete, onRestore, deleteLabel = 'Hapus Partitur', showSocialActions = true }) {
  const [copied, setCopied] = useState(false)
  const [downloadCount, setDownloadCount] = useState(Number(score?.download_count || 0))
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

  useEffect(() => {
    const handleDownloadUpdate = (event) => {
      if (String(event.detail?.scoreId) === String(item.id)) {
        setDownloadCount(Number(event.detail.downloadCount) || 0)
      }
    }

    window.addEventListener('partiturlib:download-updated', handleDownloadUpdate)
    return () => window.removeEventListener('partiturlib:download-updated', handleDownloadUpdate)
  }, [item.id])

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
        onClick={() => onSelect?.(item)}
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

        <div
          className="card-badges"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            padding: '0 16px',
            margin: '6px 0 10px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <span
            className="card-badge card-badge--category"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '24px',
              padding: '0 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(180, 130, 60, 0.15)',
              color: 'var(--brass)',
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1,
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
            }}
          >
            {category}
          </span>
          {keySig && (
            <span
              className="card-badge card-badge--key"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '24px',
                padding: '0 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(100, 116, 139, 0.15)',
                color: 'var(--steel)',
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: 1,
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                className="card-badge-icon"
                aria-hidden="true"
                style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
              >
                ♫
              </span>
              <span>{keySig}</span>
            </span>
          )}
        </div>

        {item.description && (
          <span className="card-desc">{truncate(item.description, 75)}</span>
        )}

        <span style={{ padding: '0 16px', color: 'var(--steel)', fontSize: '0.78rem', display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
          <UserRound size={13} /> Diunggah oleh {item.uploader_name || 'PartiturLib'}
          {item.created_at && <><CalendarDays size={13} /> {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
        </span>

        <div
          className="card-footer"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 16px 0',
            marginTop: 'auto',
          }}
        >
          <span
            className="card-footer-item card-footer-year"
            style={{
              fontSize: '0.85rem',
              color: 'var(--steel)',
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1.2,
            }}
          >
            {year ? `Tahun: ${year}` : ''}
          </span>
          {item.duration && (
            <span
              className="card-footer-item card-footer-duration"
              style={{
                fontSize: '0.8rem',
                color: 'var(--steel)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                className="card-footer-icon"
                aria-hidden="true"
                style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
              >
                ⏱
              </span>
              <span>{item.duration}</span>
            </span>
          )}
          <span
            className="card-footer-item"
            style={{
              fontSize: '0.8rem',
              color: 'var(--steel)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
            title={`${downloadCount.toLocaleString('id-ID')} kali diunduh`}
          >
            <Download size={13} /> {downloadCount.toLocaleString('id-ID')}
          </span>
        </div>
      </button>

      {/* Action buttons */}
      <div className="card-actions">
        {showSocialActions && <FavoriteButton scoreId={item.id || title} />}

        {showSocialActions && <button
          type="button"
          className={`card-act-btn ${copied ? 'card-act-btn--success' : ''}`}
          onClick={handleShare}
          aria-label={`Bagikan partitur ${title}`}
          title={copied ? 'Tautan disalin!' : 'Bagikan partitur'}
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
        </button>}

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

        {onRestore && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => {
              e.stopPropagation()
              onRestore(item)
            }}
            aria-label={`Pulihkan ${title} ke katalog`}
            title="Pulihkan ke Katalog"
          >
            <RotateCcw size={16} />
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
            title={deleteLabel}
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
