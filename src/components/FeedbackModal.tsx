import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Star, X, MessageCircle } from 'lucide-react';

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventId: string;
};

const FeedbackModal = ({ isOpen, onClose, eventName, eventId }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<'venue' | 'event' | 'service'>('event');
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !feedback.trim()) {
      toast({ 
        description: "Please provide a rating and feedback", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Store feedback in localStorage
    const feedbacks = JSON.parse(localStorage.getItem('eventFeedbacks') || '[]');
    const newFeedback = {
      eventId,
      eventName,
      rating,
      category,
      feedback,
      email,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    feedbacks.push(newFeedback);
    localStorage.setItem('eventFeedbacks', JSON.stringify(feedbacks));

    toast({ 
      description: "Feedback submitted successfully • Thank you!" 
    });

    // Reset form
    setRating(0);
    setFeedback('');
    setEmail('');
    setCategory('event');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm">EVENT FEEDBACK</DialogTitle>
          <div className="text-xs text-white/60 font-mono mt-1">{eventName}</div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-mono mb-2">Overall Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-colors"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= (hoverRating || rating) 
                        ? 'fill-yellow-500 text-yellow-500' 
                        : 'text-white/30'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-mono mb-2">Feedback Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-black border border-white/20 rounded-md font-mono text-sm"
            >
              <option value="event">Event Experience</option>
              <option value="venue">Venue Quality</option>
              <option value="service">Ticketing Service</option>
            </select>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-mono mb-2">Your Feedback *</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              className="min-h-[100px] font-mono text-sm"
              maxLength={500}
            />
            <div className="text-xs text-white/60 mt-1 font-mono">
              {feedback.length}/500 characters
            </div>
          </div>

          {/* Optional Email */}
          <div>
            <label className="block text-sm font-mono mb-2">
              Email (optional)
              <span className="text-xs text-white/60 ml-2">for follow-up</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="font-mono"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="neo"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 font-mono uppercase"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? '[ SUBMITTING... ]' : '[ SUBMIT FEEDBACK ]'}
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

export default FeedbackModal;