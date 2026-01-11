'use client';

/**
 * Header Component
 * Main navigation with wallet connection, search bar, and cart
 * 
 * Features:
 * - Fixed search bar in header (visible on scroll)
 * - Shopping cart with item count badge
 * - Theme toggle
 * - Responsive mobile menu
 */

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X, ShoppingBag, Plus, User, ShoppingCart, Search } from 'lucide-react';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CURRENT_CHAIN, CHAIN_NAMES } from '@/lib/constants';
import { useCart } from '@/lib/hooks/use-cart';

const navigation = [
  { name: 'Marketplace', href: '/', icon: ShoppingBag },
  { name: 'Create', href: '/create', icon: Plus },
  { name: 'Profile', href: '/profile', icon: User },
];

/**
 * Header Search Bar - wrapped in Suspense for useSearchParams
 */
function HeaderSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Handle search submit
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  }, [searchQuery, router]);

  // Update search when URL changes
  useEffect(() => {
    if (pathname === '/') {
      setSearchQuery(searchParams.get('q') || '');
    }
  }, [pathname, searchParams]);

  return (
    <form onSubmit={handleSearch} className="relative hidden md:flex flex-1 max-w-sm mx-4">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search products..."
        className="pl-9 pr-4 h-9 w-full"
      />
    </form>
  );
}

/**
 * Cart Button with badge
 */
function CartButton() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isActive = pathname === '/cart';

  return (
    <Link href="/cart">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'relative',
          isActive && 'bg-accent text-accent-foreground'
        )}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-mnee-500"
          >
            {itemCount > 9 ? '9+' : itemCount}
          </Badge>
        )}
        <span className="sr-only">Shopping Cart</span>
      </Button>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolved theme for consistent behavior
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-mnee-500 to-purple-600">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="hidden font-bold sm:inline-block">
            <span className="gradient-text">Mnee</span>
            <span className="text-foreground">Mart</span>
          </span>
        </Link>

        {/* Search Bar - Centered */}
        <Suspense fallback={<div className="hidden md:flex flex-1 max-w-sm mx-4" />}>
          <HeaderSearchBar />
        </Suspense>

        {/* Desktop Navigation */}
        <div className="hidden items-center space-x-1 md:flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Cart Button */}
          <CartButton />

          {/* Network Badge */}
          <div className="hidden items-center rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium lg:flex">
            <span
              className={cn(
                'mr-1.5 h-2 w-2 rounded-full',
                CURRENT_CHAIN === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'
              )}
            />
            {CHAIN_NAMES[CURRENT_CHAIN]}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="hidden sm:flex"
            suppressHydrationWarning
          >
            {mounted ? (
              isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Connect Wallet */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted: walletMounted,
            }) => {
              const ready = walletMounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button
                          onClick={openConnectModal}
                          variant="gradient"
                          size="sm"
                        >
                          Connect Wallet
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button
                          onClick={openChainModal}
                          variant="destructive"
                          size="sm"
                        >
                          Wrong Network
                        </Button>
                      );
                    }

                    return (
                      <Button
                        onClick={openAccountModal}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {account.displayBalance && (
                          <span className="hidden text-muted-foreground lg:inline">
                            {account.displayBalance}
                          </span>
                        )}
                        <span>{account.displayName}</span>
                      </Button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 md:hidden">
          <div className="container space-y-1 py-3">
            {/* Mobile Search */}
            <Suspense fallback={null}>
              <MobileSearchBar onClose={() => setMobileMenuOpen(false)} />
            </Suspense>

            {navigation.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Mobile Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Mobile Search Bar
 */
function MobileSearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
    onClose();
  };

  return (
    <form onSubmit={handleSearch} className="relative mb-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search products..."
        className="pl-9 pr-4"
      />
    </form>
  );
}
