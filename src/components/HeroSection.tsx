import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown } from 'lucide-react'
import AnimatedLogo from './AnimatedLogo'

export default function HeroSection() {
  const [ctaAlt, setCtaAlt] = React.useState(false)
  const [footerFlash, setFooterFlash] = React.useState<string | null>(null)
  const [logoGlitchActive, setLogoGlitchActive] = React.useState(false)
  const statusMessage = footerFlash ?? ''
  const heroGlitchWordClasses = React.useMemo(() => {
    const classes = ['hero-glitch-word']

    if (logoGlitchActive) {
      classes.push('hero-glitch-word--active')
    }

    return classes.join(' ')
  }, [logoGlitchActive])

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
    const msg = footerMessages[Math.floor(Math.random() * footerMessages.length)]
    setFooterFlash(msg)
    setTimeout(() => setFooterFlash(null), 1600)
  }

  return (
    <div className="min-h-screen flex flex-col pt-24">
      <div className="min-h-screen flex flex-col">

      {/* Subtle CRT/VHS background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-screen bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.08)_0px,rgba(255,255,255,.08)_1px,transparent_1px,transparent_3px)]" />
      </div>

      {/* Hero – two column layout */}
      <section className="flex-1 flex items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="w-full max-w-[1280px] mx-auto flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
          {/* Left: logo */}
          <div className="w-full max-w-xs sm:max-w-sm lg:max-w-none lg:basis-5/12 relative flex justify-center">
            <AnimatedLogo className="max-w-[420px] md:max-w-[480px]" onGlitchStateChange={setLogoGlitchActive} />
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
                  <span className="mt-[6px] h-2 w-2 rounded-sm" style={{ backgroundColor: '#ff85c5' }} />
                  <span>On‑chain outputs. No middlemen.</span>
                </li>
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="mt-[6px] h-2 w-2 rounded-sm bg-neo-contrast/70" />
                  <span>Encrypted seat. Your privacy.</span>
                </li>
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="mt-[6px] h-2 w-2 rounded-sm bg-neo-contrast/70" />
                  <span>Built‑in resale. No scalpers.</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
              <Link to="/tickets" className="w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto h-[52px] sm:h-[56px] px-10 sm:px-12 text-sm sm:text-base font-black font-mono tracking-[0.2em] border border-neo-border bg-neo-contrast text-neo-contrast-inverse hover:bg-neo-contrast-inverse hover:text-neo-contrast transition-none uppercase shadow-neo-lg hover:shadow-neo-md active:translate-x-[2px] active:translate-y-[2px]"
                  onMouseEnter={handleCtaHover}
                  aria-label="Get tickets"
                >
                  {ctaAlt ? '[  BUY THE LIE  ]' : '[  GET TICKETS  ]'}
                </button>
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto h-[52px] sm:h-[56px] px-8 sm:px-10 text-sm sm:text-base font-bold font-mono tracking-[0.2em] border border-neo-border bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse transition-none uppercase shadow-neo-lg hover:shadow-neo-md active:translate-x-[2px] active:translate-y-[2px]"
                  onMouseEnter={handleCtaHover}
                  aria-label="Sell a ticket"
                >
                  [  SELL A TICKET  ]
                </button>
              </Link>
            </div>

            {/* Sub-copy */}
            <p className="mt-6 text-xs md:text-sm font-mono tracking-[0.02em] text-neo-contrast/60">"You don't own your tickets. Venues do. Until now."</p>
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
        <p className="mx-auto max-w-2xl text-sm md:text-base leading-relaxed text-neo-contrast/70">
          This website is not a joke. Unless you think it is. Then it's definitely a joke. Either way: you need tickets.
        </p>
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
          className="flex items-center justify-center rounded-full border border-neo-border/40 bg-transparent p-3 text-neo-contrast/80 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-contrast"
          aria-label="Scroll to how it works section"
        >
          <ArrowDown className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" aria-hidden="true" />
        </button>
      </div>

      {/* How it works */}
      <section id="how-it-works-section" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
          <p className="mt-6 font-mono tracking-widest text-sm sm:text-base text-neo-contrast/80">BUY → HOLD → SCAN → REDEEM → RESELL</p>

          {/* Final CTA */}
          <div className="mt-10 sm:mt-12 inline-block">
            <Link to="/marketplace">
              <button className="px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-bold font-mono tracking-widest border border-neo-border bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse transition-colors">
                Browse Marketplace
              </button>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}