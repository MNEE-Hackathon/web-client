'use client';

/**
 * useStore Hook
 * Manages seller store data (name, etc.)
 * 
 * MVP: Uses localStorage for persistence
 * Future: Could use IPFS for cross-device sync
 */

import { useState, useEffect, useCallback } from 'react';
import type { Address } from 'viem';

// Storage key prefix
const STORE_NAME_PREFIX = 'meneemart_store_name_';

/**
 * Store data structure
 */
export interface StoreData {
  name: string;
  updatedAt: string;
}

/**
 * Get store name from localStorage
 */
export function getStoreName(address: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const key = STORE_NAME_PREFIX + address.toLowerCase();
  const data = localStorage.getItem(key);
  
  if (!data) return null;
  
  try {
    const parsed: StoreData = JSON.parse(data);
    return parsed.name;
  } catch {
    return data; // Legacy format (just the name)
  }
}

/**
 * Save store name to localStorage
 */
export function saveStoreName(address: string, name: string): void {
  if (typeof window === 'undefined') return;
  
  const key = STORE_NAME_PREFIX + address.toLowerCase();
  const data: StoreData = {
    name,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Hook to manage store data for a seller
 */
export function useStore(address: string | undefined) {
  const [storeName, setStoreNameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load store name from localStorage
  useEffect(() => {
    if (!address) {
      setStoreNameState(null);
      setIsLoading(false);
      return;
    }

    const name = getStoreName(address);
    setStoreNameState(name);
    setIsLoading(false);
  }, [address]);

  // Save store name
  const setStoreName = useCallback((name: string) => {
    if (!address) return;
    
    saveStoreName(address, name);
    setStoreNameState(name);
  }, [address]);

  // Clear store name
  const clearStoreName = useCallback(() => {
    if (!address) return;
    
    const key = STORE_NAME_PREFIX + address.toLowerCase();
    localStorage.removeItem(key);
    setStoreNameState(null);
  }, [address]);

  return {
    storeName,
    setStoreName,
    clearStoreName,
    isLoading,
    hasStoreName: !!storeName,
  };
}

/**
 * Generate shareable store URL
 */
export function getStoreUrl(address: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/store/${address}`;
}

/**
 * Copy store URL to clipboard
 */
export async function copyStoreUrl(address: string): Promise<boolean> {
  try {
    const url = getStoreUrl(address);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Share store URL (Web Share API for mobile)
 */
export async function shareStoreUrl(
  address: string,
  storeName?: string
): Promise<boolean> {
  const url = getStoreUrl(address);
  const title = storeName || `Store by ${address.slice(0, 8)}...`;
  
  // Check if Web Share API is available (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${title} - MneeMart`,
        text: `Check out this creator store on MneeMart!`,
        url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[shareStoreUrl] Share failed:', err);
      }
    }
  }
  
  // Fallback to clipboard copy
  return copyStoreUrl(address);
}

// ===========================================
// Product Sharing
// ===========================================

/**
 * Generate shareable product URL
 */
export function getProductUrl(productId: number, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/products/${productId}`;
}

/**
 * Copy product URL to clipboard
 */
export async function copyProductUrl(productId: number): Promise<boolean> {
  try {
    const url = getProductUrl(productId);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Share product URL (Web Share API for mobile)
 */
export async function shareProductUrl(
  productId: number,
  productName?: string
): Promise<boolean> {
  const url = getProductUrl(productId);
  const title = productName || `Product #${productId}`;
  
  // Check if Web Share API is available (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${title} - MneeMart`,
        text: `Check out this product on MneeMart!`,
        url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[shareProductUrl] Share failed:', err);
      }
    }
  }
  
  // Fallback to clipboard copy
  return copyProductUrl(productId);
}

