import { cpSync } from "node:fs";

// Exercise the same standalone output and migration layout as the Docker image.
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
cpSync("drizzle", ".next/standalone/drizzle", { recursive: true });
await import("../.next/standalone/server.js");
