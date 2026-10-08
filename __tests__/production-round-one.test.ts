import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { boliviaPhoneSchema, internationalBoliviaPhone, phoneInput } from "@/lib/public/phone";
import { storeLocationSchema, mapsDestination } from "@/validations/store-location";
import { optimizeProductImage } from "@/lib/product-image-file";
import { notificationMessage } from "@/lib/notification-presentation";
import { auditPresentation } from "@/lib/audit-presentation";
import { trackOrderSchema } from "@/validations/public-catalog";
import { paymentNotice } from "@/lib/public/payment-notice";

describe("Primera ronda de producción: reglas reales", () => {
  it("prepara aviso manual con pedido, cliente, importe y entrega",()=>{
    const message=paymentNotice({id:"test",order_number:12,status:"pendiente_pago",subtotal:10,discount_total:0,total:10,customer_message:"Método: Retiro en tienda",created_at:"",reserved_until:null,payment_status:"pendiente",items:[{product_name:"Ramo",quantity:1,unit_price:10,line_total:10,message:"Tarjeta TEST",note:null,personalization:null}]},"TEST cliente","70011223");
    expect(message).toContain("Pedido #12");expect(message).toContain("59170011223");expect(message).toContain("Tarjeta TEST");expect(message).toContain("Retiro en tienda");expect(message).toContain("pendiente de revisión");
  });
  it.each(["1234567","123456789","abc12345","+59170011223"])("rechaza celular nuevo %s", value => { expect(boliviaPhoneSchema.safeParse(value).success).toBe(false); });
  it("acepta 8 dígitos y normaliza separadores",()=>{expect(boliviaPhoneSchema.parse("7001-1223")).toBe("70011223");expect(phoneInput("70 01-1223")).toBe("70011223");});
  it("no duplica el prefijo y no cambia seguimiento histórico",()=>{expect(internationalBoliviaPhone("+59170011223")).toBe("59170011223");expect(internationalBoliviaPhone("70011223")).toBe("59170011223");expect(trackOrderSchema.safeParse({order_number:1,customer_phone:"+59170011223"}).success).toBe(true);});
  it("rechaza URL no Maps y coordenadas incompletas",()=>{expect(storeLocationSchema.safeParse({maps_url:"javascript:alert(1)"}).success).toBe(false);expect(storeLocationSchema.safeParse({latitude:12}).success).toBe(false);expect(storeLocationSchema.safeParse({latitude:91,longitude:0}).success).toBe(false);});
  it("genera destino con coordenadas cero válidas",()=>{expect(mapsDestination(storeLocationSchema.parse({latitude:0,longitude:0}))).toContain("destination=0,0");});
  it("mantiene la ubicación vacía sin inventar dirección",()=>{expect(mapsDestination(storeLocationSchema.parse({}))).toBe(null);});
  it("formatea stock sin ceros falsos y conserva decimales",()=>{expect(notificationMessage("Stock bajo: OSO (9.000 Unidad)")).toBe("Stock bajo: OSO (9 unidades)");expect(notificationMessage("Stock bajo: OSO (1.000 Unidad)")).toContain("1 unidad");expect(notificationMessage("Stock bajo: OSO (9.500 Unidad)")).toContain("9,5 unidades");});
  it("presenta auditoría legible conservando original",()=>{const entry={table_name:"inventory_entries",action:"INSERT",after:{quantity:"100",unit_cost:3},entity_name:"OSO",user_name:"Administrador"};expect(auditPresentation(entry)).toMatchObject({title:"Entrada de inventario: registro",user:"Administrador"});expect(auditPresentation(entry).facts).toContain("OSO");expect(entry.after.quantity).toBe("100");});
  it("rechaza contenido falso y MIME engañoso",async()=>{await expect(optimizeProductImage(Buffer.from("not an image"),"image/png")).rejects.toThrow();const bytes=await sharp({create:{width:10,height:10,channels:3,background:"white"}}).png().toBuffer();await expect(optimizeProductImage(bytes,"image/jpeg")).rejects.toThrow();});
  it("optimiza imagen grande real a WebP dentro de 1600px",async()=>{const input=await sharp({create:{width:3200,height:2400,channels:3,background:"pink"}}).png().toBuffer();const output=await optimizeProductImage(input,"image/png");const meta=await sharp(output).metadata();expect(meta.format).toBe("webp");expect(meta.width).toBe(1600);expect(meta.height).toBe(1200);expect(meta.exif).toBeUndefined();});
});
