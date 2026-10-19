export function visualPreviewEnabled(env: Readonly<Record<string, string | undefined>>) {
  const enabled = env.NOVA_VISUAL_PREVIEW === "true" || env.NEXT_PUBLIC_NOVA_VISUAL_PREVIEW === "true";
  if (!enabled) return false;
  if (env.NOVA_VISUAL_PREVIEW !== "true" || env.NEXT_PUBLIC_NOVA_VISUAL_PREVIEW !== "true") throw Error("Visual preview flags must agree.");
  if (env.VERCEL_ENV === "production" || env.VERCEL_GIT_COMMIT_REF === "master") throw Error("Visual preview is forbidden in Production/master.");
  if (Object.entries(env).some(([name, value]) => /SUPABASE/i.test(name) && Boolean(value))) throw Error("Visual preview must not contain Supabase configuration or credentials.");
  if (env.NOVA_LOCAL_LAB === "true") throw Error("Visual preview must not connect to a running lab.");
  return true;
}
