/**
 * Application Constants
 * Centralized configuration for the MneeMart frontend
 */

// ===========================================
// Chain Configuration
// ===========================================

export type SupportedChain = 'sepolia' | 'mainnet';

export const CURRENT_CHAIN: SupportedChain = 
  (process.env.NEXT_PUBLIC_CHAIN as SupportedChain) || 'sepolia';

export const CHAIN_IDS = {
  sepolia: 11155111,
  mainnet: 1,
} as const;

export const CHAIN_NAMES = {
  sepolia: 'Sepolia Testnet',
  mainnet: 'Ethereum Mainnet',
} as const;

// ===========================================
// Contract Addresses
// ===========================================

export const CONTRACT_ADDRESSES = {
  sepolia: {
    mneeMart: process.env.NEXT_PUBLIC_MNEEMART_ADDRESS_SEPOLIA || '',
    mneeToken: process.env.NEXT_PUBLIC_MNEE_ADDRESS_SEPOLIA || '',
  },
  mainnet: {
    mneeMart: process.env.NEXT_PUBLIC_MNEEMART_ADDRESS_MAINNET || '',
    mneeToken: process.env.NEXT_PUBLIC_MNEE_ADDRESS_MAINNET || '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
  },
} as const;

/**
 * Get contract addresses for current chain
 */
export function getContractAddresses() {
  return CONTRACT_ADDRESSES[CURRENT_CHAIN];
}

// ===========================================
// RPC Configuration
// ===========================================

export const RPC_URLS = {
  sepolia: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
  mainnet: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || 'https://eth.llamarpc.com',
} as const;

// ===========================================
// IPFS / Pinata Configuration
// ===========================================

export const PINATA_GATEWAY = 
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Build IPFS URL from CID
 */
export function buildIpfsUrl(cid: string, path?: string): string {
  const basePath = `${PINATA_GATEWAY}/ipfs/${cid}`;
  return path ? `${basePath}/${path}` : basePath;
}

// ===========================================
// Lit Protocol Configuration
// ===========================================

export type LitNetwork = 'datil-dev' | 'datil-test' | 'datil';

export const LIT_NETWORK: LitNetwork = 
  (process.env.NEXT_PUBLIC_LIT_NETWORK as LitNetwork) || 'datil-test';

export const LIT_CAPACITY_TOKEN_ID = 
  process.env.NEXT_PUBLIC_LIT_CAPACITY_TOKEN_ID || '';

// ===========================================
// Application Configuration
// ===========================================

export const APP_CONFIG = {
  name: 'MneeMart',
  description: 'Digital Products Marketplace',
  url: 'https://meneemart.xyz',
  // Token decimals (MNEE uses 18 decimals like ETH)
  tokenDecimals: 18,
  // Platform fee display (for UI only, actual fee is on-chain)
  platformFeePercent: 5,
  // Maximum file size for upload (50MB)
  maxFileSize: 50 * 1024 * 1024,
  // Supported file types for encrypted assets
  supportedAssetTypes: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
  ],
  // Supported cover image types
  supportedCoverTypes: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
  ],
  // Maximum cover image size (5MB)
  maxCoverSize: 5 * 1024 * 1024,
} as const;

// ===========================================
// Feature Flags
// ===========================================

export const FEATURES = {
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  enableMainnet: CURRENT_CHAIN === 'mainnet',
} as const;

// ===========================================
// External Links
// ===========================================

export const EXTERNAL_LINKS = {
  etherscan: {
    sepolia: 'https://sepolia.etherscan.io',
    mainnet: 'https://etherscan.io',
  },
  safe: 'https://app.safe.global',
  splits: 'https://splits.org',
} as const;

/**
 * Build Etherscan URL for address or transaction
 */
export function buildEtherscanUrl(
  type: 'address' | 'tx',
  hash: string
): string {
  const baseUrl = EXTERNAL_LINKS.etherscan[CURRENT_CHAIN];
  return `${baseUrl}/${type}/${hash}`;
}

