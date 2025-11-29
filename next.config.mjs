const DEFAULT_WP_GRAPHQL_ENDPOINT = 'https://importedproducts.in/graphql';
const DEFAULT_WC_API_BASE = 'https://importedproducts.in/wp-json/wc/v3';

const wpGraphQLEndpoint = process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT || process.env.NEXT_WP_GRAPHQL_ENDPOINT || DEFAULT_WP_GRAPHQL_ENDPOINT;
const wcApiBase = process.env.NEXT_PUBLIC_WC_API_BASE || process.env.NEXT_WC_API_BASE || DEFAULT_WC_API_BASE;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT: wpGraphQLEndpoint,
    NEXT_PUBLIC_WC_API_BASE: wcApiBase,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'importedproducts.in',
        pathname: '/**'
      },
    ],
  },
};

export default nextConfig;
