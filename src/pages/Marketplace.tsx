import React, { useState, useEffect } from 'react'
import { Search, Grid, List, Filter, ChevronLeft, ChevronRight, Copy, Check, MessageCircle } from 'lucide-react'
import { ScanlineOverlay } from '@/components/ScanlineOverlay'
import { PurchaseModal } from '@/components/PurchaseModal'
import FeedbackModal from '@/components/FeedbackModal'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useTickets } from '@/hooks/useLocalStorage'
import { useFocusManagement, useKeyboardNavigation, useAnnouncements } from '@/hooks/useAccessibility'

// Mock data for listings
const mockListings = [
  {
    id: 1,
    eventName: "CRYPTO PUNK FESTIVAL 2024",
    validFrom: "2024-03-15T18:00:00Z",
    validTo: "2024-03-16T02:00:00Z",
    sellerOutpoint: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ticketOutpoint: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    priceInSats: 50000,
  },
  {
    id: 2,
    eventName: "UNDERGROUND BASS COLLECTIVE",
    validFrom: "2024-03-20T20:00:00Z",
    validTo: "2024-03-21T04:00:00Z",
    sellerOutpoint: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    ticketOutpoint: "tb1qrp33g0q4c70q3vqzm6q7n0y8q0szzrpqwu5sxw",
    priceInSats: 75000,
  },
  {
    id: 3,
    eventName: "NEO-TOKYO NIGHT MARKET",
    validFrom: "2024-03-25T19:00:00Z",
    validTo: "2024-03-26T01:00:00Z",
    sellerOutpoint: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    ticketOutpoint: "tb1q9vza2e8x573nz2d09p6av6d2h0yqmq5cj6v8kx",
    priceInSats: 125000,
  },
]

const footerMessages = [
  "Ticket authenticity verified.",
  "BastardChain consensus achieved.",
  "No middlemen detected.",
  "Your transaction is final.",
  "System notice: freedom enabled.",
]

const truncateAddress = (address: string) => {
  if (address.length <= 16) return address
  return `${address.slice(0, 8)}...${address.slice(-8)}`
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('price-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [footerFlash, setFooterFlash] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [purchaseModal, setPurchaseModal] = useState<{isOpen: boolean; listing: any}>({isOpen: false, listing: null})
  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean; listing: any}>({isOpen: false, listing: null})
  const { toast } = useToast()
  const [tickets, setTickets] = useTickets()
  const { setFocus } = useFocusManagement()
  const { announce } = useAnnouncements()

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(text)
      toast({
        title: "Copied",
        description: `${type} copied to clipboard`,
      })
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleBuyTicket = (listing: any) => {
    setPurchaseModal({isOpen: true, listing})
  }

  const handleFeedback = (listing: any) => {
    setFeedbackModal({isOpen: true, listing})
  }

  const handlePurchaseConfirm = (ticketData: any) => {
    // Add to persistent storage
    setTickets(prev => [...prev, ticketData])
    
    const msg = footerMessages[Math.floor(Math.random() * footerMessages.length)]
    setFooterFlash(msg)
    setTimeout(() => setFooterFlash(null), 1600)
    
    announce(`Ticket purchased for ${ticketData.eventName}`)
    toast({
      title: "Purchased",
      description: `Ticket added to your wallet`,
    })
    
    // Focus management after modal closes
    setTimeout(() => setFocus(), 100)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search functionality would go here
  }

  const filteredListings = mockListings.filter(listing =>
    listing.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.priceInSats - b.priceInSats
      case 'price-desc':
        return b.priceInSats - a.priceInSats
      case 'date-asc':
        return new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime()
      case 'date-desc':
        return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen">
      <ScanlineOverlay />
      
      {/* Skip Link for Screen Readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-mono tracking-wider text-neo-contrast uppercase mb-6">MARKETPLACE</h1>
        </header>
        
        {/* Toolbar */}
        <section className="mb-8" aria-label="Search and filter controls">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md" role="search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neo-contrast/40 w-4 h-4" aria-hidden="true" />
                <Input
                  type="text"
                  placeholder="SEARCH EVENTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-mono uppercase placeholder:text-neo-contrast/40 bg-transparent border-neo-border/25 focus:border-neo-border focus:ring-white text-neo-contrast"
                  aria-label="Search events"
                />
              </div>
            </form>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 font-mono text-xs bg-transparent border-neo-border/25 focus:border-neo-border text-neo-contrast">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neo-contrast-inverse border-neo-border/25">
                  <SelectItem value="price-asc" className="font-mono text-xs">PRICE ↑</SelectItem>
                  <SelectItem value="price-desc" className="font-mono text-xs">PRICE ↓</SelectItem>
                  <SelectItem value="date-asc" className="font-mono text-xs">DATE ↑</SelectItem>
                  <SelectItem value="date-desc" className="font-mono text-xs">DATE ↓</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Button */}
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs bg-transparent border-neo-border/25 hover:bg-neo-contrast hover:text-neo-contrast-inverse text-neo-contrast"
              >
                <Filter className="w-4 h-4 mr-2" />
                FILTER
              </Button>

              {/* View Toggle */}
              <div className="flex border border-neo-border/25 rounded">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`font-mono text-xs font-bold rounded-none ${
                    viewMode === 'grid'
                      ? 'bg-neo-contrast text-neo-contrast-inverse shadow-neo-md'
                      : 'bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse'
                  }`}
                >
                  [ GRID ]
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`font-mono text-xs font-bold rounded-none ${
                    viewMode === 'list'
                      ? 'bg-neo-contrast text-neo-contrast-inverse shadow-neo-md'
                      : 'bg-transparent text-neo-contrast hover:bg-neo-contrast hover:text-neo-contrast-inverse'
                  }`}
                >
                  [ LIST ]
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm font-mono text-neo-contrast/60" role="status" aria-live="polite">
            {isLoading ? 'Loading listings...' : `${sortedListings.length} ${sortedListings.length === 1 ? 'result' : 'results'} found`}
          </p>
        </div>

        {/* Listings */}
        <main id="main-content" role="main">
          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`} aria-label="Loading listings">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-transparent border-neo-border/10">
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-4 bg-neo-contrast/10" />
                    <Skeleton className="h-4 w-1/2 mb-2 bg-neo-contrast/10" />
                    <Skeleton className="h-4 w-2/3 mb-2 bg-neo-contrast/10" />
                    <Skeleton className="h-4 w-1/3 mb-4 bg-neo-contrast/10" />
                    <Skeleton className="h-10 w-full bg-neo-contrast/10" />
                  </CardContent>
                </Card>
              ))}
            </div>
        ) : sortedListings.length === 0 ? (
          <div className="text-center py-16">
            <Card className="bg-transparent border-neo-border/20 max-w-md mx-auto">
              <CardContent className="p-8">
                <p className="text-neo-contrast/70 mb-4">No listings match your filters.</p>
                <Button
                  onClick={() => setSearchQuery('')}
                  className="font-mono text-xs font-bold bg-neo-contrast text-neo-contrast-inverse hover:bg-neo-contrast-inverse hover:text-neo-contrast shadow-neo-md"
                >
                  [ RESET FILTERS ]
                </Button>
              </CardContent>
            </Card>
          </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`} role="list" aria-label="Event listings">
              {sortedListings.map((listing, index) => (
                <Card key={listing.id} className="bg-transparent border-neo-border/20 hover:border-neo-border/30 transition-colors focus-within:border-neo-border" role="listitem">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-neo-contrast mb-3" id={`listing-${listing.id}`}>{listing.eventName}</h3>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="text-neo-contrast/70">
                      <span className="font-mono text-xs text-neo-contrast/50">VALID:</span>{' '}
                      {new Date(listing.validFrom).toLocaleDateString()} - {new Date(listing.validTo).toLocaleDateString()}
                    </div>
                    
                    <div className="text-neo-contrast/70">
                      <span className="font-mono text-xs text-neo-contrast/50">SELLER:</span>{' '}
                      <button
                        onClick={() => handleCopy(listing.sellerOutpoint, 'Seller address')}
                        className="font-mono hover:text-neo-contrast transition-colors inline-flex items-center gap-1"
                        aria-label="Copy seller address"
                      >
                        {truncateAddress(listing.sellerOutpoint)}
                        {copiedAddress === listing.sellerOutpoint ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    
                    <div className="text-neo-contrast/70">
                      <span className="font-mono text-xs text-neo-contrast/50">TICKET:</span>{' '}
                      <button
                        onClick={() => handleCopy(listing.ticketOutpoint, 'Ticket outpoint')}
                        className="font-mono hover:text-neo-contrast transition-colors inline-flex items-center gap-1"
                        aria-label="Copy ticket outpoint"
                      >
                        {truncateAddress(listing.ticketOutpoint)}
                        {copiedAddress === listing.ticketOutpoint ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-neo-contrast">
                      {listing.priceInSats.toLocaleString()}{' '}
                      <span className="text-sm font-mono text-neo-contrast/60">sats</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBuyTicket(listing)}
                        className="font-mono text-xs font-bold bg-neo-contrast text-neo-contrast-inverse hover:bg-neo-contrast-inverse hover:text-neo-contrast shadow-neo-md hover:shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        aria-label={`Buy ticket for ${listing.eventName}`}
                        aria-describedby={`listing-${listing.id}`}
                      >
                        [ BUY TICKET ]
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedback(listing)}
                        className="font-mono text-xs bg-transparent border-neo-border/25 hover:bg-neo-contrast hover:text-neo-contrast-inverse text-neo-contrast"
                        aria-label={`Leave feedback for ${listing.eventName}`}
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </main>

        {/* Pagination */}
        {!isLoading && sortedListings.length > 0 && (
          <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination navigation">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              className="font-mono text-xs bg-transparent border-neo-border/25 hover:bg-neo-contrast hover:text-neo-contrast-inverse text-neo-contrast disabled:opacity-30"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              PREV
            </Button>
            
            <span className="font-mono text-sm text-neo-contrast/70 px-4" aria-current="page">
              PAGE {currentPage}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs bg-transparent border-neo-border/25 hover:bg-neo-contrast hover:text-neo-contrast-inverse text-neo-contrast"
              aria-label="Go to next page"
            >
              NEXT
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          </nav>
        )}

        {/* Footer Flash Message */}
        {footerFlash && (
          <div className="mt-8 text-center">
            <p className="text-xs font-mono text-neo-contrast/40" role="status" aria-live="polite">
              {footerFlash}
            </p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={purchaseModal.isOpen}
        onClose={() => setPurchaseModal({isOpen: false, listing: null})}
        onConfirm={handlePurchaseConfirm}
        eventName={purchaseModal.listing?.eventName || ''}
        priceInSats={purchaseModal.listing?.priceInSats || 0}
      />

      {/* Feedback Modal */}
      {feedbackModal.listing && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => {
            setFeedbackModal({isOpen: false, listing: null})
            setFocus()
          }}
          eventName={feedbackModal.listing.eventName}
          eventId={feedbackModal.listing.id?.toString() || ''}
        />
      )}
    </div>
  )
}