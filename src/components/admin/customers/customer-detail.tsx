"use client";

import { CalendarDays, Mail, MessageCircle, Pencil, Phone, ShoppingBag, UserRound, Wallet, X } from "lucide-react";

import { Badge, ORDER_STATUS, type OrderStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalTitle, ModalDescription } from "@/components/ui/modal";

import type {
  Customer,
  CustomerDetailData,
} from "./customer-management";

type Props = {
  data: CustomerDetailData;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onCustomerUpdated: (customer: Customer) => void;
};

function formatMoney(value: number) {
  return `Bs ${Number(value || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-BO");
}

export default function CustomerDetail({
  data,
  onClose,
  onEdit,
}: Props) {
  const total = data.orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );

  return (
    <Modal open onOpenChange={open => { if (!open) onClose(); }}>
      <ModalContent showCloseButton={false} className="gap-0 p-0 md:max-w-3xl">
        <div
          className="flex items-start justify-between gap-3 border-b border-border-decorative bg-slate-50 p-5 sm:p-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-brand-soft text-brand"
            >
              <UserRound aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ModalTitle className="break-words text-lg font-semibold">
                  {data.customer.name}
                </ModalTitle>
                <Badge
                  variant="outline"
                  className={data.customer.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-slate-100"}
                >
                  {data.customer.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <ModalDescription className="mt-1 text-xs">
                Cliente registrado el {formatDate(data.customer.created_at)}
              </ModalDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar cliente" onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <section
            aria-label="Datos de contacto"
            className="grid gap-4 rounded-xl border border-border-decorative p-4 sm:grid-cols-2"
          >
            {
              [{ label: "Teléfono", value: data.customer.phone, Icon: Phone }, { label: "WhatsApp", value: data.customer.whatsapp, Icon: MessageCircle }, { label: "Correo", value: data.customer.email, Icon: Mail }, { label: "Cumpleaños", value: data.customer.birthday, Icon: CalendarDays }].map(({ label, value, Icon }) => <div key={label} className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                  <Icon aria-hidden="true" className="size-3.5 shrink-0" />{label}
                </p>
                <p className="mt-1.5 break-words text-sm font-medium">
                  {value || "No registrado"}
                </p>
              </div>)
            }
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Pedidos asociados"
              value={String(data.orders.length)}
              description="Historial de este cliente"
              icon={<ShoppingBag />}
            />
            <StatCard
              label="Total comprado"
              value={formatMoney(total)}
              description="Suma de los pedidos del historial"
              icon={<Wallet />}
              tone="brand"
            />
          </div>

          <section aria-label="Historial de pedidos">
            <div className="mb-3">
              <h3 className="text-base font-semibold">
                Historial de pedidos
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Pedidos asociados a este cliente.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-decorative">
              {
                data.orders.length === 0 ? <EmptyState
                  icon={<ShoppingBag />}
                  title="Todavía no tiene pedidos"
                  description="Los pedidos asociados a este cliente aparecerán aquí."
                /> : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Pedido
                      </TableHead>
                      <TableHead>
                        Tipo
                      </TableHead>
                      <TableHead>
                        Estado
                      </TableHead>
                      <TableHead>
                        Fecha
                      </TableHead>
                      <TableHead numeric>
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                      data.orders.map(order => <TableRow key={order.id}>
                        <TableCell className="font-semibold text-brand">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          {order.order_type}
                        </TableCell>
                        <TableCell>
                          {
                            order.status in ORDER_STATUS ? <Badge status={order.status as OrderStatus} /> : <Badge variant="outline">
                              {order.status}
                            </Badge>
                          }
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell numeric className="font-semibold">
                          {formatMoney(order.total)}
                        </TableCell>
                      </TableRow>)
                    }
                  </TableBody>
                </Table>
              }
            </div>
          </section>
        </div>

        <div className="admin-form-actions sticky bottom-0 border-t border-border-decorative bg-slate-50 p-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={() => onEdit(data.customer)}>
            <Pencil aria-hidden="true" />Editar cliente
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
