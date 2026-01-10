'use client';

/**
 * SearchBar Component
 * Filters products by name, description, and seller address
 */

import { useState, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search products by name, description, or seller...',
  className,
}: SearchBarProps) {
  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to filter products based on search query
 */
export function useProductSearch<T extends { name: string; seller: string; cid?: string }>(
  products: T[],
  searchQuery: string
) {
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase().trim();

    return products.filter((product) => {
      // Search by product name
      if (product.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search by seller address
      if (product.seller.toLowerCase().includes(query)) {
        return true;
      }

      // Could also search by description if available in metadata
      // For now, we search by name and seller

      return false;
    });
  }, [products, searchQuery]);

  return filteredProducts;
}

