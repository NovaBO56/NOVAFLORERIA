"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  async function handleLogout() {
    await supabase.auth.signOut();

const {
  data: { user },
} = await supabase.auth.getUser();

console.log("Usuario después de logout:", user);



 router.push("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">NOVA Florería</h1>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Cerrar sesión
      </button>
    </main>
  );
}