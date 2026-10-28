"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, Clock3, LockKeyhole, ReceiptText, TriangleAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { formatDateTime, formatMoney } from "@/lib/format";

type CashRegister = { id: string; name: string; };

type OneOrMany<T> = T | T[] | null;
function first<T>(value: OneOrMany<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type CashSession = {
  id: string;
  opening_amount: number;
  opened_at: string;
  status: "abierta" | "cerrada";
  cash_register: OneOrMany<{ name: string; }>;
};

type MovementType = "venta" | "ingreso" | "gasto" | "ajuste" | "devolucion";

type CashMovement = {
  id: string;
  movement_type: MovementType;
  payment_method: "efectivo" | "qr";
  amount: number;
  direction: "entrada" | "salida" | null;
  reason: string | null;
  created_at: string;
};

const MOVEMENT_CHIPS: { value: MovementType; label: string; requiresReason: boolean; }[] = [
  { value: "ingreso", label: "Ingreso", requiresReason: false },
  { value: "gasto", label: "Gasto", requiresReason: true },
  { value: "ajuste", label: "Ajuste", requiresReason: true },
  { value: "devolucion", label: "Devolución", requiresReason: true },
];

/** Calcula el esperado en efectivo con la misma fórmula que close_cash_session() (Fase 10). */
function computeExpectedCash(openingAmount: number, movements: CashMovement[]): number {
  const net = movements.reduce((sum, movement) => {
    if (movement.payment_method !== "efectivo") return sum;
    if (movement.movement_type === "venta" || movement.movement_type === "ingreso") return sum + movement.amount;
    if (movement.movement_type === "gasto" || movement.movement_type === "devolucion") return sum - movement.amount;
    if (movement.movement_type === "ajuste") {
      return movement.direction === "entrada" ? sum + movement.amount : sum - movement.amount;
    }
    return sum;
  }, 0);
  return openingAmount + net;
}

export function CashPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const sessionsResponse = await fetch("/api/admin/cash-sessions?status=abierta");
      const sessionsBody = await sessionsResponse.json();
      if (!sessionsResponse.ok || !sessionsBody.success) {
        throw new Error(sessionsBody.message ?? "No se pudo obtener el estado de la caja.");
      }

      const openSession: CashSession | null = (sessionsBody.sessions ?? [])[0] ?? null;
      setSession(openSession);

      if (openSession) {
        const movementsResponse = await fetch(`/api/admin/cash-sessions/${openSession.id}/movements`);
        const movementsBody = await movementsResponse.json();
        if (!movementsResponse.ok || !movementsBody.success) {
          throw new Error(movementsBody.message ?? "No se pudieron obtener los movimientos.");
        }
        setMovements(movementsBody.movements ?? []);
      } else {
        setMovements([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo obtener el estado de la caja.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  if (loading) {
    return <Card className="h-48 animate-pulse" role="status" aria-label="Cargando estado de caja" />;
  }

  if (error) {
    return (
      <Card className="items-center gap-2 text-center">
        <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-danger" />
        <p className="text-text-secondary">
          {error}
        </p>
        <Button variant="outline" onClick={() => void load()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  if (!session) {
    return <OpenSessionForm onOpened={() => void load()} />;
  }

  return <OpenSessionPanel session={session} movements={movements} onChanged={() => void load()} />;
}

function OpenSessionForm({ onOpened }: { onOpened: () => void; }) {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [registerId, setRegisterId] = useState<string | null>(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/cash-registers");
        const body = await response.json();
        if (!cancelled && response.ok && body.success) {
          setRegisters(body.registers ?? []);
          if ((body.registers ?? []).length === 1) setRegisterId(body.registers[0].id);
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

  async function submit() {
    if (!registerId) return;
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch("/api/admin/cash-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cash_register_id: registerId, opening_amount: Number(openingAmount) }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message ?? "No se pudo abrir la caja.");
      }
      onOpened();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la caja.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <SectionCard
        title="Abrir sesión de caja"
        description="Selecciona la caja e indica el efectivo disponible al comenzar el turno."
      >
        <div className="space-y-5">
          {
            loading ? <p role="status" className="text-sm text-text-secondary">
              Cargando cajas…
            </p> : registers.length === 0 ? <div className="admin-notice text-sm" data-tone="warning">
              No hay cajas activas configuradas.
            </div> : (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Caja
                </p>
                <div className="flex flex-wrap gap-2">
                  {
                    registers.map(register => <Button
                      key={register.id}
                      variant={registerId === register.id ? "secondary" : "outline"}
                      aria-pressed={registerId === register.id}
                      onClick={() => setRegisterId(register.id)}
                    >
                      <Wallet aria-hidden="true" />{register.name}
                    </Button>)
                  }
                </div>
              </div>
            )
          }
          <Field label="Monto inicial (Bs)" hint="Cuenta únicamente el efectivo con el que abres el turno.">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={openingAmount}
              onChange={event => setOpeningAmount(event.target.value)}
            />
          </Field>
          {
            error && <p role="alert" className="admin-notice text-sm" data-tone="danger">
              {error}
            </p>
          }
          <div className="admin-form-actions">
            <Button
              loading={submitting}
              loadingText="Abriendo caja…"
              disabled={!registerId || openingAmount === ""}
              onClick={() => void submit()}
            >
              <Wallet aria-hidden="true" />Abrir caja
            </Button>
          </div>
        </div>
      </SectionCard>
      <Card className="gap-4 bg-slate-50 shadow-none">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </div>
          <h2 className="text-base font-semibold">
            Tu turno, bajo control
          </h2>
        </div>
        <p className="text-sm leading-6 text-text-secondary">
          La sesión reúne las ventas y los movimientos del turno para comparar el efectivo esperado con el dinero contado al cerrar.
        </p>
        <ol className="space-y-3 text-sm text-text-secondary">
          <li>
            <strong className="text-text">
              1. Abre
            </strong> con el efectivo inicial.
          </li>
          <li>
            <strong className="text-text">
              2. Registra
            </strong> las ventas, ingresos y gastos.
          </li>
          <li>
            <strong className="text-text">
              3. Cierra
            </strong> después de contar el efectivo.
          </li>
        </ol>
      </Card>
    </div>
  );
}

function OpenSessionPanel({
  session,
  movements,
  onChanged,
}: {
  session: CashSession;
  movements: CashMovement[];
  onChanged: () => void;
}) {
  const registerName = first(session.cash_register)?.name ?? "Caja";
  const expected = useMemo(() => computeExpectedCash(session.opening_amount, movements), [session, movements]);

  const [movementType, setMovementType] = useState<MovementType>("ingreso");
  const [direction, setDirection] = useState<"entrada" | "salida">("entrada");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [movementError, setMovementError] = useState("");

  const [closeOpen, setCloseOpen] = useState(false);

  const chip = MOVEMENT_CHIPS.find((item) => item.value === movementType)!;

  async function submitMovement() {
    try {
      setSubmittingMovement(true);
      setMovementError("");
      const response = await fetch(`/api/admin/cash-sessions/${session.id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movement_type: movementType,
          amount: Number(amount),
          direction: movementType === "ajuste" ? direction : null,
          reason: reason.trim() || null,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message ?? "No se pudo registrar el movimiento.");
      }
      setAmount("");
      setReason("");
      onChanged();
    } catch (err) {
      setMovementError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
    } finally {
      setSubmittingMovement(false);
    }
  }

  const canSubmitMovement = amount !== "" && (!chip.requiresReason || reason.trim() !== "");

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-decorative bg-surface p-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
          >
            <Wallet aria-hidden="true" className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">
                {registerName}
              </h2>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Sesión abierta
              </Badge>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Abierta desde {formatDateTime(session.opened_at)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-red-200 text-danger hover:border-red-300 hover:bg-red-50 hover:text-danger"
          size="sm"
          onClick={() => setCloseOpen(true)}
        >
          <LockKeyhole aria-hidden="true" />Cerrar caja
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Monto de apertura"
          value={formatMoney(session.opening_amount)}
          description="Efectivo inicial del turno"
          icon={<Wallet />}
        />
        <StatCard
          label="Esperado en efectivo"
          value={formatMoney(expected)}
          description="Apertura más movimientos en efectivo"
          icon={<Banknote />}
          tone="success"
        />
        <StatCard
          label="Movimientos"
          value={String(movements.length)}
          description="Registrados en esta sesión"
          icon={<ReceiptText />}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionCard
          title="Registrar movimiento"
          description="Selecciona la operación e indica su importe y motivo."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {
                MOVEMENT_CHIPS.map(item => <Button
                  key={item.value}
                  size="sm"
                  variant={movementType === item.value ? "secondary" : "outline"}
                  aria-pressed={movementType === item.value}
                  onClick={() => setMovementType(item.value)}
                >
                  {item.label}
                </Button>)
              }
            </div>
            <div className="admin-notice text-sm" data-tone={movementType === "ingreso" ? "success" : "warning"}>
              {
                movementType === "ingreso" ? "Este movimiento añade efectivo a la caja." : movementType === "ajuste" ? "Indica si el ajuste aumenta o reduce el efectivo." : "Este movimiento registra una salida de efectivo. Indica el motivo para dejar constancia."
              }
            </div>
            {
              movementType === "ajuste" && <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={direction === "entrada" ? "secondary" : "outline"}
                  aria-pressed={direction === "entrada"}
                  onClick={() => setDirection("entrada")}
                >
                  <ArrowDownLeft aria-hidden="true" />Entrada
                </Button>
                <Button
                  size="sm"
                  variant={direction === "salida" ? "secondary" : "outline"}
                  aria-pressed={direction === "salida"}
                  onClick={() => setDirection("salida")}
                >
                  <ArrowUpRight aria-hidden="true" />Salida
                </Button>
              </div>
            }
            <Field label="Monto (Bs)">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={event => setAmount(event.target.value)}
              />
            </Field>
            <Field label="Motivo" optional={!chip.requiresReason}>
              <Textarea
                value={reason}
                placeholder="Describe brevemente este movimiento"
                onChange={event => setReason(event.target.value)}
              />
            </Field>
            {
              movementError && <p role="alert" className="admin-notice text-sm" data-tone="danger">
                {movementError}
              </p>
            }
            <div className="admin-form-actions">
              <Button
                className="w-full sm:w-auto"
                loading={submittingMovement}
                loadingText="Registrando…"
                disabled={!canSubmitMovement}
                onClick={() => void submitMovement()}
              >
                Registrar {chip.label.toLowerCase()}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Movimientos del turno"
          description="Detalle de las entradas, salidas y cobros de esta sesión."
        >
          {
            movements.length === 0 ? <EmptyState
              icon={<ReceiptText />}
              title="Aún no hay movimientos"
              description="Los cobros y los movimientos registrados aparecerán aquí."
            /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Operación
                    </TableHead>
                    <TableHead>
                      Método
                    </TableHead>
                    <TableHead numeric>
                      Importe
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {
                    movements.map(movement => {
                      const outgoing = movement.movement_type === "gasto" || movement.movement_type === "devolucion" || (movement.movement_type === "ajuste" && movement.direction !== "entrada");
                      return <TableRow key={movement.id}>
                        <TableCell>
                          <p className="font-medium">
                            {
                              movement.movement_type === "venta" ? "Venta" : MOVEMENT_CHIPS.find(item => item.value === movement.movement_type)?.label ?? movement.movement_type
                            }
                          </p>{
                            movement.reason && <p className="mt-1 max-w-64 break-words text-xs text-text-secondary">
                              {movement.reason}
                            </p>
                          }
                          <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                            <Clock3 aria-hidden="true" className="size-3" />{formatDateTime(movement.created_at)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {movement.payment_method === "qr" ? "QR" : "Efectivo"}
                          </Badge>
                        </TableCell>
                        <TableCell numeric>
                          <span className={outgoing ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                            {outgoing ? "−" : "+"}{formatMoney(movement.amount)}
                          </span>
                        </TableCell>
                      </TableRow>;
                    })
                  }
                </TableBody>
              </Table>
            )
          }
        </SectionCard>
      </div>

      <CloseSessionModal
        open={closeOpen}
        sessionId={session.id}
        expected={expected}
        onClose={() => setCloseOpen(false)}
        onClosed={onChanged}
      />
    </div>
  );
}

function CloseSessionModal({
  open,
  sessionId,
  expected,
  onClose,
  onClosed,
}: {
  open: boolean;
  sessionId: string;
  expected: number;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [countedAmount, setCountedAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [confirmDifference, setConfirmDifference] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const counted = countedAmount === "" ? null : Number(countedAmount);
  const difference = counted === null ? null : counted - expected;
  const hasDifference = difference !== null && Math.round(difference * 100) !== 0;

  async function submit() {
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`/api/admin/cash-sessions/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counted_amount: Number(countedAmount), closing_note: closingNote.trim() || null }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message ?? "No se pudo cerrar la caja.");
      }
      onClose();
      onClosed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar la caja.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = countedAmount !== "" && (!hasDifference || confirmDifference);

  return (
    <Modal
      open={open}
      onOpenChange={
        (next) => {
          if (!next) {
            onClose();
            setCountedAmount("");
            setClosingNote("");
            setConfirmDifference(false);
            setError("");
          }
        }
      }
    >
      <ModalContent dismissible={!submitting}>
        <ModalHeader>
          <ModalTitle>
            Cerrar caja
          </ModalTitle>
          <ModalDescription>
            Cuenta el efectivo del turno. Al confirmar, la sesión se cerrará y quedará registrado el importe contado.
          </ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-3">
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-decorative bg-slate-50 p-4"
          >
            <span className="text-sm text-text-secondary">
              Esperado en efectivo
            </span>
            <span className="text-xl font-semibold tabular-nums text-text">
              {formatMoney(expected)}
            </span>
          </div>

          <Field label="Monto contado">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={countedAmount}
              onChange={(event) => setCountedAmount(event.target.value)}
            />
          </Field>

          <Field label="Nota de cierre" optional>
            <Textarea value={closingNote} onChange={(event) => setClosingNote(event.target.value)} />
          </Field>

          {
            difference !== null && (
              <p className={hasDifference ? "text-sm text-[#B98900]" : "text-sm text-text-secondary"}>
                Diferencia: {difference >= 0 ? "+" : ""}
                {formatMoney(difference)}
              </p>
            )
          }

          {
            hasDifference && (
              <label
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={confirmDifference}
                  onChange={(event) => setConfirmDifference(event.target.checked)}
                />
                Confirmo el cierre con esta diferencia.
              </label>
            )
          }

          {error && <p className="text-sm text-danger">
            {error}
          </p>}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={submitting} disabled={!canSubmit} onClick={() => void submit()}>
            Confirmar cierre
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}