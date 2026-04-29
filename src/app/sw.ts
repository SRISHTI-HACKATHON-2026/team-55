import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { 
  Serwist, 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst 
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
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      }),
    },
    {
      // Cache images/icons from public
      matcher: ({ url }) => /\.(?:png|jpg|jpeg|svg|ico)$/.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        },
      }),
    },
    {
      // Cache API GET requests for offline view
      matcher: ({ url }) => url.pathname.startsWith("/api/") && !url.pathname.includes("/auth/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      }),
    },
  ],
});

serwist.addEventListeners();
