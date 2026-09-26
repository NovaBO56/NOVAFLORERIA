"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Customer = { id: string; name: string; phone: string | null };

type CartLine = { product: Product; quantity: number };

type SaleResult = { id: string; order_number: number; subtotal: number; discount_total: number; total: number };

/**
 * Ventas físicas — Fase 15 §4.5. Requiere caja abierta (create_physical_sale
 * lo exige también en el servidor). La selección de promoción queda fuera de
 * esta pantalla: solo se ofrece descuento manual, ya que Promociones se
 * construye en un paso posterior.
 */
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
    return <Card className="h-32 animate-pulse" />;
  }

  if (sessionError) {
    return (
      <Card className="items-center gap-2 text-center">
        <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-danger" />
        <p className="text-text-secondary">{sessionError}</p>
      </Card>
    );
  }

  if (!sessionOpen) {
    return (
      <Card className="items-center gap-3 text-center">
        <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-[#B98900]" />
        <div>
          <p className="text-text">Abre una sesión de caja primero.</p>
          <p className="text-text-secondary">No puedes registrar ventas físicas sin una caja abierta.</p>
        </div>
        <Button asChild>
          <Link href="/admin/caja">Ir a Caja</Link>
        </Button>
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
    setDiscountAmount("");
    setDiscountReason("");
    setError("");
    setResult(null);
  }

  async function submit() {
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
          customer_id: customer?.id ?? null,
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
    }
  }

  if (result) {
    return (
      <Card className="items-center gap-3 text-center">
        <p className="text-text">Venta #{result.order_number} registrada.</p>
        <p className="text-2xl font-semibold tabular-nums text-text">{formatMoney(result.total)}</p>
        <Button onClick={resetForm}>Nueva venta</Button>
      </Card>
    );
  }

  const canSubmit = cart.length > 0 && (!manualDiscount || (discountAmount !== "" && discountReason.trim() !== ""));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
          />
          <Input
            aria-label="Buscar producto"
            placeholder="Buscar producto"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {searching ? (
          <p className="text-text-secondary">Buscando…</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {results.map((product) => {
              const unavailable = !product.is_active || !product.is_available || product.is_sold_out;
              return (
                <Card key={product.id} className="gap-2 p-3">
                  <p className="text-sm font-medium text-text">{product.name}</p>
                  <p className="tabular-nums text-text-secondary">{formatMoney(product.price)}</p>
                  {unavailable ? (
                    <span className="text-[13px] text-danger">Agotado</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => addProduct(product)}>
                      Agregar
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base">Venta actual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cart.length === 0 ? (
            <p className="text-text-secondary">Agrega productos para empezar.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map((line) => (
                <div key={line.product.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-text">{line.product.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar una unidad"
                      onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                    >
                      <Minus aria-hidden="true" />
                    </Button>
                    <span className="w-6 text-center tabular-nums">{line.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Agregar una unidad"
                      onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                    >
                      <Plus aria-hidden="true" />
                    </Button>
                  </div>
                  <span className="w-16 text-right tabular-nums text-text-secondary">
                    {formatMoney(Number(line.product.price) * line.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border-decorative pt-3">
            {customer ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-text">Cliente: {customer.name}</span>
                <Button variant="ghost" size="icon-sm" aria-label="Quitar cliente" onClick={() => setCustomer(null)}>
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Input
                  aria-label="Buscar cliente (opcional)"
                  placeholder="Buscar cliente (opcional)"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                />
                {customerResults.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {customerResults.map((c) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => {
                          setCustomer(c);
                          setCustomerSearch("");
                          setCustomerResults([]);
                        }}
                      >
                        {c.name} {c.phone ? `· ${c.phone}` : ""}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border-decorative pt-3">
            <Button
              size="sm"
              variant={manualDiscount ? "secondary" : "outline"}
              onClick={() => setManualDiscount((current) => !current)}
            >
              Descuento manual
            </Button>
            {manualDiscount && (
              <div className="flex flex-col gap-2">
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
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border-decorative pt-3">
            <p className="text-[13px] leading-[1.4] font-medium tracking-[0.02em] text-text-secondary uppercase">
              Método de pago
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={paymentMethod === "efectivo" ? "default" : "outline"}
                onClick={() => setPaymentMethod("efectivo")}
              >
                Efectivo
              </Button>
              <Button
                size="sm"
                variant={paymentMethod === "qr" ? "default" : "outline"}
                onClick={() => setPaymentMethod("qr")}
              >
                QR
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-border-decorative pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Descuento</span>
                <span className="tabular-nums">-{formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-text">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button size="lg" loading={submitting} disabled={!canSubmit} onClick={() => void submit()}>
            Cobrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}