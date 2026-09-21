import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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

export type CancellationReportRow = {
  order_number: number;
  order_type: string;
  total: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
};

export function CancellationsReportDocument({
  from,
  to,
  rows,
}: {
  from: string;
  to: string;
  rows: CancellationReportRow[];
}) {
  const totalCancelado = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Nova Florería — Reporte de Cancelaciones</Text>
        <Text style={styles.subtitle}>
          Periodo: {from} a {to}
        </Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Pedidos cancelados</Text>
            <Text>{rows.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Monto total cancelado</Text>
            <Text>Bs. {totalCancelado.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>#</Text>
          <Text style={styles.col}>Tipo</Text>
          <Text style={styles.col}>Total</Text>
          <Text style={styles.col}>Motivo</Text>
          <Text style={styles.col}>Fecha</Text>
        </View>
        {rows.map((r) => (
          <View style={styles.tableRow} key={r.order_number}>
            <Text style={styles.col}>{r.order_number}</Text>
            <Text style={styles.col}>{r.order_type}</Text>
            <Text style={styles.col}>Bs. {r.total.toFixed(2)}</Text>
            <Text style={styles.col}>{r.cancellation_reason ?? "-"}</Text>
            <Text style={styles.col}>
              {r.cancelled_at ? new Date(r.cancelled_at).toLocaleDateString("es-BO") : "-"}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}