"use client";

import { useEffect, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type CashRegister = { id: string; name: string };

type OneOrMany<T> = T | T[] | null;
function first<T>(value: OneOrMany<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type CashSession = {
  id: string;
  opening_amount: number;
  opened_at: string;
  status: "abierta" | "cerrada";
  cash_register: OneOrMany<{ name: string }>;
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

const MOVEMENT_CHIPS: { value: MovementType; label: string; requiresReason: boolean }[] = [
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
    return <Card className="h-40 animate-pulse" />;
  }

  if (error) {
    return (
      <Card className="items-center gap-2 text-center">
        <TriangleAlert aria-hidden="true" className="size-8 stroke-[1.5] text-danger" />
        <p className="text-text-secondary">{error}</p>
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

function OpenSessionForm({ onOpened }: { onOpened: () => void }) {
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
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Abrir caja</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-text-secondary">Cargando cajas…</p>
        ) : registers.length === 0 ? (
          <p className="text-text-secondary">No hay cajas activas configuradas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] leading-[1.4] font-medium tracking-[0.02em] text-text-secondary uppercase">
              Caja
            </p>
            <div className="flex flex-wrap gap-2">
              {registers.map((register) => (
                <Button
                  key={register.id}
                  size="sm"
                  variant={registerId === register.id ? "default" : "outline"}
                  onClick={() => setRegisterId(register.id)}
                >
                  {register.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Field label="Monto inicial">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={openingAmount}
            onChange={(event) => setOpeningAmount(event.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button
          loading={submitting}
          disabled={!registerId || openingAmount === ""}
          onClick={() => void submit()}
        >
          Abrir caja
        </Button>
      </CardContent>
    </Card>
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{registerName} · abierta</span>
            <Button variant="destructive" size="sm" onClick={() => setCloseOpen(true)}>
              Cerrar caja
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-text-secondary">Apertura</p>
            <p className="tabular-nums text-text">{formatMoney(session.opening_amount)}</p>
          </div>
          <div>
            <p className="text-text-secondary">Esperado en efectivo</p>
            <p className="tabular-nums text-text">{formatMoney(expected)}</p>
          </div>
          <div>
            <p className="text-text-secondary">Abierta desde</p>
            <p className="text-text">{formatDateTime(session.opened_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrar movimiento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {MOVEMENT_CHIPS.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={movementType === item.value ? "default" : "outline"}
                onClick={() => setMovementType(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {movementType === "ajuste" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={direction === "entrada" ? "secondary" : "ghost"}
                onClick={() => setDirection("entrada")}
              >
                Entrada
              </Button>
              <Button
                size="sm"
                variant={direction === "salida" ? "secondary" : "ghost"}
                onClick={() => setDirection("salida")}
              >
                Salida
              </Button>
            </div>
          )}

          <Field label="Monto">
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>

          <Field label="Motivo" optional={!chip.requiresReason}>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>

          {movementError && <p className="text-sm text-danger">{movementError}</p>}

          <Button loading={submittingMovement} disabled={!canSubmitMovement} onClick={() => void submitMovement()}>
            Registrar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos de esta sesión</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-text-secondary">Aún no hay movimientos en esta sesión.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-text">
                      {MOVEMENT_CHIPS.find((item) => item.value === movement.movement_type)?.label ??
                        movement.movement_type}
                      {movement.payment_method === "qr" ? " · QR" : ""}
                    </p>
                    {movement.reason && <p className="truncate text-text-secondary">{movement.reason}</p>}
                  </div>
                  <span className="shrink-0 tabular-nums text-text-secondary">{formatMoney(movement.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          setCountedAmount("");
          setClosingNote("");
          setConfirmDifference(false);
          setError("");
        }
      }}
    >
      <ModalContent dismissible={!submitting}>
        <ModalHeader>
          <ModalTitle>Cerrar caja</ModalTitle>
          <ModalDescription>Cuenta el efectivo antes de confirmar el cierre.</ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary">
            Esperado en efectivo: <span className="tabular-nums text-text">{formatMoney(expected)}</span>
          </p>

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

          {difference !== null && (
            <p className={hasDifference ? "text-sm text-[#B98900]" : "text-sm text-text-secondary"}>
              Diferencia: {difference >= 0 ? "+" : ""}
              {formatMoney(difference)}
            </p>
          )}

          {hasDifference && (
            <label className="flex items-start gap-2 text-sm text-text">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmDifference}
                onChange={(event) => setConfirmDifference(event.target.checked)}
              />
              Confirmo el cierre con esta diferencia.
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
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