import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TicketPolicy, ResaleBuildResult } from '@/types/ticketing';
import { buildResaleOutputs } from '@/lib/ticketing';

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: ResaleBuildResult) => void;
  ticketId: string;
  eventName: string;
  originalPrice: number;
  policy: TicketPolicy;
  sellerLockingScriptHex: string;
}

export const ListForSaleModal: React.FC<ListForSaleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketId,
  eventName,
  originalPrice,
  policy,
  sellerLockingScriptHex
}) => {
  const [priceInSats, setPriceInSats] = useState(originalPrice.toString());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPriceInSats(originalPrice.toString());
    }
  }, [isOpen, originalPrice]);

  const salePrice = Number(priceInSats) || 0;
  const buyerLockingScriptHex = useMemo(() => {
    const randomHex = Math.random().toString(16).slice(2, 42).padEnd(40, '0').slice(0, 40);
    return `76a914${randomHex}88ac`;
  }, [isOpen]);

  const buildResult = useMemo(() => {
    if (!salePrice) return null;
    return buildResaleOutputs({
      salePriceSats: salePrice,
      sellerPayLockingScriptHex: sellerLockingScriptHex,
      buyerTicketLockingScriptHex: buyerLockingScriptHex,
      policy
    });
  }, [salePrice, policy, sellerLockingScriptHex, buyerLockingScriptHex]);

  const listingFee = Math.floor(salePrice * 0.025 || 0);
  const networkFee = 400;
  const royaltyDue = buildResult?.royaltyTotal ?? 0;

  const handleConfirm = async () => {
    if (!buildResult) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onConfirm(buildResult);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neo-contrast-inverse border-neo-border/20 text-neo-contrast max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-center">LIST FOR SALE</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <h3 className="font-bold text-neo-contrast mb-1">{eventName}</h3>
            <p className="text-sm text-neo-contrast/70 font-mono">ID: {ticketId}</p>
            <p className="text-sm text-neo-contrast/60">Original: {originalPrice.toLocaleString()} sats</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm text-neo-contrast/70">
              Sale Price (sats)
            </Label>
            <Input
              id="price"
              type="number"
              value={priceInSats}
              onChange={(e) => setPriceInSats(e.target.value)}
              className="font-mono text-sm bg-transparent border-neo-border/25 text-neo-contrast"
              min="1"
            />
          </div>

          <Separator className="bg-neo-contrast/20" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Royalty ({(policy.royaltyBps / 100).toFixed(2)}%)</span>
              <span>{royaltyDue.toLocaleString()} sats</span>
            </div>
            <div className="flex justify-between">
              <span>Listing Fee (2.5%)</span>
              <span>{listingFee.toLocaleString()} sats</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span>{networkFee.toLocaleString()} sats</span>
            </div>
            <Separator className="bg-neo-contrast/20" />
            <div className="flex justify-between font-bold">
              <span>You Receive</span>
              <span>{Math.max(salePrice - royaltyDue - listingFee - networkFee, 0).toLocaleString()} sats</span>
            </div>
          </div>

          {buildResult && (
            <div className="text-xs text-neo-contrast/60 font-mono space-y-2">
              <div className="uppercase tracking-wide text-neo-contrast/40">Royalty Split</div>
              {buildResult.royaltyOutputs.length ? buildResult.royaltyOutputs.map((output, idx) => (
                <div key={`${output.lockingScript}-${idx}`} className="flex justify-between">
                  <span>{policy.royaltyRecipients[idx]?.id ?? `Recipient ${idx + 1}`}</span>
                  <span>{output.satoshis.toLocaleString()} sats</span>
                </div>
              )) : <div>No royalty due</div>}
            </div>
          )}

          <div className="text-xs text-neo-contrast/60 font-mono">
            ✓ Policy-enforced royalties<br/>
            ✓ Split payouts included in transaction<br/>
            ✓ Instant payout on sale
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="neo-outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            CANCEL
          </Button>
          <Button
            variant="neo"
            onClick={handleConfirm}
            disabled={isProcessing || !buildResult}
            className="flex-1"
          >
            {isProcessing ? 'LISTING...' : 'LIST FOR SALE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};