import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker for Vite environment
try {
  // Use Vite URL resolution for the worker bundled in node_modules
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
} catch {
  // Fallback to CDN worker if dynamic import resolution fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`
}

/**
 * Extracts and renders the first page of a PDF file into a high-quality JPEG image.
 *
 * @param {File|Blob|ArrayBuffer} pdfSource
 * @param {Object} options
 * @param {number} [options.targetWidth=800] - Desired width of the thumbnail in pixels
 * @param {number} [options.quality=0.88] - JPEG quality (0.0 - 1.0)
 * @returns {Promise<{ blob: Blob, file: File, dataUrl: string, width: number, height: number, numPages: number }>}
 */
export async function generatePdfThumbnail(pdfSource, options = {}) {
  const { targetWidth = 800, quality = 0.88 } = options

  if (!pdfSource) {
    throw new Error('No PDF file provided.')
  }

  let arrayBuffer
  let fileName = 'score_cover.jpg'

  if (pdfSource instanceof File) {
    fileName = `${pdfSource.name.replace(/\.[^/.]+$/, '')}_cover.jpg`
    arrayBuffer = await pdfSource.arrayBuffer()
  } else if (pdfSource instanceof Blob) {
    arrayBuffer = await pdfSource.arrayBuffer()
  } else if (pdfSource instanceof ArrayBuffer) {
    arrayBuffer = pdfSource
  } else if (typeof pdfSource === 'string') {
    // If a URL is passed
    const response = await fetch(pdfSource)
    arrayBuffer = await response.arrayBuffer()
  } else {
    throw new Error('Unsupported PDF source format.')
  }

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  })

  const pdf = await loadingTask.promise
  const numPages = pdf.numPages

  // Always extract page 1 for the cover preview
  const page = await pdf.getPage(1)

  // Compute viewport scale based on targetWidth
  const unscaledViewport = page.getViewport({ scale: 1.0 })
  const scale = targetWidth / unscaledViewport.width
  const viewport = page.getViewport({ scale })

  // Create canvas
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  // Render white background first (PDF pages are often transparent)
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  }

  await page.render(renderContext).promise

  // Convert canvas to Blob & Data URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image from PDF canvas.'))
          return
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const file = new File([blob], fileName, { type: 'image/jpeg' })

        resolve({
          blob,
          file,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          numPages,
        })
      },
      'image/jpeg',
      quality,
    )
  })
}

export default generatePdfThumbnail
