"use client";

import { DedicationPreview } from "@/components/public/dedication-card";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { primaryProductImage, type ProductImageSource } from "@/lib/product-images";
import type { Dedication } from "@/lib/public/dedications";
import Link from "next/link";
import { OrderReturns } from "./order-returns";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Search, TriangleAlert, X, Flower2, CalendarDays, Printer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderOverview } from "./order-overview";
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
import { OrderComposition, OrderContact, OrderHistory, OrderPayment, OrderProgress, OrderSchedule } from "./order-detail-sections";
import type { RecipeSnapshot, ScheduleFields } from "@/lib/admin/order-detail";

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
  product?: OneOrMany<{ images?: ProductImageSource[] | null }>;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  personalization: PersonalizationOption[] | null;
  message: string | null;
  dedications?: Dedication[];
  note: string | null;
  recipe_snapshot?: RecipeSnapshot | null;
};

type OrderDetail = OrderRow & ScheduleFields & {
  inventory_review_required?: boolean;
  customer_message: string | null;
  internal_note: string | null;
  order_items: OrderItem[];
};

type PendingPayment = {
  status?: string;
  confirmed_at?: string | null;
  created_at?: string;
  rejected_at?: string | null;
  rejection_reason?: string | null;
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
    confirmado: { value: "en_preparacion", label: "Iniciar preparación" },
    en_preparacion: { value: "listo", label: "Marcar como listo" },
    listo: { value: "finalizado", label: "Finalizar pedido" },
  };

type OrdersPanelProps = {
  role: UserRole;
  initialStatus?: string;
  initialSearch?: string;
  initialPendingPaymentOnly?: boolean;
};

export function OrdersPanel({ role, initialStatus, initialSearch, initialPendingPaymentOnly }: OrdersPanelProps) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialChip = STATUS_CHIPS.find((chip) => chip.value === initialStatus)?.value;
  const [statusFilter, setStatusFilter] = useState<"activos" | "todos" | "expirados" | OrderStatus>(initialChip ?? (initialSearch ? "todos" : "activos"));
  const [typeFilter, setTypeFilter] = useState<"todos" | "online" | "fisica">("todos");
  const [pendingOnly, setPendingOnly] = useState(Boolean(initialPendingPaymentOnly));
  const [search, setSearch] = useState(initialSearch ?? "");

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
    <div className="admin-orders flex flex-col gap-5">
      <OrderOverview refreshToken={orders} />
      <section aria-label="Listado de pedidos" className="admin-orders-surface overflow-hidden rounded-2xl border border-border-decorative bg-surface shadow-sm">
      <div className="bg-surface flex flex-col gap-0">
        <div className="admin-tabs px-4">
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
        <div className="flex flex-wrap items-center gap-2 bg-slate-50/70 px-4 py-3">
          {TYPE_CHIPS.map((chip) => (
            <Button
              key={chip.value}
              size="sm"
              variant={typeFilter === chip.value ? "secondary" : "ghost"}
              aria-pressed={typeFilter === chip.value}
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

      <p className="border-y border-border-decorative bg-slate-50/50 px-4 py-2 text-xs leading-5 text-text-secondary">Primero revisa los <strong className="text-text">pagos por verificar</strong> en el banco. Reportar un pago no lo confirma. Los pedidos confirmados pueden pasar a preparación, luego a listo y finalmente a entrega o recojo.</p>

      {loading ? (
        <div role="status" aria-label="Cargando pedidos" className="flex flex-col gap-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="h-14 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card role="alert" className="m-4 items-center gap-2 text-center">
          <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-danger" />
          <p className="text-text-secondary">{error}</p>
          <Button variant="outline" onClick={() => void loadOrders()}>
            Reintentar
          </Button>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={<Search />} title="No hay pedidos con este filtro" description="Prueba con otro estado o limpia la búsqueda para ver más resultados." />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Estado de pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead numeric>Total</TableHead>
                  <TableHead>Acciones</TableHead>
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
                      <TableCell><span className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-bold text-brand">#{order.order_number}</span><p className="mt-2 whitespace-nowrap text-xs text-text-secondary">{formatDateTime(order.created_at)}</p></TableCell>
                      <TableCell><div className="flex items-center gap-3"><span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{(customer?.name ?? "Cliente").split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><p className="font-semibold">{customer?.name ?? "Cliente anónimo"}</p><p className="mt-1 text-xs text-text-secondary">{customer?.phone}</p></div></div></TableCell>
                      <TableCell><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{order.order_type === "online" ? "Online" : "Tienda"}</span></TableCell>
                      <TableCell><p className="text-xs font-medium">{order.order_type === "fisica" ? "Venta en tienda" : orderDelivery(order.customer_message).methodLabel}</p></TableCell><TableCell><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${pendingPaymentByOrder.has(order.id) ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border-decorative bg-slate-50 text-text-secondary"}`}>{paymentLabel(order)}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge status={order.status} />
                          {pendingPaymentByOrder.has(order.id) && (
                            <Badge variant="outline">Pago por verificar</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell numeric><span className="whitespace-nowrap font-bold">Bs. {formatMoney(order.total)}</span></TableCell>
                      <TableCell><Button variant="ghost" size="sm" aria-label={`Abrir detalle del pedido ${order.order_number}`} className="bg-brand-soft text-brand" onClick={event => { event.stopPropagation(); setSelectedId(order.id); }}><Eye aria-hidden className="size-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 p-3 md:hidden">
            {filteredOrders.map((order) => {
              const customer = first(order.customer);
              return (
                <Card
                  key={order.id}
                  interactive
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver pedido ${order.order_number}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(order.id);
                    }
                  }}
                  className="gap-2 focus-visible:outline-2 focus-visible:outline-brand"
                  onClick={() => setSelectedId(order.id)}
                >
                  <div className="order-product-heading"><span className="order-product-icon"><Flower2 aria-hidden /></span>
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

      <nav aria-label="Paginación de pedidos" className="flex flex-wrap items-center justify-between gap-3 border-t border-border-decorative bg-slate-50 px-4 py-3">
        <span className="text-sm text-text-secondary">{pagination.total} pedidos · Página {page} de {pagination.total_pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</Button>
          <Button variant="outline" disabled={loading || page >= pagination.total_pages} onClick={() => setPage(current => current + 1)}>Siguiente</Button>
        </div>
      </nav>

      </section>
      <OrderDetailModal
        key={selectedId ?? "closed"}
        orderId={selectedId}
        role={role}
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
  return `${payment.method === "qr" ? "QR" : payment.method === "efectivo" ? "Efectivo" : "Método por verificar"} · ${payment.status === "pendiente" ? "por verificar" : payment.status === "confirmado" ? "verificado" : "rechazado"}`;
}

type PendingAction = "cancel" | "reject-payment" | "request-deletion" | "confirm-payment" | null;

function OrderDetailModal({
  orderId,
  role,
  onClose,
  onChanged,
}: {
  orderId: string | null;
  role: UserRole;
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
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const pendingPayment = order?.payments.find(payment => payment.status === "pendiente") ?? null;

  async function refreshDetail() {
    const response = await fetch(`/api/admin/orders/${orderId}`);
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error("No se pudo actualizar el detalle. Vuelve a abrir el pedido.");
    setOrder(body.order);
  }

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
      setActionSuccess("");
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
      setActionSuccess(url.includes("/confirm") ? "Pago verificado y confirmado. El pedido se actualizó." : url.includes("/reject") ? "Pago rechazado. El motivo quedó registrado." : url.includes("/cancel") ? "Pedido cancelado. El motivo quedó registrado." : url.includes("/status") ? "Estado del pedido actualizado." : "Solicitud registrada correctamente.");
      if (orderId) await refreshDetail().catch(() => setActionError("La acción se registró, pero no se pudo actualizar la vista. Vuelve a abrir el pedido antes de otra acción."));
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
    <Modal open={Boolean(orderId)} onOpenChange={(open) => { if (!open && !busy && (!scheduleDirty || window.confirm("Hay un horario sin guardar. ¿Cerrar sin guardarlo?"))) onClose(); }}>
      <ModalContent className="admin-order-dialog gap-0 p-0 md:p-0" dismissible={!busy} showCloseButton={false}>
        <ModalHeader className="sticky top-0 z-10 border-b border-border-decorative bg-surface p-5 pr-14 text-left">
          <Button aria-label="Cerrar detalle del pedido" variant="ghost" className="absolute right-3 top-3 size-11 p-0" disabled={busy} onClick={() => { if (!scheduleDirty || window.confirm("Hay un horario sin guardar. ¿Cerrar sin guardarlo?")) onClose(); }}><X aria-hidden className="size-5" /></Button>
          {order && <span className="order-number-tile">#{order.order_number}</span>}
          {order?.receipt_token && <Button asChild variant="ghost" className="order-header-receipt"><Link href={`/api/admin/orders/${order.id}/receipt`} target="_blank" rel="noopener noreferrer" aria-label="Ver o descargar recibo"><Printer aria-hidden /></Link></Button>}
          <div className="order-title-line"><ModalTitle>{order ? `Pedido #${order.order_number}` : "Pedido"}</ModalTitle>{order && <Badge status={order.status} />}</div>
          <ModalDescription>
            <CalendarDays aria-hidden />{order ? formatDateTime(order.created_at) : "Cargando información del pedido…"}
          </ModalDescription>
        </ModalHeader>

        {loading ? (
          <p role="status" className="p-6 text-text-secondary">Cargando detalle del pedido…</p>
        ) : error ? (
          <div className="p-6"><Notice tone="error">{friendlyErrorMessage(error, "No pudimos abrir este pedido. Vuelve a intentarlo.")}</Notice></div>
        ) : order ? (
          <><div className="order-dialog-body">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2"><OrderContact order={order} customer={first(order.customer)} schedule={order} /><OrderPayment order={order} /></div>
            <OrderSchedule key={`schedule-${order.id}`} order={order} value={order} busy={busy} onBusyChange={setBusy} onDirtyChange={setScheduleDirty} onSaved={refreshDetail} />

            <section aria-label="Productos y preparación" className="order-products">
              <div className="order-products-heading"><h3>Detalle de productos</h3><span>{order.order_items.length} {order.order_items.length === 1 ? "artículo" : "artículos"}</span></div>
              {order.order_items.map((item) => (
                <article key={item.id} className="order-product-card">
                  <div className="order-product-heading"><ProductThumbnail src={primaryProductImage(first(item.product)?.images)?.public_url} alt={item.product_name_snapshot} size="md" preview />
                    <span className="min-w-0 flex-1 break-words text-text">
                      {item.quantity} × {item.product_name_snapshot}
                    </span>
                    <span className="tabular-nums text-text-secondary">{formatMoney(item.line_total)} Bs.</span>
                  </div>

                  {item.personalization && item.personalization.length > 0 && (
                    <p className="text-xs text-text-secondary">
                      {item.personalization
                        .map((option) => (option.extra_price > 0 ? `${option.name} (+${formatMoney(option.extra_price)})` : option.name))
                        .join(", ")}
                    </p>
                  )}

                  <OrderComposition snapshot={item.recipe_snapshot} quantity={item.quantity} />
                  <DedicationPreview entries={item.dedications}/>
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
                </article>
              ))}
            </section>

            <div className="order-totals">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="tabular-nums">{formatMoney(order.subtotal)} Bs.</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Descuento</span>
                  <span className="tabular-nums">-{formatMoney(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-text">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(order.total)} Bs.</span>
              </div>
            </div>

            {(order.customer_message || order.internal_note) && (
              <div className="flex flex-col gap-1 border-t border-border-decorative pt-3 text-sm">
                {order.customer_message && (
                  <p className="whitespace-pre-line break-words text-text-secondary">
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

            {order.inventory_review_required && <Notice tone="warning" title="Revisión de inventario necesaria">Este pedido antiguo tiene una composición incompleta. Revisa su receta y existencias con un administrador antes de confirmar el pago. Editar la receta actual no corrige los movimientos de este pedido.</Notice>}
            {order.cancellation_reason && (
              <p className="text-sm text-text-secondary">Motivo: {order.cancellation_reason}</p>
            )}

            {(order.status === "finalizado" || (order.status === "cancelado" && order.payments.some(payment => payment.status === "confirmado"))) && <OrderReturns key={`returns-${order.id}`} orderId={order.id} total={order.total} physical={order.order_type === "fisica"} cancelled={order.status === "cancelado"} canCreate={role === "administrador"} onChanged={onChanged} onBusyChange={setBusy} />}
            <details className="order-progress-extra"><summary>Ver progreso del pedido</summary><OrderProgress order={order} /></details>
            <OrderHistory orderId={order.id} version={`${order.status}:${order.schedule_revision}:${order.payments.map(p => p.status).join(",")}`} />
            <details className="rounded-2xl border border-border-decorative p-4"><summary className="min-h-11 cursor-pointer font-semibold">Recibos y otras acciones</summary><div className="mt-3 flex flex-wrap gap-2">
              {order.receipt_token ? <><Button asChild variant="outline"><Link href={`/api/admin/orders/${order.id}/receipt`} target="_blank" rel="noopener noreferrer">Ver / descargar recibo</Link></Button>{whatsappLink(first(order.customer)?.whatsapp || first(order.customer)?.phone || null) && <Button variant="outline" disabled={busy} onClick={() => { const url = new URL(`/api/orders/receipt/${order.receipt_token}`, window.location.origin).href; const link = whatsappLink(first(order.customer)?.whatsapp || first(order.customer)?.phone || null, `Floristería Anabelle · Recibo del pedido #${order.order_number}: ${url}`); if (link) window.open(link, "_blank", "noopener,noreferrer"); setActionSuccess("Mensaje con recibo preparado para WhatsApp. Debes enviarlo manualmente."); }}>Preparar recibo por WhatsApp</Button>}</> : <p className="text-sm text-text-secondary">El recibo de pago está disponible únicamente después de la confirmación.</p>}
              {order.status === "cancelado" && <Button variant="outline" disabled={busy} onClick={() => setPendingAction("request-deletion")}>Solicitar eliminación</Button>}
            </div></details>
            {actionSuccess && <Notice tone="success" onDismiss={() => setActionSuccess("")}>{actionSuccess}</Notice>}
            {actionError && <Notice tone="error">{friendlyErrorMessage(actionError)}</Notice>}

          </div><fieldset disabled={busy} className="order-dialog-actions">{pendingAction === "confirm-payment" && pendingPayment ? (
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
              <ModalFooter className="order-action-bar">
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
                    className="order-cancel-button"
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
                  <Button loading={busy} onClick={() => { if (next.value !== "finalizado" || window.confirm("¿Confirmas que se realizó la entrega o el recojo del pedido?")) void runAction(`/api/admin/orders/${order.id}/status`, { new_status: next.value }); }}>
                    {next.value === "finalizado" ? orderDelivery(order.customer_message).pickup ? "Finalizar recojo" : "Finalizar entrega o recojo" : next.label}
                  </Button>
                )}
                {!next && !["pendiente_pago", "confirmado", "en_preparacion", "listo"].includes(order.status) && <><span className="order-closed-label">Pedido {order.status === "finalizado" ? "finalizado" : order.status}</span><Button variant="outline" onClick={onClose}>Cerrar detalle</Button></>}
              </ModalFooter>
            )}</fieldset></>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
