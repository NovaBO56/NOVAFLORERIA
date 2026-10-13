import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { backupStorage, captureInventory, storageHTTP, storageURL, verifyStorage } from '../supabase/backup/storage-production.mjs';
import { runBackup, runWeekly, retainWeekly } from '../supabase/backup/weekly-backup.mjs';
import { prefixes } from '../supabase/backup/s3-transport.mjs';
import { restoreStorageLocal } from '../supabase/backup/restore-storage-local.mjs';

// Synthetic adapters only: these tests do NOT certify a real S3 provider.
const roots = { database: 'test/db/', storage: 'test/storage/', weekly: 'test/weekly/' };
const key = Buffer.alloc(32, 5), dirs = [];
afterEach(async () => { for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true }); });
async function setup(objects = []) {
  const dir = await mkdtemp(join(tmpdir(), 'nova-storage-unit-')); dirs.push(dir);
  const files = new Map(), removed = [], calls = [];
  const transport = {
    async put(name, file, digest) { calls.push('put:' + name); files.set(name, { bytes: await readFile(file), digest }); },
    async get(name, output) { const entry = files.get(name); if (!entry) throw new Error('Missing object'); await writeFile(output, entry.bytes, { flag: 'wx' }); },
    async head(name) { const entry = files.get(name); if (!entry) throw new Error('Missing object'); return { ContentLength: entry.bytes.length, Metadata: { sha256: entry.digest } }; },
    async list(prefix) { return [...files.keys()].filter(name => name.startsWith(prefix)); },
    async remove(name) { removed.push(name); files.delete(name); },
  };
  const inventory = async function* () {
    yield { type: 'buckets', buckets: [...new Set(['empty', ...objects.map(o => o.bucket)])].map(id => ({ id })) };
    for (const object of objects) yield { type: 'object', bucket: object.bucket, path: object.path, metadata: { size: object.bytes.length } };
  };
  const source = { async download(bucket, path, output) { const object = objects.find(o => o.bucket === bucket && o.path === path); if (!object) throw new Error('Missing source'); await writeFile(output, object.bytes, { flag: 'wx' }); return { contentType: 'application/octet-stream' }; } };
  return { dir, files, removed, calls, transport, inventory, source };
}
const fixture = [{ bucket: 'one', path: 'carpeta/ñ-flor.png', bytes: Buffer.from('flor sintética') }, { bucket: 'two', path: 'carpeta/ñ-flor.png', bytes: Buffer.from('otra flor') }];
async function storage(context) {
  const inventoryFile = join(context.dir, 'inventory'); await captureInventory(context.inventory, inventoryFile);
  return backupStorage({ ...context, inventoryFile, prefix: 'test/storage/generation/', key });
}
describe('Storage productivo cifrado / adaptadores sintéticos', () => {
  it.each([[], [fixture[0]], fixture, [{ bucket: 'one', path: 'empty.bin', bytes: Buffer.alloc(0) }]].map(objects => [objects]))('verifica bucket vacío, objeto(s), Unicode, subcarpetas y nombres por bucket %#', async objects => {
    const context = await setup(objects), descriptor = await storage(context);
    expect(await verifyStorage({ ...context, descriptor, key, prefix: 'test/storage/generation/' })).toEqual({ objects: objects.length, verified: true });
    for (const file of context.files.values()) expect(file.bytes.includes(Buffer.from('flor sintética'))).toBe(false);
  });
  it('no impone el límite LOCAL de 5 MB por archivo', async () => {
    const context = await setup([{ bucket: 'one', path: 'large', bytes: Buffer.alloc(6 * 1024 * 1024, 9) }]), descriptor = await storage(context);
    expect((await verifyStorage({ ...context, descriptor, key, prefix: 'test/storage/generation/' })).objects).toBe(1);
  });
  it.each(['corrupt', 'manifest', 'missing', 'download'])('rechaza %s sin declarar éxito', async failure => {
    const context = await setup(fixture), descriptor = await storage(context);
    if (failure === 'missing') context.files.delete('test/storage/generation/objects/0.enc');
    if (failure === 'download') context.transport.get = async () => { throw new Error('Failed download'); };
    if (['corrupt', 'manifest'].includes(failure)) {
      const file = context.files.get(failure === 'manifest' ? descriptor.key : 'test/storage/generation/objects/0.enc');
      file.bytes[20] ^= 1;
      // Even forged cipher hash metadata cannot bypass GCM authentication.
      file.digest = createHash('sha256').update(file.bytes).digest('hex');
      if (failure === 'manifest') descriptor.sha256 = file.digest;
    }
    await expect(verifyStorage({ ...context, descriptor, key, prefix: 'test/storage/generation/' })).rejects.toThrow();
    expect(context.removed).toEqual([]);
  });
  it('fallo de subida Storage no publica manifest ni ejecuta retención', async () => {
    const context = await setup(fixture);
    context.transport.put = async () => { throw new Error('Upload failed'); };
    await expect(storage(context)).rejects.toThrow('Upload failed'); expect(context.files.size).toBe(0); expect(context.removed).toEqual([]);
  });
  it('DB nueva no borra semanas anteriores si falla Storage', async () => {
    const context = await setup(fixture);
    context.source.download = async () => { throw new Error('Storage failed'); };
    const old = roots.weekly + '2026-10-01T00-00-00-000Z-aaaaaaaaaaaa.complete.enc'; context.files.set(old, { bytes: Buffer.from('historical'), digest: '' });
    await expect(runWeekly({ ...context, roots, key, dumpDatabase: file => writeFile(file, Buffer.alloc(200)), keep: 4 })).rejects.toThrow('Storage failed');
    expect(context.files.has(old)).toBe(true); expect(context.removed).toEqual([]);
    expect(context.calls.filter(name => name.endsWith('.complete.enc'))).toEqual([]);
  });
  it('retiene generaciones conjuntas; no cuenta huérfanos DB', async () => {
    const context = await setup([]);
    for (let day = 1; day <= 5; day++) {
      const dir = await mkdtemp(join(tmpdir(), 'nova-week-unit-')); dirs.push(dir);
      await runWeekly({ ...context, dir, roots, key, id: `2026-10-0${day}T00-00-00-000Z-aaaaaaaaaaaa`, retain: false, dumpDatabase: file => writeFile(file, Buffer.alloc(200)) });
    }
    context.files.set(roots.database + 'orphan', { bytes: Buffer.from('not valid'), digest: '' });
    await retainWeekly({ ...context, roots, newest: '2026-10-05T00-00-00-000Z-aaaaaaaaaaaa', keep: 4, key });
    expect([...context.files.keys()].filter(name => name.endsWith('.complete.enc'))).toHaveLength(4);
    expect(context.files.has(roots.database + 'orphan')).toBe(true);
    expect(context.removed).toHaveLength(3);
  });
  it('un inventario que cambia aborta antes del marcador y retención', async () => {
    const context = await setup([]); let run = 0;
    context.inventory = async function* () { yield { type: 'buckets', buckets: [{ id: `changed-${run++}` }] }; };
    await expect(runWeekly({ ...context, roots, key, dumpDatabase: file => writeFile(file, Buffer.alloc(200)) })).rejects.toThrow('Storage cambió');
    expect(context.calls).toEqual([]); expect(context.removed).toEqual([]);
  });
  it('manifest que falla al subirse impide marcador conjunto y retención', async () => {
    const context = await setup(fixture), put = context.transport.put;
    context.transport.put = async (name, file, hash) => { if (name.endsWith('manifest.enc')) throw new Error('Manifest upload failed'); await put(name, file, hash); };
    await expect(runWeekly({ ...context, roots, key, dumpDatabase: file => writeFile(file, Buffer.alloc(200)) })).rejects.toThrow('Manifest upload failed');
    expect([...context.files.keys()].some(name => name.endsWith('.complete.enc'))).toBe(false); expect(context.removed).toEqual([]);
  });
  it('una copia completa dañada detiene retención antes de borrar nada', async () => {
    const context = await setup(fixture);
    const marker = await runWeekly({ ...context, roots, key, retain: false, dumpDatabase: file => writeFile(file, Buffer.alloc(200)) });
    context.files.delete(`${roots.storage}${marker.id}/objects/0.enc`);
    await expect(retainWeekly({ ...context, roots, newest: marker.id, keep: 4, key })).rejects.toThrow(); expect(context.removed).toEqual([]);
  });
  it('un fallo de upload durante restore no devuelve verified', async () => {
    const context = await setup(fixture), descriptor = await storage(context);
    const target = { async upload() { throw new Error('Restore upload failed'); } };
    await expect(verifyStorage({ ...context, descriptor, key, prefix: 'test/storage/generation/', target })).rejects.toThrow('Restore upload failed');
  });
  it('rechaza restore remoto, prefijos solapados y calendario desactivado', async () => {
    expect(() => storageURL('https://example.com', 'local')).toThrow();
    expect(() => prefixes({ BACKUP_S3_PREFIX: 'test/', BACKUP_S3_STORAGE_PREFIX: 'test/storage/', BACKUP_S3_WEEKLY_PREFIX: 'weekly/' })).toThrow();
    await expect(runBackup({ BACKUP_ENABLED: 'false' })).rejects.toThrow('desactivado');
    await expect(restoreStorageLocal({ url: 'https://example.com', acknowledge: 'DISPOSABLE_LOCAL' })).rejects.toThrow();
  });
  it('un restore detecta bytes distintos en la descarga posterior', async () => {
    const context = await setup(fixture), descriptor = await storage(context);
    const target = { async upload() {}, async download(bucket, path, file) { await writeFile(file, 'bad'); } };
    await expect(verifyStorage({ ...context, descriptor, key, prefix: 'test/storage/generation/', target })).rejects.toThrow('restaurado');
  });
  it('no sigue redirects que puedan exponer credenciales Storage', async () => {
    let redirect;
    const client = storageHTTP({ url: 'http://127.0.0.1:59621', apiKey: 'synthetic', token: 'synthetic', mode: 'local', fetcher: async (url, options) => { redirect = options.redirect; return new Response(null, { status: 302 }); } });
    await expect(client.download('one', 'file', 'unused')).rejects.toThrow('Descarga'); expect(redirect).toBe('error');
  });
});
