import { useCallback, useEffect, useState } from 'react'
import { Archive, Loader, RefreshCw } from 'lucide-react'
import scoreService from '../services/scoreService'
import { canManageScore } from '../utils/permissions'
import ScoreCard from '../components/score/ScoreCard'
import ScoreDetail from '../components/score/ScoreDetail'
import ConfirmModal from '../components/modals/ConfirmModal'

export default function ArchivePage({ profile, onNavigate }) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedScore, setSelectedScore] = useState(null)
  const [target, setTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const loadArchive = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await scoreService.getArchivedScores()
      setScores(result.data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat arsip partitur.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadArchive() }, [loadArchive])

  const restore = async (score) => {
    try {
      setRestoring(true)
      await scoreService.restoreScore(score.id)
      setSelectedScore(null)
      await loadArchive()
    } catch (err) {
      setError(err.message || 'Gagal memulihkan partitur.')
    } finally {
      setRestoring(false)
    }
  }

  const permanentlyDelete = async () => {
    if (!target) return
    try {
      setDeleting(true)
      await scoreService.permanentlyDeleteScore(target.id)
      setTarget(null)
      setSelectedScore(null)
      await loadArchive()
    } catch (err) {
      setError(err.message || 'Gagal menghapus partitur secara permanen.')
    } finally {
      setDeleting(false)
    }
  }

  if (selectedScore) {
    const canManage = canManageScore(selectedScore, profile)
    return (
      <>
        <ScoreDetail
          score={selectedScore}
          onBack={() => setSelectedScore(null)}
          onEdit={canManage ? (score) => onNavigate?.('Edit', score) : undefined}
          onRestore={canManage ? restore : undefined}
          onDelete={canManage ? setTarget : undefined}
          showSocialActions={false}
        />
        {restoring && <div className="toast toast--success">Memulihkan partitur ke katalog…</div>}
        <ConfirmModal open={Boolean(target)} title="Hapus Permanen" message={`Hapus permanen "${target?.title || target?.name}"? File dan data partitur tidak dapat dipulihkan.`} confirmLabel="Hapus Permanen" danger loading={deleting} onConfirm={permanentlyDelete} onCancel={() => setTarget(null)} />
      </>
    )
  }

  return (
    <>
      <section className="masthead">
        <h1 className="display" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Archive size={28} color="var(--brass)" /> Arsip Partitur</h1>
        <p className="lede">Partitur yang dihapus dari katalog berada di sini. Anda dapat memulihkannya atau menghapusnya secara permanen.</p>
      </section>

      {loading && <div className="state-box"><Loader size={28} className="spin" /><p>Memuat arsip partitur…</p></div>}
      {!loading && error && <div className="state-box state-box--error"><p>{error}</p><button type="button" className="btn btn--outline" onClick={loadArchive}><RefreshCw size={16} /> Coba Lagi</button></div>}
      {!loading && !error && scores.length === 0 && <div className="state-box"><Archive size={28} /><p>Arsip masih kosong.</p></div>}
      {!loading && scores.length > 0 && <ul className="stock">
        {scores.map((score) => {
          const canManage = canManageScore(score, profile)
          return <ScoreCard key={score.id} score={score} onSelect={setSelectedScore} onEdit={canManage ? (item) => onNavigate?.('Edit', item) : undefined} onRestore={canManage ? restore : undefined} onDelete={canManage ? setTarget : undefined} deleteLabel="Hapus permanen" showSocialActions={false} />
        })}
      </ul>}

      <ConfirmModal open={Boolean(target)} title="Hapus Permanen" message={`Hapus permanen "${target?.title || target?.name}"? File dan data partitur tidak dapat dipulihkan.`} confirmLabel="Hapus Permanen" danger loading={deleting} onConfirm={permanentlyDelete} onCancel={() => setTarget(null)} />
    </>
  )
}
