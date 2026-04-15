/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kangying.com.tw',
      },
    ],
  },
}

module.exports = nextConfig
