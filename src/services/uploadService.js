import axios from 'axios'
import { BASE_URL, SUPABASE_KEY, IS_SUPABASE } from '../config/api'
import { getAccessToken, isAuthenticated } from './authService'

// ---------------------------------------------------------------------------
// UploadService — Sheet Music PDF & Cover Image Upload Service.
// Supports Supabase Storage (/storage/v1/object/:bucket/:file)
// with intelligent client-side Data URL fallback for offline resilience.
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_PDF_TYPES = ['application/pdf']
const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024 // 35 MB

class UploadService {
  /**
   * Upload a PDF sheet music file.
   * @param {File} file
   * @returns {Promise<{ success: boolean, data: { url: string, filename: string, size: string } }>}
   */
  async uploadPdf(file) {
    if (!file) {
      throw new Error('No PDF file provided.')
    }
    if (!ALLOWED_PDF_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Format file tidak valid. Harap unggah file dokumen PDF (.pdf).')
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Ukuran file melebihi batas 35 MB.')
    }

    return this.uploadFile(file, {
      bucket: 'scores',
      prefix: 'pdf',
      contentType: 'application/pdf',
    })
  }

  /**
   * Upload an image file (e.g. cover thumbnail).
   * @param {File} file
   * @returns {Promise<{ success: boolean, data: { url: string, filename: string } }>}
   */
  async uploadImage(file) {
    if (!file) {
      throw new Error('No image file provided.')
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Format gambar tidak valid. Format yang didukung: .jpg, .jpeg, .png, .webp')
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Ukuran gambar cover melebihi batas 10 MB.')
    }

    return this.uploadFile(file, {
      bucket: 'scores',
      prefix: 'cover',
      contentType: file.type || 'image/jpeg',
    })
  }

  /**
   * Generic file uploader to Supabase Storage with fallback.
   */
  async uploadFile(file, { bucket = 'scores', prefix = 'file', contentType = null } = {}) {
    if (!isAuthenticated()) throw new Error('Silakan masuk dengan akun Anda untuk mengunggah partitur.')
    const ext = file.name.split('.').pop() || 'bin'
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 25)
    const fileName = `${getAccessToken() ? 'user' : 'guest'}_${prefix}_${cleanBaseName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`
    const mimeType = contentType || file.type || 'application/octet-stream'

    // Format human readable size
    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`

    // --- Supabase Storage flow ---
    if (IS_SUPABASE) {
      try {
        const uploadUrl = `${BASE_URL}/storage/v1/object/${bucket}/${fileName}`
        await axios.post(uploadUrl, file, {
          headers: {
            'Content-Type': mimeType,
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${getAccessToken() || SUPABASE_KEY}`,
          },
          timeout: 45000,
        })

        const publicUrl = `${BASE_URL}/storage/v1/object/public/${bucket}/${fileName}`
        return {
          success: true,
          data: {
            url: publicUrl,
            filename: file.name,
            storedName: fileName,
            size: sizeFormatted,
          },
        }
      } catch (err) {
        console.warn(`[UploadService] Supabase bucket '${bucket}' upload failed or not found, using data URL fallback:`, err.message)

        // Read file as base64 Data URL so the file can still be previewed & opened offline
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        return {
          success: true,
          data: {
            url: dataUrl,
            filename: file.name,
            storedName: fileName,
            size: sizeFormatted,
          },
        }
      }
    }

    // --- University API / standard REST fallback ---
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${BASE_URL}/api/v1/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      })

      return response.data
    } catch {
      // Offline fallback
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      return {
        success: true,
        data: {
          url: dataUrl,
          filename: file.name,
          storedName: fileName,
          size: sizeFormatted,
        },
      }
    }
  }
}

export default new UploadService()
