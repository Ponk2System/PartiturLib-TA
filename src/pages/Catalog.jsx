import { useState, useMemo, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  Music,
} from 'lucide-react'
import { useScores } from '../hooks/useScores'
import SCORES_FALLBACK from '../data/scores'
import ScoreCard from '../components/score/ScoreCard'
import ScoreDetail from '../components/score/ScoreDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import scoreService from '../services/scoreService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — Main sheet music listing and repertoire explorer.
 */
export default function Catalog({ onNavigate }) {
  // ---- API data ----
  const { scores: apiScores, loading, error, refetch } = useScores({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)

  // Decide data source
  const rawScores = useMemo(() => {
    if (useLocal || (error && apiScores.length === 0)) {
      return SCORES_FALLBACK.map((s, i) => ({ ...s, id: s.id || `local-${i}` }))
    }
    return apiScores
  }, [apiScores, error, useLocal])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // ---- pagination ----
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  // Reset to page 1 whenever search, category, or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeCategory, sortKey, sortOrder])

  const categories = useMemo(() => extractCategories(rawScores), [rawScores])

  const filteredScores = useMemo(() => {
    let result = rawScores.filter(
      (s) => matchesSearch(s, search) && matchesCategory(s, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawScores, search, activeCategory, sortKey, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredScores.length / pageSize))

  const paginatedScores = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredScores.slice(start, start + pageSize)
  }, [filteredScores, currentPage, pageSize])

  // ---- detail view ----
  const [selectedScore, setSelectedScore] = useState(null)

  // ---- delete ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await scoreService.deleteScore(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus partitur.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single score detail ----
  if (selectedScore) {
    return (
      <ScoreDetail
        score={selectedScore}
        onBack={() => setSelectedScore(null)}
        onEdit={(s) => onNavigate && onNavigate('Edit', s)}
        onDelete={(s) => {
          setSelectedScore(null)
          setDeleteTarget(s)
        }}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Music size={28} color="var(--brass)" style={{ flexShrink: 0 }} /> Perpustakaan &amp; Arsip Partitur
        </h1>
        <p className="lede">
          Koleksi partitur lengkap mulai dari simfoni orkestra, string section,
          hingga instrumen solo. Unggah dokumen PDF, pelajari karya klasik maupun aransemen modern.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Koleksi Partitur</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredScores.length} partitur
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Unggah Partitur PDF
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
          }}
        />

        {/* Loading / Error States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat koleksi partitur…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Coba Lagi
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                Gunakan Data Arsip Lokal
              </button>
            </div>
          </div>
        )}

        {!loading && filteredScores.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>Tidak ada partitur yang sesuai dengan kriteria pencarian.</p>
          </div>
        )}

        {/* Score grid */}
        {filteredScores.length > 0 && (
          <>
            <ul className="stock">
              {paginatedScores.map((score) => (
                <ScoreCard
                  key={score.id || score.title || score.name}
                  score={score}
                  onSelect={setSelectedScore}
                  onEdit={onNavigate ? (s) => onNavigate('Edit', s) : undefined}
                  onDelete={setDeleteTarget}
                />
              ))}
            </ul>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1))
                    window.scrollTo({ top: 350, behavior: 'smooth' })
                  }}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-num ${pageNum === currentPage ? 'pagination-num--active' : ''}`}
                      onClick={() => {
                        setCurrentPage(pageNum)
                        window.scrollTo({ top: 350, behavior: 'smooth' })
                      }}
                      aria-label={`Halaman ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                    window.scrollTo({ top: 350, behavior: 'smooth' })
                  }}
                  aria-label="Halaman berikutnya"
                >
                  Next <ChevronRight size={16} />
                </button>

                <span className="pagination-info">
                  Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredScores.length)} dari {filteredScores.length}
                </span>
              </div>
            )}
          </>
        )}

        {useLocal && (
          <p className="local-notice">
            Menampilkan data partitur lokal (koneksi database offline).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setUseLocal(false)
                refetch()
              }}
            >
              Hubungkan ulang server
            </button>
          </p>
        )}
      </section>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Partitur"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title || deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError('')
        }}
      />
      {deleteError && <div className="toast toast--error">{deleteError}</div>}
    </>
  )
}
