/**
 * Pinata Service
 * Handles IPFS uploads via Pinata with RootCID directory structure
 */

import { PINATA_GATEWAY } from '@/lib/constants';
import type { ProductMetadata, SignedJwtResponse, UploadResponse } from '@/lib/constants/types';

// Pinata API base URL
const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * Get a signed JWT for client-side upload
 */
async function getSignedJwt(fileName?: string): Promise<SignedJwtResponse> {
  const response = await fetch('/api/pinata/signed-jwt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });

  if (!response.ok) {
    throw new Error('Failed to get upload authorization');
  }

  return response.json();
}

/**
 * Upload a single file to Pinata
 */
export async function uploadFile(
  file: File | Blob,
  fileName: string,
  options?: {
    onProgress?: (progress: number) => void;
  }
): Promise<UploadResponse> {
  // Get signed JWT
  const { jwt } = await getSignedJwt(fileName);

  // Create form data
  const formData = new FormData();
  formData.append('file', file, fileName);

  // Upload to Pinata
  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  const result = await response.json();
  
  return {
    cid: result.IpfsHash,
    size: result.PinSize,
  };
}

/**
 * Upload a directory to Pinata (for RootCID structure)
 * Creates: /metadata.json, /cover.png, /asset.enc
 */
export async function uploadProductDirectory(
  coverFile: File,
  encryptedAsset: Blob,
  metadata: ProductMetadata,
  options?: {
    onProgress?: (stage: string, progress: number) => void;
  }
): Promise<string> {
  const { onProgress } = options || {};

  // Get signed JWT for directory upload
  const { jwt } = await getSignedJwt('product-directory');

  // Create form data with directory structure
  const formData = new FormData();

  // Determine cover extension
  const coverExt = coverFile.name.split('.').pop() || 'png';

  // Add cover image
  formData.append('file', coverFile, `cover.${coverExt}`);
  onProgress?.('cover', 30);

  // Add encrypted asset
  formData.append('file', encryptedAsset, 'asset.enc');
  onProgress?.('asset', 60);

  // Add metadata JSON
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: 'application/json',
  });
  formData.append('file', metadataBlob, 'metadata.json');
  onProgress?.('metadata', 80);

  // Add pinata options for directory wrapping
  const pinataOptions = JSON.stringify({
    wrapWithDirectory: true,
    cidVersion: 1,
  });
  formData.append('pinataOptions', pinataOptions);

  // Upload directory
  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directory upload failed: ${error}`);
  }

  const result = await response.json();
  onProgress?.('complete', 100);

  return result.IpfsHash; // This is the RootCID
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchMetadata(cid: string): Promise<ProductMetadata> {
  const url = `${PINATA_GATEWAY}/ipfs/${cid}/metadata.json`;
  
  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch encrypted asset from IPFS
 */
export async function fetchEncryptedAsset(cid: string): Promise<Blob> {
  const url = `${PINATA_GATEWAY}/ipfs/${cid}/asset.enc`;
  
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status}`);
  }

  return response.blob();
}

/**
 * Get cover image URL
 */
export function getCoverUrl(cid: string, extension: string = 'png'): string {
  return `${PINATA_GATEWAY}/ipfs/${cid}/cover.${extension}`;
}

/**
 * Get metadata URL
 */
export function getMetadataUrl(cid: string): string {
  return `${PINATA_GATEWAY}/ipfs/${cid}/metadata.json`;
}

/**
 * Check if a CID is pinned (exists on Pinata)
 */
export async function isPinned(cid: string): Promise<boolean> {
  try {
    const response = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}/metadata.json`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

