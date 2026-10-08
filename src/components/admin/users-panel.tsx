"use client";

import { useState } from "react";
import CreateUserForm from "./create-user-form";
import UserManagement from "./user-management";

export function UsersPanel() {
  const [revision, setRevision] = useState(0);

  return <>
    <section className="flex flex-col gap-4">
      <h2>Crear usuario</h2>
      <CreateUserForm onCreated={() => setRevision(current => current + 1)} />
    </section>
    <section className="flex flex-col gap-4">
      <h2>Usuarios registrados</h2>
      <UserManagement key={revision} />
    </section>
  </>;
}
