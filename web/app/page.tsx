'use client';

/**
 * Marketplace Homepage
 * Displays all active products with search functionality
 */

import { useState } from 'react';
import { useAllProducts } from '@/lib/hooks/use-products';
import { ProductGrid } from '@/components/product/product-grid';
import { SearchBar, useProductSearch } from '@/components/product/search-bar';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Sparkles, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function MarketplacePage() {
  const { products, isLoading, error, refetch, totalCount } = useAllProducts();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter products based on search
  const filteredProducts = useProductSearch(products, searchQuery);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
        
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="gradient-text">Pay-to-Decrypt</span>
              <br />
              <span className="text-foreground">Web3 Marketplace</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Buy digital content with MNEE stablecoin. 
              Your purchase unlocks encrypted files through Lit Protocol — 
              true ownership, no piracy.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/create">
                <Button size="lg" variant="gradient" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Product
                </Button>
              </Link>
              <Button size="lg" variant="outline" asChild>
                <a href="#products">Browse Products</a>
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-mnee-500" />
              <h3 className="mt-3 font-semibold">Encrypted Content</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Files are encrypted before upload. Only buyers can decrypt.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
              <Zap className="h-8 w-8 text-mnee-500" />
              <h3 className="mt-3 font-semibold">MNEE Payments</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay with MNEE stablecoin on Ethereum mainnet.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-mnee-500" />
              <h3 className="mt-3 font-semibold">IPFS Storage</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanent, decentralized storage via Pinata IPFS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="container py-12">
        {/* Header with search */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">All Products</h2>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `${filteredProducts.length} of ${products.length} products`
                  : totalCount > 0 
                    ? `${products.length} active products` 
                    : 'No products yet'
                }
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-md"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Failed to load products</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <ProductGrid 
            products={filteredProducts} 
            isLoading={isLoading}
            emptyMessage={searchQuery ? 'No products match your search' : undefined}
          />
        )}
      </section>
    </div>
  );
}

