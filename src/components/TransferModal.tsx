import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AntiBot from './AntiBot';
import { TicketPolicy, ResaleBuildResult } from '@/types/ticketing';
import { buildResaleOutputs } from '@/lib/ticketing';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: ResaleBuildResult, recipientAddress: string) => void;
  ticketId: string;
  eventName: string;
  policy: TicketPolicy;
  sellerLockingScriptHex: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketId,
  eventName,
  policy,
  sellerLockingScriptHex
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAntiBot, setShowAntiBot] = useState(false);

  const networkFee = 300;

  const buyerLockingScriptHex = useMemo(() => {
    if (!recipientAddress) return '';
    const normalized = recipientAddress.replace(/[^0-9a-f]/gi, '').padEnd(40, '0').slice(0, 40);
    return `76a914${normalized}88ac`;
  }, [recipientAddress]);

  const transferPreview = useMemo(() => {
    if (!buyerLockingScriptHex) return null;
    return buildResaleOutputs({
      salePriceSats: 0,
      policy,
      sellerPayLockingScriptHex: sellerLockingScriptHex,
      buyerTicketLockingScriptHex: buyerLockingScriptHex
    });
  }, [buyerLockingScriptHex, policy, sellerLockingScriptHex]);

  const handleConfirm = async () => {
    if (!recipientAddress.trim() || !transferPreview) return;

    const needsVerification = Math.random() < 0.4;

    if (needsVerification && !showAntiBot) {
      setShowAntiBot(true);
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onConfirm(transferPreview, recipientAddress);
    setIsProcessing(false);
    setRecipientAddress('');
    setShowAntiBot(false);
    onClose();
  };

  const handleAntiBotComplete = () => {
    setShowAntiBot(false);
    handleConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neo-contrast-inverse border-neo-border/20 text-neo-contrast max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-center">TRANSFER TICKET</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {showAntiBot ? (
            <AntiBot
              onVerify={handleAntiBotComplete}
              actionType="transfer"
            />
          ) : (
            <div className="space-y-4">
            <div>
              <h3 className="font-bold text-neo-contrast mb-1">{eventName}</h3>
              <p className="text-sm text-neo-contrast/70 font-mono">ID: {ticketId}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm text-neo-contrast/70">
                Recipient Address
              </Label>
              <Input
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="bc1q... or tb1q..."
                className="font-mono text-sm bg-transparent border-neo-border/25 text-neo-contrast"
              />
            </div>

            <Separator className="bg-neo-contrast/20" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Transfer Fee</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <span>{networkFee.toLocaleString()} sats</span>
              </div>
              {transferPreview && (
                <div className="text-xs text-neo-contrast/60 font-mono">
                  Ticket UTXO will move to buyer with new PushDrop policy.
                </div>
              )}
              <Separator className="bg-neo-contrast/20" />
              <div className="flex justify-between font-bold">
                <span>Total Cost</span>
                <span>{networkFee.toLocaleString()} sats</span>
              </div>
            </div>
            
              <div className="text-xs text-neo-contrast/60 font-mono">
                ⚠ Transfer is irreversible<br/>
                ✓ Recipient gets full ticket rights
              </div>
            </div>
          )}
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
          {!showAntiBot && (
            <Button
              variant="neo"
              onClick={handleConfirm}
              disabled={isProcessing || !recipientAddress.trim() || !transferPreview}
              className="flex-1"
            >
              {isProcessing ? 'TRANSFERRING...' : 'TRANSFER'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};