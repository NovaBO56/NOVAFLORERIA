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

export type InventoryReportRow = {
  name: string;
  item_type: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  stock_status: "agotado" | "bajo" | "normal";
};

export function InventoryReportDocument({ rows }: { rows: InventoryReportRow[] }) {
  const agotados = rows.filter((r) => r.stock_status === "agotado").length;
  const bajos = rows.filter((r) => r.stock_status === "bajo").length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Nova Florería — Reporte de Inventario</Text>
        <Text style={styles.subtitle}>Estado actual, al momento de generar el reporte</Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Ítems totales</Text>
            <Text>{rows.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Agotados</Text>
            <Text>{agotados}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Bajo stock</Text>
            <Text>{bajos}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col}>Nombre</Text>
          <Text style={styles.col}>Tipo</Text>
          <Text style={styles.col}>Stock actual</Text>
          <Text style={styles.col}>Stock mínimo</Text>
          <Text style={styles.col}>Estado</Text>
        </View>
        {rows.map((r) => (
          <View style={styles.tableRow} key={r.name}>
            <Text style={styles.col}>{r.name}</Text>
            <Text style={styles.col}>{r.item_type}</Text>
            <Text style={styles.col}>
              {r.current_stock} {r.unit}
            </Text>
            <Text style={styles.col}>
              {r.minimum_stock} {r.unit}
            </Text>
            <Text style={styles.col}>{r.stock_status}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}