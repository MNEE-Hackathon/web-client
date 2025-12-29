'use client';

/**
 * Root Providers
 * Combines all providers into a single component
 */

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { Web3Provider } from './web3-provider';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <Web3Provider>
        {children}
        <Toaster />
      </Web3Provider>
    </ThemeProvider>
  );
}

export { ThemeProvider } from './theme-provider';
export { Web3Provider } from './web3-provider';

