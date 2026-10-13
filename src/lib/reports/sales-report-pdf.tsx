import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SalesEvent } from "./sales-ledger";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 10, marginBottom: 12, color: "#555555" },
  summaryBox: { marginBottom: 16, padding: 8, backgroundColor: "#f5f5f5" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #000000", paddingBottom: 4, marginBottom: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #dddddd", paddingVertical: 3 },
  col: { flex: 1 },
});

export type SalesReportOrderRow = {
  order_number: number;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  payment_method: string | null;
};

export type SalesReportSummary = {
  from: string;
  to: string;
  total_sales: number;
  gross_sales: number;
  refunds: number;
  net_sales: number;
  count_online: number;
  count_fisica: number;
  by_payment_method: Record<string, number>;
};

export function SalesReportDocument({
  summary,
  orders,
  refunds = [],
}: {
  summary: SalesReportSummary;
  orders: SalesReportOrderRow[];
  refunds?: SalesEvent[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Floristería Anabelle — Reporte de Ventas</Text>
        <Text style={styles.subtitle}>
          Periodo: {summary.from} a {summary.to}
        </Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Ventas brutas</Text>
            <Text>Bs. {summary.total_sales.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}><Text>Reintegros monetarios</Text><Text>Bs. {summary.refunds.toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text>Ventas netas</Text><Text>Bs. {summary.net_sales.toFixed(2)}</Text></View>
          <Text>Ventas reconocidas al confirmar; reintegros según fecha de registro (America/La_Paz).</Text>
          <View style={styles.summaryRow}>
            <Text>Pedidos online</Text>
            <Text>{summary.count_online}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Ventas físicas</Text>
            <Text>{summary.count_fisica}</Text>
          </View>
          {Object.entries(summary.by_payment_method).map(([method, amount]) => (
            <View style={styles.summaryRow} key={method}>
              <Text>Método: {method}</Text>
              <Text>Bs. {amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>#</Text>
          <Text style={styles.col}>Tipo</Text>
          <Text style={styles.col}>Estado</Text>
          <Text style={styles.col}>Cliente</Text>
          <Text style={styles.col}>Fecha</Text>
          <Text style={styles.col}>Total</Text>
        </View>
        {orders.map((o) => (
          <View style={styles.tableRow} key={o.order_number}>
            <Text style={styles.col}>{o.order_number}</Text>
            <Text style={styles.col}>{o.order_type}</Text>
            <Text style={styles.col}>{o.status}</Text>
            <Text style={styles.col}>{o.customer_name || "-"}</Text>
            <Text style={styles.col}>{new Date(o.created_at).toLocaleDateString("es-BO", { timeZone: "America/La_Paz" })}</Text>
            <Text style={styles.col}>Bs. {o.total.toFixed(2)}</Text>
          </View>
        ))}
        <Text style={styles.title}>Reintegros monetarios</Text>
        {refunds.length===0 ? <Text>Sin reintegros en el período.</Text> : refunds.map(refund => <View style={styles.tableRow} key={refund.event_id}><Text style={styles.col}>#{refund.order_number} · {refund.return_type}</Text><Text style={styles.col}>{new Date(refund.occurred_at).toLocaleDateString("es-BO", {timeZone:"America/La_Paz"})}</Text><Text style={styles.col}>Original: Bs {Number(refund.original_total).toFixed(2)}</Text><Text style={styles.col}>Reintegro: Bs {Number(refund.amount).toFixed(2)} · Impacto neto: Bs {Number(refund.financial_effect).toFixed(2)}</Text><Text style={styles.col}>{refund.actor_name || "Administrador"} · {refund.reason}</Text></View>)}
      </Page>
    </Document>
  );
}
