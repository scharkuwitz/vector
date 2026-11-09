import { z } from "zod";
import { isValidISODate } from "./dates";
import { DESCRIPTION_MAX, PRIORITIES, STATUSES, TITLE_MAX } from "./types";

/*
 * Input rules for plans and activities, shared by the Server Actions.
 * Messages are user-facing (Mongolian). The database repeats the same rules
 * as CHECK constraints; the 100% weight cap is checked in src/db/repo.ts.
 */

const title = z
  .string({ error: "Нэрээ бичнэ үү." })
  .trim()
  .min(1, "Нэрээ бичнэ үү.")
  .max(TITLE_MAX, `${TITLE_MAX} тэмдэгтээс хэтрэхгүй байх ёстой.`);

/** Optional text: blank becomes null. */
const description = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX, `${DESCRIPTION_MAX} тэмдэгтээс хэтрэхгүй байх ёстой.`)
  .optional()
  .transform((v) => (v ? v : null));

const isoDate = (message: string) =>
  z.string({ error: message }).refine(isValidISODate, message);

export const planSchema = z.object({ title, description });

export const activitySchema = z
  .object({
    title,
    description,
    planId: z.coerce
      .number({ error: "Төлөвлөгөө сонгоно уу." })
      .int("Төлөвлөгөө сонгоно уу.")
      .positive("Төлөвлөгөө сонгоно уу."),
    priority: z.enum(PRIORITIES, { error: "Ач холбогдлоо сонгоно уу." }),
    status: z.enum(STATUSES, { error: "Төлвөө сонгоно уу." }),
    weight: z.coerce
      .number({ error: "1-ээс 100 хүртэлх бүхэл тоо оруулна уу." })
      .int("1-ээс 100 хүртэлх бүхэл тоо оруулна уу.")
      .min(1, "1-ээс 100 хүртэлх бүхэл тоо оруулна уу.")
      .max(100, "1-ээс 100 хүртэлх бүхэл тоо оруулна уу."),
    startDate: isoDate("Эхлэх огноогоо оруулна уу."),
    endDate: isoDate("Дуусах огноогоо оруулна уу."),
  })
  .refine((a) => a.endDate >= a.startDate, {
    path: ["endDate"],
    message: "Дуусах огноо эхлэх огнооноос өмнө байж болохгүй.",
  });

export type PlanInput = z.output<typeof planSchema>;
export type ActivityInput = z.output<typeof activitySchema>;

export const statusSchema = z.enum(STATUSES);

export type FieldErrors<K extends string = string> = Partial<Record<K | "form", string>>;

export type Parsed<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors<Extract<keyof T, string>> };

/** FormData -> plain object of its string fields (files are ignored). */
export function formFields(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !(k in out)) out[k] = v;
  return out;
}

function parseWith<S extends z.ZodType>(schema: S, input: unknown): Parsed<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form";
    errors[key] ??= issue.message;
  }
  return { ok: false, errors: errors as FieldErrors<Extract<keyof z.output<S>, string>> };
}

export function parsePlan(input: unknown): Parsed<PlanInput> {
  return parseWith(planSchema, input);
}

export function parseActivity(input: unknown): Parsed<ActivityInput> {
  return parseWith(activitySchema, input);
}
