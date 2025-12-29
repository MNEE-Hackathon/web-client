'use client';

/**
 * useMetadata Hook
 * Fetches and caches product metadata from IPFS
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMetadata } from '@/lib/services/pinata';
import type { ProductMetadata } from '@/lib/constants/types';

// Simple in-memory cache
const metadataCache = new Map<string, ProductMetadata>();

interface UseMetadataResult {
  metadata: ProductMetadata | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch product metadata from IPFS
 */
export function useMetadata(cid: string | undefined): UseMetadataResult {
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!cid) {
      setMetadata(null);
      return;
    }

    // Check cache first
    if (metadataCache.has(cid)) {
      setMetadata(metadataCache.get(cid)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMetadata(cid);
      metadataCache.set(cid, data);
      setMetadata(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metadata';
      setError(message);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [cid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    // Clear cache for this CID
    if (cid) {
      metadataCache.delete(cid);
    }
    await fetchData();
  }, [cid, fetchData]);

  return { metadata, isLoading, error, refetch };
}

/**
 * Hook to fetch metadata for multiple products
 */
export function useMultipleMetadata(cids: string[]) {
  const [metadataMap, setMetadataMap] = useState<Map<string, ProductMetadata>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (cids.length === 0) {
      setMetadataMap(new Map());
      return;
    }

    const fetchAll = async () => {
      setIsLoading(true);
      const newMetadataMap = new Map<string, ProductMetadata>();
      const newErrors = new Map<string, string>();

      await Promise.all(
        cids.map(async (cid) => {
          // Check cache first
          if (metadataCache.has(cid)) {
            newMetadataMap.set(cid, metadataCache.get(cid)!);
            return;
          }

          try {
            const data = await fetchMetadata(cid);
            metadataCache.set(cid, data);
            newMetadataMap.set(cid, data);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch';
            newErrors.set(cid, message);
          }
        })
      );

      setMetadataMap(newMetadataMap);
      setErrors(newErrors);
      setIsLoading(false);
    };

    fetchAll();
  }, [cids.join(',')]); // Dependency on stringified array

  return { metadataMap, isLoading, errors };
}

/**
 * Clear metadata cache
 */
export function clearMetadataCache(cid?: string) {
  if (cid) {
    metadataCache.delete(cid);
  } else {
    metadataCache.clear();
  }
}

