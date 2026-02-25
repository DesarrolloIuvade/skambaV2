// import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   async rewrites() {
//     return [
//       {
//         source: '/api/sk/:path*',
//         destination: 'https://sm.plataformasvirtuales.pe/sk_demo/api/:path*',
//       },
//     ];
//   },
// };

// export default nextConfig;

import type { NextConfig } from 'next';
const NextConfig: NextConfig = {
  output: 'export',
  basePath: '/skamba_demo',
  assetPrefix: '/skamba_demo',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default NextConfig;
