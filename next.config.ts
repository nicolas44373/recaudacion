import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Buena práctica activada
  swcMinify: true,       // Compatible con más navegadores que turbopack por ahora
  experimental: {
    // ⚠️ Asegurate de no usar `turbopack` en producción si querés soporte para navegadores antiguos
    // turbopack: false,
  },
  // Puedes agregar otras configuraciones aquí si las usás
};

export default nextConfig;
