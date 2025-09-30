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
  
  // Configuration expérimentale optimisée pour Turbopack
  experimental: {
    // 📦 Optimisations des imports de packages - Basé sur Vercel 2025
    optimizePackageImports: [
      // Radix UI components (40% cold start improvement)
      '@radix-ui/react-icons',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      // Icons - CRITICAL pour éviter les erreurs HMR
      'lucide-react',
      // Analytics et performance
      '@vercel/analytics',
      '@vercel/speed-insights',
      // Utilitaires
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      // Date utilities
      'date-fns',
      // Forms
      'react-hook-form',
      '@hookform/resolvers',
      // Notifications
      'sonner',
    ],
    // Optimiser les preloads CSS
    optimizeCss: true,
    // Optimisations de performance React
    optimizeServerReact: true,
    // Optimisations de mémoire
    memoryBasedWorkersCount: true,
    // ✨ Optimisations Turbopack stables pour Next.js 15.5.4
    // Configuration simplifiée pour éviter les conflits de parsing

    // 🚀 Partial Prerendering (PPR) - À activer avec une version canary
    // ppr: 'incremental', // Nécessite Next.js canary
  },

  // Configuration Turbopack
  turbopack: {
    // Configuration des resolve aliases pour Turbopack
    resolveAlias: {
      '@': './src',
      '@components': './src/components',
      '@lib': './src/lib',
      '@hooks': './src/hooks',
      '@types': './src/types',
      '@contexts': './src/contexts',
    },
    // Extensions de résolution pour éviter les erreurs HMR
    resolveExtensions: [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
  
  // Packages externes pour le serveur
  serverExternalPackages: ['@supabase/supabase-js'],

  // Configuration pour éviter les problèmes HMR avec Lucide React
  transpilePackages: [],
  
  // Configuration des headers pour optimiser les preloads
  async headers() {
    return [
      // ===== ORDRE IMPORTANT : Règles spécifiques d'abord =====

      // 1. Assets statiques immuables (cache très long)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
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

      // 2. Routes API : PAS DE CACHE (crucial pour les données en temps réel)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },

      // 3. Pages dynamiques protégées : Pas de cache
      {
        source: '/(dashboard|cb-dashboard|ordonnateur-dashboard|ac-dashboard|folders|documents|users)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },

      // 4. Pages HTML générales : Cache court avec revalidation
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, no-cache, stale-while-revalidate=3600'
          },
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