import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  /** 开发模式降低并行编译并发，减轻低内存机器上 next dev 的 RSS 峰值（略慢于默认） */
  webpack: (config, { dev }) => {
    if (dev && typeof config.parallelism === "number") {
      config.parallelism = Math.min(config.parallelism, 4);
    } else if (dev) {
      config.parallelism = 4;
    }
    return config;
  },
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "tesseract.js"],
  // 知识库「上传并向量化」通过 Server Action 传 multipart，默认 1MB 会导致常见 PDF 触发 413
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
