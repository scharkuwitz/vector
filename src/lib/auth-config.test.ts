import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { openDatabase, type Db } from "../db/open";
import { account, session, user } from "../db/schema";
import { createAuth } from "./auth-config";

const baseURL = "http://localhost:3000";
const password = "test-password-123";
let db: Db;
let auth: ReturnType<typeof createAuth>;
let address = 0;

beforeEach(() => {
  db = openDatabase(":memory:");
  auth = createAuth(db, { baseURL, secret: "e2b7dc06983da647f1b590ca375e206db16c908c71d1322db64b329be72841a9" });
  address++;
});
afterEach(() => db.$client.close());

function request(path: string, body?: unknown, cookie?: string, origin = baseURL) {
  return auth.handler(new Request(`${baseURL}/api/auth/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `192.0.2.${address}`,
      origin,
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
}

async function signup() {
  const response = await request("sign-up/email", { name: " Эзэн ", email: "Owner@Example.com", password });
  expect(response.status).toBe(200);
  const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  return { response, cookie };
}

describe("email/password authentication against SQLite", () => {
  it("registers, normalizes identity, hashes passwords, and persists a seven-day session", async () => {
    const { response, cookie } = await signup();
    const body = await response.json();
    expect(body.user).toMatchObject({ email: "owner@example.com", name: "Эзэн" });
    const stored = db.select().from(account).get();
    expect(stored?.password).toBeTruthy();
    expect(stored?.password).not.toBe(password);
    expect(JSON.stringify(body)).not.toContain(stored?.password);
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(response.headers.get("set-cookie")).toMatch(/SameSite=Lax/i);
    const saved = db.select().from(session).get()!;
    expect(saved.expiresAt.getTime() - saved.createdAt.getTime()).toBeCloseTo(7 * 86400_000, -3);
    const current = await request("get-session", undefined, cookie);
    expect((await current.json()).user.id).toBe(body.user.id);
  });

  it("rejects duplicate emails regardless of case", async () => {
    await signup();
    const response = await request("sign-up/email", { name: "Other", email: "OWNER@example.com", password });
    expect(response.status).toBe(422);
    expect(db.select().from(user).all()).toHaveLength(1);
  });

  it("validates names, emails, and password bounds on the server", async () => {
    for (const fields of [
      { name: " ", email: "a@example.com", password },
      { name: "Owner", email: "invalid", password },
      { name: "Owner", email: "a@example.com", password: "short" },
      { name: "Owner", email: "a@example.com", password: "x".repeat(129) },
    ]) {
      const response = await request("sign-up/email", fields);
      expect(response.ok).toBe(false);
    }
    expect(db.select().from(user).all()).toHaveLength(0);
  });

  it("logs in with a fresh session and gives a generic error for incorrect credentials", async () => {
    await signup();
    for (const email of ["owner@example.com", "missing@example.com"]) {
      const response = await request("sign-in/email", { email, password: "incorrect-password" });
      expect(response.status).toBe(401);
      expect((await response.json()).code).toBe("INVALID_EMAIL_OR_PASSWORD");
    }
    const response = await request("sign-in/email", { email: "OWNER@example.com", password });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeTruthy();
    expect(db.select().from(session).all()).toHaveLength(2);
  });

  it("rejects missing, forged, and expired sessions", async () => {
    expect(await (await request("get-session")).json()).toBeNull();
    expect(await (await request("get-session", undefined, "better-auth.session_token=forged")).json()).toBeNull();
    const { cookie } = await signup();
    db.update(session).set({ expiresAt: new Date(Date.now() - 1000) }).run();
    expect(await (await request("get-session", undefined, cookie)).json()).toBeNull();
  });

  it("revokes the session on logout and rejects replay of its cookie", async () => {
    const { cookie } = await signup();
    const response = await request("sign-out", {}, cookie);
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/Max-Age=0/i);
    expect(db.select().from(session).all()).toHaveLength(0);
    expect(await (await request("get-session", undefined, cookie)).json()).toBeNull();
  });

  it("rejects cross-origin authentication writes", async () => {
    const { cookie } = await signup();
    const response = await request("sign-out", {}, cookie, "https://untrusted.example");
    expect(response.status).toBe(403);
    expect(db.select().from(session).all()).toHaveLength(1);
  });

  it("rate-limits repeated login attempts", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await request("sign-in/email", { email: "nobody@example.com", password })).status).toBe(401);
    }
    const response = await request("sign-in/email", { email: "nobody@example.com", password });
    expect(response.status).toBe(429);
  });

  it("sets secure cookies when served over HTTPS", async () => {
    auth = createAuth(db, { baseURL: "https://vector.example", secret: "e2b7dc06983da647f1b590ca375e206db16c908c71d1322db64b329be72841a9" });
    const response = await auth.handler(new Request("https://vector.example/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://vector.example", "x-forwarded-for": `192.0.2.${address}` },
      body: JSON.stringify({ name: "Owner", email: "secure@example.com", password }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/; Secure/i);
    const owner = db.select().from(user).where(eq(user.email, "secure@example.com")).get();
    expect(owner).toBeTruthy();
  });
});
