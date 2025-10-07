import { RecipientShare, ResaleBuildParams, ResaleBuildResult, TicketPolicy, TicketTransaction, TicketTransactionOutput } from '@/types/ticketing'

function canonicalizeRecipient(recipient: RecipientShare) {
  const ordered: Record<string, string | number> = {
    lockingScriptHex: recipient.lockingScriptHex,
    bps: recipient.bps,
  }
  if (recipient.id) {
    ordered.id = recipient.id
  }
  return ordered
}

export function canonicalizePolicy(policy: TicketPolicy) {
  const orderedPolicy: Record<string, unknown> = {
    version: policy.version,
    issuerId: policy.issuerId,
    resaleAllowed: policy.resaleAllowed,
    royaltyBps: policy.royaltyBps,
    royaltyRecipients: policy.royaltyRecipients.map(canonicalizeRecipient),
    primaryRecipients: policy.primaryRecipients.map(canonicalizeRecipient),
  }
  return JSON.stringify(orderedPolicy)
}

export function derivePolicySignature(eventId: string, ticketId: string, policyJson: string) {
  const input = `${eventId}|${ticketId}|${policyJson}`
  let hash = 0

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }

  return `SIG_${hash.toString(16).padStart(8, '0')}`
}

export function verifyPolicySignature(eventId: string, ticketId: string, policyJson: string, signature?: string) {
  if (!signature) {
    return true
  }

  return derivePolicySignature(eventId, ticketId, policyJson) === signature
}

export function buildSplitOutputs(totalSats: number, recipients: RecipientShare[]): TicketTransactionOutput[] {
  const outs: TicketTransactionOutput[] = []
  let remaining = totalSats

  recipients.forEach((recipient, index) => {
    const share = index === recipients.length - 1
      ? remaining
      : Math.floor((totalSats * recipient.bps) / 10000)

    outs.push({
      lockingScript: recipient.lockingScriptHex,
      satoshis: share,
      outputDescription: `Split ${recipient.id ?? index}`,
    })
    remaining -= share
  })

  return outs
}

export function buildPrimarySaleOutputs(totalSats: number, policy: TicketPolicy) {
  return buildSplitOutputs(totalSats, policy.primaryRecipients)
}

export function buildResaleOutputs(params: ResaleBuildParams): ResaleBuildResult {
  const { salePriceSats, sellerPayLockingScriptHex, buyerTicketLockingScriptHex, policy } = params
  const royalty = Math.floor((salePriceSats * policy.royaltyBps) / 10000)
  const royaltyOutputs = royalty > 0 ? buildSplitOutputs(royalty, policy.royaltyRecipients) : []
  const ticketOutput: TicketTransactionOutput = {
    lockingScript: params.buyerTicketLockingScriptHex,
    satoshis: 1,
    outputDescription: 'Ticket output',
  }
  const sellerOutput: TicketTransactionOutput = {
    lockingScript: sellerPayLockingScriptHex,
    satoshis: Math.max(salePriceSats - royalty, 0),
    outputDescription: 'Seller payout',
  }

  const tx: TicketTransaction = {
    txid: `tx_${Date.now()}`,
    salePriceSats,
    outputs: [ticketOutput, ...royaltyOutputs, sellerOutput],
    type: royaltyOutputs.length > 0 ? 'resale' : 'transfer',
    timestampISO: new Date().toISOString(),
  }

  return {
    royaltyOutputs,
    sellerOutput,
    ticketOutput,
    royaltyTotal: royalty,
    tx,
  }
}

export function verifyRoyaltyCompliance(tx: TicketTransaction, policy: TicketPolicy) {
  if (tx.type !== 'resale' || policy.royaltyBps === 0) {
    return { compliant: true }
  }

  const royaltyDue = Math.floor((tx.salePriceSats * policy.royaltyBps) / 10000)
  const expectedSplits = buildSplitOutputs(royaltyDue, policy.royaltyRecipients)
  let totalPaid = 0

  const missingRecipients: string[] = []

  expectedSplits.forEach((expected) => {
    const match = tx.outputs.find((output) => output.lockingScript === expected.lockingScript)
    if (!match || match.satoshis < expected.satoshis) {
      missingRecipients.push(expected.lockingScript)
    } else {
      totalPaid += match.satoshis
    }
  })

  return {
    compliant: missingRecipients.length === 0 && totalPaid >= royaltyDue,
    missingRecipients,
    royaltyDue,
    totalPaid,
  }
}
