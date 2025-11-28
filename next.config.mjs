/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: false,
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
