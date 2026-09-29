"use client";

import { useState } from "react";

export type ProductImage = {
  id: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
};

type ProductGalleryProps = {
  images: ProductImage[];
  productName: string;
};

export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const sortedImages = [...images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = sortedImages[selectedIndex];

  return (
    <div>
      <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-[#eee5f0]">
        {selected?.public_url ? (
          <img
            src={selected.public_url}
            alt={selected.alt_text ?? productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[120px] text-[#b9a3c1]">
            ✿
          </div>
        )}
      </div>

      {sortedImages.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                index === selectedIndex
                  ? "border-[#65358e]"
                  : "border-transparent"
              }`}
            >
              <img
                src={image.public_url}
                alt={image.alt_text ?? productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}