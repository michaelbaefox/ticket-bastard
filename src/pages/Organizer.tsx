import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Copy, Download, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Shuffle, Calendar, DollarSign } from 'lucide-react';

// Types
type OrganizerEvent = {
  eventId: string;
  name: string;
  venue?: string;
  startsAtISO: string;
  endsAtISO: string;
  capacity: number;
  priceSats: number;
  protocolAddr: string;
  venueSink: string;
  salesOpen: boolean;
  sold: number;
  redeemed: number;
  revenueSats: number;
};

type OrganizerQuery = {
  q?: string;
  status?: "upcoming" | "live" | "ended";
  venue?: string;
  min?: number;
  max?: number;
  from?: string;
  to?: string;
  sort?: "date_asc" | "date_desc" | "sold_desc" | "revenue_desc" | "fill_desc";
  page?: number;
  perPage?: number;
};

// Helper functions
function truncateMiddle(s: string, head = 6, tail = 4) {
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function formatWindow(a: string, b: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  return `${new Date(a).toLocaleString([], opts)} → ${new Date(b).toLocaleString([], opts)}`;
}

function pct(n: number) { return `${Math.round(n * 100)}%`; }

function formatNumber(n: number) {
  return n.toLocaleString();
}

function getEventStatus(startsAtISO: string, endsAtISO: string): 'upcoming' | 'live' | 'ended' {
  const now = new Date();
  const start = new Date(startsAtISO);
  const end = new Date(endsAtISO);
  
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'ended';
}

// Mock data
const mockEvents: OrganizerEvent[] = [
  {
    eventId: "evt_1234567890abcdef",
    name: "Bitcoin Conference 2025",
    venue: "Convention Center",
    startsAtISO: "2025-03-15T09:00:00Z",
    endsAtISO: "2025-03-15T18:00:00Z",
    capacity: 500,
    priceSats: 50000,
    protocolAddr: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    venueSink: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    salesOpen: true,
    sold: 342,
    redeemed: 89,
    revenueSats: 17100000
  },
  {
    eventId: "evt_0987654321fedcba",
    name: "Lightning Workshop",
    venue: "Tech Hub",
    startsAtISO: "2025-02-10T14:00:00Z",
    endsAtISO: "2025-02-10T17:00:00Z",
    capacity: 100,
    priceSats: 25000,
    protocolAddr: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    venueSink: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    salesOpen: false,
    sold: 100,
    redeemed: 100,
    revenueSats: 2500000
  }
];

const Organizer = () => {
  const [events, setEvents] = useState<OrganizerEvent[]>(mockEvents);
  const [query, setQuery] = useState<OrganizerQuery>({ page: 1, perPage: 10 });
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [density, setDensity] = useState<'compact' | 'normal'>('normal');
  const [autoGenerateId, setAutoGenerateId] = useState(true);

  // Create event form state
  const [newEvent, setNewEvent] = useState({
    name: '',
    eventId: '',
    venue: '',
    startsAt: '',
    endsAt: '',
    capacity: '',
    price: '',
    protocolAddr: '',
    venueSink: ''
  });

  useEffect(() => {
    if (autoGenerateId && newEvent.name) {
      const id = `evt_${Date.now()}_${newEvent.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
      setNewEvent(prev => ({ ...prev, eventId: id }));
    }
  }, [newEvent.name, autoGenerateId]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newQuery: OrganizerQuery = { page: 1, perPage: 10 };
    
    if (params.get('q')) newQuery.q = params.get('q')!;
    if (params.get('status')) newQuery.status = params.get('status') as any;
    if (params.get('venue')) newQuery.venue = params.get('venue')!;
    if (params.get('min')) newQuery.min = parseInt(params.get('min')!);
    if (params.get('max')) newQuery.max = parseInt(params.get('max')!);
    if (params.get('from')) newQuery.from = params.get('from')!;
    if (params.get('to')) newQuery.to = params.get('to')!;
    if (params.get('sort')) newQuery.sort = params.get('sort') as any;
    if (params.get('page')) newQuery.page = parseInt(params.get('page')!) || 1;
    if (params.get('perPage')) newQuery.perPage = parseInt(params.get('perPage')!) || 10;
    
    setQuery(newQuery);
  }, []);

  const updateURL = useCallback((newQuery: OrganizerQuery) => {
    const params = new URLSearchParams();
    Object.entries(newQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    setQuery(newQuery);
  }, []);

  // Filter and sort events
  const allFilteredEvents = events.filter(event => {
    if (query.q && !event.name.toLowerCase().includes(query.q.toLowerCase()) && 
        !event.eventId.toLowerCase().includes(query.q.toLowerCase()) &&
        !event.venue?.toLowerCase().includes(query.q.toLowerCase())) {
      return false;
    }
    
    if (query.status) {
      const status = getEventStatus(event.startsAtISO, event.endsAtISO);
      if (status !== query.status) return false;
    }
    
    if (query.venue && !event.venue?.toLowerCase().includes(query.venue.toLowerCase())) {
      return false;
    }

    if (query.min && event.priceSats < query.min) {
      return false;
    }

    if (query.max && event.priceSats > query.max) {
      return false;
    }

    if (query.from && new Date(event.startsAtISO) < new Date(query.from)) {
      return false;
    }

    if (query.to && new Date(event.startsAtISO) > new Date(query.to)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    const sortKey = query.sort || 'date_desc';
    
    switch (sortKey) {
      case 'date_asc':
        return new Date(a.startsAtISO).getTime() - new Date(b.startsAtISO).getTime();
      case 'date_desc':
        return new Date(b.startsAtISO).getTime() - new Date(a.startsAtISO).getTime();
      case 'sold_desc':
        return b.sold - a.sold;
      case 'revenue_desc':
        return b.revenueSats - a.revenueSats;
      case 'fill_desc':
        return (b.sold / b.capacity) - (a.sold / a.capacity);
      default:
        return 0;
    }
  });

  // Pagination
  const totalEvents = allFilteredEvents.length;
  const currentPage = query.page || 1;
  const perPage = query.perPage || 10;
  const totalPages = Math.ceil(totalEvents / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const filteredEvents = allFilteredEvents.slice(startIndex, startIndex + perPage);

  // Calculate KPIs
  const kpis = {
    revenue: events.reduce((sum, e) => sum + e.revenueSats, 0),
    ticketsSold: events.reduce((sum, e) => sum + e.sold, 0),
    activeEvents: events.filter(e => getEventStatus(e.startsAtISO, e.endsAtISO) === 'live').length,
    fillRate: events.length ? events.reduce((sum, e) => sum + (e.sold / e.capacity), 0) / events.length : 0,
    redemptionRate: events.reduce((sum, e) => sum + e.sold, 0) ? 
      events.reduce((sum, e) => sum + e.redeemed, 0) / events.reduce((sum, e) => sum + e.sold, 0) : 0
  };

  const handleCreateEvent = () => {
    // Validation
    if (!newEvent.name || !newEvent.eventId || !newEvent.startsAt || !newEvent.endsAt || 
        !newEvent.capacity || !newEvent.price || !newEvent.protocolAddr || !newEvent.venueSink) {
      toast({ description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Time validation
    const startDate = new Date(newEvent.startsAt);
    const endDate = new Date(newEvent.endsAt);
    const now = new Date();

    if (startDate <= now) {
      toast({ description: "Start time must be in the future", variant: "destructive" });
      return;
    }

    if (endDate <= startDate) {
      toast({ description: "End time must be after start time", variant: "destructive" });
      return;
    }

    // Numeric validation
    const capacity = parseInt(newEvent.capacity);
    const price = parseInt(newEvent.price);

    if (capacity <= 0 || capacity > 100000) {
      toast({ description: "Capacity must be between 1 and 100,000", variant: "destructive" });
      return;
    }

    if (price <= 0 || price > 100000000) {
      toast({ description: "Price must be between 1 and 100,000,000 sats", variant: "destructive" });
      return;
    }

    const event: OrganizerEvent = {
      eventId: newEvent.eventId,
      name: newEvent.name,
      venue: newEvent.venue,
      startsAtISO: newEvent.startsAt,
      endsAtISO: newEvent.endsAt,
      capacity,
      priceSats: price,
      protocolAddr: newEvent.protocolAddr,
      venueSink: newEvent.venueSink,
      salesOpen: true,
      sold: 0,
      redeemed: 0,
      revenueSats: 0
    };

    setEvents(prev => [...prev, event]);
    setShowCreateModal(false);
    setNewEvent({
      name: '', eventId: '', venue: '', startsAt: '', endsAt: '',
      capacity: '', price: '', protocolAddr: '', venueSink: ''
    });
    
    toast({ 
      description: `Event created • id ${truncateMiddle(event.eventId)}` 
    });
  };

  const exportToCSV = () => {
    const headers = ['Event ID', 'Name', 'Venue', 'Start Date', 'End Date', 'Capacity', 'Sold', 'Revenue (sats)', 'Status'];
    const rows = allFilteredEvents.map(event => [
      event.eventId,
      event.name,
      event.venue || '',
      event.startsAtISO,
      event.endsAtISO,
      event.capacity,
      event.sold,
      event.revenueSats,
      getEventStatus(event.startsAtISO, event.endsAtISO)
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'organizer-events.csv';
    link.click();
    
    toast({ description: "CSV exported successfully" });
  };

  const getSortIcon = (column: string) => {
    if (!query.sort) return <ArrowUpDown className="w-3 h-3 ml-1" />;
    
    const [sortColumn, direction] = query.sort.includes('_asc') 
      ? [query.sort.replace('_asc', ''), 'asc']
      : [query.sort.replace('_desc', ''), 'desc'];
    
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1" />;
    
    return direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: `${label} copied` });
  };

  const handleCloseSales = (eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.eventId === eventId ? { ...e, salesOpen: false } : e
    ));
    toast({ description: "Sales closed" });
    setShowDrawer(false);
  };

  const getStatusPill = (event: OrganizerEvent) => {
    const status = getEventStatus(event.startsAtISO, event.endsAtISO);
    const styles = {
      upcoming: "bg-neo-contrast/10 text-neo-contrast/70",
      live: "bg-green-500 text-neo-contrast-inverse",
      ended: "bg-red-500 text-neo-contrast"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-mono uppercase ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-neo-contrast-inverse text-neo-contrast">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold uppercase">ORGANIZER</h1>
          <Button 
            variant="neo" 
            onClick={() => setShowCreateModal(true)}
            className="font-mono uppercase"
          >
            <Plus className="w-4 h-4 mr-2" />
            [ + CREATE EVENT ]
          </Button>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="border border-neo-border/20 rounded-md p-4">
            <div className="text-2xl font-bold">{formatNumber(kpis.revenue)}</div>
            <div className="text-xs font-mono text-neo-contrast/60 uppercase">REVENUE (SATS)</div>
          </div>
          <div className="border border-neo-border/20 rounded-md p-4">
            <div className="text-2xl font-bold">{formatNumber(kpis.ticketsSold)}</div>
            <div className="text-xs font-mono text-neo-contrast/60 uppercase">TICKETS SOLD</div>
          </div>
          <div className="border border-neo-border/20 rounded-md p-4">
            <div className="text-2xl font-bold">{kpis.activeEvents}</div>
            <div className="text-xs font-mono text-neo-contrast/60 uppercase">ACTIVE EVENTS</div>
          </div>
          <div className="border border-neo-border/20 rounded-md p-4">
            <div className="text-2xl font-bold">{pct(kpis.fillRate)}</div>
            <div className="text-xs font-mono text-neo-contrast/60 uppercase">FILL RATE</div>
          </div>
          <div className="border border-neo-border/20 rounded-md p-4">
            <div className="text-2xl font-bold">{pct(kpis.redemptionRate)}</div>
            <div className="text-xs font-mono text-neo-contrast/60 uppercase">REDEMPTION RATE</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="space-y-4 mb-6 p-4 border border-neo-border/20 rounded-md">
          {/* First Row */}
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neo-contrast/60" />
              <Input
                placeholder="Search events..."
                value={query.q || ''}
                onChange={(e) => updateURL({ ...query, q: e.target.value })}
                className="pl-10 font-mono w-64"
              />
            </div>
            
            <select
              value={query.status || ''}
              onChange={(e) => updateURL({ ...query, status: e.target.value as any })}
              className="px-3 py-2 bg-neo-contrast-inverse border border-neo-border/20 rounded-md font-mono text-sm"
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>

            <Input
              placeholder="Venue filter..."
              value={query.venue || ''}
              onChange={(e) => updateURL({ ...query, venue: e.target.value })}
              className="font-mono w-40"
            />

            <Button 
              variant="neo-outline" 
              className="font-mono uppercase text-xs"
              onClick={exportToCSV}
            >
              <Download className="w-3 h-3 mr-1" />
              [ EXPORT CSV ]
            </Button>
          </div>

          {/* Second Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-neo-contrast/60" />
              <Input
                placeholder="Min price"
                type="number"
                value={query.min || ''}
                onChange={(e) => updateURL({ ...query, min: e.target.value ? parseInt(e.target.value) : undefined })}
                className="font-mono w-24"
              />
              <span className="text-neo-contrast/60">-</span>
              <Input
                placeholder="Max price"
                type="number"
                value={query.max || ''}
                onChange={(e) => updateURL({ ...query, max: e.target.value ? parseInt(e.target.value) : undefined })}
                className="font-mono w-24"
              />
              <span className="text-xs text-neo-contrast/60 font-mono">sats</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neo-contrast/60" />
              <Input
                type="date"
                value={query.from || ''}
                onChange={(e) => updateURL({ ...query, from: e.target.value })}
                className="font-mono w-36"
              />
              <span className="text-neo-contrast/60">-</span>
              <Input
                type="date"
                value={query.to || ''}
                onChange={(e) => updateURL({ ...query, to: e.target.value })}
                className="font-mono w-36"
              />
            </div>

            <select
              value={query.perPage || 10}
              onChange={(e) => updateURL({ ...query, perPage: parseInt(e.target.value), page: 1 })}
              className="px-3 py-2 bg-neo-contrast-inverse border border-neo-border/20 rounded-md font-mono text-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <Button
              variant="neo-outline"
              size="sm"
              onClick={() => setDensity(density === 'compact' ? 'normal' : 'compact')}
              className="font-mono uppercase text-xs"
            >
              {density === 'compact' ? 'NORMAL' : 'COMPACT'}
            </Button>
          </div>
        </div>

        {/* Events Table */}
        <div className="border border-neo-border/20 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neo-border/20">
                <tr className="bg-neo-contrast/5">
                  <th 
                    className="text-left p-4 font-mono uppercase text-xs cursor-pointer hover:bg-neo-contrast/10 select-none"
                    onClick={() => updateURL({ ...query, sort: query.sort === 'date_asc' ? 'date_desc' : 'date_asc' })}
                    aria-sort={query.sort?.includes('date') ? (query.sort.includes('asc') ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center">
                      EVENT / DATE
                      {getSortIcon('date')}
                    </div>
                  </th>
                  <th className="text-left p-4 font-mono uppercase text-xs">VENUE</th>
                  <th 
                    className="text-left p-4 font-mono uppercase text-xs cursor-pointer hover:bg-neo-contrast/10 select-none"
                    onClick={() => updateURL({ ...query, sort: 'fill_desc' })}
                    aria-sort={query.sort === 'fill_desc' ? 'descending' : 'none'}
                  >
                    <div className="flex items-center">
                      CAPACITY / SOLD
                      {getSortIcon('fill')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 font-mono uppercase text-xs cursor-pointer hover:bg-neo-contrast/10 select-none"
                    onClick={() => updateURL({ ...query, sort: 'revenue_desc' })}
                    aria-sort={query.sort === 'revenue_desc' ? 'descending' : 'none'}
                  >
                    <div className="flex items-center">
                      REVENUE
                      {getSortIcon('revenue')}
                    </div>
                  </th>
                  <th className="text-left p-4 font-mono uppercase text-xs">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr 
                    key={event.eventId}
                    className={`border-b border-neo-border/20 hover:bg-neo-contrast/5 cursor-pointer ${density === 'compact' ? '' : ''}`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDrawer(true);
                    }}
                  >
                    <td className={density === 'compact' ? 'p-2' : 'p-4'}>
                      <div className="font-semibold">{event.name}</div>
                      <div className="text-xs font-mono text-neo-contrast/60">
                        {formatWindow(event.startsAtISO, event.endsAtISO)}
                      </div>
                    </td>
                    <td className={`text-sm ${density === 'compact' ? 'p-2' : 'p-4'}`}>{event.venue || '—'}</td>
                    <td className={density === 'compact' ? 'p-2' : 'p-4'}>
                      <div className="font-mono">{formatNumber(event.sold)} / {formatNumber(event.capacity)}</div>
                      <div className="text-xs text-neo-contrast/60">{pct(event.sold / event.capacity)} filled</div>
                    </td>
                    <td className={`font-mono ${density === 'compact' ? 'p-2' : 'p-4'}`}>{formatNumber(event.revenueSats)} sats</td>
                    <td className={density === 'compact' ? 'p-2' : 'p-4'}>{getStatusPill(event)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-neo-contrast/60 font-mono">
            Showing {startIndex + 1}-{Math.min(startIndex + perPage, totalEvents)} of {totalEvents} events
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="neo-outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => updateURL({ ...query, page: currentPage - 1 })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-sm">PAGE {currentPage} OF {totalPages}</span>
            <Button 
              variant="neo-outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => updateURL({ ...query, page: currentPage + 1 })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Event Detail Drawer */}
      <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
        <DrawerContent className="bg-neo-contrast-inverse border-neo-border/20">
          <DrawerHeader>
            <div className="flex justify-between items-start">
              <div>
                <DrawerTitle className="font-mono uppercase">{selectedEvent?.name}</DrawerTitle>
                <div className="mt-2">{selectedEvent && getStatusPill(selectedEvent)}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDrawer(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>
          
          {selectedEvent && (
            <div className="p-6 space-y-6">
              {/* Meta */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{truncateMiddle(selectedEvent.eventId)}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(selectedEvent.eventId, 'Event ID')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-sm text-neo-contrast/60">{selectedEvent.venue}</div>
                <div className="text-sm text-neo-contrast/60 font-mono">
                  {formatWindow(selectedEvent.startsAtISO, selectedEvent.endsAtISO)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold">{formatNumber(selectedEvent.sold)} / {formatNumber(selectedEvent.capacity)}</div>
                  <div className="text-xs text-neo-contrast/60 font-mono uppercase">SOLD / CAPACITY</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatNumber(selectedEvent.revenueSats)} sats</div>
                  <div className="text-xs text-neo-contrast/60 font-mono uppercase">REVENUE</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{pct(selectedEvent.sold / selectedEvent.capacity)}</div>
                  <div className="text-xs text-neo-contrast/60 font-mono uppercase">FILL RATE</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{pct(selectedEvent.sold ? selectedEvent.redeemed / selectedEvent.sold : 0)}</div>
                  <div className="text-xs text-neo-contrast/60 font-mono uppercase">REDEMPTION RATE</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-2">
                <div className="text-sm font-mono uppercase text-neo-contrast/60">Recent Activity</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {[
                    { time: '2 min ago', action: 'Ticket purchased by bc1q...7x8z' },
                    { time: '5 min ago', action: 'Ticket redeemed at entrance' },
                    { time: '12 min ago', action: 'Ticket transferred to bc1q...9a2b' },
                    { time: '18 min ago', action: 'Ticket purchased by bc1q...3c4d' }
                  ].map((activity, i) => (
                    <div key={i} className="text-xs p-2 bg-neo-contrast/5 rounded border border-neo-border/10">
                      <div className="text-neo-contrast/60 font-mono">{activity.time}</div>
                      <div className="text-neo-contrast/90">{activity.action}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button 
                  variant="neo-outline" 
                  className="w-full font-mono uppercase"
                  onClick={() => copyToClipboard(selectedEvent.eventId, 'Event ID')}
                >
                  [ COPY EVENT ID ]
                </Button>
                {selectedEvent.salesOpen && (
                  <Button 
                    variant="neo" 
                    className="w-full font-mono uppercase"
                    onClick={() => handleCloseSales(selectedEvent.eventId)}
                  >
                    [ CLOSE SALES ]
                  </Button>
                )}
                <Button 
                  variant="neo-outline" 
                  className="w-full font-mono uppercase"
                >
                  <Download className="w-4 h-4 mr-2" />
                  [ EXPORT TICKETS CSV ]
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Create Event Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-neo-contrast-inverse border-neo-border/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase">CREATE EVENT</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono mb-1">Event Name *</label>
              <Input
                value={newEvent.name}
                onChange={(e) => {
                  setNewEvent({ ...newEvent, name: e.target.value });
                  if (autoGenerateId && e.target.value) {
                    const id = `evt_${Date.now()}_${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
                    setNewEvent(prev => ({ ...prev, eventId: id }));
                  }
                }}
                placeholder="Bitcoin Conference 2025"
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-mono mb-1 flex items-center gap-2">
                Event ID *
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerateId}
                    onChange={(e) => {
                      setAutoGenerateId(e.target.checked);
                      if (e.target.checked && newEvent.name) {
                        const id = `evt_${Date.now()}_${newEvent.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
                        setNewEvent({ ...newEvent, eventId: id });
                      }
                    }}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-neo-contrast/60">Auto-generate</span>
                </label>
              </label>
              <Input
                value={newEvent.eventId}
                onChange={(e) => setNewEvent({ ...newEvent, eventId: e.target.value })}
                placeholder="evt_1234567890abcdef"
                className="font-mono"
                disabled={autoGenerateId}
              />
              <div className="text-xs text-neo-contrast/60 mt-1">Unique identifier for this event</div>
            </div>

            <div>
              <label className="block text-sm font-mono mb-1">Venue</label>
              <Input
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                placeholder="Convention Center"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono mb-1">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={newEvent.startsAt}
                  onChange={(e) => setNewEvent({ ...newEvent, startsAt: e.target.value })}
                  className="font-mono"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <div className="text-xs text-neo-contrast/60 mt-1">Must be in the future</div>
              </div>
              <div>
                <label className="block text-sm font-mono mb-1">End Time *</label>
                <Input
                  type="datetime-local"
                  value={newEvent.endsAt}
                  onChange={(e) => setNewEvent({ ...newEvent, endsAt: e.target.value })}
                  className="font-mono"
                  min={newEvent.startsAt}
                />
                <div className="text-xs text-neo-contrast/60 mt-1">Must be after start time</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono mb-1">Capacity *</label>
                <Input
                  type="number"
                  value={newEvent.capacity}
                  onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                  placeholder="500"
                  className="font-mono"
                  min="1"
                  max="100000"
                />
                <div className="text-xs text-neo-contrast/60 mt-1">Max 100,000 attendees</div>
              </div>
              <div>
                <label className="block text-sm font-mono mb-1">Price (sats) *</label>
                <Input
                  type="number"
                  value={newEvent.price}
                  onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                  placeholder="50000"
                  className="font-mono"
                  min="1"
                  max="100000000"
                />
                <div className="text-xs text-neo-contrast/60 mt-1">Max 100M sats</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono mb-1">Protocol Address *</label>
              <Input
                value={newEvent.protocolAddr}
                onChange={(e) => setNewEvent({ ...newEvent, protocolAddr: e.target.value })}
                placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                className="font-mono"
              />
              <div className="text-xs text-neo-contrast/60 mt-1">Bitcoin address for protocol fees</div>
            </div>

            <div>
              <label className="block text-sm font-mono mb-1">Venue Sink Address *</label>
              <Input
                value={newEvent.venueSink}
                onChange={(e) => setNewEvent({ ...newEvent, venueSink: e.target.value })}
                placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                className="font-mono"
              />
              <div className="text-xs text-neo-contrast/60 mt-1">Bitcoin address for venue payouts</div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                variant="neo" 
                onClick={handleCreateEvent}
                className="flex-1 font-mono uppercase"
              >
                [ CREATE EVENT ]
              </Button>
              <Button 
                variant="neo-outline" 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 font-mono uppercase"
              >
                [ CANCEL ]
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizer;