"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, TriangleAlert } from "lucide-react";
import { Badge, type OrderStatus } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserRole } from "@/lib/auth/permissions";
import { formatDateTime, formatMoney } from "@/lib/format";

type OneOrMany<T> = T | T[] | null;

function first<T>(value: OneOrMany<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type CustomerRef = { id: string; name: string; phone: string | null; whatsapp: string | null };

type OrderRow = {
  id: string;
  order_number: number;
  order_type: "online" | "fisica";
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  total: number;
  reserved_until: string | null;
  cancellation_reason: string | null;
  created_at: string;
  customer: OneOrMany<CustomerRef>;
};

type OrderItem = {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  message: string | null;
  note: string | null;
};

type OrderDetail = OrderRow & {
  customer_message: string | null;
  internal_note: string | null;
  order_items: OrderItem[];
};

type PendingPayment = {
  id: string;
  order_id: string;
  method: "qr" | "efectivo";
  amount: number;
  reference: string | null;
};

const STATUS_CHIPS: { value: "activos" | "todos" | OrderStatus; label: string }[] = [
  { value: "activos", label: "Activos" },
  { value: "todos", label: "Todos" },
  { value: "pendiente_pago", label: "Pendiente de pago" },
  { value: "confirmado", label: "Confirmado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "listo", label: "Listo" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "rechazado", label: "Pago rechazado" },
];

const TYPE_CHIPS: { value: "todos" | "online" | "fisica"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "online", label: "Online" },
  { value: "fisica", label: "Física" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["pendiente_pago", "confirmado", "en_preparacion", "listo"];

const NEXT_STATUS: Partial<Record<OrderStatus, { value: "en_preparacion" | "listo" | "finalizado"; label: string }>> =
  {
    confirmado: { value: "en_preparacion", label: "Marcar en preparación" },
    en_preparacion: { value: "listo", label: "Marcar listo" },
    listo: { value: "finalizado", label: "Marcar entregado" },
  };

type OrdersPanelProps = {
  role: UserRole;
  initialStatus?: string;
  initialPendingPaymentOnly?: boolean;
};

export function OrdersPanel({ role, initialStatus, initialPendingPaymentOnly }: OrdersPanelProps) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialChip = STATUS_CHIPS.find((chip) => chip.value === initialStatus)?.value;
  const [statusFilter, setStatusFilter] = useState<"activos" | "todos" | OrderStatus>(initialChip ?? "activos");
  const [typeFilter, setTypeFilter] = useState<"todos" | "online" | "fisica">("todos");
  const [pendingOnly, setPendingOnly] = useState(Boolean(initialPendingPaymentOnly));
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      const [ordersResponse, paymentsResponse] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/payments?status=pendiente"),
      ]);
      const ordersBody = await ordersResponse.json();
      const paymentsBody = await paymentsResponse.json();

      if (!ordersResponse.ok || !ordersBody.success) {
        throw new Error(ordersBody.message ?? "No se pudieron obtener los pedidos.");
      }
      if (!paymentsResponse.ok || !paymentsBody.success) {
        throw new Error(paymentsBody.message ?? "No se pudieron obtener los pagos pendientes.");
      }

      setOrders(ordersBody.orders ?? []);
      setPendingPayments(paymentsBody.payments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron obtener los pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await loadOrders();
    })();
  }, []);

  const pendingPaymentByOrder = useMemo(() => {
    const map = new Map<string, PendingPayment>();
    for (const payment of pendingPayments) map.set(payment.order_id, payment);
    return map;
  }, [pendingPayments]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter === "activos" && !ACTIVE_STATUSES.includes(order.status)) return false;
      if (statusFilter !== "activos" && statusFilter !== "todos" && order.status !== statusFilter) return false;
      if (typeFilter !== "todos" && order.order_type !== typeFilter) return false;
      if (pendingOnly && !pendingPaymentByOrder.has(order.id)) return false;

      if (term) {
        const customer = first(order.customer);
        const haystack = `${order.order_number} ${customer?.name ?? ""} ${customer?.phone ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [orders, statusFilter, typeFilter, pendingOnly, search, pendingPaymentByOrder]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((chip) => (
            <Button
              key={chip.value}
              size="sm"
              variant={statusFilter === chip.value ? "default" : "outline"}
              onClick={() => setStatusFilter(chip.value)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_CHIPS.map((chip) => (
            <Button
              key={chip.value}
              size="sm"
              variant={typeFilter === chip.value ? "secondary" : "ghost"}
              onClick={() => setTypeFilter(chip.value)}
            >
              {chip.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={pendingOnly ? "secondary" : "ghost"}
            onClick={() => setPendingOnly((current) => !current)}
          >
            Con pago por verificar
          </Button>
          <div className="relative ml-auto w-full max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
            />
            <Input
              aria-label="Buscar por número o cliente"
              placeholder="Buscar por número o cliente"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="h-14 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="items-center gap-2 text-center">
          <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-danger" />
          <p className="text-text-secondary">{error}</p>
          <Button variant="outline" onClick={() => void loadOrders()}>
            Reintentar
          </Button>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="items-center gap-1 text-center">
          <p className="text-text">No hay pedidos con este filtro.</p>
          <p className="text-text-secondary">Prueba con otro estado o limpia la búsqueda.</p>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden p-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead numeric>Total</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const customer = first(order.customer);
                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(order.id)}
                    >
                      <TableCell className="font-mono">#{order.order_number}</TableCell>
                      <TableCell>{customer?.name ?? "Cliente anónimo"}</TableCell>
                      <TableCell>{order.order_type === "online" ? "Online" : "Física"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge status={order.status} />
                          {pendingPaymentByOrder.has(order.id) && (
                            <Badge variant="outline">Pago por verificar</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell numeric>{formatMoney(order.total)}</TableCell>
                      <TableCell>{formatDateTime(order.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="flex flex-col gap-2 md:hidden">
            {filteredOrders.map((order) => {
              const customer = first(order.customer);
              return (
                <Card
                  key={order.id}
                  interactive
                  className="gap-2"
                  onClick={() => setSelectedId(order.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm">#{order.order_number}</span>
                    <span className="font-medium tabular-nums">{formatMoney(order.total)}</span>
                  </div>
                  <p className="text-text-secondary">{customer?.name ?? "Cliente anónimo"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge status={order.status} />
                    {pendingPaymentByOrder.has(order.id) && <Badge variant="outline">Pago por verificar</Badge>}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <OrderDetailModal
        orderId={selectedId}
        role={role}
        pendingPayment={selectedId ? (pendingPaymentByOrder.get(selectedId) ?? null) : null}
        onClose={() => setSelectedId(null)}
        onChanged={() => void loadOrders()}
      />
    </div>
  );
}

type PendingAction = "cancel" | "reject-payment" | "request-deletion" | null;

function OrderDetailModal({
  orderId,
  role,
  pendingPayment,
  onClose,
  onChanged,
}: {
  orderId: string | null;
  role: UserRole;
  pendingPayment: PendingPayment | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!orderId) {
      // El modal ya está cerrado (open={Boolean(orderId)} es false), así que no
      // hace falta limpiar `order`: la próxima vez que se abra con otro pedido,
      // este mismo efecto vuelve a cargarlo y lo sobrescribe antes de mostrarse.
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setPendingAction(null);
        setReason("");
        setActionError("");
        setLoading(true);
        setError("");
        const response = await fetch(`/api/admin/orders/${orderId}`);
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.message ?? "No se pudo obtener el pedido.");
        }
        if (!cancelled) setOrder(body.order);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo obtener el pedido.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function runAction(url: string, body?: Record<string, unknown>) {
    try {
      setBusy(true);
      setActionError("");
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "No se pudo completar la acción.");
      }
      setPendingAction(null);
      setReason("");
      onChanged();
      if (orderId) {
        const detail = await fetch(`/api/admin/orders/${orderId}`).then((r) => r.json());
        if (detail.success) setOrder(detail.order);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  const canCancelPaid = role === "administrador";
  const next = order ? NEXT_STATUS[order.status] : undefined;

  return (
    <Modal open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader>
          <ModalTitle>{order ? `Pedido #${order.order_number}` : "Pedido"}</ModalTitle>
          <ModalDescription>
            {order ? formatDateTime(order.created_at) : "Cargando información del pedido…"}
          </ModalDescription>
        </ModalHeader>

        {loading ? (
          <p className="text-text-secondary">Cargando…</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : order ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={order.status} />
              {pendingPayment && <Badge variant="outline">Pago por verificar</Badge>}
            </div>

            <div className="text-sm text-text-secondary">
              <p className="text-text">{first(order.customer)?.name ?? "Cliente anónimo"}</p>
              {first(order.customer)?.phone && <p>{first(order.customer)?.phone}</p>}
            </div>

            <div className="flex flex-col gap-1 border-t border-border-decorative pt-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text">
                    {item.quantity} × {item.product_name_snapshot}
                  </span>
                  <span className="tabular-nums text-text-secondary">{formatMoney(item.line_total)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1 border-t border-border-decorative pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Descuento</span>
                  <span className="tabular-nums">-{formatMoney(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-text">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(order.total)}</span>
              </div>
            </div>

            {order.cancellation_reason && (
              <p className="text-sm text-text-secondary">Motivo: {order.cancellation_reason}</p>
            )}

            {actionError && <p className="text-sm text-danger">{actionError}</p>}

            {pendingAction ? (
              <div className="flex flex-col gap-2">
                <Field
                  label={
                    pendingAction === "cancel"
                      ? "Motivo de la cancelación"
                      : pendingAction === "reject-payment"
                        ? "Motivo del rechazo"
                        : "Motivo de la solicitud"
                  }
                >
                  <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPendingAction(null)} disabled={busy}>
                    Volver
                  </Button>
                  <Button
                    variant="destructive"
                    loading={busy}
                    disabled={reason.trim().length === 0}
                    onClick={() => {
                      if (pendingAction === "cancel") {
                        void runAction(`/api/admin/orders/${order.id}/cancel`, { reason });
                      } else if (pendingAction === "reject-payment" && pendingPayment) {
                        void runAction(`/api/admin/payments/${pendingPayment.id}/reject`, { reason });
                      } else if (pendingAction === "request-deletion") {
                        void runAction(`/api/admin/orders/${order.id}/deletion-request`, { reason });
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            ) : (
              <ModalFooter className="flex-wrap">
                {order.status === "finalizado" && (
                  <Button asChild variant="outline">
                    <Link href={`/api/admin/orders/${order.id}/receipt`} target="_blank" rel="noopener noreferrer">
                      Ver recibo
                    </Link>
                  </Button>
                )}

                {order.status === "cancelado" && (
                  <Button variant="outline" onClick={() => setPendingAction("request-deletion")}>
                    Solicitar eliminación
                  </Button>
                )}

                {order.status === "pendiente_pago" && pendingPayment && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setPendingAction("reject-payment")}
                    >
                      Rechazar pago
                    </Button>
                    <Button
                      loading={busy}
                      onClick={() => void runAction(`/api/admin/payments/${pendingPayment.id}/confirm`)}
                    >
                      Confirmar pago
                    </Button>
                  </>
                )}

                {(order.status === "pendiente_pago" || order.status === "confirmado" || order.status === "en_preparacion" || order.status === "listo") && (
                  <Button
                    variant="destructive"
                    disabled={order.status !== "pendiente_pago" && !canCancelPaid}
                    title={
                      order.status !== "pendiente_pago" && !canCancelPaid
                        ? "Solo un administrador puede cancelar una venta ya pagada."
                        : undefined
                    }
                    onClick={() => setPendingAction("cancel")}
                  >
                    Cancelar pedido
                  </Button>
                )}

                {next && (
                  <Button loading={busy} onClick={() => void runAction(`/api/admin/orders/${order.id}/status`, { new_status: next.value })}>
                    {next.label}
                  </Button>
                )}
              </ModalFooter>
            )}
          </div>
        ) : null}
      </ModalContent>
    </Modal>
  );
}