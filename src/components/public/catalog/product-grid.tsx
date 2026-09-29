import { ProductCard, type PublicProduct } from "./product-card";

type ProductGridProps = {
  products: PublicProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c8de] bg-[#faf7fb] px-6 py-16 text-center">
        <div className="text-6xl text-[#b9a3c1]">✿</div>

        <h3 className="mt-4 text-lg font-black text-[#403344]">
          No encontramos arreglos
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7b707f]">
          Prueba cambiando los filtros o buscando otro nombre.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}