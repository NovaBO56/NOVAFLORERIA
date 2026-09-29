"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { Customer } from "./customer-management";

const PAGE_SIZE = 10;

type Props = {
  customers: Customer[];
  loading: boolean;
  onSearch: (value: string) => void;
  onView: (id: string) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function CustomerList({
  customers,
  loading,
  onSearch,
  onView,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);

  const filteredCustomers = useMemo(() => {
    if (status === "activos") {
      return customers.filter((customer) => customer.is_active);
    }

    if (status === "inactivos") {
      return customers.filter((customer) => !customer.is_active);
    }

    return customers;
  }, [customers, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );

  const visibleCustomers = filteredCustomers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function submitSearch() {
    setPage(1);
    onSearch(search);
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitSearch();
                }
              }}
              placeholder="Buscar por nombre o teléfono..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <Button
            variant="outline"
            onClick={submitSearch}
          >
            Buscar
          </Button>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-b px-4 py-4 md:px-6">
        <div>
          <h2 className="font-semibold">
            Lista de clientes
          </h2>

          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} clientes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">
                    Cliente
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Teléfono
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Correo
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Cumpleaños
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Estado
                  </th>

                  <th className="px-6 py-3 text-right font-medium">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                          {getInitials(customer.name)}
                        </div>

                        <div>
                          <p className="font-medium">
                            {customer.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {customer.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {customer.phone || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {customer.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {customer.birthday || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          customer.is_active
                            ? "brand"
                            : "outline"
                        }
                      >
                        {customer.is_active
                          ? "Activo"
                          : "Inactivo"}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onView(customer.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden">
            {visibleCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onView(customer.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <UserRound className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate font-medium">
                      {customer.name}
                    </p>

                    <Badge
                      variant={
                        customer.is_active
                          ? "brand"
                          : "outline"
                      }
                    >
                      {customer.is_active
                        ? "Activo"
                        : "Inactivo"}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {customer.phone || "Sin teléfono"}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          {!visibleCustomers.length && (
            <div className="p-10 text-center">
              <UserRound className="mx-auto h-8 w-8 text-muted-foreground/50" />

              <p className="mt-3 font-medium">
                No se encontraron clientes
              </p>
            </div>
          )}

          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}