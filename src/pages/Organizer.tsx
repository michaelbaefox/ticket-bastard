import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Copy, Download, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { TicketPolicy, RecipientShare } from '@/types/ticketing';
import { canonicalizePolicy, derivePolicySignature } from '@/lib/ticketing';
import { useEvents } from '@/hooks/useLocalStorage';
import { EventRecord } from '@/data/events';

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

const bitcoinAddressRegex = /^((bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62})$/;
const fallbackEventImage = '/placeholder.svg';

const eventFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Event name is required")
    .max(120, "Event name must be 120 characters or less"),
  eventId: z
    .string()
    .trim()
    .min(6, "Event ID is required"),
  venue: z
    .string()
    .trim()
    .max(120, "Venue must be 120 characters or less")
    .optional()
    .or(z.literal('')),
  startsAt: z
    .string()
    .min(1, "Start time is required"),
  endsAt: z
    .string()
    .min(1, "End time is required"),
  capacity: z
    .string()
    .trim()
    .min(1, "Capacity is required")
    .refine((val) => /^\d+$/.test(val), { message: "Capacity must be a whole number" })
    .refine((val) => {
      const num = Number(val);
      return num >= 1 && num <= 100000;
    }, { message: "Capacity must be between 1 and 100,000" }),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((val) => /^\d+$/.test(val), { message: "Price must be a whole number" })
    .refine((val) => {
      const num = Number(val);
      return num >= 1 && num <= 100000000;
    }, { message: "Price must be between 1 and 100,000,000 sats" }),
  protocolAddr: z
    .string()
    .trim()
    .min(10, "Protocol address is required")
    .refine((val) => bitcoinAddressRegex.test(val), { message: "Enter a valid Bitcoin address" }),
  venueSink: z
    .string()
    .trim()
    .min(10, "Venue sink address is required")
    .refine((val) => bitcoinAddressRegex.test(val), { message: "Enter a valid Bitcoin address" }),
  issuerId: z
    .string()
    .trim()
    .min(3, "Issuer ID is required")
    .max(120, "Issuer ID must be 120 characters or less"),
  resaleAllowed: z.boolean(),
  royaltyBps: z
    .string()
    .trim()
    .min(1, "Royalty percent is required")
    .refine((val) => /^\d+$/.test(val), { message: "Royalty must be whole number BPS" })
    .refine((val) => {
      const num = Number(val);
      return num >= 0 && num <= 10000;
    }, { message: "Royalty BPS must be between 0 and 10000" }),
}).superRefine((data, ctx) => {
  const start = new Date(data.startsAt);
  const end = new Date(data.endsAt);

  if (Number.isNaN(start.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startsAt'],
      message: "Start time must be a valid date",
    });
    return;
  }

  if (start <= new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startsAt'],
      message: "Start time must be in the future",
    });
  }

  if (Number.isNaN(end.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endsAt'],
      message: "End time must be a valid date",
    });
    return;
  }

  if (end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endsAt'],
      message: "End time must be after the start time",
    });
  }
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const eventFormDefaults: EventFormValues = {
  name: '',
  eventId: '',
  venue: '',
  startsAt: '',
  endsAt: '',
  capacity: '',
  price: '',
  protocolAddr: '',
  venueSink: '',
  issuerId: '',
  resaleAllowed: true,
  royaltyBps: '0'
};

type RecipientFormRow = RecipientShare & { key: string };

const defaultPrimaryRecipients: RecipientFormRow[] = [
  { key: 'primary-0', lockingScriptHex: '', bps: 10000, id: 'organizer' }
];

const defaultRoyaltyRecipients: RecipientFormRow[] = [
  { key: 'royalty-0', lockingScriptHex: '', bps: 10000, id: 'issuer' }
];

const Organizer = () => {
  const [events, setEvents] = useEvents();
  const [query, setQuery] = useState<OrganizerQuery>({ page: 1, perPage: 10 });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [density, setDensity] = useState<'compact' | 'normal'>('normal');
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [primaryRecipients, setPrimaryRecipients] = useState<RecipientFormRow[]>(defaultPrimaryRecipients);
  const [royaltyRecipients, setRoyaltyRecipients] = useState<RecipientFormRow[]>(defaultRoyaltyRecipients);
  const [policyErrors, setPolicyErrors] = useState<{ primary?: string; royalty?: string }>({});
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const createEventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: eventFormDefaults,
    mode: 'onSubmit'
  });
  const watchedEventName = createEventForm.watch('name');
  const watchedStartTime = createEventForm.watch('startsAt');
  const { isSubmitted } = createEventForm.formState;

  const addRecipientRow = (type: 'primary' | 'royalty') => {
    const key = `${type}-${Date.now()}`;
    const newRow: RecipientFormRow = {
      key,
      id: `${type}-${(type === 'primary' ? primaryRecipients : royaltyRecipients).length}`,
      lockingScriptHex: '',
      bps: 0
    };
    if (type === 'primary') {
      setPrimaryRecipients(prev => [...prev, newRow]);
    } else {
      setRoyaltyRecipients(prev => [...prev, newRow]);
    }
  };

  const updateRecipientRow = (
    type: 'primary' | 'royalty',
    key: string,
    field: 'id' | 'lockingScriptHex' | 'bps',
    value: string
  ) => {
    const updater = (rows: RecipientFormRow[]) => rows.map((row) =>
      row.key === key ? { ...row, [field]: field === 'bps' ? Number(value) : value } : row
    );

    if (type === 'primary') {
      setPrimaryRecipients(updater);
    } else {
      setRoyaltyRecipients(updater);
    }
  };

  const removeRecipientRow = (type: 'primary' | 'royalty', key: string) => {
    if (type === 'primary') {
      setPrimaryRecipients(prev => prev.filter(row => row.key !== key));
    } else {
      setRoyaltyRecipients(prev => prev.filter(row => row.key !== key));
    }
  };

  const primaryTotalBps = primaryRecipients.reduce((sum, r) => sum + Number(r.bps || 0), 0);
  const royaltyTotalBps = royaltyRecipients.reduce((sum, r) => sum + Number(r.bps || 0), 0);

  useEffect(() => {
    if (!autoGenerateId) return;

    const shouldValidate = isSubmitted;
    const name = watchedEventName?.trim();
    if (!name) {
      createEventForm.setValue('eventId', '', { shouldValidate, shouldDirty: false });
      return;
    }

    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    if (!sanitized) {
      createEventForm.setValue('eventId', '', { shouldValidate, shouldDirty: false });
      return;
    }

    const generatedId = `evt_${Date.now()}_${sanitized}`;
    createEventForm.setValue('eventId', generatedId, { shouldValidate, shouldDirty: false });
  }, [autoGenerateId, watchedEventName, createEventForm, isSubmitted]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newQuery: OrganizerQuery = { page: 1, perPage: 10 };
    
    if (params.get('q')) newQuery.q = params.get('q')!;
    const statusParam = params.get('status');
    if (statusParam === 'upcoming' || statusParam === 'live' || statusParam === 'ended') {
      newQuery.status = statusParam;
    }
    const venueParam = params.get('venue');
    const minParam = params.get('min');
    const maxParam = params.get('max');
    const fromParam = params.get('from');
    const toParam = params.get('to');

    if (venueParam) newQuery.venue = venueParam;
    if (minParam) newQuery.min = Number.parseInt(minParam, 10);
    if (maxParam) newQuery.max = Number.parseInt(maxParam, 10);
    if (fromParam) newQuery.from = fromParam;
    if (toParam) newQuery.to = toParam;
    const sortParam = params.get('sort');
    const sortValues: OrganizerQuery['sort'][] = ['date_asc', 'date_desc', 'sold_desc', 'revenue_desc', 'fill_desc'];
    if (sortParam && sortValues.includes(sortParam as OrganizerQuery['sort'])) {
      newQuery.sort = sortParam as OrganizerQuery['sort'];
    }
    const pageParam = params.get('page');
    const perPageParam = params.get('perPage');

    if (pageParam) newQuery.page = Number.parseInt(pageParam, 10) || 1;
    if (perPageParam) newQuery.perPage = Number.parseInt(perPageParam, 10) || 10;
    
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

  const selectedEvent = selectedEventId ? events.find((event) => event.eventId === selectedEventId) ?? null : null;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageError(null);
      setUploadedImageUrl(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Upload a valid image file');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImageUrl(reader.result);
      }
      setImageError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImageUrl(null);
    setImageError(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleCreateEvent = createEventForm.handleSubmit(async (values) => {
    const capacity = Number(values.capacity);
    const price = Number(values.price);

    const sanitizeRecipients = (rows: RecipientFormRow[]): RecipientShare[] =>
      rows.map((row) => ({
        id: row.id?.trim() || undefined,
        lockingScriptHex: row.lockingScriptHex.trim(),
        bps: Number(row.bps)
      }));

    const sumPrimary = primaryRecipients.reduce((sum, r) => sum + Number(r.bps || 0), 0);
    const sumRoyalty = royaltyRecipients.reduce((sum, r) => sum + Number(r.bps || 0), 0);

    const newPolicyErrors: { primary?: string; royalty?: string } = {};
    if (!primaryRecipients.length || sumPrimary !== 10000) {
      newPolicyErrors.primary = 'Primary split must equal 10000 BPS';
    }
    if (!royaltyRecipients.length || sumRoyalty !== 10000) {
      newPolicyErrors.royalty = 'Royalty split must equal 10000 BPS';
    }

    if (Object.keys(newPolicyErrors).length) {
      setPolicyErrors(newPolicyErrors);
      return;
    }

    setPolicyErrors({});

    const policy: TicketPolicy = {
      resaleAllowed: values.resaleAllowed,
      royaltyBps: Number(values.royaltyBps),
      royaltyRecipients: sanitizeRecipients(royaltyRecipients),
      primaryRecipients: sanitizeRecipients(primaryRecipients),
      version: '1',
      issuerId: values.issuerId.trim()
    };

    const policyJson = canonicalizePolicy(policy);
    const issuerSignature = derivePolicySignature(values.eventId.trim(), 'template', policyJson);

    const event: EventRecord = {
      eventId: values.eventId.trim(),
      name: values.name.trim(),
      venue: values.venue?.trim() || '',
      startsAtISO: values.startsAt,
      endsAtISO: values.endsAt,
      capacity,
      priceSats: price,
      protocolAddr: values.protocolAddr.trim(),
      venueSink: values.venueSink.trim(),
      salesOpen: true,
      sold: 0,
      redeemed: 0,
      revenueSats: 0,
      policy,
      policyJson,
      issuerSignature,
      imageUrl: uploadedImageUrl ?? undefined
    };

    setEvents(prev => [...prev, event]);
    setShowCreateModal(false);
    toast({
      description: `Event created • id ${truncateMiddle(event.eventId)}`
    });
    createEventForm.reset(eventFormDefaults);
    setAutoGenerateId(true);
    setPrimaryRecipients(defaultPrimaryRecipients.map((row) => ({ ...row })));
    setRoyaltyRecipients(defaultRoyaltyRecipients.map((row) => ({ ...row })));
    handleRemoveImage();
  });

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

  const getStatusPill = (event: EventRecord) => {
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
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold uppercase">ORGANIZER</h1>
          <Button
            variant="neo"
            onClick={() => setShowCreateModal(true)}
            className="font-mono uppercase w-full sm:w-auto"
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
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <div className="relative md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                placeholder="Search events..."
                value={query.q || ''}
                onChange={(e) => updateURL({ ...query, q: e.target.value })}
                className="pl-10 font-mono w-full md:w-64"
              />
            </div>

            <select
              value={query.status || ''}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '') {
                  updateURL({ ...query, status: undefined });
                  return;
                }

                if (value === 'upcoming' || value === 'live' || value === 'ended') {
                  updateURL({ ...query, status: value });
                }
              }}
              className="px-3 py-2 bg-black border border-white/20 rounded-md font-mono text-sm w-full md:w-auto"
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
              className="font-mono w-full md:w-40"
            />

            <Button
              variant="neo-outline"
              className="font-mono uppercase text-xs w-full md:w-auto"
              onClick={exportToCSV}
            >
              <Download className="w-3 h-3 mr-1" />
              [ EXPORT CSV ]
            </Button>
          </div>

          {/* Second Row */}
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:flex-row md:items-center">
              <DollarSign className="w-4 h-4 text-white/60" />
              <Input
                placeholder="Min price"
                type="number"
                value={query.min || ''}
                onChange={(e) => updateURL({ ...query, min: e.target.value ? parseInt(e.target.value) : undefined })}
                className="font-mono w-full sm:w-24"
              />
              <span className="text-neo-contrast/60">-</span>
              <Input
                placeholder="Max price"
                type="number"
                value={query.max || ''}
                onChange={(e) => updateURL({ ...query, max: e.target.value ? parseInt(e.target.value) : undefined })}
                className="font-mono w-full sm:w-24"
              />
              <span className="text-xs text-neo-contrast/60 font-mono">sats</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:flex-row md:items-center">
              <Calendar className="w-4 h-4 text-white/60" />
              <Input
                type="date"
                value={query.from || ''}
                onChange={(e) => updateURL({ ...query, from: e.target.value })}
                className="font-mono w-full sm:w-36"
              />
              <span className="text-neo-contrast/60">-</span>
              <Input
                type="date"
                value={query.to || ''}
                onChange={(e) => updateURL({ ...query, to: e.target.value })}
                className="font-mono w-full sm:w-36"
              />
            </div>

            <select
              value={query.perPage || 10}
              onChange={(e) => updateURL({ ...query, perPage: parseInt(e.target.value), page: 1 })}
              className="px-3 py-2 bg-black border border-white/20 rounded-md font-mono text-sm w-full md:w-auto"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <Button
              variant="neo-outline"
              onClick={() => setDensity(density === 'compact' ? 'normal' : 'compact')}
              className="font-mono uppercase text-xs w-full md:w-auto"
            >
              {density === 'compact' ? 'NORMAL' : 'COMPACT'}
            </Button>
          </div>
        </div>

        {/* Events Table */}
        <div className="hidden md:block border border-white/20 rounded-md overflow-hidden">
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
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-sm font-mono text-white/60"
                    >
                      No events match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr
                      key={event.eventId}
                      className={`border-b border-white/20 hover:bg-white/5 cursor-pointer ${density === 'compact' ? '' : ''}`}
                      onClick={() => {
                        setSelectedEventId(event.eventId);
                        setShowDrawer(true);
                      }}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                          keyboardEvent.preventDefault();
                          setSelectedEventId(event.eventId);
                          setShowDrawer(true);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${event.name}`}
                    >
                      <td className={density === 'compact' ? 'p-2' : 'p-4'}>
                        <div className="font-semibold">{event.name}</div>
                        <div className="text-xs font-mono text-white/60">
                          {formatWindow(event.startsAtISO, event.endsAtISO)}
                        </div>
                      </td>
                      <td className={`text-sm ${density === 'compact' ? 'p-2' : 'p-4'}`}>{event.venue || '—'}</td>
                      <td className={density === 'compact' ? 'p-2' : 'p-4'}>
                        <div className="font-mono">{formatNumber(event.sold)} / {formatNumber(event.capacity)}</div>
                        <div className="text-xs text-white/60">{pct(event.sold / event.capacity)} filled</div>
                      </td>
                      <td className={`font-mono ${density === 'compact' ? 'p-2' : 'p-4'}`}>{formatNumber(event.revenueSats)} sats</td>
                    <td className={density === 'compact' ? 'p-2' : 'p-4'}>
                      <div className="flex items-center gap-3">
                        {getStatusPill(event)}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            window.open(`/events/${event.eventId}`, '_blank', 'noopener,noreferrer');
                          }}
                          onKeyDown={(keyEvent) => {
                            if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                              keyEvent.preventDefault();
                              keyEvent.stopPropagation();
                              window.open(`/events/${event.eventId}`, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          aria-label={`Open public page for ${event.name}`}
                        >
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Events Cards (Mobile) */}
        <div className="space-y-3 md:hidden">
          {filteredEvents.length === 0 && (
            <div className="border border-white/20 rounded-md p-4 bg-white/5 text-white/70 text-sm font-mono text-center">
              No events match the current filters.
            </div>
          )}

          {filteredEvents.map((event) => (
            <button
              key={event.eventId}
              type="button"
              onClick={() => {
                setSelectedEventId(event.eventId);
                setShowDrawer(true);
              }}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                  keyboardEvent.preventDefault();
                  setSelectedEventId(event.eventId);
                  setShowDrawer(true);
                }
              }}
              className="w-full text-left border border-white/20 rounded-lg bg-white/5 p-4 space-y-3 focus:outline-none focus:ring-2 focus:ring-neo-cyan"
              tabIndex={0}
              aria-label={`View details for ${event.name}`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-base">{event.name}</span>
                  {getStatusPill(event)}
                </div>
                <div className="text-xs font-mono text-white/60">
                  {formatWindow(event.startsAtISO, event.endsAtISO)}
                </div>
                <div className="text-sm text-white/70">
                  <span className="font-mono text-white/60">Venue:</span>{' '}
                  {event.venue || '—'}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="font-mono text-sm">{formatNumber(event.sold)} / {formatNumber(event.capacity)}</div>
                  <div className="text-xs text-white/60">{pct(event.sold / event.capacity)} filled</div>
                </div>
                <div>
                  <div className="font-mono text-sm">{formatNumber(event.revenueSats)} sats</div>
                  <div className="text-xs text-white/60">Revenue</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6">
          <div className="text-sm text-white/60 font-mono text-center sm:text-left">
            Showing {startIndex + 1}-{Math.min(startIndex + perPage, totalEvents)} of {totalEvents} events
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="neo-outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => updateURL({ ...query, page: currentPage - 1 })}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-sm">PAGE {currentPage} OF {totalPages}</span>
            <Button
              variant="neo-outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => updateURL({ ...query, page: currentPage + 1 })}
              aria-label="Next page"
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
                size="icon"
                onClick={() => setShowDrawer(false)}
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>

          {selectedEvent && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="w-full sm:w-56">
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-neo-border/20 bg-white/5">
                    <img
                      src={selectedEvent.imageUrl || fallbackEventImage}
                      alt={`${selectedEvent.name} artwork`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{truncateMiddle(selectedEvent.eventId)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(selectedEvent.eventId, 'Event ID')}
                        aria-label="Copy event id"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-neo-contrast/60">{selectedEvent.venue}</div>
                    <div className="text-sm text-neo-contrast/60 font-mono">
                      {formatWindow(selectedEvent.startsAtISO, selectedEvent.endsAtISO)}
                    </div>
                  </div>

                  <div>{getStatusPill(selectedEvent)}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Policy */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Ticket Policy</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-sm font-mono text-neo-contrast/80">
                    <div>Resale: {selectedEvent.policy.resaleAllowed ? 'Allowed' : 'Disabled'}</div>
                    <div>Royalty: {(selectedEvent.policy.royaltyBps / 100).toFixed(2)}%</div>
                    <div>Issuer ID: {selectedEvent.policy.issuerId}</div>
                  </div>
                  <div className="text-xs font-mono text-neo-contrast/60 break-words">
                    <div className="uppercase tracking-wide text-neo-contrast/50 mb-1">Policy JSON</div>
                    {selectedEvent.policyJson}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-neo-contrast/50 uppercase font-mono mb-1">Primary Split</div>
                    <div className="space-y-1">
                      {selectedEvent.policy.primaryRecipients.map((recipient, idx) => (
                        <div key={`${recipient.lockingScriptHex}-${idx}`} className="text-xs font-mono text-neo-contrast/80">
                          {recipient.id ?? `Recipient ${idx + 1}`} • {recipient.bps / 100}% • {recipient.lockingScriptHex}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neo-contrast/50 uppercase font-mono mb-1">Royalty Split</div>
                    <div className="space-y-1">
                      {selectedEvent.policy.royaltyRecipients.map((recipient, idx) => (
                        <div key={`${recipient.lockingScriptHex}-${idx}`} className="text-xs font-mono text-neo-contrast/80">
                          {recipient.id ?? `Recipient ${idx + 1}`} • {recipient.bps / 100}% • {recipient.lockingScriptHex}
                        </div>
                      ))}
                    </div>
                  </div>
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
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            createEventForm.reset(eventFormDefaults);
            setAutoGenerateId(true);
            setPrimaryRecipients(defaultPrimaryRecipients.map((row) => ({ ...row })));
            setRoyaltyRecipients(defaultRoyaltyRecipients.map((row) => ({ ...row })));
            setPolicyErrors({});
            handleRemoveImage();
          }
        }}
      >
        <DialogContent className="bg-black border-white/20 max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase">CREATE EVENT</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <Form {...createEventForm}>
              <form onSubmit={handleCreateEvent} className="space-y-4 pb-6">
                <FormField
                  control={createEventForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Bitcoin Conference 2025"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={createEventForm.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-4">
                      <FormLabel className="mb-0">Event ID *</FormLabel>
                      <label className="flex items-center gap-1 cursor-pointer text-xs text-white/60">
                        <input
                          type="checkbox"
                          checked={autoGenerateId}
                          onChange={(e) => {
                            setAutoGenerateId(e.target.checked);
                            if (!e.target.checked) {
                              createEventForm.setValue('eventId', field.value, { shouldDirty: true });
                            }
                          }}
                          className="w-3 h-3"
                        />
                        <span>Auto-generate</span>
                      </label>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="evt_1234567890abcdef"
                        className="font-mono"
                        disabled={autoGenerateId}
                      />
                    </FormControl>
                    <FormDescription>Unique identifier for this event</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createEventForm.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Convention Center"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>Optional — helps guests identify the location.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3 border border-white/10 rounded-md p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <FormLabel className="mb-0">Event Image</FormLabel>
                    <p className="text-xs text-white/60 font-mono">Upload artwork to feature on marketplace and tickets.</p>
                  </div>
                  {uploadedImageUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveImage}
                      aria-label="Remove uploaded image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-full sm:w-48">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-white/15 bg-white/5">
                      {uploadedImageUrl ? (
                        <img
                          src={uploadedImageUrl}
                          alt="Event artwork preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/50">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      aria-label="Upload event image"
                      className="font-mono"
                    />
                    <p className="text-xs text-white/60 font-mono">PNG, JPG, or GIF up to 5MB.</p>
                    {imageError ? (
                      <p className="text-xs text-red-400 font-mono">{imageError}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createEventForm.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="font-mono"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormDescription>Must be in the future</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createEventForm.control}
                  name="endsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="font-mono"
                          min={watchedStartTime || undefined}
                        />
                      </FormControl>
                      <FormDescription>Must be after start time</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createEventForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="500"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>Max 100,000 attendees</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createEventForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (sats) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="50000"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>Max 100M sats</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createEventForm.control}
                name="protocolAddr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol Address *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>Bitcoin address for protocol fees</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createEventForm.control}
                name="venueSink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Sink Address *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>Bitcoin address for venue payouts</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createEventForm.control}
                name="issuerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuer ID *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="organizer-handle"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>Human-readable identifier published with your policy.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createEventForm.control}
                  name="resaleAllowed"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-4">
                        <FormLabel className="mb-0">Allow Resale</FormLabel>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </div>
                      <FormDescription>Toggle off to make tickets non-transferable.</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createEventForm.control}
                  name="royaltyBps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Royalty (BPS)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          type="number"
                          min={0}
                          max={10000}
                          placeholder="750"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>Basis points applied on each resale (10000 = 100%).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <div className="border border-white/10 rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Primary Sale Split</h4>
                      <p className="text-xs text-white/60 font-mono">Distributes mint proceeds immediately.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="neo-outline"
                      onClick={() => addRecipientRow('primary')}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add recipient
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {primaryRecipients.map((recipient) => (
                      <div key={recipient.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3">
                          <label className="text-xs text-white/60">Identity Label</label>
                          <Input
                            value={recipient.id ?? ''}
                            onChange={(e) => updateRecipientRow('primary', recipient.key, 'id', e.target.value)}
                            placeholder="organizer"
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <label className="text-xs text-white/60">Locking Script (hex)</label>
                          <Input
                            value={recipient.lockingScriptHex}
                            onChange={(e) => updateRecipientRow('primary', recipient.key, 'lockingScriptHex', e.target.value)}
                            placeholder="76a914...88ac"
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-white/60">BPS</label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={recipient.bps}
                            onChange={(e) => updateRecipientRow('primary', recipient.key, 'bps', e.target.value)}
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeRecipientRow('primary', recipient.key)}
                            disabled={primaryRecipients.length === 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs font-mono text-white/60">Total: {primaryTotalBps} BPS</div>
                    {policyErrors.primary && (
                      <div className="text-xs text-red-400">{policyErrors.primary}</div>
                    )}
                  </div>
                </div>

                <div className="border border-white/10 rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Royalty Split</h4>
                      <p className="text-xs text-white/60 font-mono">Paid automatically on each resale.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="neo-outline"
                      onClick={() => addRecipientRow('royalty')}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add recipient
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {royaltyRecipients.map((recipient) => (
                      <div key={recipient.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3">
                          <label className="text-xs text-white/60">Identity Label</label>
                          <Input
                            value={recipient.id ?? ''}
                            onChange={(e) => updateRecipientRow('royalty', recipient.key, 'id', e.target.value)}
                            placeholder="artist"
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <label className="text-xs text-white/60">Locking Script (hex)</label>
                          <Input
                            value={recipient.lockingScriptHex}
                            onChange={(e) => updateRecipientRow('royalty', recipient.key, 'lockingScriptHex', e.target.value)}
                            placeholder="76a914...88ac"
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-white/60">BPS</label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={recipient.bps}
                            onChange={(e) => updateRecipientRow('royalty', recipient.key, 'bps', e.target.value)}
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeRecipientRow('royalty', recipient.key)}
                            disabled={royaltyRecipients.length === 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs font-mono text-white/60">Total: {royaltyTotalBps} BPS</div>
                    {policyErrors.royalty && (
                      <div className="text-xs text-red-400">{policyErrors.royalty}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 md:flex-row md:gap-4">
                <Button
                  type="button"
                  variant="neo-outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    createEventForm.reset(eventFormDefaults);
                    setAutoGenerateId(true);
                  }}
                  className="flex-1 font-mono uppercase"
                >
                  [ CANCEL ]
                </Button>
                <Button
                  type="submit"
                  variant="neo"
                  className="flex-1 font-mono uppercase"
                >
                  [ CREATE EVENT ]
                </Button>
              </div>
            </form>
          </Form>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizer;