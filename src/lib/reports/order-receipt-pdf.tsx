import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 2, fontWeight: 700 },
  orderNumber: { fontSize: 12, marginBottom: 12, color: "#333333" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", color: "#555555" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #000000", paddingBottom: 4, marginBottom: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #dddddd", paddingVertical: 3 },
  col: { flex: 1 },
  colWide: { flex: 2 },
  totalsBox: { marginTop: 12, paddingTop: 8, borderTop: "1 solid #000000" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  grandTotal: { fontSize: 12, fontWeight: 700 },
  footer: { marginTop: 24, fontSize: 8, color: "#888888", textAlign: "center" },
});

export type OrderReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type OrderReceiptData = {
  order_number: number;
  order_type: string;
  status: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: OrderReceiptItem[];
  subtotal: number;
  discount_total: number;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
};

export function OrderReceiptDocument({ order }: { order: OrderReceiptData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.title}>Nova Florería</Text>
        <Text style={styles.orderNumber}>Comprobante — Pedido #{order.order_number}</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Fecha</Text>
            <Text>{new Date(order.created_at).toLocaleString("es-BO")}</Text>
          </View>
          <View style={styles.row}>
            <Text>Tipo</Text>
            <Text>{order.order_type === "online" ? "Pedido online" : "Venta en tienda"}</Text>
          </View>
          <View style={styles.row}>
            <Text>Cliente</Text>
            <Text>{order.customer_name ?? "Cliente sin registrar"}</Text>
          </View>
          {order.customer_phone && (
            <View style={styles.row}>
              <Text>Teléfono</Text>
              <Text>{order.customer_phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colWide}>Producto</Text>
            <Text style={styles.col}>Cant.</Text>
            <Text style={styles.col}>P. Unit.</Text>
            <Text style={styles.col}>Total</Text>
          </View>
          {order.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.colWide}>{item.product_name}</Text>
              <Text style={styles.col}>{item.quantity}</Text>
              <Text style={styles.col}>Bs. {item.unit_price.toFixed(2)}</Text>
              <Text style={styles.col}>Bs. {item.line_total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>Bs. {order.subtotal.toFixed(2)}</Text>
          </View>
          {order.discount_total > 0 && (
            <View style={styles.totalRow}>
              <Text>Descuento</Text>
              <Text>- Bs. {order.discount_total.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total</Text>
            <Text style={styles.grandTotal}>Bs. {order.total.toFixed(2)}</Text>
          </View>
          {order.payment_method && (
            <View style={styles.totalRow}>
              <Text>Pago ({order.payment_method})</Text>
              <Text>{order.payment_status ?? "-"}</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>Gracias por su compra — Nova Florería</Text>
      </Page>
    </Document>
  );
}