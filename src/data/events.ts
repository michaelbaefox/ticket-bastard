import { TicketPolicy } from '@/types/ticketing';
import { canonicalizePolicy, derivePolicySignature } from '@/lib/ticketing';

export type EventRecord = {
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
  policy: TicketPolicy;
  policyJson: string;
  issuerSignature?: string;
  imageUrl?: string;
};

const buildEventRecord = (config: Omit<EventRecord, 'policyJson' | 'issuerSignature'> & { issuerSignatureSeed?: string }) => {
  const policyJson = canonicalizePolicy(config.policy);
  const issuerSignature = derivePolicySignature(config.eventId, config.issuerSignatureSeed ?? 'template', policyJson);

  return {
    ...config,
    policyJson,
    issuerSignature,
  } satisfies EventRecord;
};

const demoPolicyA: TicketPolicy = {
  resaleAllowed: true,
  royaltyBps: 750,
  royaltyRecipients: [
    { id: 'organizer', lockingScriptHex: '76a914c1a5cafe88ac', bps: 6000 },
    { id: 'artist', lockingScriptHex: '76a914f00dbabe88ac', bps: 4000 },
  ],
  primaryRecipients: [
    { id: 'organizer', lockingScriptHex: '76a914c1a5cafe88ac', bps: 5000 },
    { id: 'venue', lockingScriptHex: '76a914deadbeef88ac', bps: 3000 },
    { id: 'protocol', lockingScriptHex: '76a914feedface88ac', bps: 2000 },
  ],
  version: '1',
  issuerId: 'btc_conf_issuer',
};

const demoPolicyB: TicketPolicy = {
  resaleAllowed: false,
  royaltyBps: 0,
  royaltyRecipients: [
    { id: 'issuer', lockingScriptHex: '76a914facefeed88ac', bps: 10000 },
  ],
  primaryRecipients: [
    { id: 'workshop', lockingScriptHex: '76a914f00dbabe88ac', bps: 7000 },
    { id: 'venue', lockingScriptHex: '76a914deadbeef88ac', bps: 3000 },
  ],
  version: '1',
  issuerId: 'ln_workshop_org',
};

export const defaultEvents: EventRecord[] = [
  buildEventRecord({
    eventId: 'evt_1234567890abcdef',
    name: 'Bitcoin Conference 2025',
    venue: 'Convention Center',
    startsAtISO: '2025-03-15T09:00:00Z',
    endsAtISO: '2025-03-15T18:00:00Z',
    capacity: 500,
    priceSats: 50000,
    protocolAddr: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    venueSink: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    salesOpen: true,
    sold: 342,
    redeemed: 89,
    revenueSats: 17100000,
    policy: demoPolicyA,
    issuerSignatureSeed: 'template',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  }),
  buildEventRecord({
    eventId: 'evt_0987654321fedcba',
    name: 'Lightning Workshop',
    venue: 'Tech Hub',
    startsAtISO: '2025-02-10T14:00:00Z',
    endsAtISO: '2025-02-10T17:00:00Z',
    capacity: 100,
    priceSats: 25000,
    protocolAddr: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    venueSink: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    salesOpen: false,
    sold: 100,
    redeemed: 100,
    revenueSats: 2500000,
    policy: demoPolicyB,
    issuerSignatureSeed: 'template',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  }),
];

export const getEventById = (events: EventRecord[], eventId: string) => {
  return events.find((event) => event.eventId === eventId);
};
