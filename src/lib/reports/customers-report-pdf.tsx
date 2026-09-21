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

export type CustomerReportRow = {
  name: string;
  phone: string | null;
  order_count: number;
  total_spent: number;
};

export function CustomersReportDocument({ rows }: { rows: CustomerReportRow[] }) {
  const totalClientes = rows.length;
  const totalGastado = rows.reduce((sum, r) => sum + r.total_spent, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Nova Florería — Reporte de Clientes</Text>
        <Text style={styles.subtitle}>Ordenado por total gastado, de mayor a menor</Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Clientes con pedidos</Text>
            <Text>{totalClientes}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total generado</Text>
            <Text>Bs. {totalGastado.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>Nombre</Text>
          <Text style={styles.col}>Teléfono</Text>
          <Text style={styles.col}>Pedidos</Text>
          <Text style={styles.col}>Total gastado</Text>
        </View>
        {rows.map((r, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.col}>{r.name}</Text>
            <Text style={styles.col}>{r.phone ?? "-"}</Text>
            <Text style={styles.col}>{r.order_count}</Text>
            <Text style={styles.col}>Bs. {r.total_spent.toFixed(2)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}