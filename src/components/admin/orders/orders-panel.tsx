"use client";

import Link from "next/link";
import { OrderReturns } from "./order-returns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { whatsappLink } from "@/lib/public/format";
import { orderDelivery } from "@/lib/public/order-journey";

type OneOrMany<T> = T | T[] | null;

function first<T>(value: OneOrMany<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type CustomerRef = { id: string | null; name: string; phone: string | null; whatsapp: string | null };

type OrderRow = {
  customer_message: string | null;
  receipt_token: string | null;
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
  payments: (PendingPayment & { status: string })[];
  customer: OneOrMany<CustomerRef>;
};

type PersonalizationOption = {
  id: string;
  option_type: string;
  name: string;
  value: string | null;
  extra_price: number;
};

type OrderItem = {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  personalization: PersonalizationOption[] | null;
  message: string | null;
  note: string | null;
};

type OrderDetail = OrderRow & {
  inventory_review_required?: boolean;
  customer_message: string | null;
  internal_note: string | null;
  order_items: OrderItem[];
};

type PendingPayment = {
  qr_slot?: string | null;
  qr_label?: string | null;
  id: string;
  order_id: string;
  method: "qr" | "efectivo";
  amount: number;
  reference: string | null;
};

const STATUS_CHIPS: { value: "activos" | "todos" | "expirados" | OrderStatus; label: string }[] = [
  { value: "activos", label: "Activos" },
  { value: "todos", label: "Todos" },
  { value: "pendiente_pago", label: "Pendiente de pago" },
  { value: "confirmado", label: "Confirmados por preparar" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "listo", label: "Listos para entrega / recojo" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "expirados", label: "Expirados" },
  { value: "rechazado", label: "Pago rechazado" },
];

const TYPE_CHIPS: { value: "todos" | "online" | "fisica"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "online", label: "Online" },
  { value: "fisica", label: "Física" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, { value: "en_preparacion" | "listo" | "finalizado"; label: string }>> =
  {
    confirmado: { value: "en_preparacion", label: "Marcar en preparación" },
    en_preparacion: { value: "listo", label: "Marcar listo" },
    listo: { value: "finalizado", label: "Finalizar pedido" },
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
  const [statusFilter, setStatusFilter] = useState<"activos" | "todos" | "expirados" | OrderStatus>(initialChip ?? "activos");
  const [typeFilter, setTypeFilter] = useState<"todos" | "online" | "fisica">("todos");
  const [pendingOnly, setPendingOnly] = useState(Boolean(initialPendingPaymentOnly));
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const requestVersion = useRef(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({ status: statusFilter, type: typeFilter, pending_payment: String(pendingOnly), search, page: String(page), limit: "50" });
      const response = await fetch(`/api/admin/orders?${query}`);
      const body = await response.json();
      if (version !== requestVersion.current) return;
      if (!response.ok || !body.success) throw new Error(body.message ?? "No se pudieron obtener los pedidos.");
      const rows: OrderRow[] = body.orders ?? [];
      setOrders(rows);
      setPendingPayments(rows.flatMap(order => (order.payments ?? []).filter(payment => payment.status === "pendiente")));
      setPagination(body.pagination);
    } catch (err) {
      if (version === requestVersion.current) setError(err instanceof Error ? err.message : "No se pudieron obtener los pedidos.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [statusFilter, typeFilter, pendingOnly, search, page]);

  useEffect(() => {
    const version = requestVersion;
    const timer = setTimeout(() => void loadOrders(), 250);
    return () => { clearTimeout(timer); version.current++; };
  }, [loadOrders]);

  const pendingPaymentByOrder = useMemo(() => {
    const map = new Map<string, PendingPayment>();
    for (const payment of pendingPayments) map.set(payment.order_id, payment);
    return map;
  }, [pendingPayments]);

  const filteredOrders = orders ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((chip) => (
            <Button
              key={chip.value}
              size="sm"
              variant={statusFilter === chip.value ? "default" : "outline"}
              aria-pressed={statusFilter === chip.value && !pendingOnly}
              onClick={() => { setPage(1); setPendingOnly(false); setStatusFilter(chip.value); }}
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
              onClick={() => { setPage(1); setTypeFilter(chip.value); }}
            >
              {chip.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={pendingOnly ? "secondary" : "ghost"}
            aria-pressed={pendingOnly}
            onClick={() => { setPage(1); setStatusFilter("pendiente_pago"); setPendingOnly((current) => !current); }}
          >
            Con pago por verificar
          </Button>
          <div className="relative ml-auto w-full max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
            />
            <Input
              aria-label="Buscar por número, cliente o teléfono"
              placeholder="Buscar por número, cliente o teléfono"
              className="pl-9"
              value={search}
              onChange={(event) => { setPage(1); setSearch(event.target.value); }}
            />
          </div>
        </div>
      </div>

      <p className="rounded-2xl border border-brand/15 bg-brand-soft p-4 text-sm text-text-secondary">Primero revisa los <strong className="text-text">pagos por verificar</strong> en el banco. Reportar un pago no lo confirma. Los pedidos confirmados pueden pasar a preparación, luego a listo y finalmente a entrega o recojo.</p>

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
                  <TableHead>Modalidad / pago</TableHead>
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
                      className="cursor-pointer focus-visible:outline-2 focus-visible:outline-brand"
                      tabIndex={0}
                      aria-label={`Ver pedido ${order.order_number}`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(order.id);
                        }
                      }}
                      onClick={() => setSelectedId(order.id)}
                    >
                      <TableCell className="font-mono">#{order.order_number}</TableCell>
                      <TableCell>{customer?.name ?? "Cliente anónimo"}</TableCell>
                      <TableCell>{order.order_type === "online" ? "Online" : "Física"}</TableCell>
                      <TableCell><p className="text-xs">{order.order_type === "fisica" ? "Venta en tienda" : orderDelivery(order.customer_message).methodLabel}</p><p className="text-xs text-text-secondary">{paymentLabel(order)}</p></TableCell>
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
                  <p className="text-xs text-text-secondary">{formatDateTime(order.created_at)} · {order.order_type === "fisica" ? "Venta en tienda" : orderDelivery(order.customer_message).methodLabel}</p>
                  <p className="text-sm">{paymentLabel(order)}</p>
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

      <nav aria-label="Paginación de pedidos" className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-text-secondary">{pagination.total} pedidos · Página {page} de {pagination.total_pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</Button>
          <Button variant="outline" disabled={loading || page >= pagination.total_pages} onClick={() => setPage(current => current + 1)}>Siguiente</Button>
        </div>
      </nav>

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

function paymentLabel(order: OrderRow) {
  if (Number(order.total) === 0) return "No requiere pago";
  const payment = order.payments.find(item => item.status === "pendiente") ?? order.payments.find(item => item.status === "confirmado") ?? order.payments.find(item => item.status === "rechazado");
  if (!payment) return "Pago sin reportar";
  return `${payment.method === "qr" ? "QR" : "Efectivo"} · ${payment.status === "pendiente" ? "por verificar" : payment.status === "confirmado" ? "verificado" : "rechazado"}`;
}

type PendingAction = "cancel" | "reject-payment" | "request-deletion" | "confirm-payment" | null;

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
  const actionLock = useRef(false);
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
    if (actionLock.current) return;
    actionLock.current = true;
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
      actionLock.current = false;
    }
  }

  const canCancelPaid = role === "administrador";
  // Una venta física ya está pagada y entregada en el momento: no pasa
  // por confirmación de pago ni por los pasos de preparación. Esos
  // botones son exclusivos de pedidos online.
  const next = order && order.order_type === "online" ? NEXT_STATUS[order.status] : undefined;

  return (
    <Modal open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="md:max-w-lg" dismissible={!busy} showCloseButton={!busy}>
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
            <div className="rounded-xl bg-brand-soft p-3 text-sm"><p className="font-medium">{order.order_type === "fisica" ? "Venta en tienda" : orderDelivery(order.customer_message).methodLabel}</p><p>{paymentLabel(order)}</p></div>

            <div className="text-sm text-text-secondary">
              <p className="text-text">{first(order.customer)?.name ?? "Cliente anónimo"}</p>
              {first(order.customer)?.phone && <p>{first(order.customer)?.phone}</p>}
            </div>

            <div className="flex flex-col gap-3 border-t border-border-decorative pt-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 break-words text-text">
                      {item.quantity} × {item.product_name_snapshot}
                    </span>
                    <span className="tabular-nums text-text-secondary">{formatMoney(item.line_total)}</span>
                  </div>

                  {item.personalization && item.personalization.length > 0 && (
                    <p className="text-xs text-text-secondary">
                      {item.personalization
                        .map((option) => (option.extra_price > 0 ? `${option.name} (+${formatMoney(option.extra_price)})` : option.name))
                        .join(", ")}
                    </p>
                  )}

                  {item.message && (
                    <p className="text-xs text-text-secondary">
                      <span className="font-medium text-text">Mensaje:</span> {item.message}
                    </p>
                  )}

                  {item.note && (
                    <p className="text-xs text-text-secondary">
                      <span className="font-medium text-text">Nota:</span> {item.note}
                    </p>
                  )}
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

            {(order.customer_message || order.internal_note) && (
              <div className="flex flex-col gap-1 border-t border-border-decorative pt-3 text-sm">
                {order.customer_message && (
                  <p className="text-text-secondary">
                    <span className="font-medium text-text">Mensaje del cliente:</span> {order.customer_message}
                  </p>
                )}
                {order.internal_note && (
                  <p className="text-text-secondary">
                    <span className="font-medium text-text">Nota interna:</span> {order.internal_note}
                  </p>
                )}
              </div>
            )}

            {order.inventory_review_required && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">Este pedido antiguo tenía una receta incompleta. Revisa Productos → Receta y su reserva original antes de resolverlo con el administrador. Cambiar la receta ahora no reconstruye su consumo histórico; la confirmación está bloqueada para proteger el inventario.</p>}
            {order.cancellation_reason && (
              <p className="text-sm text-text-secondary">Motivo: {order.cancellation_reason}</p>
            )}

            {(order.status === "finalizado" || (order.status === "cancelado" && order.payments.some(payment => payment.status === "confirmado"))) && <OrderReturns key={order.id} orderId={order.id} total={order.total} physical={order.order_type === "fisica"} cancelled={order.status === "cancelado"} canCreate={role === "administrador"} onChanged={onChanged} onBusyChange={setBusy} />}
            {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}

            <fieldset disabled={busy} className="contents">{pendingAction === "confirm-payment" && pendingPayment ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-4">
                <h3 className="font-semibold">¿Verificaste el pago en el banco?</h3>
                <p className="text-sm">Confirma únicamente si recibiste {formatMoney(pendingPayment.amount)} para el pedido #{order.order_number}. El aviso del cliente y el QR indicado no prueban el pago. Esta acción confirma el pedido y procesa su reserva de inventario.</p>
                <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPendingAction(null)}>Volver</Button><Button loading={busy} disabled={Boolean(order.inventory_review_required)} onClick={() => void runAction(`/api/admin/payments/${pendingPayment.id}/confirm`)}>Sí, confirmar pago verificado</Button></div>
              </div>
            ) : pendingAction ? (
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
                {order.receipt_token && (
                  <Button asChild variant="outline">
                    <Link href={`/api/admin/orders/${order.id}/receipt`} target="_blank" rel="noopener noreferrer">
                      Ver / descargar recibo
                    </Link>
                  </Button>
                )}
                {order.receipt_token && whatsappLink(first(order.customer)?.whatsapp || first(order.customer)?.phone || null) ? <Button variant="outline" onClick={() => {
                  const phone = first(order.customer)?.whatsapp || first(order.customer)?.phone || null;
                  const url = new URL(`/api/orders/receipt/${order.receipt_token}`, window.location.origin).href;
                  const link = whatsappLink(phone, `Floristería Anabelle · Pago confirmado del pedido #${order.order_number}. Tu recibo: ${url}`);
                  if (link) window.open(link, "_blank", "noopener,noreferrer");
                }}>Enviar recibo por WhatsApp</Button> : null}

                {order.status === "cancelado" && (
                  <Button variant="outline" onClick={() => setPendingAction("request-deletion")}>
                    Solicitar eliminación
                  </Button>
                )}

                {pendingPayment?.qr_label ? <p className="max-w-full break-words text-sm">QR indicado: {pendingPayment.qr_label} ({pendingPayment.qr_slot}). Información auxiliar; verifica la transferencia.</p> : null}
                {order.order_type === "online" && order.status === "pendiente_pago" && pendingPayment && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setPendingAction("reject-payment")}
                    >
                      Rechazar pago
                    </Button>
                    <Button
                      loading={busy}
                      onClick={() => setPendingAction("confirm-payment")}
                      disabled={Boolean(order.inventory_review_required)}
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
            )}</fieldset>
          </div>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
