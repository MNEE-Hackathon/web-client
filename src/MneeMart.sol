//SPDX License Identifier:MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MneeMart is Ownable(msg.sender), ReentrancyGuard
    {
    IERC20 public mneeToken;
    address public Martowner;
    uint256 public platformFeePercentage; // in basis points (100 = 1%)
    uint256 public productCounter;
    uint256 public platformBalance; // Accumulated platform fees
    
    struct Product {
        uint256 id;
        address seller;
        string cid; // IPFS CID
        uint256 price; // in MNEE tokens (with 18 decimals)
        string name;
        string description;
        bool active;
        uint256 salesCount;
    }
    
    struct Seller {
        uint256[] productIds;
        uint256 totalSales;
        uint256 balance; // Withdrawable balance
        uint256 totalEarnings;
    }
    mapping(uint256 => Product) public products;
    mapping(address => Seller) public sellers;
    mapping(address => mapping(uint256 => bool)) public hasPurchased; // buyer => productId => purchased
    mapping(uint256 => address[]) public productPurchasers; // productId => buyers array
    
    event ProductListed(uint256 indexed productId, address indexed seller, string cid, uint256 price);
    event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 price, uint256 platformFee);
    event SellerWithdrawal(address indexed seller, uint256 amount);
    event PlatformWithdrawal(address indexed owner, uint256 amount);
    
    modifier onlyMartOwner() {
        require(msg.sender == Martowner, "Only owner can call this");
        _;
    }
    constructor(address _mneeToken, uint256 _platformFeePercentage) {
        require(_mneeToken != address(0), "Invalid token address");
        require(_platformFeePercentage <= 2000, "Fee too high (max 20%)"); // Max 20%
        
        mneeToken = IERC20(_mneeToken);
        Martowner = msg.sender;
        platformFeePercentage = _platformFeePercentage;
        productCounter = 0;
        platformBalance = 0;
    }
    // List a new product (anyone can become a seller)
    function listProduct(
        string memory _cid,
        uint256 _price,
        string memory _name,
        string memory _description
    ) external returns (uint256) {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        productCounter++;
        
        products[productCounter] = Product({
            id: productCounter,
            seller: msg.sender,
            cid: _cid,
            price: _price,
            name: _name,
            description: _description,
            active: true,
            salesCount: 0
        });
        
        sellers[msg.sender].productIds.push(productCounter);
        
        emit ProductListed(productCounter, msg.sender, _cid, _price);
        
        return productCounter;
    }
    
    // Purchase a product with MNEE stablecoin
    function purchaseProduct(uint256 _productId) external {
        Product storage product = products[_productId];
        
        require(product.id != 0, "Product does not exist");
        require(product.active, "Product is not active");
        require(product.seller != msg.sender, "Cannot buy your own product");
        require(!hasPurchased[msg.sender][_productId], "Already purchased");
        
        uint256 platformFee = (product.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = product.price - platformFee;
        
        // Transfer MNEE tokens from buyer to contract
        require(
            mneeToken.transferFrom(msg.sender, address(this), product.price),
            "MNEE transfer failed"
        );
        
        // Update balances
        sellers[product.seller].balance += sellerAmount;
        platformBalance += platformFee;
        
        // Update purchase records
        hasPurchased[msg.sender][_productId] = true;
        productPurchasers[_productId].push(msg.sender);
        
        // Update statistics
        product.salesCount++;
        sellers[product.seller].totalSales++;
        sellers[product.seller].totalEarnings += sellerAmount;
        
        emit ProductPurchased(_productId, msg.sender, product.seller, product.price, platformFee);
    }
    
    // Seller withdraws their earnings
    function withdrawSellerBalance() external {
        uint256 amount = sellers[msg.sender].balance;
        require(amount > 0, "No balance to withdraw");
        
        sellers[msg.sender].balance = 0;
        
        require(
            mneeToken.transfer(msg.sender, amount),
            "MNEE withdrawal failed"
        );
        
        emit SellerWithdrawal(msg.sender, amount);
    }
    
    // Platform owner withdraws accumulated fees
    function withdrawPlatformFees() external onlyOwner {
        uint256 amount = platformBalance;
        require(amount > 0, "No platform fees to withdraw");
        
        platformBalance = 0;
        
        require(
            mneeToken.transfer(Martowner, amount),
            "MNEE withdrawal failed"
        );
        
        emit PlatformWithdrawal(Martowner, amount);
    }
    
    

    }