"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CheckCircle2, Minus, Plus, QrCode, ReceiptText, Search, ShoppingBag, TriangleAlert, UserRound, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_available: boolean;
  is_sold_out: boolean;
};

type Customer = { id: string; name: string; phone: string | null; };

type CartLine = { product: Product; quantity: number; };

type SaleResult = { id: string; order_number: number; subtotal: number; discount_total: number; total: number; };

/** Ventas físicas: caja abierta, descuento manual o promoción vigente. */
export function SalesPanel() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        setCheckingSession(true);
        const response = await fetch("/api/admin/cash-sessions?status=abierta");
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.message ?? "No se pudo verificar el estado de la caja.");
        }
        if (!cancelled) setSessionOpen((body.sessions ?? []).length > 0);
      } catch (err) {
        if (!cancelled) setSessionError(err instanceof Error ? err.message : "No se pudo verificar la caja.");
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingSession) {
    return <Card className="h-48 animate-pulse" role="status" aria-label="Verificando sesión de caja" />;
  }

  if (sessionError) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <div className="flex items-start gap-3" role="alert">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <p className="font-semibold">
              No se pudo verificar la caja
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {sessionError}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!sessionOpen) {
    return (
      <Card className="gap-0 p-0">
        <EmptyState
          icon={<Wallet />}
          title="Abre la caja para empezar a vender"
          description="Las ventas presenciales necesitan una sesión de caja abierta. Registra el efectivo inicial de tu turno y vuelve aquí para cobrar."
          action={
            <Button asChild>
              <Link href="/admin/caja">
                Ir a Caja
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return <SaleForm />;
}

function SaleForm() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [promotions, setPromotions] = useState<{ id: string; name: string; }[]>([]);
  const [promotionId, setPromotionId] = useState("");
  const [promotionError, setPromotionError] = useState("");
  const submitLock = useRef(false);
  const [manualDiscount, setManualDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "qr">("efectivo");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SaleResult | null>(null);

  useEffect(() => {
    const term = search.trim();
    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (term.length === 0) {
        setResults([]);
        return;
      }
      try {
        setSearching(true);
        const response = await fetch(`/api/admin/products?search=${encodeURIComponent(term)}`);
        const body = await response.json();
        if (!cancelled && response.ok && body.success) {
          setResults(body.products ?? []);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  useEffect(() => {
    const term = customerSearch.trim();
    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (term.length < 2) {
        setCustomerResults([]);
        return;
      }
      const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(term)}`);
      const body = await response.json();
      if (!cancelled && response.ok && body.success) {
        setCustomerResults(body.customers ?? []);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [customerSearch]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/promotions", { signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw Error(body.message || "No se pudieron cargar las promociones.");
      if (!controller.signal.aborted) setPromotions(body.promotions || []);
    }).catch(cause => {
      if (!controller.signal.aborted) setPromotionError(cause instanceof Error ? cause.message : "No se pudieron cargar las promociones.");
    });
    return () => controller.abort();
  }, []);
  function addProduct(product: Product) {
    if (!product.is_active || !product.is_available || product.is_sold_out) return;
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.product.id !== productId)
        : current.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    );
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0),
    [cart],
  );
  const discount = manualDiscount ? Number(discountAmount) || 0 : 0;
  const total = Math.max(subtotal - discount, 0);

  function resetForm() {
    setCart([]);
    setCustomer(null);
    setCustomerSearch("");
    setManualDiscount(false);
    setPromotionId("");
    setDiscountAmount("");
    setDiscountReason("");
    setError("");
    setResult(null);
  }

  async function submit() {
    if (submitLock.current) return;
    submitLock.current = true;
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
          customer_id: customer?.id ?? null,
          promotion_id: promotionId || null,
          manual_discount_amount: manualDiscount ? Number(discountAmount) : null,
          manual_discount_reason: manualDiscount ? discountReason : null,
          payment_method: paymentMethod,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message ?? "No se pudo registrar la venta.");
      }
      setResult(body.sale);
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  if (result) {
    return (
      <Card className="items-center gap-4 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 aria-hidden="true" className="size-7" />
        </div>
        <div>
          <p role="status" className="nova-enter text-lg font-semibold text-text">
            Venta #{result.order_number} registrada.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            El cobro quedó registrado en la sesión de caja.
          </p>
        </div>
        <p className="text-3xl font-bold tabular-nums text-text">
          {formatMoney(result.total)}
        </p>
        <Button onClick={resetForm}>
          <Plus aria-hidden="true" />Nueva venta
        </Button>
      </Card>
    );
  }

  const canSubmit = cart.length > 0 && (!manualDiscount || (Number(discountAmount) > 0 && discountReason.trim() !== ""));

  return (
    <fieldset
      disabled={submitting}
      className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,1fr)]"
    >
      <SectionCard
        title="Seleccionar productos"
        description="Busca en el catálogo y agrega los productos a la venta."
      >
        <div className="space-y-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
            />
            <Input
              aria-label="Buscar producto"
              placeholder="Buscar por nombre de producto…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {
            searching ? (
              <div role="status" className="grid gap-3 sm:grid-cols-2">
                <span className="sr-only">
                  Buscando productos…
                </span>{[0, 1, 2, 3].map(index => <div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : results.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {
                  results.map((product) => {
                    const unavailable = !product.is_active || !product.is_available || product.is_sold_out;
                    return (
                      <Card key={product.id} className="justify-between gap-3 p-4 shadow-none">
                        <div>
                          <p className="break-words text-sm font-semibold text-text">
                            {product.name}
                          </p>
                          <p className="mt-2 text-base font-semibold tabular-nums text-text">
                            {formatMoney(product.price)}
                          </p>
                        </div>
                        {
                          unavailable ? <Badge variant="outline" className="border-red-100 bg-red-50 text-red-700">
                            No disponible
                          </Badge> : <Button size="sm" variant="secondary" onClick={() => addProduct(product)}>
                            <Plus aria-hidden="true" />Agregar
                          </Button>
                        }
                      </Card>
                    );
                  })
                }
              </div>
            ) : <EmptyState
              icon={<ShoppingBag />}
              title={search.trim() ? "No se encontraron productos" : "Encuentra un producto"}
              description={
                search.trim() ? "Prueba con otro nombre para buscar en el catálogo." : "Escribe su nombre en el buscador. Los productos disponibles aparecerán aquí."
              }
            />
          }
        </div>
      </SectionCard>

      <Card className="gap-5 xl:sticky xl:top-24">
        <CardHeader className="border-b border-border-decorative pb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText aria-hidden="true" className="size-5 text-brand" />Venta actual
            </CardTitle>
            <Badge variant="outline">
              {cart.reduce((count, line) => count + line.quantity, 0)} unidades
            </Badge>
          </div>
          <CardDescription>
            Revisa los productos y el método de cobro.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {
            cart.length === 0 ? <div
              className="rounded-xl border border-dashed border-border-decorative bg-slate-50 p-5 text-center text-sm text-text-secondary"
            >
              Agrega productos desde el catálogo para empezar.
            </div> : (
              <div className="divide-y divide-border-decorative">
                {
                  cart.map((line) => (
                    <div key={line.product.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words text-sm font-medium text-text">
                          {line.product.name}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
                          {formatMoney(Number(line.product.price) * line.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-text-secondary">
                          {formatMoney(line.product.price)} / unidad
                        </span>
                        <div className="flex items-center gap-1 rounded-lg border border-border-decorative bg-slate-50">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={"Quitar una unidad de " + line.product.name}
                            onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                          >
                            <Minus aria-hidden="true" />
                          </Button>
                          <span className="min-w-6 text-center text-sm font-medium tabular-nums">
                            {line.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={"Agregar una unidad de " + line.product.name}
                            onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                          >
                            <Plus aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )
          }

          <div className="space-y-2 border-t border-border-decorative pt-4">
            {
              customer ? <div
                className="flex items-center justify-between gap-3 rounded-xl border border-border-decorative bg-slate-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <UserRound aria-hidden="true" className="size-4 shrink-0 text-text-secondary" />
                  <span className="break-words text-sm font-medium">
                    {customer.name}
                  </span>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Quitar cliente" onClick={() => setCustomer(null)}>
                  <X aria-hidden="true" />
                </Button>
              </div> : (
                <Field label="Cliente" optional>
                  <Input
                    aria-label="Buscar cliente (opcional)"
                    placeholder="Buscar cliente por nombre o teléfono"
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                  />
                </Field>
              )
            }
            {
              customerResults.length > 0 && !customer && <div className="max-h-48 overflow-y-auto rounded-xl border border-border-decorative p-1">
                {
                  customerResults.map(c => <Button
                    key={c.id}
                    variant="ghost"
                    size="sm"
                    className="h-auto min-h-10 w-full justify-start whitespace-normal text-left"
                    onClick={() => { setCustomer(c); setCustomerSearch(""); setCustomerResults([]); }}
                  >
                    {c.name} {c.phone ? "· " + c.phone : ""}
                  </Button>)
                }
              </div>
            }
          </div>

          <div className="space-y-3 border-t border-border-decorative pt-4">
            <Field
              label="Promoción"
              hint="No se acumula con descuento manual. La promoción y su importe se validan al registrar la venta."
            >
              <select
                value={promotionId}
                onChange={event => { setPromotionId(event.target.value); setManualDiscount(false); }}
                className="h-11 w-full min-w-0 rounded-xl border border-border-field bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="">
                  Sin promoción
                </option>{
                  promotions.map(promotion => <option key={promotion.id} value={promotion.id}>
                    {promotion.name}
                  </option>)
                }
              </select>
            </Field>
            {
              promotionError && <p role="alert" className="text-sm text-danger">
                {promotionError}
              </p>
            }
            <Button
              size="sm"
              variant={manualDiscount ? "secondary" : "outline"}
              aria-pressed={manualDiscount}
              onClick={() => { setManualDiscount(current => !current); setPromotionId(""); }}
            >
              Descuento manual
            </Button>
            {
              manualDiscount && <div className="space-y-3 rounded-xl border border-border-decorative bg-slate-50 p-3">
                <Field label="Monto del descuento">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                  />
                </Field>
                <Field label="Motivo del descuento">
                  <Textarea value={discountReason} onChange={(event) => setDiscountReason(event.target.value)} />
                </Field>
              </div>
            }
          </div>

          <div className="space-y-2 border-t border-border-decorative pt-4">
            <p className="text-sm font-medium">
              Método de pago
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === "efectivo" ? "secondary" : "outline"}
                aria-pressed={paymentMethod === "efectivo"}
                onClick={() => setPaymentMethod("efectivo")}
              >
                <Banknote aria-hidden="true" />Efectivo
              </Button>
              <Button
                variant={paymentMethod === "qr" ? "secondary" : "outline"}
                aria-pressed={paymentMethod === "qr"}
                onClick={() => setPaymentMethod("qr")}
              >
                <QrCode aria-hidden="true" />QR
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border-decorative bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-text-secondary">
                Subtotal
              </span>
              <span className="tabular-nums">
                {formatMoney(subtotal)}
              </span>
            </div>
            {
              discount > 0 && <div className="flex justify-between gap-3">
                <span className="text-text-secondary">
                  Descuento
                </span>
                <span className="tabular-nums text-emerald-700">
                  -{formatMoney(discount)}
                </span>
              </div>
            }
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-t border-border-decorative pt-3"
            >
              <span className="font-semibold">
                {promotionId ? "Total antes de promoción" : "Total a cobrar"}
              </span>
              <span className="text-2xl font-bold tabular-nums text-text">
                {formatMoney(total)}
              </span>
            </div>
          </div>
          {
            error && <p role="alert" className="admin-notice text-sm" data-tone="danger">
              {error}
            </p>
          }
          <Button
            size="lg"
            className="w-full"
            loading={submitting}
            loadingText="Registrando venta…"
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            <ReceiptText aria-hidden="true" />Cobrar
          </Button>
        </CardContent>
      </Card>
    </fieldset>
  );
}
