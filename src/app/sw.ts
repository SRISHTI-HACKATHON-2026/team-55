import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { 
  Serwist, 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst,
  ExpirationPlugin
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      // Cache translations and static JSON locales
      matcher: ({ url }) => url.pathname.startsWith("/locales/"),
      handler: new StaleWhileRevalidate({
        cacheName: "locales-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    {
      // Cache images/icons from public
      matcher: ({ url }) => /\.(?:png|jpg|jpeg|svg|ico)$/.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "static-image-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
          }),
        ],
      }),
    },
    {
      // Cache API GET requests for offline view
      matcher: ({ url }) => url.pathname.startsWith("/api/") && !url.pathname.includes("/auth/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
