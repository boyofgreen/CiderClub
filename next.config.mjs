/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['square'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
  },
  // Preserve inbound links from the retired Squarespace site
  async redirects() {
    return [
      { source: '/private-tastings-comfort-tx', destination: '/saturdays-in-comfort', permanent: true },
      { source: '/join-the-club', destination: '/club', permanent: true },
      { source: '/faqs', destination: '/apple-trees', permanent: true },
    ]
  },
}

export default nextConfig
