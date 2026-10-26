import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { resolvedRecommendations } from "@/lib/product-recommendations.server";
export async function GET(request: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ success: false }, { status: 403 }); }
  const id = new URL(request.url).searchParams.get("product_id");
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false }, { status: 400 });
  try { return NextResponse.json({ success: true, products: await resolvedRecommendations(id!) }); }
  catch { return NextResponse.json({ success: false, message: "No pudimos resolver la vista previa." }, { status: 503 }); }
}
