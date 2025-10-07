export type RecipientShare = {
  lockingScriptHex: string;
  bps: number;
  id?: string;
};

export type TicketPolicy = {
  resaleAllowed: boolean;
  royaltyBps: number;
  royaltyRecipients: RecipientShare[];
  primaryRecipients: RecipientShare[];
  version: string;
  issuerId: string;
};

export type TicketOnChain = {
  protocolAddr: string;
  eventId: string;
  ticketId: string;
  seatCiphertext: number[];
  validFromISO: string;
  validToISO: string;
  policyJson: string;
  issuerSignature?: string;
};

export type TicketTransactionOutput = {
  lockingScript: string;
  satoshis: number;
  outputDescription: string;
};

export type TicketTransaction = {
  txid: string;
  salePriceSats: number;
  outputs: TicketTransactionOutput[];
  type: 'primary' | 'resale' | 'transfer';
  timestampISO: string;
};

export type StoredTicket = {
  id: string;
  eventId: string;
  eventName: string;
  seat: string;
  validFrom: string;
  validTo: string;
  outpoint: string;
  status: 'VALID' | 'EXPIRED' | 'REDEEMED' | 'NOT_YET_VALID';
  priceInSats?: number;
  pushDropFields: (string | number[])[];
  policy: TicketPolicy;
  policyJson: string;
  issuerSignature?: string;
  provenance: TicketTransaction[];
  lastTransferTx: TicketTransaction;
};

export type ResaleBuildParams = {
  salePriceSats: number;
  sellerPayLockingScriptHex: string;
  buyerTicketLockingScriptHex: string;
  policy: TicketPolicy;
};

export type ResaleBuildResult = {
  royaltyOutputs: TicketTransactionOutput[];
  sellerOutput: TicketTransactionOutput;
  ticketOutput: TicketTransactionOutput;
  royaltyTotal: number;
  tx: TicketTransaction;
};

export type TicketLedgerEntry = {
  ticketId: string;
  eventId?: string;
  outpoint: string;
  tx: TicketTransaction;
  policy: TicketPolicy;
  policyJson: string;
  issuerSignature?: string;
};
