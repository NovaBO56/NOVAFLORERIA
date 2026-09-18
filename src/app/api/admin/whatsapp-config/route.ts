import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWhatsappConfigSchema } from "@/validations/whatsapp";

export async function POST(request: Request) {
  try {
    const profile = await requireAdmin();

    const body = await request.json();
    const result = updateWhatsappConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Número inválido." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    await admin.from("whatsapp_config").update({ is_active: false }).eq("is_active", true);

    const { data, error } = await admin
      .from("whatsapp_config")
      .insert({
        phone_number: result.data.phone_number,
        is_active: true,
        updated_by: profile.id,
      })
      .select("id, phone_number, is_active, created_at")
      .single();

    if (error) {
      console.error("Error guardando la configuración de WhatsApp:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo guardar el número de WhatsApp." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, whatsapp_config: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}