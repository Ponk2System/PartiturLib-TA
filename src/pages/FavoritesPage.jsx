import { useMemo } from 'react'
import { Heart, Loader, AlertCircle, ArrowRight, Music } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useScores } from '../hooks/useScores'
import SCORES_FALLBACK from '../data/scores'
import ScoreCard from '../components/score/ScoreCard'

/**
 * FavoritesPage — Displays user's shortlisted sheet music / repertoire.
 */
export default function FavoritesPage({ onSelectScore, onSelectGun, onNavigateCatalog }) {
  const onSelect = onSelectScore || onSelectGun
  const { favorites, loading: favLoading, error: favError, refetch } = useFavorites()
  const { scores: apiScores } = useScores({ limit: 100 })

  // All known scores for lookup
  const allKnownScores = useMemo(() => {
    const map = new Map()
    SCORES_FALLBACK.forEach((s, idx) => {
      const id = s.id || `local-${idx}`
      const enriched = { ...s, id }
      map.set(id, enriched)
      map.set(String(id), enriched)
      if (s.title) map.set(s.title, enriched)
    })
    apiScores.forEach((s) => {
      if (s.id !== undefined && s.id !== null) {
        map.set(s.id, s)
        map.set(String(s.id), s)
      }
      if (s.title) map.set(s.title, s)
    })
    return map
  }, [apiScores])

  const favoriteItems = useMemo(() => {
    const resolved = []
    const seen = new Set()

    favorites.forEach((fav) => {
      const id = fav.score_id || fav.id || fav.product_id || fav.recipe_id
      const match = allKnownScores.get(id) || allKnownScores.get(fav.title) || allKnownScores.get(fav.name) || (fav.title ? fav : null)
      if (match && !seen.has(match.id || match.title)) {
        seen.add(match.id || match.title)
        resolved.push(match)
      } else if (id && !seen.has(id)) {
        seen.add(id)
        resolved.push({
          id,
          title: fav.title || fav.name || 'Partitur Musik',
          composer: fav.composer || 'Komposer',
          category: fav.category || 'Orchestra',
          cover_image_url: fav.cover_image_url || fav.image_url || 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80',
          file_url: fav.file_url || '',
        })
      }
    })

    return resolved
  }, [favorites, allKnownScores])

  const isLoading = favLoading && favoriteItems.length === 0

  return (
    <div className="fav-page">
      <section className="masthead">
        <h1 className="display" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Music size={28} color="var(--brass)" style={{ flexShrink: 0 }} /> Repertoar Partitur Saya
        </h1>
        <p className="lede">
          Daftar karya musik dan partitur yang Anda simpan untuk latihan, persiapan konser, atau studi pribadi.
        </p>
      </section>

      <section className="fav-content">
        <div className="list-head">
          <h2>Partitur Tersimpan</h2>
          <span className="count">
            {favoriteItems.length} partitur
          </span>
        </div>

        {isLoading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat daftar repertoar Anda…</p>
          </div>
        )}

        {!isLoading && favError && favoriteItems.length === 0 && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{favError}</p>
            <button type="button" className="btn btn--outline" onClick={refetch}>
              Coba Lagi
            </button>
          </div>
        )}

        {!isLoading && favoriteItems.length === 0 && !favError && (
          <div className="state-box">
            <Heart size={36} color="var(--brass)" style={{ opacity: 0.6 }} />
            <p>Belum ada partitur dalam repertoar favorit Anda.</p>
            {onNavigateCatalog && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateCatalog}
                style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Jelajahi Katalog Partitur <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {favoriteItems.length > 0 && (
          <ul className="stock">
            {favoriteItems.map((item) => (
              <ScoreCard
                key={item.id || item.title}
                score={item}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
