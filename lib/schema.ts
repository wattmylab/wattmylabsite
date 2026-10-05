import { z } from "zod";
import { categories, sourceTypes, type Device, type Region } from "./types";

// Validates the data files. Used by the data test, which runs before every build,
// so a bad entry fails the build. Not imported by the app itself.

export const DeviceSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    category: z.enum(categories),
    idleW: z.number().nonnegative(),
    loadW: z.number().nonnegative(),
    rackU: z.number().int().positive().optional(),
    sourceType: z.enum(sourceTypes),
    sourceUrl: z.string().url().optional(),
    config: z.string().min(1),
    readings: z
      .array(z.object({ idleW: z.number().nonnegative(), loadW: z.number().nonnegative(), by: z.string().optional() }))
      .optional(),
    lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().optional(),
  })
  .strict()
  .refine((d) => d.loadW >= d.idleW, { message: "loadW must be >= idleW" });

export const RegionSchema = z
  .object({
    code: z.string().length(2),
    name: z.string(),
    currency: z.string().length(3),
    locale: z.string(),
    pricePerKwh: z.number().positive(),
    source: z.string(),
    sourceUrl: z.string().url(),
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

// Compile-time check that the schemas and the hand-written types agree.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const deviceTypesMatch: Same<z.infer<typeof DeviceSchema>, Device> = true;
export const regionTypesMatch: Same<z.infer<typeof RegionSchema>, Region> = true;
