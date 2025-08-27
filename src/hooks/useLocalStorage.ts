import { useState, useEffect } from 'react';

/**
 * Comprehensive localStorage service for Ticket Bastard app
 * Provides type-safe persistence for all app data
 */

export interface EventData {
  id: string;
  name: string;
  date: string;
  venue: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  organizer?: string;
  capacity?: number;
  sold?: number;
}

export interface TicketData {
  id: string;
  eventName: string;
  purchasedAt: string;
  priceInSats: number;
  status: 'VALID' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  seat?: string;
  validFrom: string;
  validTo: string;
  outpoint: string;
  qrCode?: string;
}

export interface MarketplaceListing {
  id: string;
  eventName: string;
  originalPrice: number;
  salePrice: number;
  seller: string;
  listingDate: string;
  eventDate: string;
  venue: string;
  category: string;
}

export interface FeedbackData {
  id: string;
  eventId: string;
  eventName: string;
  rating: number;
  category: string;
  feedback: string;
  email: string;
  timestamp: string;
}

export interface RefundRequest {
  id: string;
  ticketId: string;
  eventName: string;
  priceSats: number;
  reason: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  language: string;
  currency: 'sats' | 'btc' | 'usd';
  emailUpdates: boolean;
}

export interface ScanHistory {
  id: string;
  ticketId: string;
  eventName: string;
  scanTime: string;
  venue: string;
  status: 'valid' | 'invalid' | 'already_used';
}

// Storage keys enum for consistency
export const STORAGE_KEYS = {
  EVENTS: 'ticketBastard_events',
  TICKETS: 'ticketBastardTickets', // Keep existing key for compatibility
  MARKETPLACE: 'ticketBastard_marketplace',
  FEEDBACKS: 'eventFeedbacks', // Keep existing key for compatibility
  REFUNDS: 'refundRequests', // Keep existing key for compatibility
  PREFERENCES: 'ticketBastard_preferences',
  SCAN_HISTORY: 'ticketBastard_scanHistory',
  ORGANIZER_EVENTS: 'ticketBastard_organizerEvents',
} as const;

/**
 * Generic localStorage hook with type safety
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

/**
 * Specific hooks for different data types
 */
export const useEvents = () => useLocalStorage<EventData[]>(STORAGE_KEYS.EVENTS, []);
export const useTickets = () => useLocalStorage<TicketData[]>(STORAGE_KEYS.TICKETS, []);
export const useMarketplace = () => useLocalStorage<MarketplaceListing[]>(STORAGE_KEYS.MARKETPLACE, []);
export const useFeedbacks = () => useLocalStorage<FeedbackData[]>(STORAGE_KEYS.FEEDBACKS, []);
export const useRefunds = () => useLocalStorage<RefundRequest[]>(STORAGE_KEYS.REFUNDS, []);
export const usePreferences = () => useLocalStorage<UserPreferences>(STORAGE_KEYS.PREFERENCES, {
  theme: 'dark',
  notifications: true,
  language: 'en',
  currency: 'sats',
  emailUpdates: false,
});
export const useScanHistory = () => useLocalStorage<ScanHistory[]>(STORAGE_KEYS.SCAN_HISTORY, []);
export const useOrganizerEvents = () => useLocalStorage<EventData[]>(STORAGE_KEYS.ORGANIZER_EVENTS, []);

/**
 * Clear all app data (useful for reset/logout)
 */
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error);
    }
  });
};

/**
 * Export data for backup/migration
 */
export const exportAllData = () => {
  const data: Record<string, any> = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        data[key] = JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Error exporting localStorage key "${key}":`, error);
    }
  });
  return data;
};

/**
 * Import data from backup
 */
export const importAllData = (data: Record<string, any>) => {
  Object.entries(data).forEach(([key, value]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error importing localStorage key "${key}":`, error);
    }
  });
};