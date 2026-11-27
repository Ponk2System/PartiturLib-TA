import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  Check,
  Download,
  FileText,
  Music,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { averageRating } from '../../utils/helpers'

/**
 * ScoreDetail — Full detailed view of sheet music with embedded PDF viewer,
 * download link, instrument list, movements, and practice notes/reviews.
 */
export default function ScoreDetail({ score, onBack, onEdit, onDelete }) {
  const item = score || {}
  const title = item.title || item.name || 'Untitled Score'
  const composer = item.composer || item.caliber || 'Unknown Composer'
  const arranger = item.arranger || 'Original'
  const category = item.category || item.type || 'Orchestra'
  const year = item.year_composed || item.price || ''
  const coverUrl =
    item.cover_image_url ||
    item.image_url ||
    item.image ||
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80'
  const fileUrl =
    item.file_url ||
    'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
  const fileName = item.file_name || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`

  // Interactive PDF viewer toggle
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  // Reviews & practice notes
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(item.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const avgRating = item.average_rating || averageRating(reviews)
  const reviewCount = item.review_count ?? reviews.length

  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?score=${encodeURIComponent(item.id || title)}`
    const shareData = {
      title: `${title} — Partitur Library`,
      text: `Pelajari partitur ${title} (${composer}) di Partitur Library!`,
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

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating harus antara 1 dan 5 bintang.')
      return
    }

    const result = await createReview(item.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Catatan ulasan partitur berhasil disimpan!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Gagal menyimpan ulasan. Pastikan jaringan terhubung.')
    }
  }

  return (
    <div className="detail score-detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Katalog
      </button>

      {/* Hero section */}
      <div className="detail-hero">
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px', margin: '0 auto' }}>
          <img
            className="detail-img"
            src={coverUrl}
            alt={title}
            style={{ borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', width: '100%', height: 'auto', maxHeight: '420px', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
          />
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setShowPdfViewer(!showPdfViewer)}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              backgroundColor: 'rgba(0,0,0,0.85)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backdropFilter: 'blur(4px)',
            }}
          >
            {showPdfViewer ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPdfViewer ? 'Sembunyikan Viewer PDF' : 'Buka Lembar Partitur PDF'}
          </button>
        </div>

        <div className="detail-info">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: 'var(--brass)',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {category}
            </span>
            {item.difficulty && (
              <span
                style={{
                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                  color: 'var(--ink)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                }}
              >
                Level: {item.difficulty}
              </span>
            )}
            {item.key_signature && (
              <span
                style={{
                  backgroundColor: 'rgba(180, 130, 60, 0.15)',
                  color: 'var(--brass)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Nada Dasar: {item.key_signature}
              </span>
            )}
          </div>

          <h1 className="display" style={{ fontSize: '2rem', lineHeight: '1.2' }}>{title}</h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--brass)', fontWeight: 600, marginTop: '4px' }}>
            Komposer: {composer}
          </p>
          {arranger && arranger !== 'Original' && (
            <p style={{ fontSize: '0.95rem', color: 'var(--steel)' }}>
              Aransemen: {arranger}
            </p>
          )}

          {/* Quick info grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '10px',
              margin: '16px 0',
              padding: '12px',
              background: 'rgba(0,0,0,0.03)',
              borderRadius: '8px',
              border: '1px solid var(--line)',
            }}
          >
            {year && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--steel)', display: 'block' }}>Tahun Cipta</span>
                <strong>{year}</strong>
              </div>
            )}
            {item.tempo && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--steel)', display: 'block' }}>Tempo</span>
                <strong>{item.tempo}</strong>
              </div>
            )}
            {item.time_signature && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--steel)', display: 'block' }}>Birama</span>
                <strong>{item.time_signature}</strong>
              </div>
            )}
            {item.duration && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--steel)', display: 'block' }}>Durasi</span>
                <strong>{item.duration}</strong>
              </div>
            )}
            {item.file_size && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--steel)', display: 'block' }}>Ukuran PDF</span>
                <strong>{item.file_size}</strong>
              </div>
            )}
          </div>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} ulasan musisi)
            </p>
          )}

          {/* Main Action Bar */}
          <div className="detail-actions">
            <FavoriteButton scoreId={item.id || title} />

            <a
              href={fileUrl}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            >
              <Download size={16} /> Unduh Partitur PDF
            </a>

            <button
              type="button"
              className={`btn btn--outline ${copied ? 'btn--success' : ''}`}
              onClick={handleShare}
              title={copied ? 'Tautan disalin!' : 'Bagikan link partitur'}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? 'Tautan Disalin!' : 'Bagikan'}
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(item)}>
                Edit Partitur
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(item)}>
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded PDF Viewer Section */}
      {showPdfViewer && (
        <section className="detail-section" style={{ border: '2px solid var(--brass)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.15rem' }}>
              <FileText size={20} color="var(--brass)" /> Penampil Partitur PDF Langsung
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn--sm btn--outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ExternalLink size={14} /> Buka Tab Penuh
              </a>
              <button
                type="button"
                className="btn btn--sm btn--outline"
                onClick={() => setShowPdfViewer(false)}
              >
                Tutup
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 'min(700px, calc(100dvh - 160px))', minHeight: '380px', backgroundColor: '#525659', borderRadius: '6px', overflow: 'hidden' }}>
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              title={`Partitur ${title}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </div>
        </section>
      )}

      {/* Description & History */}
      <section className="detail-section">
        <h2>Catatan Karya &amp; Sejarah</h2>
        <p style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
          {item.description || 'Belum ada catatan deskripsi karya untuk partitur ini.'}
        </p>
      </section>

      {/* Instrumentation Parts */}
      {item.instrumentation && item.instrumentation.length > 0 && (
        <section className="detail-section">
          <h2>Daftar Instrumen &amp; Partitur Bagian ({item.instrumentation.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {item.instrumentation.map((inst, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  border: '1px solid var(--line)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                }}
              >
                <Music size={14} color="var(--brass)" /> {typeof inst === 'object' ? `${inst.name} ${inst.quantity}` : inst}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Movements / Babak Lagu */}
      {item.movements && item.movements.length > 0 && (
        <section className="detail-section">
          <h2>Babak Gerakan Lagu (Movements)</h2>
          <ol className="detail-steps">
            {item.movements.map((mov, i) => (
              <li key={i} style={{ padding: '8px 0' }}>
                <strong>{typeof mov === 'object' ? mov.instruction || mov.name : mov}</strong>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews & Practice Notes */}
      <section className="detail-section">
        <h2>Catatan Latihan &amp; Ulasan Musisi</h2>

        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} bintang`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Tuliskan catatan latihan, petunjuk artikulasi, atau ulasan partitur ini…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !item.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Menyimpan…</>
            ) : (
              <><Send size={16} /> Kirim Catatan</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {reviewsLoading ? (
          <p className="detail-loading">Memuat ulasan musisi…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">{rev.user_identifier || 'Musisi'}</span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">Belum ada catatan latihan. Jadilah musisi pertama yang menambahkan catatan!</p>
        )}
      </section>
    </div>
  )
}
