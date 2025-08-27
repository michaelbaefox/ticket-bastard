import { useEffect, useRef } from 'react';

/**
 * Accessibility utilities and hooks for better UX
 */

/**
 * Hook for managing focus when modals open/close
 */
export const useFocusManagement = (isOpen: boolean, returnFocusRef?: React.RefObject<HTMLElement>) => {
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      lastFocusedElementRef.current = document.activeElement as HTMLElement;
    } else {
      // Return focus to the previously focused element or the specified element
      const elementToFocus = returnFocusRef?.current || lastFocusedElementRef.current;
      if (elementToFocus && elementToFocus.focus) {
        elementToFocus.focus();
      }
    }
  }, [isOpen, returnFocusRef]);
};

/**
 * Hook for trapping focus within a modal/dialog
 */
export const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus the first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive, containerRef]);
};

/**
 * Hook for keyboard navigation (Arrow keys, Enter, Escape)
 */
export const useKeyboardNavigation = (
  items: any[],
  onSelect?: (item: any, index: number) => void,
  onEscape?: () => void
) => {
  const activeIndexRef = useRef(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndexRef.current = (activeIndexRef.current + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndexRef.current = activeIndexRef.current === 0 ? items.length - 1 : activeIndexRef.current - 1;
        break;
      case 'Enter':
        if (onSelect && items[activeIndexRef.current]) {
          e.preventDefault();
          onSelect(items[activeIndexRef.current], activeIndexRef.current);
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
    }
  };

  return { handleKeyDown, activeIndex: activeIndexRef.current };
};

/**
 * Hook for announcing screen reader messages
 */
export const useScreenReader = () => {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create aria-live region if it doesn't exist
    if (!announceRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    return () => {
      if (announceRef.current && document.body.contains(announceRef.current)) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Clear the message after a short delay
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { announce };
};

/**
 * Utility functions for accessibility
 */
export const a11yUtils = {
  /**
   * Generate unique IDs for form controls and labels
   */
  generateId: (prefix = 'a11y') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Create accessible labels for interactive elements
   */
  createAriaLabel: (action: string, target: string, context?: string) => {
    const parts = [action, target];
    if (context) parts.push(context);
    return parts.join(' ');
  },

  /**
   * Format currency values for screen readers
   */
  formatCurrencyForScreenReader: (amount: number, currency = 'satoshis') => {
    return `${amount.toLocaleString()} ${currency}`;
  },

  /**
   * Format dates for screen readers
   */
  formatDateForScreenReader: (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  /**
   * Create descriptive text for ticket status
   */
  getTicketStatusDescription: (status: string) => {
    const descriptions = {
      'VALID': 'Valid ticket, ready for use',
      'REDEEMED': 'Ticket has been used and redeemed',
      'EXPIRED': 'This ticket has expired',
      'CANCELLED': 'This ticket has been cancelled'
    };
    return descriptions[status as keyof typeof descriptions] || status;
  }
};