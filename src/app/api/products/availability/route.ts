import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { productAvailability } from "@/lib/public/product-availability.server";

const schema = z.object({ items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99),
  customization_option_ids: z.array(z.string().uuid()).max(30).refine(ids => new Set(ids).size === ids.length).optional(),
})).min(1).max(50), combine: z.boolean().optional().default(true) });

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(await createClient(), request, "cartAvailability"))) return rateLimitResponse();
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Revisa los productos de tu carrito." }, { status: 400 });
    return NextResponse.json({ success: true, availability: await productAvailability(parsed.data.items, parsed.data.combine) });
  } catch {
    return NextResponse.json({ success: false, message: "No pudimos comprobar tus productos. Intenta nuevamente." }, { status: 503 });
  }
}
