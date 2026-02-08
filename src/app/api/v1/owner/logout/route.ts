import { clearSession } from "@/lib/ownerAuth";

export async function POST() {
  await clearSession();
  return Response.json({ message: "Logged out" });
}
