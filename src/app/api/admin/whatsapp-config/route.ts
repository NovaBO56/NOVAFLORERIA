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

    const { data, error } = await admin.rpc("set_checkout_configuration", {
      p_actor: profile.id, p_kind: "whatsapp", p_active: true, p_value: result.data.phone_number,
    });

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
export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await createAdminClient().from("whatsapp_config").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return NextResponse.json({ success: false, message: "No se pudo leer la configuración." }, { status: 500 });
    return NextResponse.json({ success: true, whatsapp_config: data });
  } catch { return NextResponse.json({ success: false, message: "Administrador activo requerido." }, { status: 403 }); }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireAdmin();
    const body = await request.json();
    if (body.is_active !== false) return NextResponse.json({ success: false, message: "Para activar, guarda una nueva configuración." }, { status: 400 });
    const { error } = await createAdminClient().rpc("set_checkout_configuration", { p_actor: profile.id, p_kind: "whatsapp", p_active: false });
    if (error) return NextResponse.json({ success: false, message: "No se pudo desactivar." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, message: "Administrador activo requerido." }, { status: 403 }); }
}
