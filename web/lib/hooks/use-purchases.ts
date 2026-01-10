'use client';

/**
 * usePurchases Hook
 * Fetches user's purchase history using event indexing (getLogs)
 * 
 * Uses ProductPurchased event which has indexed buyer parameter
 * for efficient RPC-level filtering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi';
import { type Log, type Address, parseAbiItem } from 'viem';
import { mneeMartConfig, getCurrentChainId } from '@/lib/contracts';
import type { Product } from '@/lib/constants/types';

// Storage keys for new purchase notification
const STORAGE_KEY_LAST_SEEN_BLOCK = 'meneemart_last_seen_purchase_block';
const STORAGE_KEY_LAST_SEEN_TX = 'meneemart_last_seen_purchase_tx';

// ProductPurchased event ABI for parsing
const PRODUCT_PURCHASED_EVENT = parseAbiItem(
  'event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 price, uint256 platformFee)'
);

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
 * Hook to fetch user's purchases using event indexing
 */
export function usePurchases() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber();

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewPurchases, setHasNewPurchases] = useState(false);

  // Fetch purchases from event logs
  const fetchPurchases = useCallback(async () => {
    if (!address || !publicClient) {
      setPurchases([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Query ProductPurchased events where buyer is current address
      // Since buyer is indexed, this is efficient at RPC level
      const logs = await publicClient.getLogs({
        address: mneeMartConfig.address as Address,
        event: PRODUCT_PURCHASED_EVENT,
        args: {
          buyer: address,
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

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

      // Check for new purchases since last seen
      checkNewPurchases(purchaseRecords);
    } catch (err) {
      console.error('[usePurchases] Failed to fetch purchases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch purchases');
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  // Check if there are new purchases since last seen
  const checkNewPurchases = useCallback((records: PurchaseRecord[]) => {
    if (records.length === 0) {
      setHasNewPurchases(false);
      return;
    }

    const lastSeenBlock = localStorage.getItem(STORAGE_KEY_LAST_SEEN_BLOCK);
    const lastSeenTx = localStorage.getItem(STORAGE_KEY_LAST_SEEN_TX);

    if (!lastSeenBlock && !lastSeenTx) {
      // First time - no notification needed, mark all as seen
      markAllAsSeen(records);
      setHasNewPurchases(false);
      return;
    }

    const lastSeenBlockNum = lastSeenBlock ? BigInt(lastSeenBlock) : 0n;
    
    // Check for purchases newer than last seen
    const newPurchases = records.filter((p) => {
      // If block is newer, it's a new purchase
      if (p.blockNumber > lastSeenBlockNum) return true;
      // If same block but different tx (edge case), check tx hash
      if (p.blockNumber === lastSeenBlockNum && p.txHash !== lastSeenTx) return true;
      return false;
    });

    setHasNewPurchases(newPurchases.length > 0);
  }, []);

  // Mark all purchases as seen
  const markAllAsSeen = useCallback((records?: PurchaseRecord[]) => {
    const recordsToMark = records || purchases;
    if (recordsToMark.length === 0) return;

    const latestRecord = recordsToMark[0]; // Already sorted newest first
    localStorage.setItem(STORAGE_KEY_LAST_SEEN_BLOCK, latestRecord.blockNumber.toString());
    localStorage.setItem(STORAGE_KEY_LAST_SEEN_TX, latestRecord.txHash);
    setHasNewPurchases(false);
  }, [purchases]);

  // Clear new purchase notification
  const clearNewPurchaseNotification = useCallback(() => {
    markAllAsSeen();
  }, [markAllAsSeen]);

  // Fetch on mount and when address changes
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
 * Uses the cached purchases data from usePurchases
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
 * Returns purchases with additional transaction details
 */
export function usePaymentHistory() {
  const { purchases, isLoading, error, refetch } = usePurchases();
  const publicClient = usePublicClient();
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
        // Get unique block numbers
        const uniqueBlocks = [...new Set(purchases.map((p) => p.blockNumber))];
        
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
        // Still set purchases without timestamps
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

