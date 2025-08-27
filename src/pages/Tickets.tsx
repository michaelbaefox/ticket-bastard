import React, { useState, useEffect } from 'react'
import { QrCode, Send, DollarSign, Copy, Download, Share, X, MessageCircle, RefreshCw } from 'lucide-react'
import QRCode from 'qrcode'
import { Link } from 'react-router-dom'
import { ScanlineOverlay } from '@/components/ScanlineOverlay'
import { TransferModal } from '@/components/TransferModal'
import { ListForSaleModal } from '@/components/ListForSaleModal'
import FeedbackModal from '@/components/FeedbackModal'
import RefundModal from '@/components/RefundModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface Ticket {
  id: string
  eventName: string
  seat: string
  validFrom: string
  validTo: string
  outpoint: string
  status: 'VALID' | 'EXPIRED' | 'REDEEMED' | 'NOT_YET_VALID'
  priceInSats?: number
}

// Mock data for demonstration
const mockTickets: Ticket[] = [
  {
    id: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    eventName: "CRYPTO PUNK FESTIVAL 2024",
    seat: "Section 1, Row A",
    validFrom: "2024-03-15T18:00:00Z",
    validTo: "2024-03-16T02:00:00Z",
    outpoint: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx:0",
    status: "VALID" as const,
    priceInSats: 50000,
  },
  {
    id: "tb1qrp33g0q4c70q3vqzm6q7n0y8q0szzrpqwu5sxw",
    eventName: "UNDERGROUND BASS COLLECTIVE",
    seat: "General Admission",
    validFrom: "2024-03-20T20:00:00Z",
    validTo: "2024-03-21T04:00:00Z",
    outpoint: "tb1qrp33g0q4c70q3vqzm6q7n0y8q0szzrpqwu5sxw:0",
    status: "VALID" as const,
    priceInSats: 75000,
  },
  {
    id: "tb1q9vza2e8x573nz2d09p6av6d2h0yqmq5cj6v8kx",
    eventName: "NEO-TOKYO NIGHT MARKET",
    seat: "Section 2, Row C",
    validFrom: "2024-01-25T19:00:00Z",
    validTo: "2024-01-26T01:00:00Z",
    outpoint: "tb1q9vza2e8x573nz2d09p6av6d2h0yqmq5cj6v8kx:0",
    status: "REDEEMED" as const,
    priceInSats: 125000,
  },
]

// QR Modal for displaying ticket QR code
const QRModal: React.FC<{ ticket: Ticket | null; onClose: () => void }> = ({ ticket, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!ticket) return
      
      try {
        // Generate QR code from ticket outpoint
        const qrUrl = await QRCode.toDataURL(ticket.outpoint, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error('QR code generation failed:', error)
      }
    }

    generateQRCode()
  }, [ticket])

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `ticket-${ticket?.id}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handleShare = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()
        const file = new File([blob], `ticket-${ticket?.id}.png`, { type: 'image/png' })
        
        await navigator.share({
          title: `Ticket: ${ticket?.eventName}`,
          files: [file]
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen && 'wakeLock' in navigator) {
      // Request wake lock to keep screen on during presentation
      (navigator as any).wakeLock?.request?.('screen')
    }
  }

  if (!ticket) return null

  // Fullscreen presentation mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2"
          aria-label="Exit fullscreen"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center justify-center p-8 max-w-md w-full">
          <div className="bg-white p-8 rounded-lg mb-6 shadow-2xl">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="Ticket QR Code"
                className="w-full h-auto max-w-sm"
              />
            )}
          </div>
          <div className="text-center text-white">
            <h2 className="font-bold text-xl mb-2">{ticket.eventName}</h2>
            <p className="text-white/70">{ticket.seat}</p>
            <p className="text-white/60 text-sm font-mono mt-2">
              Present to scanner at venue
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border-2 border-white/20 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white font-mono uppercase">Ticket QR</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-white mb-1">{ticket.eventName}</h3>
            <p className="text-white/70 text-sm">{ticket.seat}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Ticket QR Code"
                className="w-full h-auto"
              />
            ) : (
              <div className="aspect-square bg-gray-200 animate-pulse rounded" />
            )}
          </div>
          
          <div className="text-center text-xs text-white/60 font-mono">
            ID: {ticket.id}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="flex-1 bg-white text-black hover:bg-black hover:text-white border-2 border-white py-2 px-4 font-mono text-xs font-bold transition-colors"
            >
              [ PRESENT ]
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-4 font-mono text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              SAVE
            </button>
            {navigator.share && (
              <button
                onClick={handleShare}
                className="flex-1 bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-4 font-mono text-xs font-bold transition-colors"
              >
                <Share className="w-4 h-4 mr-1" />
                SHARE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Status Badge Component  
const StatusBadge: React.FC<{ status: Ticket['status'] }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'VALID':
        return { text: 'VALID', className: 'bg-green-500 text-black' }
      case 'EXPIRED':
        return { text: 'EXPIRED', className: 'bg-red-500 text-white' }
      case 'REDEEMED':
        return { text: 'REDEEMED', className: 'bg-amber-500 text-black' }
      case 'NOT_YET_VALID':
        return { text: 'NOT YET VALID', className: 'bg-amber-500 text-black' }
      default:
        return { text: 'UNKNOWN', className: 'bg-muted text-muted-foreground' }
    }
  }

  const config = getStatusConfig()
  
  return (
    <Badge className={`text-xs font-mono uppercase px-2 py-1 ${config.className}`}>
      {config.text}
    </Badge>
  )
}

// Ticket Card Component with enhanced functionality
const TicketCard: React.FC<{
  ticket: Ticket
  onViewQR: () => void
  onRedeem: () => void
  onCopyOutpoint: () => void
  onTransfer: () => void
  onListForSale: () => void
  onFeedback: () => void
  onRefund: () => void
}> = ({ ticket, onViewQR, onRedeem, onCopyOutpoint, onTransfer, onListForSale, onFeedback, onRefund }) => {
  const isActive = ticket.status === "VALID"
  const isRedeemed = ticket.status === "REDEEMED"

  const formatValidityWindow = () => {
    const startDate = new Date(ticket.validFrom)
    const endDate = new Date(ticket.validTo)
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      isActive 
        ? 'border-green-500/30 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
        : 'border-white/20 bg-white/5'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">{ticket.eventName}</h3>
          <p className="text-white/70 text-sm">{ticket.seat}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      
      <div className="space-y-2 mb-4 text-sm">
        <div className="text-white/70">
          <span className="font-mono text-xs text-white/50">VALID:</span>{' '}
          {formatValidityWindow()}
        </div>
        
        <div className="text-white/70">
          <span className="font-mono text-xs text-white/50">OUTPOINT:</span>{' '}
          <button
            onClick={onCopyOutpoint}
            className="font-mono hover:text-white transition-colors inline-flex items-center gap-1"
            aria-label="Copy outpoint"
          >
            {ticket.outpoint}
            <Copy className="w-3 h-3" />
          </button>
        </div>
        
        {ticket.priceInSats && (
          <div className="text-white/70">
            <span className="font-mono text-xs text-white/50">PAID:</span>{' '}
            <span className="font-mono">{ticket.priceInSats.toLocaleString()} sats</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onViewQR}
          className="flex-1 min-w-[100px] bg-white text-black hover:bg-black hover:text-white border-2 border-white py-2 px-3 font-mono text-xs font-bold transition-all shadow-[2px_2px_0_0_white] hover:shadow-[1px_1px_0_0_white] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <QrCode className="w-4 h-4 mr-1" />
          QR
        </button>
        
        {isActive && (
          <>
            <button
              onClick={onRedeem}
              className="flex-1 min-w-[100px] bg-green-500 text-black hover:bg-black hover:text-green-500 border-2 border-green-500 py-2 px-3 font-mono text-xs font-bold transition-all"
            >
              REDEEM
            </button>
            
            <button
              onClick={onTransfer}
              className="bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-3 font-mono text-xs font-bold transition-all"
              aria-label="Transfer ticket"
            >
              <Send className="w-4 h-4" />
            </button>
            
            <button
              onClick={onListForSale}
              className="bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-3 font-mono text-xs font-bold transition-all"
              aria-label="List for sale"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            
            <button
              onClick={onFeedback}
              className="bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-3 font-mono text-xs font-bold transition-all"
              aria-label="Leave feedback"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            
            <button
              onClick={onRefund}
              className="bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-3 font-mono text-xs font-bold transition-all"
              aria-label="Request refund"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}

        {isRedeemed && (
          <button
            onClick={onFeedback}
            className="bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white py-2 px-3 font-mono text-xs font-bold transition-all"
            aria-label="Leave feedback"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Loading skeleton component
const TicketSkeleton: React.FC = () => (
  <div className="border border-white/10 rounded-lg p-4">
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-48 bg-white/10" />
        <Skeleton className="h-5 w-16 bg-white/10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="h-4 w-40 bg-white/10" />
        <Skeleton className="h-4 w-36 bg-white/10" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 bg-white/10" />
        <Skeleton className="h-8 w-20 bg-white/10" />
        <Skeleton className="h-8 w-20 bg-white/10" />
      </div>
    </div>
  </div>
)

// Main Tickets Page Component
const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [transferModal, setTransferModal] = useState<{isOpen: boolean; ticket: Ticket | null}>({
    isOpen: false,
    ticket: null
  })
  const [saleModal, setSaleModal] = useState<{isOpen: boolean; ticket: Ticket | null}>({
    isOpen: false,
    ticket: null
  })
  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean; ticket: Ticket | null}>({
    isOpen: false,
    ticket: null
  })
  const [refundModal, setRefundModal] = useState<{isOpen: boolean; ticket: Ticket | null}>({
    isOpen: false,
    ticket: null
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load tickets from localStorage and mock data
    const loadTickets = () => {
      const storedTickets = JSON.parse(localStorage.getItem('ticketBastardTickets') || '[]')
      const combinedTickets = [...mockTickets, ...storedTickets]
      setTickets(combinedTickets)
      setIsLoading(false)
    }

    // Simulate loading
    const timer = setTimeout(loadTickets, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleViewQR = (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  const handleRedeem = (ticket: Ticket) => {
    // Update ticket status to redeemed
    setTickets(prev => prev.map(t => 
      t.id === ticket.id 
        ? { ...t, status: 'REDEEMED' as const }
        : t
    ))
    
    // Update localStorage
    const updatedTickets = tickets.map(t => 
      t.id === ticket.id 
        ? { ...t, status: 'REDEEMED' as const }
        : t
    )
    localStorage.setItem('ticketBastardTickets', JSON.stringify(updatedTickets.filter(t => !mockTickets.find(m => m.id === t.id))))
    
    toast({
      title: "Ticket Redeemed",
      description: `${ticket.eventName} ticket has been redeemed`
    })
  }

  const handleCopyOutpoint = async (ticket: Ticket) => {
    try {
      await navigator.clipboard.writeText(ticket.outpoint)
      toast({
        title: "Copied",
        description: "Outpoint copied to clipboard"
      })
    } catch (err) {
      console.error('Failed to copy outpoint:', err)
    }
  }

  const handleTransfer = (ticket: Ticket) => {
    setTransferModal({ isOpen: true, ticket })
  }

  const handleListForSale = (ticket: Ticket) => {
    setSaleModal({ isOpen: true, ticket })
  }

  const handleFeedback = (ticket: Ticket) => {
    setFeedbackModal({ isOpen: true, ticket })
  }

  const handleRefund = (ticket: Ticket) => {
    setRefundModal({ isOpen: true, ticket })
  }

  const handleTransferConfirm = (recipientAddress: string) => {
    if (!transferModal.ticket) return
    
    // Remove ticket from current user's wallet
    setTickets(prev => prev.filter(t => t.id !== transferModal.ticket!.id))
    
    // Update localStorage
    const updatedTickets = tickets.filter(t => t.id !== transferModal.ticket!.id)
    localStorage.setItem('ticketBastardTickets', JSON.stringify(updatedTickets.filter(t => !mockTickets.find(m => m.id === t.id))))
    
    toast({
      title: "Ticket Transferred",
      description: `Transferred to ${recipientAddress.slice(0, 8)}...`
    })
  }

  const handleSaleConfirm = (priceInSats: number) => {
    if (!saleModal.ticket) return
    
    // Remove ticket from wallet and add to marketplace
    setTickets(prev => prev.filter(t => t.id !== saleModal.ticket!.id))
    
    // Update localStorage  
    const updatedTickets = tickets.filter(t => t.id !== saleModal.ticket!.id)
    localStorage.setItem('ticketBastardTickets', JSON.stringify(updatedTickets.filter(t => !mockTickets.find(m => m.id === t.id))))
    
    toast({
      title: "Listed for Sale",
      description: `Listed at ${priceInSats.toLocaleString()} sats`
    })
  }

  const activeTickets = tickets.filter(ticket => ticket.status === "VALID")
  const redeemedTickets = tickets.filter(ticket => ticket.status === "REDEEMED")

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <ScanlineOverlay />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-mono tracking-wider text-white uppercase">MY TICKETS</h1>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <TicketSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <ScanlineOverlay />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-mono tracking-wider text-white uppercase">MY TICKETS</h1>
          <Link 
            to="/marketplace" 
            className="bg-white text-black hover:bg-black hover:text-white border-2 border-white py-2 px-4 font-mono text-sm font-bold transition-all shadow-[2px_2px_0_0_white] hover:shadow-[1px_1px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] no-underline"
          >
            [ PURCHASE TICKETS ]
          </Link>
        </div>

        {activeTickets.length === 0 && redeemedTickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="border-2 border-white/20 rounded-lg p-8 max-w-md mx-auto bg-white/5">
              <h2 className="text-xl font-bold text-white mb-4">No Tickets Found</h2>
              <p className="text-white/70 mb-6">You don't have any tickets yet. Purchase some from the marketplace to get started.</p>
              <Link 
                to="/marketplace"
                className="inline-block bg-white text-black hover:bg-black hover:text-white border-2 border-white py-2 px-4 font-mono text-sm font-bold transition-all shadow-[2px_2px_0_0_white] hover:shadow-[1px_1px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] no-underline"
              >
                [ BROWSE MARKETPLACE ]
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Active Tickets */}
            {activeTickets.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-6 font-mono uppercase">Active Tickets</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {activeTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onViewQR={() => handleViewQR(ticket)}
                      onRedeem={() => handleRedeem(ticket)}
                      onCopyOutpoint={() => handleCopyOutpoint(ticket)}
                      onTransfer={() => handleTransfer(ticket)}
                      onListForSale={() => handleListForSale(ticket)}
                      onFeedback={() => handleFeedback(ticket)}
                      onRefund={() => handleRefund(ticket)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Redeemed Tickets History */}
            {redeemedTickets.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 font-mono uppercase">History</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {redeemedTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onViewQR={() => handleViewQR(ticket)}
                      onRedeem={() => handleRedeem(ticket)}
                      onCopyOutpoint={() => handleCopyOutpoint(ticket)}
                      onTransfer={() => handleTransfer(ticket)}
                      onListForSale={() => handleListForSale(ticket)}
                      onFeedback={() => handleFeedback(ticket)}
                      onRefund={() => handleRefund(ticket)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Modal */}
      <QRModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      
      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({isOpen: false, ticket: null})}
        onConfirm={handleTransferConfirm}
        ticketId={transferModal.ticket?.id || ''}
        eventName={transferModal.ticket?.eventName || ''}
      />
      
      {/* List for Sale Modal */}
      <ListForSaleModal
        isOpen={saleModal.isOpen}
        onClose={() => setSaleModal({isOpen: false, ticket: null})}
        onConfirm={handleSaleConfirm}
        ticketId={saleModal.ticket?.id || ''}
        eventName={saleModal.ticket?.eventName || ''}
        originalPrice={saleModal.ticket?.priceInSats || 0}
      />

      {/* Feedback Modal */}
      {feedbackModal.ticket && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({isOpen: false, ticket: null})}
          eventName={feedbackModal.ticket.eventName}
          eventId={feedbackModal.ticket.id}
        />
      )}

      {/* Refund Modal */}
      {refundModal.ticket && (
        <RefundModal
          isOpen={refundModal.isOpen}
          onClose={() => setRefundModal({isOpen: false, ticket: null})}
          ticketId={refundModal.ticket.id}
          eventName={refundModal.ticket.eventName}
          priceSats={refundModal.ticket.priceInSats || 0}
        />
      )}
    </div>
  )
}

export default Tickets
