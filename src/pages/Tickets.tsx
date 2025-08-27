import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, QrCode, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface Ticket {
  id: string
  eventName: string
  seat: string
  validFrom: Date
  validTo: Date
  outpoint: string
  status: 'valid' | 'expired' | 'redeemed' | 'not-yet-valid'
  qrCode?: string
}

// Mock data for demo
const mockTickets: Ticket[] = [
  {
    id: '1',
    eventName: 'SYSTEM OVERLOAD // BROOKLYN STEEL',
    seat: 'Section A, Row 12, Seat 15',
    validFrom: new Date('2024-08-26T18:00:00'),
    validTo: new Date('2024-08-27T01:00:00'),
    outpoint: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    status: 'valid',
    qrCode: 'QR_CODE_DATA_HERE'
  },
  {
    id: '2', 
    eventName: 'RESISTANCE PARTY // WAREHOUSE NYC',
    seat: 'Encrypted',
    validFrom: new Date('2024-09-15T20:00:00'),
    validTo: new Date('2024-09-16T03:00:00'),
    outpoint: 'z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4',
    status: 'not-yet-valid',
    qrCode: 'QR_CODE_DATA_HERE_2'
  },
  {
    id: '3',
    eventName: 'DIGITAL DYSTOPIA // OUTPUT BK',
    seat: 'VIP Section, Table 7',
    validFrom: new Date('2024-07-20T19:00:00'),
    validTo: new Date('2024-07-21T02:00:00'),
    outpoint: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
    status: 'redeemed',
    qrCode: 'QR_CODE_DATA_HERE_3'
  }
]

const QRModal: React.FC<{ 
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}> = ({ ticket, isOpen, onClose }) => {
  const { toast } = useToast()
  
  if (!isOpen || !ticket) return null

  const handleDownload = () => {
    toast({
      title: "Download initiated",
      description: "QR code saved to downloads"
    })
  }

  const handleShare = () => {
    navigator.share?.({
      title: ticket.eventName,
      text: `My ticket: ${ticket.eventName}`,
    }).catch(() => {
      toast({
        title: "Share failed", 
        description: "Could not share ticket"
      })
    })
  }

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-black hover:bg-black/10"
          onClick={onClose}
          aria-label="Close QR code"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <div className="w-64 h-64 mx-auto bg-white border-4 border-black flex items-center justify-center mb-6">
            <QrCode className="h-48 w-48 text-black" />
          </div>
          
          <p className="font-mono text-sm text-black/70 mb-4 break-all">
            {ticket.outpoint}
          </p>
          
          <div className="flex gap-2 justify-center mb-4">
            <StatusBadge status={ticket.status} />
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-black border-black hover:bg-black hover:text-white"
            >
              Download
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={handleShare}
              className="text-black border-black hover:bg-black hover:text-white"
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatusBadge: React.FC<{ status: Ticket['status'] }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'valid':
        return { text: 'VALID', className: 'bg-green-600 text-white' }
      case 'expired':
        return { text: 'EXPIRED', className: 'bg-red-600 text-white' }
      case 'redeemed':
        return { text: 'REDEEMED', className: 'bg-amber-600 text-white' }
      case 'not-yet-valid':
        return { text: 'NOT YET VALID', className: 'bg-amber-600 text-white' }
      default:
        return { text: 'UNKNOWN', className: 'bg-muted text-muted-foreground' }
    }
  }

  const config = getStatusConfig()
  
  return (
    <Badge variant="secondary" className={`text-xs font-mono uppercase ${config.className}`}>
      {config.text}
    </Badge>
  )
}

const TicketCard: React.FC<{ 
  ticket: Ticket
  onViewQR: () => void
  onRedeem: () => void
  onCopyOutpoint: () => void
}> = ({ ticket, onViewQR, onRedeem, onCopyOutpoint }) => {
  const formatValidityWindow = (from: Date, to: Date) => {
    const fromStr = from.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    const toStr = to.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    })
    return `Valid ${fromStr} → ${toStr}`
  }

  const truncateOutpoint = (outpoint: string) => {
    if (outpoint.length <= 16) return outpoint
    return `${outpoint.slice(0, 8)}...${outpoint.slice(-8)}`
  }

  const isActive = ticket.status === 'valid'
  const isRedeemed = ticket.status === 'redeemed'

  return (
    <div className={`border border-white/20 rounded-md p-4 transition-all hover:border-white/40 ${!isActive && !isRedeemed ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{ticket.eventName}</h3>
          <StatusBadge status={ticket.status} />
        </div>
        
        <div className="text-sm text-white/70 space-y-1">
          <p><span className="text-white/90">Seat:</span> {ticket.seat}</p>
          <p><span className="text-white/90">Valid:</span> {formatValidityWindow(ticket.validFrom, ticket.validTo)}</p>
          <p className="flex items-center gap-2">
            <span className="text-white/90">Outpoint:</span> 
            <code className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
              {truncateOutpoint(ticket.outpoint)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyOutpoint}
              className="h-6 w-6 p-0 text-white/50 hover:text-white"
              aria-label="Copy outpoint"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </p>
        </div>

        {!isRedeemed && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewQR}
              className="border border-white/20 hover:border-white hover:bg-white hover:text-black"
            >
              VIEW QR
            </Button>
            {isActive && (
              <Button
                variant="neo"
                size="sm"
                onClick={onRedeem}
                className="font-mono text-xs tracking-wider"
              >
                [ REDEEM ]
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="border border-white/20 hover:border-white hover:bg-white hover:text-black"
            >
              TRANSFER
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="border border-white/20 hover:border-white hover:bg-white hover:text-black"
            >
              LIST FOR SALE
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

const TicketSkeleton: React.FC = () => (
  <div className="border border-white/10 rounded-md p-4">
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

const Tickets: React.FC = () => {
  const [tickets] = useState<Ticket[]>(mockTickets)
  const [loading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const { toast } = useToast()

  const activeTickets = tickets.filter(t => t.status === 'valid' || t.status === 'not-yet-valid' || t.status === 'expired')
  const redeemedTickets = tickets.filter(t => t.status === 'redeemed')

  const handleViewQR = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setQrModalOpen(true)
  }

  const handleRedeem = (ticket: Ticket) => {
    // Confirmation modal would go here
    toast({
      title: "Ticket redeemed",
      description: `${ticket.eventName} • txid: ${ticket.outpoint.slice(0, 8)}...`
    })
  }

  const handleCopyOutpoint = (outpoint: string) => {
    navigator.clipboard.writeText(outpoint)
    toast({
      title: "Copied",
      description: "Outpoint copied to clipboard"
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle CRT/VHS background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-screen bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.08)_0px,rgba(255,255,255,.08)_1px,transparent_1px,transparent_3px)]" />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Title & Actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-mono tracking-wider">MY TICKETS</h1>
          <Link to="/marketplace">
            <Button
              variant="neo"
              className="font-mono text-sm tracking-wider"
            >
              [ + PURCHASE TICKET ]
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <TicketSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-xl font-bold mb-4">No tickets yet.</h2>
            <p className="text-white/70 mb-8">Purchase your first ticket to get started.</p>
            <Link to="/marketplace">
              <Button
                variant="neo-outline" 
                className="font-mono tracking-wider"
              >
                [ BROWSE MARKETPLACE ]
              </Button>
            </Link>
          </div>
        )}

        {/* Active Tickets */}
        {!loading && activeTickets.length > 0 && (
          <div className="space-y-4 mb-8">
            {activeTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onViewQR={() => handleViewQR(ticket)}
                onRedeem={() => handleRedeem(ticket)}
                onCopyOutpoint={() => handleCopyOutpoint(ticket.outpoint)}
              />
            ))}
          </div>
        )}

        {/* History Section */}
        {redeemedTickets.length > 0 && (
          <div className="border-t border-white/20 pt-8">
            <h2 className="text-xl font-bold font-mono tracking-wider mb-4 text-white/70">HISTORY</h2>
            <div className="space-y-4">
              {redeemedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onViewQR={() => handleViewQR(ticket)}
                  onRedeem={() => {}}
                  onCopyOutpoint={() => handleCopyOutpoint(ticket.outpoint)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      <QRModal
        ticket={selectedTicket}
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false)
          setSelectedTicket(null)
        }}
      />
    </div>
  )
}

export default Tickets