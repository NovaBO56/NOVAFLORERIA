// Compatibility helper for existing LOCAL DB drills; one shared implementation.
import { fileURLToPath } from 'node:url';
import { manualBackup } from './manual-backup.mjs';
export async function localBackup(env = process.env) {
  if (env.BACKUP_MODE !== 'local') throw new Error('Este comando admite únicamente LOCAL.');
  return manualBackup(env);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) localBackup().then(() => console.log('Backup LOCAL cifrado creado y verificado correctamente.')).catch(() => { console.error('Backup LOCAL fallido; revisar configuración privada.'); process.exitCode = 1; });
