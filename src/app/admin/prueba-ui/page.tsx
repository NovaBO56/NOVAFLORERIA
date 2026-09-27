
"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  Flower2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
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
import { ActionBar } from "@/components/ux/action-bar";
import { PageSection } from "@/components/ux/page-section";
import { ResponsiveContainer } from "@/components/ux/responsive-container";

const navigation = [
  { label: "Inicio", icon: LayoutDashboard, active: true },
  { label: "Productos", icon: Flower2 },
  { label: "Categorías", icon: Boxes },
  { label: "Temporadas", icon: Package },
  { label: "Pedidos", icon: ShoppingCart },
  { label: "Ventas", icon: BarChart3 },
  { label: "Inventario", icon: Boxes },
  { label: "Usuarios", icon: Users },
];

const orders = [
  {
    id: "00123",
    customer: "Ana Rodríguez",
    total: "Bs 85.00",
    status: "pendiente_pago" as const,
    date: "25 sep, 09:45",
  },
  {
    id: "00122",
    customer: "Luis Pérez",
    total: "Bs 120.00",
    status: "en_preparacion" as const,
    date: "25 sep, 09:32",
  },
  {
    id: "00121",
    customer: "María López",
    total: "Bs 60.00",
    status: "finalizado" as const,
    date: "24 sep, 18:20",
  },
  {
    id: "00120",
    customer: "Carmen Silva",
    total: "Bs 150.00",
    status: "listo" as const,
    date: "24 sep, 16:10",
  },
];

const products = [
  ["Ramo de rosas rojas", "Bs 150.00", "12 vendidos"],
  ["OSO DE 25CM", "Bs 45.00", "8 vendidos"],
  ["MARCO DE FOTO 25 CM", "Bs 20.00", "6 vendidos"],
  ["Regalo Sorpresa", "Bs 210.00", "5 vendidos"],
];

export default function PruebaUiPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="theme-admin min-h-screen bg-bg-admin text-text">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-border-decorative bg-surface md:flex md:flex-col">
        <div className="border-b border-border-decorative px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
              <Flower2 className="size-5 stroke-[1.5]" />
            </div>

            <div className="min-w-0">
              <p className="font-display text-[20px] leading-tight font-medium text-text">
                NOVA FLORERÍA
              </p>

              <p className="mt-0.5 text-xs text-text-secondary">
                Administración
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Menú principal
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={[
                  "flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm transition-colors",
                  item.active
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-text-secondary hover:bg-brand-soft hover:text-text",
                ].join(" ")}
              >
                <Icon className="size-[18px] shrink-0 stroke-[1.5]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border-decorative p-3">
          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm text-text-secondary hover:bg-brand-soft hover:text-text"
          >
            <Settings className="size-[18px]" />
            Configuración
          </button>

          <button
            type="button"
            className="mt-1 flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm text-text-secondary hover:bg-brand-soft hover:text-text"
          >
            <LogOut className="size-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-decorative bg-surface px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Flower2 className="size-5 text-brand" />

          <span className="font-display text-lg font-medium">
            NOVA FLORERÍA
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu />
        </Button>
      </header>

      <div className="md:pl-[248px]">
        <header className="hidden h-16 items-center justify-between border-b border-border-decorative bg-surface px-6 md:flex lg:px-8">
          <div className="relative w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />

            <Input
              className="pl-9"
              placeholder="Buscar productos, pedidos..."
            />
          </div>

          <div className="ml-6 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notificaciones"
            >
              <Bell />
            </Button>

            <div className="ml-2 flex items-center gap-3 border-l border-border-decorative pl-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                CA
              </div>

              <div>
                <p className="text-sm font-semibold text-text">
                  Administrador
                </p>

                <p className="text-xs text-text-secondary">
                  Sesión activa
                </p>
              </div>

              <ChevronDown className="size-4 text-text-secondary" />
            </div>
          </div>
        </header>

        <ResponsiveContainer>
          <PageSection>
            <PageHeader
              eyebrow="Panel administrativo"
              title="Inicio"
              description="Consulta rápidamente el estado de tus ventas, pedidos y productos."
              actions={
                <Button>
                  <ShoppingCart />
                  Registrar venta
                </Button>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Ventas hoy"
                value="Bs 245"
                trend="↑ 12% vs. promedio"
                icon={<ShoppingCart className="size-5 stroke-[1.5]" />}
              />

              <StatCard
                label="Pedidos hoy"
                value="8"
                trend="↑ 33% vs. promedio"
                icon={<Package className="size-5 stroke-[1.5]" />}
              />

              <StatCard
                label="Productos activos"
                value="28"
                description="De 32 productos"
                icon={<Flower2 className="size-5 stroke-[1.5]" />}
              />

              <StatCard
                label="Usuarios"
                value="3"
                description="Activos en el sistema"
                icon={<Users className="size-5 stroke-[1.5]" />}
              />
            </div>
          </PageSection>

          <PageSection className="mt-6">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
              <SectionCard
                title="Ventas de los últimos 7 días"
                description="Evolución de las ventas registradas."
                action={
                  <Button variant="outline" size="sm">
                    7 días
                    <ChevronDown />
                  </Button>
                }
              >
                <div className="flex h-[260px] items-end gap-3 border-b border-border-decorative px-4 pb-6 pt-8 sm:gap-5">
                  {[36, 52, 45, 68, 58, 82, 94].map((height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full max-w-12 rounded-t-sm bg-brand"
                        style={{ height: `${height}%` }}
                      />

                      <span className="text-[11px] text-text-secondary">
                        {19 + index} sep
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Inventario"
                description="Estado general de existencias."
              >
                <div className="space-y-5 px-4 pb-5 sm:px-6">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <StatusDot status="success" label="Stock normal" />
                      <strong>42</strong>
                    </div>

                    <div className="h-2 rounded-full bg-brand-soft">
                      <div className="h-full w-[76%] rounded-full bg-leaf" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <StatusDot status="warning" label="Stock bajo" />
                      <strong>6</strong>
                    </div>

                    <div className="h-2 rounded-full bg-brand-soft">
                      <div className="h-full w-[28%] rounded-full bg-[#B98900]" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <StatusDot status="danger" label="Agotados" />
                      <strong>2</strong>
                    </div>

                    <div className="h-2 rounded-full bg-brand-soft">
                      <div className="h-full w-[10%] rounded-full bg-danger" />
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </PageSection>

          <PageSection className="mt-6">
            <SectionCard
              title="Pedidos recientes"
              description="Actividad reciente de tus pedidos."
              action={
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead numeric>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold">
                        #{order.id}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                            {order.customer
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </div>

                          {order.customer}
                        </div>
                      </TableCell>

                      <TableCell numeric>{order.total}</TableCell>

                      <TableCell>
                        <Badge status={order.status} />
                      </TableCell>

                      <TableCell className="text-text-secondary">
                        {order.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </PageSection>

          <PageSection className="mt-6">
            <div>
              <h2 className="font-display text-2xl font-medium text-text">
                Productos destacados
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                Productos actualmente disponibles en el catálogo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.map(([name, price, sold]) => (
                <Card
                  key={name}
                  interactive
                  className="group cursor-pointer"
                >
                  <div className="flex aspect-[4/3] items-center justify-center rounded-sm bg-brand-soft text-brand">
                    <Flower2 className="size-12 stroke-[1.25] transition-transform duration-150 group-hover:scale-105" />
                  </div>

                  <div>
                    <p className="font-medium text-text">{name}</p>

                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {price}
                    </p>
                  </div>

                  <Badge variant="outline">{sold}</Badge>
                </Card>
              ))}
            </div>
          </PageSection>

          <PageSection className="mt-6">
            <ActionBar>
              <div>
                <p className="text-sm font-semibold text-text">
                  Componentes UI / UX
                </p>

                <p className="mt-1 text-xs text-text-secondary">
                  Esta barra prueba cómo se comportarán las acciones en
                  pantallas administrativas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar cambios</Button>
              </div>
            </ActionBar>
          </PageSection>

          <PageSection className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard
                title="Formulario"
                description="Prueba de los controles existentes."
              >
                <div className="space-y-4 px-4 pb-5 sm:px-6">
                  <Field
                    label="Nombre del producto"
                    hint="El nombre que aparecerá en el catálogo."
                  >
                    <Input placeholder="Ramo de rosas rojas" />
                  </Field>

                  <Field label="Precio">
                    <Input type="number" placeholder="150.00" />
                  </Field>

                  <div className="flex justify-end">
                    <Button>Guardar producto</Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Modal y estados"
                description="Prueba de componentes auxiliares del sistema."
              >
                <div className="space-y-4 px-4 pb-5 sm:px-6">
                  <Modal>
                    <ModalTrigger asChild>
                      <Button variant="outline">Abrir modal</Button>
                    </ModalTrigger>

                    <ModalContent>
                      <ModalHeader>
                        <ModalTitle className="font-display font-medium">
                          Confirmar acción
                        </ModalTitle>

                        <ModalDescription>
                          Este modal utiliza el componente existente del
                          Design System.
                        </ModalDescription>
                      </ModalHeader>

                      <p className="py-3 text-sm text-text-secondary">
                        Aquí podremos probar posteriormente formularios,
                        confirmaciones y detalles de productos.
                      </p>

                      <ModalFooter>
                        <ModalClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </ModalClose>

                        <ModalClose asChild>
                          <Button>Confirmar</Button>
                        </ModalClose>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>

                  <EmptyState
                    icon={<Package className="size-6" />}
                    title="Estado vacío"
                    description="Así se mostrará una sección cuando todavía no existan registros."
                  />
                </div>
              </SectionCard>
            </div>
          </PageSection>
        </ResponsiveContainer>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-[#1E1826]/40"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 w-[280px] bg-surface p-4 shadow-overlay">
            <div className="flex items-center justify-between border-b border-border-decorative pb-4">
              <div className="flex items-center gap-2">
                <Flower2 className="size-5 text-brand" />

                <span className="font-display text-lg font-medium">
                  NOVA FLORERÍA
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
              >
                <X />
              </Button>
            </div>

            <nav className="mt-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm",
                      item.active
                        ? "bg-brand-soft font-semibold text-brand"
                        : "text-text-secondary hover:bg-brand-soft hover:text-text",
                    ].join(" ")}
                  >
                    <Icon className="size-[18px]" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
