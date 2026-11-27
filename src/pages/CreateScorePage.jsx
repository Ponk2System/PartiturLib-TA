import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Music,
} from 'lucide-react'
import scoreService from '../services/scoreService'
import uploadService from '../services/uploadService'
import { generatePdfThumbnail } from '../utils/pdfThumbnail'
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import ConfirmModal from '../components/modals/ConfirmModal'

const CATEGORIES = [
  'Orchestra',
  'String Section',
  'Solo Instrument',
  'Woodwind & Brass',
  'Choir / Vocal',
]

const QUICK_INSTRUMENTS = [
  'Violin I',
  'Violin II',
  'Viola',
  'Cello',
  'Double Bass',
  'Flute',
  'Oboe',
  'Clarinet in B-flat',
  'Bassoon',
  'French Horn',
  'Trumpet',
  'Trombone',
  'Tuba',
  'Timpani',
  'Solo Piano',
  'Harp',
]

export default function CreateScorePage({ onBack, onSuccess }) {
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    composer: '',
    arranger: 'Original',
    year_composed: new Date().getFullYear(),
    category: 'Orchestra',
    difficulty: 'Intermediate',
    key_signature: 'C Major',
    tempo: 'Allegro',
    time_signature: '4/4',
    duration: '05:00',
    description: '',
  })

  // PDF File and Extracted Cover State
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfDetails, setPdfDetails] = useState(null) // { name, size, numPages }
  const [coverBlob, setCoverBlob] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')
  const [extractingCover, setExtractingCover] = useState(false)

  // Instrumentation List
  const [instrumentation, setInstrumentation] = useState([
    'Violin I',
    'Violin II',
    'Viola',
    'Cello',
  ])
  const [newInstrumentInput, setNewInstrumentInput] = useState('')

  // Movements List
  const [movements, setMovements] = useState(['I. Allegro'])
  const [newMovementInput, setNewMovementInput] = useState('')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Draft management
  const [showDraftModal, setShowDraftModal] = useState(() => hasDraft('create_score'))
  const [draftTimestamp, setDraftTimestamp] = useState(() => getDraftTimestamp('create_score'))

  const handleSaveDraft = useCallback(
    (notify = true) => {
      const draftData = {
        formData,
        instrumentation,
        movements,
        coverPreviewUrl,
      }
      const saved = saveDraft(draftData, 'create_score')
      if (saved) {
        const ts = getDraftTimestamp('create_score')
        setDraftTimestamp(ts)
        if (notify) {
          setSuccessMsg(`Draft tersimpan otomatis (${formatDraftTime(ts)})`)
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      }
    },
    [formData, instrumentation, movements, coverPreviewUrl],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      handleSaveDraft(false)
    }, 25000)
    return () => clearInterval(interval)
  }, [handleSaveDraft])

  const handleLoadDraft = () => {
    const draft = loadDraft('create_score')
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.instrumentation) setInstrumentation(draft.instrumentation)
      if (draft.movements) setMovements(draft.movements)
      if (draft.coverPreviewUrl) setCoverPreviewUrl(draft.coverPreviewUrl)
      setSuccessMsg('Draft berhasil dipulihkan!')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setShowDraftModal(false)
  }

  const handleDiscardDraft = () => {
    deleteDraft('create_score')
    setShowDraftModal(false)
  }

  // Handle PDF file selection & automatic thumbnail generation
  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Harap pilih file dokumen berformat PDF.')
      return
    }

    setError('')
    setPdfFile(file)

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`

    setPdfDetails({
      name: file.name,
      size: formattedSize,
      numPages: '...',
    })

    // Auto-fill title if empty
    if (!formData.title) {
      const suggestedTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
      setFormData((prev) => ({ ...prev, title: suggestedTitle }))
    }

    // Generate Cover Preview automatically from Page 1 of the PDF
    try {
      setExtractingCover(true)
      const result = await generatePdfThumbnail(file, { targetWidth: 800, quality: 0.9 })
      setCoverBlob(result.file)
      setCoverPreviewUrl(result.dataUrl)
      setPdfDetails((prev) => ({ ...prev, numPages: result.numPages }))
      setSuccessMsg('Cover halaman 1 PDF berhasil digenerate otomatis!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.warn('Gagal mengekstrak thumbnail PDF:', err)
      setError('Gagal membuat preview cover dari PDF, tetapi file PDF tetap dapat diunggah.')
    } finally {
      setExtractingCover(false)
    }
  }

  // Add / remove instruments
  const handleAddInstrument = (name) => {
    const clean = name.trim()
    if (clean && !instrumentation.includes(clean)) {
      setInstrumentation([...instrumentation, clean])
      setNewInstrumentInput('')
    }
  }

  const handleRemoveInstrument = (index) => {
    setInstrumentation(instrumentation.filter((_, i) => i !== index))
  }

  // Add / remove movements
  const handleAddMovement = () => {
    const clean = newMovementInput.trim()
    if (clean) {
      setMovements([...movements, clean])
      setNewMovementInput('')
    }
  }

  const handleRemoveMovement = (index) => {
    setMovements(movements.filter((_, i) => i !== index))
  }

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Judul partitur wajib diisi.')
      return
    }
    if (!formData.composer.trim()) {
      setError('Nama komposer / pencipta wajib diisi.')
      return
    }
    if (!pdfFile && !coverPreviewUrl) {
      setError('Harap unggah file partitur PDF terlebih dahulu.')
      return
    }

    try {
      setSubmitting(true)

      let uploadedPdfUrl = ''
      let uploadedCoverUrl = coverPreviewUrl

      // 1. Upload PDF
      if (pdfFile) {
        const pdfRes = await uploadService.uploadPdf(pdfFile)
        uploadedPdfUrl = pdfRes.data?.url || ''
      }

      // 2. Upload Cover Image (if generated from page 1)
      if (coverBlob) {
        const coverRes = await uploadService.uploadImage(coverBlob)
        uploadedCoverUrl = coverRes.data?.url || coverPreviewUrl
      }

      // 3. Save to database / scoreService
      const payload = {
        title: formData.title.trim(),
        composer: formData.composer.trim(),
        arranger: formData.arranger.trim() || 'Original',
        year_composed: Number(formData.year_composed) || null,
        category: formData.category,
        difficulty: formData.difficulty,
        key_signature: formData.key_signature.trim(),
        tempo: formData.tempo.trim(),
        time_signature: formData.time_signature.trim(),
        duration: formData.duration.trim(),
        instrumentation,
        movements,
        description: formData.description.trim(),
        file_url: uploadedPdfUrl,
        file_name: pdfDetails?.name || `${formData.title}.pdf`,
        file_size: pdfDetails?.size || '1.0 MB',
        cover_image_url: uploadedCoverUrl || 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80',
      }

      await scoreService.createScore(payload)
      deleteDraft('create_score')

      if (onSuccess) {
        onSuccess()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan partitur.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page">
      {/* Draft restoration modal */}
      {showDraftModal && (
        <ConfirmModal
          title="Pulihkan Draft Partitur?"
          message={`Tersimpan draft dari ${formatDraftTime(draftTimestamp)}. Apakah Anda ingin melanjutkan pengisian draft tersebut?`}
          confirmLabel="Ya, Pulihkan"
          cancelLabel="Buang Draft"
          onConfirm={handleLoadDraft}
          onCancel={handleDiscardDraft}
        />
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button type="button" className="detail-back" onClick={onBack} style={{ margin: 0 }}>
          <ArrowLeft size={18} /> Kembali
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => handleSaveDraft(true)}
            title="Simpan draft ke penyimpanan lokal browser"
          >
            <Save size={15} /> Simpan Draft
          </button>
        </div>
      </div>

      <h1 className="display" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', marginBottom: '8px', wordBreak: 'break-word' }}>
        Unggah Partitur Baru
      </h1>
      <p style={{ color: 'var(--steel)', marginBottom: '24px' }}>
        Unggah file PDF partitur musik Anda. Gambar cover akan dibuat secara otomatis dari halaman pertama PDF.
      </p>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#991b1b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', color: '#166534', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* PDF Upload Card */}
        <div
          style={{
            border: '2px dashed var(--line)',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: 'rgba(0,0,0,0.02)',
            marginBottom: '32px',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            style={{ display: 'none' }}
          />

          {!pdfFile && !coverPreviewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(180, 130, 60, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: 'var(--brass)',
                }}
              >
                <Upload size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                Pilih atau Tarik File Partitur PDF ke Sini
              </h3>
              <p style={{ color: 'var(--steel)', fontSize: '0.9rem', maxWidth: '450px' }}>
                Mendukung dokumen PDF hingga 35 MB. Halaman pertama otomatis diekstrak sebagai cover album/partitur.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                style={{ marginTop: '16px' }}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <FileText size={16} /> Pilih File PDF
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Cover Preview Image from Page 1 */}
              <div style={{ width: '180px', height: '240px', position: 'relative', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {extractingCover ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', textAlign: 'center' }}>
                    <Loader size={24} className="spin" color="var(--brass)" />
                    <span style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--steel)' }}>Mengekstrak Halaman 1...</span>
                  </div>
                ) : coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Cover Halaman 1"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={48} color="var(--brass)" />
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '6px',
                    right: '6px',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} color="var(--brass)" /> Cover Halaman 1
                </span>
              </div>

              {/* PDF Info & Change Button */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#166534', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
                  <CheckCircle size={14} /> Dokumen PDF Terpilih
                </div>
                <h4 style={{ fontSize: '1.2rem', margin: '4px 0' }}>{pdfDetails?.name}</h4>
                <p style={{ color: 'var(--steel)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Ukuran: <strong>{pdfDetails?.size}</strong> · Jumlah Halaman: <strong>{pdfDetails?.numPages}</strong>
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Ganti File PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      setPdfFile(null)
                      setCoverBlob(null)
                      setCoverPreviewUrl('')
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Metadata Grid */}
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Music size={20} color="var(--brass)" /> Detail Informasi Partitur
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="form-label">Judul Karya / Partitur *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Symphony No. 5 in C minor, Op. 67"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Komposer / Pengarang *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Ludwig van Beethoven"
              value={formData.composer}
              onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Pengaransemen (Arranger)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Original atau Karl Hermann"
              value={formData.arranger}
              onChange={(e) => setFormData({ ...formData, arranger: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Tahun Diciptakan</label>
            <input
              type="number"
              className="form-input"
              placeholder="Contoh: 1808"
              value={formData.year_composed}
              onChange={(e) => setFormData({ ...formData, year_composed: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Kategori / Formasi Ansambel</label>
            <select
              className="form-input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tingkat Kesulitan (Difficulty)</label>
            <select
              className="form-input"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            >
              <option value="Beginner">Beginner (Pemula)</option>
              <option value="Intermediate">Intermediate (Menengah)</option>
              <option value="Advanced">Advanced (Mahir)</option>
              <option value="Professional">Professional (Konser / Master)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Nada Dasar (Key Signature)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: C Minor, G Major, D Major"
              value={formData.key_signature}
              onChange={(e) => setFormData({ ...formData, key_signature: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Tempo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Allegro con brio, Andante"
              value={formData.tempo}
              onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Tanda Birama (Time Signature)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: 4/4, 3/4, 2/4, 6/8"
              value={formData.time_signature}
              onChange={(e) => setFormData({ ...formData, time_signature: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Estimasi Durasi (mm:ss)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: 05:30 atau 33:00"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
        </div>

        {/* Instrumentation Section */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">
            Daftar Instrumen / Bagian Partitur ({instrumentation.length})
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ketik nama instrumen baru (misal: Violin I, Cello)..."
              value={newInstrumentInput}
              onChange={(e) => setNewInstrumentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddInstrument(newInstrumentInput)
                }
              }}
            />
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => handleAddInstrument(newInstrumentInput)}
            >
              <Plus size={16} /> Tambah
            </button>
          </div>

          {/* Quick suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--steel)', marginRight: '4px', alignSelf: 'center' }}>
              Pilihan Cepat:
            </span>
            {QUICK_INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                className="btn btn--sm btn--outline"
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                onClick={() => handleAddInstrument(inst)}
              >
                + {inst}
              </button>
            ))}
          </div>

          {/* Active instruments list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {instrumentation.map((inst, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  border: '1px solid var(--line)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                {inst}
                <button
                  type="button"
                  onClick={() => handleRemoveInstrument(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#ef4444' }}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Movements Section */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Babak Gerakan Lagu (Movements)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: I. Allegro con brio..."
              value={newMovementInput}
              onChange={(e) => setNewMovementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddMovement()
                }
              }}
            />
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleAddMovement}
            >
              <Plus size={16} /> Tambah Babak
            </button>
          </div>

          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            {movements.map((mov, index) => (
              <li key={index} style={{ marginBottom: '6px', fontSize: '0.9rem' }}>
                <span style={{ marginRight: '8px' }}>{mov}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMovement(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '32px' }}>
          <label className="form-label">Catatan Karya &amp; Sejarah (Deskripsi)</label>
          <textarea
            className="form-input"
            rows="4"
            placeholder="Tuliskan latar belakang penciptaan partitur, interpretasi musik, atau panduan artikulasi..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <Loader size={16} className="spin" /> Menyimpan Partitur…
              </>
            ) : (
              <>
                <Upload size={16} /> Simpan &amp; Terbitkan Partitur
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
