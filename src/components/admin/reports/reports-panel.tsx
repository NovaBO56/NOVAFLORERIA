"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Banknote,
  Boxes,
  Download,
  Flower2,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusDot } from "@/components/ui/status-dot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMoney } from "@/lib/format";

// ------------------------------------------------------------
// Tipos — reflejan exactamente lo que devuelve cada ruta de
// /api/admin/reports/* (todas soportan ?format=json|pdf; acá
// solo se pide json, el PDF se descarga aparte por link directo).
// ------------------------------------------------------------

type SalesOrderRow = {
  order_number: number;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  payment_method: string | null;
};
type SalesReport = {
  summary: {
    from: string;
    to: string;
    total_sales: number;
    count_online: number;
    count_fisica: number;
    by_payment_method: Record<string, number>;
  };
  orders: SalesOrderRow[];
};

type CashSessionRow = {
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  expected_amount: number | null;
  counted_amount: number | null;
  difference_amount: number | null;
  status: string;
};
type CashReport = { sessions: CashSessionRow[] };

type InventoryRow = {
  name: string;
  item_type: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  stock_status: "normal" | "bajo" | "agotado";
};
type InventoryReport = { items: InventoryRow[] };

type WasteRow = { item_name: string; quantity: number; unit: string; reason: string; created_at: string };
type WasteReport = { waste: WasteRow[] };

type CancellationRow = {
  order_number: number;
  order_type: string;
  total: number;
  cancellation_reason: string | null;
  cancelled_at: string;
};
type CancellationsReport = { cancellations: CancellationRow[] };

type CustomerRow = { name: string; phone: string | null; order_count: number; total_spent: number };
type CustomersReport = { customers: CustomerRow[] };

type ProductSoldRow = { product_name: string; quantity: number; revenue: number };
type ProductsSoldReport = { products: ProductSoldRow[] };

// ------------------------------------------------------------
// Pestañas
// ------------------------------------------------------------

type ReportKey = "sales" | "cash" | "inventory" | "waste" | "cancellations" | "customers" | "products-sold";

const TABS: { key: ReportKey; label: string; icon: typeof Receipt; needsRange: boolean }[] = [
  { key: "sales", label: "Ventas", icon: Receipt, needsRange: true },
  { key: "cash", label: "Caja", icon: Banknote, needsRange: true },
  { key: "inventory", label: "Inventario", icon: Boxes, needsRange: false },
  { key: "waste", label: "Mermas", icon: Trash2, needsRange: true },
  { key: "cancellations", label: "Cancelaciones", icon: Ban, needsRange: true },
  { key: "customers", label: "Clientes", icon: Users, needsRange: false },
  { key: "products-sold", label: "Productos vendidos", icon: Flower2, needsRange: true },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

const STOCK_STATUS_LABEL: Record<InventoryRow["stock_status"], string> = {
  normal: "Normal",
  bajo: "Bajo stock",
  agotado: "Agotado",
};
const STOCK_STATUS_DOT: Record<InventoryRow["stock_status"], "success" | "warning" | "danger"> = {
  normal: "success",
  bajo: "warning",
  agotado: "danger",
};

export function ReportsPanel() {
  const [activeTab, setActiveTab] = useState<ReportKey>("sales");
  const [from, setFrom] = useState(firstDayOfMonthISO());
  const [to, setTo] = useState(todayISO());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [cash, setCash] = useState<CashReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [waste, setWaste] = useState<WasteReport | null>(null);
  const [cancellations, setCancellations] = useState<CancellationsReport | null>(null);
  const [customers, setCustomers] = useState<CustomersReport | null>(null);
  const [productsSold, setProductsSold] = useState<ProductsSoldReport | null>(null);

  const activeMeta = useMemo(() => TABS.find((t) => t.key === activeTab)!, [activeTab]);

  function buildUrl(key: ReportKey, format: "json" | "pdf") {
    const base = `/api/admin/reports/${key}`;
    const params = new URLSearchParams({ format });
    if (activeMeta.needsRange) {
      params.set("from", from);
      params.set("to", to);
    }
    return `${base}?${params.toString()}`;
  }

  async function loadReport(key: ReportKey) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildUrl(key, "json"));
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.message ?? "No se pudo generar el reporte.");
      }

      switch (key) {
        case "sales":
          setSales({ summary: body.summary, orders: body.orders });
          break;
        case "cash":
          setCash({ sessions: body.sessions });
          break;
        case "inventory":
          setInventory({ items: body.items });
          break;
        case "waste":
          setWaste({ waste: body.waste });
          break;
        case "cancellations":
          setCancellations({ cancellations: body.cancellations });
          break;
        case "customers":
          setCustomers({ customers: body.customers });
          break;
        case "products-sold":
          setProductsSold({ products: body.products });
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el reporte.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadReport(activeTab);
    }, 0);
    return () => clearTimeout(timeoutId);
    // Recarga al cambiar de pestaña o de rango de fechas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, from, to]);

  function downloadPdf() {
    window.location.href = buildUrl(activeTab, "pdf");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de reporte */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Filtros + descarga */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-0 sm:flex-row sm:items-end sm:justify-between">
          {activeMeta.needsRange ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Desde">
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="Hasta">
                <Input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Este reporte muestra el estado actual, sin rango de fechas.</p>
          )}

          <Button type="button" variant="outline" onClick={downloadPdf}>
            <Download />
            Descargar PDF
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-0 text-sm text-danger">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="p-0 text-sm text-text-secondary">Generando reporte...</CardContent>
        </Card>
      ) : (
        <>
          {activeTab === "sales" && sales ? <SalesReportView data={sales} /> : null}
          {activeTab === "cash" && cash ? <CashReportView data={cash} /> : null}
          {activeTab === "inventory" && inventory ? <InventoryReportView data={inventory} /> : null}
          {activeTab === "waste" && waste ? <WasteReportView data={waste} /> : null}
          {activeTab === "cancellations" && cancellations ? <CancellationsReportView data={cancellations} /> : null}
          {activeTab === "customers" && customers ? <CustomersReportView data={customers} /> : null}
          {activeTab === "products-sold" && productsSold ? <ProductsSoldReportView data={productsSold} /> : null}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Vistas por reporte
// ------------------------------------------------------------

const ORDER_TYPE_LABEL: Record<string, string> = { online: "Online", fisica: "Física" };
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  qr: "QR",
  efectivo: "Efectivo",
  otro: "Otro",
  sin_pago_confirmado: "Sin pago confirmado",
};

function SalesReportView({ data }: { data: SalesReport }) {
  const { summary, orders } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Receipt />} label="Total vendido" value={`Bs ${formatMoney(summary.total_sales)}`} />
        <StatCard icon={<Flower2 />} label="Pedidos online" value={String(summary.count_online)} />
        <StatCard icon={<Banknote />} label="Ventas físicas" value={String(summary.count_fisica)} />
        <StatCard
          icon={<Banknote />}
          label="Por método de pago"
          value={Object.keys(summary.by_payment_method).length ? "Ver detalle" : "—"}
          description={Object.entries(summary.by_payment_method)
            .map(([method, amount]) => `${PAYMENT_METHOD_LABEL[method] ?? method}: Bs ${formatMoney(amount)}`)
            .join(" · ")}
        />
      </div>

      <SectionCard title="Pedidos en el período" description={`${summary.from} al ${summary.to}`}>
        {orders.length === 0 ? (
          <EmptyState icon={<Receipt />} title="Sin ventas en este período" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método de pago</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead numeric>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_number}>
                  <TableCell>#{order.order_number}</TableCell>
                  <TableCell>{order.customer_name ?? "—"}</TableCell>
                  <TableCell>{ORDER_TYPE_LABEL[order.order_type] ?? order.order_type}</TableCell>
                  <TableCell>
                    {order.payment_method ? PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method : "—"}
                  </TableCell>
                  <TableCell>{formatDateTime(order.created_at)}</TableCell>
                  <TableCell numeric>Bs {formatMoney(order.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

function CashReportView({ data }: { data: CashReport }) {
  if (data.sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={<Banknote />} title="Sin sesiones de caja en este período" />
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard title="Sesiones de caja">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Apertura</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead numeric>Monto inicial</TableHead>
            <TableHead numeric>Esperado</TableHead>
            <TableHead numeric>Contado</TableHead>
            <TableHead numeric>Diferencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.sessions.map((session, index) => (
            <TableRow key={index}>
              <TableCell>{formatDateTime(session.opened_at)}</TableCell>
              <TableCell>{session.closed_at ? formatDateTime(session.closed_at) : "—"}</TableCell>
              <TableCell>
                <StatusDot
                  status={session.status === "abierta" ? "warning" : "success"}
                  label={session.status === "abierta" ? "Abierta" : "Cerrada"}
                />
              </TableCell>
              <TableCell numeric>Bs {formatMoney(session.opening_amount)}</TableCell>
              <TableCell numeric>{session.expected_amount != null ? `Bs ${formatMoney(session.expected_amount)}` : "—"}</TableCell>
              <TableCell numeric>{session.counted_amount != null ? `Bs ${formatMoney(session.counted_amount)}` : "—"}</TableCell>
              <TableCell numeric>
                {session.difference_amount != null ? (
                  <span className={session.difference_amount < 0 ? "text-danger" : undefined}>
                    Bs {formatMoney(session.difference_amount)}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function InventoryReportView({ data }: { data: InventoryReport }) {
  if (data.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={<Boxes />} title="Sin ítems de inventario activos" />
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard title="Inventario actual">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ítem</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead numeric>Stock actual</TableHead>
            <TableHead numeric>Stock mínimo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="capitalize">{item.item_type}</TableCell>
              <TableCell>
                <StatusDot status={STOCK_STATUS_DOT[item.stock_status]} label={STOCK_STATUS_LABEL[item.stock_status]} />
              </TableCell>
              <TableCell numeric>
                {item.current_stock} {item.unit}
              </TableCell>
              <TableCell numeric>
                {item.minimum_stock} {item.unit}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function WasteReportView({ data }: { data: WasteReport }) {
  const totalByUnit = new Map<string, number>();
  for (const row of data.waste) {
    totalByUnit.set(row.unit, (totalByUnit.get(row.unit) ?? 0) + Number(row.quantity));
  }

  if (data.waste.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={<Trash2 />} title="Sin mermas registradas en este período" />
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Mermas"
      description={Array.from(totalByUnit.entries())
        .map(([unit, qty]) => `${qty} ${unit}`)
        .join(" · ")}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ítem</TableHead>
            <TableHead numeric>Cantidad</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.waste.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.item_name}</TableCell>
              <TableCell numeric>
                {row.quantity} {row.unit}
              </TableCell>
              <TableCell>{row.reason}</TableCell>
              <TableCell>{formatDateTime(row.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function CancellationsReportView({ data }: { data: CancellationsReport }) {
  if (data.cancellations.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={<Ban />} title="Sin cancelaciones en este período" />
        </CardContent>
      </Card>
    );
  }

  const totalLost = data.cancellations.reduce((sum, c) => sum + c.total, 0);

  return (
    <SectionCard title="Pedidos cancelados" description={`${data.cancellations.length} pedidos · Bs ${formatMoney(totalLost)} en total`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead numeric>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.cancellations.map((row) => (
            <TableRow key={row.order_number}>
              <TableCell>#{row.order_number}</TableCell>
              <TableCell>{ORDER_TYPE_LABEL[row.order_type] ?? row.order_type}</TableCell>
              <TableCell>{row.cancellation_reason ?? "—"}</TableCell>
              <TableCell>{formatDateTime(row.cancelled_at)}</TableCell>
              <TableCell numeric>Bs {formatMoney(row.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function CustomersReportView({ data }: { data: CustomersReport }) {
  if (data.customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={<Users />} title="Todavía no hay clientes con pedidos" />
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard title="Clientes por monto comprado" description="Ordenado de mayor a menor gasto total">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead numeric>Pedidos</TableHead>
            <TableHead numeric>Total gastado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.customers.map((customer, index) => (
            <TableRow key={index}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.phone ?? "—"}</TableCell>
              <TableCell numeric>{customer.order_count}</TableCell>
              <TableCell numeric>Bs {formatMoney(customer.total_spent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function ProductsSoldReportView({ data }: { data: ProductsSoldReport }) {
  if (data.products.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={<Flower2 />} title="Sin productos vendidos en este período" />
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard title="Productos más vendidos" description="Ordenado de mayor a menor cantidad">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead numeric>Cantidad vendida</TableHead>
            <TableHead numeric>Ingresos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.products.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                {index < 3 ? <Badge variant="brand">#{index + 1}</Badge> : null} {row.product_name}
              </TableCell>
              <TableCell numeric>{row.quantity}</TableCell>
              <TableCell numeric>Bs {formatMoney(row.revenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}