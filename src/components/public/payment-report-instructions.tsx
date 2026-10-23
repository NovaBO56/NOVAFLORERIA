export function PaymentReportInstructions({ whatsappAvailable }: { whatsappAvailable: boolean }) {
  return <p className="customer-muted mt-4 text-sm">El aviso no confirma el pago. {whatsappAvailable ? "Si avisas por WhatsApp, debes pulsar Enviar en tu aplicación." : "Consulta aquí las novedades mientras la tienda verifica tu pago."}</p>;
}
