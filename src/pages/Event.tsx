import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Share2, Copy, ExternalLink, ArrowLeft, Ticket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEvents } from '@/hooks/useLocalStorage';
import { useAnnouncements } from '@/hooks/useAccessibility';
import { useToast } from '@/hooks/use-toast';
import { getEventById } from '@/data/events';
import { PurchaseModal } from '@/components/PurchaseModal';
import { TicketOnChain } from '@/types/ticketing';

const fallbackImage = '/placeholder.svg';

const formatDateWindow = (startISO: string, endISO: string) => {
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Schedule TBA';
  }

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${dateFormatter.format(startDate)} • ${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`;
  }

  return `${dateFormatter.format(startDate)} ${timeFormatter.format(startDate)} → ${dateFormatter.format(endDate)} ${timeFormatter.format(endDate)}`;
};

const formatSats = (value: number) => value.toLocaleString();

const getEventStatus = (startsAtISO: string, endsAtISO: string) => {
  const now = new Date();
  const start = new Date(startsAtISO);
  const end = new Date(endsAtISO);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'scheduled';
  }

  if (now < start) {
    return 'upcoming';
  }

  if (now > end) {
    return 'completed';
  }

  return 'live';
};

const statusBadgeStyles: Record<string, string> = {
  upcoming: 'bg-neo-contrast/10 text-neo-contrast',
  live: 'bg-green-500 text-neo-contrast-inverse',
  completed: 'bg-white/10 text-white/70',
  scheduled: 'bg-white/10 text-white',
};

const faqItems = [
  {
    id: 'arrival',
    question: 'When should I arrive?',
    answer:
      'Doors open 60 minutes before showtime. Arrive early for security, merch, and to secure your preferred spot.',
  },
  {
    id: 'transfer',
    question: 'Can I transfer my ticket?',
    answer:
      'Yes. Navigate to “My Tickets”, choose the ticket, and follow the transfer flow. You will need the recipient’s BastardChain handle.',
  },
  {
    id: 'support',
    question: 'Where can I get support?',
    answer:
      'Email the organizer or join the encrypted support chat—links are provided below the contact section on this page.',
  },
];

const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [events] = useEvents();
  const { announce } = useAnnouncements();
  const { toast } = useToast();
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const normalizedId = eventId?.trim() ?? '';

  const eventRecord = useMemo(() => {
    if (!normalizedId) {
      return undefined;
    }

    return getEventById(events, normalizedId ?? '');
  }, [events, normalizedId]);

  useEffect(() => {
    if (!normalizedId || eventRecord) {
      return;
    }

    announce('Event not found.');
  }, [announce, eventRecord, normalizedId]);

  useEffect(() => {
    if (!eventRecord) {
      return;
    }

    announce(`Loaded event ${eventRecord.name}.`);
  }, [announce, eventRecord]);

  const handleOpenPurchase = () => {
    setIsPurchaseOpen(true);
  };

  const handleClosePurchase = () => {
    setIsPurchaseOpen(false);
  };

  const handleCopyEventId = () => {
    if (!eventRecord) {
      return;
    }

    navigator.clipboard.writeText(eventRecord.eventId).then(() => {
      toast({ description: 'Event ID copied to clipboard.' });
    });
  };

  const handleShareEvent = () => {
    if (!eventRecord) {
      return;
    }

    const shareData = {
      title: eventRecord.name,
      text: `${eventRecord.name} at ${eventRecord.venue ?? 'an awesome venue'} on ${formatDateWindow(
        eventRecord.startsAtISO,
        eventRecord.endsAtISO,
      )}`,
      url: window.location.href,
    } satisfies ShareData;

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        toast({ description: 'Sharing cancelled.' });
      });
      return;
    }

    navigator.clipboard.writeText(shareData.url).then(() => {
      toast({ description: 'Share link copied to clipboard.' });
    });
  };

  const handleDownloadCalendar = () => {
    if (!eventRecord) {
      return;
    }

    const start = new Date(eventRecord.startsAtISO).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const end = new Date(eventRecord.endsAtISO).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TicketBastard//Event//EN',
      'BEGIN:VEVENT',
      `UID:${eventRecord.eventId}@ticketbastard`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${eventRecord.name}`,
      `LOCATION:${eventRecord.venue ?? 'TBA'}`,
      `DESCRIPTION:Purchase tickets at ${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventRecord.eventId}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ description: 'Calendar invite downloaded.' });
  };

  const handleContactOrganizer = () => {
    if (!eventRecord) {
      return;
    }

    const subject = encodeURIComponent(`[TicketBastard] Question about ${eventRecord.name}`);
    const body = encodeURIComponent('Hi team,\n\nI have a question about the event...');
    window.location.href = `mailto:support@ticketbastard.xyz?subject=${subject}&body=${body}`;
  };

  if (!eventRecord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center text-white">
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl font-bold uppercase">Event Unavailable</h1>
          <p className="text-sm text-white/70">
            The event you tried to open does not exist or is no longer published. Explore the marketplace to discover live
            shows worth your sats.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="neo" asChild>
            <Link to="/marketplace" aria-label="Return to marketplace">
              Browse Marketplace
            </Link>
          </Button>
          <Button variant="neo-outline" asChild>
            <Link to="/organizer" aria-label="Visit organizer dashboard">
              Organizer Tools
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = getEventStatus(eventRecord.startsAtISO, eventRecord.endsAtISO);
  const availability = Math.max(eventRecord.capacity - eventRecord.sold, 0);
  const fillRate = eventRecord.capacity > 0 ? Math.min(eventRecord.sold / eventRecord.capacity, 1) : 0;

  const ticketTemplate = useMemo<TicketOnChain>(() => ({
    protocolAddr: eventRecord.protocolAddr,
    eventId: eventRecord.eventId,
    ticketId: `${eventRecord.eventId}_general`,
    seatCiphertext: [42, 7, 21],
    validFromISO: eventRecord.startsAtISO,
    validToISO: eventRecord.endsAtISO,
    policyJson: eventRecord.policyJson,
    issuerSignature: eventRecord.issuerSignature ?? undefined,
  }), [eventRecord]);

  const quickActions = [
    {
      id: 'share',
      label: 'Share Event',
      icon: <Share2 className="w-4 h-4" aria-hidden="true" />,
      onClick: handleShareEvent,
    },
    {
      id: 'copy',
      label: 'Copy Event ID',
      icon: <Copy className="w-4 h-4" aria-hidden="true" />,
      onClick: handleCopyEventId,
    },
    {
      id: 'calendar',
      label: 'Add to Calendar',
      icon: <CalendarDays className="w-4 h-4" aria-hidden="true" />,
      onClick: handleDownloadCalendar,
    },
    {
      id: 'contact',
      label: 'Contact Organizer',
      icon: <ExternalLink className="w-4 h-4" aria-hidden="true" />,
      onClick: handleContactOrganizer,
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <Link to="/marketplace" className="hover:text-white transition-colors" aria-label="Back to marketplace">
          Marketplace
        </Link>
        <span className="text-white/40">/</span>
        <span className="text-white/90">{eventRecord.name}</span>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
        <div className="space-y-8">
          <div className="rounded-lg border border-white/10 overflow-hidden bg-white/5">
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={eventRecord.imageUrl || fallbackImage}
                alt={`${eventRecord.name} artwork`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-3">
                <Badge className={`${statusBadgeStyles[status]} uppercase font-mono`}>{status}</Badge>
                <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-mono text-white/70 flex items-center gap-2">
                  <CalendarDays className="w-3 h-3" aria-hidden="true" />
                  {formatDateWindow(eventRecord.startsAtISO, eventRecord.endsAtISO)}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold uppercase">{eventRecord.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    <span>{eventRecord.venue ?? 'Location coming soon'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>{formatDateWindow(eventRecord.startsAtISO, eventRecord.endsAtISO)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs font-mono text-white/50">TICKET PRICE</div>
                    <div className="text-2xl font-semibold">{formatSats(eventRecord.priceSats)} sats</div>
                    <p className="text-xs text-white/60">Includes protocol-grade anti-bot protections.</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs font-mono text-white/50">AVAILABILITY</div>
                    <div className="text-2xl font-semibold">{availability} seats left</div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-2 bg-neo-contrast transition-all"
                        style={{ width: `${Math.round(fillRate * 100)}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs text-white/60">{Math.round(fillRate * 100)}% claimed</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="neo" size="lg" onClick={handleOpenPurchase} aria-label="Purchase tickets">
                  <Ticket className="w-4 h-4 mr-2" aria-hidden="true" />
                  Buy Ticket
                </Button>
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="neo-outline"
                    size="lg"
                    onClick={action.onClick}
                    aria-label={action.label}
                    className="flex items-center gap-2"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <section className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold uppercase">Experience</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {eventRecord.name} brings together builders, artists, and the loudest node runners for a one-night takeover.
                Expect immersive audio, shrine-worthy visuals, and sats-enabled vending. Every ticket includes access to the
                afterburner lounge and proof of attendance NFT.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Immersive stages", "Lightning-powered merch", "Encrypted chill zones", "Zero-fee peer trades"].map((highlight) => (
                <Card key={highlight} className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-sm text-white/80">{highlight}</CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold uppercase">Lineup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Genesis DJ', 'Node Operator', 'Protocol Prophet'].map((artist) => (
                  <Card key={artist} className="bg-gradient-to-br from-neo-contrast/10 to-white/5 border-white/10">
                    <CardContent className="p-4 space-y-2">
                      <div className="text-lg font-semibold">{artist}</div>
                      <p className="text-xs text-white/60">Exclusive set crafted for this event only.</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold uppercase">FAQ</h3>
              <Accordion type="single" collapsible className="bg-white/5 rounded-lg border border-white/10 divide-y divide-white/10">
                {faqItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="px-4 text-left">
                      <span className="text-sm font-semibold uppercase">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-white/70">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-mono text-white/45 uppercase">Organizer Policy</div>
                <div className="text-sm text-white/70">
                  Resale {eventRecord.policy.resaleAllowed ? 'permitted with automated royalty splits.' : 'disabled for this drop.'}
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-2 text-sm text-white/70">
                <div className="font-semibold">Primary Recipients</div>
                <ul className="space-y-1">
                  {eventRecord.policy.primaryRecipients.map((recipient, index) => (
                    <li key={`${recipient.lockingScriptHex}-${index}`} className="flex items-center justify-between gap-2">
                      <span>{recipient.id ?? `Recipient ${index + 1}`}</span>
                      <span className="font-mono text-xs text-white/50">{recipient.bps / 100}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-2 text-sm text-white/70">
                <div className="font-semibold">Royalty Recipients</div>
                <ul className="space-y-1">
                  {eventRecord.policy.royaltyRecipients.map((recipient, index) => (
                    <li key={`${recipient.lockingScriptHex}-${index}`} className="flex items-center justify-between gap-2">
                      <span>{recipient.id ?? `Recipient ${index + 1}`}</span>
                      <span className="font-mono text-xs text-white/50">{recipient.bps / 100}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-2 text-sm text-white/70">
                <div className="font-semibold">Issuer</div>
                <div className="font-mono text-xs text-white/50">{eventRecord.policy.issuerId}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-lg font-semibold uppercase">Need Directions?</h3>
              <p className="text-sm text-white/65">
                {eventRecord.venue ?? 'Venue details release soon.'} is accessible by subway, rideshare, and scooter. Expect
                screening at entry—bring ID and your ticket QR code.
              </p>
              <div className="aspect-video rounded-lg bg-[radial-gradient(circle_at_top,_#0ea5e9,_#020617)] flex items-center justify-center text-xs text-white/60 font-mono">
                MAP VIEW LOADING…
              </div>
              <Button variant="neo-outline" onClick={() => window.open('https://maps.google.com', '_blank')} aria-label="Open navigation">
                Open in Maps
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-lg font-semibold uppercase">Organizer Contact</h3>
              <p className="text-sm text-white/70">
                Questions about accessibility, sponsorships, or group sales? Reach the crew directly.
              </p>
              <Button variant="neo-outline" onClick={handleContactOrganizer} aria-label="Email organizer">
                Email Organizer
              </Button>
              <Button
                variant="neo-outline"
                onClick={() => window.open('https://discord.gg/ticketbastard', '_blank')}
                aria-label="Join community chat"
              >
                Join Community Chat
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>

      <PurchaseModal
        isOpen={isPurchaseOpen}
        onClose={handleClosePurchase}
        onConfirm={() => {
          handleClosePurchase();
        }}
        eventName={eventRecord.name}
        priceInSats={eventRecord.priceSats}
        seatLabel="General Admission"
        policy={eventRecord.policy}
        ticketTemplate={ticketTemplate}
        issuerSignature={eventRecord.issuerSignature}
        eventImageUrl={eventRecord.imageUrl}
      />
    </div>
  );
};

export default EventPage;

