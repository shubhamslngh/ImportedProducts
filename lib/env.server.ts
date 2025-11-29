const DEFAULT_WP_GRAPHQL_ENDPOINT = 'https://importedproducts.in/graphql';
const DEFAULT_WC_API_BASE = 'https://importedproducts.in/wp-json/wc/v3';

const resolve = (value?: string | null, fallback?: string) =>
  value && value.length > 0 ? value : fallback ?? undefined;

export const SERVER_WP_GRAPHQL_ENDPOINT =
  resolve(process.env.NEXT_WP_GRAPHQL_ENDPOINT) ??
  resolve(process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT) ??
  DEFAULT_WP_GRAPHQL_ENDPOINT;

export const SERVER_WC_API_BASE =
  resolve(process.env.NEXT_WC_API_BASE) ??
  resolve(process.env.NEXT_PUBLIC_WC_API_BASE) ??
  DEFAULT_WC_API_BASE;

export const SERVER_WC_SHIPPING_ENDPOINT =
  resolve(process.env.NEXT_WC_SHIPPING_ENDPOINT) ??
  resolve(process.env.WC_SHIPPING_ENDPOINT);

export const SERVER_WC_CONSUMER_KEY = resolve(process.env.NEXT_WC_CONSUMER_KEY) ?? resolve(process.env.WC_CONSUMER_KEY);
export const SERVER_WC_CONSUMER_SECRET =
  resolve(process.env.NEXT_WC_CONSUMER_SECRET) ?? resolve(process.env.WC_CONSUMER_SECRET);
