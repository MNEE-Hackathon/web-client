/**
 * Contract ABIs
 * Generated from Foundry build output
 */

/**
 * MneeMart Contract ABI
 * Core marketplace functionality
 */
export const MneeMartAbi = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: '_mneeToken', type: 'address', internalType: 'address' },
      { name: '_platformFeePercentage', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  // Read Functions
  {
    type: 'function',
    name: 'productCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'products',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      { name: 'seller', type: 'address', internalType: 'address' },
      { name: 'cid', type: 'string', internalType: 'string' },
      { name: 'price', type: 'uint256', internalType: 'uint256' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'active', type: 'bool', internalType: 'bool' },
      { name: 'salesCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasUserPurchased',
    inputs: [
      { name: '_user', type: 'address', internalType: 'address' },
      { name: '_productId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSellerProducts',
    inputs: [{ name: '_seller', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProductCID',
    inputs: [{ name: '_productId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProduct',
    inputs: [{ name: '_productId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      { name: 'seller', type: 'address', internalType: 'address' },
      { name: 'price', type: 'uint256', internalType: 'uint256' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'active', type: 'bool', internalType: 'bool' },
      { name: 'salesCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'sellers',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'totalSales', type: 'uint256', internalType: 'uint256' },
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'totalEarnings', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mneeToken',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformFeePercentage',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  // Write Functions
  {
    type: 'function',
    name: 'listProduct',
    inputs: [
      { name: '_cid', type: 'string', internalType: 'string' },
      { name: '_price', type: 'uint256', internalType: 'uint256' },
      { name: '_name', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'purchaseProduct',
    inputs: [{ name: '_productId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawSellerBalance',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'activateProduct',
    inputs: [{ name: '_productId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deactivateProduct',
    inputs: [{ name: '_productId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateProductPrice',
    inputs: [
      { name: '_productId', type: 'uint256', internalType: 'uint256' },
      { name: '_newPrice', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'ProductListed',
    inputs: [
      { name: 'productId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'seller', type: 'address', indexed: true, internalType: 'address' },
      { name: 'cid', type: 'string', indexed: false, internalType: 'string' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProductPurchased',
    inputs: [
      { name: 'productId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'seller', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SellerWithdrawal',
    inputs: [
      { name: 'seller', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProductDeactivated',
    inputs: [
      { name: 'productId', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProductActivated',
    inputs: [
      { name: 'productId', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProductPriceUpdated',
    inputs: [
      { name: 'productId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'newPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  // Errors
  {
    type: 'error',
    name: 'Mart_InvalidTokenAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Mart_PlatformFeeTooHigh',
    inputs: [
      { name: 'provided', type: 'uint256', internalType: 'uint256' },
      { name: 'maxAllowed', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'EmptyCID',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPrice',
    inputs: [{ name: 'price', type: 'uint256', internalType: 'uint256' }],
  },
  {
    type: 'error',
    name: 'EmptyName',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ProductDoesNotExist',
    inputs: [{ name: 'productId', type: 'uint256', internalType: 'uint256' }],
  },
  {
    type: 'error',
    name: 'ProductNotActive',
    inputs: [{ name: 'productId', type: 'uint256', internalType: 'uint256' }],
  },
  {
    type: 'error',
    name: 'CannotBuyOwnProduct',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ProductAlreadyPurchased',
    inputs: [{ name: 'productId', type: 'uint256', internalType: 'uint256' }],
  },
  {
    type: 'error',
    name: 'NoBalanceToWithdraw',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AccessDenied',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotProductSeller',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ProductAlreadyInactive',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ProductAlreadyActive',
    inputs: [],
  },
] as const;

/**
 * ERC20 Token ABI (MNEE)
 * Standard ERC20 interface for token operations
 */
export const Erc20Abi = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

