import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "tesseract.js"],
};

export default nextConfig;
