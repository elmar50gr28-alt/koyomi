export const INDEXEDDB_COMPAT_API = Object.freeze([
  'list',
  'get',
  'put',
  'delete',
  'clear'
]);

/**
 * Stable facade over the legacy ledger persistence functions. This module
 * does not open IndexedDB, create transactions, migrate data, or transform
 * encrypted records.
 */
export function createIndexedDbCompatibility(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new TypeError('IndexedDB legacy adapter is required');
  }

  for (const name of INDEXEDDB_COMPAT_API) {
    if (typeof legacy[name] !== 'function') {
      throw new TypeError(`IndexedDB legacy function is required: ${name}`);
    }
  }

  return Object.freeze({
    list: (...args) => legacy.list(...args),
    get: (...args) => legacy.get(...args),
    put: (...args) => legacy.put(...args),
    delete: (...args) => legacy.delete(...args),
    clear: (...args) => legacy.clear(...args)
  });
}
