import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local sample placeholders are SVG; safe since they're same-origin,
    // committed files (not user-uploaded).
    dangerouslyAllowSVG: true,
    remotePatterns: [
      // Real product photos come from the backend's S3 bucket / presigned URLs.
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'api.drista.in' },
    ],
  },
};

export default nextConfig;
