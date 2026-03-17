import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/skamba',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// import type { NextConfig } from 'next';

// const isProd = process.env.NODE_ENV === 'production';

// const nextConfig: NextConfig = {
//   output: 'export',
//   basePath: isProd ? '/skamba_demo' : '',
//   assetPrefix: isProd ? '/skamba_demo' : '',
//   trailingSlash: true,
//   images: {
//     unoptimized: true,
//   },
// };

// export default nextConfig;
