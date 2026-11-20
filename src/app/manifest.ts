import type { MetadataRoute } from "next";

/** Used when the app is added to a phone's home screen (name, icon, opens full-screen). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Site Auditor +",
    short_name: "Site Auditor +",
    description: "Log building-site issues, attach photos and generate PDF reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
