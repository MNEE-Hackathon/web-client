'use client';

/**
 * Cart Context and Hook
 * Manages shopping cart state with localStorage persistence
 * 
 * Cart is tied to wallet address:
 * - Each wallet has its own cart
 * - Disconnecting wallet shows empty cart
 * - Switching wallets switches to that wallet's cart
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAccount } from 'wagmi';

// Storage key prefix - actual key includes wallet address
const CART_STORAGE_PREFIX = 'meneemart_cart_';

/**
 * Get storage key for a specific wallet address
 */
function getCartStorageKey(address: string): string {
  return `${CART_STORAGE_PREFIX}${address.toLowerCase()}`;
}

/**
 * Cart item structure
 */
export interface CartItem {
  productId: number;
  productName: string;
  price: bigint;
  seller: string;
  coverCid?: string;
  addedAt: number;
}

/**
 * Cart context value
 */
interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalPrice: bigint;
  addItem: (item: Omit<CartItem, 'addedAt'>) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  isLoading: boolean;
  isConnected: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Serialize cart for localStorage (bigint -> string)
 */
function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items.map(item => ({
    ...item,
    price: item.price.toString(),
  })));
}

/**
 * Deserialize cart from localStorage (string -> bigint)
 */
function deserializeCart(data: string): CartItem[] {
  try {
    const parsed = JSON.parse(data);
    return parsed.map((item: Record<string, unknown>) => ({
      ...item,
      price: BigInt(item.price as string),
    }));
  } catch {
    return [];
  }
}

/**
 * Cart Provider Component
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage when address changes
  useEffect(() => {
    setIsLoading(true);
    
    if (!address) {
      // No wallet connected - show empty cart
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const key = getCartStorageKey(address);
      const stored = localStorage.getItem(key);
      if (stored) {
        setItems(deserializeCart(stored));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('[useCart] Failed to load cart from localStorage:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (!isLoading && address) {
      try {
        const key = getCartStorageKey(address);
        localStorage.setItem(key, serializeCart(items));
      } catch (err) {
        console.warn('[useCart] Failed to save cart to localStorage:', err);
      }
    }
  }, [items, isLoading, address]);

  // Add item to cart
  const addItem = useCallback((item: Omit<CartItem, 'addedAt'>) => {
    if (!address) return; // Can't add to cart without wallet
    
    setItems(prev => {
      // Check if already in cart
      if (prev.some(i => i.productId === item.productId)) {
        return prev;
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, [address]);

  // Remove item from cart
  const removeItem = useCallback((productId: number) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  // Clear all items from cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Check if item is in cart
  const isInCart = useCallback((productId: number) => {
    return items.some(i => i.productId === productId);
  }, [items]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0n);
  }, [items]);

  const value: CartContextValue = {
    items,
    itemCount: items.length,
    totalPrice,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    isLoading,
    isConnected,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook to access cart context
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
