import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { storeLocationSchema } from "@/validations/store-location";

export async function GET() {
  try { await requireAdmin(); const client = await createClient(); const { data, error } = await client.from("system_settings").select("value").eq("key", "store_location").maybeSingle();
    if (error) return NextResponse.json({ success: false, message: "No se pudo leer la ubicación." }, { status: 500 });
    return NextResponse.json({ success: true, location: data?.value ?? {} });
  } catch { return NextResponse.json({ success: false, message: "Administrador activo requerido." }, { status: 403 }); }
}
export async function PATCH(request: Request) {
  try { const actor = await requireAdmin(); const parsed = storeLocationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message }, { status: 400 });
    const client = await createClient(); const { data, error } = await client.from("system_settings").update({ value: parsed.data, updated_by: actor.id, updated_at: new Date().toISOString() }).eq("key", "store_location").select("key").maybeSingle();
    if (error || !data) return NextResponse.json({ success: false, message: "No se pudo guardar la ubicación. Comprueba la migración incremental." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, message: "No se pudo guardar la ubicación." }, { status: 403 }); }
}
