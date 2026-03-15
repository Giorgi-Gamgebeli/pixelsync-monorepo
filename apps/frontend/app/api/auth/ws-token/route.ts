import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const secureCookie = cookieStore.get("__Secure-authjs.session-token");
  const regularCookie = cookieStore.get("authjs.session-token");
  const cookie = secureCookie || regularCookie;

  if (!cookie) {
    return Response.json({ error: "No session token" }, { status: 401 });
  }

  return Response.json({
    token: cookie.value,
    salt: cookie.name,
  });
}
