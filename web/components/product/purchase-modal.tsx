'use client';

/**
 * PurchaseModal Component
 * Two-step purchase flow: Approve → Pay
 * 
 * - Button always shows "Buy Now"
 * - Modal shows step-by-step progress
 * - Default: exact approval (safer)
 * - Optional: unlimited approval (advanced)
 * - Handles allowance race condition (approve 0 then new amount)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Loader2, Check, AlertCircle, ChevronRight, ShieldAlert, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { mneeMartConfig, mneeTokenConfig } from '@/lib/contracts';
import { formatMneePrice, getErrorMessage } from '@/lib/utils';

// Maximum uint256 for unlimited approval
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

interface PurchaseModalProps {
  productId: number;
  price: bigint;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'initial' | 'approving' | 'approved' | 'purchasing' | 'success';

export function PurchaseModal({
  productId,
  price,
  productName,
  isOpen,
  onClose,
  onSuccess,
}: PurchaseModalProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  
  // State
  const [step, setStep] = useState<Step>('initial');
  const [useUnlimitedApproval, setUseUnlimitedApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...mneeTokenConfig,
    functionName: 'allowance',
    args: address && mneeMartConfig.address 
      ? [address, mneeMartConfig.address] 
      : undefined,
    query: {
      enabled: !!address && !!mneeMartConfig.address && isOpen,
    },
  });

  // Check user balance
  const { data: balance } = useReadContract({
    ...mneeTokenConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isOpen,
    },
  });

  // Write contracts
  const { 
    writeContract: writeApprove, 
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const { 
    writeContract: writePurchase, 
    data: purchaseHash,
    isPending: isPurchasePending,
    reset: resetPurchase,
  } = useWriteContract();

  // Wait for transactions
  const { isLoading: isWaitingApproval, isSuccess: approvalConfirmed } = 
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isWaitingPurchase, isSuccess: purchaseConfirmed } = 
    useWaitForTransactionReceipt({
      hash: purchaseHash,
    });

  // Derived states
  const needsApproval = allowance !== undefined && allowance < price;
  const hasInsufficientBalance = balance !== undefined && balance < price;
  const hasExistingAllowance = allowance !== undefined && allowance > 0n && allowance < price;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setError(null);
      resetApprove();
      resetPurchase();
    }
  }, [isOpen, resetApprove, resetPurchase]);

  // Handle approval confirmed
  useEffect(() => {
    if (approvalConfirmed && step === 'approving') {
      setStep('approved');
      refetchAllowance();
      // Auto-proceed to purchase
      handlePurchase();
    }
  }, [approvalConfirmed, step, refetchAllowance]);

  // Handle purchase confirmed
  useEffect(() => {
    if (purchaseConfirmed && step === 'purchasing') {
      setStep('success');
      toast({
        title: 'Purchase successful!',
        description: 'You can now decrypt and download the file.',
        variant: 'success',
      });
      // Call success callback after short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  }, [purchaseConfirmed, step, toast, onSuccess, onClose]);

  // Handle approve
  const handleApprove = useCallback(async () => {
    if (!address || !mneeMartConfig.address) return;

    setStep('approving');
    setError(null);

    try {
      // Determine approval amount
      const approvalAmount = useUnlimitedApproval ? MAX_UINT256 : price;

      // If there's existing non-zero allowance, first approve 0 to avoid race condition
      // This is the OpenZeppelin recommended approach
      if (hasExistingAllowance) {
        // First approve 0
        writeApprove({
          ...mneeTokenConfig,
          functionName: 'approve',
          args: [mneeMartConfig.address, 0n],
          gas: BigInt(100_000),
        }, {
          onSuccess: () => {
            // Then approve new amount
            setTimeout(() => {
              writeApprove({
                ...mneeTokenConfig,
                functionName: 'approve',
                args: [mneeMartConfig.address, approvalAmount],
                gas: BigInt(100_000),
              }, {
                onError: (err) => {
                  setError(getErrorMessage(err));
                  setStep('initial');
                  toast({
                    title: 'Approval failed',
                    description: getErrorMessage(err),
                    variant: 'destructive',
                  });
                },
              });
            }, 500);
          },
          onError: (err) => {
            setError(getErrorMessage(err));
            setStep('initial');
            toast({
              title: 'Approval failed',
              description: getErrorMessage(err),
              variant: 'destructive',
            });
          },
        });
      } else {
        // Normal approval
        writeApprove({
          ...mneeTokenConfig,
          functionName: 'approve',
          args: [mneeMartConfig.address, approvalAmount],
          gas: BigInt(100_000),
        }, {
          onError: (err) => {
            setError(getErrorMessage(err));
            setStep('initial');
            toast({
              title: 'Approval failed',
              description: getErrorMessage(err),
              variant: 'destructive',
            });
          },
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setStep('initial');
      toast({
        title: 'Approval failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  }, [address, price, useUnlimitedApproval, hasExistingAllowance, writeApprove, toast]);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!address) return;

    setStep('purchasing');
    setError(null);

    try {
      writePurchase({
        ...mneeMartConfig,
        functionName: 'purchaseProduct',
        args: [BigInt(productId)],
        gas: BigInt(300_000),
      }, {
        onError: (err) => {
          setError(getErrorMessage(err));
          setStep('initial');
          toast({
            title: 'Purchase failed',
            description: getErrorMessage(err),
            variant: 'destructive',
          });
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setStep('initial');
      toast({
        title: 'Purchase failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  }, [address, productId, writePurchase, toast]);

  // Start purchase flow
  const handleStartPurchase = useCallback(() => {
    if (hasInsufficientBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'You don\'t have enough MNEE to purchase this product.',
        variant: 'destructive',
      });
      return;
    }

    if (needsApproval) {
      handleApprove();
    } else {
      handlePurchase();
    }
  }, [needsApproval, hasInsufficientBalance, handleApprove, handlePurchase, toast]);

  const isProcessing = step !== 'initial' && step !== 'success';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'success' ? 'Purchase Complete!' : 'Complete Purchase'}
          </DialogTitle>
          <DialogDescription>
            {step === 'success' 
              ? 'Your file is ready for download.'
              : `Purchase "${productName}" for ${formatMneePrice(price)}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Steps Progress */}
          <div className="space-y-4">
            {/* Step 1: Approve (if needed) */}
            {needsApproval && (
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                step === 'approving' || isWaitingApproval
                  ? 'border-mnee-500 bg-mnee-500/10'
                  : step === 'approved' || step === 'purchasing' || step === 'success'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border bg-muted/50'
              }`}>
                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                  step === 'approved' || step === 'purchasing' || step === 'success'
                    ? 'bg-green-500 text-white'
                    : step === 'approving' || isWaitingApproval
                    ? 'bg-mnee-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step === 'approved' || step === 'purchasing' || step === 'success' ? (
                    <Check className="h-4 w-4" />
                  ) : step === 'approving' || isWaitingApproval ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Approve MNEE</p>
                  <p className="text-sm text-muted-foreground">
                    {step === 'approving' 
                      ? 'Confirm in your wallet...'
                      : isWaitingApproval
                      ? 'Waiting for confirmation...'
                      : 'Allow MeneeMart to spend your MNEE'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Arrow between steps */}
            {needsApproval && (
              <div className="flex justify-center">
                <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
              </div>
            )}

            {/* Step 2: Pay */}
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${
              step === 'purchasing' || isWaitingPurchase
                ? 'border-mnee-500 bg-mnee-500/10'
                : step === 'success'
                ? 'border-green-500 bg-green-500/10'
                : 'border-border bg-muted/50'
            }`}>
              <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                step === 'success'
                  ? 'bg-green-500 text-white'
                  : step === 'purchasing' || isWaitingPurchase
                  ? 'bg-mnee-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : step === 'purchasing' || isWaitingPurchase ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{needsApproval ? '2' : '1'}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">Pay with MNEE</p>
                <p className="text-sm text-muted-foreground">
                  {step === 'purchasing'
                    ? 'Confirm in your wallet...'
                    : isWaitingPurchase
                    ? 'Waiting for confirmation...'
                    : step === 'success'
                    ? 'Payment confirmed!'
                    : `Pay ${formatMneePrice(price)}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Unlimited Approval Option */}
          {needsApproval && step === 'initial' && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useUnlimitedApproval}
                  onChange={(e) => setUseUnlimitedApproval(e.target.checked)}
                  className="mt-1 rounded border-border"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Faster checkout (unlimited approval)
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Skip approval step for future purchases
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Unlimited approvals carry higher risk
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/50 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {step === 'success' && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/50 text-center">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 dark:text-green-400 font-medium">
                Purchase complete!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now decrypt and download your file.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'initial' && (
            <>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleStartPurchase}
                disabled={hasInsufficientBalance || isApprovePending || isPurchasePending}
                className="w-full sm:w-auto"
              >
                {hasInsufficientBalance ? (
                  'Insufficient MNEE Balance'
                ) : (
                  <>Confirm Purchase</>
                )}
              </Button>
            </>
          )}
          
          {isProcessing && (
            <Button variant="outline" disabled className="w-full">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          )}

          {step === 'success' && (
            <Button variant="gradient" onClick={onClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

