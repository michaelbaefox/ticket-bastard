import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Star, MessageCircle } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventId: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const feedbackSchema = z.object({
  rating: z.number().int().min(1, "Please provide a rating").max(5, "Rating must be between 1 and 5"),
  category: z.enum(['event', 'venue', 'service']),
  feedback: z
    .string()
    .trim()
    .min(10, "Feedback must be at least 10 characters")
    .max(500, "Feedback must be 500 characters or less"),
  email: z
    .string()
    .trim()
    .max(254, "Email must be 254 characters or less")
    .optional()
    .default('')
    .refine((val) => !val || emailRegex.test(val), { message: "Enter a valid email address" }),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const feedbackFormDefaults: FeedbackFormValues = {
  rating: 0,
  category: 'event',
  feedback: '',
  email: ''
};

const FeedbackModal = ({ isOpen, onClose, eventName, eventId }: FeedbackModalProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: feedbackFormDefaults
  });

  const feedbackValue = form.watch('feedback');
  const ratingValue = form.watch('rating');
  const { isSubmitting } = form.formState;

  const handleSubmit = form.handleSubmit(async (values) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const feedbacks = JSON.parse(localStorage.getItem('eventFeedbacks') || '[]');
    const trimmedFeedback = values.feedback.trim();
    const trimmedEmail = values.email?.trim() ?? '';
    const newFeedback = {
      eventId,
      eventName,
      rating: values.rating,
      category: values.category,
      feedback: trimmedFeedback,
      email: trimmedEmail,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    feedbacks.push(newFeedback);
    localStorage.setItem('eventFeedbacks', JSON.stringify(feedbacks));

    toast({
      description: "Feedback submitted successfully • Thank you!"
    });

    form.reset(feedbackFormDefaults);
    setHoverRating(0);
    onClose();
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset(feedbackFormDefaults);
          setHoverRating(0);
          onClose();
        }
      }}
    >
      <DialogContent className="bg-black border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm">EVENT FEEDBACK</DialogTitle>
          <div className="text-xs text-neo-contrast/60 font-mono mt-1">{eventName}</div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-sm">Overall Rating *</FormLabel>
                  <FormControl>
                    <div className="flex gap-1" role="radiogroup" aria-label="Overall rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-colors"
                          aria-label={`${star} star${star === 1 ? '' : 's'}`}
                          aria-pressed={ratingValue === star}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (hoverRating || ratingValue)
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-white/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-sm">Feedback Category</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full px-3 py-2 bg-black border border-white/20 rounded-md font-mono text-sm"
                    >
                      <option value="event">Event Experience</option>
                      <option value="venue">Venue Quality</option>
                      <option value="service">Ticketing Service</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-sm">Your Feedback *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your experience..."
                      className="min-h-[100px] font-mono text-sm"
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="text-xs text-white/60 mt-1 font-mono">
                    {(feedbackValue?.length ?? 0)}/500 characters
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-sm flex items-center gap-2">
                    Email (optional)
                    <span className="text-xs text-white/60 font-mono">for follow-up</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="your@email.com"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs text-white/60">
                    We’ll only use this if we need more detail.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button
                type="button"
                variant="neo-outline"
                onClick={() => {
                  form.reset(feedbackFormDefaults);
                  setHoverRating(0);
                  onClose();
                }}
                className="flex-1 font-mono uppercase"
                disabled={isSubmitting}
              >
                [ CANCEL ]
              </Button>
              <Button
                type="submit"
                variant="neo"
                className="flex-1 font-mono uppercase"
                disabled={isSubmitting}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? '[ SUBMITTING... ]' : '[ SUBMIT FEEDBACK ]'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;