import "server-only";
import { requireUser } from "./session";
import { getDb } from "@/db/client";
import { selectActivities, selectActivity, selectPlan, selectPlans } from "@/db/repo";
import { todayISO } from "./dates";
import { compareActivities, comparePlans, summarizePlan } from "./plan-stats";
import type { Activity, ActivityFilter, ISODate, PlanSummary } from "./types";

/*
 * The only module pages read data from (the SQLite database, via src/db/repo.ts).
 *
 * Every function requires a request-time session, so it runs per request, not at build
 * time. Cache Components would otherwise prerender these synchronous
 * better-sqlite3 reads into static HTML. Callers render inside <Suspense>.
 */

/** Today's date on the server clock. */
export async function getToday(): Promise<ISODate> {
  await requireUser();
  return todayISO();
}

export async function listPlans(): Promise<PlanSummary[]> {
  const user = await requireUser();
  const db = getDb();
  const all = selectActivities(db, user.id);
  return selectPlans(db, user.id)
    .map((p) => summarizePlan(p, all))
    .sort(comparePlans);
}

export async function getPlan(id: number): Promise<PlanSummary | null> {
  const user = await requireUser();
  const db = getDb();
  const plan = selectPlan(db, user.id, id);
  return plan ? summarizePlan(plan, selectActivities(db, user.id, { planId: id })) : null;
}

export async function listActivities(filter: ActivityFilter = {}): Promise<Activity[]> {
  const user = await requireUser();
  return selectActivities(getDb(), user.id, filter).sort(compareActivities);
}

export async function getActivity(id: number): Promise<Activity | null> {
  const user = await requireUser();
  return selectActivity(getDb(), user.id, id);
}
