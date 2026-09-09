
"use client";

import Image from "next/image";
import { useRef, useState } from "react";

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
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<UploadedImage | null>(null);

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

      setImage(data.image ?? null);
      setMessage("Imagen subida correctamente.");
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
          disabled={uploading}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          {uploading ? "Procesando..." : "Subir imagen"}
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

      {image?.public_url && (
        <div className="mt-4">
          <Image
  src={image.public_url}
  alt={productName}
  width={160}
  height={160}
  className="h-40 w-40 rounded-md border object-cover"
/>

          <p className="mt-2 text-xs text-muted-foreground">
            {image.width ?? "?"} × {image.height ?? "?"} px
            {" · "}
            {image.file_size_bytes
              ? `${Math.round(image.file_size_bytes / 1024)} KB`
              : "tamaño desconocido"}
          </p>
        </div>
      )}
    </div>
  );
}
