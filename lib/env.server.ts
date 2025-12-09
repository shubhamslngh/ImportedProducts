const DEFAULT_WP_BASE_URL = 'https://importedproducts.in';
const DEFAULT_WP_GRAPHQL_ENDPOINT = `${DEFAULT_WP_BASE_URL}/graphql`;
const DEFAULT_WC_API_BASE = `${DEFAULT_WP_BASE_URL}/wp-json/wc/v3`;
const DEFAULT_IMAGE_SEARCH_ENDPOINT = 'https://api.unsplash.com/search/photos';

const resolve = (value?: string | null, fallback?: string) =>
  value && value.length > 0 ? value : fallback ?? undefined;

export const SERVER_WP_BASE_URL =
  resolve(process.env.NEXT_WP_BASE_URL) ??
  resolve(process.env.NEXT_PUBLIC_WP_BASE_URL) ??
  DEFAULT_WP_BASE_URL;

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

export const SERVER_IMAGE_SEARCH_ENDPOINT =
  resolve(process.env.SERVER_IMAGE_SEARCH_ENDPOINT) ??
  resolve(process.env.NEXT_SERVER_IMAGE_SEARCH_ENDPOINT) ??
  resolve(process.env.NEXT_PUBLIC_IMAGE_SEARCH_ENDPOINT) ??
  DEFAULT_IMAGE_SEARCH_ENDPOINT;

export const SERVER_IMAGE_SEARCH_KEY =
  resolve(process.env.SERVER_IMAGE_SEARCH_KEY) ??
  resolve(process.env.NEXT_SERVER_IMAGE_SEARCH_KEY) ??
  resolve(process.env.NEXT_PUBLIC_IMAGE_SEARCH_KEY) ??
  resolve(process.env.UNSPLASH_ACCESS_KEY);

export const WP_MEDIA_USERNAME = resolve(process.env.WP_MEDIA_USERNAME);
export const WP_MEDIA_PASSWORD = resolve(process.env.WP_MEDIA_PASSWORD);

export const SERVER_WP_MEDIA_ENDPOINT = `${SERVER_WP_BASE_URL}/wp-json/wp/v2/media`;
