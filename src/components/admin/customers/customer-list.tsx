"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <Card className="gap-0 overflow-hidden p-0">
      <div className="border-b border-border-decorative px-4 pt-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">
            Directorio de clientes
          </h2>
          <p className="text-xs text-text-secondary">
            {filteredCustomers.length} {filteredCustomers.length === 1 ? "cliente" : "clientes"}
          </p>
        </div>
        <div className="admin-tabs" aria-label="Filtrar clientes por estado">
          {
            [{ value: "todos", label: "Todos" }, { value: "activos", label: "Activos" }, { value: "inactivos", label: "Inactivos" }].map(item => <button
              key={item.value}
              type="button"
              aria-pressed={status === item.value}
              onClick={() => { setStatus(item.value); setPage(1); }}
            >
              {item.label}
            </button>)
          }
        </div>
      </div>
      <form
        className="admin-toolbar border-b border-border-decorative p-4 sm:px-5"
        onSubmit={event => { event.preventDefault(); submitSearch(); }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
          />
          <Input
            aria-label="Buscar clientes"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          <Search aria-hidden="true" />Buscar
        </Button>
      </form>

      {
        loading ? <div role="status" className="space-y-3 p-5">
          <span className="sr-only">
            Cargando clientes…
          </span>{
            Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)
          }
        </div> : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Cliente
                    </TableHead>
                    <TableHead>
                      Teléfono
                    </TableHead>
                    <TableHead>
                      Correo
                    </TableHead>
                    <TableHead>
                      Cumpleaños
                    </TableHead>
                    <TableHead>
                      Estado
                    </TableHead>
                    <TableHead className="text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {
                    visibleCustomers.map(customer => <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
                            aria-hidden="true"
                          >
                            {getInitials(customer.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-64 break-words font-semibold">
                              {customer.name}
                            </p>
                            <p className="mt-1 text-xs text-text-secondary">
                              ID: {customer.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.phone || "—"}
                      </TableCell>
                      <TableCell className="max-w-56 break-words">
                        {customer.email || "—"}
                      </TableCell>
                      <TableCell>
                        {customer.birthday || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={customer.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-slate-50"}
                        >
                          {customer.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={"Ver cliente " + customer.name}
                          onClick={() => onView(customer.id)}
                        >
                          <Eye aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>)
                  }
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-border-decorative md:hidden">
              {
                visibleCustomers.map(customer => <button
                  key={customer.id}
                  type="button"
                  aria-label={"Ver cliente " + customer.name}
                  onClick={() => onView(customer.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-brand-soft/40 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <div
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
                  >
                    {getInitials(customer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-words text-sm font-semibold">
                        {customer.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={customer.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-slate-50"}
                      >
                        {customer.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {customer.phone || "Sin teléfono"}
                    </p>{
                      customer.email && <p className="mt-1 break-all text-xs text-text-secondary">
                        {customer.email}
                      </p>
                    }
                  </div>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-secondary" />
                </button>)
              }
            </div>
            {
              !visibleCustomers.length && <EmptyState
                icon={<UserRound />}
                title="No se encontraron clientes"
                description="Prueba otra búsqueda o cambia el filtro de estado."
              />
            }
            {
              filteredCustomers.length > 0 && <div
                className="flex flex-wrap items-center justify-between gap-3 border-t border-border-decorative bg-slate-50 px-4 py-3 sm:px-5"
              >
                <p className="text-xs text-text-secondary">
                  Página {page} de {totalPages} · {filteredCustomers.length} clientes
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Página anterior"
                    disabled={page === 1}
                    onClick={() => setPage(current => Math.max(1, current - 1))}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Página siguiente"
                    disabled={page >= totalPages}
                    onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                  >
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            }
          </>
        )
      }
    </Card>
  );
}
