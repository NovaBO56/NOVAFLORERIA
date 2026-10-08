"use client";

import { Mail, Pencil, Phone, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    <Modal open onOpenChange={open => { if (!open) onClose(); }}><ModalContent showCloseButton={false} className="gap-0 p-0 md:max-w-3xl">
      <>
        <div className="flex items-start justify-between border-b p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <ModalTitle className="min-w-0 break-words text-lg font-semibold">
                {data.customer.name}
              </ModalTitle>

              <Badge
                variant={
                  data.customer.is_active
                    ? "brand"
                    : "outline"
                }
              >
                {data.customer.is_active
                  ? "Activo"
                  : "Inactivo"}
              </Badge>
            </div>

            <ModalDescription className="mt-1 text-sm text-muted-foreground">
              Cliente registrado el{" "}
              {formatDate(data.customer.created_at)}
            </ModalDescription>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar cliente"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-5 border-b p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Teléfono
            </p>

            <p className="mt-1 flex items-center gap-2 font-medium">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {data.customer.phone || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              WhatsApp
            </p>

            <p className="mt-1 font-medium">
              {data.customer.whatsapp || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Correo
            </p>

            <p className="mt-1 flex items-center gap-2 break-all font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {data.customer.email || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Cumpleaños
            </p>

            <p className="mt-1 font-medium">
              {data.customer.birthday || "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <>
            <p className="text-sm text-muted-foreground">
              Pedidos
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {data.orders.length}
            </p>
          </>

          <>
            <p className="text-sm text-muted-foreground">
              Total comprado
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {formatMoney(total)}
            </p>
          </>
        </div>

        <div className="px-6 pb-6">
          <h3 className="font-semibold">
            Historial de pedidos
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos asociados a este cliente.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border">
            {data.orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Este cliente todavía no tiene pedidos.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3">
                      Pedido
                    </th>

                    <th className="px-4 py-3">
                      Tipo
                    </th>

                    <th className="px-4 py-3">
                      Estado
                    </th>

                    <th className="px-4 py-3">
                      Fecha
                    </th>

                    <th className="px-4 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.order_number}
                      </td>

                      <td className="px-4 py-3">
                        {order.order_type}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {order.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {formatMoney(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>

          <Button onClick={() => onEdit(data.customer)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar cliente
          </Button>
        </div>
      </>
    </ModalContent></Modal>
  );
}
