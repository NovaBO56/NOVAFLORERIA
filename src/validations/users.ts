import { z } from "zod";

export const userRoleSchema = z.enum(["administrador", "empleado"]);

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  full_name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  role: userRoleSchema,
});

export const updateUserStatusSchema = z.object({
  is_active: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;