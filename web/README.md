# MneeMart - Pay-to-Decrypt Web3 Marketplace





---

## Tech Stack (3 bullets)

1. **Frontend**: Next.js + Wagmi + RainbowKit. React components with Context + localStorage (scoped by wallet address)
2. **Storage**: Pinata IPFS with directory structure (metadata.json + cover.png + asset.enc). One RootCID per product
3. **Encryption**: Lit Protocol Pay-to-Decrypt with EVM conditions using `hasUserPurchased` for access control

**Minimal serverless**: Pinata JWT only used in API route (`/api/pinata/upload`), never exposed to client. Everything else is client-side, no database.

---

## Key Highlights (by importance)

### 1. Pay-to-Decrypt Workflow (Core Feature)

Encrypt in browser → Upload to IPFS (encrypted only) → Purchase on-chain → Lit verifies purchase → Decrypt & download

**Why it matters**: This is what makes us different from regular marketplaces. Not "buy and get a link", but "buy to unlock encrypted files". Content protection is complete - IPFS gateways can't see plaintext.

**Tech details**: Lit Protocol Unified Access Control Conditions using `hasUserPurchased(productId)` as decryption condition.

---

### 2. RootCID Directory Structure

Each product is one IPFS directory (RootCID) containing:
- `metadata.json` (title, description, Lit config)
- `cover.png` (cover image)
- `asset.enc` (encrypted file)

Benefits: Easy migration (one CID), clear audit trail (directory structure is self-explanatory), clean presentation (cover and metadata separated).

---

### 3. Mainnet Compliance + Sepolia Demo

- **Mainnet**: Only 1-2 real transactions as proof of concept (list + purchase), using official MNEE contract address
- **Sepolia**: All demo flows on testnet - low cost, retry-friendly

This proves mainnet works while allowing full feature demos.

---

### 4. Minimal Serverless (No Traditional Backend)

Pinata JWT is a secret, can't be in client code. We use Next.js API route (`/api/pinata/upload`) as upload proxy.

**Not a "backend service"**: No database, no user system, just minimal security boundary. Everything else (IPFS reads, contract calls, Lit decryption) happens in browser.

---

### 5. Shopping Cart + Batch Purchase

Added shopping cart (localStorage, scoped by wallet address) even though it wasn't in requirements. Supports batch purchase - one approve, then purchase items one by one.

**UX benefit**: Don't need to approve for each product, can add to cart and buy together.

---

**Technological Implementation**:
-  MNEE payments (Sepolia + Mainnet)
-  Lit Protocol conditional decryption
-  IPFS directory packaging
-  Event indexing (ProductPurchased events drive UI)

**Design / UX**:
-  Clear wallet interactions (Approve → Buy → Decrypt)
-  Error handling (toasts, retries, loading states)
-  Responsive design (mobile-friendly)
-  Shopping cart, search, seller store pages

**Impact / Usefulness**:
-  Solves IPFS public links causing piracy
-  Supports creator teams (can use Safe/Split addresses as seller)

**Originality**:
-  Pay-to-Decrypt, not a regular marketplace
-  Complete workflow: Lit + IPFS + on-chain payment



---

## Code Structure

```
app/
  page.tsx              # Homepage (product list + search)
  products/[id]/page.tsx  # Product detail (purchase + decrypt)
  create/page.tsx        # Create product (encrypt + upload)
  cart/page.tsx          # Shopping cart (batch purchase)
  profile/page.tsx       # Profile (my listings, purchase history)
  store/[address]/page.tsx  # Seller store page
lib/
  services/
    lit.ts              # Lit encryption/decryption
    pinata.ts           # IPFS upload/fetch
  hooks/
    use-cart.tsx        # Cart state
    use-purchases.tsx   # Purchase history (event indexing)
components/
  product/
    purchase-modal.tsx  # Purchase flow (two-step: approve → buy)
```