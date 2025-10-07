import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, ShoppingCart, BarChart3, Home, Ticket, Wallet, Menu, X } from 'lucide-react'
import { Button } from './components/ui/button'
import { Toaster as ShadcnToaster } from './components/ui/toaster'
import { AccessibilityProvider } from './components/AccessibilityProvider'

export default function App({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pathname = location.pathname
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const isHome = pathname === '/'
  const shouldHideHeader = false // Always show header except on home page

  const navItems = [
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { path: '/tickets', label: 'My Tickets', icon: Ticket },
    { path: '/venue', label: 'Venue', icon: Shield },
    { path: '/organizer', label: 'Organizer', icon: BarChart3 },
  ]
  
  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 768
      setIsDesktop(desktop)
      if (desktop) setIsMenuOpen(false)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Close mobile menu on desktop widths
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {!isHome && (
          <header className="sticky top-0 z-50 bg-[hsl(222_84%_8%)] border-b border-border py-4">
            <div className="mx-auto px-4 max-w-[1000px]">
              <div className="flex justify-between items-center gap-4">
                <Link to="/" className="flex items-center space-x-3 group" aria-label="TicketBastard Home">
                  <img src="/ticketbastard-logo.svg" alt="TicketBastard" className="block w-auto shrink-0" style={{ height: '48px', paddingTop: '8px', paddingBottom: '8px' }} />
                </Link>

                {/* Desktop Navigation */}
                {isDesktop && (
                  <nav className="flex items-center text-neo-contrast/70" role="navigation" aria-label="Main navigation">
                    {navItems.map((item, index) => {
                      const isActive = pathname === item.path
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`text-[13px] md:text-sm font-medium transition-colors no-underline px-3 py-2 rounded visited:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            isActive
                              ? 'text-neo-contrast underline underline-offset-8 decoration-2'
                              : 'text-neo-contrast/70 hover:text-neo-contrast hover:underline underline-offset-8'
                          }`}
                          style={{
                            textDecorationColor: isActive ? 'hsl(var(--primary))' : undefined,
                            marginRight: index < navItems.length - 1 ? '48px' : '0'
                          }}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                )}

                <div className="flex items-center gap-4">
                  {!isDesktop && (
                    <div>
                      <Button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        variant="ghost" 
                        size="sm" 
                        className="p-2"
                        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-menu"
                      >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Mobile Menu */}
        {!isHome && isMenuOpen && (
          <div className={`fixed inset-0 z-40 bg-[hsl(222_84%_8%)] md:hidden`} id="mobile-menu">
            <nav className="flex flex-col items-start p-8 mt-16 space-y-2" role="navigation" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center w-full gap-3 text-lg font-semibold p-3 transition-colors ${
                      isActive ? 'text-neo-contrast underline underline-offset-8' : 'text-neo-contrast/70 hover:text-neo-contrast hover:underline underline-offset-8'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-border w-full my-4" />
              <Button variant="ghost" size="lg" className="w-full">
                <Wallet className="w-5 h-5" aria-hidden="true" />
                <span>Connect Wallet</span>
              </Button>
            </nav>
          </div>
        )}

        <main className="relative flex-grow" role="main">
          {isHome ? (
            <div className="animate-fade-in">{children}</div>
          ) : (
            <div className="mx-auto px-4 py-10 max-w-[1280px]">
              <div className="animate-fade-in">{children}</div>
            </div>
          )}
        </main>
        
        <footer className="mt-auto border-t border-border" role="contentinfo">
          <div className="mx-auto px-4 py-6 text-sm text-neo-contrast/60 flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1000px]">
            <div>© {new Date().getFullYear()} TicketBastard. Fuck around and find out.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-neo-contrast transition-colors">Docs</a>
              <a href="#" className="hover:text-neo-contrast transition-colors">GitHub</a>
            </div>
          </div>
        </footer>

        <ShadcnToaster />
      </div>
    </AccessibilityProvider>
  )
}
