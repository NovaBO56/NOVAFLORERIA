"use client";

import { Flower2, LayoutPanelTop, Package, ShoppingCart, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusDot } from "@/components/ui/status-dot";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionBar } from "@/components/ux/action-bar";

const exampleOrders = [
  { id: "00123", customer: "Cliente de ejemplo A", total: "Bs 85.00", status: "pendiente_pago" as const, date: "25 sep, 09:45" },
  { id: "00122", customer: "Cliente de ejemplo B", total: "Bs 120.00", status: "en_preparacion" as const, date: "25 sep, 09:32" },
  { id: "00121", customer: "Cliente de ejemplo C", total: "Bs 60.00", status: "finalizado" as const, date: "24 sep, 18:20" },
  { id: "00120", customer: "Cliente de ejemplo D", total: "Bs 150.00", status: "listo" as const, date: "24 sep, 16:10" },
];

const exampleProducts = [
  ["Ramo de rosas rojas", "Bs 150.00", "12 vendidos"],
  ["Oso de 25 cm", "Bs 45.00", "8 vendidos"],
  ["Marco de foto de 25 cm", "Bs 20.00", "6 vendidos"],
  ["Regalo sorpresa", "Bs 210.00", "5 vendidos"],
];

const exampleInventory = [
  { status: "success" as const, label: "Stock normal", value: 42, width: "76%", color: "bg-leaf" },
  { status: "warning" as const, label: "Stock bajo", value: 6, width: "28%", color: "bg-amber-500" },
  { status: "danger" as const, label: "Agotados", value: 2, width: "10%", color: "bg-danger" },
];

export default function PruebaUiPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const showPreview = () => setPreviewOpen(true);

  return (
    <div className="admin-page mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <PageHeader
        eyebrow="Sistema visual"
        title="Componentes del administrador"
        description="Vista de componentes con datos de ejemplo. Esta pantalla no registra operaciones ni modifica información del negocio."
        actions={<Button onClick={showPreview}><LayoutPanelTop aria-hidden="true" />Ver modal de muestra</Button>}
      />

      <div className="admin-notice flex flex-wrap items-center gap-3">
        <Badge variant="outline">Datos de ejemplo</Badge>
        <p className="text-sm text-text-secondary">Las cifras, pedidos y productos de esta vista son muestras del diseño compartido.</p>
      </div>

      <section aria-label="Tarjetas de indicadores de ejemplo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas · ejemplo" value="Bs 245" description="Importe de demostración" tone="success" icon={<ShoppingCart />} />
        <StatCard label="Pedidos · ejemplo" value="8" description="Cantidad de demostración" tone="warning" icon={<Package />} />
        <StatCard label="Productos · ejemplo" value="28" description="De 32 productos de muestra" tone="brand" icon={<Flower2 />} />
        <StatCard label="Usuarios · ejemplo" value="3" description="Cantidad de demostración" tone="neutral" icon={<Users />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-label="Gráficos de ejemplo">
        <SectionCard title="Gráfico de barras" description="Muestra visual de siete días; no representa ventas reales.">
          <div className="flex h-[240px] items-end gap-3 border-b border-border-decorative pb-4 pt-6 sm:gap-5" role="img" aria-label="Ejemplo de gráfico de ventas con siete barras">
            {[36, 52, 45, 68, 58, 82, 94].map((height, index) => (
              <div key={index} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full max-w-12 rounded-t-lg bg-brand" style={{ height: height + "%" }} />
                <span className="text-xs text-text-secondary">{19 + index} sep</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Indicadores de inventario" description="Estados y barras con cantidades de ejemplo.">
          <div className="space-y-5">
            {exampleInventory.map(item => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm"><StatusDot status={item.status} label={item.label} /><strong className="tabular-nums">{item.value}</strong></div>
                <div className="h-2 rounded-full bg-bg-admin"><div className={"h-full rounded-full " + item.color} style={{ width: item.width }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Tabla de pedidos de ejemplo" description="Muestra de columnas, importes, clientes y estados. No son pedidos del sistema.">
        <Table>
          <TableHeader><TableRow><TableHead>Pedido de ejemplo</TableHead><TableHead>Cliente de ejemplo</TableHead><TableHead numeric>Total</TableHead><TableHead>Estado</TableHead><TableHead>Fecha de ejemplo</TableHead></TableRow></TableHeader>
          <TableBody>
            {exampleOrders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-semibold">#{order.id}</TableCell>
                <TableCell><div className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand" aria-hidden="true">CE</span><span className="min-w-40">{order.customer}</span></div></TableCell>
                <TableCell numeric className="whitespace-nowrap font-semibold">{order.total}</TableCell>
                <TableCell><Badge status={order.status} /></TableCell>
                <TableCell className="whitespace-nowrap text-text-secondary">{order.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Tarjetas de producto" description="Ejemplos de imagen, nombre, importe y etiqueta.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {exampleProducts.map(([name, price, sold]) => (
            <Card key={name} className="gap-3 p-4">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-brand-soft text-brand"><Flower2 aria-hidden="true" className="size-10" /></div>
              <div><p className="font-medium">{name}</p><p className="mt-1 text-lg font-semibold tabular-nums">{price}</p></div>
              <Badge variant="outline">Ejemplo · {sold}</Badge>
            </Card>
          ))}
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Muestras de controles y estados">
        <SectionCard title="Campos de formulario" description="Ejemplo de controles. Puedes probar su apariencia; no se guardan datos.">
          <div className="space-y-4">
            <Field label="Nombre del producto" hint="Campo de muestra para probar escritura y foco."><Input defaultValue="Ramo de rosas rojas" /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Precio de ejemplo (Bs)"><Input type="number" defaultValue="150.00" min="0" step="0.01" /></Field><Field label="Campo deshabilitado"><Input value="Muestra de solo lectura" disabled /></Field></div>
            <Field label="Campo con error de ejemplo" error="Así se presenta una validación junto al campo."><Input placeholder="Ejemplo de error" /></Field>
          </div>
        </SectionCard>

        <SectionCard title="Estados y etiquetas" description="Texto, iconos y color distinguen cada estado.">
          <div className="flex flex-wrap gap-2">{(["pendiente_pago", "confirmado", "en_preparacion", "listo", "finalizado", "cancelado", "rechazado"] as const).map(status => <Badge key={status} status={status} />)}</div>
          <EmptyState icon={<Package />} title="Estado vacío de ejemplo" description="Aquí se orienta al empleado cuando una sección todavía no tiene registros." />
        </SectionCard>
      </section>

      <SectionCard title="Botones y confirmaciones" description="Todos los botones de muestra abren la misma vista previa. Ninguno ejecuta operaciones del negocio.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={showPreview}>Muestra principal</Button>
          <Button variant="secondary" onClick={showPreview}>Muestra secundaria</Button>
          <Button variant="outline" onClick={showPreview}>Muestra con borde</Button>
          <Button variant="ghost" onClick={showPreview}>Muestra discreta</Button>
          <Button variant="destructive" onClick={showPreview}>Muestra destructiva</Button>
          <Button disabled>Muestra deshabilitada</Button>
        </div>
        <ActionBar>
          <div><p className="text-sm font-semibold">Barra de acciones de ejemplo</p><p className="mt-1 text-sm text-text-secondary">Muestra de jerarquía y distribución de botones.</p></div>
          <Button variant="outline" onClick={showPreview}>Abrir confirmación de muestra</Button>
        </ActionBar>
      </SectionCard>

      <Modal open={previewOpen} onOpenChange={setPreviewOpen}>
        <ModalContent voice="admin">
          <ModalHeader><ModalTitle>Modal de muestra</ModalTitle><ModalDescription>Vista previa del componente compartido de confirmación. No se guardará ni modificará ningún dato.</ModalDescription></ModalHeader>
          <div className="admin-notice" data-tone="warning">En una operación real, este espacio explica qué va a ocurrir antes de solicitar la confirmación.</div>
          <ModalFooter><ModalClose asChild><Button variant="outline">Cerrar muestra</Button></ModalClose><ModalClose asChild><Button>Entendido</Button></ModalClose></ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
