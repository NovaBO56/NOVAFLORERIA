import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePaymentQrSchema, patchPaymentQrSchema } from "@/validations/payments";

import { paymentQrExtension } from "@/lib/payment-qr-file";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const profile = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const accountLabelRaw = formData.get("account_label");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Falta la imagen del QR." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Formato de imagen no soportado. Usa PNG, JPG o WebP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "La imagen no puede pesar más de 5 MB." },
        { status: 400 },
      );
    }

    if (formData.has("is_active") && !["true", "false"].includes(String(formData.get("is_active")))) return NextResponse.json({ success: false, message: "Estado de QR inválido." }, { status: 400 });
    const result = updatePaymentQrSchema.safeParse({
      account_label: accountLabelRaw ? String(accountLabelRaw) : null,
      qr_slot: formData.get("qr_slot") ?? "qr_1",
      is_active: formData.get("is_active") === null ? true : formData.get("is_active") === "true",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const extension = paymentQrExtension(file.type, new Uint8Array(arrayBuffer));
    if (!extension) return NextResponse.json({ success: false, message: "La imagen está vacía o no coincide con su formato." }, { status: 400 });
    try {
      // Decodificar para rechazar imágenes truncadas, conservando el archivo original.
      await sharp(Buffer.from(arrayBuffer), { limitInputPixels: 16_000_000, failOn: "warning" }).toBuffer();
    } catch {
      return NextResponse.json({ success: false, message: "La imagen no se puede decodificar." }, { status: 400 });
    }
    const storagePath = `${result.data.qr_slot}/qr-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage
      .from("payment-qr")
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Error subiendo el QR:", uploadError);
      return NextResponse.json({ success: false, message: "No se pudo subir la imagen del QR." }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from("payment-qr").getPublicUrl(storagePath);

    const { data, error } = await admin.rpc("set_payment_qr_slot", {
      p_actor: profile.id, p_slot: result.data.qr_slot, p_active: result.data.is_active, p_value: publicUrlData.publicUrl,
      p_storage_path: storagePath, p_label: result.data.account_label || null,
    });

    if (error) {
      await admin.storage.from("payment-qr").remove([storagePath]);
      console.error("Error guardando la configuración del QR:", error);
      return NextResponse.json({ success: false, message: "No se pudo guardar el QR." }, { status: 500 });
    }

    return NextResponse.json({ success: true, qr_config: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}
export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const results = await Promise.all(["qr_1", "qr_2"].map(slot => admin.from("payment_qr_config").select("*").eq("qr_slot", slot).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle()));
    if (results.some(result => result.error)) return NextResponse.json({ success: false, message: "No se pudo leer la configuración." }, { status: 500 });
    return NextResponse.json({ success: true, qr_config: results[0].data, qr_configs: results.flatMap(result => result.data ? [result.data] : []) });
  } catch { return NextResponse.json({ success: false, message: "Administrador activo requerido." }, { status: 403 }); }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireAdmin();
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "JSON inválido." }, { status: 400 }); }
    const parsed = patchPaymentQrSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Configuración de QR inválida." }, { status: 400 });
    const { data, error } = await createAdminClient().rpc("set_payment_qr_slot", { p_actor: profile.id, p_slot: parsed.data.qr_slot, p_active: parsed.data.is_active ?? null, p_label: parsed.data.account_label ?? null });
    if (error) return NextResponse.json({ success: false, message: error.code === "P0001" ? error.message : "No se pudo guardar el QR." }, { status: error.code === "P0001" ? 400 : 500 });
    return NextResponse.json({ success: true, qr_config: data });
  } catch { return NextResponse.json({ success: false, message: "Administrador activo requerido." }, { status: 403 }); }
}
