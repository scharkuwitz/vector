import "server-only";
import { getDb } from "@/db/client";
import { createAuth } from "./auth-config";

let auth: ReturnType<typeof createAuth> | undefined;

/** No database or secret access during module import or static builds. */
export function getAuth() {
  if (!auth) {
    const secret = process.env.BETTER_AUTH_SECRET;
    const baseURL = process.env.BETTER_AUTH_URL;
    if (!secret || secret.length < 32) {
      throw new Error("Set BETTER_AUTH_SECRET to a random value of at least 32 characters.");
    }
    if (!baseURL) throw new Error("Set BETTER_AUTH_URL to the application's public URL.");
    auth = createAuth(getDb(), { secret, baseURL });
  }
  return auth;
}
