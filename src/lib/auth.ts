import { NextRequest } from "next/server";
import { db } from "./insforge";

export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const apiKey = authHeader.slice(7);
  const { data, error } = await db
    .from("agents")
    .select()
    .eq("api_key", apiKey)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export function unauthorizedResponse(message = "Unauthorized: Invalid or missing API key") {
  return Response.json({ error: message }, { status: 401 });
}
