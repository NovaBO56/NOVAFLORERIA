"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal";

const endpoint = "/api/admin/profile/avatar";
export function ProfileAvatar({ name }: { name: string | null }) {
  const [open, setOpen] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [version, setVersion] = useState(0);
  const [failed, setFailed] = useState(false);
  const [selection, setSelection] = useState<{ file: File; url: string } | null>(null);
  const selected = selection?.file ?? null;
  const preview = selection?.url ?? null;
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const initials = (name?.trim() || "Usuario").split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { signal: controller.signal, cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.success) throw Error(body.message || "No se pudo consultar tu foto.");
      if (!controller.signal.aborted) { setHasPhoto(body.hasPhoto); setFailed(false); }
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo consultar tu foto."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);
  useEffect(() => {
    return () => { if (selection) URL.revokeObjectURL(selection.url); };
  }, [selection]);

  function changeOpen(value: boolean) {
    if (busy || value === open) return;
    setLoading(true);
    setOpen(value);
    if (!value) setSelection(null);
  }

  function choose(file?: File) {
    setError(""); setNotice("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) {
      setError("Elige un JPG, PNG o WebP de hasta 2 MB."); return;
    }
    setSelection({ file, url: URL.createObjectURL(file) });
  }
  async function save(remove = false) {
    if (lock.current || (!remove && !selected)) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(endpoint, remove ? { method: "DELETE" } : { method: "PUT", headers: { "Content-Type": selected!.type }, body: selected });
      const body = await response.json();
      if (!response.ok || !body.success) throw Error(body.message || "No se pudo actualizar tu foto.");
      setHasPhoto(!remove); setFailed(false); setVersion(value => value + 1); setSelection(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice(remove ? "Foto eliminada. Se mostrarán tus iniciales." : "Tu foto de perfil se guardó correctamente.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar tu foto."); }
    finally { lock.current = false; setBusy(false); }
  }
  const photo = hasPhoto && !failed ? `${endpoint}?image=1&v=${version}` : null;
  return <>
    <button type="button" aria-label="Abrir mi perfil y cambiar foto" title="Mi perfil" onClick={() => { setNotice(""); setError(""); changeOpen(true); }} className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-900 text-xs font-bold text-white outline-none ring-offset-2 hover:ring-2 hover:ring-brand/30 focus-visible:ring-2 focus-visible:ring-brand">
      {photo ? <img src={photo} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : initials}
    </button>
    <Modal open={open} onOpenChange={changeOpen}>
      <ModalContent dismissible={!busy} showCloseButton={!busy} className="min-h-0">
        <ModalHeader><ModalTitle>Mi perfil</ModalTitle><ModalDescription>{name ?? "Tu cuenta"} · Foto de perfil</ModalDescription></ModalHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="grid size-28 overflow-hidden rounded-2xl bg-brand-soft text-3xl font-bold text-brand place-items-center">
            {preview || photo ? <img src={preview ?? photo!} alt="Vista previa de tu foto" className="size-full object-cover" onError={() => { if (preview) { setError("No se pudo mostrar esta imagen. Elige otra foto."); setSelection(null); } else setFailed(true); }} /> : initials}
          </div>
          <p className="text-center text-sm text-text-secondary">Elige una foto para identificarte en el panel. Se recortará al centro en formato cuadrado.</p>
          <label className="flex w-full flex-col gap-2 text-sm font-medium">Seleccionar foto
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || loading} onChange={event => choose(event.target.files?.[0])} className="block w-full min-w-0 rounded-lg border border-border-decorative p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:p-2 file:font-semibold file:text-brand" />
          </label>
          <p className="text-xs text-text-secondary">JPG, PNG o WebP estático · Hasta 2 MB · Máximo 16 megapíxeles.</p>
          {selected && <p className="text-xs text-brand">Vista previa: todavía no se ha guardado.</p>}
          {loading && <p role="status" className="text-sm">Consultando tu perfil…</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          {notice && <p role="status" className="text-sm text-leaf">{notice}</p>}
          <div className="flex w-full flex-wrap justify-between gap-2 border-t border-border-decorative pt-4">
            <Button variant="outline" disabled={!hasPhoto || busy || loading} onClick={() => void save(true)}><Trash2 aria-hidden className="size-4" />Eliminar foto</Button>
            <Button disabled={!selected || busy || loading} loading={busy} loadingText="Guardando…" onClick={() => void save()}><Camera aria-hidden className="size-4" />Guardar foto</Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  </>;
}
