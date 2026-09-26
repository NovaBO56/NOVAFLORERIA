"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Cake,
  ChartColumn,
  CircleX,
  ClipboardList,
  Hourglass,
  Receipt,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

type DashboardData = {
  ventas_hoy: number;
  pedidos_pendientes: number;
  pagos_pendientes: number;
  inventario: {
    bajo_stock: { name: string; current_stock: number; minimum_stock: number }[];
    agotados: { name: string }[];
  };
  caja: { abierta: boolean; opening_amount?: number; opened_at?: string };
  clientes_total: number;
  cumpleanos_hoy: { name: string; birthday: string }[];
  productos_mas_vendidos: { name: string; quantity: number }[];
};

/**
 * Dashboard — Fase 15 §4.2. Cada tarjeta es un acceso directo a su sección;
 * Inventario y Clientes todavía no tienen pantalla (Paso 4), así que sus
 * tarjetas son solo informativas por ahora.
 */
export function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/dashboard");
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.message ?? "No se pudo generar el dashboard.");
        }
        if (!cancelled) setData(body.dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo generar el dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="items-center gap-2 text-center">
        <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-danger" />
        <p className="text-text-secondary">{error || "No se pudo generar el dashboard."}</p>
      </Card>
    );
  }

  const inventoryAlerts = data.inventario.bajo_stock.length + data.inventario.agotados.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Receipt}
          label="Ventas de hoy"
          value={formatMoney(data.ventas_hoy)}
          href="/admin/pedidos"
        />
        <StatCard
          icon={Hourglass}
          label="Pedidos pendientes"
          value={String(data.pedidos_pendientes)}
          href="/admin/pedidos?estado=pendiente_pago"
        />
        <StatCard
          icon={ClipboardList}
          label="Pagos por verificar"
          value={String(data.pagos_pendientes)}
          href="/admin/pedidos?pago=pendiente"
        />
        <StatCard
          icon={Wallet}
          label="Caja"
          value={data.caja.abierta ? "Abierta" : "Cerrada"}
          href="/admin/caja"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert aria-hidden="true" className="size-5 stroke-[1.5] text-text-secondary" />
              Alertas de inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryAlerts === 0 ? (
              <p className="text-text-secondary">Sin alertas por ahora.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {data.inventario.agotados.map((item) => (
                  <li key={`agotado-${item.name}`} className="flex items-center gap-2">
                    <CircleX aria-hidden="true" className="size-4 shrink-0 stroke-[1.5] text-danger" />
                    <span className="text-text">{item.name}</span>
                    <span className="text-text-secondary">— agotado</span>
                  </li>
                ))}
                {data.inventario.bajo_stock.map((item) => (
                  <li key={`bajo-${item.name}`} className="flex items-center gap-2">
                    <TriangleAlert aria-hidden="true" className="size-4 shrink-0 stroke-[1.5] text-[#B98900]" />
                    <span className="text-text">{item.name}</span>
                    <span className="text-text-secondary">
                      — {item.current_stock} de {item.minimum_stock} mínimo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChartColumn aria-hidden="true" className="size-5 stroke-[1.5] text-text-secondary" />
              Más vendidos (30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.productos_mas_vendidos.length === 0 ? (
              <p className="text-text-secondary">Sin ventas en este período.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {data.productos_mas_vendidos.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-2">
                    <span className="text-text">{item.name}</span>
                    <span className="tabular-nums text-text-secondary">{item.quantity} und.</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users aria-hidden="true" className="size-5 stroke-[1.5] text-text-secondary" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-text">{data.clientes_total}</p>
            <p className="text-text-secondary">clientes registrados en total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cake aria-hidden="true" className="size-5 stroke-[1.5] text-text-secondary" />
              Cumpleaños de hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.cumpleanos_hoy.length === 0 ? (
              <p className="text-text-secondary">Nadie cumple años hoy.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm text-text">
                {data.cumpleanos_hoy.map((customer) => (
                  <li key={customer.name}>{customer.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card interactive className="gap-2">
        <Icon aria-hidden="true" className="size-5 stroke-[1.5] text-brand" />
        <p className="text-2xl font-semibold tabular-nums text-text">{value}</p>
        <p className="text-text-secondary">{label}</p>
      </Card>
    </Link>
  );
}