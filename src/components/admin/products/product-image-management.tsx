"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <div className="mt-2 flex flex-col gap-3 border-t border-border-decorative pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-medium text-text">Imágenes del producto</h4>
          <p className="text-text-secondary">
            Sube imágenes para {productName}. Máximo 10 imágenes.
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

      {message && <p className="text-sm text-text">{message}</p>}

      {loadingImages ? (
        <p className="text-text-secondary">Cargando imágenes...</p>
      ) : images.length === 0 ? (
        <p className="text-text-secondary">Este producto todavía no tiene imágenes.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id} className="gap-2 p-3">
              {image.public_url && (
                <Image
                  src={image.public_url}
                  alt={productName}
                  width={320}
                  height={320}
                  className="aspect-square w-full rounded-sm object-cover"
                />
              )}

              <p className="text-[13px] text-text-secondary">
                {image.width ?? "?"} × {image.height ?? "?"} px
                {" · "}
                {image.file_size_bytes
                  ? `${Math.round(image.file_size_bytes / 1024)} KB`
                  : "tamaño desconocido"}
              </p>

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
          ))}
        </div>
      )}
    </div>
  );
}