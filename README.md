# Imported Products — Next.js edition

A fresh App Router build of the Imported Products storefront that consumes the existing WooCommerce/WordPress (WPGraphQL) APIs entirely from the client. It mirrors the Nuxt experience (hero, categories, spotlight grid, product detail + variations, concierge copy) while preparing for Hostinger-compatible deployments.

## Stack

- Next.js 14 App Router (all UI rendered via client components for Hostinger hosting)
- React 18 + Tailwind CSS
- Apollo Client + WPGraphQL endpoint (`https://importedproducts.in/graphql`)
- TypeScript-first setup with ESLint + Next rules

## Getting started

```bash
cd next-app
pnpm install   # or npm install
pnpm dev       # starts http://localhost:3000
```

### Environment variables

The storefront (data + cart mutations) talks to `https://importedproducts.in/graphql`, the same endpoint used by the Nuxt build. To enable WooCommerce REST fallbacks, shipping methods, and PayPal sandbox, set:

```
WC_CONSUMER_KEY=ck_xxx
WC_CONSUMER_SECRET=cs_xxx
WC_API_BASE=https://importedproducts.in/wp-json/wc/v3
# Optional: override when you only want to hit one zone endpoint
WC_SHIPPING_ENDPOINT=https://importedproducts.in/wp-json/wc/v3/shipping/zones/1/methods
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

If `WC_SHIPPING_ENDPOINT` is not provided the app walks through every zone from `WC_API_BASE` and normalizes the rate IDs (`flat_rate:INSTANCE_ID`). PayPal defaults to the `'test'` client when no key is set, so remember to provide a real sandbox/production client ID per environment.

## Project structure

```
next-app/
├─ app/
│  ├─ page.tsx                # Landing page with hero + categories
│  ├─ products/page.tsx       # Catalog index (mirrors Nuxt /products)
│  ├─ product/[id]/page.tsx   # Dynamic product detail route
│  ├─ account/page.tsx        # Authenticated account dashboard
│  └─ checkout/page.tsx       # Shipping selection + PayPal checkout
├─ components/
│  ├─ HeroSection.tsx
│  ├─ CategoryExplorer.tsx
│  ├─ ProductGrid.tsx
│  ├─ ProductDetailClient.tsx
│  ├─ VariationsPanel.tsx
│  ├─ AddToCartButton.tsx     # GraphQL cart mutation integration
│  └─ providers.tsx           # Apollo provider wrapper
├─ lib/
│  ├─ apollo-client.ts        # Client-side Apollo instance
│  └─ queries.ts              # Shared GraphQL documents
├─ tailwind.config.ts, tsconfig.json, etc.
```

## Deploying on Hostinger

1. Build the static bundle: `pnpm build`.
2. Upload the `.next`, `package.json`, and lockfile to Hostinger (or use their Git integration).
3. Set Node 18 runtime, install deps (`npm install --production`), and run `next start`.
4. Configure environment variables for secure endpoints once WooCommerce credentials are ready.

Happy shipping!
