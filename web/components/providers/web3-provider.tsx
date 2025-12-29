'use client';

/**
 * Web3 Provider
 * Wraps the app with wagmi, RainbowKit, and React Query providers
 */

import { ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { wagmiConfig } from '@/lib/wagmi';

import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const { resolvedTheme } = useTheme();
  
  // Create a stable QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time for caching
            staleTime: 1000 * 60, // 1 minute
            // Retry failed requests
            retry: 2,
            // Refetch on window focus
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Custom RainbowKit theme
  const customDarkTheme = darkTheme({
    accentColor: '#6366f1', // MNEE primary color
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
  });

  const customLightTheme = lightTheme({
    accentColor: '#6366f1',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={resolvedTheme === 'dark' ? customDarkTheme : customLightTheme}
          modalSize="compact"
          appInfo={{
            appName: 'MeneeMart',
            learnMoreUrl: 'https://meneemart.xyz/about',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

