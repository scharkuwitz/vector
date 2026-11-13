"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db/client";
import * as repo from "@/db/repo";
import { parseId } from "@/lib/search-params";
import { formFields, parseActivity, parsePlan, statusSchema, type FieldErrors } from "@/lib/validation";

/*
 * Every write independently authenticates the request and scopes queries to
 * that account, including direct Server Action requests.
 *
 * Reads are never cached (src/lib/data.ts), so revalidating the root layout
 * just makes the router drop pages it already holds and re-render the
 * current one with fresh data in the same response.
 */

export interface FormState {
  errors?: FieldErrors;
}

function refreshAll() {
  revalidatePath("/", "layout");
}

/** Only same-site paths, so a crafted form can't redirect elsewhere. */
function safeReturn(value: string | undefined, fallback: string): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}

// ---- plans -------------------------------------------------------------------

export async function savePlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const fields = formFields(formData);
  const parsed = parsePlan(fields);
  if (!parsed.ok) return { errors: parsed.errors };

  const db = getDb();
  let id = parseId(fields.id);
  if (id !== undefined) {
    if (!repo.updatePlan(db, user.id, id, parsed.data)) return { errors: { form: "Энэ төлөвлөгөө устгагдсан байна." } };
  } else {
    id = repo.insertPlan(db, user.id, parsed.data);
  }
  refreshAll();
  redirect(`/plans/${id}`);
}

export async function deletePlan(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = parseId(formFields(formData).id);
  if (id !== undefined) repo.deletePlan(getDb(), user.id, id);
  refreshAll();
  redirect("/plans");
}

// ---- activities --------------------------------------------------------------

export async function saveActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const fields = formFields(formData);
  const parsed = parseActivity(fields);
  if (!parsed.ok) return { errors: parsed.errors };

  const db = getDb();
  const id = parseId(fields.id);
  const result = id !== undefined ? repo.updateActivity(db, user.id, id, parsed.data) : repo.insertActivity(db, user.id, parsed.data);

  if (!result.ok) {
    switch (result.reason) {
      case "over_weight":
        return {
          errors: {
            weight:
              result.available === 0
                ? "Энэ төлөвлөгөөний 100% аль хэдийн хуваарилагдсан байна."
                : `Энэ төлөвлөгөөнд ${result.available}% л үлдсэн байна.`,
          },
        };
      case "plan_missing":
        return { errors: { planId: "Энэ төлөвлөгөө устгагдсан байна. Өөр төлөвлөгөө сонгоно уу." } };
      case "not_found":
        return { errors: { form: "Энэ ажил устгагдсан байна." } };
    }
  }

  refreshAll();
  redirect(safeReturn(fields.returnTo, `/plans/${parsed.data.planId}`));
}

export async function deleteActivity(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fields = formFields(formData);
  const id = parseId(fields.id);
  if (id !== undefined) repo.deleteActivity(getDb(), user.id, id);
  refreshAll();
  redirect(safeReturn(fields.returnTo, "/"));
}

/** Quick status change from the list. Returns false when nothing was changed. */
export async function setActivityStatus(id: number, status: string): Promise<boolean> {
  const user = await requireUser();
  const parsedStatus = statusSchema.safeParse(status);
  if (!Number.isSafeInteger(id) || id <= 0 || !parsedStatus.success) return false;
  const changed = repo.setActivityStatus(getDb(), user.id, id, parsedStatus.data);
  refreshAll();
  return changed;
}
