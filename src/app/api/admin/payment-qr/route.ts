import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePaymentQrSchema } from "@/validations/payments";

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

    const result = updatePaymentQrSchema.safeParse({
      account_label: accountLabelRaw ? String(accountLabelRaw) : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const extension = file.name.split(".").pop() || "png";
    const storagePath = `qr-${Date.now()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("payment-qr")
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Error subiendo el QR:", uploadError);
      return NextResponse.json({ success: false, message: "No se pudo subir la imagen del QR." }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from("payment-qr").getPublicUrl(storagePath);

    // Solo puede haber un QR activo: desactivamos los anteriores.
    await admin.from("payment_qr_config").update({ is_active: false }).eq("is_active", true);

    const { data, error } = await admin
      .from("payment_qr_config")
      .insert({
        qr_storage_path: storagePath,
        qr_public_url: publicUrlData.publicUrl,
        account_label: result.data.account_label || null,
        is_active: true,
        updated_by: profile.id,
      })
      .select("id, qr_public_url, account_label, is_active, created_at")
      .single();

    if (error) {
      console.error("Error guardando la configuración del QR:", error);
      return NextResponse.json({ success: false, message: "No se pudo guardar el QR." }, { status: 500 });
    }

    return NextResponse.json({ success: true, qr_config: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}