import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown } from 'lucide-react'
import tbLogo from '../assets/tb-logo.png'

export default function HeroSection() {
  const [ctaAlt, setCtaAlt] = React.useState(false)
  const [footerFlash, setFooterFlash] = React.useState<string | null>(null)

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
      <section className="flex-1 flex items-center px-4 py-16">
        <div className="w-full max-w-[1280px] mx-auto flex flex-row items-center gap-20">
          {/* Left: logo */}
          <div className="basis-[41.6667%] shrink-0 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -inset-4 opacity-[0.18] blur-2xl" style={{ background: 'radial-gradient(circle at 40% 20%, rgba(229,75,140,0.24), rgba(99,102,241,0.14) 40%, transparent 60%)' }} />
            <img
              src={tbLogo}
              alt="TicketBastard — F*** the system. Scan the bastard."
              className="relative z-10 w-full max-w-[480px] h-auto select-none drop-shadow-neo-glow"
              style={{ imageRendering: 'crisp-edges' }}
              draggable={false}
            />
          </div>

          {/* Right: info + CTAs */}
          <div className="basis-[58.3333%]">
            <div className="relative">
              <h1 className="text-[40px] font-extrabold leading-[1.15] tracking-[-0.005em]">
                F** the system. <span className="text-neo-contrast/80">Own your tickets.</span>
              </h1>
              <p className="mt-4 text-[16px] leading-[26px] text-neo-contrast/70 max-w-[55ch]">Plain, portable, verifiable. No vendor lock‑in. No middlemen.</p>

              <ul className="mt-5 space-y-3 text-sm text-neo-contrast/90">
                <li className="flex items-start gap-3">
                  <span className="mt-[6px] h-2 w-2 rounded-sm" style={{ backgroundColor: '#ff85c5' }} />
                  <span>On‑chain outputs. No middlemen.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[6px] h-2 w-2 rounded-sm bg-neo-contrast/70" />
                  <span>Encrypted seat. Your privacy.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[6px] h-2 w-2 rounded-sm bg-neo-contrast/70" />
                  <span>Built‑in resale. No scalpers.</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-col sm:flex-row gap-4">
              <Link to="/purchase" className="block">
                <button
                  className="w-full sm:w-auto h-[56px] px-12 text-[16px] font-black font-mono tracking-[0.2em] border border-neo-border bg-neo-contrast text-neo-contrast-inverse hover:bg-neo-contrast-inverse hover:text-neo-contrast transition-none uppercase shadow-neo-lg hover:shadow-neo-md active:translate-x-[2px] active:translate-y-[2px]"
                  onMouseEnter={handleCtaHover}
                  aria-label="Get tickets"
                >
                  {ctaAlt ? '[  BUY THE LIE  ]' : '[  GET TICKETS  ]'}
                </button>
              </Link>
              <Link to="/marketplace" className="block">
                <button
                  className="w-full sm:w-auto h-[56px] px-10 text-[16px] font-bold font-mono tracking-[0.2em] border border-neo-border bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse transition-none uppercase shadow-neo-lg hover:shadow-neo-md active:translate-x-[2px] active:translate-y-[2px]"
                  onMouseEnter={handleCtaHover}
                  aria-label="Sell a ticket"
                >
                  [  SELL A TICKET  ]
                </button>
              </Link>
            </div>

            {/* Sub-copy */}
            <p className="mt-6 text-xs md:text-sm font-mono tracking-[0.02em] text-neo-contrast/60">"You don't own your tickets. Venues do. Until now."</p>
            {footerFlash && (
              <p className="text-xs font-mono text-neo-contrast/40 mt-2" role="status" aria-live="polite">{footerFlash}</p>
            )}
          </div>
        </div>
      </section>

      {/* Interstitial - Adult Swim style */}
      <section className="py-8 px-4 text-center border-t border-neo-border/20 pt-12">
        <p className="text-[11px] font-mono tracking-[0.45em] text-neo-contrast/60 mb-3">SYSTEM NOTICE</p>
        <p className="mx-auto max-w-2xl text-sm md:text-base leading-relaxed text-neo-contrast/70">
          This website is not a joke. Unless you think it is. Then it's definitely a joke. Either way: you need tickets.
        </p>
      </section>

      {/* Feature Strip */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-4 text-sm text-neo-contrast/60">
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
        <ArrowDown className="w-12 h-12 text-neo-contrast/80 animate-bounce hover:scale-110 cursor-pointer transition-transform" />
      </div>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold">How it works</h2>
          <p className="mt-6 font-mono tracking-widest text-sm text-neo-contrast/80">BUY → HOLD → SCAN → REDEEM → RESELL</p>

          {/* Final CTA */}
          <div className="mt-12 inline-block">
            <Link to="/marketplace">
              <button className="px-10 py-4 text-base font-bold font-mono tracking-widest border border-neo-border bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse transition-colors">
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