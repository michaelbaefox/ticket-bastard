import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AntiBot from './AntiBot';
import { X } from 'lucide-react';
import { TicketPolicy, TicketOnChain, StoredTicket, TicketTransactionOutput } from '@/types/ticketing';
import { buildPrimarySaleOutputs, canonicalizePolicy, derivePolicySignature } from '@/lib/ticketing';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ticketData: StoredTicket) => void;
  eventName: string;
  priceInSats: number;
  seatLabel: string;
  policy: TicketPolicy;
  ticketTemplate: TicketOnChain;
  issuerSignature?: string;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventName,
  priceInSats,
  seatLabel,
  policy,
  ticketTemplate,
  issuerSignature
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAntiBot, setShowAntiBot] = useState(false);

  const serviceFee = Math.floor(priceInSats * 0.03);
  const networkFee = 500;
  const totalCost = priceInSats + serviceFee + networkFee;

  const primaryOutputs = useMemo<TicketTransactionOutput[]>(() => {
    return buildPrimarySaleOutputs(priceInSats, policy);
  }, [priceInSats, policy]);

  const policyJson = useMemo(() => canonicalizePolicy(policy), [policy]);

  const ticketLockingScriptHex = useMemo(() => {
    const randomHex = Math.random().toString(16).slice(2, 42).padEnd(40, '0').slice(0, 40);
    return `76a914${randomHex}88ac`;
  }, [isOpen]);

  const handleConfirm = async () => {
    // Simulate anti-bot check (could be based on user behavior, time since last action, etc.)
    const needsVerification = Math.random() < 0.3; // 30% chance for demo

    if (needsVerification && !showAntiBot) {
      setShowAntiBot(true);
      return;
    }

    setIsProcessing(true);
    
    // Simulate purchase processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const txid = `tx_${Date.now()}`;
    const mintedTicketId = `${ticketTemplate.ticketId}_${Math.random().toString(36).slice(2, 8)}`;
    const ticketOutpoint = `${txid}:0`;
    const expectedSignature = derivePolicySignature(ticketTemplate.eventId, mintedTicketId, policyJson);
    const providedSignature = issuerSignature ?? ticketTemplate.issuerSignature;
    const signature = providedSignature && providedSignature === expectedSignature
      ? providedSignature
      : expectedSignature;

    const ticketOutput: TicketTransactionOutput = {
      lockingScript: ticketLockingScriptHex,
      satoshis: 1,
      outputDescription: 'Ticket output'
    };

    const txOutputs: TicketTransactionOutput[] = [ticketOutput, ...primaryOutputs];
    const timestamp = new Date().toISOString();

    const ticketRecord: StoredTicket = {
      id: mintedTicketId,
      eventId: ticketTemplate.eventId,
      eventName,
      seat: seatLabel,
      validFrom: ticketTemplate.validFromISO,
      validTo: ticketTemplate.validToISO,
      outpoint: ticketOutpoint,
      status: 'VALID',
      priceInSats: priceInSats,
      pushDropFields: [
        ticketTemplate.protocolAddr,
        ticketTemplate.eventId,
        mintedTicketId,
        ticketTemplate.seatCiphertext,
        ticketTemplate.validFromISO,
        ticketTemplate.validToISO,
        policyJson,
        signature
      ],
      policy,
      policyJson,
      issuerSignature: signature,
      provenance: [
        {
          txid,
          salePriceSats: priceInSats,
          outputs: txOutputs,
          type: 'primary',
          timestampISO: timestamp
        }
      ],
      lastTransferTx: {
        txid,
        salePriceSats: priceInSats,
        outputs: txOutputs,
        type: 'primary',
        timestampISO: timestamp
      }
    };

    onConfirm(ticketRecord);

    setIsProcessing(false);
    setShowAntiBot(false);
    onClose();
  };

  const handleAntiBotComplete = () => {
    setShowAntiBot(false);
    handleConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neo-contrast-inverse border-neo-border/20 text-neo-contrast max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-center">PURCHASE TICKET</DialogTitle>
        </DialogHeader>
        
        {showAntiBot ? (
          <AntiBot
            onVerify={handleAntiBotComplete}
            actionType="purchase"
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-neo-contrast mb-2">{eventName}</h3>
              <p className="text-sm text-neo-contrast/70">{seatLabel}</p>
            </div>

            <Separator className="bg-neo-contrast/20" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ticket Price</span>
                <span>{priceInSats.toLocaleString()} sats</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service Fee (3%)</span>
                <span>{serviceFee.toLocaleString()} sats</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <span>{networkFee.toLocaleString()} sats</span>
              </div>
              <Separator className="bg-neo-contrast/20" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{totalCost.toLocaleString()} sats</span>
              </div>
            </div>
            
            <div className="text-xs text-neo-contrast/60 font-mono">
              ✓ No hidden fees<br/>
              ✓ Artist/venue receives share of resales<br/>
              ✓ Instant transfer to your wallet
            </div>

            <Separator className="bg-neo-contrast/20" />

            <div className="space-y-3 text-xs font-mono text-neo-contrast/70">
              <div className="uppercase tracking-wide text-neo-contrast/40">Ticket Policy</div>
              <div>Resale: {policy.resaleAllowed ? 'Allowed' : 'Disabled'}</div>
              <div>Royalty: {(policy.royaltyBps / 100).toFixed(2)}%</div>
              <div>Issuer: {policy.issuerId}</div>
              <div className="space-y-1">
                <div className="text-neo-contrast/50">Primary Split</div>
                {primaryOutputs.map((output, idx) => (
                  <div key={`${output.lockingScript}-${idx}`} className="flex justify-between">
                    <span>{policy.primaryRecipients[idx]?.id ?? `Recipient ${idx + 1}`}</span>
                    <span>{output.satoshis.toLocaleString()} sats</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="neo-outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            CANCEL
          </Button>
          {!showAntiBot && (
            <Button
              variant="neo"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'PROCESSING...' : 'CONFIRM PURCHASE'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};