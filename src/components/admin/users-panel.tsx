"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import CreateUserForm from "./create-user-form";
import UserManagement from "./user-management";

export function UsersPanel() {
  const [revision, setRevision] = useState(0);

  return <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
    <CreateUserForm onCreated={() => setRevision(current => current + 1)} />
    <SectionCard title="Equipo registrado" description="Revisa el rol de cada persona y administra su acceso."><UserManagement key={revision} /></SectionCard>
  </div>;
}
