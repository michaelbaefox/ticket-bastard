import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AntiBot from './AntiBot';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (recipientAddress: string) => void;
  ticketId: string;
  eventName: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketId,
  eventName
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAntiBot, setShowAntiBot] = useState(false);
  
  const networkFee = 300;

  const handleConfirm = async () => {
    if (!recipientAddress.trim()) return;
    
    // Check if anti-bot verification is needed
    const needsVerification = Math.random() < 0.4; // 40% chance for demo
    
    if (needsVerification && !showAntiBot) {
      setShowAntiBot(true);
      return;
    }
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onConfirm(recipientAddress);
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
      <DialogContent className="bg-black border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-center">TRANSFER TICKET</DialogTitle>
        </DialogHeader>
        
        {showAntiBot ? (
          <AntiBot
            onVerify={handleAntiBotComplete}
            actionType="transfer"
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-white mb-1">{eventName}</h3>
              <p className="text-sm text-white/70 font-mono">ID: {ticketId}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm text-white/70">
                Recipient Address
              </Label>
              <Input
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="bc1q... or tb1q..."
                className="font-mono text-sm bg-transparent border-white/25 text-white"
              />
            </div>
            
            <Separator className="bg-white/20" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Transfer Fee</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <span>{networkFee.toLocaleString()} sats</span>
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between font-bold">
                <span>Total Cost</span>
                <span>{networkFee.toLocaleString()} sats</span>
              </div>
            </div>
            
            <div className="text-xs text-white/60 font-mono">
              ⚠ Transfer is irreversible<br/>
              ✓ Recipient gets full ticket rights
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
              disabled={isProcessing || !recipientAddress.trim()}
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