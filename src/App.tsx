import { Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Shield, ShoppingCart, BarChart3, Home, Ticket, Wallet, Menu, X } from 'lucide-react'
import { Button } from './components/ui/button'
import React, { useState } from 'react'

export default function App({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const isHome = location.pathname === '/'

  const navItems = [
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { path: '/tickets', label: 'My Tickets', icon: Ticket },
    { path: '/venue', label: 'Venue', icon: Shield },
    { path: '/organizer', label: 'Organizer', icon: BarChart3 },
  ]
  
  React.useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 768
      setIsDesktop(desktop)
      if (desktop) setIsMenuOpen(false)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close mobile menu on desktop widths
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isHome && (
        <header className="sticky top-0 z-50 bg-background border-b border-border py-4">
          <div className="mx-auto px-4 max-w-[1000px]">
            <div className="flex justify-between items-center gap-4">
              <Link to="/" className="flex items-center space-x-3 group" aria-label="Home">
                <img src="/ticketbastard-logo.svg" alt="TicketBastard" className="block w-auto shrink-0" style={{ height: '48px', paddingTop: '8px', paddingBottom: '8px' }} />
              </Link>

              {/* Desktop Navigation */}
              {isDesktop && (
                <nav className="flex items-center text-muted-foreground">
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`text-[13px] md:text-sm font-medium transition-colors no-underline px-3 py-2 rounded visited:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          isActive
                            ? 'text-foreground underline underline-offset-8 decoration-2'
                            : 'text-muted-foreground hover:text-foreground hover:underline underline-offset-8'
                        }`}
                        style={{
                          textDecorationColor: isActive ? '#ff85c5' : undefined,
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
                    <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="sm" className="p-2">
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
        <div className={`fixed inset-0 z-40 bg-background md:hidden`}>
          <nav className="flex flex-col items-start p-8 mt-16 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center w-full gap-3 text-lg font-semibold p-3 ${
                    isActive ? 'text-foreground underline underline-offset-8' : 'text-muted-foreground hover:text-foreground hover:underline underline-offset-8'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
            <div className="border-t border-border w-full my-4" />
            <Button variant="ghost" size="lg" className="w-full">
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet</span>
            </Button>
          </nav>
        </div>
      )}

      <main className="relative flex-grow">
        <div className={`mx-auto px-4 py-10 ${isHome ? 'max-w-[1280px]' : 'max-w-[1000px]'}`}>
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
      
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto px-4 py-6 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1000px]">
          <div>© {new Date().getFullYear()} TicketBastard. Fuck around and find out.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">Docs</a>
            <a href="#" className="hover:text-foreground">GitHub</a>
          </div>
        </div>
      </footer>

      <Toaster position="bottom-left" toastOptions={{
        duration: 3000,
        style: {
          background: '#141414',
          color: '#F5F5F5',
          border: '1px solid #262626',
          borderRadius: '8px',
          padding: '12px'
        },
      }} />
    </div>
  )
}
