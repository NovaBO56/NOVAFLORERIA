/** Synthetic local laboratory catalog. Importing this module performs no I/O. */
export const LAB_PREFIX = "LAB50";
export const LAB_VERSION = "1";

export const categories = [
  { key: "rosas", name: "LAB50 · Rosas", description: "Demostración local de ramos de rosas." },
  { key: "girasoles", name: "LAB50 · Girasoles", description: "Demostración local de arreglos de girasoles." },
  { key: "mixtos", name: "LAB50 · Ramos mixtos", description: "Demostración local de combinaciones florales." },
  { key: "peluches", name: "LAB50 · Peluches con flores", description: "Demostración local de arreglos con un peluche complementario." },
  { key: "cajas", name: "LAB50 · Cajas florales", description: "Demostración local de flores presentadas en caja." },
  { key: "canastas", name: "LAB50 · Canastas florales", description: "Demostración local de flores presentadas en canasta." },
  { key: "romanticos", name: "LAB50 · Detalles románticos", description: "Demostración local de arreglos para expresar cariño." },
  { key: "cumpleanos", name: "LAB50 · Cumpleaños", description: "Demostración local de arreglos de cumpleaños." },
  { key: "temporada", name: "LAB50 · Flores de temporada", description: "Demostración local de combinaciones con tulipanes y lirios." },
  { key: "combos", name: "LAB50 · Combos y regalos", description: "Demostración local de conjuntos florales para regalar." },
];

export const inventoryItems = [
  { key: "rosas_rojas", name: "LAB50 · Rosa roja", sku: "LAB50-F01", item_type: "flor", unit: "tallo", minimum_stock: 50, entry_quantity: 3000 },
  { key: "rosas_rosadas", name: "LAB50 · Rosa rosada", sku: "LAB50-F02", item_type: "flor", unit: "tallo", minimum_stock: 50, entry_quantity: 3000 },
  { key: "rosas_blancas", name: "LAB50 · Rosa blanca", sku: "LAB50-F03", item_type: "flor", unit: "tallo", minimum_stock: 50, entry_quantity: 3000 },
  { key: "girasoles", name: "LAB50 · Girasol", sku: "LAB50-F04", item_type: "flor", unit: "tallo", minimum_stock: 30, entry_quantity: 3000 },
  { key: "tulipanes", name: "LAB50 · Tulipán", sku: "LAB50-F05", item_type: "flor", unit: "tallo", minimum_stock: 30, entry_quantity: 3000 },
  { key: "lirios", name: "LAB50 · Lirio", sku: "LAB50-F06", item_type: "flor", unit: "tallo", minimum_stock: 30, entry_quantity: 3000 },
  { key: "follaje", name: "LAB50 · Follaje", sku: "LAB50-I01", item_type: "insumo", unit: "rama", minimum_stock: 50, entry_quantity: 3000 },
  { key: "papel", name: "LAB50 · Envoltura floral", sku: "LAB50-I02", item_type: "insumo", unit: "unidad", minimum_stock: 20, entry_quantity: 300 },
  { key: "cinta", name: "LAB50 · Cinta decorativa", sku: "LAB50-I03", item_type: "insumo", unit: "metro", minimum_stock: 20, entry_quantity: 300 },
  { key: "caja", name: "LAB50 · Caja floral", sku: "LAB50-I04", item_type: "insumo", unit: "unidad", minimum_stock: 10, entry_quantity: 300 },
  { key: "oso", name: "LAB50 · Oso de demostración", sku: "LAB50-C01", item_type: "componente", unit: "unidad", minimum_stock: 10, entry_quantity: 300 },
  { key: "canasta", name: "LAB50 · Canasta floral", sku: "LAB50-I05", item_type: "insumo", unit: "unidad", minimum_stock: 10, entry_quantity: 300 },
];

const families = [
  {
    categoryKey: "rosas", flowerKey: "rosas_rojas", occasion: "Amor y aniversario",
    names: ["Rosas carmín · Detalle", "Rosas carmín · Clásico", "Rosas carmín · Romance", "Rosas carmín · Gran ramo", "Rosas carmín · Celebración"],
    prices: [45, 95, 150, 240, 380], quantities: [3, 6, 12, 18, 24],
  },
  {
    categoryKey: "girasoles", flowerKey: "girasoles", occasion: "Cumpleaños",
    names: ["Girasoles · Rayito de sol", "Girasoles · Alegría", "Girasoles · Luz del día", "Girasoles · Gran abrazo", "Girasoles · Celebración"],
    prices: [60, 100, 145, 210, 300], quantities: [2, 3, 5, 7, 10],
  },
  {
    categoryKey: "mixtos", flowerKey: "rosas_rosadas", secondFlowerKey: "rosas_blancas", occasion: "Agradecimiento",
    names: ["Mixto · Color del día", "Mixto · Jardín alegre", "Mixto · Dulce armonía", "Mixto · Abrazo floral", "Mixto · Gran celebración"],
    prices: [90, 160, 240, 350, 500], quantities: [3, 6, 9, 12, 18],
  },
  {
    categoryKey: "peluches", flowerKey: "rosas_rojas", occasion: "Cariño y amistad", complement: "oso",
    names: ["Flores y oso · Cariño", "Flores y oso · Ternura", "Flores y oso · Abrazo", "Flores y oso · Gran detalle", "Flores y oso · Celebración"],
    prices: [110, 180, 270, 390, 550], quantities: [3, 6, 9, 15, 21],
  },
  {
    categoryKey: "cajas", flowerKey: "rosas_rojas", secondFlowerKey: "rosas_blancas", occasion: "Aniversario",
    names: ["Caja · Pequeño encanto", "Caja · Rosas de cariño", "Caja · Jardín especial", "Caja · Gran sorpresa", "Caja · Celebración floral"],
    prices: [130, 220, 320, 450, 600], quantities: [4, 8, 12, 18, 24], container: "caja",
  },
  {
    categoryKey: "canastas", flowerKey: "girasoles", secondFlowerKey: "rosas_blancas", occasion: "Gratitud y buenos deseos", container: "canasta",
    names: ["Canasta · Buenos deseos", "Canasta · Jardín de luz", "Canasta · Dulce encuentro", "Canasta · Gran abrazo", "Canasta · Celebración"],
    prices: [140, 230, 330, 460, 610], quantities: [2, 4, 6, 8, 10],
  },
  {
    categoryKey: "romanticos", flowerKey: "rosas_rojas", secondFlowerKey: "rosas_rosadas", occasion: "Amor y aniversario",
    names: ["Romántico · Un te quiero", "Romántico · Dulce encuentro", "Romántico · Cerca de ti", "Romántico · Gran amor", "Romántico · Siempre contigo"],
    prices: [75, 135, 205, 315, 450], quantities: [3, 6, 9, 15, 21],
  },
  {
    categoryKey: "cumpleanos", flowerKey: "girasoles", secondFlowerKey: "tulipanes", occasion: "Cumpleaños",
    names: ["Cumpleaños · Un deseo", "Cumpleaños · Día feliz", "Cumpleaños · Color y alegría", "Cumpleaños · Gran sorpresa", "Cumpleaños · Celebra la vida"],
    prices: [95, 165, 245, 355, 510], quantities: [2, 3, 5, 7, 10],
  },
  {
    categoryKey: "temporada", flowerKey: "tulipanes", secondFlowerKey: "lirios", occasion: "Felicitaciones",
    names: ["Temporada · Brisa suave", "Temporada · Luz del jardín", "Temporada · Dulce tarde", "Temporada · Gran ramo", "Temporada · Jardín especial"],
    prices: [105, 175, 265, 385, 540], quantities: [3, 5, 8, 12, 16],
  },
  {
    categoryKey: "combos", flowerKey: "lirios", secondFlowerKey: "rosas_rojas", occasion: "Celebración especial",
    names: ["Combo regalo · Gracias por estar", "Combo regalo · Dulce sorpresa", "Combo regalo · Nuevo comienzo", "Combo regalo · Un gran logro", "Combo regalo · Momento inolvidable"],
    prices: [150, 240, 340, 490, 650], quantities: [3, 5, 8, 12, 16], container: "caja", complement: "oso",
  },
];

const baseProducts = families.flatMap((family, familyIndex) => family.names.map((name, index) => {
  const code = `${LAB_PREFIX} ${String(familyIndex * 5 + index + 1).padStart(2, "0")}`;
  const recipe = [
    { itemKey: family.flowerKey, quantity: family.quantities[index] },
    { itemKey: "follaje", quantity: 2 },
    { itemKey: family.container ?? "papel", quantity: 1 },
    { itemKey: "cinta", quantity: 0.5 },
  ];
  if (family.secondFlowerKey) recipe.push({ itemKey: family.secondFlowerKey, quantity: index + 2 });
  if (family.complement) recipe.push({ itemKey: family.complement, quantity: 1 });
  return {
    code,
    name: `${code} · ${name}`,
    description: `Producto sintético de demostración para el laboratorio local de Floristería Anabelle. ${name}: composición floral de prueba con envoltura o presentación según su receta. No corresponde a una oferta ni a una venta real.`,
    price: family.prices[index],
    occasion: family.occasion,
    categoryKey: family.categoryKey,
    recipe,
  };
}));

export const products = [
  ...baseProducts,
  ...baseProducts.map((product, index) => {
    const code = `${LAB_PREFIX} ${String(index + 51).padStart(2, "0")}`;
    return {
      ...product,
      code,
      name: `${code} · ${product.name.split(" · ").slice(1).join(" · ")} · Edición jardín`,
      description: `${product.description} Variante sintética Edición jardín para comprobar catálogos extensos; no corresponde a una oferta ni a una venta real.`,
      price: product.price + 15,
      recipe: product.recipe.map(line => ({ ...line })),
    };
  }),
];
