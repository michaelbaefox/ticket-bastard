import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AntiBot from './AntiBot';
import { CreditCard, X, Zap } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ticketData: any) => void;
  eventName: string;
  priceInSats: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventName,
  priceInSats
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAntiBot, setShowAntiBot] = useState(false);
  
  const serviceFee = Math.floor(priceInSats * 0.03);
  const networkFee = 500;
  const totalCost = priceInSats + serviceFee + networkFee;

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
    
    const ticketId = `tb1q${Math.random().toString(36).substring(2, 15)}`;
    
    onConfirm({
      id: ticketId,
      eventName,
      purchasedAt: new Date().toISOString(),
      priceInSats: totalCost,
      status: 'VALID',
      seat: `Section ${Math.floor(Math.random() * 3) + 1}, Row ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      validFrom: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      validTo: new Date(Date.now() + 86400000 + 14400000).toISOString(), // +4 hours
      outpoint: ticketId + ':0'
    });
    
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
              <p className="text-sm text-neo-contrast/70">General Admission</p>
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