/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression for responses
  compress: true,

  // Remove the X-Powered-By: Next.js header (minor security improvement)
  poweredByHeader: false,

  experimental: {
    // Tree-shake large packages to reduce bundle size
    optimizePackageImports: ['@google/generative-ai', '@supabase/supabase-js'],
  },
};

export default nextConfig;
