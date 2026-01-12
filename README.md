## Inspiration

Too many creators are being quietly crushed by digital marketplaces.

Hidden fees. Sudden policy changes. Frozen accounts.  
One violation—often vague and retroactive—and years of work disappear overnight.

On a $50 sale, up to **25% vanishes** in listing fees, transactions fees, payment processing fees, and mandatory ads fees.  
Revenue, control, and customer relationships remain platform-owned, not creator-owned.

We built **MNEE Mart** to solve this — for us, and for millions of small business owners selling digital products online.

---

## What it does

**MNEE Mart** is a decentralized marketplace for selling digital products such as ebooks, courses, software, and media. It enables **peer-to-peer commerce** with **cryptographic access control**, ensuring trustless payments, permanent ownership, and secure content delivery without centralized intermediaries.


Creators can:
- List and sell digital products on-chain  
- Get paid instantly in **MNEE stablecoin**  
- Own their storefront, customers, and profits  
- Deliver content securely using cryptographic access control  

Buyers get instant, permanent access to what they purchase — no subscriptions, no lock-ins.

---
## MNEE Assets
- Deployment Address: https://etherscan.io/address/0x0e6e5a1baa4768668976070138392e9b2f9ab432
- Track: Commerce & Creator Tools
- Youtube Video: https://youtu.be/_fgiqyFY19w?si=tLtcbemBZqPjT1rM
- Pitch Deck: https://www.canva.com/design/DAG-NUlXTO0/nGqRkyuyYfMrbi7KekdOoQ/edit?utm_content=DAG-NUlXTO0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton
- Demo URL: https://mneemart.vercel.app/

## How we built it

- **Smart Contracts (Solidity):** Core marketplace logic for listings, purchases, payments, and withdrawals  
- **Ethereum Mainnet:** Permissionless, censorship-resistant settlement  
- **MNEE ERC-20 Stablecoin:** Instant, chargeback-free payments  
- **IPFS:** Decentralized, immutable storage for encrypted content  
- **Lit Protocol:[MIT License]** Token-gated encryption ensuring only buyers can access content  
- **Next.js / React Frontend:** Wallet-based UX for sellers and buyers  

Everything is designed to be transparent, trust-minimized, and fully on-chain where it matters.

---

## Challenges we ran into

- We planned on IPFS for decentralized storage of the product assets. However, all IPFS links are publicly accessible or can be retrieved from the transaction history when the product is created. We initially explored solutions using encrypted keys; however, we discovered Lit Protocol and were able to integrate it for decryption based on specific conditions (in our case, purchase verification). This was a huge advantage over our previous solution, since Lit is also decentralized, further strengthening our protocol.
- Optimizing gas usage while keeping contracts readable and auditable 

---

## 🏗️ Architecture Overview

MneeMart follows a **layered decentralized architecture** designed for security, scalability, and transparency.

### 1️⃣ Smart Contract Layer (Solidity)
**Core:** `MneeMart.sol`

- Manages product listings, purchases, balances, and withdrawals
- Built on **OpenZeppelin** standards:
  - `Ownable`
  - `ReentrancyGuard`
- **ERC-20 (MNEE Stablecoin)** integration for payments
- Gas-optimized storage using `mapping`-based data structures
- Fully on-chain accounting for sellers and platform fees

---

### 2️⃣ Web Application Layer (Next.js / React)
- Modern **Next.js + React** frontend
- Written in **TypeScript** for type safety
- Wallet integration (Wagmi / Web3Modal compatible)
- API routes for off-chain metadata and UX optimization
- Component-based, responsive UI
- Real-time notifications for:
  - Successful listings
  - Purchases
  - Withdrawals

---

### 3️⃣ Encryption & Access Control Layer (Lit Protocol)
- Decentralized key management
- **Token-gated access control**
- Purchase-based on-chain verification
- Only verified buyers can decrypt purchased content
- Eliminates centralized content servers

---

### 4️⃣ Storage Layer (IPFS)
- Distributed file storage using **Content Identifiers (CIDs)**
- Immutable addressing
- Encrypted content stored on IPFS
- Decryption only after successful on-chain verification

---

## 🎯 Core Features

### 1️⃣ Product Listing & Management (Sellers)

- List digital products with:
  - Encrypted IPFS CID
  - Price in MNEE
  - Product name
- Update pricing anytime
- Activate / deactivate products without deletion
- Share **personal store link** listing only seller’s products
- Receive traffic from:
  - Seller’s own promotions
  - MneeMart marketplace discovery
- View sales analytics
- Maintain permanent on-chain sales history
- Seller dashboard with full product portfolio

---

### 2️⃣ Secure Purchase System (Buyers)

- Browse all active marketplace products
- One-click purchase using MNEE tokens
- Instant access after purchase confirmation
- On-chain purchase history
- Permanent ownership (no subscriptions or expiry)

---

### 3️⃣ Automated Payment Distribution

**Revenue Split (Atomic Transaction)**

- Platform fee: configurable (currently 10%, capped at 20%)
- Seller earnings calculated automatically
- Real-time balance updates


---

### 4️⃣ Withdrawal System

#### Sellers
- Withdraw earnings anytime
- Batch multiple sales for gas efficiency
- No lockup — 100% withdrawable balance
- Direct wallet transfer

#### Platform Owner
- Withdraw accumulated platform fees
- Fully transparent and auditable treasury

---

### 5️⃣ Encrypted Content Delivery

#### Access Control Design
- Encrypted content stored on IPFS
- Lit Protocol handles encryption/decryption
- Token-gated access based on purchase verification
- Sellers always retain access to their own product CIDs
- Buyers retain **permanent access**

#### Content Delivery Flow
1. Seller encrypts content with Lit Protocol
2. Access condition: **Must have purchased Product ID**
3. Encrypted file uploaded to IPFS → CID generated
4. CID listed on-chain via MneeMart
5. Buyer purchases product
6. Buyer calls `getProductCID(productId)`
7. Lit Protocol verifies purchase
8. Content decrypts in-browser
9. Buyer downloads or streams content

---

### 6️⃣ Product Discovery

Publicly visible product data:
- Product name
- Price (MNEE, 18 decimals)
- Seller address
- Total sales count
- Active/inactive status
- Search by product name

---

### 7️⃣ Seller Dashboard

**Analytics & Insights**
- Total sales count (lifetime)
- Total earnings
- Withdrawable balance
- Product-wise performance
- Complete product portfolio

---

## 🔄 Workflow

### 1️⃣ Product Creation & Listing (Seller)

#### Step 1: Prepare & Encrypt Content
- Create digital product (ebook, course, template, etc.)
- Encrypt using Lit Protocol
- Access condition:  
  **“Must own Product ID on MneeMart”**
- Upload encrypted file to IPFS (Pinata)
- Receive CID

#### Step 2: List on Marketplace
- Connect wallet
- Call `listProduct(cid, price, name)`
- Smart contract:
  - Creates product record
  - Assigns unique Product ID
- Product appears on:
  - Main marketplace
  - Seller’s personal store page

#### Step 3: Promote
- Share personal store link on socials
- Gain traffic from MneeMart discovery

---

### 2️⃣ Purchase Process (Buyer)

#### Step 1: Discovery
- Browse marketplace or seller store
- View product details:
  - Name
  - Price
  - Seller
  - Sales count

#### Step 2: Purchase
- Approve MNEE token (one-time)
- Click **Buy Now**
- Smart contract:
  - Calculates platform fee
  - Updates balances
  - Transfers payment to contract
  - Records purchase on-chain

---

### 3️⃣ Content Access (Buyer)

1. Open **My Purchases**
2. Click **Download**
3. Frontend calls `getProductCID(productId)`
4. Contract verifies purchase
5. Encrypted file fetched from IPFS
6. Lit Protocol verifies access
7. Content decrypts in browser
8. Permanent access granted

---

### 4️⃣ Earnings Withdrawal (Seller)

1. View balance in dashboard
2. Click **Withdraw Earnings**
3. Call `withdrawSellerBalance()`
4. MNEE transferred instantly to wallet

---

### 5️⃣ Platform Management (Owner)

- Monitor marketplace activity
- Withdraw platform fees
- Update platform fee percentage (≤ 20%)

---


## Accomplishments that we're proud of

- Fully deployed and live **on Ethereum Mainnet**  
- Instant checkouts with MNEE based ecommerce onchain
- Permanent, cryptographically enforced content ownership  
- Seller-owned storefronts without platform dependency  
- Zero custody of user funds — creators always stay in control
- Truely Permissionless

---

## What we learned

- Reading a lot of reddit posts about selling digital products, Creators value **predictability and ownership** .  
- Discovered MNEE and it's programmability, now we are lined up with a lot of ideas about it. 

---

## What's next for MNEE Mart

- Account abstraction for easier onboarding and social logins  
- Security audits and protocol hardening  
- Sponsored product discovery on the marketplace  
- Affiliate and referral systems for creator growth  
- Scaling creator tools and analytics  
---

## 📜 License
MIT License

---

## 🌐 Vision
MneeMart aims to redefine digital commerce by making **ownership permanent**, **payments trustless**, and **content access cryptographically secure** — all without centralized control.

---
---

## 👥 The Team

- **Hema Devi** — Smart Contract Developer  
  🔗 https://www.linkedin.com/in/hema-devi-u/

- **Kun** — Full Stack Developer  
  🔗 https://www.linkedin.com/in/haokun-s-4634a2389/

---

## 📞 Product Support

For product support, integrations, or technical queries, please reach out to **Hema**:  
💬 Telegram: http://t.me/HemaDeviU



