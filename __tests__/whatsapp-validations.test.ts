import { describe, expect, it } from "vitest";
import { updateWhatsappConfigSchema } from "@/validations/whatsapp";

describe("Validaciones de configuración de WhatsApp (Zod real de producción)", () => {
  it("acepta un número válido en formato internacional", () => {
    expect(updateWhatsappConfigSchema.safeParse({ phone_number: "59170011223" }).success).toBe(true);
  });

  it("rechaza un número con espacios", () => {
    expect(updateWhatsappConfigSchema.safeParse({ phone_number: "591 700 11223" }).success).toBe(false);
  });

  it("rechaza un número con el símbolo +", () => {
    expect(updateWhatsappConfigSchema.safeParse({ phone_number: "+59170011223" }).success).toBe(false);
  });

  it("rechaza un número demasiado corto", () => {
    expect(updateWhatsappConfigSchema.safeParse({ phone_number: "123" }).success).toBe(false);
  });

  it("rechaza texto que no es un número", () => {
    expect(updateWhatsappConfigSchema.safeParse({ phone_number: "no-es-numero" }).success).toBe(false);
  });
});