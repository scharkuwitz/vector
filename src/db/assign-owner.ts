import { eq, isNull } from "drizzle-orm";
import type { Db } from "./open";
import { plans, user } from "./schema";

/** Local administration only: public signup never claims legacy data. */
export function assignLegacyOwner(db: Db, email: string): number {
  return db.transaction((tx) => {
    const owner = tx.select({ id: user.id }).from(user).where(eq(user.email, email.trim().toLowerCase())).get();
    if (!owner) throw new Error("Account not found. Register the intended owner before assigning data.");
    return tx.update(plans).set({ userId: owner.id }).where(isNull(plans.userId)).run().changes;
  }, { behavior: "immediate" });
}
