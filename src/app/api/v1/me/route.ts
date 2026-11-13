import { getCurrentUser } from "@/server/auth/current-user";
import { fail, ok } from "@/server/http/responses";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in.", 401, noStore);
  return ok(
    {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      themePreference: user.themePreference,
    },
    { headers: noStore },
  );
}
