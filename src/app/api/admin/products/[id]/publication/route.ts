import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireEmployeeOrAdmin(); } catch { return NextResponse.json({ success: false }, { status: 403 }); }
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false }, { status: 400 });
  const { data, error } = await createAdminClient().rpc("get_product_publication_diagnostics", { p_product: id });
  if (error) return NextResponse.json({ success: false, message: "No se pudo comprobar la configuración." }, { status: 503 });
  return NextResponse.json({ success: !!data, diagnostics: data }, { status: data ? 200 : 404 });
}
