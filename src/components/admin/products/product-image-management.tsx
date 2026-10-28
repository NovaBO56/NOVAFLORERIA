
"use client";

import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProductImageManagementProps = {
  productId: string;
  onDirtyChange?: (dirty: boolean) => void;
  productName: string;
};

type UploadedImage = {
  id: string;
  public_url: string | null;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
};

export default function ProductImageManagement({
  productId,
  onDirtyChange,
  productName,
}: ProductImageManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [savingImageId, setSavingImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [editingAltTextId, setEditingAltTextId] = useState<string | null>(
    null,
  );
  const [altText, setAltText] = useState("");
  const dirty = editingAltTextId !== null || uploading || reordering || savingImageId !== null;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  const loadImages = useCallback(async () => {
    setLoadingImages(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images`,
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            data.error ??
            "No se pudieron cargar las imágenes.",
        );
      }

      setImages(data.images ?? []);
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las imágenes.",
      );
    } finally {
      setLoadingImages(false);
    }
  }, [productId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadImages();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadImages]);

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const response = await fetch(
        `/api/admin/products/${productId}/images`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            data.error ??
            "No se pudo subir la imagen.",
        );
      }

      setMessageTone("success");
      setMessage("Imagen subida correctamente.");
      await loadImages();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleReorder(
    imageId: string,
    direction: "up" | "down",
  ) {
    const currentIndex = images.findIndex(
      (image) => image.id === imageId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reordered = [...images];
    const [movedImage] = reordered.splice(currentIndex, 1);

    if (!movedImage) {
      return;
    }

    reordered.splice(targetIndex, 0, movedImage);

    setMessage("");
    setReordering(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_ids: reordered.map((image) => image.id),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            data.error ??
            "No se pudo guardar el orden de las imágenes.",
        );
      }

      setImages(data.images ?? reordered);
      setMessageTone("success");
      setMessage("Orden de imágenes actualizado.");
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el orden de las imágenes.",
      );
    } finally {
      setReordering(false);
    }
  }

  function startEditingAltText(image: UploadedImage) {
    setEditingAltTextId(image.id);
    setAltText(image.alt_text ?? "");
    setMessage("");
  }

  function cancelEditingAltText() {
    setEditingAltTextId(null);
    setAltText("");
  }

  async function handleSaveAltText(image: UploadedImage) {
    setMessage("");
    setSavingImageId(image.id);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${image.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alt_text: altText.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            data.error ??
            "No se pudo actualizar el texto alternativo.",
        );
      }

      setImages((currentImages) =>
        currentImages.map((currentImage) =>
          currentImage.id === image.id
            ? {
                ...currentImage,
                alt_text: data.image?.alt_text ?? null,
              }
            : currentImage,
        ),
      );

      setMessageTone("success");
      setMessage("Texto alternativo actualizado.");
      cancelEditingAltText();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el texto alternativo.",
      );
    } finally {
      setSavingImageId(null);
    }
  }

  async function handleDelete(image: UploadedImage) {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar esta imagen de "${productName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setDeletingImageId(image.id);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${image.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            data.error ??
            "No se pudo eliminar la imagen.",
        );
      }

      setMessageTone("success");
      setMessage("Imagen eliminada correctamente.");
      await loadImages();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la imagen.",
      );
    } finally {
      setDeletingImageId(null);
    }
  }

  function openFileSelector() {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-5 [&_button]:min-h-11 [&_button]:min-w-11">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">Imágenes del producto</h3>
          <p className="text-text-secondary">
            La primera imagen es la principal. Máximo 10 imágenes. Usa JPG, PNG o WebP de hasta 5 MB por imagen. Puedes ampliar cada fotografía para revisarla.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFileSelector}
          loading={uploading}
          loadingText="Procesando…"
          disabled={images.length >= 10}
        >
          <Upload aria-hidden="true" />
          {images.length >= 10 ? "Límite alcanzado" : "Subir imagen"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      {message && <Notice tone={messageTone}>{messageTone === "error" ? friendlyErrorMessage(message, "No pudimos actualizar las fotografías. Intenta nuevamente.") : message}</Notice>}

      {loadingImages ? (
        <p className="text-text-secondary">Cargando imágenes...</p>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-decorative bg-bg-admin p-6 text-center">
          <ProductThumbnail alt={productName} size="lg" />
          <p className="font-medium">Este producto todavía no tiene fotografías.</p>
          <p className="max-w-sm text-sm text-text-secondary">Añade una fotografía para que el cliente reconozca el arreglo. El archivo se sube al seleccionarlo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => {
            const isPrimary = index === 0;
            const isEditingAltText = editingAltTextId === image.id;

            return (
              <Card key={image.id} className="gap-3 p-3">
                <div className="relative">
                  <ProductThumbnail
                    src={image.public_url}
                    alt={image.alt_text || productName}
                    preview
                    fit="contain"
                    className="aspect-square h-auto w-full"
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
                  />

                  {isPrimary && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background px-2 py-1 text-xs font-medium text-text shadow-sm">
                      <Star
                        size={14}
                        fill="currentColor"
                        aria-hidden="true"
                      />
                      Principal
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text-secondary">
                    Posición {index + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleReorder(image.id, "up")}
                      disabled={
                        reordering || index === 0
                      }
                      aria-label={`Mover ${productName} arriba`}
                      title="Mover arriba"
                    >
                      <ChevronUp aria-hidden="true" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleReorder(image.id, "down")}
                      disabled={
                        reordering || index === images.length - 1
                      }
                      aria-label={`Mover ${productName} abajo`}
                      title="Mover abajo"
                    >
                      <ChevronDown aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <p className="text-[13px] text-text-secondary">
                  {image.width ?? "?"} × {image.height ?? "?"} px
                  {" · "}
                  {image.file_size_bytes
                    ? `${Math.round(image.file_size_bytes / 1024)} KB`
                    : "tamaño desconocido"}
                </p>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text">
                      Texto alternativo
                    </span>

                    {!isEditingAltText && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEditingAltText(image)}
                        aria-label="Editar texto alternativo"
                        title="Editar texto alternativo"
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                    )}
                  </div>

                  {isEditingAltText ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={altText}
                        onChange={(event) =>
                          setAltText(event.target.value)
                        }
                        maxLength={300}
                        rows={3}
                        placeholder={`Descripción de la imagen de ${productName}`}
                        className="w-full rounded-md border border-border-decorative bg-background px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-border-focus"
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditingAltText}
                          disabled={savingImageId === image.id}
                        >
                          Cancelar
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSaveAltText(image)}
                          loading={savingImageId === image.id}
                          loadingText="Guardando…"
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      {image.alt_text || "Sin texto alternativo"}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDelete(image)}
                  loading={deletingImageId === image.id}
                  loadingText="Eliminando…"
                >
                  <Trash2 aria-hidden="true" />
                  Eliminar
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
