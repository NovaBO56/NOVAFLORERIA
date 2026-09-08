
import { z } from "zod";

export const systemSettingSchema = z.object({
  key: z.string().trim().min(1),
  value: z.unknown(),
  is_critical: z.boolean().default(false),
});

export const updateSystemSettingSchema = z.object({
  value: z.unknown(),
});

export type SystemSetting = z.infer<typeof systemSettingSchema>;
export type UpdateSystemSettingInput = z.infer<
  typeof updateSystemSettingSchema
>;
