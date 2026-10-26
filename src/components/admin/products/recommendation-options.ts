export type RecommendationChoice = {
  id: string; name: string; price: number;
  is_active: boolean; is_available: boolean; is_sold_out: boolean;
  images?: { public_url: string | null; sort_order: number }[];
};
export function recommendationImage(product?: RecommendationChoice) {
  if (!product?.images) return undefined;
  return [...product.images].sort((a,b) => a.sort_order-b.sort_order)[0]?.public_url ?? null;
}
export function recommendationStatus(product: RecommendationChoice) {
  if (!product.is_active) return "Inactivo";
  if (product.is_sold_out) return "Agotado";
  if (!product.is_available) return "No disponible";
  return "Disponible";
}
export function canAddRecommendation(product: RecommendationChoice, principal: string, selected: string[]) {
  return product.id !== principal && !selected.includes(product.id) && selected.length < 4 && recommendationStatus(product) === "Disponible";
}
export function moveRecommendation(ids: string[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (index < 0 || index >= ids.length || next < 0 || next >= ids.length) return ids;
  const result = [...ids];
  [result[index], result[next]] = [result[next], result[index]];
  return result;
}

export type RecommendationAvailability = Record<string, { is_available: boolean; is_sold_out: boolean }>;

// Presentation only: availability is supplied by the existing server contract.
export function recommendationPreview(choices: RecommendationChoice[], selected: string[], availability: RecommendationAvailability) {
  return selected.flatMap(id => {
    const product = choices.find(choice => choice.id === id);
    if (!product || !availability[id]) return [];
    const current = { ...product, ...availability[id] };
    return recommendationStatus(current) === "Disponible" ? [current] : [];
  });
}
