/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para Service Workers
  headers: async () => {
    return [
      {
        source: '/automix-worker.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // Redirect all non-API routes to the static shell
  rewrites: async () => {
    return [
      {
        source: "/((?!api/).*)",
        destination: "/static-app-shell",
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };
    
    // Agregar soporte para CSS modules
    config.module.rules.push({
      test: /\.(css|scss)$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });

    return config;
  },
}

export default nextConfig
