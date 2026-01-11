'use client';

/**
 * usePurchases Hook
 * Fetches user's purchase history using multiple strategies:
 * 1. Event indexing (getLogs) - efficient for RPC providers that support it
 * 2. Fallback: iterate through products and check hasUserPurchased
 * 
 * Uses ProductPurchased event which has indexed buyer parameter
 * for efficient RPC-level filtering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { mneeMartConfig, getCurrentChainId } from '@/lib/contracts';
import { MneeMartAbi } from '@/lib/contracts/abis';

// Storage key prefixes for new purchase notification (address appended)
const STORAGE_KEY_LAST_SEEN_BLOCK_PREFIX = 'meneemart_last_seen_purchase_block_';
const STORAGE_KEY_LAST_SEEN_TX_PREFIX = 'meneemart_last_seen_purchase_tx_';

/**
 * Get storage keys for a specific wallet address
 */
function getStorageKeys(address: string) {
  const normalizedAddress = address.toLowerCase();
  return {
    lastSeenBlock: `${STORAGE_KEY_LAST_SEEN_BLOCK_PREFIX}${normalizedAddress}`,
    lastSeenTx: `${STORAGE_KEY_LAST_SEEN_TX_PREFIX}${normalizedAddress}`,
  };
}

/**
 * Purchase record from event logs
 */
export interface PurchaseRecord {
  productId: number;
  buyer: Address;
  seller: Address;
  price: bigint;
  platformFee: bigint;
  txHash: string;
  blockNumber: bigint;
  timestamp?: number;
}

/**
 * Hook to fetch user's purchases using event indexing with fallback
 */
export function usePurchases() {
  const { address } = useAccount();
  const chainId = getCurrentChainId();
  const publicClient = usePublicClient({ chainId });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewPurchases, setHasNewPurchases] = useState(false);

  // Get total product count to help with fallback strategy
  const { data: productCounter } = useReadContract({
    ...mneeMartConfig,
    functionName: 'productCounter',
  });

  // Fetch purchases from event logs
  const fetchPurchases = useCallback(async () => {
    if (!address || !publicClient) {
      setPurchases([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[usePurchases] Starting purchase fetch for:', address);
      console.log('[usePurchases] Contract address:', mneeMartConfig.address);
      console.log('[usePurchases] Chain ID:', chainId);

      // Try event-based query first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let logs: any[] = [];
      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        
        // For Sepolia, query from a reasonable range (last 500k blocks ~ 2 months)
        // For mainnet, use smaller range
        const blocksToQuery = chainId === 11155111 ? 500_000n : 100_000n;
        const fromBlock = currentBlock > blocksToQuery ? currentBlock - blocksToQuery : 0n;

        console.log('[usePurchases] Querying from block:', fromBlock.toString(), 'to:', currentBlock.toString());

        logs = await publicClient.getContractEvents({
          address: mneeMartConfig.address as Address,
          abi: MneeMartAbi,
          eventName: 'ProductPurchased',
          args: {
            buyer: address,
          },
          fromBlock,
          toBlock: 'latest',
        });

        console.log('[usePurchases] Event query returned', logs.length, 'logs');
      } catch (eventError) {
        console.warn('[usePurchases] Event query failed, trying wider range:', eventError);
        
        // Try with 'earliest' as fallback
        try {
          logs = await publicClient.getContractEvents({
            address: mneeMartConfig.address as Address,
            abi: MneeMartAbi,
            eventName: 'ProductPurchased',
            args: {
              buyer: address,
            },
            fromBlock: 'earliest',
            toBlock: 'latest',
          });
          console.log('[usePurchases] Fallback query returned', logs.length, 'logs');
        } catch (fallbackError) {
          console.error('[usePurchases] Fallback also failed:', fallbackError);
          logs = [];
        }
      }

      if (logs && logs.length > 0) {
        // Parse logs into purchase records
        const purchaseRecords: PurchaseRecord[] = logs.map((log) => ({
          productId: Number(log.args.productId),
          buyer: log.args.buyer as Address,
          seller: log.args.seller as Address,
          price: log.args.price as bigint,
          platformFee: log.args.platformFee as bigint,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        }));

        // Sort by block number (newest first)
        purchaseRecords.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        setPurchases(purchaseRecords);
        checkNewPurchases(purchaseRecords);
      } else {
        // If event query returned nothing, try contract-based verification
        // This is slower but works when RPC doesn't support log queries well
        console.log('[usePurchases] No events found, trying contract verification...');
        
        if (productCounter && productCounter > 0n) {
          const purchasedFromContract = await checkPurchasesViaContract(
            publicClient,
            address,
            Number(productCounter)
          );
          
          if (purchasedFromContract.length > 0) {
            console.log('[usePurchases] Found', purchasedFromContract.length, 'purchases via contract');
            setPurchases(purchasedFromContract);
          } else {
            setPurchases([]);
          }
        } else {
          setPurchases([]);
        }
      }
    } catch (err) {
      console.error('[usePurchases] Failed to fetch purchases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch purchases');
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, chainId, productCounter]);

  // Check purchases via contract (fallback method)
  async function checkPurchasesViaContract(
    client: typeof publicClient,
    userAddress: Address,
    totalProducts: number
  ): Promise<PurchaseRecord[]> {
    if (!client) return [];
    
    const results: PurchaseRecord[] = [];
    
    // Check each product (batch for efficiency)
    const batchSize = 10;
    for (let i = 1; i <= totalProducts; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, totalProducts + 1); j++) {
        batch.push(
          client.readContract({
            ...mneeMartConfig,
            functionName: 'hasUserPurchased',
            args: [userAddress, BigInt(j)],
          }).then((hasPurchased) => ({ productId: j, hasPurchased }))
        );
      }
      
      const batchResults = await Promise.all(batch);
      
      for (const result of batchResults) {
        if (result.hasPurchased) {
          // Create a minimal purchase record
          results.push({
            productId: result.productId,
            buyer: userAddress,
            seller: '0x0000000000000000000000000000000000000000' as Address,
            price: 0n,
            platformFee: 0n,
            txHash: '',
            blockNumber: 0n,
          });
        }
      }
    }
    
    return results;
  }

  // Check if there are new purchases since last seen
  const checkNewPurchases = useCallback((records: PurchaseRecord[]) => {
    if (records.length === 0 || !address) {
      setHasNewPurchases(false);
      return;
    }

    try {
      const keys = getStorageKeys(address);
      const lastSeenBlock = localStorage.getItem(keys.lastSeenBlock);
      const lastSeenTx = localStorage.getItem(keys.lastSeenTx);

      if (!lastSeenBlock && !lastSeenTx) {
        // First time - no notification needed, mark all as seen
        markAllAsSeenInternal(records, address);
        setHasNewPurchases(false);
        return;
      }

      const lastSeenBlockNum = lastSeenBlock ? BigInt(lastSeenBlock) : 0n;
      
      // Check for purchases newer than last seen
      const newPurchases = records.filter((p) => {
        if (p.blockNumber === 0n) return false; // Contract-based records don't have block info
        if (p.blockNumber > lastSeenBlockNum) return true;
        if (p.blockNumber === lastSeenBlockNum && p.txHash !== lastSeenTx) return true;
        return false;
      });

      setHasNewPurchases(newPurchases.length > 0);
    } catch (err) {
      console.warn('[usePurchases] Cannot access localStorage:', err);
    }
  }, [address]);

  // Internal function to mark purchases as seen (used by checkNewPurchases)
  function markAllAsSeenInternal(records: PurchaseRecord[], userAddress: string) {
    if (records.length === 0) return;

    try {
      const keys = getStorageKeys(userAddress);
      const recordWithBlock = records.find(r => r.blockNumber > 0n);
      if (recordWithBlock) {
        localStorage.setItem(keys.lastSeenBlock, recordWithBlock.blockNumber.toString());
        localStorage.setItem(keys.lastSeenTx, recordWithBlock.txHash);
      }
    } catch (err) {
      console.warn('[usePurchases] Cannot access localStorage:', err);
    }
  }

  // Mark all purchases as seen
  const markAllAsSeen = useCallback((records?: PurchaseRecord[]) => {
    if (!address) return;
    
    const recordsToMark = records || purchases;
    if (recordsToMark.length === 0) return;

    try {
      const keys = getStorageKeys(address);
      const recordWithBlock = recordsToMark.find(r => r.blockNumber > 0n);
      if (recordWithBlock) {
        localStorage.setItem(keys.lastSeenBlock, recordWithBlock.blockNumber.toString());
        localStorage.setItem(keys.lastSeenTx, recordWithBlock.txHash);
      }
      setHasNewPurchases(false);
    } catch (err) {
      console.warn('[usePurchases] Cannot access localStorage:', err);
    }
  }, [purchases, address]);

  // Clear new purchase notification
  const clearNewPurchaseNotification = useCallback(() => {
    markAllAsSeen();
  }, [markAllAsSeen]);

  // Fetch on mount and when address/client changes
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Get unique product IDs for My Purchases display
  const purchasedProductIds = useMemo(() => {
    return [...new Set(purchases.map((p) => p.productId))];
  }, [purchases]);

  return {
    purchases,
    purchasedProductIds,
    isLoading,
    error,
    refetch: fetchPurchases,
    hasNewPurchases,
    clearNewPurchaseNotification,
    purchaseCount: purchases.length,
  };
}

/**
 * Hook to check if user has purchased a specific product
 */
export function useHasPurchasedFromEvents(productId: number) {
  const { purchasedProductIds, isLoading } = usePurchases();
  
  const hasPurchased = useMemo(() => {
    return purchasedProductIds.includes(productId);
  }, [purchasedProductIds, productId]);

  return { hasPurchased, isLoading };
}

/**
 * Hook to get payment history (for Payment History tab)
 */
export function usePaymentHistory() {
  const { purchases, isLoading, error, refetch } = usePurchases();
  const chainId = getCurrentChainId();
  const publicClient = usePublicClient({ chainId });
  const [enrichedPurchases, setEnrichedPurchases] = useState<
    (PurchaseRecord & { timestamp?: number })[]
  >([]);
  const [isEnriching, setIsEnriching] = useState(false);

  // Enrich purchases with timestamps from blocks
  useEffect(() => {
    if (purchases.length === 0 || !publicClient) {
      setEnrichedPurchases([]);
      return;
    }

    const enrichWithTimestamps = async () => {
      setIsEnriching(true);
      try {
        // Get unique block numbers (filter out 0 for contract-based records)
        const uniqueBlocks = [...new Set(purchases.map((p) => p.blockNumber).filter(b => b > 0n))];
        
        if (uniqueBlocks.length === 0) {
          // No block info available (contract-based fallback)
          setEnrichedPurchases(purchases.map(p => ({ ...p, timestamp: undefined })));
          setIsEnriching(false);
          return;
        }
        
        // Fetch block data for timestamps (limit to avoid too many calls)
        const blocksToFetch = uniqueBlocks.slice(0, 50);
        const blockData = await Promise.all(
          blocksToFetch.map((blockNum) =>
            publicClient.getBlock({ blockNumber: blockNum })
          )
        );

        // Create block number to timestamp map
        const blockTimestamps = new Map<string, number>();
        blockData.forEach((block) => {
          if (block) {
            blockTimestamps.set(
              block.number.toString(),
              Number(block.timestamp) * 1000
            );
          }
        });

        // Enrich purchases with timestamps
        const enriched = purchases.map((p) => ({
          ...p,
          timestamp: blockTimestamps.get(p.blockNumber.toString()),
        }));

        setEnrichedPurchases(enriched);
      } catch (err) {
        console.error('[usePaymentHistory] Failed to enrich purchases:', err);
        setEnrichedPurchases(purchases);
      } finally {
        setIsEnriching(false);
      }
    };

    enrichWithTimestamps();
  }, [purchases, publicClient]);

  return {
    payments: enrichedPurchases,
    isLoading: isLoading || isEnriching,
    error,
    refetch,
  };
}
