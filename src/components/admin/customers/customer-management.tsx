"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Plus, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalContent, ModalDescription, ModalTitle } from "@/components/ui/modal";

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
    setShowCreate(false);
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
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Clientes en la lista"
          value={String(customers.length)}
          description="Resultado de la consulta actual"
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          label="Clientes activos"
          value={String(activeCustomers)}
          description="Activos en la lista actual"
          icon={<UserCheck className="h-5 w-5" />}
          tone="success"
        />
      </div>

      {
        error && (
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
        )
      }

      <CustomerList
        customers={customers}
        loading={loading}
        onSearch={(value) => void loadCustomers(value)}
        onView={(id) => void openCustomer(id)}
      />

      {
        detailLoading && (
          <Modal open>
            <ModalContent dismissible={false} showCloseButton={false} className="items-center py-10 text-center">
              <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-brand" />
              <ModalTitle className="text-base">
                Cargando cliente
              </ModalTitle>
              <ModalDescription role="status">
                Obteniendo los datos y el historial de pedidos…
              </ModalDescription>
            </ModalContent>
          </Modal>
        )
      }

      {
        detailError && !detailLoading && (
          <Modal open onOpenChange={open => { if (!open) setDetailError(""); }}>
            <ModalContent>
              <ModalTitle>
                No se pudo cargar el cliente
              </ModalTitle>
              <ModalDescription>
                {detailError}
              </ModalDescription>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailError("")}>
                  Cerrar
                </Button>
              </div>
            </ModalContent>
          </Modal>
        )
      }

      {
        selectedCustomer && (
          <CustomerDetail
            data={selectedCustomer}
            onClose={closeDetail}
            onEdit={startEditing}
            onCustomerUpdated={handleDeletedOrDisabled}
          />
        )
      }

      {
        (showCreate || editingCustomer) && (
          <CustomerForm
            customer={editingCustomer}
            onClose={() => {
              setShowCreate(false);
              setEditingCustomer(null);
            }}
            onSaved={handleSaved}
          />
        )
      }
    </div>
  );
}