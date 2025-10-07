import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

type RefundModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  eventName: string;
  priceSats: number;
};

const RefundModal = ({ isOpen, onClose, ticketId, eventName, priceSats }: RefundModalProps) => {
  const [reason, setReason] = useState<'event_cancelled' | 'venue_issue' | 'personal' | 'technical' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ 
        description: "Please describe your refund request", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Store refund request in localStorage
    const requests = JSON.parse(localStorage.getItem('refundRequests') || '[]');
    const newRequest = {
      ticketId,
      eventName,
      priceSats,
      reason,
      description,
      timestamp: new Date().toISOString(),
      status: 'pending',
      id: Date.now().toString()
    };
    
    requests.push(newRequest);
    localStorage.setItem('refundRequests', JSON.stringify(requests));

    toast({ 
      description: "Refund request submitted • We'll process within 24h" 
    });

    // Reset form
    setReason('other');
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  const reasonLabels = {
    event_cancelled: 'Event Cancelled',
    venue_issue: 'Venue Problems',
    personal: 'Personal Emergency',
    technical: 'Technical Issues',
    other: 'Other Reason'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neo-contrast-inverse border-neo-border/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            REFUND REQUEST
          </DialogTitle>
          <div className="text-xs text-neo-contrast/60 font-mono mt-1">{eventName}</div>
          <div className="text-xs text-neo-contrast/60 font-mono">Ticket: {ticketId.slice(0, 12)}...</div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refund Amount */}
          <div className="p-3 border border-neo-border/20 rounded-md bg-neo-contrast/5">
            <div className="text-sm font-mono text-neo-contrast/60">REFUND AMOUNT</div>
            <div className="text-lg font-bold font-mono">{priceSats.toLocaleString()} sats</div>
            <div className="text-xs text-neo-contrast/60">Processing fee may apply</div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-mono mb-2">Refund Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full px-3 py-2 bg-neo-contrast-inverse border border-neo-border/20 rounded-md font-mono text-sm"
            >
              {Object.entries(reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-mono mb-2">Description *</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain your refund request..."
              className="min-h-[100px] font-mono text-sm"
              maxLength={300}
            />
            <div className="text-xs text-neo-contrast/60 mt-1 font-mono">
              {description.length}/300 characters
            </div>
          </div>

          {/* Policy Notice */}
          <div className="p-3 border border-neo-border/20 rounded-md bg-yellow-500/10">
            <div className="text-xs font-mono text-yellow-500">REFUND POLICY</div>
            <div className="text-xs text-neo-contrast/80 mt-1">
              • Requests processed within 24 hours
              • Refunds sent to original payment method
              • 5% processing fee may apply
              • No refunds 2 hours before event start
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="neo"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 font-mono uppercase"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? '[ PROCESSING... ]' : '[ SUBMIT REQUEST ]'}
            </Button>
            <Button
              variant="neo-outline"
              onClick={onClose}
              className="font-mono uppercase"
              disabled={isSubmitting}
            >
              [ CANCEL ]
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundModal;