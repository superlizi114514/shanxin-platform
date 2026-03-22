import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Server configuration
  experimental: {
    // Force specific port
  },

  // Fix for pdfjs-dist worker loading in Turbopack
  transpilePackages: ['pdfjs-dist', 'pdf-parse'],

  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      'pdf.worker.mjs': path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs'),
    },
  },

  // Configure webpack for compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdf.worker.mjs': path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs'),
      };

      // Provide DOMMatrix globally for pdfjs-dist
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 0; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
    }
    multiply() { return this; }
    transformPoint(point) { return { x: point.x, y: point.y }; }
  };
}
          `,
          raw: true,
          entryOnly: true,
        })
      );
    }
    return config;
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable minification for production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable powered-by header removal for security
  poweredByHeader: false,

  // Enable HTTP headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
