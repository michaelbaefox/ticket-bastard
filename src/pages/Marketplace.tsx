import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseModal } from "@/components/PurchaseModal";
import FeedbackModal from "@/components/FeedbackModal";
import { useToast } from "@/hooks/use-toast";
import { useMarketplace, useEvents } from "@/hooks/useLocalStorage";
import { useScreenReader, a11yUtils } from "@/hooks/useAccessibility";
import { CalendarDays, MapPin, Users, Filter, Search, Zap } from "lucide-react";

// Mock data for listings
const mockListings = [
  {
    id: "listing-1",
    eventName: "CRYPTO PUNK FESTIVAL 2024",
    originalPrice: 45000,
    salePrice: 50000,
    seller: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    listingDate: "2024-12-01T10:00:00Z",
    eventDate: "2024-03-15T18:00:00Z",
    venue: "Convention Center",
    category: "music"
  },
  {
    id: "listing-2", 
    eventName: "UNDERGROUND BASS COLLECTIVE",
    originalPrice: 75000,
    salePrice: 65000,
    seller: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    listingDate: "2024-12-02T10:00:00Z", 
    eventDate: "2024-03-20T20:00:00Z",
    venue: "Underground Club",
    category: "music"
  }
];

const footerMessages = [
  "Ticket authenticity verified.",
  "BastardChain consensus achieved.", 
  "No middlemen detected.",
  "Your transaction is final.",
  "System notice: freedom enabled.",
];

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [purchaseModal, setPurchaseModal] = useState<{isOpen: boolean, listing: any}>({
    isOpen: false,
    listing: null
  })
  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, listing: any}>({
    isOpen: false,
    listing: null
  })
  const [footerFlash, setFooterFlash] = useState<string | null>(null)
  const [marketplace, setMarketplace] = useMarketplace()
  const [events, setEvents] = useEvents()
  const { toast } = useToast()
  const { announce } = useScreenReader()
  
  // Initialize with mock data if empty
  useEffect(() => {
    if (marketplace.length === 0) {
      setMarketplace(mockListings.map(listing => ({
        id: listing.id,
        eventName: listing.eventName,
        originalPrice: listing.originalPrice,
        salePrice: listing.salePrice,
        seller: listing.seller,
        listingDate: listing.listingDate,
        eventDate: listing.eventDate,
        venue: listing.venue,
        category: listing.category
      })))
    }
  }, [marketplace, setMarketplace])

  // Filter and sort listings
  const filteredListings = marketplace.filter(listing => {
    if (searchTerm && !listing.eventName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "all" && listing.category !== selectedCategory) {
      return false;
    }
    if (priceRange !== "all") {
      const price = listing.salePrice;
      if (priceRange === "low" && price > 50000) return false;
      if (priceRange === "mid" && (price <= 50000 || price > 100000)) return false;
      if (priceRange === "high" && price <= 100000) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "price") return a.salePrice - b.salePrice;
    if (sortBy === "date") return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    return 0;
  });

  const handlePurchase = (listing: any) => {
    setPurchaseModal({isOpen: true, listing})
    announce(`Opening purchase dialog for ${listing.eventName}`)
  }

  const handleFeedback = (listing: any) => {
    setFeedbackModal({isOpen: true, listing})
    announce(`Opening feedback form for ${listing.eventName}`)
  }

  const handlePurchaseConfirm = (ticketData: any) => {
    // Add to tickets localStorage
    const existingTickets = JSON.parse(localStorage.getItem('ticketBastardTickets') || '[]')
    existingTickets.push(ticketData)
    localStorage.setItem('ticketBastardTickets', JSON.stringify(existingTickets))
    
    // Remove from marketplace
    const updatedMarketplace = marketplace.filter(listing => 
      listing.id !== purchaseModal.listing?.id
    )
    setMarketplace(updatedMarketplace)
    
    const msg = footerMessages[Math.floor(Math.random() * footerMessages.length)]
    setFooterFlash(msg)
    setTimeout(() => setFooterFlash(null), 1600)
    
    toast({
      title: "TRANSFER COMPLETE", 
      description: `Ticket transferred to your wallet • ${ticketData.id.slice(0, 8)}...`
    })
    
    announce(`Ticket purchased successfully for ${ticketData.eventName}`)
    setPurchaseModal({isOpen: false, listing: null})
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="font-mono text-2xl font-bold text-foreground uppercase tracking-wider">
            TICKET MARKETPLACE
          </h1>
          <p className="text-muted-foreground mt-2">
            Buy verified tickets • Support artists on resales
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6" aria-label="Search and filter options">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <label htmlFor="event-search" className="sr-only">Search events</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
            <Input
              id="event-search"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48 bg-input border-border text-foreground" aria-label="Filter by category">
              <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="main">
          {filteredListings.map((listing) => (
            <Card 
              key={listing.id} 
              className="bg-card border-border text-card-foreground focus-within:ring-2 focus-within:ring-primary"
              role="article"
              aria-labelledby={`listing-title-${listing.id}`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 id={`listing-title-${listing.id}`} className="font-mono font-bold text-lg text-foreground uppercase">
                      {listing.eventName}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center text-muted-foreground text-sm">
                        <CalendarDays className="w-4 h-4 mr-1" aria-hidden="true" />
                        <time dateTime={listing.eventDate}>
                          {new Date(listing.eventDate).toLocaleDateString()}
                        </time>
                      </div>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span>{listing.venue}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {listing.category.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-right mb-4">
                  <div className="text-2xl font-bold font-mono text-primary" aria-label={`Price: ${listing.salePrice.toLocaleString()} satoshis`}>
                    {listing.salePrice.toLocaleString()} sats
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 flex gap-2">
                <Button
                  variant="neo-outline"
                  size="sm"
                  onClick={() => handleFeedback(listing)}
                  className="flex-1"
                  aria-label={`View seller information for ${listing.eventName}`}
                >
                  SELLER INFO
                </Button>
                <Button
                  variant="neo"
                  size="sm"
                  onClick={() => handlePurchase(listing)}
                  className="flex-1"
                  aria-label={`Purchase ticket for ${listing.eventName}`}
                >
                  <Zap className="w-4 h-4 mr-1" aria-hidden="true" />
                  BUY NOW
                </Button>
              </CardFooter>
            </Card>
          ))}
        </main>

        {footerFlash && (
          <div className="mt-8 text-center">
            <p className="text-xs font-mono text-muted-foreground" role="status" aria-live="polite">
              {footerFlash}
            </p>
          </div>
        )}
      </section>

      <PurchaseModal
        isOpen={purchaseModal.isOpen}
        onClose={() => setPurchaseModal({isOpen: false, listing: null})}
        onConfirm={handlePurchaseConfirm}
        eventName={purchaseModal.listing?.eventName || ''}
        priceInSats={purchaseModal.listing?.salePrice || 0}
      />

      {feedbackModal.listing && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({isOpen: false, listing: null})}
          eventName={feedbackModal.listing.eventName}
          eventId={feedbackModal.listing.id?.toString() || ''}
        />
      )}
    </div>
  );
};

export default Marketplace;