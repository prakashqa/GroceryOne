/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@groceryone/shared', '@groceryone/store', '@groceryone/i18n'],
};

module.exports = nextConfig;
