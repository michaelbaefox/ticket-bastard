import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown } from 'lucide-react'
import AnimatedLogo from './AnimatedLogo'

export default function HeroSection() {
  const [ctaAlt, setCtaAlt] = React.useState(false)
  const [footerFlash, setFooterFlash] = React.useState<string | null>(null)
  const [logoGlitchActive, setLogoGlitchActive] = React.useState(false)
  const [howItWorksVisible, setHowItWorksVisible] = React.useState(false)
  const footerResetTimeoutRef = React.useRef<number | null>(null)
  const howItWorksSectionRef = React.useRef<HTMLElement | null>(null)
  const statusMessage = footerFlash ?? ''
  const heroGlitchWordClasses = React.useMemo(() => {
    const classes = ['hero-glitch-word']

    if (logoGlitchActive) {
      classes.push('hero-glitch-word--active')
    }

    return classes.join(' ')
  }, [logoGlitchActive])
  const ctaPrimaryLabel = React.useMemo(() => {
    return ctaAlt ? '[  BUY THE LIE  ]' : '[  GET TICKETS  ]'
  }, [ctaAlt])
  const ctaPrimaryCaption = React.useMemo(() => {
    return ctaAlt ? 'Induct yourself into the chain.' : 'Prove you belong in the room.'
  }, [ctaAlt])

  const handleScrollHintKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleScrollHintClick()
  }

  const handleScrollHintClick = () => {
    const target = document.getElementById('how-it-works-section')

    if (!target) {
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCtaAlt(prev => !prev)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const footerMessages = [
    "We're watching you.",
    'Ticket confirmed by BastardChain.',
    'System notice: autonomy restored.',
  ]

  const handleCtaHover = () => {
    if (footerResetTimeoutRef.current !== null) {
      window.clearTimeout(footerResetTimeoutRef.current)
      footerResetTimeoutRef.current = null
    }

    const msg = footerMessages[Math.floor(Math.random() * footerMessages.length)]
    setFooterFlash(msg)
    footerResetTimeoutRef.current = window.setTimeout(() => {
      setFooterFlash(null)
      footerResetTimeoutRef.current = null
    }, 1600)
  }

  const handleCtaFocus: React.FocusEventHandler<HTMLButtonElement> = () => {
    handleCtaHover()
  }

  React.useEffect(() => {
    const target = howItWorksSectionRef.current

    if (!target || typeof window === 'undefined') {
      return () => {}
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHowItWorksVisible(true)
          }
        })
      },
      {
        threshold: 0.25,
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (footerResetTimeoutRef.current !== null) {
        window.clearTimeout(footerResetTimeoutRef.current)
        footerResetTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col pt-24 relative overflow-hidden">
      <div className="min-h-screen flex flex-col">

      {/* Subtle CRT/VHS background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,133,197,0.18)_0%,_rgba(0,0,0,0.85)_54%,_rgba(0,0,0,1)_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-screen bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.08)_0px,rgba(255,255,255,.08)_1px,transparent_1px,transparent_3px)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(120,240,255,0.08)_0%,_transparent_55%)]" />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 mix-blend-overlay opacity-20 animate-[heroGrain_12s_linear_infinite] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%204%204%22%3E%3Cpath%20fill=%22white%22%20fill-opacity=%220.08%22%20d=%22M0%200h1v1H0zM2%201h1v1H2zM3%200h1v1H3zM1%202h1v1H1zM0%203h1v1H0z%22/%3E%3C/svg%3E')]" />
      </div>

      {/* Hero – two column layout */}
      <section className="flex-1 flex items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="w-full max-w-[1280px] mx-auto flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
          {/* Left: logo */}
          <div className="w-full max-w-xs sm:max-w-sm lg:max-w-none lg:basis-5/12 relative flex justify-center">
            <AnimatedLogo className="max-w-[420px] md:max-w-[480px]" glitchIntensity="loud" onGlitchStateChange={setLogoGlitchActive} />
          </div>

          {/* Right: info + CTAs */}
          <div className="w-full lg:basis-7/12 text-center lg:text-left">
            <div className="relative space-y-4">
              <h1 className="text-[32px] sm:text-[36px] md:text-[40px] font-extrabold leading-tight tracking-[-0.02em]">
                <span >F***</span> the system. Scan the{' '}
                <span className={heroGlitchWordClasses} data-text="bastard">
                  bastard
                </span>
                .
              </h1>
              <p className="mx-auto lg:mx-0 text-base leading-relaxed text-neo-contrast/70 max-w-prose">
                Plain, portable, verifiable. No vendor lock‑in. No middlemen.
              </p>

              <ul className="mt-5 space-y-3 text-sm sm:text-base text-neo-contrast/90">
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="relative mt-[4px] grid h-3 w-3 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-[rgba(255,133,197,0.35)] blur-[2px]" aria-hidden="true" />
                    <span className="relative mt-[0px] h-2 w-2 rounded-sm" style={{ backgroundColor: '#ff85c5' }} />
                  </span>
                  <span className="flex-1 text-left">On‑chain outputs. No middlemen.</span>
                </li>
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="relative mt-[4px] grid h-3 w-3 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-neo-contrast/20 blur-[2px]" aria-hidden="true" />
                    <span className="relative mt-0 h-2 w-2 rounded-sm bg-neo-contrast/70" />
                  </span>
                  <span className="flex-1 text-left">Encrypted seat. Your privacy.</span>
                </li>
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="relative mt-[4px] grid h-3 w-3 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-neo-contrast/20 blur-[2px]" aria-hidden="true" />
                    <span className="relative mt-0 h-2 w-2 rounded-sm bg-neo-contrast/70" />
                  </span>
                  <span className="flex-1 text-left">Built‑in resale. No scalpers.</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
              <Link to="/tickets" className="w-full sm:w-auto">
                <button
                  className="relative isolate overflow-hidden w-full sm:w-auto h-[52px] sm:h-[56px] px-10 sm:px-12 text-sm sm:text-base font-black font-mono tracking-[0.2em] border border-neo-border bg-neo-contrast text-neo-contrast-inverse transition-none uppercase shadow-neo-lg hover:shadow-neo-md active:translate-x-[2px] active:translate-y-[2px] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-neo-contrast-inverse focus-visible:outline-none before:absolute before:inset-[-2px] before:bg-[conic-gradient(from_90deg_at_50%_50%,rgba(255,133,197,0.28),rgba(118,243,255,0.28),rgba(255,133,197,0.28))] before:opacity-0 before:transition before:duration-500 before:content-[''] hover:before:opacity-80"
                  onMouseEnter={handleCtaHover}
                  onFocus={handleCtaFocus}
                  aria-label="Get tickets"
                >
                  <span className="relative z-10 block">{ctaPrimaryLabel}</span>
                </button>
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto h-[52px] sm:h-[56px] px-8 sm:px-10 text-sm sm:text-base font-bold font-mono tracking-[0.2em] border border-neo-border bg-transparent text-neo-contrast transition-none uppercase shadow-neo-lg hover:shadow-neo-md hover:bg-neo-contrast hover:text-neo-contrast-inverse active:translate-x-[2px] active:translate-y-[2px] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-neo-contrast focus-visible:outline-none"
                  onMouseEnter={handleCtaHover}
                  onFocus={handleCtaFocus}
                  aria-label="Sell a ticket"
                >
                  [  SELL A TICKET  ]
                </button>
              </Link>
            </div>

            {/* Sub-copy */}
            <p className="mt-6 text-xs md:text-sm font-mono tracking-[0.02em] text-neo-contrast/60">"You don't own your tickets. Venues do. Until now."</p>
            <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.28em] text-neo-contrast/40" aria-hidden="true">
              {ctaPrimaryCaption}
            </p>
            <p
              className="text-xs font-mono text-neo-contrast/40 mt-2 min-h-[18px]"
              role="status"
              aria-live="polite"
              aria-hidden={statusMessage === ''}
            >
              {statusMessage === '' ? ' ' : statusMessage}
            </p>
          </div>
        </div>
      </section>

      {/* Interstitial - Adult Swim style */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 text-center border-t border-neo-border/20 pt-12">
        <p className="text-[11px] font-mono tracking-[0.45em] text-neo-contrast/60 mb-3">SYSTEM NOTICE</p>
        <div className="mx-auto max-w-2xl text-sm md:text-base leading-relaxed text-neo-contrast/70">
          <div className="relative overflow-hidden border border-neo-border/10 bg-black/20">
            <div className="px-6 py-4 whitespace-nowrap will-change-transform animate-[systemMarquee_24s_linear_infinite]">
              This website is not a joke. Unless you think it is. Then it's definitely a joke.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-4 text-sm md:text-base text-neo-contrast/60">
            <span>Blockchain-native</span>
            <span className="text-neo-contrast/30 px-2">•</span>
            <span>End-to-end encrypted</span>
            <span className="text-neo-contrast/30 px-2">•</span>
            <span>No platform fees</span>
          </div>
        </div>
      </section>

      {/* Scroll hint */}
      <div className="py-8 flex justify-center">
        <button
          type="button"
          onClick={handleScrollHintClick}
          onKeyDown={handleScrollHintKeyDown}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full border border-neo-border/40 bg-transparent text-neo-contrast/80 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-contrast"
          aria-label="Scroll to how it works section"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-neo-border/10 opacity-70 group-hover:opacity-100 group-focus-visible:opacity-100 animate-[scrollHintPulse_3.6s_ease_in_out_infinite]"
          />
          <ArrowDown className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" aria-hidden="true" />
        </button>
      </div>

      {/* How it works */}
      <section
        ref={howItWorksSectionRef}
        id="how-it-works-section"
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div
          className={`max-w-5xl mx-auto text-center transition-transform transition-opacity duration-700 ease-out ${howItWorksVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
          <p className="mt-6 font-mono tracking-widest text-sm sm:text-base text-neo-contrast/80">
            <span className="inline-flex items-center justify-center rounded-sm border border-neo-border/30 px-2 py-1 uppercase">BUY</span>
            <span className="mx-2 text-neo-contrast/40">→</span>
            <span className="inline-flex items-center justify-center rounded-sm border border-neo-border/30 px-2 py-1 uppercase">HOLD</span>
            <span className="mx-2 text-neo-contrast/40">→</span>
            <span className="inline-flex items-center justify-center rounded-sm border border-neo-border/30 px-2 py-1 uppercase">SCAN</span>
            <span className="mx-2 text-neo-contrast/40">→</span>
            <span className="inline-flex items-center justify-center rounded-sm border border-neo-border/30 px-2 py-1 uppercase">REDEEM</span>
            <span className="mx-2 text-neo-contrast/40">→</span>
            <span className="inline-flex items-center justify-center rounded-sm border border-neo-border/30 px-2 py-1 uppercase">RESELL</span>
          </p>

          {/* Final CTA */}
          <div className="mt-10 sm:mt-12 inline-block">
            <Link to="/marketplace">
              <button className="px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-bold font-mono tracking-widest border border-neo-border bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse transition-colors">
                Browse Marketplace
              </button>
            </Link>
          </div>
          <div className="mt-6 text-xs sm:text-sm text-neo-contrast/60">
            Looking for the tech under the hood?{' '}
            <Link to="/docs" className="underline underline-offset-4 decoration-dotted hover:text-neo-contrast">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}