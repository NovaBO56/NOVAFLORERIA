"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ProductImageManagementProps = {
  productId: string;
  productName: string;
};

type UploadedImage = {
  id: string;
  public_url: string | null;
  storage_path: string;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
};

export default function ProductImageManagement({
  productId,
  productName,
}: ProductImageManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);

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

      setMessage("Imagen subida correctamente.");
      await loadImages();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setUploading(false);
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

      setMessage("Imagen eliminada correctamente.");
      await loadImages();
    } catch (error) {
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
    <div className="mt-5 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-medium">Imágenes del producto</h4>

          <p className="text-sm text-muted-foreground">
            Sube imágenes para {productName}. Máximo 10 imágenes.
          </p>
        </div>

        <button
          type="button"
          onClick={openFileSelector}
          disabled={uploading || images.length >= 10}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          {uploading
            ? "Procesando..."
            : images.length >= 10
              ? "Límite alcanzado"
              : "Subir imagen"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      {message && (
        <p className="mt-3 text-sm">{message}</p>
      )}

      {loadingImages ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Cargando imágenes...
        </p>
      ) : images.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Este producto todavía no tiene imágenes.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="rounded-md border p-3"
            >
              {image.public_url && (
                <Image
                  src={image.public_url}
                  alt={productName}
                  width={320}
                  height={320}
                  className="aspect-square w-full rounded-md object-cover"
                />
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                {image.width ?? "?"} × {image.height ?? "?"} px
                {" · "}
                {image.file_size_bytes
                  ? `${Math.round(image.file_size_bytes / 1024)} KB`
                  : "tamaño desconocido"}
              </p>

              <button
                type="button"
                onClick={() => void handleDelete(image)}
                disabled={deletingImageId === image.id}
                className="mt-3 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              >
                {deletingImageId === image.id
                  ? "Eliminando..."
                  : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}