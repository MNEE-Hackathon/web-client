'use client';

/**
 * Seller Store Page
 * Shows all products from a specific seller
 * 
 * Features:
 * - Customizable store name (localStorage MVP)
 * - Shareable link (web + mobile)
 * - All seller products displayed
 */

import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Edit2,
  Store,
  Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGrid } from '@/components/product/product-grid';
import { SearchBar, useProductSearch } from '@/components/product/search-bar';
import { useToast } from '@/components/ui/use-toast';

import { useSellerProducts } from '@/lib/hooks/use-products';
import { useStore, shareStoreUrl, copyStoreUrl } from '@/lib/hooks/use-store';
import { truncateAddress, isValidAddress } from '@/lib/utils';
import { buildEtherscanUrl } from '@/lib/constants';

export default function SellerStorePage() {
  const params = useParams();
  const sellerAddress = params.address as string;
  const { address: connectedAddress } = useAccount();
  const { toast } = useToast();

  // Store data
  const { storeName, setStoreName, isLoading: storeLoading } = useStore(sellerAddress);
  
  // Products
  const { products, isLoading: productsLoading, refetch } = useSellerProducts(sellerAddress);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const filteredProducts = useProductSearch(products || [], searchQuery);

  // Edit mode for store name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if current user is the store owner
  const isOwner = connectedAddress?.toLowerCase() === sellerAddress?.toLowerCase();

  // Filter to show only active products for non-owners
  const displayProducts = isOwner 
    ? filteredProducts 
    : filteredProducts.filter(p => p.active);

  // Handle save store name
  const handleSaveName = () => {
    if (editName.trim()) {
      setStoreName(editName.trim());
      toast({
        title: 'Store name updated',
        description: 'Your store name has been saved.',
        variant: 'success',
      });
    }
    setIsEditingName(false);
  };

  // Handle share
  const handleShare = async () => {
    const success = await shareStoreUrl(sellerAddress, storeName || undefined);
    if (success) {
      toast({
        title: 'Link shared!',
        description: 'Store link copied to clipboard.',
        variant: 'success',
      });
    }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    const success = await copyStoreUrl(sellerAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copied!',
        description: 'Store link copied to clipboard.',
        variant: 'success',
      });
    }
  };

  // Validate address
  if (!isValidAddress(sellerAddress)) {
    return (
      <div className="container py-16 text-center">
        <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Invalid Store Address</h1>
        <p className="text-muted-foreground mt-2">
          The address provided is not valid.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = storeName || truncateAddress(sellerAddress);

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Store Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Store Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-mnee-500 to-purple-600 flex items-center justify-center shrink-0">
              <Store className="h-8 w-8 text-white" />
            </div>
            
            <div className="min-w-0">
              {/* Store Name */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter store name"
                    className="max-w-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditingName(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold truncate">
                    {storeLoading ? <Skeleton className="h-8 w-48" /> : displayName}
                  </h1>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        setEditName(storeName || '');
                        setIsEditingName(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">{truncateAddress(sellerAddress)}</span>
                <a
                  href={buildEtherscanUrl('address', sellerAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{displayProducts.length} products</span>
                </div>
                {isOwner && (
                  <Badge variant="success">Your Store</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Owner Tip */}
        {isOwner && !storeName && (
          <Card className="mt-4 bg-muted/50">
            <CardContent className="py-3 flex items-center gap-3">
              <Edit2 className="h-5 w-5 text-mnee-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Add a store name to make your page more personal and memorable!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Bar */}
      {displayProducts.length > 0 && (
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products..."
            className="max-w-md"
          />
        </div>
      )}

      {/* Products Grid */}
      <ProductGrid
        products={displayProducts}
        isLoading={productsLoading}
        emptyMessage={
          searchQuery 
            ? 'No products match your search' 
            : 'This store has no products yet'
        }
        showSellerControls={isOwner}
      />

      {/* Empty State for Store Owner */}
      {isOwner && displayProducts.length === 0 && !productsLoading && (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Start Selling</h3>
            <p className="text-muted-foreground mt-2">
              Create your first product to start selling on MneeMart
            </p>
            <Link href="/create">
              <Button variant="gradient" className="mt-4">
                Create Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

