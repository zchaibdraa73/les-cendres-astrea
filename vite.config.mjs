import { defineConfig } from "vite";

const securityHeaders={
  "Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; manifest-src 'self'; worker-src 'self'",
  "Cross-Origin-Opener-Policy":"same-origin",
  "Cross-Origin-Resource-Policy":"same-origin",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()",
  "Referrer-Policy":"no-referrer",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
};

export default defineConfig({
  base: "./",
  clearScreen: false,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    minify: "oxc",
    sourcemap: false,
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    headers: securityHeaders,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    headers: securityHeaders,
  },
});
