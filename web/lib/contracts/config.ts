/**
 * Contract Configuration
 * Wagmi contract config objects for type-safe interactions
 */

import { type Address } from 'viem';
import { getContractAddresses } from '@/lib/constants';
import { MneeMartAbi, Erc20Abi } from './abis';

// Get addresses for current chain
const addresses = getContractAddresses();

/**
 * MneeMart contract configuration
 */
export const mneeMartConfig = {
  address: addresses.mneeMart as Address,
  abi: MneeMartAbi,
} as const;

/**
 * MNEE Token contract configuration
 */
export const mneeTokenConfig = {
  address: addresses.mneeToken as Address,
  abi: Erc20Abi,
} as const;

/**
 * Get MneeMart config with custom address
 * Useful for multi-chain support
 */
export function getMneeMartConfig(address: Address) {
  return {
    address,
    abi: MneeMartAbi,
  } as const;
}

/**
 * Get ERC20 config with custom address
 */
export function getErc20Config(address: Address) {
  return {
    address,
    abi: Erc20Abi,
  } as const;
}

