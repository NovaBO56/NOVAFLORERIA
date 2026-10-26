import { NextResponse } from "next/server";
import { z } from "zod";
import { resolvedRecommendations } from "@/lib/product-recommendations.server";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const excluded = (new URL(request.url).searchParams.get("exclude") ?? "").split(",").filter(Boolean);
  if (!z.string().uuid().safeParse(id).success || !z.array(z.string().uuid()).max(50).safeParse(excluded).success) return NextResponse.json({ success: false }, { status: 400 });
  try { return NextResponse.json({ success: true, products: await resolvedRecommendations(id, excluded) }); }
  catch { return NextResponse.json({ success: false, message: "No pudimos consultar los complementos." }, { status: 503 }); }
}
