import type { MetadataRoute } from "next";

// Манифест для установки на экран «Домой» (PWA, ADR-001). Доступен без входа — см. src/proxy.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Business English",
    short_name: "Business English",
    description: "Тренажёр бизнес-английского: слова с урока — в рабочие фразы",
    lang: "ru",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F2EA",
    theme_color: "#F5F2EA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
