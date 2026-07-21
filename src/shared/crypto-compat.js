export const CRYPTO_COMPAT_API = Object.freeze([
  'deriveKey',
  'encryptObject',
  'decryptObject'
]);

/**
 * Stable facade over the legacy ledger cryptography. It intentionally owns no
 * algorithms, parameters, encoding, key material, or persistence behavior.
 */
export function createCryptoCompatibility(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new TypeError('crypto legacy adapter is required');
  }

  for (const name of CRYPTO_COMPAT_API) {
    if (typeof legacy[name] !== 'function') {
      throw new TypeError(`crypto legacy function is required: ${name}`);
    }
  }

  return Object.freeze({
    deriveKey: (...args) => legacy.deriveKey(...args),
    encryptObject: (...args) => legacy.encryptObject(...args),
    decryptObject: (...args) => legacy.decryptObject(...args)
  });
}
