import { z } from "zod";

export const PlatformSchema = z.enum(["ANDROID", "IOS"]);

export const DeviceSchema = z
  .object({
    deviceId: z.string().trim().max(200).optional(),
    platform: PlatformSchema,
    deviceName: z.string().trim().max(200).optional(),
    model: z.string().trim().max(100).optional(),
    operatingSystem: z.string().trim().max(100).optional(),
    operatingSystemVersion: z.string().trim().max(50).optional(),
    appVersion: z.string().trim().max(50).optional(),
  })
  .strict();

export const GoogleLoginSchema = z.object({
  idToken: z.string().trim().min(20),
  device: DeviceSchema,
});

export const GoogleWebLoginSchema = z.object({
  idToken: z.string().trim().min(20),
});

export type GoogleWebLoginSchema = z.infer<typeof GoogleWebLoginSchema>;
export type GoogleLoginSchema = z.infer<typeof GoogleLoginSchema>;
/**
 * ┌──────────────────────────────────────────────┐
 * │               Zod Type Mapping               │
 * ├───────────────────────────┬──────────────────┤
 * │ Thing                     │ TypeScript usage │
 * ├───────────────────────────┼──────────────────┤
 * │ z.object(...)            │ runtime VALUE     │
 * │ z.infer<>                │ TYPE              │
 * └───────────────────────────┴──────────────────┘
 *
 * Note:
 * - z.object(...) is used at runtime for validation
 * - z.infer<> is used only at compile-time for type extraction
 */
