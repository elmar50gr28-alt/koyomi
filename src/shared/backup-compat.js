export const BACKUP_COMPAT_API = Object.freeze([
  'createEnvelope',
  'exportJson',
  'exportCsv',
  'exportEncrypted',
  'exportProfile',
  'parseCsv',
  'importBackup'
]);

/**
 * Stable facade over the legacy backup and import functions. This module owns
 * no serialization, encryption, download, validation, or restore behavior.
 */
export function createBackupCompatibility(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new TypeError('backup legacy adapter is required');
  }

  for (const name of BACKUP_COMPAT_API) {
    if (typeof legacy[name] !== 'function') {
      throw new TypeError(`backup legacy function is required: ${name}`);
    }
  }

  return Object.freeze({
    createEnvelope: (...args) => legacy.createEnvelope(...args),
    exportJson: (...args) => legacy.exportJson(...args),
    exportCsv: (...args) => legacy.exportCsv(...args),
    exportEncrypted: (...args) => legacy.exportEncrypted(...args),
    exportProfile: (...args) => legacy.exportProfile(...args),
    parseCsv: (...args) => legacy.parseCsv(...args),
    importBackup: (...args) => legacy.importBackup(...args)
  });
}
