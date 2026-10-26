import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AVATAR_BUCKET, AvatarInputError, normalizeAvatar, readAvatarBody } from "@/lib/profile-avatar";

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });

async function actor() {
  try { return await requireEmployeeOrAdmin(); } catch { return null; }
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function GET(request: Request) {
  const profile = await actor();
  if (!profile) return json({ success: false, message: "Inicia sesión con una cuenta activa." }, 403);
  try {
    const bucket = createAdminClient().storage.from(AVATAR_BUCKET);
    // The client never chooses an owner or storage path.
    if (new URL(request.url).searchParams.get("image") === "1") {
      const { data, error } = await bucket.download(`${profile.id}/avatar.webp`);
      if (error || !data) return new Response(null, { status: 404, headers: privateHeaders });
      return new Response(data, { headers: { ...privateHeaders, "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" } });
    }
    const { data, error } = await bucket.list(profile.id, { limit: 2, search: "avatar.webp" });
    if (error) throw error;
    return json({ success: true, hasPhoto: (data ?? []).some(file => file.name === "avatar.webp") });
  } catch { return json({ success: false, message: "No se pudo consultar tu foto. Intenta nuevamente." }, 503); }
}

export async function PUT(request: Request) {
  const profile = await actor();
  if (!profile) return json({ success: false, message: "Inicia sesión con una cuenta activa." }, 403);
  if (!sameOrigin(request)) return json({ success: false, message: "Origen no permitido." }, 403);
  try {
    const image = await normalizeAvatar(await readAvatarBody(request));
    const { error } = await createAdminClient().storage.from(AVATAR_BUCKET).upload(`${profile.id}/avatar.webp`, image, { upsert: true, contentType: "image/webp", cacheControl: "0" });
    if (error) throw error;
    return json({ success: true, hasPhoto: true });
  } catch (error) {
    return error instanceof AvatarInputError ? json({ success: false, message: error.message }, error.status) : json({ success: false, message: "No se pudo guardar la foto. Tu foto anterior se conserva; intenta nuevamente." }, 503);
  }
}

export async function DELETE(request: Request) {
  const profile = await actor();
  if (!profile) return json({ success: false, message: "Inicia sesión con una cuenta activa." }, 403);
  if (!sameOrigin(request)) return json({ success: false, message: "Origen no permitido." }, 403);
  try {
    const { error } = await createAdminClient().storage.from(AVATAR_BUCKET).remove([`${profile.id}/avatar.webp`]);
    if (error) throw error;
    return json({ success: true, hasPhoto: false });
  } catch { return json({ success: false, message: "No se pudo eliminar la foto. Intenta nuevamente." }, 503); }
}
