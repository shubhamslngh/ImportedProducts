# Headless WordPress → Next.js Flow

This document outlines how the Next.js storefront in `next-app/` operates as the headless front end for a WordPress + WooCommerce backend, and what needs to be configured in both systems for the integration to work end to end.

## 1. Prepare WordPress / WooCommerce

1. **Install required plugins**
   - [WPGraphQL](https://www.wpgraphql.com/)
   - [WPGraphQL for WooCommerce](https://github.com/wp-graphql/wp-graphql-woocommerce)
   - Optional but recommended: authentication helpers such as WPGraphQL JWT Authentication for the `/api/login` mutation flow.
2. **Enable pretty permalinks** so the GraphQL endpoint is available at `https://<site>/graphql`.
3. **Ensure WPGraphQL for WooCommerce is active** so mutations like `addToCart` are available to the frontend.
4. **Harden CORS**: allow the storefront origin to call the `/graphql` endpoint.

## 2. Configure the Next.js app

1. Define the storefront endpoints in `.env`:
   ```
   NEXT_WP_GRAPHQL_ENDPOINT=https://importedproducts.in/graphql
   NEXT_WC_API_BASE=https://importedproducts.in/wp-json/wc/v3
   NEXT_WC_CONSUMER_KEY=ck_xxx
   NEXT_WC_CONSUMER_SECRET=cs_xxx
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   ```
   The Next.js config mirrors the non-public values to `NEXT_PUBLIC_*` counterparts where required so the client bundle can reach WPGraphQL without re-declaring secrets.
2. Install dependencies and run locally:
   ```bash
   cd /Users/shubhamsingh/namma/next-app
   npm install
   npm run dev
   ```
3. The Apollo client reads the GraphQL URL and provides it to all client-side queries via `components/providers.tsx`.

## 3. Data fetching flow

```
WordPress (content + WooCommerce data)
        │ exposes via WPGraphQL
        ▼
Next.js Apollo Client (`lib/apollo-client.ts`)
        │ supplies data to React components
        ▼
UI components (`CategoryExplorer`, `ProductGrid`, `ProductDetailClient`, etc.)
```

- `lib/apollo-client.ts` creates a client-side `ApolloClient` that points to the WordPress GraphQL endpoint and shares it through React context so all components can query data without manual wiring.
- `lib/queries.ts` centralizes the GraphQL documents used across the app:
  - `GET_CATEGORIES` powers the home page’s category rail.
  - `GET_PRODUCTS_BY_CATEGORY` populates product grids.
  - `GET_PRODUCT_DETAIL` and `GET_PRODUCT_VARIATIONS` drive the PDP experience.
- Components such as `CategoryExplorer` and `ProductGrid` call `useQuery` with these documents to hydrate UI blocks entirely from WordPress-sourced data.
- The `/product/[id]/page.tsx` route renders `ProductDetailClient`, which fetches PDP data, renders gallery/attributes, and wires up the variations selector + cart CTA.

## 4. Cart + checkout flow

```
AddToCartButton (client component)
        │
        ├─ invokes the WPGraphQL `addToCart` mutation through Apollo Client
        ▼
WordPress GraphQL endpoint (`/graphql`)
```

1. When shoppers click “Add to cart”, the client component calls the WPGraphQL `addToCart` mutation directly with the product + variation IDs.
2. WooCommerce processes the line item inside the shopper’s session (since the request originates from the browser).
3. On success, the `CartProvider` updates local state so the UI instantly reflects the cart addition while WordPress/WooCommerce maintains the authoritative cart.

### Checkout

- `/checkout/page.tsx` fetches the authenticated cart (`GET_CART`), fetches live shipping methods through the REST proxy `/api/shipping/methods` (which relays `WC_CONSUMER_KEY/SECRET` to `wc/v3/shipping_methods`), and surfaces PayPal buttons via `@paypal/react-paypal-js`.
- The PayPal integration needs `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (can be a sandbox ID). Shipping is required before enabling payment.

## 5. Account dashboard

- The `/account/page.tsx` screen requires an authenticated session (JWT from WPGraphQL login/signup).
- It queries `customer(customerId: $id)` via `GET_ACCOUNT_OVERVIEW` to render profile, addresses, and recent orders.
- The `customerId` comes from the logged-in user’s `databaseId`, returned by the `login` mutation and persisted in the session context.

## 6. Authentication flow (optional)

`/api/login/route.ts` proxies a WPGraphQL `login` mutation. Provide valid WP user credentials, and the endpoint returns the `authToken` + `refreshToken` for use in subsequent authenticated GraphQL calls. Ensure the WP site trusts the storefront origin and supports the chosen token strategy (JWT, session cookies, etc.).

## 7. Deployment checklist

1. Build the Next app (`npm run build`) and deploy the `.next` output plus package metadata to your hosting provider.
2. Set the same environment variables in the hosting dashboard.
3. Confirm the production URL is whitelisted in WordPress CORS/REST settings.
4. Smoke test:
   - Load the landing page and verify categories/products render.
   - Visit a PDP and fetch variations.
   - Add to cart and confirm WooCommerce receives the line item.
   - (If enabled) Run the login mutation.

With these pieces in place, the Next.js project serves as a purely headless front end that consumes WordPress content and WooCommerce commerce data over GraphQL/REST while keeping WordPress responsible for editorial workflows.
