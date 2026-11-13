import { getAuth } from "@/lib/auth";

// Keep initialization inside the handler: builds must not open the database.
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
