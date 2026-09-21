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

export type CashSessionReportRow = {
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  expected_amount: number | null;
  counted_amount: number | null;
  difference_amount: number | null;
  status: string;
};

export function CashReportDocument({ from, to, rows }: { from: string; to: string; rows: CashSessionReportRow[] }) {
  const totalDifference = rows.reduce((sum, r) => sum + (r.difference_amount ?? 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Nova Florería — Reporte de Caja</Text>
        <Text style={styles.subtitle}>
          Periodo: {from} a {to}
        </Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Sesiones registradas</Text>
            <Text>{rows.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Diferencia acumulada</Text>
            <Text>Bs. {totalDifference.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>Apertura</Text>
          <Text style={styles.col}>Cierre</Text>
          <Text style={styles.col}>Esperado</Text>
          <Text style={styles.col}>Contado</Text>
          <Text style={styles.col}>Diferencia</Text>
          <Text style={styles.col}>Estado</Text>
        </View>
        {rows.map((r, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.col}>{new Date(r.opened_at).toLocaleString("es-BO")}</Text>
            <Text style={styles.col}>{r.closed_at ? new Date(r.closed_at).toLocaleString("es-BO") : "-"}</Text>
            <Text style={styles.col}>{r.expected_amount != null ? `Bs. ${r.expected_amount.toFixed(2)}` : "-"}</Text>
            <Text style={styles.col}>{r.counted_amount != null ? `Bs. ${r.counted_amount.toFixed(2)}` : "-"}</Text>
            <Text style={styles.col}>{r.difference_amount != null ? `Bs. ${r.difference_amount.toFixed(2)}` : "-"}</Text>
            <Text style={styles.col}>{r.status}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}