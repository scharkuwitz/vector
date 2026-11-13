import { parseArgs } from "node:util";
import { assignLegacyOwner } from "../src/db/assign-owner";
import { openDatabase } from "../src/db/open";

try {
  const { values } = parseArgs({ options: { email: { type: "string" } }, strict: true });
  if (!values.email?.trim()) throw new Error("Usage: npm run db:assign-owner -- --email owner@example.com");
  const db = openDatabase();
  try {
    const count = assignLegacyOwner(db, values.email);
    console.log(`Assigned ${count} previously unowned plan(s). Existing ownership was preserved.`);
  } finally {
    db.$client.close();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Owner assignment failed.");
  process.exitCode = 1;
}
