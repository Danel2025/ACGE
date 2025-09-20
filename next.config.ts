import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configuration pour Vercel (déploiement dynamique)
  // output: 'export', // Commenté pour Vercel
  // trailingSlash: true, // Commenté pour Vercel
  // distDir: 'out', // Commenté pour Vercel
  
  // Exclure les scripts du linting pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Exclusions TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimisations pour la production
  compress: true,
  poweredByHeader: false,
  
  // Configuration des images pour Vercel - Optimisée
  images: {
    // Formats optimisés pour réduire les coûts et améliorer les performances
    formats: ['image/avif', 'image/webp'],
    // Qualités optimisées
    qualities: [75, 90],
    // Tailles d'images optimisées
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache TTL optimisé (31 jours)
    minimumCacheTTL: 2678400,
    // Patterns pour les images locales
    localPatterns: [
      {
        pathname: '/logo-tresor-public.svg',
        search: '',
      },
      {
        pathname: '/TrésorPublicGabon.jpg',
        search: '',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Désactiver l'optimisation pour les SVG (déjà optimisés)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuration expérimentale
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Optimiser les preloads
    optimizeCss: true,
    // Optimisations de performance
    optimizeServerReact: true,
  },
  
  // Packages externes pour le serveur
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Configuration des headers pour optimiser les preloads
  async headers() {
    return [
      // Headers généraux pour toutes les pages
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Headers de performance optimisés
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
          }
        ],
      },
      // Headers pour les images statiques (cache long)
      {
        source: '/logo-tresor-public.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Content-Type',
            value: 'image/svg+xml'
          }
        ],
      },
      {
        source: '/TrésorPublicGabon.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // Headers pour les polices (cache long)
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // Headers pour les assets Next.js (cache long)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // Headers pour les pages HTML (cache court avec revalidation)
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
          }
        ],
      },
    ]
  },
  
  // Optimisations SWC (déprécié dans Next.js 15)
  // swcMinify: true,
  
  // Configuration webpack simplifiée
  webpack: (config, { isServer }) => {
    // Résoudre le problème du loader
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;