export function notificationMessage(message: string) {
  return message.replace(/\((\d+(?:\.\d+)?)\s+(unidad(?:es)?)\)/gi, (_match, value: string) => {
    const amount = Number(value); return `(${amount.toLocaleString("es-BO", { maximumFractionDigits: 3 })} ${amount === 1 ? "unidad" : "unidades"})`;
  });
}
