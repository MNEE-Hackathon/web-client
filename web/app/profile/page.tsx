'use client';

/**
 * Profile Page
 * Shows user's listings, purchases, and payment history
 * Allows sellers to manage their products and store
 * 
 * Updated:
 * - My Purchases uses event indexing (getLogs)
 * - Added Payment History tab
 * - Added Store link sharing
 * - Supports URL tab parameter (?tab=purchases)
 */

import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGrid } from '@/components/product/product-grid';
import { useToast } from '@/components/ui/use-toast';
import { useSellerProducts, useProducts } from '@/lib/hooks/use-products';
import { usePurchases, usePaymentHistory } from '@/lib/hooks/use-purchases';
import { useStore, copyStoreUrl, shareStoreUrl } from '@/lib/hooks/use-store';
import { mneeMartConfig } from '@/lib/contracts';
import { formatTokenAmount, truncateAddress, formatRelativeTime, formatMneePrice } from '@/lib/utils';
import { buildEtherscanUrl } from '@/lib/constants';
import { 
  Wallet, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  ExternalLink,
  Copy,
  Check,
  Store,
  Share2,
  Clock,
  Receipt,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'listings';
  
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();

  // Store data
  const { storeName } = useStore(address);

  // Product toggle state
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);

  // Fetch seller products
  const { products: sellerProducts, isLoading: sellerLoading, refetch: refetchSellerProducts } = useSellerProducts(address);

  // Fetch purchases using event indexing
  const { 
    purchases, 
    purchasedProductIds, 
    isLoading: purchasesLoading,
    clearNewPurchaseNotification,
  } = usePurchases();

  // Fetch payment history
  const { payments, isLoading: paymentsLoading } = usePaymentHistory();

  // Fetch purchased products details
  const { products: purchasedProducts, isLoading: purchasedProductsLoading } = useProducts(
    purchasedProductIds.length > 0 ? Math.min(...purchasedProductIds) : 0,
    purchasedProductIds.length > 0 ? Math.max(...purchasedProductIds) : 0
  );

  // Filter to only include products the user purchased
  const myPurchasedProducts = useMemo(() => {
    return purchasedProducts.filter(p => purchasedProductIds.includes(p.id));
  }, [purchasedProducts, purchasedProductIds]);

  // Contract write for toggling product status
  const { 
    writeContract: toggleProduct, 
    data: toggleTxHash,
    isPending: isTogglePending,
    reset: resetToggle,
  } = useWriteContract();

  // Wait for toggle transaction
  const { isLoading: isToggleConfirming, isSuccess: isToggleSuccess } = useWaitForTransactionReceipt({
    hash: toggleTxHash,
  });

  // Handle toggle success
  useEffect(() => {
    if (isToggleSuccess && togglingProductId !== null) {
      toast({
        title: pendingStatus ? 'Product Activated' : 'Product Deactivated',
        description: `Product #${togglingProductId} has been ${pendingStatus ? 'activated' : 'deactivated'}.`,
        variant: 'success',
      });
      setTogglingProductId(null);
      setPendingStatus(null);
      resetToggle();
      refetchSellerProducts();
    }
  }, [isToggleSuccess, togglingProductId, pendingStatus, toast, resetToggle, refetchSellerProducts]);

  // Handle toggle product active status
  const handleToggleActive = useCallback((productId: number, newStatus: boolean) => {
    setTogglingProductId(productId);
    setPendingStatus(newStatus);
    
    toggleProduct({
      ...mneeMartConfig,
      functionName: newStatus ? 'activateProduct' : 'deactivateProduct',
      args: [BigInt(productId)],
    });
  }, [toggleProduct]);

  // Fetch seller info
  const { data: sellerInfo } = useReadContract({
    ...mneeMartConfig,
    functionName: 'sellers',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Parse seller info
  const sellerData = useMemo(() => {
    if (!sellerInfo) return null;
    const [totalSales, balance, totalEarnings] = sellerInfo as [bigint, bigint, bigint];
    return { totalSales, balance, totalEarnings };
  }, [sellerInfo]);

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle share store
  const handleShareStore = async () => {
    if (!address) return;
    const success = await shareStoreUrl(address, storeName || undefined);
    if (success) {
      toast({
        title: 'Store link shared!',
        description: 'Your store link has been copied.',
        variant: 'success',
      });
    }
  };

  // Clear new purchase notification when viewing purchases tab
  useEffect(() => {
    if (activeTab === 'purchases') {
      clearNewPurchaseNotification();
    }
  }, [activeTab, clearNewPurchaseNotification]);

  // Not connected
  if (!isConnected) {
    return (
      <div className="container py-16 text-center">
        <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to view your profile
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-mnee-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {storeName || truncateAddress(address || '')}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyAddress}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <a
                  href={buildEtherscanUrl('address', address || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
              <p className="text-muted-foreground">Your MeneeMart Profile</p>
            </div>
          </div>

          {/* Store Link Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/store/${address}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Store className="h-4 w-4" />
                View Store
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShareStore} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Store
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Listed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellerProducts?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellerData ? Number(sellerData.totalSales) : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchasedProductIds.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">
              {formatTokenAmount(sellerData?.balance || 0n)} MNEE
            </div>
            {sellerData?.balance && sellerData.balance > 0n && (
              <WithdrawButton />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="listings" className="gap-2">
            <Package className="h-4 w-4" />
            My Listings
            {sellerProducts && sellerProducts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sellerProducts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            My Purchases
            {purchasedProductIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {purchasedProductIds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* My Listings Tab */}
        <TabsContent value="listings">
          {sellerLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : sellerProducts && sellerProducts.length > 0 ? (
            <ProductGrid 
              products={sellerProducts}
              showSellerControls
              onToggleActive={handleToggleActive}
              togglingProductId={isTogglePending || isToggleConfirming ? togglingProductId : null}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Products Listed</h3>
                <p className="text-muted-foreground mt-2">
                  You haven&apos;t listed any products yet
                </p>
                <Link href="/create">
                  <Button variant="gradient" className="mt-4">
                    Create Your First Product
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Purchases Tab */}
        <TabsContent value="purchases">
          {purchasesLoading || purchasedProductsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : myPurchasedProducts.length > 0 ? (
            <ProductGrid 
              products={myPurchasedProducts}
              emptyMessage="No purchases found"
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Purchases Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Products you purchase will appear here for easy download
                </p>
                <Link href="/">
                  <Button variant="gradient" className="mt-4">
                    Browse Marketplace
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          {paymentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.txHash}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Purchased Product #{payment.productId}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {payment.timestamp 
                                ? formatRelativeTime(new Date(payment.timestamp))
                                : `Block ${payment.blockNumber.toString()}`
                              }
                            </span>
                            <span>•</span>
                            <a
                              href={buildEtherscanUrl('tx', payment.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              View tx
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold gradient-text">
                          {formatMneePrice(payment.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee: {formatTokenAmount(payment.platformFee)} MNEE
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Payment History</h3>
                <p className="text-muted-foreground mt-2">
                  Your payment transactions will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Withdraw Button Component
 */
function WithdrawButton() {
  const { writeContract, isPending } = useWriteContract();
  const { toast } = useToast();

  const handleWithdraw = () => {
    writeContract({
      ...mneeMartConfig,
      functionName: 'withdrawSellerBalance',
      gas: BigInt(150_000),
    }, {
      onSuccess: () => {
        toast({
          title: 'Withdrawal initiated',
          description: 'Your funds are being transferred.',
          variant: 'success',
        });
      },
      onError: (err) => {
        toast({
          title: 'Withdrawal failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="mt-2"
      onClick={handleWithdraw}
      disabled={isPending}
    >
      {isPending ? 'Withdrawing...' : 'Withdraw'}
    </Button>
  );
}
