import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, Music } from 'lucide-react'
import './SplashScreen.css'

/**
 * SplashScreen — Signature introduction animation for PartiturLib.
 * Perfectly centered logo emblem and brand title.
 */
export default function SplashScreen({ onFinish, duration = 3500 }) {
  const [isFading, setIsFading] = useState(false)
  const dismissedRef = useRef(false)

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setIsFading(true)
    setTimeout(() => {
      if (onFinish) onFinish()
    }, 500)
  }, [onFinish])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [duration, handleDismiss])

  return (
    <main
      className={`splash-overlay ${isFading ? 'splash-overlay--fading' : ''}`}
      id="splash"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="PartiturLib Intro"
    >
      {/* Ambient background glow */}
      <div className="splash-ambient-glow" aria-hidden="true" />

      {/* Perfectly Centered Content */}
      <div className="splash-center">
        {/* Musical Emblem */}
        <div className="splash-emblem">
          <Music size={52} color="#ffffff" />
        </div>

        {/* Brand Title & Subtitle */}
        <section className="splash-brand">
          <h1 className="splash-brand-name">
            Partitur<span>Lib</span>
          </h1>
          <div className="splash-brand-sub">
            PERPUSTAKAAN &amp; ARSIP PARTITUR DIGITAL
          </div>
          <div className="splash-divider" aria-hidden="true" />
        </section>
      </div>

      {/* Skip button */}
      <button
        type="button"
        className="splash-skip-btn"
        onClick={(e) => {
          e.stopPropagation()
          handleDismiss()
        }}
        aria-label="Masuk ke Perpustakaan"
      >
        <span>Masuk Perpustakaan</span>
        <ArrowRight size={15} />
      </button>

      <span className="splash-hint">TA PPB 2026b</span>
    </main>
  )
}
