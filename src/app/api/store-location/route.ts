import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeLocationSchema } from "@/validations/store-location";

export async function GET() {
  try { const { data, error } = await createAdminClient().from("system_settings").select("value").eq("key", "store_location").maybeSingle();
    if (error) throw error;
    const parsed = storeLocationSchema.safeParse(data?.value ?? {});
    return NextResponse.json({ success: true, location: parsed.success ? parsed.data : null });
  } catch { return NextResponse.json({ success: false, message: "Ubicación no disponible." }, { status: 503 }); }
}
