import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex justify-end items-center gap-8 text-sm text-muted-foreground">
          <Link to="/marketplace" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200">Marketplace</Link>
          <Link to="/tickets" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200">My Tickets</Link>
          <Link to="/venue" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200">Venue</Link>
          <Link to="/organizer" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200">Organizer</Link>
        </div>
      </nav>

      {/* Subtle CRT/VHS background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-screen bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.08)_0px,rgba(255,255,255,.08)_1px,transparent_1px,transparent_3px)]" />
      </div>

      {/* Hero – two column layout */}
      <section className="flex-1 flex items-center px-4 py-16 mt-16">
        <div className="w-full max-w-[1280px] mx-auto flex flex-row items-center gap-20">
          {/* Left: logo */}
          <div className="basis-[41.6667%] shrink-0 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -inset-4 opacity-[0.18] blur-2xl" style={{ background: 'radial-gradient(circle at 40% 20%, rgba(229,75,140,0.24), rgba(99,102,241,0.14) 40%, transparent 60%)' }} />
            <img
              src="/tb-logo.png"
              alt="TicketBastard — F*** the system. Scan the bastard."
              className="relative z-10 w-full max-w-[480px] h-auto select-none drop-shadow-[0_0_40px_rgba(229,75,140,0.25)]"
              style={{ imageRendering: 'crisp-edges' }}
              draggable={false}
            />
          </div>

          {/* Right: info + CTAs */}
          <div className="basis-[58.3333%]">
            <div className="relative">
            <h1 className="text-[40px] font-extrabold leading-[1.15] tracking-[-0.005em] text-foreground">
              F** the system. <span className="text-muted-foreground">Own your tickets.</span>
            </h1>
            <p className="mt-4 text-[16px] leading-[26px] text-muted-foreground max-w-[55ch]">Plain, portable, verifiable. No vendor lock‑in. No middlemen.</p>

            <ul className="mt-5 space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-sm bg-primary" />
                <span>On‑chain outputs. No middlemen.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-sm bg-muted-foreground" />
                <span>Encrypted seat. Your privacy.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-sm bg-muted-foreground" />
                <span>Built‑in resale. No scalpers.</span>
              </li>
            </ul>
            </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-4">
            <Link to="/purchase" className="block">
              <button
                className="w-full sm:w-auto h-[56px] px-12 text-[16px] font-black font-mono tracking-[0.2em] border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-none uppercase shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px]"
                onMouseEnter={handleCtaHover}
                aria-label="Get tickets"
              >
                {ctaAlt ? '[  BUY THE LIE  ]' : '[  GET TICKETS  ]'}
              </button>
            </Link>
            <Link to="/marketplace" className="block">
              <button
                className="w-full sm:w-auto h-[56px] px-10 text-[16px] font-bold font-mono tracking-[0.2em] border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-none uppercase shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px]"
                onMouseEnter={handleCtaHover}
                aria-label="Sell a ticket"
              >
                [  SELL A TICKET  ]
              </button>
            </Link>
          </div>

          {/* Sub-copy */}
          <p className="mt-6 text-xs md:text-sm font-mono tracking-[0.02em] text-muted-foreground">"You don't own your tickets. Venues do. Until now."</p>
          {footerFlash && (
            <p className="text-xs font-mono text-muted-foreground/60 mt-2" role="status" aria-live="polite">{footerFlash}</p>
          )}
          </div>
        </div>
      </section>

      {/* Interstitial - Adult Swim style */}
      <section className="py-8 px-4 text-center border-t border-border pt-12">
        <p className="text-[11px] font-mono tracking-[0.45em] text-muted-foreground mb-3">SYSTEM NOTICE</p>
        <p className="mx-auto max-w-2xl text-sm md:text-base leading-relaxed text-muted-foreground">
          This website is not a joke. Unless you think it is. Then it's definitely a joke. Either way: you need tickets.
        </p>
      </section>

      {/* Feature Strip */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-4 text-sm text-muted-foreground">
          <span>Blockchain-native</span>
          <span className="text-muted-foreground/30 px-2">•</span>
          <span>End-to-end encrypted</span>
          <span className="text-muted-foreground/30 px-2">•</span>
          <span>No platform fees</span>
        </div>
        </div>
      </section>

      {/* Scroll hint */}
      <div className="py-8 flex justify-center">
        <ArrowDown className="w-12 h-12 text-foreground/80 animate-bounce hover:scale-110 cursor-pointer transition-transform" />
      </div>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground">How it works</h2>
          <p className="mt-6 font-mono tracking-widest text-sm text-foreground/80">BUY → HOLD → SCAN → REDEEM → RESELL</p>

          {/* Final CTA */}
          <div className="mt-12 inline-block">
            <Link to="/marketplace">
              <button className="px-10 py-4 text-base font-bold font-mono tracking-widest border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors">
                Browse Marketplace
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}