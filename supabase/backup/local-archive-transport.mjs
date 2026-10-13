// Offline test/recovery adapter. Files must remain outside the Git workspace.
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
export async function localArchiveTransport(directory) {
  const root = resolve(directory), relativeRoot = relative(resolve(process.cwd()), root);
  if (!relativeRoot.startsWith('..' + sep) && relativeRoot !== '..') throw new Error('Archivo privado fuera de Git requerido.');
  await mkdir(root, { recursive: true });
  const file = key => {
    if (!/^[a-zA-Z0-9/_\-.]+$/.test(key) || key.startsWith('/') || key.split('/').some(part => ['.', '..'].includes(part))) throw new Error('Clave de archivo inválida.');
    return join(root, ...key.split('/'));
  };
  return {
    async put(key, input, digest) { const output = file(key); await mkdir(dirname(output), { recursive: true }); await copyFile(input, output); await writeFile(output + '.metadata', digest, { mode: 0o600 }); },
    async get(key, output) { await copyFile(file(key), output); },
    async head(key) { const output = file(key); return { ContentLength: (await stat(output)).size, Metadata: { sha256: await readFile(output + '.metadata', 'utf8') } }; },
    async list(prefix) {
      const result = [];
      async function folder(directory, key) { for (const entry of await readdir(directory, { withFileTypes: true })) { const next = key + entry.name; if (entry.isDirectory()) await folder(join(directory, entry.name), next + '/'); else if (!entry.name.endsWith('.metadata')) result.push(next); } }
      await folder(root, ''); return result.filter(key => key.startsWith(prefix));
    },
    async remove(key) { await rm(file(key)); await rm(file(key) + '.metadata', { force: true }); },
  };
}
