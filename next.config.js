/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      // Add your Supabase project domain here
      // e.g., 'youproject.supabase.co'
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
