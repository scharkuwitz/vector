import { betterAuth } from "better-auth/minimal";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { Db } from "../db/open";
import * as schema from "../db/schema";

/** Separate from the lazy server singleton so tests use a disposable database. */
export function createAuth(db: Db, options: { secret: string; baseURL: string }) {
  return betterAuth({
    appName: "Вектор",
    secret: options.secret,
    baseURL: options.baseURL,
    trustedOrigins: [new URL(options.baseURL).origin],
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "memory",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      useSecureCookies: new URL(options.baseURL).protocol === "https:",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const name = user.name.trim();
            if (!name || name.length > 100) {
              throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Нэрээ зөв оруулна уу." });
            }
            return { data: { ...user, name, email: user.email.trim().toLowerCase() } };
          },
        },
      },
    },
  });
}
