import { Document, Page, Text, View, StyleSheet, Svg, Ellipse, Circle, Path } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 26, paddingBottom: 54, fontSize: 9, lineHeight: 1.35, fontFamily: "Helvetica", color: "#393141", backgroundColor: "#ffffff" },
  header: { padding: 12, marginBottom: 12, backgroundColor: "#f5f0fa", borderRadius: 12, borderBottom: "1 solid #e4d9ef", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 19, marginBottom: 3, fontWeight: 700, color: "#604581" },
  subtitle: { fontSize: 10, color: "#6c6278" },
  orderNumber: { fontSize: 15, marginBottom: 6, color: "#604581", fontWeight: 700 },
  section: { marginBottom: 9 },
  sectionTitle: { fontSize: 8, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, color: "#765d8d" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f0fa", borderRadius: 5, padding: 7, marginBottom: 2, fontWeight: 700, color: "#604581", fontSize: 8 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #e9e2ee", paddingHorizontal: 7, paddingVertical: 8 },
  col: { flex: 1, textAlign: "right", paddingLeft: 5 },
  colWide: { flex: 2, paddingRight: 7 },
  totalsBox: { marginTop: 10, marginBottom: 16, padding: 12, backgroundColor: "#f8f5fb", borderRadius: 9, border: "1 solid #e5dced" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  grandTotal: { fontSize: 14, fontWeight: 700, color: "#604581", marginVertical: 5 },
  thanks: { fontSize: 9, color: "#604581", textAlign: "center", marginBottom: 3 },
  footer: { position: "absolute", bottom: 10, left: 26, width: 367, height: 40, fontSize: 7, color: "#746b7c", textAlign: "center", borderTop: "0.5 solid #e5dced", paddingTop: 5 },
});

/** Decorative floral sprig, not a logo or business photograph. */
function FloralSprig() {
  return <Svg width={28} height={42} viewBox="0 0 38 58"><Path d="M19 28 C16 38 24 44 18 57" stroke="#9cac9c" strokeWidth={1.5}/><Ellipse cx={13} cy={41} rx={7} ry={3} fill="#dce8dd"/><Ellipse cx={25} cy={48} rx={7} ry={3} fill="#dce8dd"/><Ellipse cx={19} cy={13} rx={5} ry={10} fill="#ddd0ed"/><Ellipse cx={19} cy={29} rx={5} ry={10} fill="#e9dced"/><Ellipse cx={11} cy={21} rx={10} ry={5} fill="#e8d9ed"/><Ellipse cx={27} cy={21} rx={10} ry={5} fill="#ddd0ed"/><Circle cx={19} cy={21} r={4} fill="#c7afd9"/></Svg>;
}

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
  paid_at?: string;
  customer_message?: string | null;
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
    <Document title={`Comprobante de pedido ${order.order_number}`} author="Floristería Anabelle">
      <Page size="A5" style={styles.page}>
        <View style={styles.header} wrap={false}><View><Text style={styles.title}>Floristería Anabelle</Text><Text style={styles.subtitle}>Comprobante de pedido</Text></View><FloralSprig/></View>
        <Text style={styles.orderNumber}>Pedido #{order.order_number}</Text>
        <Text style={styles.sectionTitle}>{order.payment_status === "confirmado" ? "PAGO VERIFICADO POR LA TIENDA" : "ESTADO DEL PEDIDO"}</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Fecha</Text>
            <Text>{new Date(order.paid_at || order.created_at).toLocaleString("es-BO", { timeZone: "America/La_Paz" })}</Text>
          </View>
          <View style={styles.row}>
            <Text>Tipo</Text>
            <Text>{order.order_type === "online" ? "Pedido online" : "Venta en tienda"}</Text>
          </View>
          <View style={styles.row}>
            <Text>Cliente</Text>
            <Text style={{ maxWidth: "74%", textAlign: "right" }}>{order.customer_name ?? "Cliente sin registrar"}</Text>
          </View>
          {order.customer_phone && (
            <View style={styles.row}>
              <Text>Teléfono</Text>
              <Text>{order.customer_phone}</Text>
            </View>
          )}
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Estado del pedido</Text><Text>{({ pendiente_pago: "Pendiente de pago", confirmado: "Confirmado", en_preparacion: "En preparación", listo: "Listo para entrega o recojo", finalizado: "Finalizado", cancelado: "Cancelado", rechazado: "Rechazado" } as Record<string, string>)[order.status] ?? order.status}</Text></View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.tableHeader} minPresenceAhead={26}>
            <Text style={styles.colWide}>Producto</Text>
            <Text style={styles.col}>Cant.</Text>
            <Text style={styles.col}>P. Unit.</Text>
            <Text style={styles.col}>Total</Text>
          </View>
          {order.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx} wrap={false}>
              <Text style={styles.colWide}>{item.product_name}</Text>
              <Text style={styles.col}>{item.quantity}</Text>
              <Text style={styles.col}>Bs. {item.unit_price.toFixed(2)}</Text>
              <Text style={styles.col}>Bs. {item.line_total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox} wrap={false}>
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
            <Text style={styles.grandTotal}>{order.payment_status === "confirmado" ? "Total pagado" : "Total del pedido"}</Text>
            <Text style={styles.grandTotal}>Bs. {order.total.toFixed(2)}</Text>
          </View>
          {order.payment_method && (
            <View style={styles.totalRow}>
              <Text>Pago ({order.payment_method === "qr" ? "QR" : order.payment_method === "efectivo" ? "Efectivo" : order.payment_method})</Text>
              <Text>{order.payment_status === "confirmado" ? "Verificado" : order.payment_status ?? "-"}</Text>
            </View>
          )}
        </View>

        {order.customer_message ? <View style={styles.section}><Text style={styles.sectionTitle}>Entrega / retiro y observaciones</Text><Text>{order.customer_message}</Text></View> : null}

        <View style={styles.footer} fixed><Text style={styles.thanks}>Gracias por confiar en Floristería Anabelle</Text><Text>No es una factura fiscal.</Text><Text render={({ pageNumber, totalPages }) => `Floristería Anabelle  |  ${pageNumber} / ${totalPages}`}/></View>
      </Page>
    </Document>
  );
}
