"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ProductForm, {
  type Product,
} from "./product-form";
import ProductList from "./product-list";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
};

type Season = {
  id: string;
  name: string;
  is_active: boolean;
};


export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);


  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

  const [
  productsResponse,
  categoriesResponse,
  seasonsResponse,
] = await Promise.all([
  fetch("/api/admin/products"),
  fetch("/api/admin/categories"),
  fetch("/api/admin/seasons"),
]);

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const seasonsData = await seasonsResponse.json();
 

      if (!productsResponse.ok || !productsData.success) {
        throw new Error(
          productsData.error || "No se pudieron cargar los productos.",
        );
      }

      if (!categoriesResponse.ok || !categoriesData.success) {
        throw new Error(
          categoriesData.error || "No se pudieron cargar las categorías.",
        );
      }

      if (!seasonsResponse.ok || !seasonsData.success) {
        throw new Error(
          seasonsData.error || "No se pudieron cargar las temporadas.",
        );
      }

  

      setProducts(productsData.products ?? []);
      setCategories(categoriesData.categories ?? []);
      setSeasons(seasonsData.seasons ?? []);
    
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar los datos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleEdit(product: Product) {
    setEditingProduct(product);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingProduct(null);
  }

  async function handleProductSaved() {
    setEditingProduct(null);
    await loadData();
  }

  async function toggleProduct(
    product: Product,
    field: "is_active" | "is_available" | "is_sold_out" | "is_featured",
  ) {
    setMessage("");

    const newValue = !product[field];

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: newValue,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se pudo actualizar el producto.",
        );
      }

      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al actualizar el producto.",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Card className="h-72 animate-pulse" />
        <Card className="h-48 animate-pulse" />
        <Card className="h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-text">
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-brand"
          />

          <p className="flex-1">{message}</p>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMessage("")}
            aria-label="Cerrar mensaje"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}

      <ProductForm
        categories={categories}
        seasons={seasons}
        editingProduct={editingProduct}
        onSaved={handleProductSaved}
        onCancel={handleCancelEdit}
      />

      <ProductList
  products={products}
  categories={categories}
  seasons={seasons}
  onEdit={handleEdit}
  onToggle={toggleProduct}
/>
    </div>
  );
}