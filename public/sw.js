/*
 * Plumb — A Legacy AI field tool
 * Copyright (C) 2026 Legacy AI LLC and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 */
/// <reference lib="webworker" />

const CACHE_VERSION = 'plumb-v1';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Precache manifest — built assets listed explicitly so SW knows what's stable
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Dev mode detection — skip SW interference during development
const IS_DEV = import.meta.env?.DEV ?? false;

self.addEventListener('install', (event) => {
  if (IS_DEV) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (IS_DEV) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Navigation requests — network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // SPA fallback — serve index.html for unknown routes
            return caches.match('/index.html');
          })
        )
    );
    return;
  }

  // Static assets — stale-while-revalidate for performance
  if (
    url.origin === self.location.origin &&
    /\.(js|css|woff2?|png|svg|ico|webp)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);
        return cached ?? fetchPromise ?? caches.match(event.request);
      })
    );
    return;
  }

  // External requests — network only (no caching Google Fonts, etc.)
});
