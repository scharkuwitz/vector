import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openDatabase, type Db } from "../db/open";
import { insertActivity, insertPlan, selectActivity, selectPlan } from "../db/repo";
import { deleteActivity, deletePlan, saveActivity, savePlan, setActivityStatus } from "./actions";

const { requireUser, getDb } = vi.hoisted(() => ({ requireUser: vi.fn(), getDb: vi.fn() }));
vi.mock("@/lib/session", () => ({ requireUser }));
vi.mock("@/db/client", () => ({ getDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

let db: Db;
beforeEach(() => {
  vi.clearAllMocks();
  db = openDatabase(":memory:");
  for (const id of ["owner", "other"]) {
    db.$client.prepare("INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, 0, 0)")
      .run(id, id, `${id}@example.com`);
  }
  getDb.mockReturnValue(db);
  requireUser.mockResolvedValue({ id: "owner" });
});
afterEach(() => db.$client.close());

function fields(values: Record<string, string>) {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) form.set(name, value);
  return form;
}

describe("direct Server Action authorization", () => {
  it("rejects every unauthenticated write before database access or validation", async () => {
    requireUser.mockRejectedValue(new Error("redirect:/login"));
    const operations = [
      () => savePlan({}, new FormData()),
      () => deletePlan(new FormData()),
      () => saveActivity({}, new FormData()),
      () => deleteActivity(new FormData()),
      () => setActivityStatus(1, "done"),
    ];
    for (const run of operations) await expect(run()).rejects.toThrow("redirect:/login");
    expect(getDb).not.toHaveBeenCalled();
  });

  it("ignores submitted ownership and blocks another account's IDs", async () => {
    await expect(savePlan({}, fields({ title: "Mine", userId: "other" }))).rejects.toThrow(/redirect:\/plans\//);
    const own = db.$client.prepare("SELECT id, user_id FROM plans").get() as { id: number; user_id: string };
    expect(own.user_id).toBe("owner");
    const otherPlan = insertPlan(db, "other", { title: "Private", description: null });
    const otherActivity = insertActivity(db, "other", {
      title: "Secret", description: null, planId: otherPlan, weight: 10,
      priority: "medium", status: "todo", startDate: "2026-11-01", endDate: "2026-11-02",
    });
    if (!otherActivity.ok) throw new Error("insert failed");
    expect((await savePlan({}, fields({ id: String(otherPlan), title: "Changed" }))).errors?.form).toBeTruthy();
    expect(await setActivityStatus(otherActivity.id, "done")).toBe(false);
    await expect(deleteActivity(fields({ id: String(otherActivity.id) }))).rejects.toThrow("redirect:/");
    await expect(deletePlan(fields({ id: String(otherPlan) }))).rejects.toThrow("redirect:/plans");
    expect(selectPlan(db, "other", otherPlan)?.title).toBe("Private");
    expect(selectActivity(db, "other", otherActivity.id)?.status).toBe("todo");
  });
});
