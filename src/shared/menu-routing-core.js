(function installKoyomiMenuRouting(root) {
  'use strict';

  const DEFAULT_PAGE = 'calendar';
  const PAGES = Object.freeze([
    'personal',
    'qimen',
    'mundane',
    'compat',
    'timeline',
    'calendar',
    'ledger',
    'settings',
    'history',
    'oracle'
  ]);
  const pageSet = new Set(PAGES);

  function normalize(value) {
    return String(value || '').replace(/^#/, '').trim().toLowerCase();
  }

  function resolvePage(value) {
    const page = normalize(value);
    return pageSet.has(page) ? page : DEFAULT_PAGE;
  }

  function isKnownHash(hash) {
    return pageSet.has(normalize(hash));
  }

  function resolveHash(hash) {
    return resolvePage(hash);
  }

  function writeHash(page, { replace = false } = {}) {
    const safePage = resolvePage(page);
    const nextHash = `#${safePage}`;
    if (root.location.hash === nextHash) return safePage;
    if (replace && root.history?.replaceState) {
      root.history.replaceState(null, '', `${root.location.pathname}${root.location.search}${nextHash}`);
    } else {
      root.location.hash = nextHash;
    }
    return safePage;
  }

  root.KOYOMI_MENU_ROUTING_CORE = Object.freeze({
    DEFAULT_PAGE,
    PAGES,
    isKnownHash,
    resolveHash,
    resolvePage,
    writeHash
  });
})(typeof window === 'undefined' ? globalThis : window);
