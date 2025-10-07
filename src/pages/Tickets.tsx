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
import { useTickets } from '@/hooks/useLocalStorage'
import { useFocusManagement, useAnnouncements } from '@/hooks/useAccessibility'
import { StoredTicket, TicketPolicy, ResaleBuildResult, TicketLedgerEntry } from '@/types/ticketing'
import { canonicalizePolicy, buildPrimarySaleOutputs, derivePolicySignature } from '@/lib/ticketing'

const basePolicy: TicketPolicy = {
  resaleAllowed: true,
  royaltyBps: 600,
  royaltyRecipients: [
    { id: 'artist', lockingScriptHex: '76a914aa11aa11aa11aa11aa11aa11aa11aa1188ac', bps: 7000 },
    { id: 'venue', lockingScriptHex: '76a914bb22bb22bb22bb22bb22bb22bb22bb2288ac', bps: 3000 }
  ],
  primaryRecipients: [
    { id: 'organizer', lockingScriptHex: '76a914cc33cc33cc33cc33cc33cc33cc33cc3388ac', bps: 6000 },
    { id: 'venue', lockingScriptHex: '76a914dd44dd44dd44dd44dd44dd44dd44dd4488ac', bps: 2500 },
    { id: 'protocol', lockingScriptHex: '76a914ee55ee55ee55ee55ee55ee55ee55ee5588ac', bps: 1500 }
  ],
  version: '1',
  issuerId: 'demo_issuer'
}

const basePolicyJson = canonicalizePolicy(basePolicy)
const basePrimaryOutputs = buildPrimarySaleOutputs(50000, basePolicy)
const baseSignature = derivePolicySignature('evt_cryptopunk2024', 'mock_ticket_1', basePolicyJson)

// Mock data for demonstration
const mockTickets: StoredTicket[] = [
  {
    id: 'mock_ticket_1',
    eventId: 'evt_cryptopunk2024',
    eventName: 'CRYPTO PUNK FESTIVAL 2024',
    seat: 'Section 1, Row A',
    validFrom: '2024-03-15T18:00:00Z',
    validTo: '2024-03-16T02:00:00Z',
    outpoint: 'tx_mock_1:0',
    status: 'VALID',
    priceInSats: 50000,
    pushDropFields: [
      '1PushDropProtocolAddress',
      'evt_cryptopunk2024',
      'mock_ticket_1',
      [12, 4, 210, 33],
      '2024-03-15T18:00:00Z',
      '2024-03-16T02:00:00Z',
      basePolicyJson,
      baseSignature
    ],
    policy: basePolicy,
    policyJson: basePolicyJson,
    issuerSignature: baseSignature,
    provenance: [
      {
        txid: 'tx_mock_1',
        salePriceSats: 50000,
        outputs: [
          { lockingScript: '76a914buyer00000000000000000000000000000088ac', satoshis: 1, outputDescription: 'Ticket output' },
          ...basePrimaryOutputs
        ],
        type: 'primary',
        timestampISO: '2024-01-01T00:00:00Z'
      }
    ],
    lastTransferTx: {
      txid: 'tx_mock_1',
      salePriceSats: 50000,
      outputs: [
        { lockingScript: '76a914buyer00000000000000000000000000000088ac', satoshis: 1, outputDescription: 'Ticket output' },
        ...basePrimaryOutputs
      ],
      type: 'primary',
      timestampISO: '2024-01-01T00:00:00Z'
    }
  }
]

type Ticket = StoredTicket

const normalizeTickets = <T extends Partial<Ticket>>(records: T[]): Ticket[] => {
  return records
    .filter((record): record is Ticket => Boolean(
      record &&
      record.policy &&
      record.policyJson &&
      record.lastTransferTx
    ))
    .map((record) => ({
      ...record,
      eventId: record.eventId ?? (Array.isArray(record.pushDropFields) ? record.pushDropFields[1] : ''),
      provenance: record.provenance?.length ? record.provenance : [record.lastTransferTx]
    }))
}

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
      const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<unknown> } }
      nav.wakeLock?.request?.('screen')
    }
  }

  if (!ticket) return null

  // Fullscreen presentation mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-neo-contrast-inverse flex items-center justify-center">
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 flex h-12 w-12 items-center justify-center"
          aria-label="Exit fullscreen"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center justify-center p-8 max-w-md w-full">
          <div className="bg-neo-contrast p-8 rounded-lg mb-6 shadow-2xl">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="Ticket QR Code"
                className="w-full h-auto max-w-sm"
              />
            )}
          </div>
          <div className="text-center text-neo-contrast">
            <h2 className="font-bold text-xl mb-2">{ticket.eventName}</h2>
            <p className="text-neo-contrast/70">{ticket.seat}</p>
            <p className="text-neo-contrast/60 text-sm font-mono mt-2">
              Present to scanner at venue
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-neo-contrast-inverse/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neo-contrast-inverse border-2 border-neo-border/20 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white font-mono uppercase">Ticket QR</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 flex h-10 w-10 items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-neo-contrast mb-1">{ticket.eventName}</h3>
            <p className="text-neo-contrast/70 text-sm">{ticket.seat}</p>
          </div>
          
          <div className="bg-neo-contrast p-4 rounded-lg">
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
          
          <div className="text-center text-xs text-neo-contrast/60 font-mono">
            ID: {ticket.id}
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={toggleFullscreen}
              className="flex-1 min-w-[140px] bg-white text-black hover:bg-black hover:text-white border-2 border-white px-4 font-mono text-sm font-bold transition-colors h-12 flex items-center justify-center"
            >
              [ PRESENT ]
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 min-w-[140px] bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white px-4 font-mono text-sm font-bold transition-colors h-12 flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1" />
              SAVE
            </button>
            {navigator.share && (
              <button
                onClick={handleShare}
                className="flex-1 min-w-[140px] bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white px-4 font-mono text-sm font-bold transition-colors h-12 flex items-center justify-center"
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
        return { text: 'VALID', className: 'bg-green-500 text-neo-contrast-inverse' }
      case 'EXPIRED':
        return { text: 'EXPIRED', className: 'bg-red-500 text-neo-contrast' }
      case 'REDEEMED':
        return { text: 'REDEEMED', className: 'bg-amber-500 text-neo-contrast-inverse' }
      case 'NOT_YET_VALID':
        return { text: 'NOT YET VALID', className: 'bg-amber-500 text-neo-contrast-inverse' }
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
  const resaleAllowed = ticket.policy?.resaleAllowed !== false

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
        : 'border-neo-border/20 bg-neo-contrast/5'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-neo-contrast mb-1">{ticket.eventName}</h3>
          <p className="text-neo-contrast/70 text-sm">{ticket.seat}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="text-neo-contrast/70">
          <span className="font-mono text-xs text-neo-contrast/50">VALID:</span>{' '}
          {formatValidityWindow()}
        </div>

        <div className="text-neo-contrast/70">
          <span className="font-mono text-xs text-neo-contrast/50">OUTPOINT:</span>{' '}
          <button
            onClick={onCopyOutpoint}
            className="font-mono hover:text-neo-contrast transition-colors inline-flex items-center gap-1"
            aria-label="Copy outpoint"
          >
            {ticket.outpoint}
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {ticket.priceInSats && (
          <div className="text-neo-contrast/70">
            <span className="font-mono text-xs text-neo-contrast/50">PAID:</span>{' '}
            <span className="font-mono">{ticket.priceInSats.toLocaleString()} sats</span>
          </div>
        )}

        {ticket.policy && (
          <div className="text-xs font-mono text-neo-contrast/60 space-y-1 border border-neo-border/10 rounded-md p-2">
            <div className="uppercase text-neo-contrast/40">Policy</div>
            <div>Resale: {resaleAllowed ? 'Allowed' : 'Disabled'}</div>
            <div>Royalty: {(ticket.policy.royaltyBps / 100).toFixed(2)}%</div>
            <div>Issuer: {ticket.policy.issuerId}</div>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={onViewQR}
          className="flex-1 min-w-[140px] bg-white text-black hover:bg-black hover:text-white border-2 border-white px-4 font-mono text-sm font-bold transition-all shadow-[2px_2px_0_0_white] hover:shadow-[1px_1px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] h-12 flex items-center justify-center"
        >
          <QrCode className="w-4 h-4 mr-1" />
          QR
        </button>

        {isActive && (
          <>
            <button
              onClick={onRedeem}
              className="flex-1 min-w-[140px] bg-green-500 text-black hover:bg-black hover:text-green-500 border-2 border-green-500 px-4 font-mono text-sm font-bold transition-all h-12 flex items-center justify-center"
            >
              REDEEM
            </button>

            <button
              onClick={onTransfer}
              className={`flex items-center justify-center h-12 w-12 bg-transparent text-white border-2 font-mono text-sm font-bold transition-all rounded-md ${
                resaleAllowed ? 'hover:bg-white hover:text-black border-white/25 hover:border-white' : 'border-white/10 text-white/30 cursor-not-allowed'
              }`}
              aria-label="Transfer ticket"
              disabled={!resaleAllowed}
              title={resaleAllowed ? 'Transfer ticket' : 'Resale disabled by issuer'}
            >
              <Send className="w-4 h-4" />
            </button>

            <button
              onClick={onListForSale}
              className={`flex items-center justify-center h-12 w-12 bg-transparent text-white border-2 font-mono text-sm font-bold transition-all rounded-md ${
                resaleAllowed ? 'hover:bg-white hover:text-black border-white/25 hover:border-white' : 'border-white/10 text-white/30 cursor-not-allowed'
              }`}
              aria-label="List for sale"
              disabled={!resaleAllowed}
              title={resaleAllowed ? 'List for compliant resale' : 'Resale disabled by issuer'}
            >
              <DollarSign className="w-4 h-4" />
            </button>

            <button
              onClick={onFeedback}
              className="flex items-center justify-center h-12 w-12 bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white font-mono text-sm font-bold transition-all rounded-md"
              aria-label="Leave feedback"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onRefund}
              className="flex items-center justify-center h-12 w-12 bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white font-mono text-sm font-bold transition-all rounded-md"
              aria-label="Request refund"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}

        {isRedeemed && (
          <button
            onClick={onFeedback}
            className="flex items-center justify-center h-12 w-12 bg-transparent text-white hover:bg-white hover:text-black border-2 border-white/25 hover:border-white font-mono text-sm font-bold transition-all rounded-md"
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
  <div className="border border-neo-border/10 rounded-lg p-4">
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-48 bg-neo-contrast/10" />
        <Skeleton className="h-5 w-16 bg-neo-contrast/10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-neo-contrast/10" />
        <Skeleton className="h-4 w-40 bg-neo-contrast/10" />
        <Skeleton className="h-4 w-36 bg-neo-contrast/10" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 bg-neo-contrast/10" />
        <Skeleton className="h-8 w-20 bg-neo-contrast/10" />
        <Skeleton className="h-8 w-20 bg-neo-contrast/10" />
      </div>
    </div>
  </div>
)

// Main Tickets Page Component
const Tickets = () => {
  const [persistedTicketsRaw, setPersistedTicketsRaw] = useTickets()
  const persistedTickets: Ticket[] = normalizeTickets(persistedTicketsRaw)
  const setPersistedTickets = setPersistedTicketsRaw as unknown as React.Dispatch<React.SetStateAction<Ticket[]>>
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
  const { focusRef, setFocus } = useFocusManagement()
  const { announce } = useAnnouncements()
  
  // Combine mock and persisted tickets
  const [tickets, setTickets] = useState<Ticket[]>([...mockTickets, ...persistedTickets])

  useEffect(() => {
    try {
      const ledgerRaw = window.localStorage.getItem('ticketBastardLedger')
      const ledger: TicketLedgerEntry[] = ledgerRaw ? JSON.parse(ledgerRaw) : []
      let changed = false
      mockTickets.forEach((ticket) => {
        if (!ledger.find((entry) => entry.ticketId === ticket.id)) {
          ledger.push({
            ticketId: ticket.id,
            eventId: ticket.eventId,
            outpoint: ticket.outpoint,
            tx: ticket.lastTransferTx,
            policy: ticket.policy,
            policyJson: ticket.policyJson,
            issuerSignature: ticket.issuerSignature
          })
          changed = true
        }
      })
      if (changed) {
        window.localStorage.setItem('ticketBastardLedger', JSON.stringify(ledger))
      }
    } catch (error) {
      console.error('Failed to seed ledger', error)
    }
  }, [])

  useEffect(() => {
    const combinedTickets = [...mockTickets, ...normalizeTickets(persistedTicketsRaw)]
    setTickets(combinedTickets)
  }, [persistedTicketsRaw])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
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

    // Update persisted tickets only (not mock data)
    setPersistedTickets(prev => prev.map(t =>
      t.id === ticket.id
        ? { ...t, status: 'REDEEMED' as const }
        : t
    ))

    announce(`${ticket.eventName} ticket has been redeemed`)
    toast({
      title: "Ticket Redeemed",
      description: `${ticket.eventName} ticket has been redeemed`
    })
  }

  const deriveSellerLockingScript = (ticket: Ticket) => {
    const normalized = ticket.id.replace(/[^0-9a-f]/gi, '').padEnd(40, '0').slice(0, 40)
    return `76a914${normalized}88ac`
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
    if (ticket.policy?.resaleAllowed === false) {
      toast({
        title: 'Transfer blocked',
        description: 'The issuer has disabled secondary transfers for this ticket.'
      })
      return
    }

    setTransferModal({ isOpen: true, ticket })
  }

  const handleListForSale = (ticket: Ticket) => {
    if (ticket.policy?.resaleAllowed === false) {
      toast({
        title: 'Resale disabled',
        description: 'The issuer forbids resales for this ticket.'
      })
      return
    }

    setSaleModal({ isOpen: true, ticket })
  }

  const handleFeedback = (ticket: Ticket) => {
    setFeedbackModal({ isOpen: true, ticket })
  }

  const handleRefund = (ticket: Ticket) => {
    setRefundModal({ isOpen: true, ticket })
  }

  const handleTransferConfirm = (transferResult: ResaleBuildResult, recipientAddress: string) => {
    if (!transferModal.ticket) return

    // Remove ticket from current user's wallet
    setTickets(prev => prev.filter(t => t.id !== transferModal.ticket!.id))

    // Update persisted tickets only (not mock data)
    setPersistedTickets(prev => prev.filter(t => t.id !== transferModal.ticket!.id))

    try {
      const ledgerRaw = window.localStorage.getItem('ticketBastardLedger')
      const ledger: TicketLedgerEntry[] = ledgerRaw ? JSON.parse(ledgerRaw) : []
      ledger.push({
        ticketId: transferModal.ticket.id,
        eventId: transferModal.ticket.eventId ?? (Array.isArray(transferModal.ticket.pushDropFields) ? transferModal.ticket.pushDropFields[1] : ''),
        outpoint: `${transferResult.tx.txid}:0`,
        tx: transferResult.tx,
        policy: transferModal.ticket.policy,
        policyJson: transferModal.ticket.policyJson,
        issuerSignature: transferModal.ticket.issuerSignature
      })
      window.localStorage.setItem('ticketBastardLedger', JSON.stringify(ledger))
    } catch (error) {
      console.error('Failed to persist transfer ledger entry', error)
    }

    toast({
      title: "Ticket Transferred",
      description: `Transferred to ${recipientAddress.slice(0, 8)}...`
    })
  }

  const handleSaleConfirm = (result: ResaleBuildResult) => {
    if (!saleModal.ticket) return

    // Remove ticket from wallet and add to marketplace
    setTickets(prev => prev.filter(t => t.id !== saleModal.ticket!.id))

    // Update localStorage
    setPersistedTickets(prev => prev.filter(t => t.id !== saleModal.ticket!.id))

    try {
      const listingsRaw = window.localStorage.getItem('ticketBastardListings')
      const listings = listingsRaw ? JSON.parse(listingsRaw) : []
      listings.push({
        ticketId: saleModal.ticket.id,
        eventId: saleModal.ticket.eventId ?? (Array.isArray(saleModal.ticket.pushDropFields) ? saleModal.ticket.pushDropFields[1] : ''),
        tx: result.tx,
        policy: saleModal.ticket.policy,
        policyJson: saleModal.ticket.policyJson,
        royaltyOutputs: result.royaltyOutputs,
        sellerOutput: result.sellerOutput
      })
      window.localStorage.setItem('ticketBastardListings', JSON.stringify(listings))
    } catch (error) {
      console.error('Failed to persist listing preview', error)
    }

    toast({
      title: "Listed for Sale",
      description: `Listed at ${result.tx.salePriceSats.toLocaleString()} sats`
    })
  }

  const activeTickets = tickets.filter(ticket => ticket.status === "VALID")
  const redeemedTickets = tickets.filter(ticket => ticket.status === "REDEEMED")

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <ScanlineOverlay />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold font-mono tracking-wider text-white uppercase">MY TICKETS</h1>
          <Link
            to="/marketplace"
            className="inline-flex h-12 items-center justify-center bg-white text-black hover:bg-black hover:text-white border-2 border-white px-6 font-mono text-sm font-bold transition-all shadow-[2px_2px_0_0_white] hover:shadow-[1px_1px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] no-underline"
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
                className="inline-flex h-12 items-center justify-center bg-white text-black hover:bg-black hover:text-white border-2 border-white px-6 font-mono text-sm font-bold transition-all shadow-[2px_2px_0_0_white] hover:shadow-[1px_1px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] no-underline"
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
                <h2 className="text-xl font-bold text-neo-contrast mb-6 font-mono uppercase">Active Tickets</h2>
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
                <h2 className="text-xl font-bold text-neo-contrast mb-6 font-mono uppercase">History</h2>
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
        policy={transferModal.ticket?.policy || basePolicy}
        sellerLockingScriptHex={transferModal.ticket ? deriveSellerLockingScript(transferModal.ticket) : ''}
      />

      {/* List for Sale Modal */}
      <ListForSaleModal
        isOpen={saleModal.isOpen}
        onClose={() => setSaleModal({isOpen: false, ticket: null})}
        onConfirm={handleSaleConfirm}
        ticketId={saleModal.ticket?.id || ''}
        eventName={saleModal.ticket?.eventName || ''}
        originalPrice={saleModal.ticket?.priceInSats || 0}
        policy={saleModal.ticket?.policy || basePolicy}
        sellerLockingScriptHex={saleModal.ticket ? deriveSellerLockingScript(saleModal.ticket) : ''}
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
