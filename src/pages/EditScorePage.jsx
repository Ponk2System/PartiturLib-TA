import { useState, useRef } from 'react'
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
} from 'lucide-react'
import scoreService from '../services/scoreService'
import uploadService from '../services/uploadService'
import { generatePdfThumbnail } from '../utils/pdfThumbnail'

const CATEGORIES = [
  'Orchestra',
  'String Section',
  'Solo Instrument',
  'Woodwind & Brass',
  'Choir / Vocal',
]

export default function EditScorePage({ score, onBack, onSuccess }) {
  const fileInputRef = useRef(null)
  const item = score || {}

  const [formData, setFormData] = useState({
    title: item.title || item.name || '',
    composer: item.composer || item.caliber || '',
    arranger: item.arranger || 'Original',
    year_composed: item.year_composed || item.price || '',
    category: item.category || item.type || 'Orchestra',
    difficulty: item.difficulty || 'Intermediate',
    key_signature: item.key_signature || 'C Major',
    tempo: item.tempo || 'Allegro',
    time_signature: item.time_signature || '4/4',
    duration: item.duration || '05:00',
    description: item.description || '',
  })

  // PDF & Cover State
  const [pdfFile, setPdfFile] = useState(null)
  const [coverBlob, setCoverBlob] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(
    item.cover_image_url || item.image_url || item.image || '',
  )
  const [extractingCover, setExtractingCover] = useState(false)

  // Instrumentation
  const [instrumentation, setInstrumentation] = useState(
    Array.isArray(item.instrumentation) && item.instrumentation.length > 0
      ? item.instrumentation
      : ['Violin I', 'Violin II', 'Viola', 'Cello'],
  )
  const [newInstrumentInput, setNewInstrumentInput] = useState('')

  // Movements
  const [movements, setMovements] = useState(
    Array.isArray(item.movements) && item.movements.length > 0
      ? item.movements
      : ['I. Movement'],
  )
  const [newMovementInput, setNewMovementInput] = useState('')

  // UI status
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPdfFile(file)
    try {
      setExtractingCover(true)
      const result = await generatePdfThumbnail(file, { targetWidth: 800, quality: 0.9 })
      setCoverBlob(result.file)
      setCoverPreviewUrl(result.dataUrl)
      setSuccessMsg('Cover halaman 1 PDF baru berhasil digenerate otomatis!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.warn('Gagal ekstrak thumbnail:', err)
    } finally {
      setExtractingCover(false)
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Judul partitur wajib diisi.')
      return
    }

    try {
      setSubmitting(true)

      let uploadedPdfUrl = item.file_url
      let uploadedCoverUrl = coverPreviewUrl

      if (pdfFile) {
        const pdfRes = await uploadService.uploadPdf(pdfFile)
        uploadedPdfUrl = pdfRes.data?.url || item.file_url
      }

      if (coverBlob) {
        const coverRes = await uploadService.uploadImage(coverBlob)
        uploadedCoverUrl = coverRes.data?.url || coverPreviewUrl
      }

      const payload = {
        title: formData.title.trim(),
        composer: formData.composer.trim(),
        arranger: formData.arranger.trim(),
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
        cover_image_url: uploadedCoverUrl,
      }

      await scoreService.updateScore(item.id, payload)

      if (onSuccess) {
        onSuccess()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      setError(err.message || 'Gagal memperbarui partitur.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button type="button" className="detail-back" onClick={onBack} style={{ margin: 0 }}>
          <ArrowLeft size={18} /> Kembali
        </button>
      </div>

      <h1 className="display" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', marginBottom: '8px', wordBreak: 'break-word' }}>
        Edit Partitur: {item.title || item.name}
      </h1>
      <p style={{ color: 'var(--steel)', marginBottom: '24px' }}>
        Perbarui metadata partitur atau ganti file dokumen PDF beserta covernya.
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
        {/* PDF & Cover Row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px', padding: '16px', border: '1px solid var(--line)', borderRadius: '8px' }}>
          <div style={{ width: '120px', height: '160px', position: 'relative', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', backgroundColor: '#eee' }}>
            {extractingCover ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={20} className="spin" />
              </div>
            ) : coverPreviewUrl ? (
              <img src={coverPreviewUrl} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={32} color="var(--brass)" />
              </div>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 6px 0' }}>File PDF Partitur Saat Ini</h4>
            <p style={{ color: 'var(--steel)', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
              {pdfFile ? pdfFile.name : (item.file_name || 'Dokumen PDF tersimpan')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Ganti File PDF &amp; Ekstrak Cover Baru
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="form-label">Judul Partitur *</label>
            <input
              type="text"
              className="form-input"
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
              value={formData.arranger}
              onChange={(e) => setFormData({ ...formData, arranger: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Tahun Diciptakan</label>
            <input
              type="number"
              className="form-input"
              value={formData.year_composed}
              onChange={(e) => setFormData({ ...formData, year_composed: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Kategori / Formasi</label>
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
            <label className="form-label">Tingkat Kesulitan</label>
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
            <label className="form-label">Nada Dasar</label>
            <input
              type="text"
              className="form-input"
              value={formData.key_signature}
              onChange={(e) => setFormData({ ...formData, key_signature: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Tempo</label>
            <input
              type="text"
              className="form-input"
              value={formData.tempo}
              onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Tanda Birama</label>
            <input
              type="text"
              className="form-input"
              value={formData.time_signature}
              onChange={(e) => setFormData({ ...formData, time_signature: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Durasi (mm:ss)</label>
            <input
              type="text"
              className="form-input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
        </div>

        {/* Instrumentation */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Daftar Instrumen ({instrumentation.length})</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tambah instrumen..."
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
                {typeof inst === 'object' ? `${inst.name} ${inst.quantity}` : inst}
                <button
                  type="button"
                  onClick={() => handleRemoveInstrument(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Movements */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Babak Gerakan Lagu (Movements)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tambah babak..."
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
                <span style={{ marginRight: '8px' }}>
                  {typeof mov === 'object' ? mov.instruction || mov.name : mov}
                </span>
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
          <label className="form-label">Catatan Karya &amp; Sejarah</label>
          <textarea
            className="form-input"
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader size={16} className="spin" /> Menyimpan Perubahan…
              </>
            ) : (
              <>
                <Save size={16} /> Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
