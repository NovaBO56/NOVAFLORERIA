"use client";

import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

import CustomerList from "./customer-list";
import CustomerDetail from "./customer-detail";
import CustomerForm from "./customer-form";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  birthday: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerOrder = {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
};

export type CustomerDetailData = {
  customer: Customer;
  orders: CustomerOrder[];
};

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetailData | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  async function loadCustomers(search = "") {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/customers?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "No se pudieron obtener los clientes.",
        );
      }

      setCustomers(data.customers ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron obtener los clientes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadCustomers();
  }, 0);

  return () => window.clearTimeout(timer);
}, []);

  async function openCustomer(id: string) {
    try {
      setDetailLoading(true);
      setDetailError("");

      const response = await fetch(`/api/admin/customers/${id}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "No se pudo obtener el cliente.",
        );
      }

      setSelectedCustomer({
        customer: data.customer,
        orders: data.orders ?? [],
      });
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : "No se pudo obtener el cliente.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedCustomer(null);
    setDetailError("");
  }

  function startEditing(customer: Customer) {
    setSelectedCustomer(null);
    setEditingCustomer(customer);
  }

  function handleSaved(customer: Customer) {
    setEditingCustomer(null);

    setCustomers((current) => {
      const exists = current.some((item) => item.id === customer.id);

      if (exists) {
        return current.map((item) =>
          item.id === customer.id ? customer : item,
        );
      }

      return [customer, ...current];
    });
  }

  function handleDeletedOrDisabled(customer: Customer) {
    setCustomers((current) =>
      current.map((item) =>
        item.id === customer.id ? customer : item,
      ),
    );
  }

  const activeCustomers = customers.filter(
    (customer) => customer.is_active,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión"
        title="Clientes"
        description="Administra la información y el historial de tus clientes."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total clientes"
          value={String(customers.length)}
          description="Clientes registrados"
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          label="Clientes activos"
          value={String(activeCustomers)}
          description="Actualmente activos"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {error && (
        <Card className="border-red-200 p-4">
          <p className="font-medium text-red-700">
            No se pudieron cargar los clientes
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>

          <Button
            className="mt-3"
            variant="outline"
            onClick={() => void loadCustomers()}
          >
            Reintentar
          </Button>
        </Card>
      )}

      <CustomerList
        customers={customers}
        loading={loading}
        onSearch={(value) => void loadCustomers(value)}
        onView={(id) => void openCustomer(id)}
      />

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="p-6">
            Cargando cliente...
          </Card>
        </div>
      )}

      {detailError && !detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="font-semibold">
              No se pudo cargar el cliente
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {detailError}
            </p>

            <Button
              className="mt-4"
              onClick={() => setDetailError("")}
            >
              Cerrar
            </Button>
          </Card>
        </div>
      )}

      {selectedCustomer && (
        <CustomerDetail
          data={selectedCustomer}
          onClose={closeDetail}
          onEdit={startEditing}
          onCustomerUpdated={handleDeletedOrDisabled}
        />
      )}

      {(showCreate || editingCustomer) && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => {
            setShowCreate(false);
            setEditingCustomer(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}