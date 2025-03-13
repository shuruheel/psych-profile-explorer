/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USERNAME: process.env.NEO4J_USERNAME,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
  },
};

module.exports = nextConfig; 