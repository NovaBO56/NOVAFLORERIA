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

export type ProductSoldRow = {
  product_name: string;
  quantity: number;
  revenue: number;
};

export function ProductsSoldReportDocument({
  from,
  to,
  rows,
}: {
  from: string;
  to: string;
  rows: ProductSoldRow[];
}) {
  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Nova Florería — Productos Vendidos</Text>
        <Text style={styles.subtitle}>
          Periodo: {from} a {to}
        </Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Unidades vendidas</Text>
            <Text>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Ingresos totales</Text>
            <Text>Bs. {totalRevenue.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>Producto</Text>
          <Text style={styles.col}>Cantidad</Text>
          <Text style={styles.col}>Ingresos</Text>
        </View>
        {rows.map((r) => (
          <View style={styles.tableRow} key={r.product_name}>
            <Text style={styles.col}>{r.product_name}</Text>
            <Text style={styles.col}>{r.quantity}</Text>
            <Text style={styles.col}>Bs. {r.revenue.toFixed(2)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}