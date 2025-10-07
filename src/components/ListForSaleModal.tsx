import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (priceInSats: number) => void;
  ticketId: string;
  eventName: string;
  originalPrice: number;
}

export const ListForSaleModal: React.FC<ListForSaleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketId,
  eventName,
  originalPrice
}) => {
  const [priceInSats, setPriceInSats] = useState(originalPrice.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const listingFee = Math.floor(parseFloat(priceInSats) * 0.025 || 0);
  const networkFee = 400;
  const artistVenueShare = Math.floor(parseFloat(priceInSats) * 0.10 || 0);
  
  const handleConfirm = async () => {
    const price = parseFloat(priceInSats);
    if (!price || price <= 0) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onConfirm(price);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neo-contrast-inverse border-neo-border/20 text-neo-contrast max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-center">LIST FOR SALE</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Listing Fee (2.5%)</span>
              <span>{listingFee.toLocaleString()} sats</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Network Fee</span>
              <span>{networkFee.toLocaleString()} sats</span>
            </div>
            <div className="flex justify-between text-sm text-neo-contrast/60">
              <span>Artist/Venue Share (10%)</span>
              <span>{artistVenueShare.toLocaleString()} sats</span>
            </div>
            <Separator className="bg-neo-contrast/20" />
            <div className="flex justify-between font-bold">
              <span>You Receive</span>
              <span>{(parseFloat(priceInSats) - listingFee - networkFee || 0).toLocaleString()} sats</span>
            </div>
          </div>
          
          <div className="text-xs text-neo-contrast/60 font-mono">
            ✓ Fair resale market - no scalping<br/>
            ✓ Artist/venue gets share automatically<br/>
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
            disabled={isProcessing || !parseFloat(priceInSats)}
            className="flex-1"
          >
            {isProcessing ? 'LISTING...' : 'LIST FOR SALE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};