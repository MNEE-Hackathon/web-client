'use client';

/**
 * Root Providers
 * Combines all providers into a single component
 */

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { Web3Provider } from './web3-provider';
import { CartProvider } from '@/lib/hooks/use-cart';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <Web3Provider>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export { ThemeProvider } from './theme-provider';
export { Web3Provider } from './web3-provider';

