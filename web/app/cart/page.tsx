'use client';

/**
 * Shopping Cart Page
 * Displays cart items and allows batch checkout
 */

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  ShoppingBag,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import { useCart, type CartItem } from '@/lib/hooks/use-cart';
import { mneeMartConfig, mneeTokenConfig } from '@/lib/contracts';
import { formatMneePrice, truncateAddress } from '@/lib/utils';
import { getCoverUrl } from '@/lib/services/pinata';
import { parseUnits, maxUint256 } from 'viem';

type CheckoutStep = 'idle' | 'approving' | 'purchasing' | 'success' | 'error';

export default function CartPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { items, totalPrice, removeItem, clearCart, itemCount } = useCart();
  const { toast } = useToast();

  // Checkout state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('idle');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...mneeTokenConfig,
    functionName: 'allowance',
    args: address ? [address, mneeMartConfig.address] : undefined,
    query: { enabled: !!address },
  });

  // Check balance
  const { data: balance } = useReadContract({
    ...mneeTokenConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Approve contract
  const { 
    writeContract: writeApprove, 
    data: approveTxHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  // Wait for approve
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // Purchase contract
  const { 
    writeContract: writePurchase, 
    data: purchaseTxHash,
    isPending: isPurchasePending,
    reset: resetPurchase,
  } = useWriteContract();

  // Wait for purchase
  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseTxHash,
  });

  // Calculate if approval is needed
  const needsApproval = allowance !== undefined && allowance < totalPrice;
  const hasInsufficientBalance = balance !== undefined && balance < totalPrice;

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess && checkoutStep === 'approving') {
      refetchAllowance();
      toast({
        title: 'Approval successful!',
        description: 'Now processing your purchases...',
        variant: 'success',
      });
      setCheckoutStep('purchasing');
      setCurrentItemIndex(0);
      // Start purchasing first item
      purchaseNextItem(0);
    }
  }, [isApproveSuccess, checkoutStep]);

  // Handle purchase success
  useEffect(() => {
    if (isPurchaseSuccess && checkoutStep === 'purchasing') {
      const purchasedId = items[currentItemIndex]?.productId;
      if (purchasedId) {
        setPurchasedItems(prev => [...prev, purchasedId]);
      }

      const nextIndex = currentItemIndex + 1;
      if (nextIndex < items.length) {
        setCurrentItemIndex(nextIndex);
        resetPurchase();
        purchaseNextItem(nextIndex);
      } else {
        // All items purchased
        setCheckoutStep('success');
        toast({
          title: 'All purchases complete!',
          description: `Successfully purchased ${items.length} items.`,
          variant: 'success',
        });
        clearCart();
      }
    }
  }, [isPurchaseSuccess, checkoutStep, currentItemIndex, items]);

  // Purchase a specific item
  const purchaseNextItem = useCallback((index: number) => {
    const item = items[index];
    if (!item) return;

    writePurchase({
      ...mneeMartConfig,
      functionName: 'purchaseProduct',
      args: [BigInt(item.productId)],
    }, {
      onError: (err) => {
        setCheckoutStep('error');
        setErrorMessage(err instanceof Error ? err.message : 'Purchase failed');
        toast({
          title: 'Purchase failed',
          description: `Failed to purchase ${item.productName}`,
          variant: 'destructive',
        });
      },
    });
  }, [items, writePurchase, toast]);

  // Start checkout
  const handleCheckout = useCallback(async () => {
    if (!address || items.length === 0) return;

    if (hasInsufficientBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'You don\'t have enough MNEE to complete this purchase.',
        variant: 'destructive',
      });
      return;
    }

    setErrorMessage(null);
    setPurchasedItems([]);
    
    if (needsApproval) {
      setCheckoutStep('approving');
      
      // Check if we need to reset allowance first
      const currentAllowance = allowance || 0n;
      if (currentAllowance > 0n && currentAllowance < totalPrice) {
        // Reset to 0 first (ERC20 allowance race condition prevention)
        writeApprove({
          ...mneeTokenConfig,
          functionName: 'approve',
          args: [mneeMartConfig.address, 0n],
        }, {
          onSuccess: () => {
            // Then approve the total amount
            writeApprove({
              ...mneeTokenConfig,
              functionName: 'approve',
              args: [mneeMartConfig.address, totalPrice],
            }, {
              onError: (err) => {
                setCheckoutStep('error');
                setErrorMessage(err instanceof Error ? err.message : 'Approval failed');
              },
            });
          },
          onError: (err) => {
            setCheckoutStep('error');
            setErrorMessage(err instanceof Error ? err.message : 'Approval failed');
          },
        });
      } else {
        // Direct approval
        writeApprove({
          ...mneeTokenConfig,
          functionName: 'approve',
          args: [mneeMartConfig.address, totalPrice],
        }, {
          onError: (err) => {
            setCheckoutStep('error');
            setErrorMessage(err instanceof Error ? err.message : 'Approval failed');
          },
        });
      }
    } else {
      setCheckoutStep('purchasing');
      setCurrentItemIndex(0);
      purchaseNextItem(0);
    }
  }, [address, items, needsApproval, totalPrice, allowance, hasInsufficientBalance, writeApprove, purchaseNextItem, toast]);

  // Reset checkout
  const resetCheckout = useCallback(() => {
    setCheckoutStep('idle');
    setCurrentItemIndex(0);
    setPurchasedItems([]);
    setErrorMessage(null);
    resetApprove();
    resetPurchase();
  }, [resetApprove, resetPurchase]);

  const isProcessing = checkoutStep === 'approving' || checkoutStep === 'purchasing';

  // Not connected - prompt to connect wallet
  if (!isConnected) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to view your cart
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-6 gap-2">
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0 && checkoutStep !== 'success') {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
        <p className="text-muted-foreground mt-2">
          Add some products to your cart to get started
        </p>
        <Link href="/">
          <Button variant="gradient" className="mt-6 gap-2">
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  // Success state
  if (checkoutStep === 'success') {
    return (
      <div className="container py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">Purchase Complete!</h1>
        <p className="text-muted-foreground mt-2">
          Your purchases are now available in My Purchases
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/profile?tab=purchases">
            <Button variant="gradient" className="gap-2">
              View My Purchases
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">{itemCount} items</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <CartItemCard 
              key={item.productId} 
              item={item} 
              onRemove={() => removeItem(item.productId)}
              isProcessing={isProcessing}
              isPurchased={purchasedItems.includes(item.productId)}
              isCurrentlyPurchasing={checkoutStep === 'purchasing' && currentItemIndex === index}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items ({itemCount})</span>
                <span>{formatMneePrice(totalPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="gradient-text text-lg">{formatMneePrice(totalPrice)}</span>
              </div>

              {/* Status Messages */}
              {checkoutStep === 'approving' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving MNEE...
                </div>
              )}
              {checkoutStep === 'purchasing' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Purchasing {currentItemIndex + 1} of {items.length}...
                </div>
              )}
              {checkoutStep === 'error' && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage || 'An error occurred'}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              {!isConnected ? (
                <Button className="w-full" disabled>
                  Connect Wallet to Checkout
                </Button>
              ) : hasInsufficientBalance ? (
                <Button className="w-full" variant="destructive" disabled>
                  Insufficient MNEE Balance
                </Button>
              ) : checkoutStep === 'error' ? (
                <Button className="w-full" variant="outline" onClick={resetCheckout}>
                  Try Again
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  variant="gradient"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : needsApproval ? (
                    'Approve & Checkout'
                  ) : (
                    'Checkout'
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                {needsApproval 
                  ? 'You\'ll need to approve MNEE spending first'
                  : 'Each item will be purchased separately'
                }
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Item Card Component
 */
function CartItemCard({ 
  item, 
  onRemove, 
  isProcessing,
  isPurchased,
  isCurrentlyPurchasing,
}: { 
  item: CartItem; 
  onRemove: () => void;
  isProcessing: boolean;
  isPurchased: boolean;
  isCurrentlyPurchasing: boolean;
}) {
  const coverUrl = item.coverCid ? getCoverUrl(item.coverCid) : '';

  return (
    <Card className={isPurchased ? 'opacity-50' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {coverUrl && (
              <Image
                src={coverUrl}
                alt={item.productName}
                fill
                className="object-cover"
                unoptimized
              />
            )}
            {isPurchased && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            )}
            {isCurrentlyPurchasing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/products/${item.productId}`} className="hover:underline">
              <h3 className="font-semibold truncate">{item.productName}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">
              Seller: {truncateAddress(item.seller)}
            </p>
            <p className="font-semibold gradient-text mt-2">
              {formatMneePrice(item.price)}
            </p>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isProcessing || isPurchased}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

