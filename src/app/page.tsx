
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  role: "administrador" | "empleado";
  is_active: boolean;
};

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_active")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error cargando perfil:", error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <main className="p-8">Cargando perfil...</main>;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Florería</h1>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Usuario autenticado
          </h2>

          {profile ? (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {profile.id}
              </p>

              <p>
                <strong>Nombre:</strong>{" "}
                {profile.full_name ?? "Sin nombre"}
              </p>

              <p>
                <strong>Rol:</strong> {profile.role}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {profile.is_active ? "Activo" : "Inactivo"}
              </p>
            </div>
          ) : (
            <p>No se pudo cargar el perfil.</p>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="rounded-md border px-4 py-2"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
