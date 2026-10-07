/**
 * Tipos de lo que devuelve el API público de la tienda
 * (/api/products, /api/categories, /api/promotions, /api/business-hours).
 */

export type PublicImage = {
  id: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
};

export type PublicProduct = {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  occasion: string | null;
  season_id: string | null;
  is_featured: boolean;
  is_available: boolean;
  is_sold_out: boolean;
  catalog_order: number | null;
  images: PublicImage[];
};

export type ProductComponent = {
  id: string;
  quantity: number;
  component_product: {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
    is_sold_out: boolean;
  } | null;
};

export type ProductDetail = PublicProduct & {
  description: string | null;
  components: ProductComponent[] | null;
};

export type PublicCategory = {
  id: string;
  name: string;
  description: string | null;
};

export type PublicPromotion = {
  id: string;
  name: string;
  description: string | null;
  promotion_type: "producto" | "combo";
  discount_type: "porcentaje" | "monto_fijo" | null;
  discount_value: number | null;
  combo_price: number | null;
  starts_at: string | null;
  ends_at: string | null;
  minimum_purchase: number | null;
};

export type BusinessStatus = {
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  is_closed_today: boolean;
  accept_orders_outside_hours: boolean;
};

export type WeekDay = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};