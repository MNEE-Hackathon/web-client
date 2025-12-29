/**
 * Wagmi Configuration
 * Setup for wallet connection and chain configuration
 */

import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { CURRENT_CHAIN, RPC_URLS, APP_CONFIG } from '@/lib/constants';

/**
 * Supported chains configuration
 */
const chains = CURRENT_CHAIN === 'mainnet' 
  ? [mainnet] as const
  : [sepolia, mainnet] as const;

/**
 * Wagmi config with RainbowKit defaults
 */
export const wagmiConfig = getDefaultConfig({
  appName: APP_CONFIG.name,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains,
  transports: {
    [mainnet.id]: http(RPC_URLS.mainnet),
    [sepolia.id]: http(RPC_URLS.sepolia),
  },
  ssr: true, // Enable server-side rendering support
});

/**
 * Get the current chain object
 */
export function getCurrentChain() {
  return CURRENT_CHAIN === 'mainnet' ? mainnet : sepolia;
}

/**
 * Get chain ID for current environment
 */
export function getCurrentChainId() {
  return getCurrentChain().id;
}

