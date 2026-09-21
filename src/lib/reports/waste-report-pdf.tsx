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

export type WasteReportRow = {
  item_name: string;
  quantity: number;
  unit: string;
  reason: string;
  created_at: string;
};

export function WasteReportDocument({ from, to, rows }: { from: string; to: string; rows: WasteReportRow[] }) {
  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Nova Florería — Reporte de Mermas</Text>
        <Text style={styles.subtitle}>
          Periodo: {from} a {to}
        </Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Registros de merma</Text>
            <Text>{rows.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Unidades perdidas (total)</Text>
            <Text>{totalQuantity}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>Ítem</Text>
          <Text style={styles.col}>Cantidad</Text>
          <Text style={styles.col}>Motivo</Text>
          <Text style={styles.col}>Fecha</Text>
        </View>
        {rows.map((r, idx) => (
          <View style={styles.tableRow} key={`${r.item_name}-${idx}`}>
            <Text style={styles.col}>{r.item_name}</Text>
            <Text style={styles.col}>
              {r.quantity} {r.unit}
            </Text>
            <Text style={styles.col}>{r.reason}</Text>
            <Text style={styles.col}>{new Date(r.created_at).toLocaleDateString("es-BO")}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}